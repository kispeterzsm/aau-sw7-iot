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

    function highlightEntities(text: string): string {
        //    using mock data
        const entities = [
            { text: "Donald Trump", type: "PERSON", confidence: 0.95 },
            { text: "Affordable Care Act", type: "LAW", confidence: 0.92 },
            { text: "Congressional Budget Office", type: "ORGANIZATION", confidence: 0.88 },
            { text: "Wednesday", type: "DATE", confidence: 0.85 }
        ];

        let entityHighlightedText = text;

        entities.forEach(entity => {
            const entityClass = getEntityClass(entity.type);
            const regex = new RegExp(`\\b${entity.text}\\b`, 'gi');

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
            LAW: 'bg-purple-200 dark:bg-purple-800 border-purple-400 dark:border-purple-600 text-purple-900 dark:text-purple-100'
        };

        return classes[type as keyof typeof classes] || 'bg-gray-200 dark:bg-gray-800 border-gray-400';
    }


    function highlightText(text: string) {
        let highlightedText = text;
        highlightedText = highlightEntities(highlightedText);

        analysisSections.forEach(section => {
            const searchTerm = section.search_term;
            const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');

            highlightedText = highlightedText.replace(
                regex,
                `<span class="bg-purple-200 dark:bg-purple-800 border border-purple-400 dark:border-purple-600 px-1 py-0.5 rounded mx-0.5 text-purple-900 dark:text-purple-100">$1</span>`
            );
        });

        analyzedSentences.forEach(sentence => {
            const isSelected = sentence === selectedSentence;
            const sentenceHighlightClass = isSelected
                ? 'bg-gradient-to-r from-yellow-300 to-amber-300 dark:from-yellow-500 dark:to-amber-500 border-2 border-yellow-500 text-slate-900'
                : 'bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900 border border-blue-400 dark:border-blue-600 text-slate-900 dark:text-slate-100';

            if (highlightedText.includes(sentence)) {
                highlightedText = highlightedText.replace(
                    sentence,
                    `<span class="${sentenceHighlightClass} px-1 py-0.5 rounded cursor-pointer hover:shadow-lg transition-all" 
              onclick="window.reactHandlers?.selectSentence('${sentence.replace(/'/g, "\\'")}')">${sentence}</span>`
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
                    {/* Content Text */}
                    <div className="text-sm leading-relaxed text-slate-300 space-y-4 mb-8">
                        <div
                            className="
      prose dark:prose-invert max-w-none text-slate-300
      prose-a:text-slate-300 prose-a:no-underline
      prose-a:hover:underline prose-a:hover:decoration-yellow-400 prose-a:hover:text-yellow-400
    "
                            dangerouslySetInnerHTML={{
                                __html: highlightText(content.length > 1000 ? content : analyzedSentences.join(' '))
                            }}
                        />
                    </div>

                    {/* Legend Section */}
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

                            {/* Analyzed Sentences */}
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

                            {/* Entities */}
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-red-200 dark:bg-red-800 border border-red-400 dark:border-red-600 rounded flex-shrink-0 mt-0.5"></div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-200">People/Places</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Named entities detected</div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Analyzed Sections Quick View */}
                    {analysisSections.length > 0 && (
                        <div className="mt-6 space-y-3 p-4 bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-700/50 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-emerald-400">🔍</span>
                                <h4 className="font-semibold text-slate-100 text-sm">Traced Sentences ({analysisSections.length})</h4>
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