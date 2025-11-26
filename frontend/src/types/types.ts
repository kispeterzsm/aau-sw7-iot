export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type ViewMode = "all" | "news" | "websites";

export type ResultItem = {
  id: string;
  url: string;
  title: string;
  domain: string;
  published: string;
  snippet: string;
  confidence: number;
  type?: "news" | "website";
};

export type BackendAnalysisSection = {
  sentence: string;
  search_term: string;
  news_results: Array<{  
    url: string;
    date: string | null;
    title: string;
    snippet: string;
  }>;
  website_results: Array<{  
    url: string;
    date: string | null;
    title: string;
    snippet: string;
  }>;
};

export type AnalysisSection = {
  sentence: string;
  search_term: string;
  news_results: ResultItem[];
  website_results: ResultItem[];
  entities?: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
};

export interface TopNewsResponse {
  items: Array<{
    url: string;
    title: string;
    published_at: string;
  }>;
}

export interface AnalysisResponse {
  status: string;
  cached: boolean;
  source_url: string;
  downstream_ms: number;
  data: {
    warning: string | null;
    result: BackendAnalysisSection[];
    oldest_result: any;
  };
}

export interface RegisterResponse {
  message?: string;
  error?: string;
  user?: any;
}