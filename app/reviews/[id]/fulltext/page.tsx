"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

function extractKeywords(articles: any[]) {
  if (!articles || articles.length === 0) return [];
  const freq: Record<string, number> = {};
  articles.forEach((a) => {
    const keywords = a.keywords || [];
    if (Array.isArray(keywords)) {
      keywords.forEach((k: string) => { 
        const w = k.toLowerCase().trim(); 
        freq[w] = (freq[w] || 0) + 1; 
      });
    }
  });
  return Object.entries(freq).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count);
}

export default function FullTextPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  // Fetch articles on mount and when page changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const articlesData = await api.getArticles(reviewId, currentPage, 100);
        const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData.data || [];
        setAllArticles(articlesArray);
        setTotalArticles(articlesData?.total || articlesArray.length);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        setAllArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reviewId, currentPage]);

  const pending = allArticles.filter((a) => a.status !== "included" && a.status !== "excluded");

  const [selectedId, setSelectedId] = useState<number | null>(pending[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [includeKw, setIncludeKw] = useState<string[]>([]);
  const [excludeKw, setExcludeKw] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  const allKeywords = useMemo(() => extractKeywords(allArticles), [allArticles]);
  const selected = allArticles.find((a) => a.id === selectedId);

  const decide = async (decision: "include" | "exclude") => {
    if (!selectedId) return;
    try {
      await api.updateArticleScreening(selectedId, {
        screening_decision: decision,
        screening_notes: note,
      });
      setNote("");
      const remaining = pending.filter((a) => a.id !== selectedId);
      setSelectedId(remaining[0]?.id ?? null);
      // Refresh articles
      const articlesData = await api.getArticles(reviewId, currentPage, 100);
      const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData.data || [];
      setAllArticles(articlesArray);
    } catch (error) {
      console.error("Failed to update article:", error);
    }
  };

  const toggleInclude = (word: string) => {
    setIncludeKw((p) => p.includes(word) ? p.filter((k) => k !== word) : [...p, word]);
    setExcludeKw((p) => p.filter((k) => k !== word));
  };
  const toggleExclude = (word: string) => {
    setExcludeKw((p) => p.includes(word) ? p.filter((k) => k !== word) : [...p, word]);
    setIncludeKw((p) => p.filter((k) => k !== word));
  };

  const statusDot = (status: string) => {
    if (status === "included") return "bg-green-500";
    if (status === "excluded") return "bg-red-500";
    return "bg-gray-300 dark:bg-gray-600";
  };

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-black">

      {/* ── Left: article list */}
      <div className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-white">Full Text Screening</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{pending.length} pending · {allArticles.length} total</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {allArticles.map((article) => (
            <button key={article.id} onClick={() => setSelectedId(article.id)}
              className={`w-full text-left px-4 py-3.5 border-b border-gray-100 dark:border-gray-900 transition-colors
                ${selectedId === article.id ? "bg-gray-100 dark:bg-gray-900 border-l-2 border-l-gray-900 dark:border-l-white pl-3.5" : "hover:bg-gray-50 dark:hover:bg-gray-950"}`}>
              <div className="flex items-start gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${statusDot(article.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-relaxed mb-1">{article.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{article.authors.split(",")[0]}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Center: full text */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-800">
        {selected ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-8 py-8">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-snug mb-5">{selected.title}</h1>

                <div className="space-y-3 mb-6">
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 w-24 shrink-0">Authors</span>
                    <span className="text-gray-700 dark:text-gray-300">{selected.authors}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 w-24 shrink-0">Journal</span>
                    <span className="text-gray-700 dark:text-gray-300">{selected.journal} · {selected.year}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {selected.keywords.map((k: string) => (
                    <span key={k} className={`text-xs px-2 py-0.5 rounded border
                      ${includeKw.includes(k) ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                        : excludeKw.includes(k) ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"}`}>
                      {k}
                    </span>
                  ))}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-900 pt-6">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Full Text</p>
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {selected.fullText}
                  </div>
                </div>
              </div>
            </div>

            {/* Decision bar */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-8 py-4 shrink-0">
              <div className="max-w-2xl mx-auto flex items-center gap-3">
                <button onClick={() => decide("include")}
                  className="flex items-center gap-1.5 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Include
                </button>
                <button onClick={() => decide("exclude")}
                  className="flex items-center gap-1.5 px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  Exclude
                </button>
                <div className="flex-1" />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note..."
                  className="text-xs bg-transparent border-b border-gray-200 dark:border-gray-800 focus:outline-none focus:border-gray-900 dark:focus:border-white text-gray-600 dark:text-gray-400 py-0.5 w-36 placeholder:text-gray-300 dark:placeholder:text-gray-700" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Full text screening complete</p>
          </div>
        )}
      </div>

      {/* ── Right: filters */}
      {showFilters && (
        <div className="w-60 shrink-0 bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Filters</span>
            <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">

              {/* Include */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Include</span>
                  </div>
                  {includeKw.length > 0 && <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-medium">{includeKw.length}</span>}
                </div>
                <div className="space-y-0.5">
                  {allKeywords.slice(0, 10).map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={includeKw.includes(word)} onChange={() => toggleInclude(word)}
                          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-green-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{word}</span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exclude */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Exclude</span>
                  </div>
                  {excludeKw.length > 0 && <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">{excludeKw.length}</span>}
                </div>
                <div className="space-y-0.5">
                  {allKeywords.slice(0, 10).map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={excludeKw.includes(word)} onChange={() => toggleExclude(word)}
                          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-red-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{word}</span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}