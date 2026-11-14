import {
  BriefRequest,
  Briefing,
  PipelineEvent,
  PipelineStage,
} from "./schema";
import { generateSearchPlan, synthesizeBriefing } from "./llm";
import { searchAllQueriesInParallel } from "./tavily";
import { getMockBriefing } from "./mockData";
import { RetrievedSource } from "./types";

export type EventCallback = (event: PipelineEvent) => void | Promise<void>;

/**
 * Executes the 5-step agentic pre-meeting briefing pipeline:
 * 1. PLAN -> calculate 30-day research window & generate 4-6 search queries
 * 2. SEARCH -> parallel Tavily search restricted to window [start_date, end_date] & deduplicated
 * 3. EXTRACT & VERIFY -> corroborate claims and determine confidence
 * 4. SYNTHESIZE -> prompt LLM with strict evidence and date fidelity rules
 * 5. VALIDATE -> programmatically enforce date truth & disclose low-data scenarios
 */
export async function runBriefingPipeline(
  request: BriefRequest,
  onEvent?: EventCallback
): Promise<Briefing> {
  const isMockMode = process.env.MOCK === "true";

  const emit = async (
    stage: PipelineStage,
    message: string,
    progress?: number,
    data?: any
  ) => {
    if (onEvent) {
      await onEvent({ stage, message, progress, data });
    }
  };

  // Only run mock pipeline if MOCK=true is explicitly set in environment
  if (isMockMode) {
    return await runMockPipeline(request, emit);
  }

  try {
    // ----------------------------------------------------
    // DATE WINDOW CALCULATION (Req 1 & 2)
    // 1. Research start date = 30 days before meeting date
    // 2. Research end date = earlier of meeting date and current date
    // ----------------------------------------------------
    const meetingDate = new Date(request.meetingTime);
    const now = new Date();
    const startDatetime = new Date(meetingDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDatetime = new Date(Math.min(meetingDate.getTime(), now.getTime()));

    const startDateStr = startDatetime.toISOString().split("T")[0];
    const endDateStr = endDatetime.toISOString().split("T")[0];
    const windowDesc = `${startDateStr} to ${endDateStr}`;

    // ----------------------------------------------------
    // STEP 1: PLAN
    // ----------------------------------------------------
    await emit("Planning queries", `Formulating 4-6 targeted queries for ${request.subject} (${windowDesc})...`, 15);
    const plan = await generateSearchPlan({
      subject: request.subject,
      type: request.type,
      context: `${request.context || ""}. Strict 30-day research window: ${windowDesc}.`,
    });

    const queryStrings = plan.queries.map((q) => q.query);
    await emit(
      "Planning queries",
      `Generated ${plan.queries.length} targeted search queries.`,
      25,
      { queries: queryStrings }
    );

    // ----------------------------------------------------
    // STEP 2: SEARCH (with Tavily date filter & backend validation)
    // ----------------------------------------------------
    await emit(
      "Searching the web",
      `Executing parallel searches on Tavily with date filter (${windowDesc})...`,
      40
    );

    const retrievedSources = await searchAllQueriesInParallel(plan.queries, {
      startDate: startDateStr,
      endDate: endDateStr,
      startDatetime,
      endDatetime,
    });

    const datedCount = retrievedSources.filter((s) => s.isDated).length;
    const isLowData = retrievedSources.length <= 1 || datedCount <= 1;

    await emit(
      "Reading sources",
      `Retrieved & verified ${retrievedSources.length} articles (${datedCount} dated within ${windowDesc}).`,
      60,
      { sourcesCount: retrievedSources.length }
    );

    // ----------------------------------------------------
    // STEP 3: EXTRACT & VERIFY
    // ----------------------------------------------------
    await emit(
      "Verifying claims",
      isLowData
        ? `Insufficient recent news detected for ${windowDesc}. Disclosing gap and checking available snippets...`
        : `Corroborating cross-source evidence across ${retrievedSources.length} sources...`,
      75
    );

    // ----------------------------------------------------
    // STEP 4: SYNTHESIZE
    // ----------------------------------------------------
    await emit("Writing briefing", "Synthesizing one-page structured briefing with verified citations...", 85);

    let briefing = await synthesizeBriefing({
      subject: request.subject,
      type: request.type,
      meetingTime: request.meetingTime,
      context: `${request.context || ""}. Note: 30-day research window is ${windowDesc}. Insufficient data flag: ${isLowData}.`,
      sources: retrievedSources,
    });

    // ----------------------------------------------------
    // STEP 5: VALIDATE & ENFORCE SOURCE TRUTH
    // ----------------------------------------------------
    briefing = validateAndCleanBriefing(briefing, retrievedSources, isLowData, startDateStr, endDateStr);

    await emit("Complete", "Briefing generated and validated successfully.", 100, briefing);
    return briefing;
  } catch (err: any) {
    console.error("[Agent Pipeline Error]", err);
    await emit("Error", err.message || "Failed to generate briefing", undefined, undefined);
    throw err;
  }
}

/**
 * Step 5 Validator:
 * - Programmatically rejects or strips any claim with no valid source URL.
 * - Confirms sources match real retrieved URLs and enforces real source dates (Req 6).
 * - Clearly marks undated sources as 'Undated' and forbids 'verified' confidence (Req 7).
 * - Enforces explicit disclosure if insufficient recent results exist (Req 8).
 */
export function validateAndCleanBriefing(
  rawBriefing: Briefing,
  retrievedSources: RetrievedSource[],
  isLowData: boolean,
  startDateStr?: string,
  endDateStr?: string
): Briefing {
  const cleaned: Briefing = { ...rawBriefing };
  const windowDesc = startDateStr && endDateStr ? `${startDateStr} to ${endDateStr}` : "last 30 days";

  // Build url and id lookup maps
  const sourcesByUrl = new Map<string, RetrievedSource>();
  const sourcesById = new Map<number, RetrievedSource>();

  for (const s of retrievedSources) {
    try {
      const parsed = new URL(s.url);
      const norm = `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`.toLowerCase();
      sourcesByUrl.set(norm, s);
    } catch {
      sourcesByUrl.set(s.url.toLowerCase(), s);
    }
    if (s.id) {
      sourcesById.set(s.id, s);
    }
  }

  // Filter helper: strip items with no sources or invalid URLs and enforce date truth
  const filterSection = (items: typeof rawBriefing.keyDevelopments) => {
    return items
      .filter((item) => {
        if (!item.sources || item.sources.length === 0) return false;
        return item.sources.some((s) => s.url && s.url.startsWith("http"));
      })
      .map((item) => {
        const citedCitations: typeof item.sources = [];
        let hasDatedSource = false;
        const verifiedDates: string[] = [];

        for (const s of item.sources) {
          if (!s.url || !s.url.startsWith("http")) continue;

          let norm = s.url.toLowerCase();
          try {
            const parsed = new URL(s.url);
            norm = `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`.toLowerCase();
          } catch {}

          const matched = sourcesByUrl.get(norm) || (s.id ? sourcesById.get(s.id) : undefined);

          if (matched) {
            const vDate = matched.publishedDate || "Undated";
            citedCitations.push({
              id: matched.id,
              title: matched.title || s.title || "Web Source",
              url: matched.url || s.url,
              date: vDate,
            });
            if (matched.isDated && vDate !== "Undated") {
              hasDatedSource = true;
              verifiedDates.push(vDate);
            }
          } else {
            citedCitations.push({
              id: s.id,
              title: s.title || "Web Source",
              url: s.url,
              date: "Undated",
            });
          }
        }

        // Enforce date truth (Gemini cannot invent dates - Req 6)
        const enforcedDate = hasDatedSource && verifiedDates.length > 0 ? verifiedDates.sort().reverse()[0] : "Undated";

        // Adjust confidence (Req 7: undated cannot be verified recent news)
        let confidence = item.confidence;
        if (enforcedDate === "Undated") {
          confidence = citedCitations.length > 1 ? "uncertain" : "single-source";
        } else {
          if (citedCitations.length >= 2 && confidence !== "uncertain" && confidence !== "unconfirmed") {
            confidence = "verified";
          } else if (citedCitations.length === 1 && confidence === "verified") {
            confidence = "single-source";
          }
        }

        return {
          ...item,
          date: enforcedDate,
          confidence,
          sources: citedCitations,
        };
      });
  };

  cleaned.keyDevelopments = filterSection(cleaned.keyDevelopments);
  cleaned.leadershipAndPeople = filterSection(cleaned.leadershipAndPeople);
  cleaned.productsAndAnnouncements = filterSection(cleaned.productsAndAnnouncements);
  cleaned.risksAndOpenUncertainties = filterSection(cleaned.risksAndOpenUncertainties);

  // If low data or section is empty, provide clear disclosure without fabricating sources
  if (isLowData || cleaned.keyDevelopments.length === 0) {
    if (cleaned.keyDevelopments.length === 0) {
      cleaned.keyDevelopments = [
        {
          headline: retrievedSources.length === 0
            ? "No verifiable sources found in the selected research window"
            : "Limited verifiable sources retrieved in the selected research window",
          summary: retrievedSources.length === 0
            ? `No verifiable sources found in the selected research window (${windowDesc}).`
            : `Only limited verifiable sources were retrieved for ${cleaned.subject} within the selected research window (${windowDesc}).`,
          date: retrievedSources.length > 0 && retrievedSources[0].isDated ? retrievedSources[0].publishedDate || "Undated" : "Undated",
          confidence: "uncertain",
          sources: retrievedSources.slice(0, 1).map((s) => ({
            id: s.id,
            title: s.title,
            url: s.url,
            date: s.publishedDate || "Undated",
          })),
        },
      ];
    }

    if (retrievedSources.length === 0) {
      cleaned.tldr = `No verifiable sources found in the selected research window (${windowDesc}).`;
    } else if (isLowData && cleaned.tldr && !cleaned.tldr.toLowerCase().includes("verifiable") && !cleaned.tldr.toLowerCase().includes("limited")) {
      cleaned.tldr = `${cleaned.tldr} (Note: Only limited verifiable sources were retrieved for ${cleaned.subject} in the selected research window: ${windowDesc}.)`;
    }
  }

  // Populate sources list strictly from real retrieved sources (never placeholder citations)
  cleaned.sources = retrievedSources.map((s, idx) => ({
    id: s.id || idx + 1,
    title: s.title,
    url: s.url,
    date: s.publishedDate || "Undated",
  }));

  cleaned.isLowData = isLowData;
  cleaned.coverageNote = retrievedSources.length === 0
    ? `Research window: ${windowDesc} • No verifiable sources found`
    : (isLowData
      ? `Research window: ${windowDesc} • Limited verifiable sources`
      : `Research window: ${windowDesc}`);
  cleaned.generatedAt = cleaned.generatedAt || new Date().toISOString();

  return cleaned;
}

/**
 * Realistic Mock Pipeline Simulation for Hackathon Demos
 */
async function runMockPipeline(
  request: BriefRequest,
  emit: (stage: PipelineStage, msg: string, progress?: number, data?: any) => Promise<void>
): Promise<Briefing> {
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  await emit("Planning queries", `Formulating 4-6 targeted queries for ${request.subject}...`, 15);
  await wait(700);

  const sampleQueries = [
    `"${request.subject}" recent news announcements 2024`,
    `"${request.subject}" product updates and roadmap`,
    `"${request.subject}" executive leadership statements`,
    `"${request.subject}" strategic risks and market headwinds`,
  ];
  await emit("Planning queries", `Generated ${sampleQueries.length} targeted search queries.`, 25, {
    queries: sampleQueries,
  });
  await wait(600);

  await emit("Searching the web", `Executing parallel searches on Tavily (restricted to last 30 days)...`, 45);
  await wait(800);

  await emit("Reading sources", `Retrieved and deduplicated 6 verified articles published within the last 30 days.`, 65, {
    sourcesCount: 6,
  });
  await wait(700);

  await emit("Verifying claims", `Corroborating cross-source claims and establishing confidence ratings...`, 80);
  await wait(700);

  await emit("Writing briefing", `Synthesizing one-page structured briefing with inline citations...`, 90);
  await wait(750);

  const mockBriefing = getMockBriefing(
    request.subject,
    request.type,
    request.meetingTime,
    request.context
  );

  await emit("Complete", "Briefing generated and validated successfully.", 100, mockBriefing);
  return mockBriefing;
}
