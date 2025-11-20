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

export default function TimelinePanel({ 
    results, 
    avgConfidence, 
    analysisSections, 
    selectedSentence, 
    onSentenceSelect 
}: Props) {
    const earliestDate = results[0] ? new Date(results[0].published) : null;
    const latestDate = results.length > 0 ? new Date(results[results.length - 1].published) : null;
    const timeSpan = earliestDate && latestDate ? 
        Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Enhanced: Calculate timeline positions for visualization
    const timelineData = useMemo(() => {
        if (!earliestDate || !latestDate || timeSpan === 0) return [];
        
        return results.map(result => {
            const resultDate = new Date(result.published);
            const position = ((resultDate.getTime() - earliestDate.getTime()) / 
                            (latestDate.getTime() - earliestDate.getTime())) * 100;
            return { result, position };
        });
    }, [results, earliestDate, latestDate, timeSpan]);

    // Group results by spread type
    const spreadAnalysis = useMemo(() => {
        if (timeSpan === 0) return { early: 0, middle: 0, late: 0 };
        
        const earlyThreshold = timeSpan * 0.33;
        const lateThreshold = timeSpan * 0.66;
        
        let early = 0, middle = 0, late = 0;
        
        results.forEach(result => {
            const resultDate = new Date(result.published);
            const daysSinceEarliest = (resultDate.getTime() - earliestDate!.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceEarliest <= earlyThreshold) early++;
            else if (daysSinceEarliest <= lateThreshold) middle++;
            else late++;
        });
        
        return { early, middle, late };
    }, [results, earliestDate, timeSpan]);

    return (
        <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl p-6 border border-slate-200/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/50 sticky top-24">
            {/* Header */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
                    <h4 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Information Tracing
                    </h4>
                </div>
                <div className="text-xs text-slate-700 mt-1 dark:text-slate-300">
                    {selectedSentence ? "Sentence Source Analysis" : "Timeline & Spread Analysis"}
                </div>
            </div>

            <div className="mt-6 space-y-6">
                {/* Enhanced Interactive Timeline Visualization */}
                <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide dark:text-slate-300">
                        Information Flow Timeline
                    </div>
                    
                    {/* Main Timeline Visualization */}
                    <div className="relative bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-4 overflow-hidden border border-slate-200/30 dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-700 dark:border-slate-600/30">
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 animate-pulse"></div>
                        </div>

                        <svg width="100%" height="60" viewBox="0 0 300 130" className="relative z-10 block">
                            {/* Animated connection line */}
                            <defs>
                                <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                                    <stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            
                            {/* Main timeline line with gradient */}
                            <line x1="20" y1="55" x2="280" y2="55" stroke="url(#timelineGradient)" strokeWidth="3" filter="url(#glow)" />
                            
                            {/* Earliest marker - Origin point */}
                            <g>
                                <circle cx="50" cy="55" r="10" fill="#10b981" opacity="0.2" />
                                <circle cx="50" cy="55" r="8" fill="#10b981" />
                                <circle cx="50" cy="55" r="6" fill="#86efac" opacity="0.5" />
                                <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                            </g>
                            <text x="40" y="90" fontSize="20" textAnchor="middle" fill="#86efac" fontWeight="bold">
                                Earliest
                            </text>

                            {/* Spread marker - Peak distribution */}
                            <g>
                                <circle cx="150" cy="55" r="10" fill="#ef4444" opacity="0.2" />
                                <circle cx="150" cy="55" r="8" fill="#ef4444" />
                                <circle cx="150" cy="55" r="5" fill="#fca5a5" opacity="0.6" />
                            </g>
                            <text x="150" y="90" fontSize="20" textAnchor="middle" fill="#fca5a5" fontWeight="bold">
                                Peak Spread
                            </text>

                            {/* Latest marker - Current state */}
                            <g>
                                <circle cx="250" cy="55" r="10" fill="#f59e0b" opacity="0.2" />
                                <circle cx="250" cy="55" r="8" fill="#f59e0b" />
                                <circle cx="250" cy="55" r="6" fill="#fcd34d" opacity="0.5" />
                                <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                            </g>
                            <text x="250" y="90" fontSize="20" textAnchor="middle" fill="#fcd34d" fontWeight="bold">
                                Latest
                            </text>
                        </svg>

                        {/* Spread Statistics Cards */}
                        <div className="grid grid-cols-3 gap-2 mt-6 relative z-20">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/30 rounded-lg p-3 text-center items-center flex flex-col dark:from-emerald-900/40 dark:to-emerald-900/20 dark:border-emerald-500/30">
                                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{spreadAnalysis.early}</div>
                                <div className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">Early Phase</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200/30 rounded-lg text-center items-center flex flex-col justify-center dark:from-red-900/40 dark:to-red-900/20 dark:border-red-500/30">
                                <div className="text-2xl font-bold text-red-700 dark:text-red-400">{spreadAnalysis.middle}</div>
                                <div className="text-xs text-red-600 dark:text-red-300 mt-1">Spreading</div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/30 rounded-lg p-3 text-center items-center flex flex-col dark:from-amber-900/40 dark:to-amber-900/20 dark:border-amber-500/30">
                                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{spreadAnalysis.late}</div>
                                <div className="text-xs text-amber-600 dark:text-amber-300 mt-1">Recent</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analyzed Sentences List */}
                {analysisSections.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide dark:text-slate-300">
                            Traced Sentences
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-3">
                            {analysisSections.map((section, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSentenceSelect(
                                        selectedSentence === section.sentence ? null : section.sentence
                                    )}
                                    className={`w-full text-left p-3 rounded-xl text-xs transition-all duration-200 border backdrop-blur-sm ${
                                        selectedSentence === section.sentence
                                            ? 'bg-gradient-to-r from-emerald-100/50 to-cyan-100/50 border-emerald-400/50 shadow-lg shadow-emerald-200'
                                            : 'bg-slate-50 border-slate-200/30 hover:bg-slate-100/50 hover:border-slate-300/50 dark:bg-slate-800/30 dark:border-slate-700/30 dark:hover:bg-slate-700/50'
                                    }`}
                                >
                                    <div className="font-medium text-slate-900 dark:text-slate-200 truncate text-xs">{section.search_term}</div>
                                    <div className="text-slate-600 dark:text-slate-400 mt-2 truncate text-xs leading-relaxed">
                                        {section.sentence.length > 60 
                                            ? section.sentence.substring(0, 60) + '...' 
                                            : section.sentence
                                        }
                                    </div>
                                    <div className="flex justify-between text-xs mt-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                            📰 {section.news_results.length}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded">
                                            🌐 {section.website_results.length}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Statistics Section */}
                <div className="space-y-3 border-t border-slate-200/50 pt-4 dark:border-slate-700/50">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide dark:text-slate-300">
                        Trace Statistics
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm group">
                            <span className="text-slate-600 flex items-center gap-2 dark:text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                First occurrence
                            </span>
                            <span className="font-medium text-slate-900 font-mono dark:text-slate-200">
                                {earliestDate ? earliestDate.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                }) : "—"}
                            </span>
                        </div>

                        {timeSpan > 0 && (
                            <div className="flex justify-between items-center text-sm group">
                                <span className="text-slate-600 flex items-center gap-2 dark:text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                    Propagation period
                                </span>
                                <span className="font-medium text-slate-900 font-mono dark:text-slate-200">
                                    {timeSpan} day{timeSpan !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm group">
                            <span className="text-slate-600 flex items-center gap-2 dark:text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                Top source
                            </span>
                            <a 
                                href={results[0]?.url ?? '#'} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-emerald-600 hover:text-emerald-500 font-medium truncate ml-2 max-w-[120px] hover:underline transition-colors dark:text-emerald-400"
                                title={results[0]?.domain}
                            >
                                {results[0]?.domain ?? '—'}
                            </a>
                        </div>

                        <div className="flex justify-between items-center text-sm group">
                            <span className="text-slate-600 flex items-center gap-2 dark:text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                                Confidence average
                            </span>
                            <div className="inline-flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                                        style={{ width: `${avgConfidence}%` }}
                                    ></div>
                                </div>
                                <span className="font-medium text-slate-900 font-mono w-10 text-right dark:text-slate-200">
                                    {results.length ? `${avgConfidence}%` : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/30 rounded-lg p-3 mt-2 dark:bg-slate-800/50 dark:border-slate-700/30">
                    <div className="flex items-start gap-2">
                        <span className="text-slate-500 mt-0.5 dark:text-slate-400">ℹ️</span>
                        <span className="dark:text-slate-200">
                            {selectedSentence 
                                ? "Click sentences to filter sources by origin" 
                                : "Timeline shows information spread from origin to latest discovery"
                            }
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
