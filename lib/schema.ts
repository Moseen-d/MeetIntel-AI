import { z } from "zod";

export const BriefRequestSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100),
  type: z.enum(["company", "person"]),
  meetingTime: z.string().min(1, "Meeting time is required"),
  context: z.string().max(500).optional().default(""),
  purpose: z.string().max(200).optional().default(""),
});

export type BriefRequest = z.infer<typeof BriefRequestSchema>;

export const ConfidenceLevelSchema = z.enum([
  "verified",
  "single-source",
  "uncertain",
  "unconfirmed",
]);

export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const SourceCitationSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().default("Web Source").optional(),
  url: z.string().url(),
  date: z.string().optional(),
});

export type SourceCitation = z.infer<typeof SourceCitationSchema>;

export const BriefItemSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  date: z.string().optional().default(""),
  confidence: ConfidenceLevelSchema.default("single-source"),
  sources: z.array(SourceCitationSchema).default([]),
});

export type BriefItem = z.infer<typeof BriefItemSchema>;

export const BriefingSchema = z.object({
  subject: z.string(),
  meetingTime: z.string(),
  tldr: z.string(),
  keyDevelopments: z.array(BriefItemSchema).default([]),
  leadershipAndPeople: z.array(BriefItemSchema).default([]),
  productsAndAnnouncements: z.array(BriefItemSchema).default([]),
  risksAndOpenUncertainties: z.array(BriefItemSchema).default([]),
  talkingPoints: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
  sources: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      url: z.string().url(),
      date: z.string().optional().default(""),
    })
  ).default([]),
  generatedAt: z.string().optional(),
  coverageNote: z.string().optional().default("Covers the last 30 days"),
  isLowData: z.boolean().optional().default(false),
});

export type Briefing = z.infer<typeof BriefingSchema>;

// Schema for Step 1: Query generation
export const SearchQueriesSchema = z.object({
  queries: z
    .array(
      z.object({
        query: z.string().min(3),
        intent: z.string(),
        topic: z.enum(["news", "general"]).default("news"),
      })
    )
    .min(4)
    .max(6),
});

export type SearchQueries = z.infer<typeof SearchQueriesSchema>;

// Pipeline stage events for SSE
export type PipelineStage =
  | "Planning queries"
  | "Searching the web"
  | "Reading sources"
  | "Verifying claims"
  | "Writing briefing"
  | "Complete"
  | "Error";

export interface PipelineEvent {
  stage: PipelineStage;
  message: string;
  progress?: number;
  data?: Partial<Briefing> | { queries?: string[]; sourcesCount?: number; claimsCount?: number };
  error?: string;
}
