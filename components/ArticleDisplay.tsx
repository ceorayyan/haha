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

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Title */}
      <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-6">
        <h1 
          className="text-2xl font-bold text-[var(--text-primary)] leading-tight"
          dangerouslySetInnerHTML={{ __html: highlightText(article.title) }}
        />
      </div>

      {/* Metadata Sections */}
      <div className="space-y-3">
        {/* Publication Types */}
        <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Publication Types:</h3>
              <p className="text-sm text-[var(--text-secondary)]">Journal Article</p>
            </div>
          </div>
        </div>

        {/* Authors */}
        {article.authors && (
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Authors:</h3>
                <p 
                  className="text-sm text-[var(--text-secondary)]"
                  dangerouslySetInnerHTML={{ __html: highlightText(article.authors) }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Journal/Source */}
        {article.file_path && (
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Journal:</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {article.file_path.split('/').pop()?.replace(/\.[^/.]+$/, "") || 'Unknown Source'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reference ID */}
        <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Rayyan Reference ID:</h3>
              <p className="text-sm text-[var(--text-secondary)] font-mono">{article.id}</p>
            </div>
          </div>
        </div>

        {/* DOI/URL */}
        {article.url && (
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">DOI:</h3>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--accent)] hover:underline break-all"
                >
                  {article.url}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Search Methods */}
        {article.file_path && (
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Search Methods:</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Uploaded References [{article.file_path.split('/').pop() || 'unknown'}]
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Abstract */}
        {article.abstract && (
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Abstract:</h3>
                <div 
                  className="text-sm text-[var(--text-secondary)] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightText(article.abstract) }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Labels */}
        {(article.labels?.length || article._labels?.length) ? (
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Labels:</h3>
                <div className="flex flex-wrap gap-2">
                  {(article.labels || article._labels || []).map((label, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold"
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
            </div>
          </div>
        ) : null}

        {/* Notes */}
        {(article._note || article.screening_notes) && (
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Notes:</h3>
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  <div className="flex-1">
                    {article._noteAuthor && (
                      <span className="text-xs font-semibold text-[var(--accent)] block mb-1">
                        {article._noteAuthor}
                      </span>
                    )}
                    <p className="text-sm text-[var(--text-secondary)]">
                      {article._note || article.screening_notes}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exclusion Reasons */}
        {article.exclusion_reasons && article.exclusion_reasons.length > 0 && (
          <div className="bg-white dark:bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Exclusion Reasons:</h3>
                <div className="flex flex-wrap gap-2">
                  {article.exclusion_reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
