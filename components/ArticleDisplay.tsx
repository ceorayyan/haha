"use client";

import { useMemo } from "react";

interface Article {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  url?: string;
  screening_decision?: 'included' | 'excluded' | 'undecided' | 'maybe';
  screening_notes?: string;
  labels?: string[];
  exclusion_reasons?: string[];
  created_at: string;
  file_path?: string;
  _note?: string;
  _noteAuthor?: string;
  _labels?: string[];
}

interface ArticleDisplayProps {
  article: Article;
  includeKeywords: string[];
  excludeKeywords: string[];
  currentIndex: number;
  totalCount: number;
}

export default function ArticleDisplay({ 
  article, 
  includeKeywords, 
  excludeKeywords, 
  currentIndex, 
  totalCount 
}: ArticleDisplayProps) {
  
  // Highlight text matching include/exclude keywords
  const highlightText = useMemo(() => {
    return (text: string) => {
      if (!text) return text;
      let highlightedText = text;
      
      // Highlight include keywords in green
      includeKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        highlightedText = highlightedText.replace(
          regex, 
          '<mark class="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-1 rounded font-medium">$1</mark>'
        );
      });
      
      // Highlight exclude keywords in red
      excludeKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        highlightedText = highlightedText.replace(
          regex, 
          '<mark class="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-1 rounded font-medium">$1</mark>'
        );
      });
      
      return highlightedText;
    };
  }, [includeKeywords, excludeKeywords]);

  // Format creation date for display
  const formattedDate = useMemo(() => {
    return new Date(article.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [article.created_at]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Position counter */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--accent)]">
            Article {currentIndex + 1} of {totalCount}
          </span>
          <div className="w-px h-4 bg-[var(--border-subtle)]" />
          <span className="text-xs text-[var(--text-muted)]">
            {Math.round(((currentIndex + 1) / totalCount) * 100)}% complete
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="flex-1 max-w-xs ml-4">
          <div className="w-full bg-[var(--surface-2)] rounded-full h-2">
            <div 
              className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main article card */}
      <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
        
        {/* Article header */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h1 
            className="text-xl font-semibold text-[var(--text-primary)] mb-4 leading-tight"
            dangerouslySetInnerHTML={{ __html: highlightText(article.title) }}
          />
          
          {article.authors && (
            <div className="flex items-start gap-2 mb-3">
              <svg className="w-4 h-4 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p 
                className="text-sm text-[var(--text-secondary)]"
                dangerouslySetInnerHTML={{ __html: highlightText(article.authors) }}
              />
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Created: {formattedDate}</span>
          </div>
        </div>
        
        {/* Article content */}
        <div className="p-6">
          {article.abstract ? (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Abstract
              </h3>
              <div 
                className="text-sm text-[var(--text-secondary)] leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: highlightText(article.abstract) }}
              />
            </div>
          ) : (
            <div className="mb-6 p-4 bg-[var(--surface-2)] rounded-lg border border-dashed border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No abstract available for this article
              </div>
            </div>
          )}
          
          {/* Additional metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {article.url && (
              <div className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:underline break-all"
                >
                  View Original Article
                </a>
              </div>
            )}
            
            {article.file_path && (
              <div className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-[var(--text-muted)]">
                  Source: {article.file_path.split('/').pop() || 'Unknown'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Labels and notes display */}
        {((article.labels?.length || article._labels?.length) || article._note || article.screening_notes || article.exclusion_reasons?.length) && (
          <div className="px-6 pb-6">
            <div className="border-t border-[var(--border-subtle)] pt-4">
              
              {/* Labels */}
              {(article.labels?.length || article._labels?.length) ? (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Labels</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(article.labels || article._labels || []).map((label, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
                        style={{
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent-border)",
                          color: "var(--accent-light)",
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Exclusion reasons */}
              {article.exclusion_reasons && article.exclusion_reasons.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Reasons</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {article.exclusion_reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
                        style={{
                          background: "rgba(239,68,68,0.10)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          color: "rgba(239,68,68,0.9)",
                        }}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {article._note && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Notes</h4>
                  <div className="flex items-start gap-2 p-3 rounded-lg border"
                       style={{
                         background: "var(--accent-soft)",
                         borderColor: "var(--accent-border)",
                       }}>
                    <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold" style={{ color: "var(--accent-light)" }}>
                        {article._noteAuthor || 'You'}
                      </span>
                      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                        {article._note}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Legacy screening notes */}
              {article.screening_notes && !article._note && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Notes</h4>
                  <p className="text-xs text-[var(--text-muted)] italic p-2 bg-[var(--surface-2)] rounded">
                    {article.screening_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}