"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import toast from 'react-hot-toast';
import api from "@/lib/api";
import type { PaginatedDuplicates } from "@/types/duplicate";

interface DuplicateTableProps {
  reviewId: number;
  statusFilter?: 'unresolved' | 'deleted' | 'not_duplicate' | 'resolved' | 'all';
  onCountsUpdate?: () => void;
  onSelectionChange?: (selectedIds: number[]) => void;
  clearSelection?: boolean;
  currentUser?: string;
  activeDuplicateId?: number | null;
  onActiveDuplicateIdChange?: (duplicateId: number) => void;
  onActiveArticleIdChange?: (articleId: number) => void;
  onRowDoubleClick?: (articleId: number) => void;
}

export interface DuplicateTableHandle {
  applyNoteToSelected: (selectedDuplicateIds: number[], note: string, author: string) => void;
  applyNoteToArticle: (articleId: number, note: string, author: string) => void;
  applyLabelToSelected: (selectedDuplicateIds: number[], label: string) => void;
  applyLabelToArticle: (articleId: number, label: string) => void;
  getAvailableLabels: () => string[];
  getSelectedDuplicatePairs: () => Array<{
    duplicateId: number;
    similarityScore: number;
    detectionReason: string;
    left: { articleId: number; title: string; authors: string; createdAt: string };
    right: { articleId: number; title: string; authors: string; createdAt: string };
  }>;
  getAllDuplicatePairs: () => Array<{
    duplicateId: number;
    similarityScore: number;
    detectionReason: string;
    left: { articleId: number; title: string; authors: string; createdAt: string };
    right: { articleId: number; title: string; authors: string; createdAt: string };
  }>;
  removeDuplicatePairs: (duplicateIds: number[]) => void;
}

interface ArticleWithDuplicate {
  articleId: number;
  title: string;
  authors: string;
  createdAt: string;
  duplicateId: number;
  duplicateArticleId: number;
  duplicateTitle: string;
  duplicateAuthors: string;
  duplicateCreatedAt: string;
  similarityScore: number;
  detectionReason: string;
  notes?: string;
  labels?: string[];
  noteAuthor?: string;
}

