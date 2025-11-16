"use client";

import { ResultItem, ViewMode } from "@/types/types";
import React, { useState } from "react";

type Props = {
    results: ResultItem[];
    isSearching: boolean;
    copyLink: (url: string) => Promise<void> | void;
    copied?: string | null;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    selectedSentence: string | null;
};

const ITEMS_PER_PAGE = 5;

export default function ResultsList({ 
    results, 
    isSearching, 
    copyLink, 
    copied, 
    viewMode, 
    onViewModeChange,
    selectedSentence 
}: Props) {
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate pagination
    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const currentResults = results.slice(startIdx, endIdx);

    // Reset to page 1 when results change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [results.length]);

    // Calculate ordinal position
    const getSourceRank = (index: number) => {
        const suffixes = ['st', 'nd', 'rd'];
        const v = index % 100;
        return index + (suffixes[(v - 20) % 10] || suffixes[v] || 'th');
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-700/50 dark:from-white dark:via-slate-50 dark:to-white dark:border-slate-200/50">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-600 dark:to-cyan-600"></div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-600 dark:to-cyan-600 bg-clip-text text-transparent">
                            Discovered Sources
                        </h3>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-600 ml-3">
                        {selectedSentence 
                            ? `Sources mentioning "${selectedSentence.substring(0, 30)}..."` 
                            : results.length === 0 
                                ? 'Submit a claim to begin tracing'
                                : 'Ordered by first appearance'
                        }
                    </div>
                </div>
                
                {/* Counter Badge */}
                <div className="flex flex-col items-end">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 dark:from-emerald-100/50 dark:to-cyan-100/50 border border-emerald-500/30 dark:border-emerald-300/30 rounded-full text-sm font-bold text-emerald-400 dark:text-emerald-600">
                        {results.length}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-600 mt-1">
                        {results.length === 1 ? 'source' : 'sources'}
                    </span>
                </div>
            </div>

            {/* View Mode Filter - MOVED HERE */}
            <div className="mb-5 space-y-2 border-b border-slate-700/50 dark:border-slate-200/50 pb-5">
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-700 uppercase tracking-wide">
                    Filter Results By
                </label>
                <div className="flex gap-2 p-1 bg-slate-800/50 dark:bg-slate-100/50 rounded-lg border border-slate-700/50 dark:border-slate-200/50 backdrop-blur-sm">
                    {(['all', 'news', 'websites'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => onViewModeChange(mode)}
                            className={`flex-1 cursor-pointer px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                                viewMode === mode
                                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-600/30'
                                    : 'text-slate-300 dark:text-slate-700 hover:text-slate-100 dark:hover:text-slate-900 hover:bg-slate-700/30 dark:hover:bg-slate-200/30'
                            }`}
                        >
                            {mode === 'all' ? '📋 All' : mode === 'news' ? '📰 News' : '🌐 Web'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Sentence Banner */}
            {selectedSentence && (
                <div className="mb-5 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-100/30 dark:to-cyan-100/30 border border-blue-400/30 dark:border-blue-400/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-blue-400 dark:text-blue-600 text-lg mt-0.5">🔍</span>
                        <div>
                            <div className="text-xs font-semibold text-blue-300 dark:text-blue-700 uppercase tracking-wide mb-1">
                                Filtering Sources
                            </div>
                            <div className="text-sm text-blue-200 dark:text-blue-800">
                                "{selectedSentence}"
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Container with Custom Scrollbar */}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-slate-700/30 dark:scrollbar-thumb-emerald-300 dark:scrollbar-track-slate-200/30">
                {results.length === 0 && !isSearching && (
                    <div className="rounded-xl border border-dashed border-slate-600/30 dark:border-slate-300/30 p-12 text-center">
                        <div className="text-4xl mb-3">🔎</div>
                        <p className="text-sm text-slate-400 dark:text-slate-600">
                            No traces yet
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-600 mt-2">
                            Submit a claim above to start the information tracing
                        </p>
                    </div>
                )}

                {/* Result Items */}
                {currentResults.map((r, index) => {
                    const globalIndex = startIdx + index;
                    return (
                        <article 
                            key={r.id} 
                            className="group relative bg-slate-800/30 dark:bg-slate-100/30 border border-slate-700/50 dark:border-slate-300/50 rounded-xl p-4 shadow-sm hover:shadow-lg hover:border-slate-600/50 dark:hover:border-slate-400/50 transition-all duration-200 hover:bg-slate-800/50 dark:hover:bg-slate-100/50 backdrop-blur-sm"
                        >
                            {/* Rank Badge */}
                            <div className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 dark:from-emerald-200/50 dark:to-cyan-200/50 border border-emerald-500/30 dark:border-emerald-400/50 rounded-full text-[11px] font-bold text-emerald-300 dark:text-emerald-700">
                                #{getSourceRank(globalIndex + 1)}
                            </div>

                            <div className="flex items-start gap-2">
                                {/* Favicon */}
                                <div className="flex-shrink-0 mt-1">
                                    <img 
                                        src={`https://www.google.com/s2/favicons?domain=${r.domain}`} 
                                        alt={r.domain} 
                                        className="w-6 h-6 rounded-lg bg-slate-700 dark:bg-slate-300 border border-slate-600 dark:border-slate-400 shadow-md"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/%3E%3C/svg%3E';
                                        }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Title and Link */}
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <a 
                                            href={r.url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="pr-8 font-bold text-sm text-slate-100 dark:text-slate-900 hover:text-emerald-400 dark:hover:text-emerald-600 transition-colors line-clamp-2 flex-1"
                                        >
                                            {r.title}
                                        </a>
                                        
                                        {/* Confidence Badge */}
                                        {/* <div className="flex-shrink-0 text-right">
                                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 dark:from-emerald-100/50 dark:to-cyan-100/50 border border-emerald-400/30 dark:border-emerald-400/50 text-emerald-300 dark:text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-600 animate-pulse"></div>
                                                {(r.confidence * 100).toFixed(0)}%
                                            </div>
                                        </div> */}
                                    </div>

                                    {/* Meta Info */}
                                    <div className="text-xs text-slate-400 dark:text-slate-600 mb-3 flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-slate-300 dark:text-slate-700">{r.domain}</span>
                                        <span className="text-slate-600 dark:text-slate-400">•</span>
                                        <span>{new Date(r.published).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}</span>
                                        <span className="text-slate-600 dark:text-slate-400">•</span>
                                        <span className="font-mono">{Math.max(1, Math.floor((Date.now() - new Date(r.published).getTime()) / (1000 * 60 * 60 * 24)))} days ago</span>
                                        
                                        {/* Type Badge */}
                                        {r.type && (
                                            <>
                                                <span className="text-slate-600 dark:text-slate-400">•</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                    r.type === 'news' 
                                                        ? 'bg-blue-500/20 dark:bg-blue-100/50 text-blue-300 dark:text-blue-700 border border-blue-500/30 dark:border-blue-400/50' 
                                                        : 'bg-green-500/20 dark:bg-green-100/50 text-green-300 dark:text-green-700 border border-green-500/30 dark:border-green-400/50'
                                                }`}>
                                                    {r.type === 'news' ? '📰 News' : '🌐 Website'}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Snippet */}
                                    <p className="text-sm leading-relaxed text-slate-300 dark:text-slate-700 mb-4 line-clamp-3 bg-slate-900/30 dark:bg-slate-100/20 p-3 rounded-lg border border-slate-700/30 dark:border-slate-300/30">
                                        {r.snippet}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <a 
                                            href={r.url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 dark:from-emerald-100/30 dark:to-cyan-100/30 border border-emerald-500/30 dark:border-emerald-400/50 hover:border-emerald-400/50 dark:hover:border-emerald-400/70 rounded-lg text-xs font-medium text-emerald-300 dark:text-emerald-700 hover:text-emerald-200 dark:hover:text-emerald-800 transition-all hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-cyan-500/20 dark:hover:from-emerald-100/50 dark:hover:to-cyan-100/50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Visit Source
                                        </a>

                                        <button 
                                            onClick={() => copyLink(r.url)} 
                                            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-600/50 dark:border-slate-400/50 hover:border-slate-500/50 dark:hover:border-slate-400/70 rounded-lg text-xs font-medium text-slate-300 dark:text-slate-700 hover:text-slate-100 dark:hover:text-slate-900 transition-all hover:bg-slate-700/50 dark:hover:bg-slate-200/50 backdrop-blur-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            {copied === r.url ? 'Copied!' : 'Copy'}
                                        </button>

                                        <div className="text-xs text-slate-500 dark:text-slate-600 flex items-center gap-1">
                                            <span>🔗</span>
                                            <span className="font-mono">{r.url.split('/')[2]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}

                {/* Loading State */}
                {isSearching && (
                    <div className="rounded-xl p-4 bg-slate-800/30 dark:bg-slate-100/30 border border-slate-700/50 dark:border-slate-300/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <svg className="animate-spin h-4 w-4 text-emerald-400 dark:text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm text-slate-400 dark:text-slate-600">
                                Discovering sources... Results appear in real-time
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {results.length > ITEMS_PER_PAGE && (
                <div className="mt-6 pt-5 border-t border-slate-700/50 dark:border-slate-200/50 flex items-center justify-between">
                    <div className="text-xs text-slate-400 dark:text-slate-600">
                        Showing <span className="font-semibold text-slate-300 dark:text-slate-700">{startIdx + 1}</span> to <span className="font-semibold text-slate-300 dark:text-slate-700">{Math.min(endIdx, results.length)}</span> of <span className="font-semibold text-slate-300 dark:text-slate-700">{results.length}</span> results
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 cursor-pointer py-2 rounded-lg border border-slate-700/50 dark:border-slate-300/50 text-slate-300 dark:text-slate-700 hover:text-slate-100 dark:hover:text-slate-900 hover:bg-slate-800/50 dark:hover:bg-slate-100/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            ← Prev
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => {
                                const page = i + 1;
                                const isActive = page === currentPage;
                                const isNear = Math.abs(page - currentPage) <= 1;
                                const isEnd = page === totalPages || page === 1;

                                if (!isActive && !isNear && !isEnd) return null;

                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 cursor-pointer rounded-lg text-xs font-semibold transition-all ${
                                            isActive
                                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white shadow-lg'
                                                : 'border border-slate-700/50 dark:border-slate-300/50 text-slate-400 dark:text-slate-600 hover:bg-slate-800/50 dark:hover:bg-slate-100/50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 cursor-pointer py-2 rounded-lg border border-slate-700/50 dark:border-slate-300/50 text-slate-300 dark:text-slate-700 hover:text-slate-100 dark:hover:text-slate-900 hover:bg-slate-800/50 dark:hover:bg-slate-100/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}