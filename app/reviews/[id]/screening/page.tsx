"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc" | "author-asc" | "author-desc";
type FilterStatus = "all" | "undecided" | "included" | "excluded" | "maybe";

const exclusionReasonOptions = [
  "background article",
  "foreign language",
  "wrong drug",
  "wrong outcome",
  "wrong population",
  "wrong publication type",
  "wrong study design",
];

export default function ScreeningPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [includeKw, setIncludeKw] = useState<string[]>([]);
  const [excludeKw, setExcludeKw] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("undecided");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showExcludeModal, setShowExcludeModal] = useState(false);
  const [selectedExclusionReasons, setSelectedExclusionReasons] = useState<string[]>([]);
  const [customExclusionReason, setCustomExclusionReason] = useState("");
  const [showAddInclude, setShowAddInclude] = useState(false);
  const [showAddExclude, setShowAddExclude] = useState(false);
  const [newIncludeKeyword, setNewIncludeKeyword] = useState("");
  const [newExcludeKeyword, setNewExcludeKeyword] = useState("");
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch articles on mount and when page changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const articlesData = await api.getArticles(reviewId, currentPage, 100);
        const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData.data || [];
        setAllArticles(articlesArray);
        setTotalArticles(articlesData?.total || articlesArray.length);

        // Set initial selected article if not already set
        if (!selectedId && articlesArray.length > 0) {
          const firstUndecided = articlesArray.find((a: any) => a.status === "undecided");
          setSelectedId(firstUndecided?.id ?? articlesArray[0].id);
        }

        const userData = api.getStoredUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        setAllArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reviewId, currentPage]);

  const statusCounts = useMemo(() => ({
    all: allArticles.length,
    undecided: allArticles.filter((a) => a.status === "undecided").length,
    included: allArticles.filter((a) => a.status === "included").length,
    excluded: allArticles.filter((a) => a.status === "excluded").length,
    maybe: allArticles.filter((a) => a.screeningDecision === "maybe").length,
  }), [allArticles]);

  const allKeywords = useMemo(() => {
    if (!allArticles || allArticles.length === 0) return [];
    const map = new Map<string, number>();
    allArticles.forEach((a) => {
      if (a.keywords && Array.isArray(a.keywords)) {
        a.keywords.forEach((k: string) => map.set(k, (map.get(k) || 0) + 1));
      }
    });
    return Array.from(map.entries()).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count);
  }, [allArticles]);

  const filteredArticles = useMemo(() => {
    let list = allArticles || [];
    if (filterStatus === "maybe") list = list.filter((a) => a.screeningDecision === "maybe");
    else if (filterStatus !== "all") list = list.filter((a) => a.status === filterStatus);

    if (includeKw.length) list = list.filter((a) => includeKw.some((k) => {
      const keywords = a.keywords || [];
      return keywords.includes(k) || (a.title && a.title.toLowerCase().includes(k));
    }));
    if (excludeKw.length) list = list.filter((a) => !excludeKw.some((k) => {
      const keywords = a.keywords || [];
      return keywords.includes(k) || (a.title && a.title.toLowerCase().includes(k));
    }));

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "newest": return (b.year || 0) - (a.year || 0);
        case "oldest": return (a.year || 0) - (b.year || 0);
        case "title-asc": return (a.title || "").localeCompare(b.title || "");
        case "title-desc": return (b.title || "").localeCompare(a.title || "");
        case "author-asc": return (a.authors || "").localeCompare(b.authors || "");
        case "author-desc": return (b.authors || "").localeCompare(a.authors || "");
        default: return 0;
      }
    });
  }, [allArticles, filterStatus, sortBy, includeKw, excludeKw]);

  useEffect(() => {
    if (filteredArticles.length && !filteredArticles.find((a) => a.id === selectedId)) {
      setSelectedId(filteredArticles[0].id);
    }
  }, [filteredArticles, selectedId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) setShowStatusDropdown(false);
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) setShowSortDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = allArticles.find((a) => a.id === selectedId);

  const decide = async (decision: "include" | "exclude" | "maybe") => {
    if (!selectedId) return;
    if (decision === "exclude") { setShowExcludeModal(true); return; }
    
    try {
      await api.updateArticleScreening(selectedId, {
        screening_decision: decision,
        screening_notes: note,
      });
      setNote("");
      const next = filteredArticles.filter((a) => a.id !== selectedId)[0];
      setSelectedId(next?.id ?? null);
      // Refresh articles
      const articlesData = await api.getArticles(reviewId, currentPage, 100);
      const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData.data || [];
      setAllArticles(articlesArray);
    } catch (error) {
      console.error("Failed to update article:", error);
    }
  };

  const handleExclude = async () => {
    if (!selectedId) return;
    const reasons = [...selectedExclusionReasons, ...(customExclusionReason.trim() ? [customExclusionReason.trim()] : [])];
    
    try {
      await api.updateArticleScreening(selectedId, {
        screening_decision: "exclude",
        screening_notes: note,
        exclusion_reasons: reasons,
      });
      setNote(""); setSelectedExclusionReasons([]); setCustomExclusionReason(""); setShowExcludeModal(false);
      const next = filteredArticles.filter((a) => a.id !== selectedId)[0];
      setSelectedId(next?.id ?? null);
      // Refresh articles
      const articlesData = await api.getArticles(reviewId, currentPage, 100);
      const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData.data || [];
      setAllArticles(articlesArray);
    } catch (error) {
      console.error("Failed to exclude article:", error);
    }
  };

  const statusLabel: Record<FilterStatus, string> = { all: "All", undecided: "Undecided", included: "Included", excluded: "Excluded", maybe: "Maybe" };
  const sortLabel: Record<SortOption, string> = { newest: "Newest", oldest: "Oldest", "title-asc": "Title A–Z", "title-desc": "Title Z–A", "author-asc": "Author A–Z", "author-desc": "Author Z–A" };

  const statusDot = (status: string) => {
    if (status === "included") return "bg-green-500";
    if (status === "excluded") return "bg-red-500";
    if (status === "undecided") return "bg-gray-300 dark:bg-gray-600";
    return "bg-yellow-400";
  };

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-black">

      {/* ── Left: article list */}
      <div className="w-72 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 overflow-hidden">

        {/* List header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 shrink-0">
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => setShowStatusDropdown((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white hover:text-black dark:hover:text-gray-100"
            >
              {statusLabel[filterStatus]}
              <span className="text-gray-400 dark:text-gray-500 font-normal">({statusCounts[filterStatus]})</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                {(["all", "undecided", "maybe", "included", "excluded"] as FilterStatus[]).map((s) => (
                  <button key={s} onClick={() => { setFilterStatus(s); setShowStatusDropdown(false); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors
                      ${filterStatus === s ? "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"}`}>
                    <span className="capitalize">{s}</span>
                    <span className="text-gray-400 dark:text-gray-500">{statusCounts[s]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={sortDropdownRef}>
            <button onClick={() => setShowSortDropdown((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              {sortLabel[sortBy]}
            </button>
            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-1.5 w-36 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                {(Object.entries(sortLabel) as [SortOption, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => { setSortBy(key); setShowSortDropdown(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors
                      ${sortBy === key ? "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Article list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            // Skeleton loading
            <>
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="w-full px-4 py-3.5 border-b border-gray-100 dark:border-gray-900 animate-pulse">
                  <div className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-gray-300 dark:bg-gray-700" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mt-2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
              <svg className="w-8 h-8 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-xs text-gray-400 dark:text-gray-500">No articles</p>
            </div>
          ) : filteredArticles.map((article, idx) => (
            <button key={article.id} onClick={() => setSelectedId(article.id)} className={`w-full text-left px-4 py-3.5 border-b border-gray-100 dark:border-gray-900 transition-colors
              ${selectedId === article.id ? "bg-gray-100 dark:bg-gray-900 border-l-2 border-l-gray-900 dark:border-l-white pl-3.5" : "hover:bg-gray-50 dark:hover:bg-gray-950"}`}>
              <div className="flex items-start gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${statusDot(article.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-relaxed mb-1">{article.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{article.authors.split(",")[0]} · {article.year}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Center: article detail */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-800">
        {loading ? (
          // Skeleton loading for article detail
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-8 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-5"></div>

              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-28"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded flex-1"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-28"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-48"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-28"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                ))}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-900 pt-6">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-20 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        ) : selected ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-8 py-8">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-snug mb-5">{selected.title}</h1>

                <div className="space-y-3 mb-6">
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 w-28 shrink-0">Authors</span>
                    <span className="text-gray-700 dark:text-gray-300">{selected.authors}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 w-28 shrink-0">Journal</span>
                    <span className="text-gray-700 dark:text-gray-300">{selected.journal} · {selected.year}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 w-28 shrink-0">Type</span>
                    <span className="text-gray-700 dark:text-gray-300">Journal Article</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {(selected.keywords || []).map((k: string) => (
                    <span key={k} className={`text-xs px-2 py-0.5 rounded border
                      ${includeKw.includes(k) ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                        : excludeKw.includes(k) ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"}`}>
                      {k}
                    </span>
                  ))}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-900 pt-6">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Abstract</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selected.abstract}</p>
                </div>

                {selected.status === "excluded" && selected.excludedBy && (
                  <div className="mt-6 border border-red-200 dark:border-red-900 rounded-lg p-4 bg-red-50 dark:bg-red-950/30">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">Excluded by {selected.excludedBy}</p>
                    {selected.exclusionReasons?.length ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selected.exclusionReasons.map((r: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">{r}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Decision bar */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-8 py-4 shrink-0">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button onClick={() => decide("include")}
                    className="flex items-center gap-1.5 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Include
                  </button>
                  <button onClick={() => decide("maybe")}
                    className="flex items-center gap-1.5 px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Maybe
                  </button>
                  <button onClick={() => decide("exclude")}
                    className="flex items-center gap-1.5 px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    Exclude
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {(["include", "exclude", "maybe"] as const).map((a, i) => (
                      <span key={a} className="text-xs text-gray-300 dark:text-gray-700">
                        {i === 0 ? "I" : i === 1 ? "X" : "M"} · hotkey
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center shrink-0">
                      <span className="text-white dark:text-black text-xs font-semibold">{user?.name?.[0] ?? "U"}</span>
                    </div>
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note..."
                      className="text-xs bg-transparent border-b border-gray-200 dark:border-gray-800 focus:outline-none focus:border-gray-900 dark:focus:border-white text-gray-600 dark:text-gray-400 py-0.5 w-36 placeholder:text-gray-300 dark:placeholder:text-gray-700" />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All articles screened</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">No more articles in this view</p>
          </div>
        )}
      </div>

      {/* ── Right: filters */}
      {showFilters && (
        <div className="w-64 shrink-0 bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Filters</span>
            <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {loading ? (
            // Skeleton loading for filters
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6 animate-pulse">
                {/* Include keywords skeleton */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-8"></div>
                  </div>
                  <div className="space-y-2">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-1.5">
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-6"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exclude keywords skeleton */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-8"></div>
                  </div>
                  <div className="space-y-2">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-1.5">
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-6"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6">

              {/* Include keywords */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Include</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {includeKw.length > 0 && <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-medium">{includeKw.length}</span>}
                    <button onClick={() => setShowAddInclude((v) => !v)} className="text-green-600 dark:text-green-400 text-base leading-none font-bold">+</button>
                  </div>
                </div>
                {showAddInclude && (
                  <div className="flex gap-1.5 mb-2">
                    <input value={newIncludeKeyword} onChange={(e) => setNewIncludeKeyword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && newIncludeKeyword.trim()) { setIncludeKw((p) => [...p, newIncludeKeyword.trim()]); setNewIncludeKeyword(""); setShowAddInclude(false); }}}
                      placeholder="Keyword..." className="flex-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-green-500" />
                    <button onClick={() => { if (newIncludeKeyword.trim()) { setIncludeKw((p) => [...p, newIncludeKeyword.trim()]); setNewIncludeKeyword(""); setShowAddInclude(false); }}}
                      className="text-xs px-2 py-1.5 bg-green-500 text-white rounded hover:bg-green-600">Add</button>
                  </div>
                )}
                <div className="space-y-0.5">
                  {allKeywords.slice(0, 12).map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={includeKw.includes(word)} onChange={() => setIncludeKw((p) => p.includes(word) ? p.filter((k) => k !== word) : [...p, word])}
                          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-green-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{word}</span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exclude keywords */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Exclude</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {excludeKw.length > 0 && <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">{excludeKw.length}</span>}
                    <button onClick={() => setShowAddExclude((v) => !v)} className="text-red-600 dark:text-red-400 text-base leading-none font-bold">+</button>
                  </div>
                </div>
                {showAddExclude && (
                  <div className="flex gap-1.5 mb-2">
                    <input value={newExcludeKeyword} onChange={(e) => setNewExcludeKeyword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && newExcludeKeyword.trim()) { setExcludeKw((p) => [...p, newExcludeKeyword.trim()]); setNewExcludeKeyword(""); setShowAddExclude(false); }}}
                      placeholder="Keyword..." className="flex-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-red-500" />
                    <button onClick={() => { if (newExcludeKeyword.trim()) { setExcludeKw((p) => [...p, newExcludeKeyword.trim()]); setNewExcludeKeyword(""); setShowAddExclude(false); }}}
                      className="text-xs px-2 py-1.5 bg-red-500 text-white rounded hover:bg-red-600">Add</button>
                  </div>
                )}
                <div className="space-y-0.5">
                  {allKeywords.slice(0, 12).map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={excludeKw.includes(word)} onChange={() => setExcludeKw((p) => p.includes(word) ? p.filter((k) => k !== word) : [...p, word])}
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
          )}
        </div>
      )}

      {/* Show filters button */}
      {!showFilters && (
        <button onClick={() => setShowFilters(true)}
          className="absolute right-4 top-20 p-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors z-10">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </button>
      )}

      {/* Exclude modal */}
      {showExcludeModal && (
        <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 w-[460px] max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Exclude article</h3>
              <button onClick={() => { setShowExcludeModal(false); setSelectedExclusionReasons([]); setCustomExclusionReason(""); }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Will be marked as <span className="font-semibold text-gray-900 dark:text-white">excluded by {user?.name}</span>
              </p>

              <div className="space-y-1.5 mb-4">
                {exclusionReasonOptions.map((reason) => (
                  <label key={reason} className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <input type="checkbox" checked={selectedExclusionReasons.includes(reason)}
                      onChange={() => setSelectedExclusionReasons((p) => p.includes(reason) ? p.filter((r) => r !== reason) : [...p, reason])}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-red-500" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">{reason}</span>
                  </label>
                ))}
              </div>

              <input value={customExclusionReason} onChange={(e) => setCustomExclusionReason(e.target.value)}
                placeholder="Custom reason..."
                className="w-full text-xs px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 mb-4" />

              <div className="flex gap-2">
                <button onClick={handleExclude}
                  disabled={!selectedExclusionReasons.length && !customExclusionReason.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  Confirm exclude
                </button>
                <button onClick={() => { setShowExcludeModal(false); setSelectedExclusionReasons([]); setCustomExclusionReason(""); }}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}