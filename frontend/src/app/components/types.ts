export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type ResultItem = {
  id: string;
  url: string;
  title: string;
  domain: string;
  published: string;
  snippet: string;
  confidence: number;
};