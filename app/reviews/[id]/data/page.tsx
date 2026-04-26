"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface Duplicate {
  article1_id: number;
  article2_id: number;
  article1_title: string;
  article2_title: string;
  similarity: number;
  reason: string;
}

interface Article {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  url?: string;
  screening_decision?: string;
  screening_notes?: string;
  created_at: string;
  file_path?: string;
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
  const [dupOpen, setDupOpen] = useState(true);
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [detectingDuplicates, setDetectingDuplicates] = useState(false);
  const [selectedArticleModal, setSelectedArticleModal] = useState<Article | null>(null);
  const [bulkLabel, setBulkLabel] = useState<string>("");
  const [bulkNotes, setBulkNotes] = useState<string>("");
  const [customIncludeKeyword, setCustomIncludeKeyword] = useState<string>("");
  const [customExcludeKeyword, setCustomExcludeKeyword] = useState<string>("");
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [customLabel, setCustomLabel] = useState<string>("");
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [showAddReferencesModal, setShowAddReferencesModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data and imported files
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const articlesData = await api.getArticles(reviewId, currentPage, 100);
        const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData?.data || [];
        setArticles(articlesArray);
        setTotalPages(articlesData?.last_page || 1);
        setTotalArticles(articlesData?.total || articlesArray.length);

        // Group articles by file_path to show imported files
        const fileMap = new Map<string, number>();
        articlesArray.forEach((article: Article) => {
          if (article.file_path) {
            fileMap.set(article.file_path, (fileMap.get(article.file_path) || 0) + 1);
          }
        });

        // Convert to ImportedFile array
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

  // Extract keywords from articles
  const extractKeywords = () => {
    const keywordMap = new Map<string, number>();
    
    articles.forEach(article => {
      const text = `${article.title} ${article.authors || ""} ${article.abstract || ""}`.toLowerCase();
      const words = text.match(/\b\w{4,}\b/g) || [];
      
      words.forEach(word => {
        keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
      });
    });

    return Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  };

  const keywords = extractKeywords();

  // Highlight keywords in text
  const highlightText = (text: string) => {
    if (!text) return text;
    
    let highlightedText = text;
    
    // Highlight include keywords (green)
    includeKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-1 rounded font-medium">$1</mark>');
    });
    
