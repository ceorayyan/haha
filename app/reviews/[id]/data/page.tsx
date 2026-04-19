"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useData } from "../../../context/DataContext";
import type { Article } from "../../../context/DataContext";

function extractKeywords(articles: Article[]): { word: string; count: number }[] {
  const freq: Record<string, number> = {};
  articles.forEach(a => {
    a.keywords.forEach(k => {
      const w = k.toLowerCase().trim();
      freq[w] = (freq[w] || 0) + 1;
    });
  });
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

export default function DataPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  const { getArticlesByReviewId } = useData();

  const allArticles = getArticlesByReviewId(reviewId);
  const [selectedId, setSelectedId] = useState<number | null>(allArticles[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"title" | "year" | "authors">("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);

  const allKeywords = useMemo(() => extractKeywords(allArticles), [allArticles]);

  const filtered = useMemo(() => {
    let list = [...allArticles];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.authors.toLowerCase().includes(q));
    }
    if (includeKeywords.length > 0) {
      list = list.filter(a => includeKeywords.some(k => a.keywords.map(x => x.toLowerCase()).includes(k)));
    }
    if (excludeKeywords.length > 0) {
      list = list.filter(a => !excludeKeywords.some(k => a.keywords.map(x => x.toLowerCase()).includes(k)));
    }
    list.sort((a, b) => {
      const va = sortField === "year" ? a.year : (a[sortField] || "");
      const vb = sortField === "year" ? b.year : (b[sortField] || "");
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [allArticles, search, includeKeywords, excludeKeywords, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleInclude = (word: string) => {
    setIncludeKeywords(prev => prev.includes(word) ? prev.filter(k => k !== word) : [...prev, word]);
    setExcludeKeywords(prev => prev.filter(k => k !== word));
  };

  const toggleExclude = (word: string) => {
    setExcludeKeywords(prev => prev.includes(word) ? prev.filter(k => k !== word) : [...prev, word]);
    setIncludeKeywords(prev => prev.filter(k => k !== word));
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar - All Data */}
      <div className="w-44 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">All Data</p>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="text-xs text-gray-700">Imported References</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-100 cursor-pointer">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                <span className="text-xs font-medium text-gray-800">All References</span>
              </div>
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{allArticles.length}</span>
            </div>
          </div>
          <button className="mt-3 w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded">Add References</button>
          <div className="mt-4">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span className="text-xs text-gray-700">Possible Duplicates</span>
            </div>
            <p className="text-xs text-gray-400 px-2 mt-1">Find duplicates to start resolving!</p>
            <button className="mt-2 w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded">Detect Duplicates</button>
          </div>
        </div>
      </div>

      {/* Center - Article list */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </div>
            <span className="text-xs font-semibold text-gray-700">Showing {filtered.length} Articles</span>
          </div>
          <div className="flex-1" />
          <button className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
          <button className="text-xs border border-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-50">Samples</button>
          <button className="text-xs border border-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-50">PICO</button>
          <button className="text-xs border border-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-50">Auto resolve</button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
          <button className="text-xs border border-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-50 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
            Filters
          </button>
        </div>

        {/* Search bar */}
        <div className="bg-white border-b border-gray-200 px-3 py-1.5 shrink-0">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>

        {/* Table header */}
        <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 shrink-0">
          <input type="checkbox" className="w-3 h-3 rounded border-gray-300" />
          <div className="flex items-center gap-1 flex-1">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-xs font-semibold text-gray-600">All References</span>
          </div>
        </div>
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2 shrink-0">
          <input type="checkbox" className="w-3 h-3 rounded border-gray-300 opacity-0" />
          <button onClick={() => toggleSort("title")} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 flex-1">
            Title {sortField === "title" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
          </button>
          <button onClick={() => toggleSort("year")} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 w-16">
            Date {sortField === "year" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
          </button>
          <button onClick={() => toggleSort("authors")} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 w-24">
            Author {sortField === "authors" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
          </button>
        </div>

        {/* Article list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((article, idx) => (
            <div
              key={article.id}
              onClick={() => setSelectedId(article.id)}
              className={`flex items-start gap-2 px-3 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedId === article.id ? "bg-blue-50" : ""}`}
            >
              <input type="checkbox" className="w-3 h-3 rounded border-gray-300 mt-0.5 shrink-0" onClick={e => e.stopPropagation()} />
              <span className="text-xs text-gray-400 w-4 shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium leading-snug ${article.status === "included" ? "text-gray-800" : article.status === "excluded" ? "text-gray-400 line-through" : "text-gray-800"}`}>
                  {article.title}
                </p>
              </div>
              <span className="text-xs text-gray-400 w-10 shrink-0">{article.year}</span>
              <span className="text-xs text-gray-400 w-20 shrink-0 truncate">{article.authors.split(",")[0]}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2 shrink-0">
          <button className="flex-1 text-xs border border-gray-200 text-gray-600 py-1.5 rounded hover:bg-gray-50">Attach PDF</button>
          <button className="flex-1 text-xs border border-gray-200 text-gray-600 py-1.5 rounded hover:bg-gray-50 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            Label
          </button>
          <div className="flex items-center gap-1 flex-1">
            <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
              <span className="text-white dark:text-black text-xs">U</span>
            </div>
            <input placeholder="Add note" className="flex-1 text-xs bg-transparent focus:outline-none text-gray-500" />
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
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

          {/* Keywords for include */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-700">Keywords for include</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{includeKeywords.length}</span>
                <button className="text-gray-400 hover:text-gray-600 text-sm font-bold">+</button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                <input type="checkbox" className="w-3 h-3 rounded border-gray-300" onChange={() => {}} />
                Select All
              </label>
              {allKeywords.slice(0, 8).map(({ word, count }) => (
                <label key={word} className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeKeywords.includes(word)}
                      onChange={() => toggleInclude(word)}
                      className="w-3 h-3 rounded border-gray-300"
                    />
                    <span className="text-gray-700">{word}</span>
                  </div>
                  <span className="text-gray-400">{count}</span>
                </label>
              ))}
              {allKeywords.length > 8 && (
                <button className="text-xs text-orange-500 hover:text-orange-600 px-1">Show more &gt;</button>
              )}
            </div>
          </div>

          {/* Keywords for exclude */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-700">Keywords for exclude</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{excludeKeywords.length}</span>
                <button className="text-gray-400 hover:text-gray-600 text-sm font-bold">+</button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                <input type="checkbox" className="w-3 h-3 rounded border-gray-300" onChange={() => {}} />
                Select All
              </label>
              {allKeywords.slice(0, 8).map(({ word, count }) => (
                <label key={word} className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={excludeKeywords.includes(word)}
                      onChange={() => toggleExclude(word)}
                      className="w-3 h-3 rounded border-gray-300"
                    />
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
