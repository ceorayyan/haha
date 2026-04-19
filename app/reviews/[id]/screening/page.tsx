"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useData } from "../../../context/DataContext";
import type { Article } from "../../../context/DataContext";

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
  const [showFilters, setShowFilters] = useState(true);

  // Extract all unique keywords from articles
  const allKeywords = useMemo(() => {
    const keywordMap = new Map<string, number>();
    allArticles.forEach(article => {
      article.keywords.forEach(kw => {
        keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
      });
    });
    return Array.from(keywordMap.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }, [allArticles]);

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
    <div className="flex h-full overflow-hidden bg-gray-50 dark:bg-black">
      {/* Left Sidebar - Article List */}
      <div className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Undecided</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <button className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sort
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Showing {undecided.length}/{allArticles.length} Undecided Articles</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {undecided.map((article, idx) => (
            <div
              key={article.id}
              onClick={() => setSelectedId(article.id)}
              className={`px-3 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                selectedId === article.id ? "bg-blue-50 dark:bg-blue-950 border-l-3 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 mt-0.5">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 mb-1">
                    {article.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {article.authors.split(",").slice(0, 2).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center - Article Detail (Centered Layout) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-black">
        {selected ? (
          <>
            {/* Article Content - Centered */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-8 py-6">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-4 leading-snug">
                  {selected.title}
                </h1>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Publication Types:</p>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">Journal Article</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Authors:</p>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">{selected.authors}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Journal:</p>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                        {selected.journal} • {selected.year}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Rayyan Reference ID:</p>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">{selected.id}00000</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Search Methods:</p>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">Uploaded References</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Abstract:</p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selected.abstract}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Bar - Fixed at Bottom */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <div className="max-w-4xl mx-auto px-8 py-4">
                <div className="flex items-center justify-center gap-3">
                  {/* Include Button */}
                  <button
                    onClick={() => decide("include")}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Include
                  </button>

                  {/* Maybe Button */}
                  <button
                    onClick={() => decide("maybe")}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Maybe
                  </button>

                  {/* Exclude Button */}
                  <button
                    onClick={() => decide("exclude")}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Exclude
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Reason
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Label
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analyze
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center">
                      <span className="text-white dark:text-black text-xs font-medium">U</span>
                    </div>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add note..."
                      className="text-xs bg-transparent border-b border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 text-gray-700 dark:text-gray-300 px-2 py-1 w-32"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">All articles screened!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Great work completing the screening.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Filters (Collapsible) */}
      {showFilters && (
        <div className="w-72 shrink-0 bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Include Keywords */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Keywords for include</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded font-medium">
                    {includeKw.length}
                  </span>
                  <button className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-bold">
                    +
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {allKeywords.slice(0, 10).map(({ word, count }) => (
                  <label
                    key={word}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-2 py-1.5 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeKw.includes(word)}
                        onChange={() => toggleInclude(word)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{word}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{count}</span>
                  </label>
                ))}
                {allKeywords.length > 10 && (
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1">
                    Show more →
                  </button>
                )}
              </div>
            </div>

            {/* Exclude Keywords */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Keywords for exclude</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded font-medium">
                    {excludeKw.length}
                  </span>
                  <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold">
                    +
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {allKeywords.slice(0, 10).map(({ word, count }) => (
                  <label
                    key={word}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-2 py-1.5 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={excludeKw.includes(word)}
                        onChange={() => toggleExclude(word)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{word}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{count}</span>
                  </label>
                ))}
                {allKeywords.length > 10 && (
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1">
                    Show more →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Filters Button (when collapsed) */}
      {!showFilters && (
        <button
          onClick={() => setShowFilters(true)}
          className="fixed right-4 top-24 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      )}
    </div>
  );
}
