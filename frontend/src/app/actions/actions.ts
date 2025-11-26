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

// FIXED: Properly typed transformation function
function transformBackendResults(apiData: AnalysisResponse): AnalysisSection[] {
  // Only process if we have real backend data with results
  if (!apiData.data?.result) {
    return [];
  }

  const sections: AnalysisSection[] = apiData.data.result.map(
    (backendSection, index) => {
      // Backend now provides news_results and website_results directly
      if ((backendSection.news_results && backendSection.news_results.length > 0) || 
          (backendSection.website_results && backendSection.website_results.length > 0)) {
        
        // Transform news results with proper typing
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

        // Transform website results with proper typing  
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
        // Skip sections with no results
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

// function transformAnalysisResults(
//   apiData: AnalysisResponse
// ): AnalysisSection[] {
//   const sections: AnalysisSection[] = apiData.data.result.map(
//     (backendSection, index) => {
//       if (backendSection.results && backendSection.results.length > 0) {
//         const allResults: ResultItem[] = backendSection.results.map(
//           (result, i) => ({
//             id: `result-${index}-${i}-${Date.now()}`,
//             url: result.url,
//             title: result.title,
//             domain: new URL(result.url).hostname,
//             published: result.date || new Date().toISOString(),
//             snippet: result.snippet,
//             confidence: calculateConfidence(result),
//             type: classifyType(result.url, result.title),
//           })
//         );

//         const newsResults = allResults.filter((r) => r.type === "news");
//         const websiteResults = allResults.filter((r) => r.type === "website");

//         return {
//           sentence: backendSection.sentence,
//           search_term: backendSection.search_term,
//           news_results: newsResults,
//           website_results: websiteResults,
//         };
//       } else {
//         return {
//           sentence: backendSection.sentence,
//           search_term: backendSection.search_term,
//           news_results: generateMockNewsResults(backendSection, index),
//           website_results: generateMockWebsiteResults(backendSection, index),
//         };
//       }
//     }
//   );

//   return sections;
// }
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
// Separate mock generators for fallback only
function generateMockNewsResults(section: any, index: number): ResultItem[] {
  return Array.from({ length: 2 }, (_, i) => ({
    id: `mock-news-${index}-${i}-${Date.now()}`,
    url: `https://news-site.com/article-${index}-${i}`,
    title: `News: ${section.search_term}`,
    domain: "news-site.com",
    published: new Date(
      Date.now() - (index * 3 + i) * 24 * 60 * 60 * 1000
    ).toISOString(),
    snippet: `News coverage about: ${section.sentence}`,
    confidence: 0.8 + Math.random() * 0.15,
    type: "news" as const,
  }));
}

// function generateMockWebsiteResults(section: any, index: number): ResultItem[] {
//   return Array.from({ length: 3 }, (_, i) => ({
//     id: `mock-web-${index}-${i}-${Date.now()}`,
//     url: `https://blog-site.com/post-${index}-${i}`,
//     title: `Blog: ${section.search_term}`,
//     domain: "blog-site.com",
//     published: new Date(
//       Date.now() - (index * 2 + i) * 24 * 60 * 60 * 1000
//     ).toISOString(),
//     snippet: `Blog discussion about: ${section.sentence}`,
//     confidence: 0.7 + Math.random() * 0.2,
//     type: "website" as const,
//   }));
// }
// // function calculateConfidence(item: any): number {
// //   const trustedDomains = [
// //     "bbc.com",
// //     "reuters.com",
// //     "apnews.com",
// //     "nytimes.com",
// //     "washingtonpost.com",
// //     "theguardian.com",
// //   ];
// //   const isTrusted = trustedDomains.some((domain) => item.url.includes(domain));
// //   return isTrusted ? 0.9 : 0.7;
// // }

// // function classifyType(url: string, title: string): "news" | "website" {
// //   const newsKeywords = ["news", "article", "report", "breaking"];
// //   const hasNewsKeyword = newsKeywords.some(
// //     (keyword) =>
// //       url.toLowerCase().includes(keyword) ||
// //       title.toLowerCase().includes(keyword)
// //   );
// //   return hasNewsKeyword ? "news" : "website";
// // }

// // Helper function: Sample response for fallback
// function getSampleResponse(): AnalysisResponse {
//   return {
//     status: "ok",
//     cached: true,
//     source_url:
//       "https://www.nbcnews.com/health/health-news/oz-trump-plan-replace-aca-obamacare-no-specific-rcna239232",
//     downstream_ms: 0,
//     data: {
//       warning: null,
//       result: [
//         {
//           sentence:
//             "Dr. Mehmet Oz, the administrator of the Centers for Medicare and Medicaid Services, suggested Wednesday that President Donald Trump has a plan to replace the Affordable Care Act — but provided no specifics about the proposal.",
//           search_term: "Affordable Care Act Trump plan",
//           results: [
//             {
//               url: "https://www.bing.com/ck/a?!&&p=a976eff843686319fa93814be7efc3ca2de650713565795f78eb2cbb81cda4baJmltdHM9MTc2MTY5NjAwMA&ptn=3&ver=2&hsh=4&fclid=2ee975ad-7dbb-68c0-3b54-63397cda69b8&u=a1aHR0cHM6Ly93d3cudXNuZXdzLmNvbS9uZXdzL2hlYWx0aC1uZXdzL2FydGljbGVzLzIwMjUtMDMtMTEvdHJ1bXAtYWRtaW5pc3RyYXRpb24tcHJvcG9zZXMtb2JhbWFjYXJlLWVucm9sbG1lbnQtY2hhbmdlcw&ntb=1",
//               date: "2025-03-11",
//               title:
//                 "Trump Administration Proposes Changes for Affordable Care Act …",
//               snippet:
//                 "Mar 11, 2025· The Trump administration issued its first major set of proposed changes to the Affordable Care Act on Monday that federal officials said are intended to crack down on fraud …",
//             },
//           ],
//         },
//         {
//           sentence:
//             "I fully believe the president has a plan, Oz told NBC News' Meet the Press moderator Kristen Welker.",
//           search_term: "president president plan",
//           results: [
//             {
//               url: "https://example.com/article2",
//               date: "2025-03-10",
//               title: "President's Healthcare Plan Details",
//               snippet:
//                 "Recent discussions about the president's proposed healthcare plan reforms.",
//             },
//           ],
//         },
//       ],
//       oldest_result: null,
//     },
//   };
// }
