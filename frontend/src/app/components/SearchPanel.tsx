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
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-700/50 sticky top-24">
            {/* Header with icon and description */}
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
            
            <p className="text-sm text-slate-400 mt-2 ml-11">
                Analyze claims and uncover their information trail.
            </p>

            <form onSubmit={onSearch} className="mt-6 space-y-5">
                {/* Input Label with Character Count */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                            Information to Trace
                        </label>
                        <span className={`text-xs font-mono ${
                            input.length > 500 
                                ? 'text-amber-400' 
                                : input.length > 300 
                                ? 'text-emerald-400' 
                                : 'text-slate-500'
                        }`}>
                            {input.length}
                        </span>
                    </div>

                    {/* Enhanced Textarea with gradient border on focus */}
                    <div className="relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Paste a claim, sentence, paragraph, or URL to trace its origins across the web..."
                            className="w-full min-h-[140px] p-4  pr-12 rounded-[12px] border border-slate-600/50 bg-slate-800/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-sm text-slate-100 placeholder-slate-500 resize-none backdrop-blur-sm transition-all group-hover:border-slate-500/50 "
                        />
                        <div className="absolute top-3 right-3 text-2xl pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity">
                            🔍
                        </div>
                    </div>

                    {/* Input Suggestion */}
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>Longer inputs provide better context for tracing</span>
                    </div>
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Primary Action - Trace Button */}
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

                    {/* Quick Action Dropdown - Example Buttons */}
                    <div className="relative group">
                        <button 
                            type="button" 
                            className="cursor-pointer w-full px-4 py-3 border border-slate-600/50 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all backdrop-blur-sm group-hover:border-slate-500"
                        >
                            ✨
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 backdrop-blur-sm">
                            <button 
                                type="button" 
                                onClick={() => setInput('The Earth is flat')} 
                                className="cursor-pointer w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-emerald-400 transition-colors border-b border-slate-700/30 first:rounded-t-xl"
                            >
                                📝 Text Example
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setInput('https://www.bbc.com/news/articles/cyr70zznpjxo')} 
                                className="cursor-pointer w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-emerald-400 transition-colors last:rounded-b-xl"
                            >
                                🔗 URL Example
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Display - Enhanced */}
                {error && (
                    <div className="p-4 bg-gradient-to-r from-red-900/20 to-red-900/10 border border-red-500/40 rounded-xl backdrop-blur-sm animate-pulse">
                        <div className="flex items-start gap-3">
                            <span className="text-red-400 text-lg mt-0.5 flex-shrink-0">⚠️</span>
                            <div>
                                <div className="text-sm font-semibold text-red-300 mb-0.5">Error</div>
                                <div className="text-sm text-red-300/90">{error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Job Status Section - Enhanced */}
                <div className="space-y-4 border-t border-slate-700/50 pt-5">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                            🔄 Trace Progress
                        </div>
                        <div className="text-xs font-mono text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                            {status ?? "—"}
                        </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="space-y-2">
                        <div className="w-full h-2.5 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50 shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 transition-all duration-300 rounded-full shadow-lg shadow-emerald-500/50 relative overflow-hidden"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>Completion</span>
                            <span className="font-mono font-semibold text-emerald-400">{Math.round(progress)}%</span>
                        </div>
                    </div>

                    {/* System Performance Indicators */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 border border-emerald-500/30 rounded-lg p-3 backdrop-blur-sm">
                            <div className="text-xs text-emerald-300/70 mb-2 font-semibold uppercase tracking-wide">Workers</div>
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
                                <span className="text-sm font-bold text-emerald-400">4</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-900/10 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm">
                            <div className="text-xs text-cyan-300/70 mb-2 font-semibold uppercase tracking-wide">Queue</div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-cyan-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
                                </svg>
                                <span className="text-sm font-bold text-cyan-400">12</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Enhanced Tip Section */}
            <div className="mt-6 p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-start gap-3">
                    <span className="text-violet-400 text-lg flex-shrink-0">💡</span>
                    <div>
                        <div className="text-xs font-semibold text-violet-300 uppercase tracking-wide mb-1">Pro Tip</div>
                        <span className="text-xs text-violet-300/90 leading-relaxed">
                            Specific claims work best. Longer inputs take more time but provide better contextual analysis.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}