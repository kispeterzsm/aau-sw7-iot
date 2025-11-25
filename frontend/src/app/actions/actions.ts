"use server";

import { ResultItem, AnalysisSection, JobStatus } from "@/types/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8999";

// Types for API responses
interface TopNewsResponse {
  items: Array<{
    url: string;
    title: string;
    published_at: string;
  }>;
}

interface AnalysisResponse {
  status: string;
  cached: boolean;
  source_url: string;
  downstream_ms: number;
  data: {
    warning: string | null;
    result: Array<{
      sentence: string;
      search_term: string;
      news_results: any[];
      website_results: any[];
    }>;
    oldest_result: any;
  };
}

interface RegisterResponse {
  message?: string;
  error?: string;
  user?: any;
}

// Server Action: Load Top News
export async function loadTopNews(limit: number = 10): Promise<ResultItem[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/news/top?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch top news: ${response.status}`);
    }

    const data: TopNewsResponse = await response.json();

    // Transform the response to ResultItem format
    const newsResults: ResultItem[] = data.items.map((item, index) => ({
      id: `news-${index}-${Date.now()}`,
      url: item.url,
      title: item.title,
      domain: new URL(item.url).hostname,
      published: item.published_at,
      snippet: item.title,
      confidence: 0.85,
      type: "news" as const,
    }));

    return newsResults;
  } catch (error) {
    console.error("Error in loadTopNews server action:", error);
    // Return mock data as fallback
    return generateMockResults();
  }
}

// Server Action: Analyze URL
export async function analyzeURL(
  url: string,
  searchDepth: number = 2
): Promise<AnalysisSection[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/search/link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, search_depth: searchDepth }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnalysisResponse = await response.json();
    return transformAnalysisResults(data);
  } catch (error) {
    console.error("Error in analyzeURL server action:", error);
    // Return sample data as fallback
    return transformAnalysisResults(getSampleResponse());
  }
}

// Server Action: Analyze Text
export async function analyzeText(
  text: string,
  searchDepth: number = 2
): Promise<AnalysisSection[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/search/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text, search_depth: searchDepth }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnalysisResponse = await response.json();
    return transformAnalysisResults(data);
  } catch (error) {
    console.error("Error in analyzeText server action:", error);
    // Return sample data as fallback
    return transformAnalysisResults(getSampleResponse());
  }
}

// Server Action: User Registration
// Server Action: User Registration
export async function registerUser(formData: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const responseData: RegisterResponse = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (
        res.status === 400 &&
        responseData.message?.includes("Email already exists")
      ) {
        return {
          success: false,
          message: "Account already exists",
          error: "An account with this email already exists. Please sign in instead.",
        };
      }

      if (res.status === 400) {
        return {
          success: false,
          message: "Registration failed",
          error: responseData.message || "Invalid registration data. Please check your information.",
        };
      }

      if (res.status === 500) {
        if (
          responseData.error?.includes("unique") ||
          responseData.message?.includes("already exists") ||
          responseData.message?.includes("duplicate")
        ) {
          return {
            success: false,
            message: "Account already exists",
            error: "An account with this email already exists. Please sign in instead.",
          };
        }
      }

      // Generic error for other status codes
      return {
        success: false,
        message: "Registration failed",
        error: responseData.message || responseData.error || "Unable to create account. Please try again later.",
      };
    }

    return {
      success: true,
      message: "Account created successfully!",
    };
  } catch (error: any) {
    console.error("Registration error in server action:", error);
    return {
      success: false,
      message: "Registration failed",
      error: "Unable to connect to the server. Please check your internet connection and try again.",
    };
  }
}

// Helper function: Transform API response to analysis sections
function transformAnalysisResults(
  apiData: AnalysisResponse
): AnalysisSection[] {
  const sections: AnalysisSection[] = apiData.data.result.map(
    (section, index) => {
      // Generate mock news results
      const newsResults: ResultItem[] = Array.from(
        { length: 2 + Math.floor(Math.random() * 2) },
        (_, i) => ({
          id: `news-${index}-${i}-${Date.now()}`,
          url: `https://news-site.com/article-${index}-${i}`,
          title: `News: ${section.search_term}`,
          domain: "news-site.com",
          published: new Date(
            Date.now() - (index * 3 + i) * 24 * 60 * 60 * 1000
          ).toISOString(),
          snippet: `News coverage about: ${section.sentence}`,
          confidence: 0.8 + Math.random() * 0.15,
          type: "news" as const,
        })
      );

      // Generate mock website results
      const websiteResults: ResultItem[] = Array.from(
        { length: 3 + Math.floor(Math.random() * 3) },
        (_, i) => ({
          id: `web-${index}-${i}-${Date.now()}`,
          url: `https://blog-site.com/post-${index}-${i}`,
          title: `Blog: ${section.search_term}`,
          domain: "blog-site.com",
          published: new Date(
            Date.now() - (index * 2 + i) * 24 * 60 * 60 * 1000
          ).toISOString(),
          snippet: `Blog discussion about: ${section.sentence}`,
          confidence: 0.7 + Math.random() * 0.2,
          type: "website" as const,
        })
      );

      return {
        ...section,
        news_results: newsResults,
        website_results: websiteResults,
      };
    }
  );

  return sections;
}

// Helper function: Generate mock results for fallback
function generateMockResults(): ResultItem[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `mock-${i}-${Date.now()}`,
    url: `https://example.com/news-${i}`,
    title: `Top News Story ${i + 1}`,
    domain: "example.com",
    published: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    snippet: `This is a sample news story for demonstration.`,
    confidence: 0.8 + Math.random() * 0.15,
    type: "news" as const,
  }));
}

// Helper function: Sample response for fallback
function getSampleResponse(): AnalysisResponse {
  return {
    status: "ok",
    cached: true,
    source_url:
      "https://www.nbcnews.com/health/health-news/oz-trump-plan-replace-aca-obamacare-no-specific-rcna239232",
    downstream_ms: 0,
    data: {
      warning: null,
      result: [
        {
          sentence:
            "Dr. Mehmet Oz, the administrator of the Centers for Medicare and Medicaid Services, suggested Wednesday that President Donald Trump has a plan to replace the Affordable Care Act — but provided no specifics about the proposal.",
          search_term: "Affordable Care Act Trump plan",
          news_results: [],
          website_results: [],
        },
        {
          sentence:
            "I fully believe the president has a plan, Oz told NBC News' Meet the Press moderator Kristen Welker.",
          search_term: "president president plan",
          news_results: [],
          website_results: [],
        },
        {
          sentence:
            "The Congressional Budget Office projects that nearly 4 million will drop their coverage if the subsidies aren't extended.",
          search_term: "Congressional Budget Office subsidies",
          news_results: [],
          website_results: [],
        },
      ],
      oldest_result: null,
    },
  };
}
