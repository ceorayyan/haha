"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import toast, { Toaster } from 'react-hot-toast';
import api from "@/lib/api";
import DuplicateTable from "@/components/DuplicateTable";
import type { DuplicateTableHandle } from "@/components/DuplicateTable";
import SidebarCounters from "@/components/SidebarCounters";
import ActionBar from "@/components/ActionBar";
import type { StatusCounts } from "@/types/duplicate";
import FilterBar from "@/components/FilterBar";
import ManualDuplicateResolveModal, { type DuplicateResolvePair } from "@/components/ManualDuplicateResolveModal";

interface Article {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  url?: string;
  screening_decision?: string;
  screening_notes?: string;
  labels?: string[];       // persisted array from DB
  created_at: string;
  file_path?: string;
  // UI display fields — populated from DB on fetch, updated optimistically
  _note?: string;
  _noteAuthor?: string;
  _labels?: string[];
}

interface ImportedFile {
  name: string;
  count: number;
  file_path?: string;
}

export default function ReviewDataPage() {
  const params = useParams();
  const reviewId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [treeOpen, setTreeOpen] = useState(true);
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [detectingDuplicates, setDetectingDuplicates] = useState(false);
  const [showDuplicatesInTable, setShowDuplicatesInTable] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('unresolved');
  const [activeTab, setActiveTab] = useState<'all_articles' | 'duplicates'>('all_articles');
  const [duplicateCounts, setDuplicateCounts] = useState<StatusCounts>({
    unresolved: 0,
    deleted: 0,
    not_duplicate: 0,
    resolved: 0,
    total: 0,
  });
  const [showRerunModal, setShowRerunModal] = useState(false);
  const [incrementalOnly, setIncrementalOnly] = useState(false);
  const [selectedArticleModal, setSelectedArticleModal] = useState<Article | null>(null);
  const [bulkLabel, setBulkLabel] = useState<string>("");
  const [bulkNotes, setBulkNotes] = useState<string>("");
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [customLabel, setCustomLabel] = useState<string>("");
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [importedRefsDropdownOpen, setImportedRefsDropdownOpen] = useState(false);
  const [selectedImportedRefPath, setSelectedImportedRefPath] = useState<string>("__all__");
  const [showAddReferencesModal, setShowAddReferencesModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const duplicateTableRef = useRef<DuplicateTableHandle>(null);
  const [selectedDuplicateIds, setSelectedDuplicateIds] = useState<number[]>([]);
  const [activeDuplicateId, setActiveDuplicateId] = useState<number | null>(null);
  // Track the specific article row clicked in the duplicate table (not the pair ID)
  const [activeDuplicateArticleId, setActiveDuplicateArticleId] = useState<number | null>(null);
  const [clearDuplicateSelection, setClearDuplicateSelection] = useState(false);
  const [showManualDuplicateResolve, setShowManualDuplicateResolve] = useState(false);
  const [duplicateResolveQueue, setDuplicateResolveQueue] = useState<DuplicateResolvePair[]>([]);
  const [duplicateResolveIndex, setDuplicateResolveIndex] = useState(0);
  const [manualDuplicateResolvingId, setManualDuplicateResolvingId] = useState<number | null>(null);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  // Shared dynamic label list across both tables (user-created custom labels only; suggested ones live in ActionBar)
  const [globalLabels, setGlobalLabels] = useState<string[]>([]);
  // Popup state for viewing notes/labels in article rows
  const [articleNotePopup, setArticleNotePopup] = useState<number | null>(null);
  const [articleLabelPopup, setArticleLabelPopup] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const articlesData = await api.getArticles(reviewId, currentPage, 100);
        const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData?.data || [];
        // Map persisted DB fields to UI display fields so labels/notes survive refresh
        const mappedArticles = articlesArray.map((a: Article) => ({
          ...a,
          _labels: a.labels && a.labels.length > 0 ? a.labels : a._labels,
          _note: a.screening_notes || a._note,
        }));
        
        // Append to existing articles for infinite scroll
        if (currentPage === 1) {
          setArticles(mappedArticles);
        } else {
          setArticles(prev => [...prev, ...mappedArticles]);
        }
        
        setHasMore(articlesData?.current_page < articlesData?.last_page);
        setTotalArticles(articlesData?.total || articlesArray.length);

        const fileMap = new Map<string, number>();
        articlesArray.forEach((article: Article) => {
          if (article.file_path) {
            fileMap.set(article.file_path, (fileMap.get(article.file_path) || 0) + 1);
          }
        });

        const files: ImportedFile[] = Array.from(fileMap.entries()).map(([path, count]) => ({
          name: path.split('/').pop() || 'Unknown',
          count,
          file_path: path,
        }));
        setImportedFiles(files);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reviewId, currentPage]);

  // Fetch duplicate counts on mount
  useEffect(() => {
    fetchDuplicateCounts();
  }, [reviewId]);

  // When switching duplicate views, reset active single-selection so the table can auto-pick row 1.
  useEffect(() => {
    if (activeTab === 'duplicates') {
      setActiveDuplicateId(null);
      setActiveDuplicateArticleId(null);
      setShowDuplicatesInTable(true);
    } else {
      setShowDuplicatesInTable(false);
    }
  }, [activeTab, statusFilter]);

  const fetchDuplicateCounts = async () => {
    try {
      const counts = await api.getDuplicateCounts(reviewId);
      setDuplicateCounts(counts);
    } catch (error) {
      console.error("Failed to fetch duplicate counts:", error);
    }
  };

  const highlightText = (text: string) => {
    if (!text) return text;
    let highlightedText = text;
    includeKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-1 rounded font-medium">$1</mark>');
    });
    excludeKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-1 rounded font-medium">$1</mark>');
    });
    return highlightedText;
  };

  const filteredArticles = articles.filter(article => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        article.title?.toLowerCase().includes(searchLower) ||
        article.authors?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    return true;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "author") return (a.authors || "").localeCompare(b.authors || "");
    return 0;
  });

  // Auto-select the first visible article row (single-click selection).
  useEffect(() => {
    if (showDuplicatesInTable) return;
    const firstId = sortedArticles[0]?.id ?? null;
    if (!firstId) return;
    setActiveArticleId((prev) => {
      if (prev !== null && sortedArticles.some((a) => a.id === prev)) return prev;
      return firstId;
    });
  }, [showDuplicatesInTable, sortedArticles]);

  // Infinite scroll observer
  const observerTarget = useRef<HTMLTableRowElement>(null);
  
  useEffect(() => {
    if (showDuplicatesInTable) return; // Only for articles table
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, showDuplicatesInTable]);

  const decisionDot = (d: string | null) => {
    if (d === "include") return <span className="inline-block w-2 h-2 rounded-full bg-green-500" />;
    if (d === "exclude") return <span className="inline-block w-2 h-2 rounded-full bg-red-500" />;
    if (d === "maybe") return <span className="inline-block w-2 h-2 rounded-full bg-orange-400" />;
    return <span className="inline-block w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />;
  };

  const handleUpdateCustomLabel = async (articleId: number, label: string) => {
    try {
      await api.updateArticle(articleId, { screening_notes: label });
      setArticles(articles.map(a => a.id === articleId ? { ...a, screening_notes: label } : a));
      setEditingArticleId(null);
      setCustomLabel("");
    } catch (error) {
      console.error("Failed to update label:", error);
    }
  };

  const handleDetectDuplicates = async () => {
    setDetectingDuplicates(true);
    setShowDuplicateModal(false); // Close modal immediately when detection starts
    
    try {
      const response = await api.detectDuplicatesEnhanced(reviewId);
      console.log('Duplicate detection response:', response);
      
      // Fetch updated counts after detection
      await fetchDuplicateCounts();
      
      // Show duplicates in table
      setActiveTab('duplicates');
      setShowDuplicatesInTable(true);
      
      if (response?.data?.total_duplicates > 0) {
        toast.success(`Found ${response.data.total_duplicates} duplicate pairs!`, {
          duration: 4000,
          position: 'bottom-right',
        });
      } else {
        toast('No duplicates found!', {
          icon: 'ℹ️',
          duration: 3000,
          position: 'bottom-right',
        });
      }
    } catch (error) {
      console.error("Failed to detect duplicates:", error);
      toast.error(`Failed to detect duplicates: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-right',
      });
    } finally {
      setDetectingDuplicates(false);
    }
  };

  const handleRerunDetection = async () => {
    setDetectingDuplicates(true);
    setShowRerunModal(false); // Close modal immediately when detection starts
    
    try {
      const response = await api.detectDuplicatesEnhanced(reviewId, {
        clearExisting: !incrementalOnly,
        incrementalOnly: incrementalOnly,
      });
      console.log('Re-run detection response:', response);
      
      // Fetch updated counts after detection
      await fetchDuplicateCounts();
      
      // Show duplicates in table
      setActiveTab('duplicates');
      setShowDuplicatesInTable(true);
      
      if (response?.data?.total_duplicates > 0) {
        const mode = incrementalOnly ? 'incremental' : 'full';
        toast.success(`${mode.charAt(0).toUpperCase() + mode.slice(1)} re-run completed! Found ${response.data.total_duplicates} duplicate pairs.`, {
          duration: 4000,
          position: 'bottom-right',
        });
      } else {
        const message = incrementalOnly ? 'No new duplicates found in recent articles.' : 'No duplicates found!';
        toast(message, {
          icon: 'ℹ️',
          duration: 3000,
          position: 'bottom-right',
        });
      }
    } catch (error) {
      console.error("Failed to re-run duplicate detection:", error);
      toast.error(`Failed to re-run detection: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-right',
      });
    } finally {
      setDetectingDuplicates(false);
      setIncrementalOnly(false); // Reset checkbox
    }
  };

  const handleDeleteDuplicate = async (articleId: number) => {
    try {
      await api.deleteArticle(articleId);
      setArticles(articles.filter(a => a.id !== articleId));
      setTotalArticles(totalArticles - 1);
      // Refresh duplicate counts after deletion
      await fetchDuplicateCounts();
    } catch (error) {
      console.error("Failed to delete article:", error);
    }
  };

  const handleBulkResolve = () => {
    const selectedPairs = duplicateTableRef.current?.getSelectedDuplicatePairs() || [];
    const allPairs = duplicateTableRef.current?.getAllDuplicatePairs() || [];
    const pairs = selectedPairs.length > 0 ? selectedPairs : allPairs;
    if (pairs.length === 0) return;
    setDuplicateResolveQueue(pairs);
    setDuplicateResolveIndex(0);
    setManualDuplicateResolvingId(null);
    setShowManualDuplicateResolve(true);
  };

  const handleManualDuplicateChoice = async (choice: "left" | "right" | "both") => {
    const pair = duplicateResolveQueue[duplicateResolveIndex];
    if (!pair || manualDuplicateResolvingId !== null) return;

    setManualDuplicateResolvingId(pair.duplicateId);
    try {
      // Single API call handles everything atomically:
      // - keep=left  → pair → "resolved", new "deleted" record created for right article
      // - keep=right → pair → "resolved", new "deleted" record created for left article
      // - keep=both  → pair → "not_duplicate"
      await api.resolveDuplicate(pair.duplicateId, choice);

      // Remove the pair from the duplicate table UI
      duplicateTableRef.current?.removeDuplicatePairs([pair.duplicateId]);
      setSelectedDuplicateIds((prev) => prev.filter((id) => id !== pair.duplicateId));

      // Refresh sidebar counters (Unresolved ↓, Resolved ↑, Deleted ↑)
      await fetchDuplicateCounts();

      // Advance to next pair or close modal
      const nextIndex = duplicateResolveIndex + 1;
      if (nextIndex >= duplicateResolveQueue.length) {
        setShowManualDuplicateResolve(false);
        setDuplicateResolveQueue([]);
        setDuplicateResolveIndex(0);
        setSelectedDuplicateIds([]);
        setClearDuplicateSelection(true);
        setTimeout(() => setClearDuplicateSelection(false), 100);
        toast.success('All pairs resolved!', { duration: 3000, position: 'bottom-right' });
      } else {
        setDuplicateResolveIndex(nextIndex);
      }
    } catch (error: any) {
      console.error("Failed to resolve duplicate pair:", error);
      toast.error(error?.message || "Failed to resolve duplicates");
    } finally {
      setManualDuplicateResolvingId(null);
    }
  };

  const handleBulkLabel = async () => {
    if (!labelInput.trim()) {
      setShowLabelDialog(false);
      return;
    }
    const label = labelInput.trim();
    // Add to global label list if new
    setGlobalLabels(prev => prev.includes(label) ? prev : [...prev, label]);

    if (showDuplicatesInTable) {
      const targets =
        selectedDuplicateIds.length > 0
          ? selectedDuplicateIds
          : activeDuplicateId !== null
            ? [activeDuplicateId]
            : [];

      if (targets.length === 0) { setShowLabelDialog(false); return; }

      duplicateTableRef.current?.applyLabelToSelected(targets, label);
      toast.success(`Label "${label}" applied to ${targets.length} item(s)!`, { duration: 3000, position: 'bottom-right' });

      // Only clear checkbox selection if user was doing bulk selection.
      if (selectedDuplicateIds.length > 0) {
        setSelectedDuplicateIds([]);
        setClearDuplicateSelection(true);
        setTimeout(() => setClearDuplicateSelection(false), 100);
      }
    } else {
      const targets =
        selectedArticles.length > 0
          ? selectedArticles
          : activeArticleId !== null
            ? [activeArticleId]
            : [];

      if (targets.length === 0) { setShowLabelDialog(false); return; }

      setArticles(prev =>
        prev.map(a =>
          targets.includes(a.id)
            ? { ...a, _labels: [...new Set([...(a._labels || []), label])] }
            : a
        )
      );
      toast.success(`Label "${label}" applied to ${targets.length} article(s)!`, { duration: 3000, position: 'bottom-right' });

      // Only clear checkbox selection if user was doing bulk selection.
      if (selectedArticles.length > 0) setSelectedArticles([]);
    }
    setLabelInput("");
    setShowLabelDialog(false);
  };

  const handleSelectionChange = (ids: number[]) => {
    setSelectedDuplicateIds(ids);
  };

  const handleClearSelection = () => {
    setSelectedDuplicateIds([]);
    setClearDuplicateSelection(true);
    setTimeout(() => setClearDuplicateSelection(false), 100);
  };

  const uploadArticles = async () => {
    if (selectedFiles.length === 0) {
      setShowAddReferencesModal(false);
      return;
    }
    setUploading(true);
    try {
      let successCount = 0;
      let failureCount = 0;
      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
          formData.append('file', file);
          await api.createArticle(reviewId, formData);
          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failureCount++;
        }
      }
      const articlesData = await api.getArticles(reviewId, 1, 100);
      const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData?.data || [];
      const mappedArticles = articlesArray.map((a: Article) => ({
        ...a,
        _labels: a.labels && a.labels.length > 0 ? a.labels : a._labels,
        _note: a.screening_notes || a._note,
      }));
      setArticles(mappedArticles);
      setHasMore(articlesData?.current_page < articlesData?.last_page);
      setTotalArticles(articlesData?.total || articlesArray.length);
      setCurrentPage(1);
      const fileMap = new Map<string, number>();
      articlesArray.forEach((article: Article) => {
        if (article.file_path) {
          fileMap.set(article.file_path, (fileMap.get(article.file_path) || 0) + 1);
        }
      });
      const files: ImportedFile[] = Array.from(fileMap.entries()).map(([path, count]) => ({
        name: path.split('/').pop() || 'Unknown',
        count,
        file_path: path,
      }));
      setImportedFiles(files);
      if (failureCount > 0) {
        alert(`Uploaded ${successCount} article(s). Failed to upload ${failureCount} article(s).`);
      } else {
        alert(`Successfully uploaded ${successCount} article(s)!`);
      }
      setShowAddReferencesModal(false);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Failed to upload articles:", error);
      alert("Failed to upload articles. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const deleteImportedFile = async (filePath: string) => {
    if (!confirm("Delete all articles from this file?")) return;
    try {
      const articlesToDelete = articles.filter(a => a.file_path === filePath);
      for (const article of articlesToDelete) {
        await api.deleteArticle(article.id);
      }
      const articlesData = await api.getArticles(reviewId, 1, 100);
      const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData?.data || [];
      const mappedArticles = articlesArray.map((a: Article) => ({
        ...a,
        _labels: a.labels && a.labels.length > 0 ? a.labels : a._labels,
        _note: a.screening_notes || a._note,
      }));
      setArticles(mappedArticles);
      setHasMore(articlesData?.current_page < articlesData?.last_page);
      setTotalArticles(articlesData?.total || articlesArray.length);
      setCurrentPage(1);
      const fileMap = new Map<string, number>();
      articlesArray.forEach((article: Article) => {
        if (article.file_path) {
          fileMap.set(article.file_path, (fileMap.get(article.file_path) || 0) + 1);
        }
      });
      const files: ImportedFile[] = Array.from(fileMap.entries()).map(([path, count]) => ({
        name: path.split('/').pop() || 'Unknown',
        count,
        file_path: path,
      }));
      setImportedFiles(files);
      // If the currently selected dropdown item was deleted, fall back to "All References".
      setSelectedImportedRefPath((prev) => (prev === filePath ? "__all__" : prev));
      setImportedRefsDropdownOpen(false);
    } catch (error) {
      console.error("Failed to delete file articles:", error);
      alert("Failed to delete articles. Please try again.");
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedArticles.length === 0) return;
    try {
      const updateData: any = { article_ids: selectedArticles };
      if (bulkLabel) updateData.screening_decision = bulkLabel;
      if (bulkNotes) updateData.screening_notes = bulkNotes;
      await api.bulkUpdateArticles(reviewId, updateData);
      setArticles(articles.map(a =>
        selectedArticles.includes(a.id)
          ? { ...a, screening_decision: bulkLabel || a.screening_decision, screening_notes: bulkNotes || a.screening_notes }
          : a
      ));
      setSelectedArticles([]);
      setBulkLabel("");
      setBulkNotes("");
    } catch (error) {
      console.error("Failed to bulk update articles:", error);
    }
  };

  const handleBulkResolveDuplicates = async () => {
    if (selectedDuplicateIds.length === 0) return;
    
    try {
      // Resolve each selected pair — mark as resolved (no article deletion)
      await Promise.all(
        selectedDuplicateIds.map(id => api.updateDuplicateStatus(id, 'resolved'))
      );
      
      // Refresh duplicate counts
      await fetchDuplicateCounts();
      
      // Remove resolved pairs from the table UI
      duplicateTableRef.current?.removeDuplicatePairs(selectedDuplicateIds);

      // Clear selection
      setSelectedDuplicateIds([]);
      setClearDuplicateSelection(true);
      setTimeout(() => setClearDuplicateSelection(false), 100);

      toast.success(`Resolved ${selectedDuplicateIds.length} duplicate pair(s)!`, { duration: 3000, position: 'bottom-right' });
    } catch (error) {
      console.error("Failed to bulk resolve duplicates:", error);
      toast.error(`Failed to resolve duplicates: ${error instanceof Error ? error.message : 'Unknown error'}`, { duration: 4000, position: 'bottom-right' });
    }
  };

  const handleBulkLabelDuplicates = async () => {
    // This is now handled inline by the ActionBar onLabel handler — kept for reference only
  };

  const handleClearDuplicateSelection = () => {
    setSelectedDuplicateIds([]);
    setClearDuplicateSelection(true);
    setTimeout(() => setClearDuplicateSelection(false), 100);
  };

  const toggleSelectAll = () => {
    if (selectedArticles.length === sortedArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(sortedArticles.map(a => a.id));
    }
  };

  const toggleSelectArticle = (id: number) => {
    setSelectedArticles(prev =>
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

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

  const SideStatRow = ({
    icon, label, count, active = false, onClick
  }: { icon: React.ReactNode; label: string; count: number; active?: boolean; onClick?: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "hover:bg-[var(--surface-2)] text-[var(--text-secondary)]"
      }`}
    >
      <div className="flex items-center gap-2.5">{icon}<span className="font-medium text-xs">{label}</span></div>
      <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">{count}</span>
    </button>
  );

  return (
    <>
      <Toaster />
      <div className="h-full overflow-hidden flex bg-[var(--surface-1)]">

      {/* LEFT SIDEBAR */}
      <aside className={`${treeOpen ? "w-64" : "w-12"} shrink-0 border-r border-[var(--border-subtle)] flex flex-col overflow-hidden bg-white dark:bg-[var(--surface-1)] transition-all duration-200`}>
        <div className="h-12 px-3 flex items-center border-b border-[var(--border-subtle)] shrink-0">
          {treeOpen && <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest flex-1">All Data</span>}
          <button
            onClick={() => setTreeOpen(!treeOpen)}
            className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors ml-auto"
          >
            <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${treeOpen ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {treeOpen && (
          <div className="flex-1 overflow-y-auto">
            {/* Imported References */}
            <div className="px-3 py-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Imported Refs
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setImportedRefsDropdownOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--surface-2)] text-sm border border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {selectedImportedRefPath === "__all__"
                        ? "All References"
                        : importedFiles.find((f) => f.file_path === selectedImportedRefPath)?.name || "Selected File"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[var(--text-secondary)] tabular-nums shrink-0">
                    {selectedImportedRefPath === "__all__"
                      ? totalArticles.toLocaleString()
                      : importedFiles.find((f) => f.file_path === selectedImportedRefPath)?.count?.toLocaleString() || "0"}
                  </span>
                </button>

                {importedRefsDropdownOpen && (
                  <div
                    className="absolute z-[60] mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-white dark:bg-[var(--surface-1)] shadow-lg overflow-hidden"
                    style={{ maxHeight: 260 }}
                  >
                    <button
                      onClick={() => {
                        setSelectedImportedRefPath("__all__");
                        setImportedRefsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors ${
                        selectedImportedRefPath === "__all__" ? "bg-[var(--accent-soft)]" : ""
                      }`}
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span className="truncate">All References</span>
                      <span className="text-[var(--text-secondary)] tabular-nums">{totalArticles.toLocaleString()}</span>
                    </button>

                    <div className="max-h-60 overflow-y-auto">
                      {importedFiles.map((file) => (
                        <div
                          key={file.file_path}
                          className="px-2 py-1 hover:bg-[var(--surface-2)] transition-colors group flex items-center justify-between"
                        >
                          <button
                            onClick={() => {
                              setSelectedImportedRefPath(file.file_path || "");
                              setImportedRefsDropdownOpen(false);
                            }}
                            className="flex-1 min-w-0 px-3 py-2 text-left"
                            style={{ color: "var(--text-primary)" }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <svg className="w-3 h-3 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs truncate">{file.name}</span>
                              </div>
                              <span className="text-[var(--text-muted)] tabular-nums text-xs shrink-0">{file.count}</span>
                            </div>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImportedFile(file.file_path || "");
                            }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-950/60 rounded transition-all shrink-0"
                            aria-label={`Delete imported file ${file.name}`}
                          >
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowAddReferencesModal(true)}
                className="mt-2 w-full py-2 text-xs font-semibold text-[var(--accent)] bg-[var(--accent-soft)] rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors border border-[var(--accent-border)]"
              >
                + Add References
              </button>
            </div>

            {/* Possible Duplicates */}
            <div className="px-3 py-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Data Views
                </div>
              </div>

              <div className="space-y-0.5">
                {/* All Articles Tab */}
                <button
                  onClick={() => setActiveTab('all_articles')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-left"
                  style={{
                    background: activeTab === 'all_articles' ? "var(--accent-soft)" : "transparent",
                    border: activeTab === 'all_articles' ? "1px solid var(--accent-border)" : "1px solid transparent",
                  }}
                  aria-label="View all articles"
                  aria-pressed={activeTab === 'all_articles'}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "#8B5CF6" }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: activeTab === 'all_articles' ? "var(--accent)" : "var(--text-secondary)" }}
                    >
                      All Articles
                    </span>
                  </div>
                  <span
                    className="text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{
                      background: activeTab === 'all_articles' ? "var(--accent)" : "var(--surface-3)",
                      color: activeTab === 'all_articles' ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {totalArticles.toLocaleString()}
                  </span>
                </button>

                <SidebarCounters
                  counts={duplicateCounts}
                  activeStatus={activeTab === 'duplicates' ? statusFilter : ''}
                  onStatusClick={(status) => {
                    setStatusFilter(status);
                    setActiveTab('duplicates');
                    setShowDuplicatesInTable(true);
                  }}
                />
                <div className="pt-1">
                  {duplicateCounts.total === 0 ? (
                    <button
                      onClick={() => setShowDuplicateModal(true)}
                      className="w-full py-2 text-xs font-semibold text-[var(--accent)] bg-[var(--accent-soft)] rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors border border-[var(--accent-border)]"
                    >
                      Detect Duplicates
                    </button>
                  ) : (
                    <div className="space-y-1">
                      <button
                        onClick={() => setShowRerunModal(true)}
                        className="w-full py-2 text-xs font-semibold text-[var(--accent)] bg-[var(--accent-soft)] rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors border border-[var(--accent-border)]"
                      >
                        Re-run Detection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* CENTER: TABLE */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[var(--surface-1)] min-w-0">
        {/* Toolbar */}
        <div className="h-12 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 gap-3">
          <span className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
            {activeTab === 'duplicates'
              ? `${duplicateCounts[statusFilter as keyof StatusCounts] || 0} ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('_', ' ')} Duplicates`
              : loading ? "Loading…"
                : `Showing ${sortedArticles.length.toLocaleString()} / ${totalArticles.toLocaleString()} Articles`}
            {selectedArticles.length > 0 && activeTab === 'all_articles' && (
              <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">({selectedArticles.length} selected)</span>
            )}
          </span>
          <div className="flex items-center gap-2">
              {activeTab === 'duplicates' && statusFilter === "unresolved" && duplicateCounts.unresolved > 0 && (
                <button
                  onClick={handleBulkResolve}
                  className="px-3 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Resolve Duplicates
                </button>
              )}
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8 pr-3 py-1.5 text-sm bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
              <svg className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm bg-white dark:bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="title">Sort: Title</option>
              <option value="date">Sort: Date</option>
              <option value="author">Sort: Author</option>
            </select>
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
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border-subtle)] sticky top-0 z-10">
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" checked={selectedArticles.length === sortedArticles.length && sortedArticles.length > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-[var(--accent)]" />
                </th>
                <th className="w-10 px-3 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1">Title <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                </th>
                <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1">Date <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                </th>
                <th className="w-36 px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">Author</th>
                {showDuplicatesInTable && (
                  <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">Similarity</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {activeTab === 'duplicates' ? (
                <>
                  <DuplicateTable
                    ref={duplicateTableRef}
                    reviewId={reviewId}
                    statusFilter={statusFilter as 'unresolved' | 'deleted' | 'not_duplicate' | 'resolved'}
                    onCountsUpdate={fetchDuplicateCounts}
                    onSelectionChange={handleSelectionChange}
                    clearSelection={clearDuplicateSelection}
                    currentUser={api.getStoredUser()?.name || 'You'}
                    activeDuplicateId={activeDuplicateId}
                    onActiveDuplicateIdChange={(id) => setActiveDuplicateId(id)}
                    onActiveArticleIdChange={(id) => setActiveDuplicateArticleId(id)}
                    onRowDoubleClick={async (articleId) => {
                      try {
                        const art = await api.getArticle(articleId);
                        setSelectedArticleModal(art as any);
                      } catch (e) {
                        console.error("Failed to open article details:", e);
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  {sortedArticles.map((article, idx) => (
                    <tr
                      key={`${article.id}-${idx}`}
                      className="hover:bg-[var(--surface-2)] transition-colors cursor-pointer group border-b border-[var(--border-subtle)]"
                      style={{
                        background: activeArticleId === article.id ? "var(--accent-soft)" : undefined,
                      }}
                      onClick={() => setActiveArticleId(article.id)}
                      onDoubleClick={() => setSelectedArticleModal(article)}
                    >
                      <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedArticles.includes(article.id)}
                          onChange={() => toggleSelectArticle(article.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                          style={{ opacity: selectedArticles.includes(article.id) ? 1 : undefined }}
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-[var(--text-muted)] align-top tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3">
                        {/* Title */}
                        <p
                          className="text-sm text-[var(--text-primary)] font-normal leading-snug mb-1"
                          dangerouslySetInnerHTML={{ __html: highlightText(article.title) }}
                        />
                        {/* Labels and Notes on same line */}
                        {(article._labels && article._labels.length > 0) || article._note ? (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {/* Labels */}
                            {article._labels && article._labels.length > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setArticleLabelPopup(article.id); }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all hover:opacity-80"
                                style={{
                                  background: "var(--accent-soft)",
                                  border: "1px solid var(--accent-border)",
                                  color: "var(--accent-light)",
                                }}
                                title={`${article._labels.length} label(s) by ${article._noteAuthor || 'You'}`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span>{article._labels.length}</span>
                              </button>
                            )}
                            {/* Note */}
                            {article._note && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setArticleNotePopup(article.id); }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all hover:opacity-80"
                                style={{
                                  background: "var(--accent-soft)",
                                  border: "1px solid var(--accent-border)",
                                  color: "var(--accent-light)",
                                }}
                                title={`Note by ${article._noteAuthor || 'You'}`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span className="truncate max-w-[120px]">{article._note}</span>
                              </button>
                            )}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)] align-top tabular-nums">{new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)] align-top truncate" title={article.authors}>{article.authors || "—"}</td>
                    </tr>
                  ))}
                  {/* Skeleton loading rows */}
                  {loading && Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={`skeleton-${idx}`} />)}
                  {/* Infinite scroll observer target */}
                  {!loading && hasMore && (
                    <tr ref={observerTarget}>
                      <td colSpan={5} className="h-4"></td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* ActionBar — replaces footer, includes pagination */}
        {(() => {
          const effectiveIds = activeTab === 'duplicates'
            ? selectedDuplicateIds.length > 0
              ? selectedDuplicateIds
              : activeDuplicateArticleId !== null
                ? [activeDuplicateArticleId]
                : []
            : selectedArticles.length > 0
              ? selectedArticles
              : activeArticleId !== null
                ? [activeArticleId]
                : [];

          return (
            <ActionBar
              disabled={effectiveIds.length === 0}
              onAttachPdf={() => setShowAddReferencesModal(true)}
              onLabel={async (label) => {
                if (!label.trim()) return;
                // Add to global label list if it's a new custom label
                setGlobalLabels(prev => prev.includes(label) ? prev : [...prev, label]);

                if (activeTab === 'duplicates') {
                  // Use checkbox selection (duplicateIds) for bulk, or the specific clicked articleId for single
                  if (selectedDuplicateIds.length > 0) {
                    duplicateTableRef.current?.applyLabelToSelected(selectedDuplicateIds, label);
                    toast.success(`Label "${label}" applied to ${selectedDuplicateIds.length} item(s)!`, { duration: 3000, position: 'bottom-right' });
                    setSelectedDuplicateIds([]);
                    setClearDuplicateSelection(true);
                    setTimeout(() => setClearDuplicateSelection(false), 100);
                  } else if (activeDuplicateArticleId !== null) {
                    // Single article — persist to DB by articleId
                    const art = articles.find(a => a.id === activeDuplicateArticleId);
                    const updatedLabels = [...new Set([...(art?.labels || []), label])];
                    try {
                      await api.updateArticle(activeDuplicateArticleId, { labels: updatedLabels });
                      // Update the duplicate table row via the pair's duplicateId but only for this article
                      duplicateTableRef.current?.applyLabelToArticle(activeDuplicateArticleId, label);
                      toast.success(`Label "${label}" applied!`, { duration: 3000, position: 'bottom-right' });
                    } catch (err) {
                      console.error('Failed to save label:', err);
                      toast.error('Failed to save label', { duration: 3000, position: 'bottom-right' });
                    }
                  }
                } else {
                  const targets = selectedArticles.length > 0
                    ? selectedArticles
                    : activeArticleId !== null ? [activeArticleId] : [];
                  if (targets.length === 0) return;

                  // Optimistic UI update
                  setArticles(prev =>
                    prev.map(a =>
                      targets.includes(a.id)
                        ? { ...a, _labels: [...new Set([...(a._labels || []), label])], labels: [...new Set([...(a.labels || []), label])] }
                        : a
                    )
                  );

                  // Persist to DB
                  try {
                    if (targets.length === 1) {
                      const art = articles.find(a => a.id === targets[0]);
                      const updatedLabels = [...new Set([...(art?.labels || []), label])];
                      await api.updateArticle(targets[0], { labels: updatedLabels });
                    } else {
                      // For bulk, merge label into each article's existing labels via bulk endpoint
                      await api.bulkUpdateArticles(reviewId, {
                        article_ids: targets,
                        labels: [label],
                      } as any);
                    }
                    toast.success(`Label "${label}" applied to ${targets.length} article(s)!`, { duration: 3000, position: 'bottom-right' });
                  } catch (err) {
                    console.error('Failed to save label:', err);
                    toast.error('Failed to save label', { duration: 3000, position: 'bottom-right' });
                  }

                  if (selectedArticles.length > 0) setSelectedArticles([]);
                }
              }}
              onAddNote={async (note) => {
                const user = api.getStoredUser();
                const userName = user?.name || 'You';
                if (activeTab === 'duplicates') {
                  if (selectedDuplicateIds.length > 0) {
                    // Bulk — apply note to all selected pairs' rows
                    duplicateTableRef.current?.applyNoteToSelected(selectedDuplicateIds, note, userName);
                  } else if (activeDuplicateArticleId !== null) {
                    // Single article — persist to DB by articleId
                    try {
                      await api.updateArticle(activeDuplicateArticleId, { screening_notes: note });
                      duplicateTableRef.current?.applyNoteToArticle(activeDuplicateArticleId, note, userName);
                    } catch (err) {
                      console.error('Failed to save note:', err);
                      toast.error('Failed to save note', { duration: 3000, position: 'bottom-right' });
                    }
                  }
                } else {
                  const targets = selectedArticles.length > 0 ? selectedArticles : (activeArticleId !== null ? [activeArticleId] : []);
                  if (targets.length === 0) return;

                  // Optimistic UI update
                  setArticles((prev) =>
                    prev.map((a) => (targets.includes(a.id) ? { ...a, _note: note, _noteAuthor: userName, screening_notes: note } : a))
                  );

                  // Persist to DB
                  try {
                    if (targets.length === 1) {
                      await api.updateArticle(targets[0], { screening_notes: note });
                    } else {
                      await api.bulkUpdateArticles(reviewId, {
                        article_ids: targets,
                        screening_notes: note,
                      });
                    }
                  } catch (err) {
                    console.error('Failed to save note:', err);
                    toast.error('Failed to save note', { duration: 3000, position: 'bottom-right' });
                  }
                }
              }}
              selectionCount={effectiveIds.length}
            />
          );
        })()}
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
            articles={articles}
          />
        </aside>
      )}

      {/* DETECT DUPLICATES CONFIRMATION MODAL */}
      {showDuplicateModal && !detectingDuplicates && duplicateCounts.total === 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[var(--accent-soft)] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Detect Duplicates</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">The system will scan all articles and identify potential duplicates, helping you resolve them efficiently.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDuplicateModal(false)} className="px-4 py-2 text-sm border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface-2)] transition-colors font-medium">Cancel</button>
              <button onClick={handleDetectDuplicates} disabled={detectingDuplicates} className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {detectingDuplicates ? "Detecting…" : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETECTING DUPLICATES PROGRESS MODAL */}
      {detectingDuplicates && (
        <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-xl shadow-2xl border border-[var(--border-subtle)] p-4 min-w-[400px]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-[var(--accent-soft)] rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Detect Duplicates</h3>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(26,95,122,0.12)", color: "#1a5f7a" }}>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#1a5f7a", animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#1a5f7a", animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#1a5f7a", animationDelay: '300ms' }}></div>
                      </div>
                      In Progress
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">The action is currently in progress. Please wait.</p>
                </div>
              </div>
              <button 
                onClick={() => setDetectingDuplicates(false)}
                className="p-1 hover:bg-[var(--surface-2)] rounded-md transition-colors shrink-0"
                title="Close (detection will continue)"
              >
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RE-RUN DETECTION CONFIRMATION MODAL */}
      {showRerunModal && !detectingDuplicates && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-xl shadow-xl p-6 max-w-md w-full mx-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[var(--accent-soft)] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Re-run Duplicate Detection</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
              Choose how you want to re-run the duplicate detection:
            </p>
            <div className="bg-[var(--surface-2)] rounded-lg p-4 mb-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incrementalOnly}
                  onChange={(e) => setIncrementalOnly(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[var(--accent)]"
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Only check new articles</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Only scan articles added since the last detection run. Existing duplicate pairs will be preserved.
                  </p>
                </div>
              </label>
            </div>
            {!incrementalOnly && (
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg p-3 mb-5">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                    <strong>Warning:</strong> Full re-run will clear all existing duplicate pairs and their statuses before scanning all articles again.
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => {
                  setShowRerunModal(false);
                  setIncrementalOnly(false);
                }} 
                className="px-4 py-2 text-sm border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface-2)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleRerunDetection} 
                disabled={detectingDuplicates} 
                className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {detectingDuplicates ? "Detecting…" : incrementalOnly ? "Check New Articles" : "Re-run Full Scan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE DETAIL DRAWER */}
      {selectedArticleModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedArticleModal(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-[var(--surface-1)] shadow-xl overflow-y-auto border-l border-[var(--border-subtle)]">
            <div className="sticky top-0 bg-white dark:bg-[var(--surface-1)] border-b border-[var(--border-subtle)] px-5 py-3.5 flex items-center justify-between z-10">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Article Details</h2>
              <button onClick={() => setSelectedArticleModal(null)} className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors">
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Title</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{selectedArticleModal.title}</p>
              </div>
              {selectedArticleModal.authors && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Authors</p>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedArticleModal.authors}</p>
                </div>
              )}
              {selectedArticleModal.abstract && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Abstract</p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{selectedArticleModal.abstract}</p>
                </div>
              )}
              {selectedArticleModal.url && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">URL</p>
                  <a href={selectedArticleModal.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline break-all">{selectedArticleModal.url}</a>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Decision</p>
                <div className="flex items-center gap-2">
                  {decisionDot(selectedArticleModal.screening_decision || null)}
                  <span className="text-sm text-[var(--text-secondary)] capitalize">{selectedArticleModal.screening_decision || "Undecided"}</span>
                </div>
              </div>
              {selectedArticleModal.screening_notes && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Notes</p>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedArticleModal.screening_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD REFERENCES MODAL */}
      {showAddReferencesModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-xl w-full max-w-xl shadow-xl border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="text-sm font-semibold text-[var(--text-primary)]">Add References</span>
              </div>
              <button onClick={() => { setShowAddReferencesModal(false); setSelectedFiles([]); }} className="p-1 hover:bg-[var(--surface-2)] rounded-lg transition-colors">
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 flex gap-4">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-1.5">Supported Formats</p>
                <p className="text-xs text-[var(--text-muted)] mb-2">Visit <span className="text-[var(--accent)] cursor-pointer">Help Center</span> to learn more</p>
                <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                  {["EndNote Export", "Refman/RIS", "CSV", "BibTeX", "PubMed XML", "New PubMed Format/.nbib", "Web of Science/CIW"].map(f => (
                    <li key={f} className="flex items-center gap-1.5"><span className="w-1 h-1 bg-[var(--text-muted)] rounded-full shrink-0" />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-5 flex flex-col items-center justify-center text-center hover:border-[var(--accent)] transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <svg className="w-8 h-8 text-[var(--text-muted)] mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Select Files</p>
                <p className="text-xs text-[var(--text-muted)] mb-3">Up to 10 files at once</p>
                <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="bg-[var(--accent)] text-white text-xs px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">Browse Files</button>
                <input ref={fileInputRef} type="file" multiple accept=".csv,.ris,.bib,.xml,.nbib" onChange={e => { if (e.target.files) setSelectedFiles(Array.from(e.target.files).slice(0, 10)); }} className="hidden" />
                {selectedFiles.length > 0 && <p className="text-xs text-[var(--accent)] mt-2 font-medium">{selectedFiles.length} file(s) selected</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--border-subtle)]">
              <button onClick={() => { setShowAddReferencesModal(false); setSelectedFiles([]); }} className="text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
              <button onClick={uploadArticles} disabled={uploading || selectedFiles.length === 0} className="bg-[var(--accent)] text-white text-sm px-4 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                {uploading ? "Uploading…" : "Upload & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL DUPLICATE RESOLUTION MODAL */}
      {showManualDuplicateResolve && (
        <ManualDuplicateResolveModal
          pair={duplicateResolveQueue[duplicateResolveIndex] || null}
          index={duplicateResolveIndex}
          total={duplicateResolveQueue.length}
          totalInDb={duplicateCounts.unresolved}
          isResolving={manualDuplicateResolvingId !== null}
          onClose={() => {
            setShowManualDuplicateResolve(false);
            setDuplicateResolveQueue([]);
            setDuplicateResolveIndex(0);
            setManualDuplicateResolvingId(null);
          }}
          onChoose={(choice) => handleManualDuplicateChoice(choice)}
        />
      )}

      {/* ARTICLE NOTE POPUP - Compact Popover */}
      {articleNotePopup !== null && (() => {
        const art = articles.find(a => a.id === articleNotePopup);
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
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--accent-light)" }}>{art._noteAuthor || 'You'}</p>
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
        const art = articles.find(a => a.id === articleLabelPopup);
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
      {showLabelDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowLabelDialog(false); setLabelInput(""); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Labels</h3>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#1a5f7a" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Add hotkeys to get a faster experience!
                </p>
              </div>
              <button
                onClick={() => { setShowLabelDialog(false); setLabelInput(""); }}
                className="p-1.5 rounded-lg transition-all hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Dynamic labels */}
            <div className="px-6 py-4 space-y-2 max-h-60 overflow-y-auto">
              {globalLabels.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:opacity-80"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    background: labelInput === label ? "var(--accent-soft)" : "var(--surface-2)",
                    borderColor: labelInput === label ? "var(--accent-border)" : "var(--border-subtle)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={labelInput === label}
                    onChange={(e) => setLabelInput(e.target.checked ? label : "")}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Click to add hotkey</span>
                </label>
              ))}
            </div>

            {/* Custom label input */}
            <div className="px-6 pb-4">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && labelInput.trim()) handleBulkLabel(); }}
                placeholder="Add labels"
                autoFocus
                className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none transition-all"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Apply button */}
            <div className="px-6 py-4 border-t" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
              <button
                onClick={handleBulkLabel}
                disabled={!labelInput.trim()}
                className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)",
                  boxShadow: labelInput.trim() ? "0 0 16px var(--accent-glow)" : "none",
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}