"use client";

import React from "react";
import { ResultItem } from "./types";

type Props = {
    results: ResultItem[];
    isSearching: boolean;
    copyLink: (url: string) => Promise<void> | void;
    openSnapshot: (snapshotPath: string) => void;
    copied?: string | null;
};

export default function ResultsList({ results, isSearching, copyLink, openSnapshot, copied }: Props) {
    return (
        <div className="bg-background rounded-3xl shadow-lg p-6 border border-slate-300 dark:border-slate-700">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Results</h3>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Displayed earliest-first. Click a source to visit or preview.</div>
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-500">{results.length} sources</div>
            </div>

            <div className="mt-5 space-y-5 max-h-[70vh] overflow-auto pr-3">
                {results.length === 0 && !isSearching && (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400 dark:text-slate-500">
                        No results yet - submit a claim to begin the search.
                    </div>
                )}

                {results.map((r) => (
                    <article key={r.id} className="group relative border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <img src={`https://www.google.com/s2/favicons?domain=${r.domain}`} alt="favicon" className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                                            {r.title}
                                        </a>
                                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{r.domain} · {new Date(r.published).toLocaleString()}</div>
                                    </div>

                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-2 bg-slate-500 text-white dark:bg-slate-700 px-2 py-1 rounded-full text-xs font-medium">
                                            {(r.confidence * 100).toFixed(0)}%
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">Confidence</div>
                                    </div>
                                </div>

                                <p className="mt-3 text-sm leading-relaxed">{r.snippet}</p>

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-background border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                                        Open source
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0 0L10 14" />
                                        </svg>
                                    </a>

                                    <button onClick={() => copyLink(r.url)} className="cursor-pointer px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                                        {copied === r.url ? 'Copied' : 'Copy link'}
                                    </button>
                                    {/* <button onClick={() => openSnapshot(`/snapshots/${r.id}.html`)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm">View snapshot</button> */}

                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Source age: <span className="font-medium">{Math.max(1, Math.floor((Date.now() - new Date(r.published).getTime()) / (1000 * 60 * 60 * 24)))} days</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}

                {isSearching && (
                    <div className="rounded-xl p-4 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400">
                        Searching - partial results will appear as they are discovered.
                    </div>
                )}
            </div>
        </div>
    );
}
