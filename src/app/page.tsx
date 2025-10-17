"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchPanel from "./components/SearchPanel";
import ResultsList from "./components/ResultsList";
import TimelinePanel from "./components/TimelinePanel";
import { ResultItem, JobStatus } from "./components/types";
import DarkModeToggle from "./components/DarkModeToggle";

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

  // ... (all your functions like createJob, generateResults, etc. remain the same)
  // No changes are needed in the component's logic
  useEffect(() => {
    setMounted(true);
    return () => {
      if (subscriptionRef.current) window.clearInterval(subscriptionRef.current);
    };
  }, []);

  function createJob() {
    return new Promise<{ jobId: string }>((resolve) => setTimeout(() => resolve({ jobId: `job_${Date.now()}` }), 220));
  }

  function generateResults(n = 3): ResultItem[] {
    const base = [
      {
        id: `r-${Math.random().toString(36).slice(2, 8)}`,
        url: "https://example.com/article-1",
        title: "Investigative piece reveals core claim",
        domain: "example.com",
        published: "2023-01-10T08:00:00Z",
        snippet: "This sentence exactly matches the submitted claim and includes context to judge it.",
        confidence: 0.92,
      },
      {
        id: `r-${Math.random().toString(36).slice(2, 8)}`,
        url: "https://news.site/article-22",
        title: "Regional news reports the claim",
        domain: "news.site",
        published: "2023-01-12T09:00:00Z",
        snippet: "A news outlet that picked up the story and summarized the claim.",
        confidence: 0.78,
      },
      {
        id: `r-${Math.random().toString(36).slice(2, 8)}`,
        url: "https://blog.example/post-333",
        title: "Opinion blog referencing the claim",
        domain: "blog.example",
        published: "2023-02-02T10:00:00Z",
        snippet: "A blog post offering opinion and citing earlier sources.",
        confidence: 0.61,
      },
    ];
    return Array.from({ length: n }).map((_, i) => ({ ...base[i % base.length], id: `r-${Date.now()}-${i}` }));
  }

  function subscribeToJob(jobId: string, onUpdate: (data: { status: JobStatus; progress?: number; partial?: ResultItem[] }) => void) {
    let localProgress = 0;
    const interval = window.setInterval(() => {
      localProgress += 9 + Math.round(Math.random() * 8);
      if (localProgress >= 100) {
        onUpdate({ status: "completed", progress: 100, partial: generateResults(6) });
        window.clearInterval(interval);
      } else {
        const partial = Math.random() > 0.55 ? generateResults(1) : [];
        onUpdate({ status: "processing", progress: Math.min(localProgress, 99), partial });
      }
    }, 650 + Math.random() * 450);
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
    setProgress(0);
    setJobId(null);
    setStatus("queued");

    try {
      const { jobId } = await createJob();
      setJobId(jobId);
      const handle = subscribeToJob(jobId, (update) => {
        setStatus(update.status);
        if (typeof update.progress === "number") setProgress(update.progress);
        if (update.partial && update.partial.length) {
          setResults((s) => {
            const urls = new Set(s.map((r) => r.url));
            const merged = [...s];
            for (const it of update.partial!) if (!urls.has(it.url)) merged.push(it);
            merged.sort((a, b) => new Date(a.published).getTime() - new Date(b.published).getTime());
            return merged;
          });
        }
        if (update.status === "completed") {
          const final = generateResults(8).sort((a, b) => new Date(a.published).getTime() - new Date(b.published).getTime());
          setTimeout(() => {
            setResults(final);
            setProgress(100);
            setIsSearching(false);
          }, 320);
        }
      });
      subscriptionRef.current = handle;
    } catch (err: any) {
      setError(err?.message || "Unknown error");
      setIsSearching(false);
      setStatus("failed");
    }
  }

  // cancel logic (mock)
  // async function handleCancel() {
  //   if (!jobId) return;
  //   if (subscriptionRef.current) {
  //     window.clearInterval(subscriptionRef.current);
  //     subscriptionRef.current = null;
  //   }

  //   setStatus("failed");
  //   setIsSearching(false);
  //   setProgress(0);
  //   setError("Search cancelled by user.");
  // }

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
      {/* Top hero header */}
      <header className="sticky top-0 z-40 border-b border-gray-300 dark:border-slate-700 bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-3xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
              IOT
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">
                Information Origin Tracker
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Provenance & origin tracker for online claims
              </div>
            </div>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      {/* Main layout */}
      <section className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <SearchPanel
            input={input}
            setInput={setInput}
            onSearch={handleSearch}
            // onCancel={handleCancel}
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
      
      {/* Snapshot modal (no animations) */}
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
