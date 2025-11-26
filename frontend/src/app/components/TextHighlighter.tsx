"use client";

import { AnalysisSection } from '@/types/types';
import React from 'react';

interface Props {
    content: string;
    analysisSections: AnalysisSection[];
    selectedSentence: string | null;
    onSentenceSelect: (sentence: string) => void;
    onClose: () => void;
}

export default function TextHighlighter({
    content,
    analysisSections,
    selectedSentence,
    onSentenceSelect,
    onClose
}: Props) {
    const analyzedSentences = analysisSections.map(section => section.sentence);

    // Check if entity data from backend available
    const hasEntities = analysisSections.some(section =>
        section.entities && section.entities.length > 0
    );

    function highlightRealEntities(text: string, sections: AnalysisSection[]): string {
        let entityHighlightedText = text;

        const allEntities: Array<{ text: string, type: string, confidence: number }> = [];
        sections.forEach(section => {
            if (section.entities && Array.isArray(section.entities)) {
                allEntities.push(...section.entities);
            }
        });

        const uniqueEntities = allEntities.filter((entity, index, self) =>
            index === self.findIndex(e =>
                e.text.toLowerCase() === entity.text.toLowerCase() &&
                e.type === entity.type
            )
        );

        uniqueEntities.forEach(entity => {
            const entityClass = getEntityClass(entity.type);
            const escapedEntityText = entity.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedEntityText}\\b`, 'gi');

            entityHighlightedText = entityHighlightedText.replace(
                regex,
                `<span class="${entityClass} px-1 py-0.5 rounded border mx-0.5 cursor-help" title="${entity.type} (${Math.round(entity.confidence * 100)}% confidence)">$&</span>`
            );
        });

        return entityHighlightedText;
    }

    function getEntityClass(type: string): string {
        const classes = {
            PERSON: 'bg-red-200 dark:bg-red-800 border-red-400 dark:border-red-600 text-red-900 dark:text-red-100',
            ORGANIZATION: 'bg-green-200 dark:bg-green-800 border-green-400 dark:border-green-600 text-green-900 dark:text-green-100',
            LOCATION: 'bg-blue-200 dark:bg-blue-800 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-100',
            DATE: 'bg-yellow-200 dark:bg-yellow-800 border-yellow-400 dark:border-yellow-600 text-yellow-900 dark:text-yellow-100',
            LAW: 'bg-purple-200 dark:bg-purple-800 border-purple-400 dark:border-purple-600 text-purple-900 dark:text-purple-100',
            EVENT: 'bg-pink-200 dark:bg-pink-800 border-pink-400 dark:border-pink-600 text-pink-900 dark:text-pink-100'
        };

        return classes[type as keyof typeof classes] || 'bg-gray-200 dark:bg-gray-800 border-gray-400 text-gray-900 dark:text-gray-100';
    }

    function highlightText(text: string) {
        let highlightedText = text;

        analysisSections.forEach(section => {
            const searchTerm = section.search_term;
            const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');

            highlightedText = highlightedText.replace(
                regex,
                `<span class="bg-purple-200 dark:bg-purple-800 border border-purple-400 dark:border-purple-600 px-1 py-0.5 rounded mx-0.5 text-purple-900 dark:text-purple-100">$1</span>`
            );
        });

        if (hasEntities) {
            highlightedText = highlightRealEntities(highlightedText, analysisSections);
        }
        analyzedSentences.forEach(sentence => {
            const isSelected = sentence === selectedSentence;
            const sentenceHighlightClass = isSelected
                ? 'bg-gradient-to-r from-yellow-300 to-amber-300 dark:from-yellow-500 dark:to-amber-500 border-2 border-yellow-500 text-slate-900 hover:scale-105 hover:shadow-lg transform transition-all duration-200'
                : 'bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900 border border-blue-400 dark:border-blue-600 text-slate-900 dark:text-slate-100 hover:from-blue-300 hover:to-cyan-300 hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-200';

            if (highlightedText.includes(sentence)) {
                highlightedText = highlightedText.replace(
                    sentence,
                    `<span class="${sentenceHighlightClass} px-1 py-0.5 rounded cursor-pointer relative group" 
                          onclick="window.reactHandlers?.selectSentence('${sentence.replace(/'/g, "\\'")}')"
                          title="Click to view sources for this sentence">
                        ${sentence}
                        <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                            🔍 View sources
                        </span>
                    </span>`
                );
            }
        });

        return highlightedText;
    }

    React.useEffect(() => {
        (window as any).reactHandlers = {
            selectSentence: onSentenceSelect
        };

        return () => {
            delete (window as any).reactHandlers;
        };
    }, [onSentenceSelect]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700/50">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
                        <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Analyzed Content
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="text-sm leading-relaxed text-slate-300 space-y-4 mb-8">
                        <div
                            className="prose dark:prose-invert max-w-none text-slate-300 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
                            dangerouslySetInnerHTML={{
                                __html: highlightText(content.length > 1000 ? content : analyzedSentences.join(' '))
                            }}
                        />
                    </div>


                    <div className="mt-6 space-y-4 p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-cyan-400">🎨</span>
                            <h4 className="font-semibold text-slate-100">Highlighting Guide</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Search Terms */}
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-purple-200 dark:bg-purple-800 border border-purple-400 dark:border-purple-600 rounded flex-shrink-0 mt-0.5"></div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-200">Search Terms</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Actual terms used for web searches</div>
                                </div>
                            </div>


                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900 border border-blue-400 dark:border-blue-600 rounded flex-shrink-0 mt-0.5"></div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-200">Analyzed Sentences</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Click to filter sources</div>
                                </div>
                            </div>

                            {/* Selected Sentence */}
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-gradient-to-r from-yellow-300 to-amber-300 dark:from-yellow-500 dark:to-amber-500 border-2 border-yellow-500 rounded flex-shrink-0 mt-0.5"></div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-200">Selected Sentence</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Currently viewing sources</div>
                                </div>
                            </div>

                            {/* Entities - Conditionally shown */}
                            {hasEntities && (
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-red-200 dark:bg-red-800 border border-red-400 dark:border-red-600 rounded flex-shrink-0 mt-0.5"></div>
                                    <div>
                                        <div className="text-xs font-semibold text-slate-200">People/Places</div>
                                        <div className="text-xs text-slate-400 mt-0.5">Named entities detected</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Entity Status Notice */}
                        {!hasEntities && (
                            <div className="border-t border-slate-600/50 pt-3 mt-3">
                                <p className="text-xs text-slate-400 flex items-start gap-2">
                                    <span>ℹ️</span>
                                    <span>
                                        Entity recognition (names, places, organizations) will appear here once available from our analysis engine.
                                        Currently showing search terms and analyzed sentences.
                                    </span>
                                </p>
                            </div>
                        )}


                        <div className="border-t border-slate-600/50 pt-3 mt-3">
                            <p className="text-xs text-slate-400 flex items-start gap-2">
                                <span>💡</span>
                                <span>Click any highlighted sentence to view its sources in the results panel. This helps trace how specific claims spread across the web.</span>
                            </p>
                        </div>
                    </div>

                    {/* Analyzed Sections Quick View */}
                    {analysisSections.length > 0 && (
                        <div className="mt-6 space-y-3 p-4 bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-700/50 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-emerald-400">🔍</span>
                                <h4 className="font-semibold text-slate-100 text-sm">
                                    Traced Sentences ({analysisSections.length})
                                    {hasEntities && ` • ${analysisSections.reduce((acc, section) =>
                                        acc + (section.entities?.length || 0), 0
                                    )} Entities`}
                                </h4>
                            </div>

                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {analysisSections.map((section, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onSentenceSelect(section.sentence)}
                                        className={`w-full text-left p-2 rounded-lg text-xs transition-all border ${selectedSentence === section.sentence
                                                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                                                : 'bg-slate-800/30 border-slate-600/30 text-slate-300 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className="font-medium truncate">{section.search_term}</div>
                                        <div className="text-slate-400 mt-0.5 truncate">
                                            {section.sentence.substring(0, 50)}...
                                        </div>

                                        {section.entities && section.entities.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {section.entities.slice(0, 3).map((entity, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-1.5 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300"
                                                        title={`${entity.type}: ${entity.text}`}
                                                    >
                                                        {entity.text}
                                                    </span>
                                                ))}
                                                {section.entities.length > 3 && (
                                                    <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">
                                                        +{section.entities.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}