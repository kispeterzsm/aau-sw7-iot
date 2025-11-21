"use client";

import { ResultItem, ViewMode } from "@/types/types";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
const UNAUTHENTICATED_LIMIT = 10;

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
    const { data: session, status } = useSession();
    const isAuthenticated = !!session;

    const displayResults = isAuthenticated ? results : results.slice(0, UNAUTHENTICATED_LIMIT);

    const totalPages = Math.ceil(displayResults.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const currentResults = isAuthenticated
        ? displayResults.slice(startIdx, endIdx)
        : displayResults;

    React.useEffect(() => {
        setCurrentPage(1);
    }, [results.length, isAuthenticated]);

    const getSourceRank = (index: number) => {
        const suffixes = ['st', 'nd', 'rd'];
        const v = index % 100;
        return index + (suffixes[(v - 20) % 10] || suffixes[v] || 'th');
    };

    return (
        <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl p-6 border border-slate-200/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/50">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-600 dark:to-cyan-600"></div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-600 dark:to-cyan-600 bg-clip-text text-transparent">
                            Discovered Sources
                        </h3>
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 ml-3">
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
                    <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 dark:from-emerald-100/50 dark:to-cyan-100/50 border border-emerald-500/30 dark:border-emerald-300/30 rounded-full text-sm font-bold text-emerald-600 dark:text-emerald-300">
                        {displayResults.length}
                        {!isAuthenticated && results.length > UNAUTHENTICATED_LIMIT && '+'}
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {displayResults.length === 1 ? 'source' : 'sources'}
                        {!isAuthenticated && results.length > UNAUTHENTICATED_LIMIT && ' shown'}
                    </span>
                </div>
            </div>

            {!isAuthenticated && results.length > UNAUTHENTICATED_LIMIT && (
                <div className="mb-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-100/30 dark:to-orange-100/30 border border-amber-200/30 dark:border-amber-400/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-amber-600 dark:text-amber-400 text-lg mt-0.5">🔒</span>
                        <div className="flex-1">
                            <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
                                Limited Preview
                            </div>
                            <div className="text-sm text-amber-800 dark:text-amber-100 mb-3">
                                You're viewing {UNAUTHENTICATED_LIMIT} of {results.length} sources. Sign up to unlock full access to all sources and advanced features.
                            </div>
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-lg hover:shadow-amber-500/25 dark:shadow-amber-600/25"
                            >
                                <span>✨</span>
                                Sign Up to Unlock More
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* View Mode Filter */}
            <div className="mb-5 space-y-2 border-b border-slate-200/50 dark:border-slate-700/50 pb-5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Filter Results By
                </label>
                <div className="flex gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                    {(['all', 'news', 'websites'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => onViewModeChange(mode)}
                            className={`flex-1 cursor-pointer px-3 py-2 text-xs font-semibold rounded-md transition-all ${viewMode === mode
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-600/30'
                                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/30 dark:hover:bg-slate-800/30'
                                }`}
                        >
                            {mode === 'all' ? '📋 All' : mode === 'news' ? '📰 News' : '🌐 Web'}
                        </button>
                    ))}
                </div>
            </div>


            {selectedSentence && (
                <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-100/30 dark:to-cyan-100/30 border border-blue-200/30 dark:border-blue-400/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-blue-600 dark:text-blue-400 text-lg mt-0.5">🔍</span>
                        <div>
                            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
                                Filtering Sources
                            </div>
                            <div className="text-sm text-blue-800 dark:text-blue-100">
                                "{selectedSentence}"
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4 max-h-[90vh] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-slate-200/30 dark:scrollbar-thumb-emerald-300 dark:scrollbar-track-slate-700/30">
                {displayResults.length === 0 && !isSearching && (
                    <div className="rounded-xl border border-dashed border-slate-200/30 dark:border-slate-700/30 p-12 text-center">
                        <div className="text-4xl mb-3">🔎</div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            No traces yet
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                            Submit a claim above to start the information tracing
                        </p>
                    </div>
                )}

                {/* Result Items */}
                {currentResults.map((r, index) => {
                    const globalIndex = isAuthenticated ? startIdx + index : index;
                    return (
                        <article
                            key={r.id}
                            className="group relative bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 shadow-sm hover:shadow-lg hover:border-slate-300/50 dark:hover:border-slate-600/50 transition-all duration-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 backdrop-blur-sm"
                        >
                            <div className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 dark:from-emerald-200/50 dark:to-cyan-200/50 border border-emerald-500/30 dark:border-emerald-400/50 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                #{getSourceRank(globalIndex + 1)}
                            </div>

                            <div className="flex items-start gap-2">

                                <div className="flex-shrink-0 mt-1">
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${r.domain}`}
                                        alt={r.domain}
                                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-400 shadow-md"
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
                                            className="pr-8 font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2 flex-1"
                                        >
                                            {r.title}
                                        </a>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="text-xs text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-slate-800 dark:text-slate-200">{r.domain}</span>
                                        <span className="text-slate-400 dark:text-slate-500">•</span>
                                        <span>{new Date(r.published).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}</span>
                                        <span className="text-slate-400 dark:text-slate-500">•</span>
                                        <span className="font-mono">{Math.max(1, Math.floor((Date.now() - new Date(r.published).getTime()) / (1000 * 60 * 60 * 24)))} days ago</span>

                                        {/* Type Badge */}
                                        {r.type && (
                                            <>
                                                <span className="text-slate-400 dark:text-slate-500">•</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.type === 'news'
                                                    ? 'bg-blue-100/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200/30 dark:border-blue-500/30'
                                                    : 'bg-green-100/50 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-200/30 dark:border-green-500/30'
                                                    }`}>
                                                    {r.type === 'news' ? '📰 News' : '🌐 Website'}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Snippet */}
                                    <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 mb-4 line-clamp-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200/30 dark:border-slate-700/30">
                                        {r.snippet}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <a
                                            href={r.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-100/30 dark:to-cyan-100/30 border border-emerald-200/30 dark:border-emerald-400/50 hover:border-emerald-400/50 dark:hover:border-emerald-400/70 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:bg-gradient-to-r hover:from-emerald-100/20 hover:to-cyan-100/20 dark:hover:from-emerald-100/50 dark:hover:to-cyan-100/50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Visit Source
                                        </a>

                                        <button
                                            onClick={() => copyLink(r.url)}
                                            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200/50 dark:border-slate-400/50 hover:border-slate-300/50 dark:hover:border-slate-400/70 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 backdrop-blur-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            {copied === r.url ? 'Copied!' : 'Copy'}
                                        </button>

                                        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
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
                    <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <svg className="animate-spin h-4 w-4 text-emerald-600 dark:text-emerald-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                Discovering sources... Results appear in real-time
                            </span>
                        </div>
                    </div>
                )}
            </div>


            {isAuthenticated && displayResults.length > ITEMS_PER_PAGE ? (
                <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                        Showing <span className="font-semibold text-slate-800 dark:text-slate-100">{startIdx + 1}</span> to <span className="font-semibold text-slate-800 dark:text-slate-100">{Math.min(endIdx, displayResults.length)}</span> of <span className="font-semibold text-slate-800 dark:text-slate-100">{displayResults.length}</span> results
                    </div>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 cursor-pointer py-2 rounded-lg border border-slate-200/50 dark:border-slate-400/50 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            ← Prev
                        </button>


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
                                        className={`w-8 h-8 cursor-pointer rounded-lg text-xs font-semibold transition-all ${isActive
                                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white shadow-lg'
                                            : 'border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
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
                            className="px-3 cursor-pointer py-2 rounded-lg border border-slate-200/50 dark:border-slate-400/50 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            ) : <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-700/50 text-center">
                <div className="mb-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                        🔍 Want to see all sources and advanced features?
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Unlock complete access to our Forensic Analysis Engine
                    </p>
                </div>
                <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 dark:shadow-emerald-600/25"
                >
                    <span>🚀</span>
                    Sign Up to Unlock Full Access
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    Already have an account?{' '}
                    <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>}

        </div>
    );
}