"use client";

import React from "react";
import { ResultItem } from "./types";

type Props = {
    results: ResultItem[];
    avgConfidence: number;
};

export default function TimelinePanel({ results, avgConfidence }: Props) {
    return (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-transparent ring-1 ring-slate-50 sticky top-24">
            <h4 className="text-lg font-semibold">Timeline</h4>
            <div className="text-sm text-slate-500 mt-1">Earliest: {results[0] ? new Date(results[0].published).toLocaleString() : "—"}</div>

            <div className="mt-4">
                <div className="rounded-lg bg-slate-50 border p-3">
                    <svg width="100%" height="110" viewBox="0 0 300 110" className="block">
                        <line x1="20" y1="55" x2="280" y2="55" stroke="#e6eef5" strokeWidth={3} />
                        <circle cx="50" cy="55" r="8" fill="#10b981" />
                        <text x="50" y="85" fontSize="10" textAnchor="middle" fill="#64748b">Earliest</text>

                        <circle cx="150" cy="55" r="8" fill="#ef4444" />
                        <text x="150" y="85" fontSize="10" textAnchor="middle" fill="#64748b">Spread</text>

                        <circle cx="250" cy="55" r="8" fill="#f59e0b" />
                        <text x="250" y="85" fontSize="10" textAnchor="middle" fill="#64748b">Latest</text>
                    </svg>
                </div>

                <div className="mt-4 border-t pt-4 text-xs text-slate-500">Metadata</div>
                <div className="mt-2 text-sm">Top source: <a href={results[0]?.url ?? '#'} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">{results[0]?.domain ?? '—'}</a></div>
                <div className="text-sm mt-1">Avg confidence: <span className="font-medium text-slate-700">{results.length ? `${avgConfidence}%` : '—'}</span></div>

                <div className="mt-4 text-xs text-slate-400">Notes: Some sources may be blocked by paywalls or robots.txt - failures will be shown in details.</div>
            </div>
        </div>
    );
}
