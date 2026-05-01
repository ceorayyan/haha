"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/api";
import FilterBar from "@/components/FilterBar";

type Article = {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  url?: string;
  file_path?: string;
  fulltext_pdf_path?: string;
  fulltext_status?: "none" | "included" | "excluded" | "maybe";
  fulltext_decision_by?: string;
  fulltext_notes?: string;
  fulltext_labels?: string[];
  fulltext_exclusion_reasons?: string[];
  created_at: string;
  screening_decision?: string;
  labels?: string[];
};

export default function FullTextPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  const currentUserName = api.getStoredUser()?.name || "You";

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importIncluded, setImportIncluded] = useState(false);
  const [importMaybe, setImportMaybe] = useState(false);
  const [importLabeled, setImportLabeled] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "none" | "included" | "excluded" | "maybe">("all");
  const [importCounts, setImportCounts] = useState({ included: 0, maybe: 0, labeled: 0 });
  const [importing, setImporting] = useState(false);
  
  // Label popup state
  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const labelBtnRef = useRef<HTMLButtonElement>(null);
  const labelPopupRef = useRef<HTMLDivElement>(null);
  
  // Reasons popup state
  const [showReasonsPopup, setShowReasonsPopup] = useState(false);
  const [reasonInput, setReasonInput] = useState("");
  const reasonBtnRef = useRef<HTMLButtonElement>(null);
  const reasonPopupRef = useRef<HTMLDivElement>(null);

  // Article detail modal state
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

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

  useEffect(() => {
    fetchArticles();
    fetchImportCounts();
  }, [reviewId]);

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

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await api.getArticles(reviewId, 1, 10000);
      const arr = Array.isArray(res) ? res : res?.data || [];
      // Filter only articles that have been imported to full-text (fulltext_status is set and not null)
      const fulltextArticles = arr.filter((a: Article) => a.fulltext_status !== null && a.fulltext_status !== undefined);
      setArticles(fulltextArticles);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load articles");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchImportCounts = async () => {
    try {
      const res = await api.getArticles(reviewId, 1, 10000);
      const arr = Array.isArray(res) ? res : res?.data || [];
      
      const included = arr.filter((a: Article) => a.screening_decision === "included").length;
      const maybe = arr.filter((a: Article) => a.screening_decision === "undecided" && a.screening_decision_by).length;
      const labeled = arr.filter((a: Article) => a.labels && a.labels.length > 0).length;
      
      setImportCounts({ included, maybe, labeled });
    } catch (e: any) {
      console.error("Failed to fetch import counts:", e);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const res = await api.getArticles(reviewId, 1, 10000);
      const arr = Array.isArray(res) ? res : res?.data || [];
      
      const toImport = arr.filter((a: Article) => {
        // Skip articles already imported
        if (a.fulltext_status !== null && a.fulltext_status !== undefined) return false;
        
        if (importIncluded && a.screening_decision === "included") return true;
        if (importMaybe && a.screening_decision === "undecided" && a.screening_decision_by) return true;
        if (importLabeled && a.labels && a.labels.length > 0) return true;
        return false;
      });

      if (toImport.length === 0) {
        toast.error("No articles to import. Articles may already be imported.");
        setImporting(false);
        return;
      }

      // Update articles to set fulltext_status = "none" (imported but not yet decided)
      let successCount = 0;
      for (const article of toImport) {
        try {
          await api.updateArticle(article.id, { fulltext_status: "none" });
          successCount++;
        } catch (err) {
          console.error(`Failed to import article ${article.id}:`, err);
        }
      }

      toast.success(`Imported ${successCount} articles to full-text screening!`);
      setShowImportModal(false);
      setImportIncluded(false);
      setImportMaybe(false);
      setImportLabeled(false);
      await fetchArticles();
      setImporting(false);
    } catch (e: any) {
      console.error("Import error:", e);
      toast.error(e?.message || "Failed to import articles");
      setImporting(false);
    }
  };

  const filteredArticles = useMemo(() => {
    const inc = includeKeywords.map((k) => k.toLowerCase());
    const exc = excludeKeywords.map((k) => k.toLowerCase());
    return articles.filter((article) => {
      const text = `${article.title} ${article.authors || ""} ${article.abstract || ""}`.toLowerCase();
      if (inc.length > 0 && !inc.some((k) => text.includes(k))) return false;
      if (exc.length > 0 && exc.some((k) => text.includes(k))) return false;
      
      // Apply status filter
      if (statusFilter !== "all" && article.fulltext_status !== statusFilter) return false;
      
      return true;
    });
  }, [articles, includeKeywords, excludeKeywords, statusFilter]);

  // Highlight keywords in text - green for include, red for exclude
  const highlightText = useMemo(() => {
    return (text: string) => {
      if (!text) return text;
      if (includeKeywords.length === 0 && excludeKeywords.length === 0) return text;

      let result = text;
      includeKeywords.forEach(keyword => {
        if (!keyword.trim()) return;
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        result = result.replace(
          regex,
          '<mark class="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-0.5 rounded font-medium">$1</mark>'
        );
      });
      excludeKeywords.forEach(keyword => {
        if (!keyword.trim()) return;
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        result = result.replace(
          regex,
          '<mark class="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-0.5 rounded font-medium">$1</mark>'
        );
      });
      return result;
    };
  }, [includeKeywords, excludeKeywords]);

  const toggleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(a => a.id));
    }
  };

  const toggleSelectArticle = (id: number) => {
    setSelectedArticles(prev =>
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  const handleInclude = async () => {
    const targets = selectedArticles.length > 0 ? selectedArticles : activeArticleId ? [activeArticleId] : [];
    if (targets.length === 0) return;

    try {
      for (const id of targets) {
        await api.updateArticle(id, { 
          fulltext_status: "included",
          fulltext_decision_by: currentUserName 
        });
      }
      setArticles(prev => prev.map(a => 
        targets.includes(a.id) ? { ...a, fulltext_status: "included" as const, fulltext_decision_by: currentUserName } : a
      ));
      setSelectedArticles([]);
      
      // Auto-advance to next article if single article was selected
      if (targets.length === 1 && activeArticleId) {
        const currentIdx = filteredArticles.findIndex(a => a.id === activeArticleId);
        if (currentIdx >= 0 && currentIdx < filteredArticles.length - 1) {
          setActiveArticleId(filteredArticles[currentIdx + 1].id);
        }
      }
      
      toast.success(`Marked ${targets.length} article(s) as included!`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    }
  };

  const handleMaybe = async () => {
    const targets = selectedArticles.length > 0 ? selectedArticles : activeArticleId ? [activeArticleId] : [];
    if (targets.length === 0) return;

    try {
      for (const id of targets) {
        await api.updateArticle(id, { 
          fulltext_status: "maybe",
          fulltext_decision_by: currentUserName 
        });
      }
      setArticles(prev => prev.map(a => 
        targets.includes(a.id) ? { ...a, fulltext_status: "maybe" as const, fulltext_decision_by: currentUserName } : a
      ));
      setSelectedArticles([]);
      
      // Auto-advance to next article if single article was selected
      if (targets.length === 1 && activeArticleId) {
        const currentIdx = filteredArticles.findIndex(a => a.id === activeArticleId);
        if (currentIdx >= 0 && currentIdx < filteredArticles.length - 1) {
          setActiveArticleId(filteredArticles[currentIdx + 1].id);
        }
      }
      
      toast.success(`Marked ${targets.length} article(s) as maybe!`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    }
  };

  const handleExclude = async () => {
    const targets = selectedArticles.length > 0 ? selectedArticles : activeArticleId ? [activeArticleId] : [];
    if (targets.length === 0) return;

    try {
      for (const id of targets) {
        await api.updateArticle(id, { 
          fulltext_status: "excluded",
          fulltext_decision_by: currentUserName 
        });
      }
      setArticles(prev => prev.map(a => 
        targets.includes(a.id) ? { ...a, fulltext_status: "excluded" as const, fulltext_decision_by: currentUserName } : a
      ));
      setSelectedArticles([]);
      
      // Auto-advance to next article if single article was selected
      if (targets.length === 1 && activeArticleId) {
        const currentIdx = filteredArticles.findIndex(a => a.id === activeArticleId);
        if (currentIdx >= 0 && currentIdx < filteredArticles.length - 1) {
          setActiveArticleId(filteredArticles[currentIdx + 1].id);
        }
      }
      
      toast.success(`Marked ${targets.length} article(s) as excluded!`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    }
  };

  const openLabel = () => {
    if (!activeArticleId) return;
    setLabelInput("");
    setShowLabelPopup(true);
  };

  const applyLabel = async (label: string) => {
    if (!activeArticleId || !label.trim()) return;
    const article = articles.find(a => a.id === activeArticleId);
    if (!article) return;

    try {
      const merged = Array.from(new Set([...(article.fulltext_labels || []), label.trim()]));
      await api.updateArticle(activeArticleId, { fulltext_labels: merged });
      setArticles(prev => prev.map(a => (a.id === activeArticleId ? { ...a, fulltext_labels: merged } : a)));
      setShowLabelPopup(false);
      setLabelInput("");
      toast.success("Label added!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save label");
    }
  };

  const openReasons = () => {
    if (!activeArticleId) return;
    setReasonInput("");
    setShowReasonsPopup(true);
  };

  const applyReason = async (reason: string) => {
    if (!activeArticleId || !reason.trim()) return;
    const article = articles.find(a => a.id === activeArticleId);
    if (!article) return;

    try {
      const merged = Array.from(new Set([...(article.fulltext_exclusion_reasons || []), reason.trim()]));
      await api.updateArticle(activeArticleId, { fulltext_exclusion_reasons: merged });
      setArticles(prev => prev.map(a => (a.id === activeArticleId ? { ...a, fulltext_exclusion_reasons: merged } : a)));
      setShowReasonsPopup(false);
      setReasonInput("");
      toast.success("Reason added!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save reason");
    }
  };

  const saveNote = async (note: string) => {
    if (!activeArticleId || !note.trim()) return;

    try {
      await api.updateArticle(activeArticleId, { fulltext_notes: note });
      setArticles(prev => prev.map(a => (a.id === activeArticleId ? { ...a, fulltext_notes: note } : a)));
      toast.success("Note saved!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save note");
    }
  };

  const handleArticleDoubleClick = (article: Article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const handlePdfUpload = async (articleId: number, file: File) => {
    setUploadingPdf(articleId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('_method', 'PUT'); // Laravel method spoofing for file uploads
      
      // Upload PDF using the article update endpoint
      const token = localStorage.getItem('auth_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiBaseUrl}/articles/${articleId}`, {
        method: 'POST', // Use POST with _method=PUT for file uploads
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload PDF');
      }

      const data = await response.json();
      
      // Update article with PDF path
      setArticles(prev => prev.map(a => 
        a.id === articleId ? { ...a, fulltext_pdf_path: data.data?.fulltext_pdf_path } : a
      ));
      
      // Update selected article if it's the one being updated
      if (selectedArticle?.id === articleId) {
        setSelectedArticle(prev => prev ? { ...prev, fulltext_pdf_path: data.data?.fulltext_pdf_path } : null);
      }
      
      toast.success("PDF uploaded successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload PDF");
    } finally {
      setUploadingPdf(null);
    }
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-[var(--border-subtle)]">
      <td className="px-4 py-3.5"><div className="w-3.5 h-3.5 bg-[var(--surface-2)] rounded" /></td>
      <td className="px-4 py-3.5">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-[var(--surface-2)] rounded w-3/4" />
          <div className="h-3 bg-[var(--surface-2)] rounded w-2/5" />
        </div>
      </td>
      <td className="px-4 py-3.5"><div className="h-3 bg-[var(--surface-2)] rounded w-16" /></td>
      <td className="px-4 py-3.5"><div className="h-3 bg-[var(--surface-2)] rounded w-20" /></td>
      <td className="px-4 py-3.5"><div className="h-3 bg-[var(--surface-2)] rounded w-12" /></td>
    </tr>
  );

  return (
    <>
      <Toaster />
      <div className="h-full overflow-hidden flex bg-[var(--surface-1)]">
        
        {/* CENTER: TABLE VIEW */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[var(--surface-1)] min-w-0">
          {/* Toolbar */}
          <div className="h-12 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] bg-white dark:bg-[var(--surface-1)] text-[var(--text-primary)]"
              >
                <option value="all">All</option>
                <option value="none">Undecided</option>
                <option value="included">Included</option>
                <option value="excluded">Excluded</option>
                <option value="maybe">Maybe</option>
              </select>
              
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Sort
              </button>
            </div>

            <div className="flex items-center gap-2">
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

              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                + Add Data
              </button>
            </div>
          </div>

          {/* Table */}
          <main className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[var(--surface-2)] border-b border-[var(--border-subtle)] z-10">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Author</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Full text</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">PDF</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} />)
                ) : filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                      No articles imported yet. Click "Add Data" to import articles from screening.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((article) => (
                    <tr
                      key={article.id}
                      onClick={() => setActiveArticleId(article.id)}
                      onDoubleClick={() => handleArticleDoubleClick(article)}
                      className={`border-b border-[var(--border-subtle)] cursor-pointer transition-colors ${
                        activeArticleId === article.id ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedArticles.includes(article.id)}
                          onChange={() => toggleSelectArticle(article.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <span
                            className="text-sm font-medium text-[var(--text-primary)]"
                            dangerouslySetInnerHTML={{ __html: highlightText(article.title) }}
                          />
                          
                          {/* Badges row: Decision, Reasons, Labels, Notes */}
                          <div className="flex flex-wrap items-center gap-1">
                            {/* Decision badge */}
                            {article.fulltext_status && article.fulltext_status !== "none" && article.fulltext_decision_by && (
                              <>
                                {article.fulltext_status === "included" ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: "rgba(34,197,94,0.95)" }}>
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{article.fulltext_decision_by}</span>
                                  </span>
                                ) : article.fulltext_status === "excluded" ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(239,68,68,0.12)", color: "rgba(239,68,68,0.95)" }}>
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span>{article.fulltext_decision_by}</span>
                                  </span>
                                ) : article.fulltext_status === "maybe" ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.14)", color: "rgba(245,158,11,0.95)" }}>
                                    <span className="text-xs font-bold leading-none">?</span>
                                    <span>{article.fulltext_decision_by}</span>
                                  </span>
                                ) : null}
                              </>
                            )}
                            
                            {/* Exclusion Reasons */}
                            {article.fulltext_exclusion_reasons && article.fulltext_exclusion_reasons.length > 0 && article.fulltext_exclusion_reasons.map((reason, i) => (
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
                            {article.fulltext_labels && article.fulltext_labels.length > 0 && article.fulltext_labels.map((label, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
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
                            {article.fulltext_notes && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                style={{
                                  background: "var(--accent-soft)",
                                  border: "1px solid var(--accent-border)",
                                  color: "var(--accent-light)",
                                }}
                                title={`Note by ${article.fulltext_decision_by || 'You'}`}
                              >
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span>1</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-xs text-[var(--text-secondary)]"
                          dangerouslySetInnerHTML={{ __html: highlightText(article.authors || "-") }}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {article.fulltext_status === "none" ? "None" : article.fulltext_status || "None"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {article.fulltext_pdf_path ? (
                          <button
                            onClick={() => handleArticleDoubleClick(article)}
                            className="px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                          >
                            View PDF
                          </button>
                        ) : (
                          <>
                            <input
                              ref={(el) => (fileInputRefs.current[article.id] = el)}
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handlePdfUpload(article.id, file);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <button
                              onClick={() => fileInputRefs.current[article.id]?.click()}
                              disabled={uploadingPdf === article.id}
                              className="px-2 py-1 rounded text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {uploadingPdf === article.id ? "Uploading..." : "+ Add PDF"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </main>

          {/* Bottom Action Bar */}
          <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-1)] shrink-0">
            <div className="px-6 py-3 flex items-center justify-center gap-2">
              <button
                onClick={handleInclude}
                disabled={selectedArticles.length === 0 && !activeArticleId}
                className="w-10 h-10 flex items-center justify-center rounded-lg disabled:opacity-50 transition-colors"
                style={{ background: "rgba(34,197,94,0.12)", color: "rgba(34,197,94,0.95)" }}
                title="Include"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <button
                onClick={handleMaybe}
                disabled={selectedArticles.length === 0 && !activeArticleId}
                className="w-10 h-10 flex items-center justify-center rounded-lg disabled:opacity-50 transition-colors text-lg font-bold"
                style={{ background: "rgba(245,158,11,0.14)", color: "rgba(245,158,11,0.95)" }}
                title="Maybe"
              >
                ?
              </button>

              <button
                onClick={handleExclude}
                disabled={selectedArticles.length === 0 && !activeArticleId}
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
                disabled={!activeArticleId}
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

              <div className="w-px h-8 bg-[var(--border-subtle)]" />

              {/* Label button + popup */}
              <div className="relative">
                <button
                  ref={labelBtnRef}
                  onClick={openLabel}
                  disabled={!activeArticleId}
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
                  Label
                </button>

                {/* Label popup */}
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
                    <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Apply Label</span>
                      </div>
                      <button onClick={() => { setShowLabelPopup(false); setLabelInput(""); }} className="p-0.5 rounded transition-all hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="py-1.5 max-h-52 overflow-y-auto">
                      {SUGGESTED_LABELS.map((label) => (
                        <button key={label} onClick={() => applyLabel(label)} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors hover:bg-[var(--surface-2)]" style={{ color: "var(--text-primary)" }}>
                          <svg className="w-3 h-3 shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="px-3 py-2.5 border-t" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>
                      <div className="flex items-center gap-1.5">
                        <input type="text" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && labelInput.trim()) applyLabel(labelInput); if (e.key === "Escape") { setShowLabelPopup(false); setLabelInput(""); } }} placeholder="Custom label…" autoFocus className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                        <button onClick={() => applyLabel(labelInput)} disabled={!labelInput.trim()} className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90" style={{ background: "var(--accent)", color: "#fff" }}>Apply</button>
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
                  disabled={!activeArticleId}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  style={{
                    borderColor: "var(--accent-border)",
                    color: "var(--accent)",
                    background: showReasonsPopup ? "var(--accent-soft)" : "transparent",
                  }}
                  title="Add reason"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Reason
                </button>

                {/* Reasons popup */}
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
                    <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Exclusion Reasons</span>
                      </div>
                      <button onClick={() => { setShowReasonsPopup(false); setReasonInput(""); }} className="p-0.5 rounded transition-all hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="py-1.5 max-h-52 overflow-y-auto">
                      {SUGGESTED_REASONS.map((reason) => (
                        <button key={reason} onClick={() => applyReason(reason)} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors hover:bg-[var(--surface-2)]" style={{ color: "var(--text-primary)" }}>
                          <svg className="w-3 h-3 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {reason}
                        </button>
                      ))}
                    </div>
                    <div className="px-3 py-2.5 border-t" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>
                      <div className="flex items-center gap-1.5">
                        <input type="text" value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && reasonInput.trim()) applyReason(reasonInput); if (e.key === "Escape") { setShowReasonsPopup(false); setReasonInput(""); } }} placeholder="Custom reason…" autoFocus className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                        <button onClick={() => applyReason(reasonInput)} disabled={!reasonInput.trim()} className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90" style={{ background: "var(--accent)", color: "#fff" }}>Apply</button>
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Data</h2>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 hover:bg-[var(--surface-2)] rounded-md transition-colors"
              >
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Add Articles From:</label>
                <p className="text-xs text-[var(--text-muted)] mb-3">Choose data source*</p>
                <select className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-white dark:bg-[var(--surface-1)] text-[var(--text-primary)]">
                  <option>Screening</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
                  <input
                    type="checkbox"
                    checked={importIncluded}
                    onChange={(e) => setImportIncluded(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--text-primary)]">Included Articles</div>
                    <div className="text-xs text-[var(--text-muted)]">{importCounts.included}</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
                  <input
                    type="checkbox"
                    checked={importMaybe}
                    onChange={(e) => setImportMaybe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--text-primary)]">Maybe Articles</div>
                    <div className="text-xs text-[var(--text-muted)]">{importCounts.maybe}</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
                  <input
                    type="checkbox"
                    checked={importLabeled}
                    onChange={(e) => setImportLabeled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--text-primary)]">Labeled Data</div>
                    <div className="text-xs text-[var(--text-muted)]">{importCounts.labeled}</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={(!importIncluded && !importMaybe && !importLabeled) || importing}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Detail Modal */}
      {showArticleModal && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
          <div className="w-3/4 h-full bg-white dark:bg-[var(--surface-1)] shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Article Details</h2>
              <button
                onClick={() => setShowArticleModal(false)}
                className="p-2 hover:bg-[var(--surface-2)] rounded-md transition-colors"
              >
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Title</label>
                  <p className="text-sm text-[var(--text-primary)]">{selectedArticle.title}</p>
                </div>

                {/* Authors */}
                {selectedArticle.authors && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Authors</label>
                    <p className="text-sm text-[var(--text-primary)]">{selectedArticle.authors}</p>
                  </div>
                )}

                {/* Abstract */}
                {selectedArticle.abstract && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Abstract</label>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">{selectedArticle.abstract}</p>
                  </div>
                )}

                {/* URL */}
                {selectedArticle.url && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">URL</label>
                    <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline break-all">
                      {selectedArticle.url}
                    </a>
                  </div>
                )}

                {/* Decision Status */}
                {selectedArticle.fulltext_status && selectedArticle.fulltext_status !== "none" && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Full-Text Decision</label>
                    <div className="flex items-center gap-2">
                      {selectedArticle.fulltext_status === "included" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: "rgba(34,197,94,0.95)" }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Included by {selectedArticle.fulltext_decision_by}
                        </span>
                      ) : selectedArticle.fulltext_status === "excluded" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold" style={{ background: "rgba(239,68,68,0.12)", color: "rgba(239,68,68,0.95)" }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Excluded by {selectedArticle.fulltext_decision_by}
                        </span>
                      ) : selectedArticle.fulltext_status === "maybe" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold" style={{ background: "rgba(245,158,11,0.14)", color: "rgba(245,158,11,0.95)" }}>
                          <span className="text-sm font-bold">?</span>
                          Maybe by {selectedArticle.fulltext_decision_by}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Labels */}
                {selectedArticle.fulltext_labels && selectedArticle.fulltext_labels.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Labels</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.fulltext_labels.map((label, idx) => (
                        <span key={idx} className="px-2 py-1 rounded text-xs font-medium" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exclusion Reasons */}
                {selectedArticle.fulltext_exclusion_reasons && selectedArticle.fulltext_exclusion_reasons.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Exclusion Reasons</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.fulltext_exclusion_reasons.map((reason, idx) => (
                        <span key={idx} className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedArticle.fulltext_notes && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Notes</label>
                    <p className="text-sm text-[var(--text-primary)] bg-[var(--surface-2)] p-3 rounded-lg">{selectedArticle.fulltext_notes}</p>
                  </div>
                )}

                {/* PDF Preview */}
                {selectedArticle.fulltext_pdf_path && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">PDF Preview</label>
                    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden" style={{ height: '600px' }}>
                      <iframe
                        src={`http://localhost:8000/storage/${selectedArticle.fulltext_pdf_path}`}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