    // Highlight exclude keywords (red)
    excludeKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-1 rounded font-medium">$1</mark>');
    });
    
    return highlightedText;
  };

  // Filter and sort articles
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

  const decisionDot = (d: string | null) => {
    if (d === "include") return <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />;
    if (d === "exclude") return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />;
    if (d === "maybe") return <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" />;
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />;
  };

  const toggleIncludeKeyword = (keyword: string) => {
    setIncludeKeywords(prev => 
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  const toggleExcludeKeyword = (keyword: string) => {
    setExcludeKeywords(prev => 
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  const addCustomIncludeKeyword = () => {
    if (customIncludeKeyword.trim() && !includeKeywords.includes(customIncludeKeyword.trim())) {
      setIncludeKeywords(prev => [...prev, customIncludeKeyword.trim()]);
      setCustomIncludeKeyword("");
    }
  };

  const addCustomExcludeKeyword = () => {
    if (customExcludeKeyword.trim() && !excludeKeywords.includes(customExcludeKeyword.trim())) {
      setExcludeKeywords(prev => [...prev, customExcludeKeyword.trim()]);
      setCustomExcludeKeyword("");
    }
  };

  const removeIncludeKeyword = (keyword: string) => {
    setIncludeKeywords(prev => prev.filter(k => k !== keyword));
  };

  const removeExcludeKeyword = (keyword: string) => {
    setExcludeKeywords(prev => prev.filter(k => k !== keyword));
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
    try {
      // Set a timeout of 5 minutes for large datasets (10k+ articles)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Detection timeout - took too long (> 5 minutes)')), 300000)
      );
      
      const response = await Promise.race([
        api.detectDuplicates(reviewId),
        timeoutPromise
      ]);
      
      setDuplicates(response.data?.duplicates || []);
      // Close the confirmation modal but don't show duplicates modal yet
      // User will click "View Duplicates" button in sidebar to see results
      setShowDuplicateModal(false);
    } catch (error) {
      console.error("Failed to detect duplicates:", error);
      alert(`Failed to detect duplicates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDetectingDuplicates(false);
    }
  };

  const handleDeleteDuplicate = async (articleId: number) => {
    try {
      await api.deleteArticle(articleId);
      setArticles(articles.filter(a => a.id !== articleId));
      setDuplicates(duplicates.filter(d => d.article1_id !== articleId && d.article2_id !== articleId));
      setTotalArticles(totalArticles - 1);
    } catch (error) {
      console.error("Failed to delete article:", error);
    }
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
      
      // Refresh the articles data
      const articlesData = await api.getArticles(reviewId, 1, 100);
      const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData?.data || [];
      setArticles(articlesArray);
      setTotalPages(articlesData?.last_page || 1);
      setTotalArticles(articlesData?.total || articlesArray.length);
      setCurrentPage(1);

      // Refresh imported files
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
      // Find all articles with this file_path and delete them
      const articlesToDelete = articles.filter(a => a.file_path === filePath);
      for (const article of articlesToDelete) {
        await api.deleteArticle(article.id);
      }
      
      // Refresh data
      const articlesData = await api.getArticles(reviewId, 1, 100);
      const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData?.data || [];
      setArticles(articlesArray);
      setTotalPages(articlesData?.last_page || 1);
      setTotalArticles(articlesData?.total || articlesArray.length);
      setCurrentPage(1);

      // Refresh imported files
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
      
      // Update local articles
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

  // Decision counts
  const decisionCounts = {
    included: articles.filter(a => a.screening_decision === "include").length,
    excluded: articles.filter(a => a.screening_decision === "exclude").length,
    maybe: articles.filter(a => a.screening_decision === "maybe").length,
    undecided: articles.filter(a => !a.screening_decision).length,
  };

  // Skeleton components
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-5 py-4">
        <div className="w-4 h-4 bg-[var(--surface-2)] rounded"></div>
      </td>
      <td className="px-4 py-4">
        <div className="w-8 h-4 bg-[var(--surface-2)] rounded"></div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-[var(--surface-2)] rounded w-3/4"></div>
          <div className="h-3 bg-[var(--surface-2)] rounded w-1/2"></div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="h-4 bg-[var(--surface-2)] rounded w-32"></div>
      </td>
    </tr>
  );

  return (
    <div className="h-full overflow-hidden flex bg-[var(--surface-1)]">

      {/* ── Left sidebar */}
      <div className={`${treeOpen ? 'w-80' : 'w-16'} shrink-0 border-r border-[var(--border-subtle)] flex flex-col overflow-hidden bg-white dark:bg-[var(--surface-1)] shadow-sm transition-all duration-300`}>

        {/* Sidebar toggle button */}
        <div className="px-4 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <button 
            onClick={() => setTreeOpen(!treeOpen)}
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            title={treeOpen ? "Collapse sidebar" : "Expand sidebar"}>
            <svg className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${treeOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          {treeOpen && (
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">All Data</span>
          )}
        </div>

        {treeOpen && (
          <>
            {/* Showing count */}
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent-soft)] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">Showing {sortedArticles.length} / {totalArticles}</p>
                <p className="text-xs text-[var(--text-muted)]">Articles</p>
              </div>
            </div>

            {/* Imported references */}
            <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
              <button onClick={() => setTreeOpen((v) => !v)}
                className="w-full flex items-center justify-between py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-3">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="font-semibold">Imported References</span>
                </div>
                <svg className={`w-4 h-4 transition-transform ${dupOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* File list */}
              <div className="space-y-1 mb-4">
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--surface-2)] text-sm">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-[var(--text-primary)] font-semibold truncate">All References</span>
                  </div>
                  <span className="text-[var(--text-secondary)] font-medium ml-2">{totalArticles}</span>
                </div>

                {/* Dynamic imported files */}
                {importedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-sm group transition-colors">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[var(--text-secondary)] truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-muted)] font-medium">{file.count}</span>
                      <button 
                        onClick={() => deleteImportedFile(file.file_path || '')}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-950 rounded transition-all">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowAddReferencesModal(true)}
                className="w-full py-2.5 text-sm bg-[var(--accent-soft)] text-[var(--accent)] rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors font-semibold border border-[var(--accent-border)]">
                + Add References
              </button>
            </div>

            {/* Duplicates */}
            <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
              <button onClick={() => setDupOpen((v) => !v)}
                className="w-full flex items-center justify-between text-sm mb-3">
                <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Possible Duplicates</span>
                </div>
                <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${dupOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dupOpen && (
                <div className="space-y-3">
                  {duplicates.length === 0 ? (
                    <>
                      <div className="flex items-center justify-between px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[var(--text-secondary)]">Unresolved</span>
                        </div>
                        <span className="text-[var(--text-muted)] font-medium">0</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-[var(--text-secondary)]">Deleted</span>
                        </div>
                        <span className="text-[var(--text-muted)] font-medium">0</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-[var(--text-secondary)]">Not Duplicate</span>
                        </div>
                        <span className="text-[var(--text-muted)] font-medium">0</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-[var(--text-secondary)]">Resolved</span>
                        </div>
                        <span className="text-[var(--text-muted)] font-medium">0</span>
                      </div>
                      <button 
                        onClick={() => setShowDuplicateModal(true)}
                        className="w-full py-2.5 text-sm bg-[var(--accent-soft)] text-[var(--accent)] rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors font-semibold border border-[var(--accent-border)]">
                        Detect Duplicates
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-3 py-2 text-sm bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-yellow-700 dark:text-yellow-300 font-semibold">Unresolved</span>
                        </div>
                        <span className="text-yellow-700 dark:text-yellow-300 font-bold">{duplicates.length}</span>
                      </div>
                      <button 
                        onClick={() => setShowDuplicateModal(true)}
                        className="w-full py-2.5 text-sm bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-950/50 transition-colors font-semibold">
                        View Duplicates
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Center: table */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[var(--surface-1)]">

        {/* Table header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <span className="text-sm font-bold text-[var(--text-primary)]">
            {loading ? "Loading..." : `${totalArticles} Articles`}
            {selectedArticles.length > 0 && ` (${selectedArticles.length} selected)`}
          </span>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <svg className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" /></svg>
            </div>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm bg-white dark:bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg px-3 py-2 focus:outline-none transition-colors">
              <option value="title">Sort by Title</option>
              <option value="date">Sort by Date</option>
              <option value="author">Sort by Author</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "hover:bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
            </button>
          </div>
        </div>

        {/* Unresolved Duplicates Section (shown after detection) */}
        {duplicates.length > 0 && (
          <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 dark:border-yellow-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-bold text-yellow-900 dark:text-yellow-100">Unresolved Duplicates</span>
              </div>
              <button 
                onClick={() => setDuplicates([])}
                className="text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 font-medium">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border-subtle)] sticky top-0 z-10">
              <tr>
                <th className="w-12 px-5 py-3.5 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectedArticles.length === sortedArticles.length && sortedArticles.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[var(--accent)]" 
                  />
                </th>
                <th className="w-10 px-4 py-3.5 text-[var(--text-muted)] font-semibold text-left">#</th>
                <th className="px-5 py-3.5 text-left font-bold text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors">
                  <div className="flex items-center gap-2">
                    Title
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-left font-bold text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    Date
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <>
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <SkeletonRow key={idx} />
                  ))}
                </>
              ) : sortedArticles.map((article, idx) => (
                <tr key={article.id} className="hover:bg-[var(--surface-2)] transition-colors cursor-pointer" onClick={() => setSelectedArticleModal(article)}>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => toggleSelectArticle(article.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[var(--accent)]" 
                    />
                  </td>
                  <td className="px-4 py-4 text-[var(--text-muted)] font-medium">{(currentPage - 1) * 100 + idx + 1}</td>
                  <td className="px-5 py-4">
                    <p 
                      className="text-[var(--text-primary)] font-semibold leading-relaxed mb-1"
                      dangerouslySetInnerHTML={{ __html: highlightText(article.title) }}
                    />
                    {article.screening_notes && (
                      <p className="text-xs text-[var(--text-muted)] mt-1 italic">
                        {article.screening_notes}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[var(--text-secondary)] text-sm">
                      {new Date(article.created_at).toLocaleDateString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {selectedArticles.length > 0 ? (
              <>
                <select 
                  value={bulkLabel}
                  onChange={(e) => setBulkLabel(e.target.value)}
                  className="text-sm bg-white dark:bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors">
                  <option value="">Select Label</option>
                  <option value="include">Include</option>
                  <option value="exclude">Exclude</option>
                  <option value="maybe">Maybe</option>
                </select>
                <input 
                  type="text"
                  placeholder="Add notes..."
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  className="text-sm bg-white dark:bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                />
                <button 
                  onClick={handleBulkUpdate}
                  className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-light)] transition-colors font-medium shadow-[0_0_16px_var(--accent-glow)]">
                  Update {selectedArticles.length}
                </button>
                <button 
                  onClick={() => setSelectedArticles([])}
                  className="px-4 py-2 text-sm border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface-2)] transition-colors font-medium">
                  Cancel
                </button>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed">
              ‹
            </button>
            <span className="text-sm text-[var(--text-secondary)] font-medium">
              Page {currentPage} of {totalPages} ({totalArticles} total)
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-2 text-sm border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: filters */}
      {showFilters && (
        <div className="w-80 shrink-0 bg-white dark:bg-[var(--surface-1)] border-l border-[var(--border-subtle)] flex flex-col overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Filters</span>
            <button onClick={() => setShowFilters(false)} className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors">
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-6">

              {/* Include keywords */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">Keywords for include</span>
                  </div>
                  <button className="p-1.5 bg-green-500 hover:bg-green-600 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
                
                {/* Custom keyword input */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Use comma, to separate words"
                    value={customIncludeKeyword}
                    onChange={(e) => setCustomIncludeKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomIncludeKeyword()}
                    className="w-full text-sm bg-white dark:bg-[var(--surface-1)] border-2 border-[var(--accent)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                {/* Select All checkbox */}
                <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer transition-colors mb-2">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-green-500" 
                  />
                  <span className="text-sm text-[var(--text-secondary)] font-medium">Select All</span>
                </label>

                {/* Selected custom keywords */}
                {includeKeywords.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {includeKeywords.map(keyword => (
                      <span key={keyword} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">
                        {keyword}
                        <button onClick={() => removeIncludeKeyword(keyword)} className="hover:text-green-900 dark:hover:text-green-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {keywords.slice(0, 10).map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox" 
                          checked={includeKeywords.includes(word)}
                          onChange={() => toggleIncludeKeyword(word)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-green-500" 
                        />
                        <span className="text-sm text-[var(--text-secondary)]">{word}</span>
                      </div>
                      <span className="text-sm text-[var(--text-muted)] font-bold">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exclude keywords */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">Keywords for exclude</span>
                  </div>
                  <button className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>

                {/* Select All checkbox */}
                <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer transition-colors mb-2">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-red-500" 
                  />
                  <span className="text-sm text-[var(--text-secondary)] font-medium">Select All</span>
                </label>

                {/* Selected custom keywords */}
                {excludeKeywords.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {excludeKeywords.map(keyword => (
                      <span key={keyword} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium">
                        {keyword}
                        <button onClick={() => removeExcludeKeyword(keyword)} className="hover:text-red-900 dark:hover:text-red-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {keywords.slice(0, 10).map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox" 
                          checked={excludeKeywords.includes(word)}
                          onChange={() => toggleExcludeKeyword(word)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-red-500" 
                        />
                        <span className="text-sm text-[var(--text-secondary)]">{word}</span>
                      </div>
                      <span className="text-sm text-[var(--text-muted)] font-bold">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Duplicate Detection Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border border-[var(--border-subtle)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Detect Duplicates</h2>
            <p className="text-[var(--text-secondary)] mb-6">By start detecting duplicates, the system will find all duplicated articles and organize it to help you resolve them!</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 text-sm border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface-2)] transition-colors font-medium">
                Cancel
              </button>
              <button 
                onClick={handleDetectDuplicates}
                disabled={detectingDuplicates}
                className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-light)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_16px_var(--accent-glow)]">
                {detectingDuplicates ? "Detecting..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Duplicate Detection Progress */}
      {detectingDuplicates && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-[var(--surface-1)] rounded-lg shadow-lg p-4 flex items-center gap-3 z-50 border border-[var(--border-subtle)]">
          <div className="animate-spin">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} opacity="0.25" /><path strokeLinecap="round" strokeWidth={2} d="M4 12a8 8 0 018-8" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Detect Duplicates</p>
            <p className="text-xs text-[var(--text-secondary)]">The action is currently in progress. Please wait.</p>
          </div>
        </div>
      )}

      {/* ── Duplicates Found Modal (only shown when user clicks "View Duplicates") */}
      {duplicates.length > 0 && showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[var(--border-subtle)]">
            <div className="sticky top-0 bg-white dark:bg-[var(--surface-1)] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Possible Duplicates Found</h2>
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors">
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {duplicates.map((dup, idx) => (
                <div key={idx} className="border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                        <span className="text-yellow-600 dark:text-yellow-400">⚠ {dup.similarity}% match</span> - {dup.reason}
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm text-[var(--text-secondary)]"><strong>Article 1:</strong> {dup.article1_title}</p>
                        <p className="text-sm text-[var(--text-secondary)]"><strong>Article 2:</strong> {dup.article2_title}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteDuplicate(dup.article1_id)}
                      className="flex-1 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium">
                      Delete Article 1
                    </button>
                    <button 
                      onClick={() => handleDeleteDuplicate(dup.article2_id)}
                      className="flex-1 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium">
                      Delete Article 2
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Article Detail Modal */}
      {selectedArticleModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedArticleModal(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-[var(--surface-1)] shadow-lg animate-in slide-in-from-right-96 duration-300 overflow-y-auto border-l border-[var(--border-subtle)]">
            <div className="sticky top-0 bg-white dark:bg-[var(--surface-1)] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Article Details</h2>
              <button 
                onClick={() => setSelectedArticleModal(null)}
                className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors">
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Title</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedArticleModal.title}</p>
              </div>
              {selectedArticleModal.authors && (
                <div>
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Authors</p>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedArticleModal.authors}</p>
                </div>
              )}
              {selectedArticleModal.abstract && (
                <div>
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Abstract</p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{selectedArticleModal.abstract}</p>
                </div>
              )}
              {selectedArticleModal.url && (
                <div>
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">URL</p>
                  <a href={selectedArticleModal.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:text-[var(--accent-light)] hover:underline break-all transition-colors">
                    {selectedArticleModal.url}
                  </a>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Decision</p>
                <div className="flex items-center gap-2">
                  {decisionDot(selectedArticleModal.screening_decision || null)}
                  <span className="text-sm text-[var(--text-secondary)] capitalize">
                    {selectedArticleModal.screening_decision || "Undecided"}
                  </span>
                </div>
              </div>
              {selectedArticleModal.screening_notes && (
                <div>
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Notes</p>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedArticleModal.screening_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add References Modal */}
      {showAddReferencesModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-black rounded-lg w-full max-w-2xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">Add References</span>
              </div>
              <button onClick={() => { setShowAddReferencesModal(false); setSelectedFiles([]); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex gap-4">
              <div className="w-44 shrink-0">
                <p className="text-xs font-semibold text-gray-700 mb-2">Supported Formats</p>
                <p className="text-xs text-gray-500 mb-2">Visit <span className="text-orange-500 cursor-pointer">Help Center</span> to learn more</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {["EndNote Export", "Refman/RIS", "CSV", "BibTeX", "PubMed XML", "New PubMed Format/.nbib", "Web of Science/CIW"].map(f => (
                    <li key={f} className="flex items-center gap-1"><span className="w-1 h-1 bg-gray-400 rounded-full shrink-0" />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold text-gray-700 mb-1">Select Files</p>
                <p className="text-xs text-gray-400 mb-3">Select up to 10 files...</p>
                <svg className="w-10 h-10 text-gray-500 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-xs text-gray-600 mb-1">Select files to import</p>
                <p className="text-xs text-gray-400 mb-3">Import and manage your data set!</p>
                <button onClick={() => fileInputRef.current?.click()} className="bg-black dark:bg-white text-white dark:text-black text-xs px-4 py-1.5 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200">Select Files</button>
                <input ref={fileInputRef} type="file" multiple accept=".csv,.ris,.bib,.xml,.nbib" onChange={e => { if (e.target.files) setSelectedFiles(Array.from(e.target.files).slice(0, 10)); }} className="hidden" />
                {selectedFiles.length > 0 && <p className="text-xs text-gray-500 mt-2">{selectedFiles.length} file(s) selected</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => { setShowAddReferencesModal(false); setSelectedFiles([]); }} className="text-xs text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded">Cancel</button>
              <button
                onClick={uploadArticles}
                disabled={uploading || selectedFiles.length === 0}
                className="bg-black dark:bg-white text-white dark:text-black text-xs px-4 py-1.5 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}