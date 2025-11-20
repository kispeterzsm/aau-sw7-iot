"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchPanel from "./components/SearchPanel";
import ResultsList from "./components/ResultsList";
import TimelinePanel from "./components/TimelinePanel";
import { ResultItem, JobStatus, AnalysisSection, ViewMode } from "@/types/types";
import Navbar from "./components/Navbar";
import TextHighlighter from "./components/TextHighlighter";

const SAMPLE_RESPONSE = {
  "status": "ok",
  "cached": true,
  "source_url": "https://www.nbcnews.com/health/health-news/oz-trump-plan-replace-aca-obamacare-no-specific-rcna239232",
  "downstream_ms": 0,
  "data": {
    "warning": null,
    "result": [
      {
        "sentence": "Dr. Mehmet Oz, the administrator of the Centers for Medicare and Medicaid Services, suggested Wednesday that President Donald Trump has a plan to replace the Affordable Care Act — but provided no specifics about the proposal.",
        "search_term": "Affordable Care Act Trump plan",
        "news_results": [],
        "website_results": []
      },
      {
        "sentence": "I fully believe the president has a plan, Oz told NBC News' Meet the Press moderator Kristen Welker.",
        "search_term": "president president plan", 
        "news_results": [],
        "website_results": []
      },
      {
        "sentence": "The Congressional Budget Office projects that nearly 4 million will drop their coverage if the subsidies aren't extended.",
        "search_term": "Congressional Budget Office subsidies",
        "news_results": [],
        "website_results": []
      }
    ],
    "oldest_result": null
  }
};


export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [analysisSections, setAnalysisSections] = useState<AnalysisSection[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string>("");

  const subscriptionRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    loadTopNews();
  }, []);

  // API 1: Get Top News
  async function loadTopNews(limit: number = 10) {
    try {
      const response = await fetch(`/api/news/top?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch top news');
      
      const data = await response.json();
      
      const newsResults: ResultItem[] = data.items.map((item: any, index: number) => ({
        id: `news-${index}-${Date.now()}`,
        url: item.url,
        title: item.title,
        domain: new URL(item.url).hostname,
        published: item.published_at,
        snippet: item.title,
        confidence: 0.85,
        type: 'news'
      }));

      setResults(newsResults);
    } catch (err) {
      console.error('Error loading top news:', err);
      setResults(generateMockResults());
    }
  }

  // Analyze URL
  async function analyzeURL(url: string, searchDepth: number = 2): Promise<AnalysisSection[]> {
    try {
      const response = await fetch('/api/search/link', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url, search_depth: searchDepth }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      return transformAnalysisResults(data);
    } catch (error) {
      console.error('Real API failed, using sample data');
      return transformAnalysisResults(SAMPLE_RESPONSE);
    }
  }

  // Analyze Text  
  async function analyzeText(text: string, searchDepth: number = 2): Promise<AnalysisSection[]> {
    try {
      const response = await fetch('/api/search/text', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ input: text, search_depth: searchDepth }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      return transformAnalysisResults(data);
    } catch (error) {
      console.error('Real API failed, using sample data');
      return transformAnalysisResults(SAMPLE_RESPONSE);
    }
  }

  // Transform API response to analysis sections with mock results
  function transformAnalysisResults(apiData: any): AnalysisSection[] {
    const sections: AnalysisSection[] = apiData.data.result.map((section: any, index: number) => {
      // Generate mock news results
      const newsResults: ResultItem[] = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, (_, i) => ({
        id: `news-${index}-${i}-${Date.now()}`,
        url: `https://news-site.com/article-${index}-${i}`,
        title: `News: ${section.search_term}`,
        domain: 'news-site.com',
        published: new Date(Date.now() - (index * 3 + i) * 24 * 60 * 60 * 1000).toISOString(),
        snippet: `News coverage about: ${section.sentence}`,
        confidence: 0.8 + Math.random() * 0.15,
        type: 'news'
      }));

      // Generate mock website results  
      const websiteResults: ResultItem[] = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, i) => ({
        id: `web-${index}-${i}-${Date.now()}`,
        url: `https://blog-site.com/post-${index}-${i}`,
        title: `Blog: ${section.search_term}`,
        domain: 'blog-site.com',
        published: new Date(Date.now() - (index * 2 + i) * 24 * 60 * 60 * 1000).toISOString(),
        snippet: `Blog discussion about: ${section.sentence}`,
        confidence: 0.7 + Math.random() * 0.2,
        type: 'website'
      }));

      return {
        ...section,
        news_results: newsResults,
        website_results: websiteResults
      };
    });

    return sections;
  }

  // Generate mock results for news feed
  function generateMockResults(): ResultItem[] {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `mock-${i}-${Date.now()}`,
      url: `https://example.com/news-${i}`,
      title: `Top News Story ${i + 1}`,
      domain: 'example.com',
      published: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      snippet: `This is a sample news story for demonstration.`,
      confidence: 0.8 + Math.random() * 0.15,
      type: 'news'
    }));
  }

  // Progress simulation
  function simulateProgress(onUpdate: (progress: number, status: JobStatus) => void) {
    let localProgress = 0;
    const interval = window.setInterval(() => {
      localProgress += 10 + Math.round(Math.random() * 15);
      if (localProgress >= 100) {
        onUpdate(100, "completed");
        window.clearInterval(interval);
      } else {
        onUpdate(Math.min(localProgress, 95), "processing");
      }
    }, 500);
    return interval;
  }

  // Main search handler

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Paste text or a URL to analyze.");
      return;
    }

    setIsSearching(true);
    setResults([]);
    setAnalysisSections([]);
    setSelectedSentence(null);
    setProgress(0);
    setJobId(null);
    setStatus("queued");
    setOriginalContent(trimmed);

    try {
      const isURL = trimmed.startsWith('http://') || trimmed.startsWith('https://');

      // Start progress simulation
      const jobId = `job_${Date.now()}`;
      setJobId(jobId);
      
      const handle = simulateProgress((progress, status) => {
        setStatus(status);
        setProgress(progress);
      });

      subscriptionRef.current = handle;

      // Use appropriate API
      let analysisResults: AnalysisSection[];
      if (isURL) {
        analysisResults = await analyzeURL(trimmed, 2);
      } else {
        analysisResults = await analyzeText(trimmed, 2);
      }
      
      // Clear simulation and set results
      if (subscriptionRef.current) {
        window.clearInterval(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      setAnalysisSections(analysisResults);
      
      // Combine all results for timeline
      const allResults = analysisResults.flatMap(section => 
        [...section.news_results, ...section.website_results]
      );
      setResults(allResults);
      
      setProgress(100);
      setStatus("completed");
      
    } catch (err: any) {
      setError(err?.message || "Analysis failed. Using sample data for demonstration.");
      setStatus("failed");
      
      // Fallback to sample data
      setTimeout(() => {
        const sampleResults = transformAnalysisResults(SAMPLE_RESPONSE);
        setAnalysisSections(sampleResults);
        const allResults = sampleResults.flatMap(section => 
          [...section.news_results, ...section.website_results]
        );
        setResults(allResults);
        setProgress(100);
      }, 1000);
    } finally {
      setIsSearching(false);
    }
  }

  // Get filtered results based on view mode
  const filteredResults = useMemo(() => {
    if (selectedSentence) {
      const section = analysisSections.find(s => s.sentence === selectedSentence);
      if (!section) return [];
      
      switch (viewMode) {
        case 'news': return section.news_results;
        case 'websites': return section.website_results;
        default: return [...section.news_results, ...section.website_results];
      }
    }
    
    // For news feed or when no sentence selected
    switch (viewMode) {
      case 'news': return results.filter(r => r.type === 'news');
      case 'websites': return results.filter(r => r.type === 'website');
      default: return results;
    }
  }, [results, analysisSections, selectedSentence, viewMode]);

  // Get sources for a specific sentence
  const getSentenceSources = (sentence: string) => {
    const section = analysisSections.find(s => s.sentence === sentence);
    if (!section) return { news: [], websites: [] };
    
    return {
      news: section.news_results,
      websites: section.website_results
    };
  };

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1600);
    } catch { }
  }

  const avgConfidence = useMemo(() => 
    filteredResults.length ? 
    Math.round((filteredResults.reduce((s, r) => s + r.confidence, 0) / filteredResults.length) * 100) : 0, 
    [filteredResults]
  );

