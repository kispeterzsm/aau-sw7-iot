"use client";

import { JobStatus, ViewMode } from "@/types/types";
import React from "react";

type Props = {
    input: string;
    setInput: (v: string) => void;
    onSearch: (e?: React.FormEvent) => Promise<void> | void;
    onCancel?: () => Promise<void> | void;
    isSearching: boolean;
    progress: number;
    status?: JobStatus | null;
    error?: string | null;
    jobId?: string | null;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
};

export default function SearchPanel({
    input,
    setInput,
    onSearch,
    onCancel,
    isSearching,
    progress,
    status,
    error,
    jobId,
    viewMode,
    onViewModeChange,
}: Props) {
    return (
        <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl p-6 border border-slate-200/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/50 sticky top-24">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Trace Origin
                </h2>
            </div>

            <p className="text-sm text-slate-600 mt-2 ml-11 dark:text-slate-400">
                Analyze claims and uncover their information trail.
            </p>

            <form onSubmit={onSearch} className="mt-6 space-y-5">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide dark:text-slate-300">
                            Information to Trace
                        </label>
                        <span className={`text-xs font-mono ${input.length > 500
                                ? 'text-amber-400'
                                : input.length > 300
                                    ? 'text-emerald-400'
                                    : 'text-slate-500'
                            }`}>
                            {input.length}
                        </span>
                    </div>


                    <div className="relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Paste a claim, sentence, paragraph, or URL to trace its origins across the web..."
                            className="w-full min-h-[140px] p-4 pr-12 rounded-[12px] border border-slate-300 bg-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-sm text-slate-900 placeholder-slate-400 resize-none backdrop-blur-sm transition-all group-hover:border-slate-300/70 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                        <div className="absolute top-3 right-3 text-2xl pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity">
                            🔍
                        </div>
                    </div>


                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>Longer inputs provide better context for tracing</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">

                    <button
                        type="submit"
                        disabled={isSearching || !input.trim()}
                        className="cursor-pointer col-span-2 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg disabled:cursor-not-allowed transition-all hover:shadow-emerald-500/30 hover:shadow-md "
                    >
                        {isSearching ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm font-semibold">Tracing...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-sm font-semibold">Trace</span>
                            </>
                        )}
                    </button>


                    <div className="relative group">
                        <button
                            type="button"
                            className="cursor-pointer w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all backdrop-blur-sm group-hover:border-slate-300"
                        >
                            ✨
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 backdrop-blur-sm dark:bg-slate-800 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => setInput('The Earth is flat')}
                                className="cursor-pointer w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 hover:text-emerald-400 transition-colors border-b border-slate-200 first:rounded-t-xl dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                📝 Text Example
                            </button>
                            <button
                                type="button"
                                onClick={() => setInput('https://www.bbc.com/news/articles/cyr70zznpjxo')}
                                className="cursor-pointer w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 hover:text-emerald-400 transition-colors last:rounded-b-xl dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                🔗 URL Example
                            </button>
                        </div>
                    </div>
                </div>


                {error && (
                    <div className="p-4 bg-gradient-to-r from-red-100 to-red-50 border border-red-200 rounded-xl backdrop-blur-sm animate-pulse dark:from-red-900/20 dark:to-red-900/10 dark:border-red-500/40">
                        <div className="flex items-start gap-3">
                            <span className="text-red-600 text-lg mt-0.5 flex-shrink-0">⚠️</span>
                            <div>
                                <div className="text-sm font-semibold text-red-700 mb-0.5 dark:text-red-300">Error</div>
                                <div className="text-sm text-red-700/90 dark:text-red-300/90">{error}</div>
                            </div>
                        </div>
                    </div>
                )}


                <div className="space-y-4 border-t border-slate-200/50 pt-5 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide dark:text-slate-300">
                            🔄 Trace Progress
                        </div>
                        <div className="text-xs font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200/50 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50">
                            {status ?? "—"}
                        </div>
                    </div>


                    <div className="space-y-2">
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-200/50 shadow-inner dark:bg-slate-700">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 transition-all duration-300 rounded-full shadow-lg shadow-emerald-500/50 relative overflow-hidden"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                            <span>Completion</span>
                            <span className="font-mono font-semibold text-emerald-600">{Math.round(progress)}%</span>
                        </div>
                    </div>


                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/30 rounded-lg p-3 backdrop-blur-sm dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-500/30">
                            <div className="text-xs text-emerald-700/70 mb-2 font-semibold uppercase tracking-wide">Workers</div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    {[...Array(4)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-emerald-400"
                                            style={{
                                                animation: `pulse ${0.8 + i * 0.1}s ease-in-out infinite`
                                            }}
                                        ></div>
                                    ))}
                                </div>
                                <span className="text-sm font-bold text-emerald-700">4</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200/30 rounded-lg p-3 backdrop-blur-sm dark:from-cyan-900/20 dark:to-cyan-900/10 dark:border-cyan-500/30">
                            <div className="text-xs text-cyan-700/70 mb-2 font-semibold uppercase tracking-wide">Queue</div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-cyan-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
                                </svg>
                                <span className="text-sm font-bold text-cyan-700">12</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>


            <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/30 rounded-xl backdrop-blur-sm dark:from-violet-500/10 dark:to-purple-500/10 dark:border-violet-500/30">
                <div className="flex items-start gap-3">
                    <span className="text-violet-600 text-lg flex-shrink-0">💡</span>
                    <div>
                        <div className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-1 dark:text-violet-300">Pro Tip</div>
                        <span className="text-xs text-violet-700/90 leading-relaxed dark:text-violet-300/90">
                            Specific claims work best. Longer inputs take more time but provide better contextual analysis.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
