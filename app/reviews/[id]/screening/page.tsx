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

export default function ScreeningPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  const { getArticlesByReviewId, updateArticle } = useData();

  const allArticles = getArticlesByReviewId(reviewId);
  const undecided = allArticles.filter(a => a.status === "undecided");
  const [selectedId, setSelectedId] = useState<number | null>(undecided[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [includeKw, setIncludeKw] = useState<string[]>([]);
  const [excludeKw, setExcludeKw] = useState<string[]>([]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const allKeywords = useMemo(() => extractKeywords(allArticles), [allArticles]);
  const selected = allArticles.find(a => a.id === selectedId);

  const decide = (decision: "include" | "exclude" | "maybe") => {
    if (!selectedId) return;
    updateArticle(selectedId, {
      screeningDecision: decision,
      status: decision === "include" ? "included" : decision === "exclude" ? "excluded" : "undecided",
      screeningNotes: note,
    });
    setNote("");
    const remaining = undecided.filter(a => a.id !== selectedId);
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
      <div className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="text-xs font-semibold text-gray-700">Undecided</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            <button className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>
              Sort
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Showing {undecided.length}/{allArticles.length} Undecided Articles</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {undecided.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedId(article.id)}
              className={`px-3 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedId === article.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}
            >
              <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">{article.title}</p>
              <p className="text-xs text-blue-500 mt-0.5 truncate">{article.authors.split(",").slice(0, 2).join(", ")}</p>
            </div>
          ))}
        </div>
        {/* Timer */}
        <div className="px-3 py-2 border-t border-gray-200 shrink-0">
          <p className="text-xs text-gray-500">00hrs | 01mins | 01 Sessions</p>
        </div>
      </div>

      {/* Center - Article detail */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
        {selected ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-sm font-bold text-gray-800 mb-4 leading-snug">{selected.title}</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="text-xs font-semibold text-gray-600">Publication Types:</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-5">Journal Article</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-xs font-semibold text-gray-600">Authors:</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-5">{selected.authors}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    <span className="text-xs font-semibold text-gray-600">Journal:</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-5">{selected.journal} • {selected.year}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                    <span className="text-xs font-semibold text-gray-600">Rayyan Reference ID:</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-5">{selected.id}00000</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    <span className="text-xs font-semibold text-gray-600">Search Methods:</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-5">Uploaded References</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Abstract:</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{selected.abstract}</p>
                </div>
              </div>
            </div>

            {/* Decision buttons */}
            <div className="border-t border-gray-200 px-4 py-2.5 flex items-center gap-2 shrink-0 bg-white">
              <button onClick={() => decide("include")} className="flex items-center gap-1.5 px-4 py-1.5 border border-green-300 bg-green-50 text-green-700 rounded hover:bg-green-100 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
              <button onClick={() => decide("maybe")} className="flex items-center gap-1.5 px-4 py-1.5 border border-yellow-300 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
              <button onClick={() => decide("exclude")} className="flex items-center gap-1.5 px-4 py-1.5 border border-red-300 bg-red-50 text-red-700 rounded hover:bg-red-100 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Reason
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                Label
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Analyze
              </button>
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                  <span className="text-white dark:text-black text-xs">U</span>
                </div>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add note" className="text-xs bg-transparent focus:outline-none text-gray-500 w-24" />
                <button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm font-semibold text-gray-700">All articles screened!</p>
              <p className="text-xs text-gray-500 mt-1">Great work.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right - Filters */}
      <div className="w-52 shrink-0 bg-white overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-700">Filters</span>
            <button className="p-1 hover:bg-gray-100 rounded">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
          {/* Include keywords */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-700">Keywords for include</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{includeKw.length}</span>
                <button className="text-gray-400 hover:text-gray-600 text-sm font-bold">+</button>
              </div>
            </div>
            <div className="space-y-1">
              {allKeywords.slice(0, 10).map(({ word, count }) => (
                <label key={word} className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={includeKw.includes(word)} onChange={() => toggleInclude(word)} className="w-3 h-3 rounded border-gray-300" />
                    <span className="text-gray-700">{word}</span>
                  </div>
                  <span className="text-gray-400">{count}</span>
                </label>
              ))}
              {allKeywords.length > 10 && <button className="text-xs text-orange-500 px-1">Show more &gt;</button>}
            </div>
          </div>
          {/* Exclude keywords */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-700">Keywords for exclude</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{excludeKw.length}</span>
                <button className="text-gray-400 hover:text-gray-600 text-sm font-bold">+</button>
              </div>
            </div>
            <div className="space-y-1">
              {allKeywords.slice(0, 10).map(({ word, count }) => (
                <label key={word} className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={excludeKw.includes(word)} onChange={() => toggleExclude(word)} className="w-3 h-3 rounded border-gray-300" />
                    <span className="text-gray-700">{word}</span>
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
