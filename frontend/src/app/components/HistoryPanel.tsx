
"use client";

import { ResultItem } from "@/types/types";

interface HistoryItem {
  id: number;
  user_id: number;
  cache_id: number;
  url: string;
  view_count: number;
  created_at: string;
}

interface Props {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory: (url: string) => void;
}

export default function HistoryPanel({ history, isOpen, onClose, onSelectHistory }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-200/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Search History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-slate-600 dark:text-slate-400">No search history yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Your searched URLs will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectHistory(item.url)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-300/50 dark:hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                        {item.url}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Searched {new Date(item.created_at).toLocaleDateString()} • 
                        Viewed {item.view_count} time{item.view_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="ml-4 text-2xl opacity-50 group-hover:opacity-100">
                      🔍
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}