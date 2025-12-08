"use client";

import { ResultItem, AnalysisSection } from "@/types/types";
import React, { useMemo } from "react";

type Props = {
    results: ResultItem[];
    avgConfidence: number;
    analysisSections: AnalysisSection[];
    selectedSentence: string | null;
    onSentenceSelect: (sentence: string | null) => void;
};

export default function TimelinePanel({ results, avgConfidence }: Props) {

    // Identify Key Milestones
    const milestones = useMemo(() => {
        if (results.length === 0) return null;

        // Sort by Date
        const sortedByDate = [...results].sort((a, b) => new Date(a.published).getTime() - new Date(b.published).getTime());

        // Sort by Confidence
        const sortedByTrust = [...results].sort((a, b) => b.confidence - a.confidence);

        const origin = sortedByDate[0];
        const latest = sortedByDate[sortedByDate.length - 1];
        const trusted = sortedByTrust[0];

        return { origin, latest, trusted };
    }, [results]);

    if (!milestones) return null;

    const { origin, latest, trusted } = milestones;

    // Helper to check if Trusted is unique (not same as Origin or Latest)
    const isTrustedUnique = trusted.id !== origin.id && trusted.id !== latest.id;

    return (
        <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl p-6 border border-slate-200/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/50 sticky top-24">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
                    <h4 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        The Story Arc
                    </h4>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                    Forensic path from origin to present
                </div>
            </div>


            <div className="relative pl-4 space-y-8">


                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-slate-200 dark:border-slate-700"></div>

                {/* THE SPARK (Origin) */}
                <div className="relative z-10">
                    <div className="absolute -left-3 top-0 w-8 h-8 rounded-full bg-amber-100 border-4 border-white flex items-center justify-center text-lg shadow-sm dark:bg-amber-900/50 dark:border-slate-800">
                        ⚡
                    </div>
                    <div className="ml-8">
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1 dark:text-amber-400">The Spark (Origin)</div>
                        <a
                            href={origin.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block group bg-white border border-slate-200/60 p-3 rounded-xl hover:shadow-md hover:border-amber-300 transition-all dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-amber-500/30"
                        >
                            <div className="text-[10px] text-slate-400 mb-1">{new Date(origin.published).toLocaleDateString()}</div>
                            <div className="text-xs font-medium text-slate-800 line-clamp-2 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-400">
                                {origin.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <img src={`https://www.google.com/s2/favicons?domain=${origin.domain}`} alt="" className="w-3 h-3 opacity-60" />
                                <span className="text-[10px] text-slate-500">{origin.domain}</span>
                            </div>
                        </a>
                    </div>
                </div>

                {/*  THE VERIFICATION (Highest Confidence) - Only show if unique */}
                {isTrustedUnique && (
                    <div className="relative z-10">
                        <div className="absolute -left-3 top-0 w-8 h-8 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center text-lg shadow-sm dark:bg-emerald-900/50 dark:border-slate-800">
                            🛡️
                        </div>
                        <div className="ml-8">
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 dark:text-emerald-400">Top Authority</div>
                            <a
                                href={trusted.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block group bg-white border border-slate-200/60 p-3 rounded-xl hover:shadow-md hover:border-emerald-300 transition-all dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-emerald-500/30"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-slate-400">{new Date(trusted.published).toLocaleDateString()}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold dark:bg-emerald-900/50 dark:text-emerald-300">
                                        {Math.round(trusted.confidence * 100)}% TRUST
                                    </span>
                                </div>
                                <div className="text-xs font-medium text-slate-800 line-clamp-2 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                                    {trusted.title}
                                </div>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <img src={`https://www.google.com/s2/favicons?domain=${trusted.domain}`} alt="" className="w-3 h-3 opacity-60" />
                                    <span className="text-[10px] text-slate-500">{trusted.domain}</span>
                                </div>
                            </a>
                        </div>
                    </div>
                )}

                <div className="relative z-10">
                    <div className="absolute -left-3 top-0 w-8 h-8 rounded-full bg-cyan-100 border-4 border-white flex items-center justify-center text-lg shadow-sm dark:bg-cyan-900/50 dark:border-slate-800">
                        📡
                    </div>
                    <div className="ml-8">
                        <div className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-1 dark:text-cyan-400">Most Recent</div>
                        <a
                            href={latest.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block group bg-white border border-slate-200/60 p-3 rounded-xl hover:shadow-md hover:border-cyan-300 transition-all dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-cyan-500/30"
                        >
                            <div className="text-[10px] text-slate-400 mb-1">{new Date(latest.published).toLocaleDateString()}</div>
                            <div className="text-xs font-medium text-slate-800 line-clamp-2 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                                {latest.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <img src={`https://www.google.com/s2/favicons?domain=${latest.domain}`} alt="" className="w-3 h-3 opacity-60" />
                                <span className="text-[10px] text-slate-500">{latest.domain}</span>
                            </div>
                        </a>
                    </div>
                </div>

            </div>


        </div>
    );
}