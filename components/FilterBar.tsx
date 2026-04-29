"use client";

import { useState, useMemo } from "react";

interface Article {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  screening_decision?: string;
  created_at: string;
}

interface FilterBarProps {
  includeKeywords: string[];
  excludeKeywords: string[];
  onIncludeKeywordsChange: (keywords: string[]) => void;
  onExcludeKeywordsChange: (keywords: string[]) => void;
  articles: Article[];
}

export default function FilterBar({
  includeKeywords,
  excludeKeywords,
  onIncludeKeywordsChange,
  onExcludeKeywordsChange,
  articles
}: FilterBarProps) {
  
  const [customIncludeKeyword, setCustomIncludeKeyword] = useState<string>("");
  const [customExcludeKeyword, setCustomExcludeKeyword] = useState<string>("");
  const [showIncludeInput, setShowIncludeInput] = useState(false);
  const [showExcludeInput, setShowExcludeInput] = useState(false);

  // Extract keywords from articles for suggestions
  const extractKeywords = useMemo(() => {
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
  }, [articles]);

  const toggleIncludeKeyword = (keyword: string) => {
    const newKeywords = includeKeywords.includes(keyword) 
      ? includeKeywords.filter(k => k !== keyword)
      : [...includeKeywords, keyword];
    onIncludeKeywordsChange(newKeywords);
  };

  const toggleExcludeKeyword = (keyword: string) => {
    const newKeywords = excludeKeywords.includes(keyword)
      ? excludeKeywords.filter(k => k !== keyword)
      : [...excludeKeywords, keyword];
    onExcludeKeywordsChange(newKeywords);
  };

  const addCustomIncludeKeyword = () => {
    const words = customIncludeKeyword.split(',').map(w => w.trim()).filter(Boolean);
    const newKeywords = [...includeKeywords];
    words.forEach(word => {
      if (!newKeywords.includes(word)) {
        newKeywords.push(word);
      }
    });
    onIncludeKeywordsChange(newKeywords);
    setCustomIncludeKeyword("");
  };

  const addCustomExcludeKeyword = () => {
    const words = customExcludeKeyword.split(',').map(w => w.trim()).filter(Boolean);
    const newKeywords = [...excludeKeywords];
    words.forEach(word => {
      if (!newKeywords.includes(word)) {
        newKeywords.push(word);
      }
    });
    onExcludeKeywordsChange(newKeywords);
    setCustomExcludeKeyword("");
  };

  const removeIncludeKeyword = (keyword: string) => {
    onIncludeKeywordsChange(includeKeywords.filter(k => k !== keyword));
  };

  const removeExcludeKeyword = (keyword: string) => {
    onExcludeKeywordsChange(excludeKeywords.filter(k => k !== keyword));
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      
      {/* Include Keywords Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-md flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Keywords for include</span>
          </div>
          <button
            onClick={() => setShowIncludeInput(!showIncludeInput)}
            className="w-5 h-5 bg-green-500 hover:bg-green-600 rounded-md flex items-center justify-center transition-colors shrink-0"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showIncludeInput ? "M20 12H4" : "M12 4v16m8-8H4"} />
            </svg>
          </button>
        </div>

        {/* Custom include keyword input */}
        {showIncludeInput && (
          <div className="mb-2 flex gap-1.5">
            <input
              type="text"
              placeholder="comma, separated…"
              value={customIncludeKeyword}
              onChange={(e) => setCustomIncludeKeyword(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') { 
                  addCustomIncludeKeyword(); 
                  setShowIncludeInput(false); 
                } 
              }}
              autoFocus
              className="flex-1 text-xs bg-white dark:bg-[var(--surface-1)] border-2 border-green-400 text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-2 py-1.5 focus:outline-none"
            />
            <button 
              onClick={() => { 
                addCustomIncludeKeyword(); 
                setShowIncludeInput(false); 
              }} 
              className="px-2 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors shrink-0"
            >
              Add
            </button>
          </div>
        )}

        {/* Active include keywords */}
        {includeKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {includeKeywords.map(keyword => (
              <span key={keyword} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 rounded-md text-xs font-medium">
                {keyword}
                <button onClick={() => removeIncludeKeyword(keyword)}>
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggested include keywords */}
        <div className="space-y-0.5">
          {extractKeywords.slice(0, 10).map(({ word, count }) => (
            <label key={word} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={includeKeywords.includes(word)} 
                  onChange={() => toggleIncludeKeyword(word)} 
                  className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-green-500" 
                />
                <span className="text-xs text-[var(--text-secondary)]">{word}</span>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-semibold tabular-nums">{count}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)]" />

      {/* Exclude Keywords Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-500 rounded-md flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Keywords for exclude</span>
          </div>
          <button
            onClick={() => setShowExcludeInput(!showExcludeInput)}
            className="w-5 h-5 bg-red-500 hover:bg-red-600 rounded-md flex items-center justify-center transition-colors shrink-0"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showExcludeInput ? "M20 12H4" : "M12 4v16m8-8H4"} />
            </svg>
          </button>
        </div>

        {/* Custom exclude keyword input */}
        {showExcludeInput && (
          <div className="mb-2 flex gap-1.5">
            <input
              type="text"
              placeholder="comma, separated…"
              value={customExcludeKeyword}
              onChange={(e) => setCustomExcludeKeyword(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') { 
                  addCustomExcludeKeyword(); 
                  setShowExcludeInput(false); 
                } 
              }}
              autoFocus
              className="flex-1 text-xs bg-white dark:bg-[var(--surface-1)] border-2 border-red-400 text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-2 py-1.5 focus:outline-none"
            />
            <button 
              onClick={() => { 
                addCustomExcludeKeyword(); 
                setShowExcludeInput(false); 
              }} 
              className="px-2 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors shrink-0"
            >
              Add
            </button>
          </div>
        )}

        {/* Active exclude keywords */}
        {excludeKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {excludeKeywords.map(keyword => (
              <span key={keyword} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded-md text-xs font-medium">
                {keyword}
                <button onClick={() => removeExcludeKeyword(keyword)}>
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggested exclude keywords */}
        <div className="space-y-0.5">
          {extractKeywords.slice(0, 10).map(({ word, count }) => (
            <label key={word} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={excludeKeywords.includes(word)} 
                  onChange={() => toggleExcludeKeyword(word)} 
                  className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-red-500" 
                />
                <span className="text-xs text-[var(--text-secondary)]">{word}</span>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-semibold tabular-nums">{count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filter summary */}
      {(includeKeywords.length > 0 || excludeKeywords.length > 0) && (
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)] mb-2">Active Filters:</div>
          <div className="space-y-1 text-xs">
            {includeKeywords.length > 0 && (
              <div className="text-green-600 dark:text-green-400">
                Include: {includeKeywords.length} keyword{includeKeywords.length !== 1 ? 's' : ''}
              </div>
            )}
            {excludeKeywords.length > 0 && (
              <div className="text-red-600 dark:text-red-400">
                Exclude: {excludeKeywords.length} keyword{excludeKeywords.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              onIncludeKeywordsChange([]);
              onExcludeKeywordsChange([]);
            }}
            className="mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}