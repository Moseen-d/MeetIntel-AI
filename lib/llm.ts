import OpenAI from "openai";
import {
  Briefing,
  BriefingSchema,
  SearchQueries,
  SearchQueriesSchema,
} from "./schema";
import { RetrievedSource } from "./types";

/**
 * Initializes the OpenAI client configured to route through Bifrost (or direct OpenAI).
 * BIFROST_URL env var sets the baseURL so any OpenAI-compatible gateway works seamlessly.
 */
export function getLLMClient(): OpenAI {
  const baseURL = process.env.BIFROST_URL?.trim();
  const apiKey =
    process.env.BIFROST_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "bifrost-key-not-set";

  return new OpenAI({
    baseURL: baseURL && baseURL.length > 0 ? baseURL : undefined,
    apiKey: apiKey,
    timeout: 30000, // 30s timeout
  });
}

export function getLLMModel(): string {
  return process.env.LLM_MODEL?.trim() || "gpt-4o-mini";
}

/**
 * STEP 1: PLAN
 * Generates 4-6 targeted search queries for the subject over the last 30 days.
 */
export async function generateSearchPlan(params: {
  subject: string;
  type: "company" | "person";
  context?: string;
}): Promise<SearchQueries> {
  const client = getLLMClient();
  const model = getLLMModel();

  const isCompany = params.type === "company";
  const instructions = isCompany
    ? `You are preparing research queries for a company meeting.
Generate 4-6 highly specific, high-yield web search queries restricted to the LAST 30 DAYS (recent news, funding/financials, product launches, leadership/hiring changes, partnerships, controversies/risks).
Context: ${params.context || "General briefing"}`
    : `You are preparing research queries for a meeting with a person.
Generate 4-6 highly specific, high-yield web search queries restricted to the LAST 30 DAYS (role changes, recent interviews, talks, publications, executive statements, company news related to them).
Context: ${params.context || "General briefing"}`;

  const prompt = `Subject: "${params.subject}" (Type: ${params.type})
${instructions}

Return valid JSON strictly matching this structure:
{
  "queries": [
    { "query": "${params.subject} latest announcements news", "intent": "Recent major headlines", "topic": "news" },
    { "query": "${params.subject} product updates launch", "intent": "Product announcements", "topic": "news" },
    ...
  ]
}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a strategic search research assistant. Generate 4-6 focused, modern search queries. Output strict JSON only.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const rawText = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(rawText);
    return SearchQueriesSchema.parse(parsed);
  } catch (err: any) {
    console.warn("[LLM Plan] Fallback query generation used due to parse error:", err.message);
    // Safe deterministic fallback queries if JSON parse failed
    return generateFallbackQueries(params.subject, params.type);
  }
}

/**
 * STEP 4: SYNTHESIZE
 * Synthesizes the one-page source-backed briefing strictly from the retrieved evidence.
 * Retries once if JSON validation fails.
 */
export async function synthesizeBriefing(params: {
  subject: string;
  type: "company" | "person";
  meetingTime: string;
  context?: string;
  sources: RetrievedSource[];
}): Promise<Briefing> {
  const client = getLLMClient();
  const model = getLLMModel();

  const systemPrompt = `You are a meticulous meeting-prep analyst. Use ONLY the provided search evidence. Never add facts from memory. Every claim must cite one or more source IDs from the evidence. If evidence is thin, conflicting, or from a single source, flag it with the appropriate confidence level. Prefer concrete facts (dates, numbers, names) over vague language. Be concise: the whole briefing must fit on one page. Open questions should be specific, insightful, and tied to the recent developments, not generic. Return valid JSON only.`;

  // Format evidence into a clean, numbered index
  const evidenceText = params.sources.length > 0
    ? params.sources
        .map(
          (s) =>
            `[Source #${s.id}]
Title: ${s.title}
URL: ${s.url}
Published Date: ${s.publishedDate || "Recent (last 30 days)"}
Snippet: ${s.snippet}
${s.rawContent ? `Details: ${s.rawContent.slice(0, 500)}` : ""}`
        )
        .join("\n\n")
    : "No recent news or evidence was found in the last 30 days.";

  const userPrompt = `SUBJECT: ${params.subject}
MEETING TYPE: ${params.type}
SCHEDULED MEETING TIME: ${params.meetingTime}
ADDITIONAL CONTEXT: ${params.context || "None provided"}

RETRIEVED EVIDENCE (Last 30 Days):
${evidenceText}

TASK:
Produce a one-page pre-meeting briefing in valid JSON.
Requirements:
1. Every claim in keyDevelopments, leadershipAndPeople, productsAndAnnouncements, and risksAndOpenUncertainties MUST reference at least one source from the evidence with its title and url.
2. In the summary text, place superscript citation brackets like "[1]" or "[1, 2]" corresponding to the source IDs.
3. Confidence level must be:
   - "verified" if 2+ independent sources corroborate the claim.
   - "single-source" if only 1 source reports it.
   - "uncertain" (or "unconfirmed") if evidence is thin, speculative, rumor, or conflicting.
4. If there are no developments for a section or overall, state: "No significant developments found in the last 30 days" instead of fabricating.
5. Provide 3-4 impactful talking points and 3-4 sharp, non-generic open questions for the meeting.

JSON Schema format:
{
  "subject": "${params.subject}",
  "meetingTime": "${params.meetingTime}",
  "tldr": "2-3 sentence executive summary of the last 30 days.",
  "keyDevelopments": [
    {
      "headline": "...",
      "summary": "Summary with citation [1]...",
      "date": "YYYY-MM-DD",
      "confidence": "verified" | "single-source" | "uncertain",
      "sources": [{ "title": "...", "url": "..." }]
    }
  ],
  "leadershipAndPeople": [ ...same shape ],
  "productsAndAnnouncements": [ ...same shape ],
  "risksAndOpenUncertainties": [ ...same shape ],
  "talkingPoints": [ "..." ],
  "openQuestions": [ "..." ],
  "sources": [
    { "id": 1, "title": "...", "url": "...", "date": "..." }
  ]
}`;

  let attempts = 0;
  let lastError = "";
  let messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  while (attempts < 2) {
    attempts++;
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.1, // low temperature for factual precision
      });

      const raw = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);

      // Validate with Zod
      const validated = BriefingSchema.parse({
        ...parsed,
        subject: params.subject,
        meetingTime: params.meetingTime,
        generatedAt: new Date().toISOString(),
      });

      return validated;
    } catch (err: any) {
      console.warn(`[LLM Synthesize] Attempt ${attempts} failed:`, err.message);
      lastError = err.message;
      if (attempts === 1) {
        // Retry with error correction prompt
        messages.push({
          role: "assistant",
          content: "{}",
        });
        messages.push({
          role: "user",
          content: `Your previous response had a schema or parsing error: ${err.message}. Please strictly regenerate the valid JSON according to the required schema, ensuring all items have source URLs and valid structure.`,
        });
      }
    }
  }

  throw new Error(`LLM synthesis failed after 2 attempts. Last error: ${lastError}`);
}

function generateFallbackQueries(subject: string, type: "company" | "person"): SearchQueries {
  if (type === "person") {
    return {
      queries: [
        { query: `"${subject}" recent news interview 2024`, intent: "Recent news and interviews", topic: "news" },
        { query: `"${subject}" conference talk speech keynote`, intent: "Public talks and speeches", topic: "news" },
        { query: `"${subject}" executive role appointment career`, intent: "Leadership changes", topic: "general" },
        { query: `"${subject}" statements strategy announcements`, intent: "Strategic vision", topic: "news" },
      ],
    };
  }

  return {
    queries: [
      { query: `"${subject}" latest news announcements`, intent: "Recent major headlines", topic: "news" },
      { query: `"${subject}" product launch feature release`, intent: "Product developments", topic: "news" },
      { query: `"${subject}" funding earnings financials revenue`, intent: "Financials and growth", topic: "news" },
      { query: `"${subject}" executive leadership hire partnership`, intent: "Leadership and alliances", topic: "general" },
      { query: `"${subject}" controversy challenge risk competitors`, intent: "Risks and market headwinds", topic: "news" },
    ],
  };
}
