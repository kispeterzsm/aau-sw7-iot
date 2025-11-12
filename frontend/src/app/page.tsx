"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchPanel from "./components/SearchPanel";
import ResultsList from "./components/ResultsList";
import TimelinePanel from "./components/TimelinePanel";
import { ResultItem, JobStatus } from "./components/types";
import Navbar from "./components/Navbar";

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const subscriptionRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    loadTopNews();
    return () => {
      if (subscriptionRef.current) window.clearInterval(subscriptionRef.current);
    };
  }, []);

  // API 1: Get Top News
  async function loadTopNews(limit: number = 5) {
    try {
      const response = await fetch(`http://127.0.0.1:8999/news/top?limit=${limit}`);
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
      }));

      setResults(newsResults);
    } catch (err) {
      console.error('Error loading top news:', err);
    }
  }

  // API 2: Analyze URL - Using /search/link
  async function analyzeURL(url: string, searchDepth: number = 2): Promise<ResultItem[]> {
    try {
      const response = await fetch('http://127.0.0.1:8999/search/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          search_depth: searchDepth
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return transformSearchResults(data);
    } catch (error) {
      console.error('Failed to analyze URL:', error);
      throw error;
    }
  }

  // API 3: Analyze Text - Using /search/text
  async function analyzeText(text: string, searchDepth: number = 2): Promise<ResultItem[]> {
    try {
      const response = await fetch('http://127.0.0.1:8999/search/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          search_depth: searchDepth
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return transformSearchResults(data);
    } catch (error) {
      console.error('Failed to analyze text:', error);
      throw error;
    }
  }

  // Transform both /search/link and /search/text responses
  function transformSearchResults(apiData: any): ResultItem[] {
    console.log('Transforming search results:', apiData);
    
    // Handle the expected response structure
    if (!apiData.data?.result) {
      console.warn('No result data found in response');
      return [];
    }

    const results: ResultItem[] = [];

    apiData.data.result.forEach((section: any, sectionIndex: number) => {
      // Handle both structures: section.results and section.news_results/website_results
      const resultsArray = section.results || section.news_results || section.website_results || [];
      
      resultsArray.forEach((result: any, resultIndex: number) => {
        results.push({
          id: `result-${sectionIndex}-${resultIndex}-${Date.now()}`,
          url: result.url,
          title: result.title,
          domain: new URL(result.url).hostname,
          published: result.date ? `${result.date}T00:00:00Z` : new Date().toISOString(),
          snippet: result.snippet || result.title,
          confidence: calculateConfidence(result),
        });
      });
    });

    // Sort by date (earliest first)
    return results.sort((a, b) => new Date(a.published).getTime() - new Date(b.published).getTime());
  }

  function calculateConfidence(result: any): number {
    let confidence = 0.7;
    if (result.date) confidence += 0.2;
    if (result.snippet && result.snippet.length > 50) confidence += 0.1;
    return Math.min(confidence, 0.95);
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

  // Main search handler - now supports both URLs and Text
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
    setProgress(0);
    setJobId(null);
    setStatus("queued");

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

      // Use appropriate API based on input type
      let analysisResults: ResultItem[];
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
      
      setResults(analysisResults);
      setProgress(100);
      setStatus("completed");
      
    } catch (err: any) {
      setError(err?.message || "Analysis failed. Make sure backend is running on port 8999.");
      setStatus("failed");
    
    } finally {
      setIsSearching(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1600);
    } catch { }
  }

  function openSnapshot(path: string) {
    setSnapshotUrl(path);
  }

  const avgConfidence = useMemo(() => (results.length ? Math.round((results.reduce((s, r) => s + r.confidence, 0) / results.length) * 100) : 0), [results]);

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300 antialiased">
      <Navbar/>

      <section className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <SearchPanel
            input={input}
            setInput={setInput}
            onSearch={handleSearch}
            isSearching={isSearching}
            progress={progress}
            status={status}
            error={error}
            jobId={jobId}
          />
        </div>

        <div className="lg:col-span-5">
          <ResultsList
            results={results}
            isSearching={isSearching}
            copyLink={copyLink}
            openSnapshot={openSnapshot}
            copied={copied}
          />
        </div>

        <aside className="lg:col-span-3">
          <TimelinePanel results={results} avgConfidence={avgConfidence} />
        </aside>
      </section>
      
      {snapshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSnapshotUrl(null)} />
          <div className="relative max-w-5xl w-full bg-background rounded-2xl shadow-2xl overflow-hidden border border-slate-300 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-300 dark:border-slate-700">
              <div className="text-sm font-medium">Snapshot preview</div>
              <button onClick={() => setSnapshotUrl(null)} className="px-3 py-1 text-sm rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Close</button>
            </div>
            <div style={{ height: "72vh" }}>
              <iframe title="snapshot" src={snapshotUrl} className="w-full h-full border-0" sandbox="allow-same-origin allow-forms" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}