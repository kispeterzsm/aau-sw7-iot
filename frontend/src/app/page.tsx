"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchPanel from "./components/SearchPanel";
import ResultsList from "./components/ResultsList";
import TimelinePanel from "./components/TimelinePanel";
import { ResultItem, JobStatus, AnalysisSection, ViewMode } from "@/types/types";
import Navbar from "./components/Navbar";
import TextHighlighter from "./components/TextHighlighter";
import { loadTopNews, analyzeURL, analyzeText, getUserHistory, cancelSearch } from "./actions/actions";
import { useSession } from "next-auth/react";
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
  const [analyzedContent, setAnalyzedContent] = useState<string>("");
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const subscriptionRef = useRef<number | null>(null);
  const abortRef = useRef<boolean>(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // handleLoadTopNews(); // Mock data disabled
    if (session?.user?.id) {
      loadUserHistory(session.user.id);
    } else {
      setUserHistory(getGuestHistory());
    }
  }, [session]);

  async function handleLoadTopNews(limit: number = 10) {
    try {
      const newsResults = await loadTopNews(limit);
      const taggedNews = newsResults.map((r: ResultItem) => ({ ...r, type: 'news' as const }));
      setResults(taggedNews);
    } catch (err) {
      console.error('Error loading top news:', err);
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

async function handleCancel() {
    console.log("Cancelling search...");
    abortRef.current = true;

    if (subscriptionRef.current) {
      window.clearInterval(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    setIsSearching(false);
    setStatus("cancelled" as any);
    setProgress(0);
    setError(null);

    if (jobId) {
      cancelSearch(jobId).catch(err => console.error("Background cancel failed", err));
    }
  }

  async function handleSearch(e?: React.FormEvent, overrideTerm?: string) {
    e?.preventDefault();
    setError(null);
    const effectiveInput = overrideTerm !== undefined ? overrideTerm : input;
    const trimmed = effectiveInput.trim();
    if (!trimmed) {
      setError("Paste text or a URL to analyze.");
      return;
    }
    if (overrideTerm !== undefined) {
      setInput(overrideTerm);
    }

    abortRef.current = false;

    setIsSearching(true);
    setResults([]);
    setAnalysisSections([]);
    setSelectedSentence(null);
    setProgress(0);
    
    const newJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setJobId(newJobId);
    
    setStatus("queued");
    setOriginalContent(trimmed);
    setAnalyzedContent(trimmed);

    try {
      const isURL = trimmed.startsWith('http://') || trimmed.startsWith('https://');

      if (isURL && !session?.user?.id) {
          const updatedGuestHistory = saveToGuestHistory(trimmed);
          if (updatedGuestHistory) setUserHistory(updatedGuestHistory);
      }

      const handle = simulateProgress((progress, status) => {
        if (!abortRef.current) {
            setStatus(status);
            setProgress(progress);
        }
      });

      subscriptionRef.current = handle;

      let analysisResults: AnalysisSection[];
      if (isURL) {
        analysisResults = await analyzeURL(trimmed, 2, session?.user?.id, newJobId)
      } else {
        analysisResults = await analyzeText(trimmed, 2, session?.user?.id, newJobId)
      }

      if (abortRef.current) {
        console.log("Result received but ignored due to cancellation.");
        return;
      }

      if (session?.user?.id) {
          loadUserHistory(session.user.id);
      }

      // Clear simulation and set results
      if (subscriptionRef.current) {
        window.clearInterval(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      // Tag results with their type
      const taggedAnalysisResults = analysisResults.map(section => ({
        ...section,
        news_results: section.news_results.map(r => ({ ...r, type: 'news' as const })),
        website_results: section.website_results.map(r => ({ ...r, type: 'website' as const }))
      }));

      setAnalysisSections(taggedAnalysisResults);

      // Combine all results for timeline
      const allResults = taggedAnalysisResults.flatMap(section =>
        [...section.news_results, ...section.website_results]
      );
      setResults(allResults);

      setProgress(100);
      setStatus("completed");

    } catch (err: any) {
      if (!abortRef.current) {
          setError(err?.message || "Analysis failed. Using sample data for demonstration.");
          setStatus("failed");
      }
    } finally {
      if (!abortRef.current) {
          setIsSearching(false);
      }
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

    // return empty list if no specific sentence is chosen
    return [];
  }, [analysisSections, selectedSentence, viewMode]);


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

  const currentSection = selectedSentence 
    ? analysisSections.find(s => s.sentence === selectedSentence)
    : null;

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
          <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            Track Information Origins
          </h1>
        </div>

        {/* Grid Layout - Components */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <SearchPanel
                input={input}
                setInput={setInput}
                onSearch={handleSearch}
                onCancel={handleCancel}
                isSearching={isSearching}
                progress={progress}
                status={status}
                error={error}
                jobId={jobId}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
              
              {/* Generated Search Terms Button*/}
              {status === 'completed' && analyzedContent && (
                <button
                  onClick={() => setOriginalContent(analyzedContent)}
                  className="mt-4 w-full py-3 px-4 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-400/50 dark:hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-lg shadow-slate-200/20 dark:shadow-black/20 flex items-center justify-center gap-2 group backdrop-blur-sm"
                >
                  <span className="group-hover:scale-110 transition-transform text-lg">✨</span>
                  Show generated search terms
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-3xl blur-xl dark:from-cyan-500/5 dark:to-emerald-500/5"></div>
              <div className="relative">
                {!isSearching && filteredResults.length === 0 && !selectedSentence && (currentSection == null || currentSection === undefined)  ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm min-h-[200px]">
                    <p className="text-slate-600 dark:text-slate-400 font-medium whitespace-pre-line">
                      Insert or select a piece of information to view the results!{"\n"}
                      If you have any issues please contact Support.
                    </p>
                  </div>
                ) : (
                  <ResultsList
                    results={filteredResults}
                    isSearching={isSearching}
                    copyLink={copyLink}
                    copied={copied}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    selectedSentence={selectedSentence}
                    searchTerm={currentSection?.search_term}
                  />
                )}
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
          handleSearch(undefined, url);
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