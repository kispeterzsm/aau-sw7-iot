"use server";

import {
  ResultItem,
  AnalysisSection,
  JobStatus,
  RegisterResponse,
  AnalysisResponse,
  TopNewsResponse,
} from "@/types/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8999";

export async function loadTopNews(limit: number = 10): Promise<ResultItem[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/news/top?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch top news: ${response.status}`);
    }

    const data: TopNewsResponse = await response.json();

    const newsResults: ResultItem[] = data.items.map((item, index) => ({
      id: `news-${index}-${Date.now()}`,
      url: item.url,
      title: item.title,
      domain: new URL(item.url).hostname,
      published: item.published_at,
      snippet: item.title,
      confidence: calculateConfidence(item), // Based on domain authority, freshness, etc.
      type: classifyType(item.url, item.title), // Based on URL patterns, keywords
    }));

    return newsResults;
  } catch (error) {
    console.error("Error in loadTopNews server action:", error);
    // Return mock data as fallback
    return generateMockResults();
  }
}

export async function analyzeURL(
  url: string,
  searchDepth: number = 2
): Promise<AnalysisSection[]> {
  try {
    console.log('🔄 Analyzing URL via backend:', url);
    
    const response = await fetch(`${BACKEND_URL}/search/link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        input: url,
        search_depth: searchDepth 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnalysisResponse = await response.json();
    console.log('✅ URL analysis data received:', data);
    
    return transformBackendResults(data);
  } catch (error) {
    console.error("Error in analyzeURL server action:", error);
    return [];
  }
}

export async function analyzeText(
  text: string,
  searchDepth: number = 2
): Promise<AnalysisSection[]> {
  try {
    console.log('🔄 Analyzing text via backend:', text.substring(0, 50) + '...');
    
    const response = await fetch(`${BACKEND_URL}/search/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        input: text,
        search_depth: searchDepth 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnalysisResponse = await response.json();
    console.log('✅ Text analysis data received:', data);
    
    return transformBackendResults(data);
  } catch (error) {
    console.error("Error in analyzeText server action:", error);
    return [];
  }
}

function transformBackendResults(apiData: AnalysisResponse): AnalysisSection[] {
  if (!apiData.data?.result) {
    return [];
  }

  const sections: AnalysisSection[] = apiData.data.result.map(
    (backendSection, index) => {
      if ((backendSection.news_results && backendSection.news_results.length > 0) || 
          (backendSection.website_results && backendSection.website_results.length > 0)) {
        
        const newsResults: ResultItem[] = (backendSection.news_results || []).map(
          (result, i) => ({
            id: `news-${index}-${i}-${Date.now()}`,
            url: result.url,
            title: result.title,
            domain: new URL(result.url).hostname,
            published: result.date || new Date().toISOString(),
            snippet: result.snippet,
            confidence: calculateConfidence(result),
            type: "news" as const,
          })
        );

        const websiteResults: ResultItem[] = (backendSection.website_results || []).map(
          (result, i) => ({
            id: `web-${index}-${i}-${Date.now()}`,
            url: result.url,
            title: result.title,
            domain: new URL(result.url).hostname,
            published: result.date || new Date().toISOString(),
            snippet: result.snippet,
            confidence: calculateConfidence(result),
            type: "website" as const,
          })
        );

        return {
          sentence: backendSection.sentence,
          search_term: backendSection.search_term,
          news_results: newsResults,
          website_results: websiteResults,
        };
      } else {
        return null;
      }
    }
  ).filter((section): section is AnalysisSection => section !== null);

  return sections;
}

// Helper function with proper typing
function calculateConfidence(item: { url: string; title: string }): number {
  const trustedDomains = [
    "bbc.com",
    "reuters.com", 
    "apnews.com",
    "nytimes.com",
    "washingtonpost.com",
    "theguardian.com",
  ];
  const isTrusted = trustedDomains.some((domain) => item.url.includes(domain));
  return isTrusted ? 0.9 : 0.7;
}

function classifyType(url: string, title: string): "news" | "website" {
  const newsKeywords = ["news", "article", "report", "breaking"];
  const hasNewsKeyword = newsKeywords.some(
    (keyword) =>
      url.toLowerCase().includes(keyword) ||
      title.toLowerCase().includes(keyword)
  );
  return hasNewsKeyword ? "news" : "website";
}

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
          error:
            "An account with this email already exists. Please sign in instead.",
        };
      }

      if (res.status === 400) {
        return {
          success: false,
          message: "Registration failed",
          error:
            responseData.message ||
            "Invalid registration data. Please check your information.",
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
            error:
              "An account with this email already exists. Please sign in instead.",
          };
        }
      }

      // Generic error for other status codes
      return {
        success: false,
        message: "Registration failed",
        error:
          responseData.message ||
          responseData.error ||
          "Unable to create account. Please try again later.",
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
      error:
        "Unable to connect to the server. Please check your internet connection and try again.",
    };
  }
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