const DuplicateTable = forwardRef<DuplicateTableHandle, DuplicateTableProps>(
  function DuplicateTable({ reviewId, statusFilter = 'unresolved', onCountsUpdate, onSelectionChange, clearSelection, currentUser = 'You', activeDuplicateId, onActiveDuplicateIdChange, onActiveArticleIdChange, onRowDoubleClick }, ref) {
  // State management
  const [articles, setArticles] = useState<ArticleWithDuplicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // Keep resolved pairs available even if `articles` state changes.
  // This prevents “Resolve Duplicates” from opening with an empty queue.
  const selectedPairsRef = useRef<
    Record<
      number,
      {
        duplicateId: number;
        similarityScore: number;
        detectionReason: string;
        left: { articleId: number; title: string; authors: string; createdAt: string };
        right: { articleId: number; title: string; authors: string; createdAt: string };
      }
    >
  >({});

  // Store all currently fetched duplicate pairs (for “resolve next” even if nothing is checkbox-selected).
  const allPairsRef = useRef<
    Record<
      number,
      {
        duplicateId: number;
        similarityScore: number;
        detectionReason: string;
        left: { articleId: number; title: string; authors: string; createdAt: string };
        right: { articleId: number; title: string; authors: string; createdAt: string };
      }
    >
  >({});
  const allPairsOrderRef = useRef<number[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedArticleForLabel, setSelectedArticleForLabel] = useState<ArticleWithDuplicate | null>(null);
  const [newLabelText, setNewLabelText] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  // Dynamic labels — starts empty, grows as users add new ones via ActionBar
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [showNotePopup, setShowNotePopup] = useState<number | null>(null);
  const [showLabelPopup, setShowLabelPopup] = useState<number | null>(null);
  // Track active row by articleId (unique per row) — separate from activeDuplicateId which is pair-level
  const [activeRowArticleId, setActiveRowArticleId] = useState<number | null>(null);

  // Expose imperative methods to parent so ActionBar can update rows
  useImperativeHandle(ref, () => ({
    applyNoteToSelected(selectedDuplicateIds: number[], note: string, author: string) {
      setArticles(prev => prev.map(a =>
        selectedDuplicateIds.includes(a.duplicateId)
          ? { ...a, notes: note, noteAuthor: author }
          : a
      ));
    },
    applyNoteToArticle(articleId: number, note: string, author: string) {
      setArticles(prev => prev.map(a =>
        a.articleId === articleId
          ? { ...a, notes: note, noteAuthor: author }
          : a
      ));
    },
    applyLabelToSelected(selectedDuplicateIds: number[], label: string) {
      setAvailableLabels(prev => prev.includes(label) ? prev : [...prev, label]);
      setArticles(prev => prev.map(a =>
        selectedDuplicateIds.includes(a.duplicateId)
          ? { ...a, labels: [...new Set([...(a.labels || []), label])] }
          : a
      ));
    },
    applyLabelToArticle(articleId: number, label: string) {
      setAvailableLabels(prev => prev.includes(label) ? prev : [...prev, label]);
      setArticles(prev => prev.map(a =>
        a.articleId === articleId
          ? { ...a, labels: [...new Set([...(a.labels || []), label])] }
          : a
      ));
    },
    getAvailableLabels() {
      return availableLabels;
    },
    getSelectedDuplicatePairs() {
      return selectedIds
        .map((id) => selectedPairsRef.current[id])
        .filter(Boolean);
    },
    getAllDuplicatePairs() {
      return allPairsOrderRef.current
        .map((id) => allPairsRef.current[id])
        .filter(Boolean);
    },
    removeDuplicatePairs(duplicateIdsToRemove: number[]) {
      const removeSet = new Set(duplicateIdsToRemove);
      setArticles((prev) => prev.filter((a) => !removeSet.has(a.duplicateId)));
      setSelectedIds((prev) => prev.filter((id) => !removeSet.has(id)));
      duplicateIdsToRemove.forEach((id) => {
        delete selectedPairsRef.current[id];
        delete allPairsRef.current[id];
        allPairsOrderRef.current = allPairsOrderRef.current.filter((x) => x !== id);
      });
    },
  }));
  
  // Refs for infinite scroll
  const observerTarget = useRef<HTMLTableRowElement>(null);
  const loadingRef = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Reset when filter changes
  useEffect(() => {
    setArticles([]);
    setCurrentPage(1);
    setHasMore(true);
    setSelectedIds([]);
    setActiveRowArticleId(null);
    selectedPairsRef.current = {};
    allPairsRef.current = {};
    allPairsOrderRef.current = [];
    fetchDuplicates(1, true);
  }, [statusFilter, reviewId]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [selectedIds, onSelectionChange]);

  // Clear selection when parent requests it
  useEffect(() => {
    if (clearSelection) {
      setSelectedIds([]);
      selectedPairsRef.current = {};
    }
  }, [clearSelection]);

  // Auto-select the first duplicate row when entering the table.
  useEffect(() => {
    if (!onActiveDuplicateIdChange) return;
    if (activeDuplicateId !== null && activeDuplicateId !== undefined) return;
    if (articles.length === 0) return;
    onActiveDuplicateIdChange(articles[0].duplicateId);
  }, [articles, activeDuplicateId, onActiveDuplicateIdChange]);

  // Fetch duplicates from API and flatten to individual articles
  const fetchDuplicates = async (page: number, reset: boolean = false) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);

    try {
      const response: PaginatedDuplicates = await api.getDuplicates(
        reviewId,
        page,
        20,
        statusFilter === 'all' ? undefined : statusFilter
      );

      // Flatten duplicates to individual articles
      const flattenedArticles: ArticleWithDuplicate[] = [];
      response.data.forEach(dup => {
        // Store pair-level details once, so we can resolve even if row data is refreshed.
        if (!allPairsRef.current[dup.id]) {
          allPairsRef.current[dup.id] = {
            duplicateId: dup.id,
            similarityScore: dup.similarity_score,
            detectionReason: dup.detection_reason,
            left: {
              articleId: dup.article1_id,
              title: dup.article1_title,
              authors: dup.article1_authors || '',
              createdAt: dup.article1_created_at,
            },
            right: {
              articleId: dup.article2_id,
              title: dup.article2_title,
              authors: dup.article2_authors || '',
              createdAt: dup.article2_created_at,
            },
          };
          allPairsOrderRef.current.push(dup.id);
        }

        // For the "deleted" and "resolved" tabs, only show the loser article as the primary row.
        // For all other tabs, show both articles so labels/notes are visible on each.
        const isDeletedOrResolvedTab = statusFilter === 'deleted' || statusFilter === 'resolved';
        const loserId = dup.loser_article_id ?? null;

        if (isDeletedOrResolvedTab) {
          // Only push the loser article row
          const loserIsArticle1 = loserId === dup.article1_id;
          flattenedArticles.push({
            articleId: loserIsArticle1 ? dup.article1_id : dup.article2_id,
            title: loserIsArticle1 ? dup.article1_title : dup.article2_title,
            authors: loserIsArticle1 ? (dup.article1_authors || '') : (dup.article2_authors || ''),
            createdAt: loserIsArticle1 ? dup.article1_created_at : dup.article2_created_at,
            duplicateId: dup.id,
            duplicateArticleId: loserIsArticle1 ? dup.article2_id : dup.article1_id,
            duplicateTitle: loserIsArticle1 ? dup.article2_title : dup.article1_title,
            duplicateAuthors: loserIsArticle1 ? (dup.article2_authors || '') : (dup.article1_authors || ''),
            duplicateCreatedAt: loserIsArticle1 ? dup.article2_created_at : dup.article1_created_at,
            similarityScore: dup.similarity_score,
            detectionReason: dup.detection_reason,
            notes: loserIsArticle1 ? (dup.article1_screening_notes || undefined) : (dup.article2_screening_notes || undefined),
            labels: loserIsArticle1
              ? (dup.article1_labels?.length ? dup.article1_labels : [])
              : (dup.article2_labels?.length ? dup.article2_labels : []),
            noteAuthor: undefined,
          });
        } else {
          // Show both articles so labels/notes are visible on each row
          flattenedArticles.push({
            articleId: dup.article1_id,
            title: dup.article1_title,
            authors: dup.article1_authors || '',
            createdAt: dup.article1_created_at,
            duplicateId: dup.id,
            duplicateArticleId: dup.article2_id,
            duplicateTitle: dup.article2_title,
            duplicateAuthors: dup.article2_authors || '',
            duplicateCreatedAt: dup.article2_created_at,
            similarityScore: dup.similarity_score,
            detectionReason: dup.detection_reason,
            notes: dup.article1_screening_notes || undefined,
            labels: dup.article1_labels?.length ? dup.article1_labels : [],
            noteAuthor: undefined,
          });
          flattenedArticles.push({
            articleId: dup.article2_id,
            title: dup.article2_title,
            authors: dup.article2_authors || '',
            createdAt: dup.article2_created_at,
            duplicateId: dup.id,
            duplicateArticleId: dup.article1_id,
            duplicateTitle: dup.article1_title,
            duplicateAuthors: dup.article1_authors || '',
            duplicateCreatedAt: dup.article1_created_at,
            similarityScore: dup.similarity_score,
            detectionReason: dup.detection_reason,
            notes: dup.article2_screening_notes || undefined,
            labels: dup.article2_labels?.length ? dup.article2_labels : [],
            noteAuthor: undefined,
          });
        }
      });

      if (reset) {
        setArticles(flattenedArticles);
      } else {
        setArticles(prev => [...prev, ...flattenedArticles]);
      }

      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
      setHasMore(response.current_page < response.last_page);
    } catch (error) {
      console.error("Failed to fetch duplicates:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Debounced scroll handler
  const handleScroll = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (hasMore && !loading && currentPage < lastPage) {
        fetchDuplicates(currentPage + 1);
      }
    }, 200);
  }, [hasMore, loading, currentPage, lastPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleScroll();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [handleScroll]);

  // Keyword highlighting logic
  const extractCommonKeywords = (title1: string, title2: string): string[] => {
    if (!title1 || !title2) return [];
    
    const stopWords = ['the', 'a', 'an', 'of', 'in', 'for', 'to', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'with', 'at', 'from', 'by', 'on', 'as', 'this', 'that', 'these', 'those'];
    
    const words1 = title1.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const words2 = title2.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
    const set1 = new Set(words1.filter(w => !stopWords.includes(w)));
    const set2 = new Set(words2.filter(w => !stopWords.includes(w)));
    
    const common: string[] = [];
    set1.forEach(word => {
      if (set2.has(word)) {
        common.push(word);
      }
    });
    
    return common;
  };

  const highlightKeywords = (text: string, keywords: string[]): string => {
    if (!text || keywords.length === 0) return text;
    
    let highlighted = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      highlighted = highlighted.replace(
        regex,
        '<mark class="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 px-0.5 rounded">$1</mark>'
      );
    });
    
    return highlighted;
  };

  // Similarity color coding
  const getSimilarityColor = (score: number): string => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-orange-500 dark:text-orange-400";
    return "text-red-500 dark:text-red-400";
  };

  const getSimilarityDot = (score: number): string => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-orange-500";
    return "bg-red-500";
  };

  // Row selection
  const toggleSelect = (article: ArticleWithDuplicate) => {
    const duplicateId = article.duplicateId;
    setSelectedIds((prev) => {
      const isSelected = prev.includes(duplicateId);

      if (isSelected) {
        delete selectedPairsRef.current[duplicateId];
        return prev.filter((sid) => sid !== duplicateId);
      }

      selectedPairsRef.current[duplicateId] = {
        duplicateId,
        similarityScore: article.similarityScore,
        detectionReason: article.detectionReason,
        left: {
          articleId: article.articleId,
          title: article.title,
          authors: article.authors,
          createdAt: article.createdAt,
        },
        right: {
          articleId: article.duplicateArticleId,
          title: article.duplicateTitle,
          authors: article.duplicateAuthors,
          createdAt: article.duplicateCreatedAt,
        },
      };

      return [...prev, duplicateId];
    });
  };

  // Status update handlers
  const handleNotDuplicate = async (duplicateId: number) => {
    const previousArticles = [...articles];
    
    // Optimistic update
    setArticles(prev => prev.filter(a => a.duplicateId !== duplicateId));
    
    try {
      await api.updateDuplicateStatus(duplicateId, 'not_duplicate');
      if (onCountsUpdate) onCountsUpdate();
      toast.success('Marked as not duplicate', {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      setArticles(previousArticles);
      toast.error("Failed to update status. Please try again.", {
        duration: 4000,
        position: 'bottom-right',
      });
    }
  };

  const handleDelete = async (articleId: number, duplicateId: number) => {
    if (!confirm("Delete this article? This action cannot be undone.")) return;
    
    const previousArticles = [...articles];
    
    // Optimistic update
    setArticles(prev => prev.filter(a => a.duplicateId !== duplicateId));
    
    try {
      await api.deleteArticle(articleId);
      await api.updateDuplicateStatus(duplicateId, 'deleted');
      if (onCountsUpdate) onCountsUpdate();
      toast.success('Article deleted successfully', {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error("Failed to delete article:", error);
      setArticles(previousArticles);
      toast.error("Failed to delete article. Please try again.", {
        duration: 4000,
        position: 'bottom-right',
      });
    }
  };

  const handleApplyLabels = () => {
    if (!selectedArticleForLabel) return;

    const labelsToAdd = [
      ...selectedLabels,
      ...(newLabelText.trim() ? [newLabelText.trim()] : []),
    ];

    if (labelsToAdd.length === 0) {
      setShowLabelModal(false);
      setSelectedArticleForLabel(null);
      setSelectedLabels([]);
      setNewLabelText("");
      return;
    }

    // Add any brand-new label to the available list
    labelsToAdd.forEach(l => {
      setAvailableLabels(prev => prev.includes(l) ? prev : [...prev, l]);
    });

    // Update the article row
    setArticles(prev => prev.map(a =>
      a.articleId === selectedArticleForLabel.articleId
        ? { ...a, labels: [...new Set([...(a.labels || []), ...labelsToAdd])] }
        : a
    ));

    toast.success('Labels applied successfully', { duration: 2000, position: 'bottom-right' });

    setShowLabelModal(false);
    setSelectedArticleForLabel(null);
    setSelectedLabels([]);
    setNewLabelText("");
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Render loading skeleton
  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-[var(--border-subtle)]">
      <td className="px-4 py-3.5"><div className="w-3.5 h-3.5 bg-[var(--surface-2)] rounded" /></td>
      <td className="px-3 py-3.5"><div className="w-5 h-3 bg-[var(--surface-2)] rounded" /></td>
      <td className="px-4 py-3.5">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-[var(--surface-2)] rounded w-3/4" />
          <div className="h-3 bg-[var(--surface-2)] rounded w-2/5" />
        </div>
      </td>
      <td className="px-4 py-3.5"><div className="h-3 bg-[var(--surface-2)] rounded w-16" /></td>
      <td className="px-4 py-3.5"><div className="h-3 bg-[var(--surface-2)] rounded w-20" /></td>
    </tr>
  );

  return (
    <>
      {loading && articles.length === 0 ? (
        Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} />)
      ) : articles.length === 0 ? (
        <tr>
          <td colSpan={5} className="px-4 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-[var(--surface-2)] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">No duplicates in this category</p>
                <p className="text-xs text-[var(--text-muted)]">Try selecting a different status filter</p>
              </div>
            </div>
          </td>
        </tr>
      ) : (
        <>
          {articles.map((article, idx) => {
            const keywords = extractCommonKeywords(article.title, article.duplicateTitle);
            const highlightedTitle = highlightKeywords(article.title, keywords);

            return (
              <tr
                key={`${article.duplicateId}-${article.articleId}`}
                className="transition-all duration-150 group border-b border-[var(--border-subtle)]"
                style={{
                  background:
                    selectedIds.includes(article.duplicateId) || activeRowArticleId === article.articleId
                      ? "var(--accent-soft)"
                      : undefined,
                }}
                onClick={() => {
                  setActiveRowArticleId(article.articleId);
                  // Still notify parent of the pair so resolve queue works
                  onActiveDuplicateIdChange?.(article.duplicateId);
                  // Notify parent of the specific article clicked for ActionBar targeting
                  onActiveArticleIdChange?.(article.articleId);
                }}
                onDoubleClick={() => onRowDoubleClick?.(article.articleId)}
                onMouseEnter={(e) => {
                  if (!selectedIds.includes(article.duplicateId) && activeRowArticleId !== article.articleId) {
                    (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface-2)";
                  }
                  (e.currentTarget as HTMLTableRowElement).style.boxShadow = "inset 2px 0 0 var(--accent)";
                }}
                onMouseLeave={(e) => {
                  if (!selectedIds.includes(article.duplicateId) && activeRowArticleId !== article.articleId) {
                    (e.currentTarget as HTMLTableRowElement).style.background = "";
                  }
                  (e.currentTarget as HTMLTableRowElement).style.boxShadow = "";
                }}
              >
                <td className="px-4 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(article.duplicateId)}
                      onChange={() => toggleSelect(article)}
                      onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ opacity: selectedIds.includes(article.duplicateId) ? 1 : undefined }}
                    aria-label={`Select article ${idx + 1}`}
                  />
                </td>
                <td className="px-3 py-3 text-xs text-[var(--text-muted)] align-top tabular-nums">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div>
                    {/* Article Title with highlighting */}
                    <p
                      className="text-[13px] text-[var(--text-primary)] font-normal leading-snug mb-1.5"
                      dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                      title={article.title}
                    />
                    
                    {/* Labels displayed as badges */}
                    {article.labels && article.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
                        {article.labels.map((label, labelIdx) => (
                          <button
                            key={labelIdx}
                            onClick={() => setShowLabelPopup(article.articleId)}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold transition-all hover:opacity-80"
                            style={{
                              background: "var(--accent-soft)",
                              border: "1px solid var(--accent-border)",
                              color: "var(--accent-light)",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Notes displayed below */}
                    {article.notes && (
                      <button
                        onClick={() => setShowNotePopup(article.articleId)}
                        className="mt-1.5 w-full text-left flex items-start gap-2 p-2 rounded-lg border transition-all hover:opacity-80"
                        style={{
                          background: "var(--accent-soft)",
                          borderColor: "var(--accent-border)",
                        }}
                      >
                        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold" style={{ color: "var(--accent-light)" }}>
                            {article.noteAuthor || currentUser}
                          </span>
                          <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                            {article.notes}
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Note Popup */}
                    {showNotePopup === article.articleId && article.notes && (
                      <div
                        className="fixed inset-0 z-[70] flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                        onClick={() => setShowNotePopup(null)}
                      >
                        <div
                          className="rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
                          style={{
                            background: "var(--surface-1)",
                            border: "1px solid var(--border-subtle)",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-border)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Notes</h3>
                            </div>
                            <button onClick={() => setShowNotePopup(null)} className="p-1 rounded-lg transition-all hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          <div className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)", boxShadow: "0 0 12px var(--accent-glow)" }}
                              >
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold mb-1" style={{ color: "var(--accent-light)" }}>{article.noteAuthor || currentUser}</p>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{article.notes}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Label Popup */}
                    {showLabelPopup === article.articleId && article.labels && article.labels.length > 0 && (
                      <div
                        className="fixed inset-0 z-[70] flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                        onClick={() => setShowLabelPopup(null)}
                      >
                        <div
                          className="rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
                          style={{
                            background: "var(--surface-1)",
                            border: "1px solid var(--border-subtle)",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-border)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Labels</h3>
                            </div>
                            <button onClick={() => setShowLabelPopup(null)} className="p-1 rounded-lg transition-all hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          <div className="px-5 py-4 space-y-2">
                            {article.labels.map((label, li) => (
                              <div key={li} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                  style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)" }}
                                >
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold" style={{ color: "var(--accent-light)" }}>{currentUser}</p>
                                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Label: {label}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons row — removed: notes/labels are added via ActionBar only */}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)] align-top whitespace-nowrap">
                  {formatDate(article.createdAt)}
                </td>
                <td className="px-4 py-3 text-xs align-top max-w-[140px]">
                  <span
                    className="block truncate"
                    style={{ color: "var(--text-muted)" }}
                    title={article.authors}
                  >
                    {article.authors || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${getSimilarityColor(article.similarityScore)}`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${getSimilarityDot(article.similarityScore)}`} />
                    {article.similarityScore}%
                  </span>
                </td>
              </tr>
            );
          })}

          {/* Infinite scroll trigger row */}
          <tr ref={observerTarget}>
            <td colSpan={5} className="py-4 text-center">
              {loading && articles.length > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading more duplicates...
                </div>
              )}
              {!hasMore && articles.length > 0 && (
                <p className="text-sm text-[var(--text-muted)]">No more duplicates</p>
              )}
            </td>
          </tr>
        </>
      )}

      {/* Label Modal removed — labels are applied via the ActionBar label popup */}
    </>
  );
});

export default DuplicateTable;
