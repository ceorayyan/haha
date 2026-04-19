"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useData } from "../../../context/DataContext";
import type { Article } from "../../../context/DataContext";

function extractKeywords(articles: Article[]) {
  const freq: Record<string, number> = {};
  articles.forEach(a => a.keywords.forEach(k => { const w = k.toLowerCase().trim(); freq[w] = (freq[w] || 0) + 1; }));
  return Object.entries(freq).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count);
}

export default function FullTextPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  const { getArticlesByReviewId, updateArticle } = useData();

  const allArticles = getArticlesByReviewId(reviewId);
  const pending = allArticles.filter(a => a.status !== "included" && a.status !== "excluded");
  const [selectedId, setSelectedId] = useState<number | null>(pending[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [includeKw, setIncludeKw] = useState<string[]>([]);
  const [excludeKw, setExcludeKw] = useState<string[]>([]);

  const allKeywords = useMemo(() => extractKeywords(allArticles), [allArticles]);
  const selected = allArticles.find(a => a.id === selectedId);

  const decide = (decision: "include" | "exclude") => {
    if (!selectedId) return;
    updateArticle(selectedId, {
      screeningDecision: decision,
      status: decision === "include" ? "included" : "excluded",
      screeningNotes: note,
    });
    setNote("");
    const remaining = pending.filter(a => a.id !== selectedId);
    setSelectedId(remaining[0]?.id ?? null);
  };

  const toggleInclude = (word: string) => {
    setIncludeKw(prev => prev.includes(word) ? prev.filter(k => k !== word) : [...prev, word]);
    setExcludeKw(prev => prev.filter(k => k !== word));
  };
  const toggleExclude = (word: string) => {
    setExcludeKw(prev => prev.includes(word) ? prev.filter(k => k !== word) : [...prev, word]);
    setIncludeKw(prev => prev.filter(k => k !== word));
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left - Article list */}
      <div className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Full Text Screening</p>
          <p className="text-xs text-gray-400 mt-0.5">Showing {pending.length}/{allArticles.length} Articles</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {allArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedId(article.id)}
              className={`px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 ${selectedId === article.id ? "bg-blue-50 dark:bg-blue-950 border-l-2 border-l-blue-500" : ""}`}
            >
              <div className="flex items-start gap-1.5">
                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${article.status === "included" ? "bg-green-500" : article.status === "excluded" ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                <div>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">{article.title}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 truncate">{article.authors.split(",")[0]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center - Full text */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        {selected ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 leading-snug">{selected.title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{selected.authors}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{selected.journal} • {selected.year}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selected.keywords.map(k => (
                  <span key={k} className="text-xs bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">{k}</span>
                ))}
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line border-t border-gray-100 dark:border-gray-800 pt-4">
                {selected.fullText}
              </div>
            </div>
            {/* Decision bar */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2.5 flex items-center gap-2 shrink-0 bg-white dark:bg-black">
              <button onClick={() => decide("include")} className="flex items-center gap-1.5 px-4 py-1.5 border border-green-300 bg-green-50 text-green-700 rounded hover:bg-green-100 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Include
              </button>
              <button onClick={() => decide("exclude")} className="flex items-center gap-1.5 px-4 py-1.5 border border-red-300 bg-red-50 text-red-700 rounded hover:bg-red-100 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Exclude
              </button>
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                  <span className="text-white dark:text-black text-xs">U</span>
                </div>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add note" className="text-xs bg-transparent focus:outline-none text-gray-500 dark:text-gray-400 w-24" />
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full text screening complete!</p>
            </div>
          </div>
        )}
      </div>

      {/* Right - Filters */}
      <div className="w-52 shrink-0 bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Filters</span>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded">
              <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Keywords for include</span>
              </div>
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">{includeKw.length}</span>
            </div>
            <div className="space-y-1">
              {allKeywords.slice(0, 10).map(({ word, count }) => (
                <label key={word} className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-1 py-0.5 rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={includeKw.includes(word)} onChange={() => toggleInclude(word)} className="w-3 h-3 rounded border-gray-300 dark:border-gray-600" />
                    <span className="text-gray-700 dark:text-gray-300">{word}</span>
                  </div>
                  <span className="text-gray-400">{count}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Keywords for exclude</span>
              </div>
              <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">{excludeKw.length}</span>
            </div>
            <div className="space-y-1">
              {allKeywords.slice(0, 10).map(({ word, count }) => (
                <label key={word} className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-1 py-0.5 rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={excludeKw.includes(word)} onChange={() => toggleExclude(word)} className="w-3 h-3 rounded border-gray-300 dark:border-gray-600" />
                    <span className="text-gray-700 dark:text-gray-300">{word}</span>
                  </div>
                  <span className="text-gray-400">{count}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
