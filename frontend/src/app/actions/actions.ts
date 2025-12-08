"use server";

import {
  ResultItem,
  AnalysisSection,
  AnalysisResponse,
  TopNewsResponse,
} from "@/types/types";

const BACKEND_URL = "http://127.0.0.1:8999";

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
    console.log("🔄 Analyzing URL via backend:", url);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/search/link`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: url,
          search_depth: searchDepth,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnalysisResponse = await response.json();
    console.log("✅ URL analysis data received:", data);

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
    console.log(
      "🔄 Analyzing text via backend:",
      text.substring(0, 50) + "..."
    );

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/search/text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          search_depth: searchDepth,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnalysisResponse = await response.json();
    console.log("✅ Text analysis data received:", data);

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
  const sections: AnalysisSection[] = apiData.data.result.flatMap(
    (backendSection, index) => {
      const hasNewsResults =
        backendSection.news_results && backendSection.news_results.length > 0;
      const hasWebsiteResults =
        backendSection.website_results &&
        backendSection.website_results.length > 0;

      if (!hasNewsResults && !hasWebsiteResults) {
        return [];
      }

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
          original_title: result.original_title,
          original_language: result.original_language,
          is_translated: !!result.original_language,
        })
      );

      const websiteResults: ResultItem[] = (
        backendSection.website_results || []
      ).map((result, i) => ({
        id: `web-${index}-${i}-${Date.now()}`,
        url: result.url,
        title: result.title,
        domain: new URL(result.url).hostname,
        published: result.date || new Date().toISOString(),
        snippet: result.snippet,
        confidence: calculateConfidence(result),
        type: "website" as const,
        original_title: result.original_title,
        original_language: result.original_language,
        is_translated: !!result.original_language,
      }));

      const entities =
        backendSection.entities?.map((entity) => ({
          text: entity.name,
          type: entity.label,
        })) || [];

      return {
        sentence: backendSection.sentence,
        search_term: backendSection.search_term,
        news_results: newsResults,
        website_results: websiteResults,
        entities: entities,
      };
    }
  );

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
//Register
export async function registerUser(formData: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...formData }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: "Registration failed",
        error: data.message || "Unable to create account. Please try again.",
      };
    }

    return {
      success: true,
      message: data.message || "Account created successfully!",
    };
  } catch (error: any) {
    console.error("Registration error in server action:", error);
    return {
      success: false,
      message: "Network Error",
      error: "Unable to connect to the server. Please check your connection.",
    };
  }
}

// MFA
export async function setEmailMfaEnabled(userId: string, enabled = true) {
  const url = `${BACKEND_URL}/mfa/email/enable?user_id=${encodeURIComponent(
    userId
  )}&enabled=${encodeURIComponent(String(enabled))}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(await res.text().catch(() => "Failed"));
  return res.json().catch(() => ({ ok: true }));
}

export async function requestEmailOtp(userId: string) {
  const url = `${BACKEND_URL}/mfa/email/request?user_id=${encodeURIComponent(
    userId
  )}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok)
    throw new Error(await res.text().catch(() => "Failed to request OTP"));
  return res.json().catch(() => ({ ok: true }));
}

export async function verifyEmailOtp(userId: string, code: string) {
  const url = `${BACKEND_URL}/mfa/email/verify?user_id=${encodeURIComponent(
    userId
  )}&code=${encodeURIComponent(code)}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok)
    throw new Error(await res.text().catch(() => "Invalid/expired code"));
  return res.json().catch(() => ({ success: true }));
}

//USER-History
export async function getUserHistory(userId: string) {
  try {
    console.log("Fetching user history for:", userId);

    const response = await fetch(`${BACKEND_URL}/history/user/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user history: ${response.status}`);
    }

    const history = await response.json();
    console.log("✅ User history received:", history);

    return history;
  } catch (error) {
    console.error("Error in getUserHistory server action:", error);
    return [];
  }
}

export async function addToUserHistory(
  userId: string,
  url: string,
  cacheId?: number
) {
  try {
    console.log("Adding to user history:", { userId, url });

    const response = await fetch(`${BACKEND_URL}/history/user/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        cache_id: cacheId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add to user history: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Added to user history:", result);

    return result;
  } catch (error) {
    console.error("Error in addToUserHistory server action:", error);
    return null;
  }
}

export async function requestPasswordResetOtp(email: string) {
  try {
    const url = new URL(`${BACKEND_URL}/password/forgot`);
    url.searchParams.append("email", email);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        message:
          errorData.message ||
          "Failed to send reset code. Please check the email.",
      };
    }
    return { success: true, message: "Reset code sent to your email." };
  } catch (error: any) {
    console.error("Forgot password request error:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
}

export async function resetPasswordWithOtp(data: {
  email: string;
  code: string;
  newPassword: string;
}) {
  try {
    const res = await fetch(`${BACKEND_URL}/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        code: data.code,
        new_password: data.newPassword,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        message:
          errorData.message ||
          "Failed to reset password. Invalid code or expired.",
      };
    }

    return {
      success: true,
      message: "Password reset successfully. You can now login.",
    };
  } catch (error: any) {
    console.error("Reset password error:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
}

export async function changeUserPassword(
  userId: string | number,
  oldPassword: string,
  newPassword: string
) {
  try {
    const res = await fetch(`${BACKEND_URL}/password/change`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: Number(userId),
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: "Password change failed",
        error: data.error || "Invalid current password or server error.",
      };
    }

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error: any) {
    console.error("Change password error:", error);
    return {
      success: false,
      message: "Network Error",
      error: "Unable to connect to server. Please try again.",
    };
  }
}
