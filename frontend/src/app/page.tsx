"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchPanel from "./components/SearchPanel";
import ResultsList from "./components/ResultsList";
import TimelinePanel from "./components/TimelinePanel";
import { ResultItem, JobStatus, AnalysisSection, ViewMode } from "@/types/types";
import Navbar from "./components/Navbar";
import TextHighlighter from "./components/TextHighlighter";
import { loadTopNews, analyzeURL, analyzeText, getUserHistory, addToUserHistory } from "./actions/actions";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import HistoryPanel from "./components/HistoryPanel";


const GUEST_HISTORY_KEY = "iot_guest_history_v1";

const getGuestHistory = () => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(GUEST_HISTORY_KEY);
    return item ? JSON.parse(item) : [];
  } catch { return []; }
};

const saveToGuestHistory = (url: string) => {
  if (typeof window === 'undefined') return;
  const current = getGuestHistory();
  const existingIndex = current.findIndex((h: any) => h.url === url);

  const newItem = {
    id: Date.now(),
    user_id: 0,
    cache_id: 0,
    url: url,
    view_count: existingIndex > -1 ? current[existingIndex].view_count + 1 : 1,
    created_at: new Date().toISOString()
  };

  let updated;
  if (existingIndex > -1) {
    updated = [...current];
    updated[existingIndex] = newItem;
  } else {
    updated = [newItem, ...current];
  }

  localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(updated.slice(0, 50)));
  return updated;
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
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const subscriptionRef = useRef<number | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    handleLoadTopNews();
    if (session?.user?.id) {
      loadUserHistory(session.user.id);
    } else {
      setUserHistory(getGuestHistory());
    }
  }, [session]);

  async function handleLoadTopNews(limit: number = 10) {
    try {
      const newsResults = await loadTopNews(limit);
      setResults(newsResults);
    } catch (err) {
      console.error('Error loading top news:', err);
      // Fallback
    }
  }

  async function loadUserHistory(userId: string) {
    try {
      const history = await getUserHistory(userId);
      setUserHistory(history);
    } catch (error) {
      console.error('Error loading user history:', error);
    }
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

      const jobId = `job_${Date.now()}`;
      setJobId(jobId);

      // HISTORY SAVING LOGIC
      if (isURL) {
        if (session?.user?.id) {
          addToUserHistory(session.user.id, trimmed).then(() => {
            loadUserHistory(session.user.id); // Refresh list
          });
        } else {
          // Guest User -> Local Storage
          const updatedGuestHistory = saveToGuestHistory(trimmed);
          if (updatedGuestHistory) setUserHistory(updatedGuestHistory);
        }
      }

      const handle = simulateProgress((progress, status) => {
        setStatus(status);
        setProgress(progress);
      });

      subscriptionRef.current = handle;

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
    } finally {
      setIsSearching(false);
    }
  }

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

    switch (viewMode) {
      case 'news': return results.filter(r => r.type === 'news');
      case 'websites': return results.filter(r => r.type === 'website');
      default: return results;
    }
  }, [results, analysisSections, selectedSentence, viewMode]);


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
    <main className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-white text-slate-900 transition-colors duration-300 antialiased dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <Navbar onShowHistory={() => setShowHistory(true)} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse dark:bg-emerald-500/10"></div>
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Content Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-10">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-1 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest dark:text-slate-400">
              Forensic Analysis Engine
            </span>
            <div className="w-1 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            Trace Information Origins
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto dark:text-slate-400">
            Trace claims to their roots, evaluate the evidence, and make sharing decisions with confidence.
          </p>
        </div>

        {/* Grid Layout - Components */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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

          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-3xl blur-xl dark:from-cyan-500/5 dark:to-emerald-500/5"></div>
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

          <aside className="lg:col-span-3">
            <div className="sticky top-24">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 rounded-3xl blur-xl dark:from-emerald-500/5 dark:to-cyan-500/5"></div>
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

      </section>

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
      <HistoryPanel
        history={userHistory}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectHistory={(url) => {
          setInput(url);
          setShowHistory(false);
          handleSearch();
        }}
      />

      <footer className="relative z-10 py-10 border-t border-slate-200/30 dark:border-slate-700/30">
        <div className="text-center text-xs text-slate-600 dark:text-slate-400">
          <p>Information Origin Tracker • Forensic Analysis Engine</p>
        </div>
      </footer>
    </main>
  );
}