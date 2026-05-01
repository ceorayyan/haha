"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/api";
import FilterBar from "@/components/FilterBar";
import ArticleDisplay from "@/components/ArticleDisplay";

type Article = {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  url?: string;
  screening_decision?: "included" | "excluded" | "undecided";
  screening_decision_by?: string;
  screening_notes?: string;
  labels?: string[];
  exclusion_reasons?: string[];
  created_at: string;
  file_path?: string;
  // UI display fields
  _note?: string;
  _noteAuthor?: string;
  _labels?: string[];
};

export default function ScreeningPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  const currentUserName = api.getStoredUser()?.name || "You";

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showStatsPopup, setShowStatsPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  const [decisionFilter, setDecisionFilter] = useState<"all" | "undecided" | "included" | "excluded">("all");
  const [screeningStats, setScreeningStats] = useState({ total: 0, undecided: 0, included: 0, excluded: 0 });
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);

  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const labelBtnRef = useRef<HTMLButtonElement>(null);
  const labelPopupRef = useRef<HTMLDivElement>(null);
  
  const [showReasonsPopup, setShowReasonsPopup] = useState(false);
  const [reasonInput, setReasonInput] = useState("");
  const reasonBtnRef = useRef<HTMLButtonElement>(null);
  const reasonPopupRef = useRef<HTMLDivElement>(null);
  
  // Popup state for viewing notes/labels/decision in article rows
  const [articleNotePopup, setArticleNotePopup] = useState<number | null>(null);
  const [articleLabelPopup, setArticleLabelPopup] = useState<number | null>(null);
  const [articleDecisionPopup, setArticleDecisionPopup] = useState<number | null>(null);

  // Refs for article rows to enable auto-scrolling
  const articleRowRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_LABELS = [
    "Irrelevant",
    "Not Needed",
    "Out of Scope",
    "Duplicate",
    "Low Quality",
    "Wrong Language",
    "Wrong Study Type",
    "Wrong Population",
    "Wrong Intervention",
    "Wrong Outcome",
    "Full Text Unavailable",
    "Conference Abstract Only",
  ];

  const SUGGESTED_REASONS = [
    "Wrong Study Design",
    "Wrong Population",
    "Wrong Intervention",
    "Wrong Comparator",
    "Wrong Outcome",
    "Wrong Publication Type",
    "Not in English",
    "Duplicate",
    "Full Text Not Available",
    "Retracted",
    "Animal Study",
    "In Vitro Study",
  ];

  // Close label popup when clicking outside
  useEffect(() => {
    if (!showLabelPopup) return;
    const handler = (e: MouseEvent) => {
      if (
        labelPopupRef.current &&
        !labelPopupRef.current.contains(e.target as Node) &&
        labelBtnRef.current &&
        !labelBtnRef.current.contains(e.target as Node)
      ) {
        setShowLabelPopup(false);
        setLabelInput("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLabelPopup]);

  // Close reasons popup when clicking outside
  useEffect(() => {
    if (!showReasonsPopup) return;
    const handler = (e: MouseEvent) => {
      if (
        reasonPopupRef.current &&
        !reasonPopupRef.current.contains(e.target as Node) &&
        reasonBtnRef.current &&
        !reasonBtnRef.current.contains(e.target as Node)
      ) {
        setShowReasonsPopup(false);
        setReasonInput("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReasonsPopup]);

  useEffect(() => {
    const fetchArticles = async () => {
      // Only show main loading on first page
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      try {
        const res = await api.getArticles(reviewId, currentPage, 100);
        const arr = Array.isArray(res) ? res : res?.data || [];
        // Map persisted DB fields to UI display fields
        const mappedArticles = arr.map((a: Article) => ({
          ...a,
          _labels: a.labels && a.labels.length > 0 ? a.labels : [],
          _note: a.screening_notes || "",
        }));
        
        // Append to existing articles for infinite scroll
        if (currentPage === 1) {
          setArticles(mappedArticles);
          
          // Restore last position from localStorage
          const savedIndex = localStorage.getItem(`screening_index_${reviewId}`);
          if (savedIndex) {
            const index = parseInt(savedIndex, 10);
            if (index >= 0 && index < mappedArticles.length) {
              setCurrentIndex(index);
            } else {
              setCurrentIndex(0);
            }
          } else {
            setCurrentIndex(0);
          }
        } else {
          setArticles(prev => [...prev, ...mappedArticles]);
        }
        
        setHasMore(res?.current_page < res?.last_page);
        setTotalArticles(res?.total || arr.length);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load articles");
        if (currentPage === 1) {
          setArticles([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchArticles();
  }, [reviewId, currentPage]);

  // Fetch screening statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.getScreeningStats(reviewId);
        setScreeningStats({
          total: stats.total ?? 0,
          undecided: stats.undecided ?? stats.unscreened ?? (stats.total - (stats.screened ?? 0)) ?? 0,
          included: stats.included ?? 0,
          excluded: stats.excluded ?? 0,
        });
      } catch (e: any) {
        console.error("Failed to fetch screening stats:", e);
      }
    };
    fetchStats();
  }, [reviewId, statsRefreshTrigger]);

  const keywordFilteredArticles = useMemo(() => {
    const inc = includeKeywords.map((k) => k.toLowerCase());
    const exc = excludeKeywords.map((k) => k.toLowerCase());
    return articles.filter((article) => {
      const text = `${article.title} ${article.authors || ""} ${article.abstract || ""}`.toLowerCase();
      if (inc.length > 0 && !inc.some((k) => text.includes(k))) return false;
      if (exc.length > 0 && exc.some((k) => text.includes(k))) return false;
      
      // Apply decision filter
      if (decisionFilter === "undecided") {
        return !article.screening_decision || article.screening_decision === "undecided";
      } else if (decisionFilter === "included") {
        return article.screening_decision === "included";
      } else if (decisionFilter === "excluded") {
        return article.screening_decision === "excluded";
      }
      // "all" - no filtering
      return true;
    });
  }, [articles, includeKeywords, excludeKeywords, decisionFilter]);

  const filteredArticles = keywordFilteredArticles;

  // Save current index to localStorage whenever it changes
  useEffect(() => {
    if (filteredArticles.length > 0) {
      localStorage.setItem(`screening_index_${reviewId}`, currentIndex.toString());
    }
  }, [currentIndex, reviewId, filteredArticles.length]);

  // Auto-scroll to current article in sidebar
  useEffect(() => {
    if (currentIndex >= 0 && articleRowRefs.current[currentIndex] && sidebarScrollRef.current) {
      const rowElement = articleRowRefs.current[currentIndex];
      const scrollContainer = sidebarScrollRef.current;
      
      if (rowElement) {
        // Calculate the position to scroll to (center the row in the viewport)
        const rowTop = rowElement.offsetTop;
        const rowHeight = rowElement.offsetHeight;
        const containerHeight = scrollContainer.clientHeight;
        const scrollPosition = rowTop - (containerHeight / 2) + (rowHeight / 2);
        
        scrollContainer.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex]);

  // Keep index in-bounds when filtering changes
  useEffect(() => {
    if (currentIndex >= filteredArticles.length) setCurrentIndex(0);
  }, [filteredArticles.length, currentIndex]);

  // Infinite scroll observer for sidebar article list
  const sidebarObserverTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  
  useEffect(() => {
    if (!sidebarObserverTarget.current) return;
    
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        // Only trigger if:
        // 1. Element is intersecting
        // 2. There are more pages to load
        // 3. Not currently loading
        // 4. Not already triggered (using ref to prevent double-triggers)
        if (entry.isIntersecting && hasMore && !loading && !loadingMore && !isLoadingRef.current) {
          isLoadingRef.current = true;
          setCurrentPage(prev => prev + 1);
          // Reset the ref after a short delay to allow the next trigger
          setTimeout(() => {
            isLoadingRef.current = false;
          }, 1000);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start loading 100px before reaching the target
      }
    );

    const currentTarget = sidebarObserverTarget.current;
    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore]);

  const currentArticle = filteredArticles[currentIndex] || null;

  const goNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, Math.max(filteredArticles.length - 1, 0)));
  };

  const updateDecision = async (articleId: number, decision: "included" | "excluded" | "undecided", extra?: Partial<Article>) => {
    const payload: any = {
      screening_decision: decision,
      screening_decision_by: currentUserName,
      screening_notes: extra?.screening_notes,
      labels: extra?.labels,
      exclusion_reasons: extra?.exclusion_reasons,
    };
    await api.updateArticleScreening(articleId, payload);
  };

  const handleInclude = async () => {
    if (!currentArticle) return;

    // Optimistic UI: switch status in-place.
    const articleToUpdate = currentArticle;
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleToUpdate.id ? { ...a, screening_decision: "included", screening_decision_by: currentUserName } : a
      )
    );

    // Advance immediately (no success toast).
    goNext();

    try {
      await updateDecision(articleToUpdate.id, "included");
      // Refresh statistics after successful update
      setStatsRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      setArticles((prev) => {
        return prev.map((a) =>
          a.id === articleToUpdate.id ? { ...a, screening_decision: "undecided", screening_decision_by: undefined } : a
        );
      });
      toast.error(e?.message || "Failed to update");
    }
  };

  const handleMaybe = async () => {
    // Mark as undecided explicitly (for "confused" state)
    if (!currentArticle) return;

    const articleToUpdate = currentArticle;

    // Optimistic UI: mark as undecided with decision_by set
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleToUpdate.id ? { ...a, screening_decision: "undecided", screening_decision_by: currentUserName } : a
      )
    );

    // Advance immediately
    goNext();

    try {
      await updateDecision(articleToUpdate.id, "undecided");
      // Refresh statistics after successful update
      setStatsRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleToUpdate.id ? { ...a, screening_decision: "undecided", screening_decision_by: undefined } : a
        )
      );
      toast.error(e?.message || "Failed to update");
    }
  };

  const handleExclude = async () => {
    if (!currentArticle) return;

    const articleToUpdate = currentArticle;

    // Optimistic UI: switch status in-place.
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleToUpdate.id ? { ...a, screening_decision: "excluded", screening_decision_by: currentUserName } : a
      )
    );

    // Advance immediately (no success toast).
    goNext();

    try {
      await updateDecision(articleToUpdate.id, "excluded");
      // Refresh statistics after successful update
      setStatsRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleToUpdate.id ? { ...a, screening_decision: "undecided", screening_decision_by: undefined } : a
        )
      );
      toast.error(e?.message || "Failed to update");
    }
  };

  const openLabel = () => {
    if (!currentArticle) return;
    setLabelInput("");
    setShowLabelPopup(true);
  };

  const applyLabel = async (label: string) => {
    if (!currentArticle || !label.trim()) return;
    const decision = (currentArticle.screening_decision ?? "undecided") as "included" | "excluded" | "undecided";
    try {
      const merged = Array.from(new Set([...(currentArticle.labels || []), label.trim()]));
      await updateDecision(currentArticle.id, decision, { labels: merged });
      setArticles((prev) => prev.map((a) => (a.id === currentArticle.id ? { ...a, labels: merged, _labels: merged } : a)));
      setShowLabelPopup(false);
      setLabelInput("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save labels");
    }
  };

  const openReasons = () => {
    if (!currentArticle) return;
    setReasonInput("");
    setShowReasonsPopup(true);
  };

  const applyReason = async (reason: string) => {
    if (!currentArticle || !reason.trim()) return;
    const decision = (currentArticle.screening_decision ?? "undecided") as "included" | "excluded" | "undecided";
    try {
      const merged = Array.from(new Set([...(currentArticle.exclusion_reasons || []), reason.trim()]));
      await updateDecision(currentArticle.id, decision, { exclusion_reasons: merged });
      setArticles((prev) => prev.map((a) => (a.id === currentArticle.id ? { ...a, exclusion_reasons: merged } : a)));
      setShowReasonsPopup(false);
      setReasonInput("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save exclusion reasons");
    }
  };

  const saveNote = async (note: string) => {
    if (!currentArticle) return;
    const decision = (currentArticle.screening_decision ?? "undecided") as "included" | "excluded" | "undecided";
    try {
      await updateDecision(currentArticle.id, decision, { screening_notes: note });
      setArticles((prev) => prev.map((a) => (a.id === currentArticle.id ? { ...a, screening_notes: note, _note: note, _noteAuthor: currentUserName } : a)));
    } catch (e: any) {
      toast.error(e?.message || "Failed to save note");
    }
  };

  return (
    <>
      <Toaster />
      <div className="h-full overflow-hidden flex bg-[var(--surface-1)]">

        {/* LEFT SIDEBAR */}
        <aside className={`${sidebarOpen ? "w-80" : "w-12"} shrink-0 border-r border-[var(--border-subtle)] flex flex-col overflow-hidden bg-white dark:bg-[var(--surface-1)] transition-all duration-200`}>
          <div className="h-12 px-3 flex items-center border-b border-[var(--border-subtle)] shrink-0">
            {sidebarOpen && <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest flex-1">Screening</span>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors ml-auto"
            >
              <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${sidebarOpen ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {sidebarOpen && (
            <div ref={sidebarScrollRef} className="flex-1 overflow-y-auto">
              {/* Article List */}
              <div className="px-3 py-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Articles
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                      ({totalArticles.toLocaleString()})
                    </span>
                  </div>
                  {/* Statistics Dropdown Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowStatsPopup(!showStatsPopup)}
                      className="p-1 rounded-md hover:bg-[var(--surface-2)] transition-colors"
                      title="View statistics"
                    >
                      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>

                    {/* Statistics Popup */}
                    {showStatsPopup && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowStatsPopup(false)} />
                        <div
                          className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg shadow-xl border overflow-hidden"
                          style={{
                            background: "var(--surface-1)",
                            borderColor: "var(--border-subtle)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                          }}
                        >
                          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                              Statistics
                            </div>
                          </div>
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => { setDecisionFilter("undecided"); setShowStatsPopup(false); }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
                                decisionFilter === "undecided" ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent-border)]" : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                <span className="text-xs text-[var(--text-secondary)]">Undecided</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                                {screeningStats.undecided.toLocaleString()}
                              </span>
                            </button>
                            <button
                              onClick={() => { setDecisionFilter("included"); setShowStatsPopup(false); }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
                                decisionFilter === "included" ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent-border)]" : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-xs text-[var(--text-secondary)]">Included</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                                {screeningStats.included.toLocaleString()}
                              </span>
                            </button>
                            <button
                              onClick={() => { setDecisionFilter("excluded"); setShowStatsPopup(false); }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
                                decisionFilter === "excluded" ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent-border)]" : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span className="text-xs text-[var(--text-secondary)]">Excluded</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                                {screeningStats.excluded.toLocaleString()}
                              </span>
                            </button>
                            <button
                              onClick={() => { setDecisionFilter("all"); setShowStatsPopup(false); }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
                                decisionFilter === "all" ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent-border)]" : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1a5f7a" }} />
                                <span className="text-xs text-[var(--text-secondary)]">All Articles</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                                {screeningStats.total.toLocaleString()}
                              </span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="p-4">
                    {/* Skeleton loading rows */}
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={`skeleton-${idx}`} className="animate-pulse px-3 py-2 rounded-lg border border-transparent mb-2">
                        <div className="flex flex-col gap-1.5">
                          <div className="h-3 bg-[var(--surface-2)] rounded w-3/4" />
                          <div className="h-2.5 bg-[var(--surface-2)] rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="p-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    No articles match filters.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredArticles.map((a, idx) => (
                      <button
                        key={a.id}
                        ref={(el) => { articleRowRefs.current[idx] = el; }}
                        onClick={() => setCurrentIndex(idx)}
                        className="w-full text-left px-3 py-2 rounded-lg border transition-colors"
                        style={{
                          background: idx === currentIndex ? "var(--accent-soft)" : "transparent",
                          borderColor: idx === currentIndex ? "var(--accent-border)" : "transparent",
                          color: "var(--text-primary)",
                        }}
                      >
                        <div className="flex flex-col gap-1.5">
                          {/* Title */}
                          <div className="text-xs font-semibold line-clamp-2">{a.title}</div>
                          
                          {/* Authors */}
                          {a.authors && (
                            <div className="text-[11px] line-clamp-1" style={{ color: "var(--text-muted)" }}>
                              {a.authors}
                            </div>
                          )}
                          
                          {/* Decision + Username + Badges Row */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Decision Icon + Username */}
                            {a.screening_decision && a.screening_decision !== "undecided" && a.screening_decision_by ? (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setArticleDecisionPopup(a.id);
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setArticleDecisionPopup(a.id); } }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer hover:opacity-80"
                                style={{
                                  background: a.screening_decision === "included" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                                  color: a.screening_decision === "included" ? "rgba(34,197,94,0.95)" : "rgba(239,68,68,0.95)",
                                }}
                                title={`${a.screening_decision} by ${a.screening_decision_by}`}
                              >
                                {a.screening_decision === "included" ? (
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                <span>{a.screening_decision_by}</span>
                              </span>
                            ) : a.screening_decision === "undecided" && a.screening_decision_by ? (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setArticleDecisionPopup(a.id);
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setArticleDecisionPopup(a.id); } }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer hover:opacity-80"
                                style={{
                                  background: "rgba(245,158,11,0.14)",
                                  color: "rgba(245,158,11,0.95)",
                                }}
                                title={`Confused by ${a.screening_decision_by}`}
                              >
                                <span className="text-xs font-bold leading-none">?</span>
                                <span>{a.screening_decision_by}</span>
                              </span>
                            ) : null}
                            
                            {/* Exclusion Reasons */}
                            {a.exclusion_reasons && a.exclusion_reasons.length > 0 && a.exclusion_reasons.map((reason, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                style={{
                                  background: "rgba(239,68,68,0.12)",
                                  color: "rgba(239,68,68,0.95)",
                                }}
                                title={`Exclusion reason: ${reason}`}
                              >
                                {reason}
                              </span>
                            ))}
                            
                            {/* Labels */}
                            {a._labels && a._labels.length > 0 && a._labels.map((label, i) => (
                              <span
                                key={i}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); setArticleLabelPopup(a.id); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setArticleLabelPopup(a.id); } }}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer hover:opacity-80"
                                style={{
                                  background: "var(--accent-soft)",
                                  border: "1px solid var(--accent-border)",
                                  color: "var(--accent-light)",
                                }}
                                title={`Label: ${label}`}
                              >
                                {label}
                              </span>
                            ))}
                            
                            {/* Note Icon */}
                            {a._note && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); setArticleNotePopup(a.id); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setArticleNotePopup(a.id); } }}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer hover:opacity-80"
                                style={{
                                  background: "var(--accent-soft)",
                                  border: "1px solid var(--accent-border)",
                                  color: "var(--accent-light)",
                                }}
                                title={`Note by ${a.screening_decision_by || 'You'}`}
                              >
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span>1</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* Loading more indicator */}
                    {loadingMore && (
                      <div className="px-3 py-2 space-y-2">
                        {Array.from({ length: 2 }).map((_, idx) => (
                          <div key={`loading-${idx}`} className="animate-pulse px-3 py-2 rounded-lg border border-transparent">
                            <div className="flex flex-col gap-1.5">
                              <div className="h-3 bg-[var(--surface-2)] rounded w-3/4" />
                              <div className="h-2.5 bg-[var(--surface-2)] rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Infinite scroll observer target */}
                    {!loading && !loadingMore && hasMore && (
                      <div ref={sidebarObserverTarget} className="h-4" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER: ARTICLE DISPLAY */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[var(--surface-1)] min-w-0">
          {/* Toolbar */}
          <div className="h-12 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 gap-3">
            <span className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
              {currentArticle ? `Article ${currentIndex + 1} of ${filteredArticles.length}` : "No article selected"}
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showFilters
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]"
                  : "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
            </button>
          </div>

          {/* Article Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {currentArticle ? (
              <ArticleDisplay
                article={currentArticle as any}
                includeKeywords={includeKeywords}
                excludeKeywords={excludeKeywords}
                currentIndex={currentIndex}
                totalCount={filteredArticles.length}
              />
            ) : (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                Select an article to start screening.
              </div>
            )}
          </main>

          {/* Bottom Action Bar */}
          <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-1)] shrink-0">
            <div className="px-6 py-3 flex items-center justify-center gap-2 relative">
              {/* Include button - icon only */}
              <button
                onClick={handleInclude}
                disabled={!currentArticle}
                className="w-10 h-10 flex items-center justify-center rounded-lg disabled:opacity-50 transition-colors"
                style={{ background: "rgba(34,197,94,0.12)", color: "rgba(34,197,94,0.95)" }}
                title="Include"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>

              {/* Confused button - icon only */}
              <button
                onClick={handleMaybe}
                disabled={!currentArticle}
                className="w-10 h-10 flex items-center justify-center rounded-lg disabled:opacity-50 transition-colors text-lg font-bold"
                style={{ background: "rgba(245,158,11,0.14)", color: "rgba(245,158,11,0.95)" }}
                title="Confused"
              >
                ?
              </button>

              {/* Exclude button - icon only */}
              <button
                onClick={handleExclude}
                disabled={!currentArticle}
                className="w-10 h-10 flex items-center justify-center rounded-lg disabled:opacity-50 transition-colors"
                style={{ background: "rgba(239,68,68,0.12)", color: "rgba(239,68,68,0.95)" }}
                title="Exclude"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="w-px h-8 bg-[var(--border-subtle)]" />

              <input
                disabled={!currentArticle}
                placeholder="Add note…"
                className="w-[280px] max-w-full px-3 py-2 rounded-lg text-sm border disabled:opacity-50 transition-colors"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const target = e.target as HTMLInputElement;
                    const value = target.value.trim();
                    if (value) {
                      saveNote(value);
                      target.value = "";
                    }
                  }
                }}
              />
              <button
                onClick={goNext}
                disabled={!currentArticle}
                className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                style={{ background: "var(--accent)", color: "white" }}
              >
                Next →
              </button>

              <div className="w-px h-8 bg-[var(--border-subtle)]" />

              {/* Label button + popup */}
              <div className="relative">
                <button
                  ref={labelBtnRef}
                  onClick={openLabel}
                  disabled={!currentArticle}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  style={{
                    borderColor: "var(--accent-border)",
                    color: "var(--accent)",
                    background: showLabelPopup ? "var(--accent-soft)" : "transparent",
                  }}
                  title="Add label"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <svg className={`w-3 h-3 transition-transform ${showLabelPopup ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Label popup — anchored above the button, aligned to right */}
                {showLabelPopup && (
                  <div
                    ref={labelPopupRef}
                    className="absolute bottom-full right-0 mb-2 w-64 rounded-xl shadow-2xl border overflow-hidden z-[80]"
                    style={{
                      background: "var(--surface-1)",
                      borderColor: "var(--border-subtle)",
                      boxShadow: "0 -8px 32px rgba(0,0,0,0.18), 0 0 0 1px var(--border-subtle)",
                    }}
                  >
                    {/* Popup header */}
                    <div
                      className="px-3 py-2.5 border-b flex items-center justify-between"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          Apply Label
                        </span>
                      </div>
                      <button
                        onClick={() => { setShowLabelPopup(false); setLabelInput(""); }}
                        className="p-0.5 rounded transition-all hover:opacity-70"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Suggested labels */}
                    <div className="py-1.5 max-h-52 overflow-y-auto">
                      {SUGGESTED_LABELS.map((label) => (
                        <button
                          key={label}
                          onClick={() => applyLabel(label)}
                          className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors hover:bg-[var(--surface-2)]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <svg className="w-3 h-3 shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Custom label input */}
                    <div
                      className="px-3 py-2.5 border-t"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={labelInput}
                          onChange={(e) => setLabelInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && labelInput.trim()) applyLabel(labelInput);
                            if (e.key === "Escape") { setShowLabelPopup(false); setLabelInput(""); }
                          }}
                          placeholder="Custom label…"
                          autoFocus
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all"
                          style={{
                            background: "var(--surface-1)",
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-primary)",
                          }}
                        />
                        <button
                          onClick={() => applyLabel(labelInput)}
                          disabled={!labelInput.trim()}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                          style={{ background: "var(--accent)", color: "#fff" }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reasons button + popup */}
              <div className="relative">
                <button
                  ref={reasonBtnRef}
                  onClick={openReasons}
                  disabled={!currentArticle}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  style={{
                    borderColor: "var(--accent-border)",
                    color: "var(--accent)",
                    background: showReasonsPopup ? "var(--accent-soft)" : "transparent",
                  }}
                  title="Add exclusion reason"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <svg className={`w-3 h-3 transition-transform ${showReasonsPopup ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Reasons popup — anchored above the button, aligned to right */}
                {showReasonsPopup && (
                  <div
                    ref={reasonPopupRef}
                    className="absolute bottom-full right-0 mb-2 w-64 rounded-xl shadow-2xl border overflow-hidden z-[80]"
                    style={{
                      background: "var(--surface-1)",
                      borderColor: "var(--border-subtle)",
                      boxShadow: "0 -8px 32px rgba(0,0,0,0.18), 0 0 0 1px var(--border-subtle)",
                    }}
                  >
                    <div
                      className="px-3 py-2.5 border-b flex items-center justify-between"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          Exclusion Reasons
                        </span>
                      </div>
                      <button
                        onClick={() => { setShowReasonsPopup(false); setReasonInput(""); }}
                        className="p-0.5 rounded transition-all hover:opacity-70"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="py-1.5 max-h-52 overflow-y-auto">
                      {SUGGESTED_REASONS.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => applyReason(reason)}
                          className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors hover:bg-[var(--surface-2)]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <svg className="w-3 h-3 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {reason}
                        </button>
                      ))}
                    </div>
                    <div
                      className="px-3 py-2.5 border-t"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={reasonInput}
                          onChange={(e) => setReasonInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && reasonInput.trim()) applyReason(reasonInput);
                            if (e.key === "Escape") { setShowReasonsPopup(false); setReasonInput(""); }
                          }}
                          placeholder="Custom reason…"
                          autoFocus
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all"
                          style={{
                            background: "var(--surface-1)",
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-primary)",
                          }}
                        />
                        <button
                          onClick={() => applyReason(reasonInput)}
                          disabled={!reasonInput.trim()}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                          style={{ background: "var(--accent)", color: "#fff" }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: FILTERS */}
        {showFilters && (
          <aside className="w-64 shrink-0 bg-white dark:bg-[var(--surface-1)] border-l border-[var(--border-subtle)] flex flex-col overflow-hidden">
            <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Filters</span>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-[var(--surface-2)] rounded-md transition-colors">
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <FilterBar
              includeKeywords={includeKeywords}
              excludeKeywords={excludeKeywords}
              onIncludeKeywordsChange={setIncludeKeywords}
              onExcludeKeywordsChange={setExcludeKeywords}
              articles={articles as any}
            />
          </aside>
        )}
      </div>

      {/* ARTICLE NOTE POPUP - Compact Popover */}
      {articleNotePopup !== null && (() => {
        const art = filteredArticles.find(a => a.id === articleNotePopup);
        if (!art?._note) return null;
        return (
          <div
            className="fixed inset-0 z-[70]"
            onClick={() => setArticleNotePopup(null)}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl max-w-xs w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
                <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <h3 className="text-xs font-bold flex-1" style={{ color: "var(--text-primary)" }}>Note</h3>
                <button onClick={() => setArticleNotePopup(null)} className="p-0.5 rounded hover:bg-[var(--surface-2)] transition-colors" style={{ color: "var(--text-muted)" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--accent)", opacity: 0.9 }}
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--accent-light)" }}>{art.screening_decision_by || 'You'}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{art._note}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ARTICLE LABEL POPUP - Compact Popover */}
      {articleLabelPopup !== null && (() => {
        const art = filteredArticles.find(a => a.id === articleLabelPopup);
        if (!art?._labels?.length) return null;
        return (
          <div
            className="fixed inset-0 z-[70]"
            onClick={() => setArticleLabelPopup(null)}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl max-w-xs w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
                <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="text-xs font-bold flex-1" style={{ color: "var(--text-primary)" }}>Labels ({art._labels.length})</h3>
                <button onClick={() => setArticleLabelPopup(null)} className="p-0.5 rounded hover:bg-[var(--surface-2)] transition-colors" style={{ color: "var(--text-muted)" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-4 py-3 space-y-1.5 max-h-60 overflow-y-auto">
                {art._labels!.map((label, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "var(--accent)", opacity: 0.9 }}
                    >
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium flex-1" style={{ color: "var(--text-primary)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ARTICLE DECISION POPUP - Compact Popover */}
      {articleDecisionPopup !== null && (() => {
        const art = filteredArticles.find(a => a.id === articleDecisionPopup);
        if (!art?.screening_decision) return null;
        // Show popup for included, excluded, or explicitly marked undecided (confused)
        if (art.screening_decision === "undecided" && !art.screening_decision_by) return null;
        
        const isConfused = art.screening_decision === "undecided" && art.screening_decision_by;
        const isIncluded = art.screening_decision === "included";
        const isExcluded = art.screening_decision === "excluded";
        
        return (
          <div
            className="fixed inset-0 z-[70]"
            onClick={() => setArticleDecisionPopup(null)}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl max-w-xs w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
                {isIncluded ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isExcluded ? (
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <span className="text-lg font-bold leading-none" style={{ color: "rgba(245,158,11,0.95)" }}>?</span>
                )}
                <h3 className="text-xs font-bold flex-1" style={{ color: "var(--text-primary)" }}>
                  {isIncluded ? "Included" : isExcluded ? "Excluded" : "Confused"}
                </h3>
                <button onClick={() => setArticleDecisionPopup(null)} className="p-0.5 rounded hover:bg-[var(--surface-2)] transition-colors" style={{ color: "var(--text-muted)" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ 
                      background: isIncluded 
                        ? "rgba(34,197,94,0.9)" 
                        : isExcluded 
                        ? "rgba(239,68,68,0.9)" 
                        : "rgba(245,158,11,0.9)" 
                    }}
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-0.5" style={{ 
                      color: isIncluded 
                        ? "rgba(34,197,94,0.95)" 
                        : isExcluded 
                        ? "rgba(239,68,68,0.95)" 
                        : "rgba(245,158,11,0.95)" 
                    }}>
                      {art.screening_decision_by || 'You'}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {isConfused 
                        ? "Marked this article as confused/undecided" 
                        : `Marked this article as ${art.screening_decision}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
