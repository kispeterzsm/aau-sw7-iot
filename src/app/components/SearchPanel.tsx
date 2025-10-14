"use client";

import React from "react";
import { JobStatus } from "./types";

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
}: Props) {
    return (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-transparent ring-1 ring-slate-50">
            <h2 className="text-2xl font-semibold">Analyze a claim</h2>
            <p className="text-sm text-slate-500 mt-2">
                Paste a sentence, paragraph or a URL. The system will search the web for earliest occurrences and display provenance.
            </p>

            <form onSubmit={onSearch} className="mt-5">
                <label className="block text-xs font-medium text-slate-600 mb-2">Input</label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`e.g. "The Earth is flat" or https://news.site/article-123`}
                    className="w-full min-h-[140px] p-4 rounded-xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-sm resize-none"
                />

                <div className="mt-4 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="inline-flex items-center cursor-pointer gap-1 px-4 py-3 hover:bg-emerald-600/90 bg-emerald-600 text-white rounded-xl shadow-md disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm font-medium">{isSearching ? "Searching…" : "Start Search"}</span>
                    </button>

                    <button type="button" onClick={() => setInput('The Earth is flat')} className="px-4 py-3 border rounded-xl text-sm cursor-pointer hover:bg-gray-50">
                        Use example
                    </button>


                </div>
                <div className="ml-auto text-sm text-slate-500 mt-3">Progress: <span className="font-medium text-slate-700">{progress}%</span></div>
                {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

                <div className="mt-6 border-t pt-4">
                    <div className="text-sm font-medium">Job status</div>
                    <div className="mt-2 flex items-center gap-3">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-emerald-600" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-xs text-slate-400">{status ?? "—"}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div>Workers: <span className="font-medium text-slate-700">4</span></div>
                        <div>Queue: <span className="font-medium text-slate-700">12</span></div>
                    </div>

                    {/* <div className="mt-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={!jobId || !isSearching}
              className="px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 border disabled:opacity-40"
            >
              Cancel
            </button>
          </div> */}
                </div>
            </form>

            <div className="mt-6 text-xs text-slate-400">Tip: You can paste full paragraphs or just a single sentence. Use the example button to try quickly.</div>
        </div>
    );
}