return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 transition-colors duration-300 antialiased">
      <Navbar />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Content Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-10">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-1 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Forensic Analysis Engine
            </span>
            <div className="w-1 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            Trace Information Origins
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Trace claims to their roots, evaluate the evidence, and make sharing decisions with confidence.
          </p>
        </div>

        {/* Grid Layout - Components */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Search Panel (4 columns) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <SearchPanel
                input={input}
                setInput={setInput}
                onSearch={handleSearch}
                isSearching={isSearching}
                progress={progress}
                status={status}
                error={error}
                jobId={jobId}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          </div>

          {/* Center Column - Results List (5 columns) */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Floating Card Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-3xl blur-xl"></div>
              <div className="relative">
                <ResultsList
                  results={filteredResults}
                  isSearching={isSearching}
                  copyLink={copyLink}
                  copied={copied}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  selectedSentence={selectedSentence}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Timeline Panel (3 columns) */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24">
              <div className="relative">
                {/* Floating Card Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 rounded-3xl blur-xl"></div>
                <div className="relative">
                  <TimelinePanel 
                    results={filteredResults} 
                    avgConfidence={avgConfidence}
                    analysisSections={analysisSections}
                    selectedSentence={selectedSentence}
                    onSentenceSelect={setSelectedSentence}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Empty State - When no results */}
        {!isSearching && filteredResults.length === 0 && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-4">
              <span className="text-5xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">No Results Yet</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Enter a claim or URL in the search panel to begin tracing its information origins across the web.
            </p>
          </div>
        )}
      </section>

      {/* Text Highlighter Modal - Shows original content with highlighted sentences */}
      {analysisSections.length > 0 && originalContent && (
        <TextHighlighter
          content={originalContent}
          analysisSections={analysisSections}
          selectedSentence={selectedSentence}
          onSentenceSelect={setSelectedSentence}
          onClose={() => {
            setSelectedSentence(null);
            setOriginalContent("");
          }}
        />
      )}

      {/* Subtle Footer Divider */}
      <footer className="relative z-10 py-10 border-t border-slate-700/30 ">
        <div className="text-center text-xs text-slate-500">
          <p>Information Origin Tracker • Forensic Analysis Engine</p>
        </div>
      </footer>
    </main>
  );
}

