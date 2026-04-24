"use client";

import { useState, useEffect } from "react";
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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const articlesData = await api.getArticles(reviewId, currentPage, 100);
        const articlesArray = Array.isArray(articlesData) ? articlesData : articlesData?.data || [];
        setArticles(articlesArray);
        setTotalPages(articlesData?.last_page || 1);
        setTotalArticles(articlesData?.total || articlesArray.length);
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
      const response = await api.detectDuplicates(reviewId);
      setDuplicates(response.data?.duplicates || []);
      setShowDuplicateModal(false);
    } catch (error) {
      console.error("Failed to detect duplicates:", error);
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
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </td>
      <td className="px-4 py-4">
        <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </td>
    </tr>
  );

  return (
    <div className="h-full overflow-hidden flex bg-gray-50 dark:bg-black">

      {/* ── Left sidebar */}
      <div className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden bg-white dark:bg-black shadow-sm">

        {/* All Data */}
        <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">All Data</p>

          {/* Imported references */}
          <div className="mb-4">
            <button onClick={() => setTreeOpen((v) => !v)}
              className="w-full flex items-center justify-between py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="font-semibold">Imported References</span>
              </div>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${treeOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {treeOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-sm">
                  <span className="text-gray-900 dark:text-white font-semibold">All References</span>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{totalArticles}</span>
                </div>
              </div>
            )}
          </div>

          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors font-medium">
            + Add References
          </button>
        </div>

        {/* Duplicates */}
        <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setDupOpen((v) => !v)}
            className="w-full flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span className="font-semibold">Possible Duplicates</span>
            </div>
            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dupOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {dupOpen && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">Find duplicates to start resolving.</p>
              <button 
                onClick={() => setShowDuplicateModal(true)}
                className="w-full py-2.5 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-semibold">
                Detect Duplicates
              </button>
            </>
          )}
        </div>

        {/* Decision summary */}
        <div className="px-5 py-5 mt-auto hidden">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Decisions</p>
          <div className="space-y-2.5">
            {[
              { label: "Included", color: "bg-green-500", count: decisionCounts.included, textColor: "text-green-600 dark:text-green-400" },
              { label: "Excluded", color: "bg-red-500", count: decisionCounts.excluded, textColor: "text-red-600 dark:text-red-400" },
              { label: "Maybe", color: "bg-yellow-400", count: decisionCounts.maybe, textColor: "text-yellow-600 dark:text-yellow-400" },
              { label: "Undecided", color: "bg-gray-300 dark:bg-gray-600", count: decisionCounts.undecided, textColor: "text-gray-600 dark:text-gray-400" },
            ].map(({ label, color, count, textColor }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-gray-700 dark:text-gray-300">{label}</span>
                </div>
                <span className={`font-bold ${textColor}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: table */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-black">

        {/* Table header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
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
                className="w-64 pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" /></svg>
            </div>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 focus:outline-none transition-colors">
              <option value="title">Sort by Title</option>
              <option value="date">Sort by Date</option>
              <option value="author">Sort by Author</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300" : "hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 dark:text-gray-500"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
              <tr>
                <th className="w-12 px-5 py-3.5 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectedArticles.length === sortedArticles.length && sortedArticles.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600" 
                  />
                </th>
                <th className="w-10 px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-left">#</th>
                <th className="px-5 py-3.5 text-left font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                  Title
                </th>
                <th className="px-5 py-3.5 text-left font-bold text-gray-700 dark:text-gray-300">Author</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {loading ? (
                <>
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <SkeletonRow key={idx} />
                  ))}
                </>
              ) : sortedArticles.map((article, idx) => (
                <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors cursor-pointer" onClick={() => setSelectedArticleModal(article)}>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => toggleSelectArticle(article.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600" 
                    />
                  </td>
                  <td className="px-4 py-4 text-gray-500 dark:text-gray-400 font-medium">{(currentPage - 1) * 100 + idx + 1}</td>
                  <td className="px-5 py-4">
                    <p 
                      className="text-gray-900 dark:text-gray-100 font-semibold leading-relaxed mb-1"
                      dangerouslySetInnerHTML={{ __html: highlightText(article.title) }}
                    />
                    {article.screening_notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                        {article.screening_notes}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p 
                      className="text-gray-600 dark:text-gray-400 text-sm"
                      dangerouslySetInnerHTML={{ __html: highlightText(article.authors || "N/A") }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {selectedArticles.length > 0 ? (
              <>
                <select 
                  value={bulkLabel}
                  onChange={(e) => setBulkLabel(e.target.value)}
                  className="text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors">
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
                  className="text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
                <button 
                  onClick={handleBulkUpdate}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm">
                  Update {selectedArticles.length}
                </button>
                <button 
                  onClick={() => setSelectedArticles([])}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium">
                  Cancel
                </button>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
              ‹
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Page {currentPage} of {totalPages} ({totalArticles} total)
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: filters */}
      {showFilters && (
        <div className="w-72 shrink-0 bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Filters</span>
            <button onClick={() => setShowFilters(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-6">

              {/* Include keywords */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Include Keywords</span>
                  </div>
                  <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg font-bold">{includeKeywords.length}</span>
                </div>
                
                {/* Custom keyword input */}
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom keyword..."
                    value={customIncludeKeyword}
                    onChange={(e) => setCustomIncludeKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomIncludeKeyword()}
                    className="flex-1 text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={addCustomIncludeKeyword}
                    className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                    +
                  </button>
                </div>

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

                <div className="space-y-1">
                  {keywords.slice(0, 10).map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox" 
                          checked={includeKeywords.includes(word)}
                          onChange={() => toggleIncludeKeyword(word)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-green-500" 
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{word}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exclude keywords */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 bg-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Exclude Keywords</span>
                  </div>
                  <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg font-bold">{excludeKeywords.length}</span>
                </div>

                {/* Custom keyword input */}
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom keyword..."
                    value={customExcludeKeyword}
                    onChange={(e) => setCustomExcludeKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomExcludeKeyword()}
                    className="flex-1 text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={addCustomExcludeKeyword}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                    +
                  </button>
                </div>

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

                <div className="space-y-1">
                  {keywords.slice(0, 10).map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox" 
                          checked={excludeKeywords.includes(word)}
                          onChange={() => toggleExcludeKeyword(word)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-red-500" 
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{word}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{count}</span>
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
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Detect Duplicates</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">By start detecting duplicates, {branding?.websiteName || "Research Nexus"} will find all duplicated articles and organize it to help you resolve them!</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium">
                Cancel
              </button>
              <button 
                onClick={handleDetectDuplicates}
                disabled={detectingDuplicates}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                {detectingDuplicates ? "Detecting..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Duplicate Detection Progress */}
      {detectingDuplicates && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 flex items-center gap-3 z-50">
          <div className="animate-spin">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} opacity="0.25" /><path strokeLinecap="round" strokeWidth={2} d="M4 12a8 8 0 018-8" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Detect Duplicates</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">The action is currently in progress. Please wait.</p>
          </div>
        </div>
      )}

      {/* ── Duplicates Found Section */}
      {duplicates.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Possible Duplicates Found</h2>
              <button 
                onClick={() => setDuplicates([])}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {duplicates.map((dup, idx) => (
                <div key={idx} className="border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        <span className="text-yellow-600 dark:text-yellow-400">⚠ {dup.similarity}% match</span> - {dup.reason}
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Article 1:</strong> {dup.article1_title}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Article 2:</strong> {dup.article2_title}</p>
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
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-900 shadow-lg animate-in slide-in-from-right-96 duration-300 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Article Details</h2>
              <button 
                onClick={() => setSelectedArticleModal(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Title</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedArticleModal.title}</p>
              </div>
              {selectedArticleModal.authors && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Authors</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedArticleModal.authors}</p>
                </div>
              )}
              {selectedArticleModal.abstract && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Abstract</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedArticleModal.abstract}</p>
                </div>
              )}
              {selectedArticleModal.url && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">URL</p>
                  <a href={selectedArticleModal.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                    {selectedArticleModal.url}
                  </a>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Decision</p>
                <div className="flex items-center gap-2">
                  {decisionDot(selectedArticleModal.screening_decision || null)}
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {selectedArticleModal.screening_decision || "Undecided"}
                  </span>
                </div>
              </div>
              {selectedArticleModal.screening_notes && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedArticleModal.screening_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
