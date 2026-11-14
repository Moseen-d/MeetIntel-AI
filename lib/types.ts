export * from "./schema";

export interface RetrievedSource {
  id: number;
  title: string;
  url: string;
  snippet: string;
  rawContent?: string;
  publishedDate?: string;
  isDated?: boolean;
  score?: number;
}

export interface ExtractedClaim {
  claim: string;
  headline?: string;
  sourceUrl: string;
  sourceTitle: string;
  publishedDate?: string;
  confidence: "verified" | "single-source" | "uncertain" | "unconfirmed";
  corroboratingSources?: { title: string; url: string }[];
}
