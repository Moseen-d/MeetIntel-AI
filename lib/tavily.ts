import { RetrievedSource } from "./types";

export interface TavilySearchParams {
  query: string;
  topic?: "news" | "general";
  days?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  startDatetime?: Date;
  endDatetime?: Date;
  maxResults?: number;
  includeRawContent?: boolean;
}

interface TavilyRawResult {
  title?: string;
  url: string;
  content?: string;
  raw_content?: string;
  score?: number;
  published_date?: string;
}

interface TavilySearchResponse {
  query?: string;
  results?: TavilyRawResult[];
  error?: string;
}

/**
 * Executes a single Tavily search query targeting the calculated 30-day research window.
 */
export async function searchTavily(
  params: TavilySearchParams,
  apiKey?: string
): Promise<RetrievedSource[]> {
  const key = apiKey || process.env.TAVILY_API_KEY;
  if (!key) {
    throw new Error("TAVILY_API_KEY is not configured.");
  }

  // Determine date bounds
  const endDt = params.endDatetime || new Date();
  const startDt = params.startDatetime || new Date(endDt.getTime() - (params.days || 30) * 24 * 60 * 60 * 1000);
  const startDateStr = params.startDate || startDt.toISOString().split("T")[0];
  const endDateStr = params.endDate || endDt.toISOString().split("T")[0];

  // If meeting is >30 days in future, no news can exist in that window yet
  if (startDt.getTime() > endDt.getTime()) {
    return [];
  }

  // Respect Tavily constraint: don't mix days/time_range with start_date/end_date
  const payload: Record<string, any> = {
    api_key: key,
    query: params.query,
    topic: params.topic || "news",
    max_results: params.maxResults || 5,
    search_depth: "basic",
    include_raw_content: params.includeRawContent ?? false,
  };

  if (startDateStr && endDateStr && startDateStr <= endDateStr) {
    payload.start_date = startDateStr;
    payload.end_date = endDateStr;
  } else {
    payload.days = params.days || 30;
    payload.time_range = "month";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    let res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    // If date parameters fail on Tavily for any reason, retry with fallback
    if (!res.ok && (payload.start_date || payload.end_date)) {
      const fallbackPayload = {
        api_key: key,
        query: params.query,
        topic: params.topic || "news",
        days: params.days || 30,
        max_results: params.maxResults || 5,
        search_depth: "basic",
        include_raw_content: params.includeRawContent ?? false,
      };
      res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallbackPayload),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) {
        throw new Error(`Tavily authentication failed: ${res.statusText}`);
      }
      if (res.status === 429) {
        throw new Error("Tavily rate limit exceeded. Please try again shortly.");
      }
      throw new Error(`Tavily API error (${res.status}): ${errText || res.statusText}`);
    }

    const data: TavilySearchResponse = await res.json();
    const rawResults = data.results || [];

    // Calendar day boundaries for validation
    const startBoundary = new Date(startDt);
    startBoundary.setUTCHours(0, 0, 0, 0);
    const endBoundary = new Date(endDt);
    endBoundary.setUTCHours(23, 59, 59, 999);

    const validResults: RetrievedSource[] = [];

    for (const r of rawResults) {
      if (!r.url) continue;

      let isValidDate = true;
      let displayDate = "Undated";
      let isDated = false;

      if (r.published_date && r.published_date.trim()) {
        const pubTime = new Date(r.published_date).getTime();
        if (!isNaN(pubTime)) {
          if (pubTime < startBoundary.getTime() || pubTime > endBoundary.getTime()) {
            // Exclude source outside required research window (Req 5)
            isValidDate = false;
          } else {
            displayDate = new Date(pubTime).toISOString().split("T")[0];
            isDated = true;
          }
        }
      }

      if (isValidDate) {
        validResults.push({
          id: 0, // Assigned after deduplication
          title: (r.title || "Untitled Article").trim(),
          url: r.url.trim(),
          snippet: (r.content || "").trim(),
          rawContent: r.raw_content ? r.raw_content.slice(0, 3000) : undefined,
          publishedDate: displayDate, // 'YYYY-MM-DD' or 'Undated' (Req 7)
          isDated,
          score: r.score,
        });
      }
    }

    return validResults;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Search request timed out for query: "${params.query}"`);
    }
    throw error;
  }
}

/**
 * Runs multiple search queries in parallel, deduplicates by URL,
 * and assigns sequential 1-based source IDs for clean citations.
 */
export async function searchAllQueriesInParallel(
  queries: { query: string; topic?: "news" | "general" }[],
  options?: {
    startDate?: string;
    endDate?: string;
    startDatetime?: Date;
    endDatetime?: Date;
    apiKey?: string;
  }
): Promise<RetrievedSource[]> {
  const promises = queries.map((q) =>
    searchTavily(
      {
        query: q.query,
        topic: q.topic || "news",
        startDate: options?.startDate,
        endDate: options?.endDate,
        startDatetime: options?.startDatetime,
        endDatetime: options?.endDatetime,
        maxResults: 5,
      },
      options?.apiKey
    ).catch((err) => {
      console.warn(`[Tavily] Query failed: "${q.query}"`, err.message);
      return [] as RetrievedSource[];
    })
  );

  const resultsNested = await Promise.all(promises);
  const flattened = resultsNested.flat();

  // Deduplicate by normalized URL (preferring dated over undated)
  const seenUrls = new Map<string, RetrievedSource>();

  for (const item of flattened) {
    let normalized = item.url;
    try {
      const parsed = new URL(item.url);
      normalized = `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`.toLowerCase();
    } catch {
      normalized = item.url.toLowerCase();
    }

    if (seenUrls.has(normalized)) {
      const existing = seenUrls.get(normalized)!;
      if (!existing.isDated && item.isDated) {
        seenUrls.set(normalized, item);
      }
    } else {
      seenUrls.set(normalized, item);
    }
  }

  const deduplicated = Array.from(seenUrls.values());

  // Sort by score if available and assign 1-based IDs
  deduplicated.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return deduplicated.map((source, index) => ({
    ...source,
    id: index + 1,
  }));
}

/**
 * Tavily URL Content Extraction (optional deep dive for high-priority URLs)
 */
export async function extractTavilyContent(
  urls: string[],
  apiKey?: string
): Promise<Record<string, string>> {
  const key = apiKey || process.env.TAVILY_API_KEY;
  if (!key || urls.length === 0) return {};

  try {
    const res = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, urls: urls.slice(0, 5) }),
    });

    if (!res.ok) return {};
    const data = await res.json();
    const map: Record<string, string> = {};
    if (data.results && Array.isArray(data.results)) {
      for (const item of data.results) {
        if (item.url && item.raw_content) {
          map[item.url] = item.raw_content.slice(0, 4000);
        }
      }
    }
    return map;
  } catch (err) {
    console.warn("[Tavily] Extract failed:", err);
    return {};
  }
}
