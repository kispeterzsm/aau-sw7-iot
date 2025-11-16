export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type ViewMode = 'all' | 'news' | 'websites';

export type ResultItem = {
  id: string;
  url: string;
  title: string;
  domain: string;
  published: string;
  snippet: string;
  confidence: number;
  type?: 'news' | 'website';
};

export type AnalysisSection = {
  sentence: string;
  search_term: string;
  news_results: ResultItem[];
  website_results: ResultItem[];
};

export type AnalysisResult = {
  status: string;
  cached: boolean;
  source_url: string;
  data: {
    warning: string | null;
    result: AnalysisSection[];
    oldest_result: ResultItem | null;
  };
};
