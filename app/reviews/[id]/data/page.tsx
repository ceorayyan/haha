"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useData } from "../../../context/DataContext";

export default function ReviewDataPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  const { getArticlesByReviewId, getReviewById } = useData();
  
  const review = getReviewById(reviewId);
  const allArticles = getArticlesByReviewId(reviewId);
  
  const [selectedArticle, setSelectedArticle] = useState(allArticles[0] || null);
  const [sortBy, setSortBy] = useState<"title" | "date" | "author">("title");
  const [includeKw, setIncludeKw] = useState<string[]>([]);
  const [excludeKw, setExcludeKw] = useState<string[]>([]);

  // Extract all unique keywords from articles
  const allKeywords = Array.from(
    new Set(allArticles.flatMap(a => a.keywords))
  ).map(kw => ({
    word: kw,
    count: allArticles.filter(a => a.keywords.includes(kw)).length
  })).sort((a, b) => b.count - a.count);

  const toggleInclude = (word: string) => {
    setIncludeKw(prev => prev.includes(word) ? prev.filter(k => k !== word) : [...prev, word]);
    setExcludeKw(prev => prev.filter(k => k !== word));
  };

  const toggleExclude = (word: string) => {
    setExcludeKw(prev => prev.includes(word) ? prev.filter(k => k !== word) : [...prev, word]);
    setIncludeKw(prev => prev.filter(k => k !== word));
  };

  if (!review) return <div className="p-4 text-gray-500 dark:text-gray-400">Review not found.</div>;

  return (
    <div className="flex h-full overflow-hidden bg-gray-50 dark:bg-black">
      {/* Left Sidebar - Data Sources */}
      <div className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">All Data</h3>
          
          {/* Imported References */}
          <div className="mb-3">
            <button className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 rounded text-xs">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Imported References</span>
              </div>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div className="ml-5 mt-1">
              <div className="flex items-center justify-between px-2 py-1 text-xs bg-blue-50 dark:bg-blue-950 rounded">
                <span className="text-gray-700 dark:text-gray-300">All References</span>
                <span className="text-gray-500 dark:text-gray-400">{allArticles.length}</span>
              </div>
            </div>
          </div>

          <button className="w-full px-2 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded font-medium">
            + Add References
          </button>
        </div>
      </div>

      {/* Center - Article List */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Showing {allArticles.length} Articles</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded px-2 py-1.5"
            >
              <option value="title">Sort by Title</option>
              <option value="date">Sort by Date</option>
              <option value="author">Sort by Author</option>
            </select>
          </div>
        </div>

        {/* Article Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0">
              <tr>
                <th className="w-8 px-3 py-2 text-left">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600" />
                </th>
                <th className="w-8 px-2 py-2"></th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Title ↓</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Author</th>
              </tr>
            </thead>
            <tbody>
              {allArticles.map((article, idx) => (
                <tr 
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer ${selectedArticle?.id === article.id ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                >
                  <td className="px-3 py-2.5">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600" onClick={(e) => e.stopPropagation()} />
                  </td>
                  <td className="px-2 py-2.5 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-gray-100 font-medium leading-snug line-clamp-2">{article.title}</p>
                        {article.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {article.keywords.slice(0, 3).map(kw => (
                              <span key={kw} className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{article.year}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{article.authors.split(',')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-black">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
              Attach PDF
            </button>
            <button className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Label
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedArticle ? `${allArticles.findIndex(a => a.id === selectedArticle.id) + 1} of ${allArticles.length}` : `${allArticles.length} articles`}
            </span>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Article Details & Filters */}
      <div className="w-80 shrink-0 bg-white dark:bg-black overflow-y-auto border-l border-gray-200 dark:border-gray-800">
        {selectedArticle ? (
          <div className="p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 leading-snug">{selectedArticle.title}</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Publication Types:</p>
                <p className="text-gray-600 dark:text-gray-400">Journal Article</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Authors:</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedArticle.authors}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Journal:</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedArticle.journal} • {selectedArticle.year}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Rayyan Reference ID:</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedArticle.id}00000</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Search Methods:</p>
                <p className="text-gray-600 dark:text-gray-400">Uploaded References</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Abstract:</p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{selectedArticle.abstract}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filters</h3>
            
            {/* Include Keywords */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Keywords for include</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">{includeKw.length}</span>
                  <button className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-bold">+</button>
                </div>
              </div>
              <div className="space-y-1">
                {allKeywords.slice(0, 10).map(({ word, count }) => (
                  <label key={word} className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-2 py-1 rounded">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={includeKw.includes(word)} 
                        onChange={() => toggleInclude(word)} 
                        className="w-3 h-3 rounded border-gray-300 dark:border-gray-600" 
                      />
                      <span className="text-gray-700 dark:text-gray-300">{word}</span>
                    </div>
                    <span className="text-gray-400">{count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Exclude Keywords */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Keywords for exclude</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">{excludeKw.length}</span>
                  <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-bold">+</button>
                </div>
              </div>
              <div className="space-y-1">
                {allKeywords.slice(0, 10).map(({ word, count }) => (
                  <label key={word} className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-2 py-1 rounded">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={excludeKw.includes(word)} 
                        onChange={() => toggleExclude(word)} 
                        className="w-3 h-3 rounded border-gray-300 dark:border-gray-600" 
                      />
                      <span className="text-gray-700 dark:text-gray-300">{word}</span>
                    </div>
                    <span className="text-gray-400">{count}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
