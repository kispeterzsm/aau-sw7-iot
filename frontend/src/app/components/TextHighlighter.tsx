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
    const hasEntities = analysisSections.some(section =>
        section.entities && section.entities.length > 0
    );
    
    function getEntityClass(type: string): string {
        // Added '!' to force entity colors on top 
        const classes = {
            PERSON: '!bg-red-200 dark:!bg-red-900/60 !border-red-400 dark:!border-red-500 !text-red-900 dark:!text-red-100',
            ORG: '!bg-emerald-200 dark:!bg-emerald-900/60 !border-emerald-400 dark:!border-emerald-500 !text-emerald-900 dark:!text-emerald-100',
            GPE: '!bg-blue-200 dark:!bg-blue-900/60 !border-blue-400 dark:!border-blue-500 !text-blue-900 dark:!text-blue-100',
            EVENT: '!bg-pink-200 dark:!bg-pink-900/60 !border-pink-400 dark:!border-pink-500 !text-pink-900 dark:!text-pink-100',
            DATE: '!bg-yellow-200 dark:!bg-yellow-900/60 !border-yellow-400 dark:!border-yellow-500 !text-yellow-900 dark:!text-yellow-100',
            WORK_OF_ART: '!bg-orange-200 dark:!bg-orange-900/60 !border-orange-400 dark:!border-orange-500 !text-orange-900 dark:!text-orange-100',
            LAW: '!bg-teal-200 dark:!bg-teal-900/60 !border-teal-400 dark:!border-teal-500 !text-teal-900 dark:!text-teal-100',
            ORGANIZATION: '!bg-emerald-200 dark:!bg-emerald-900/60 !border-emerald-400 dark:!border-emerald-500 !text-emerald-900 dark:!text-emerald-100',
            LOCATION: '!bg-blue-200 dark:!bg-blue-900/60 !border-blue-400 dark:!border-blue-500 !text-blue-900 dark:!text-blue-100',
        };
        return classes[type as keyof typeof classes] || '!bg-gray-300 dark:!bg-gray-700 border-gray-500 !text-gray-900 dark:!text-gray-100';
    }

    function processSentenceContent(text: string, section: AnalysisSection): string {
        let processed = text;
        if (section.entities && section.entities.length > 0) {
            const sortedEntities = [...section.entities].sort((a, b) => b.name.length - a.name.length);
            
            const uniqueEntities = sortedEntities.filter((entity, index, self) =>
                index === self.findIndex(e =>
                    e.name.toLowerCase() === entity.name.toLowerCase() &&
                    e.label === entity.label
                )
            );

            uniqueEntities.forEach(entity => {
                const entityClass = getEntityClass(entity.label);
                const escapedEntity = entity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                try {
                    const regex = new RegExp(`\\b(${escapedEntity})\\b`, 'gi');
                    
                    processed = processed.replace(
                        regex,
                        `<span class="${entityClass} px-1.5 py-0.5 rounded-md border text-xs font-bold cursor-help relative z-10 shadow-sm mx-0.5 inline-block" title="Entity: ${entity.label}">$1</span>`
                    );
                } catch (e) {
                    console.error("Highlight regex error:", e);
                }
            });
        }

        if (section.search_term) {
            const term = section.search_term.trim();
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            const exactRegex = new RegExp(`(?![^<]*>)(${escapedTerm})(?![^<]*<\/span>)`, 'gi');
            if (exactRegex.test(processed)) {
                processed = processed.replace(
                    exactRegex,
                    `<span class="bg-violet-300 dark:bg-violet-600 border-b-2 border-violet-500 dark:border-violet-400 text-violet-950 dark:text-white font-bold px-0.5">$1</span>`
                );
            } else {
                const words = term.split(/\s+/).filter(w => w.length > 3); 
                words.forEach(word => {
                    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const wordRegex = new RegExp(`(?![^<]*>)\\b(${escapedWord})\\b(?![^<]*<\/span>)`, 'gi');
                    processed = processed.replace(
                        wordRegex,
                        `<span class="bg-violet-200 dark:bg-violet-700/50 border-b border-violet-400 dark:border-violet-500 text-violet-900 dark:text-violet-100 px-0.5">$1</span>`
                    );
                });
            }
        }

        return processed;
    }

    function generateHtml() {
        if (content.length > 10000 && analysisSections.length < 5) {
            return content.replace(/\n/g, '<br/>');
        }

        return analysisSections.map(section => {
            const innerHTML = processSentenceContent(section.sentence, section);
            const isSelected = section.sentence === selectedSentence;
            
            const sentenceHighlightClass = isSelected
                ? 'bg-amber-100 dark:bg-amber-900/40 border-l-4 border-amber-500 pl-2 shadow-md'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border-l-4 border-transparent pl-2 hover:border-slate-300 dark:hover:border-slate-600';

            const safeSentence = section.sentence.replace(/'/g, "\\'");

            return `
                <div class="mb-6">
                    <div class="mb-2 text-xs font-mono text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 items-center">
                        <span class="uppercase tracking-wider font-bold text-[10px] text-slate-400">Generated Search Term:</span>
                        <span class="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded border border-violet-200 dark:border-violet-800 font-medium">
                            ${section.search_term || 'N/A'}
                        </span>
                    </div>

                    <div 
                        class="${sentenceHighlightClass} py-3 my-2 rounded-r transition-all duration-200 cursor-pointer group"
                        onclick="window.reactHandlers?.selectSentence('${safeSentence}')"
                    >
                        <span class="text-slate-800 dark:text-slate-200 leading-relaxed block relative">
                            ${innerHTML}
                        </span>
                        ${isSelected ? `
                            <div class="mt-2 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 animate-pulse">
                                <span>Viewing sources for this sentence</span>
                            </div>
                        ` : `
                            <div class="mt-1 h-0 overflow-hidden group-hover:h-auto group-hover:mt-2 transition-all">
                                <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    <span>Click to view the origins of this piece of information!</span>
                                </span>
                            </div>
                        `}
                    </div>

                    <div class="border-b border-slate-200 dark:border-slate-700/50 w-full mt-4"></div>
                </div>
            `;
        }).join('');
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Analyzed Content
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                List of extracted sentences with highlighted search terms and entities.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                    <div 
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                            __html: generateHtml()
                        }}
                    />

                    {/* Legend / Guide */}
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800">
                            <div className="w-4 h-4 bg-violet-300 dark:bg-violet-600 rounded"></div>
                            <div className="text-xs font-medium text-violet-900 dark:text-violet-100">Search Terms</div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                            <div className="w-4 h-4 bg-amber-200 dark:bg-amber-600 rounded border-l-2 border-amber-500"></div>
                            <div className="text-xs font-medium text-amber-900 dark:text-amber-100">Selected Sentence</div>
                        </div>
                        {/* TO IMPLEMENT A BETTER ENTITY DETECTION LEGEND / FILTER
                            {hasEntities && (
                                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <div className="text-xs font-medium text-blue-900 dark:text-blue-100">Entities Detected</div>
                                </div>
                            )}
                        */}
                    </div>
                </div>
            </div>
        </div>
    );
}