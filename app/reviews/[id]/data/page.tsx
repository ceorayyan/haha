"use client";

import { useState } from "react";

export default function ReviewDataPage() {
  const [showFilters, setShowFilters] = useState(true);
  const [treeOpen, setTreeOpen] = useState(true);
  const [dupOpen, setDupOpen] = useState(true);

  const staticArticles = [
    { id: 1, title: "Effects of Hypertension on Cardiovascular Health: A Systematic Review", year: 2023, author: "Smith J, Johnson M", keywords: ["hypertension", "cardiovascular", "systematic review"], decision: "include" },
    { id: 2, title: "Meta-Analysis of Blood Pressure Management in Elderly Patients", year: 2022, author: "Williams R, Brown K", keywords: ["blood pressure", "elderly", "meta-analysis"], decision: null },
    { id: 3, title: "Dietary Interventions for Hypertension Control", year: 2023, author: "Davis L, Martinez A", keywords: ["diet", "hypertension", "intervention"], decision: "maybe" },
    { id: 4, title: "Exercise and Blood Pressure: A Randomized Controlled Trial", year: 2021, author: "Anderson P, Taylor S", keywords: ["exercise", "blood pressure", "RCT"], decision: "exclude" },
    { id: 5, title: "Pharmacological Treatment of Resistant Hypertension", year: 2023, author: "Thompson G, White D", keywords: ["pharmacology", "resistant hypertension", "treatment"], decision: null },
  ];

  const keywords = [
    { word: "hypertension", count: 15 },
    { word: "blood pressure", count: 12 },
    { word: "cardiovascular", count: 10 },
    { word: "systematic review", count: 8 },
    { word: "meta-analysis", count: 7 },
    { word: "treatment", count: 6 },
    { word: "elderly", count: 5 },
    { word: "diet", count: 4 },
  ];

  const decisionDot = (d: string | null) => {
    if (d === "include") return <span className="inline-block w-2 h-2 rounded-full bg-green-500" />;
    if (d === "exclude") return <span className="inline-block w-2 h-2 rounded-full bg-red-500" />;
    if (d === "maybe") return <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />;
    return <span className="inline-block w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />;
  };

  return (
    <div className="h-full overflow-hidden flex bg-white dark:bg-black">

      {/* ── Left sidebar */}
      <div className="w-60 shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden bg-white dark:bg-black">

        {/* All Data */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">All Data</p>

          {/* Imported references */}
          <div className="mb-3">
            <button onClick={() => setTreeOpen((v) => !v)}
              className="w-full flex items-center justify-between py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="font-medium">Imported References</span>
              </div>
              <svg className={`w-3 h-3 text-gray-300 dark:text-gray-600 transition-transform ${treeOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {treeOpen && (
              <div className="ml-5 mt-1 space-y-0.5">
                <div className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-900 text-xs">
                  <span className="text-gray-900 dark:text-white font-medium">All References</span>
                  <span className="text-gray-500 dark:text-gray-400">15</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors text-xs group">
                  <span className="text-gray-600 dark:text-gray-400 truncate">csv-hypertension...</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-gray-400 dark:text-gray-500">15</span>
                    <button className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="w-full text-left px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 rounded transition-colors">
            + Add References
          </button>
        </div>

        {/* Duplicates */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setDupOpen((v) => !v)}
            className="w-full flex items-center justify-between text-xs mb-2.5">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span className="font-medium">Possible Duplicates</span>
            </div>
            <svg className={`w-3 h-3 text-gray-300 dark:text-gray-600 transition-transform ${dupOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {dupOpen && (
            <>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 leading-relaxed">Find duplicates to start resolving.</p>
              <button className="w-full py-2 text-xs border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium">
                Detect Duplicates
              </button>
            </>
          )}
        </div>

        {/* Decision summary */}
        <div className="px-4 py-4 mt-auto">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Decisions</p>
          <div className="space-y-2">
            {[
              { label: "Included", color: "bg-green-500", count: 3, textColor: "text-green-600 dark:text-green-400" },
              { label: "Excluded", color: "bg-red-500", count: 1, textColor: "text-red-600 dark:text-red-400" },
              { label: "Maybe", color: "bg-yellow-400", count: 1, textColor: "text-yellow-600 dark:text-yellow-400" },
              { label: "Undecided", color: "bg-gray-300 dark:bg-gray-600", count: 10, textColor: "text-gray-500 dark:text-gray-400" },
            ].map(({ label, color, count, textColor }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                </div>
                <span className={`font-semibold ${textColor}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: table */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Table header */}
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-black shrink-0">
          <span className="text-xs font-semibold text-gray-900 dark:text-white">15 Articles</span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors text-gray-400 dark:text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" /></svg>
            </button>
            <select className="text-xs bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors">
              <option>Sort by Title</option>
              <option>Sort by Date</option>
              <option>Sort by Author</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded transition-colors ${showFilters ? "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300" : "hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 dark:text-gray-500"}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0">
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600" />
                </th>
                <th className="w-8 px-3 py-3 text-gray-400 dark:text-gray-500 font-medium text-left">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                  Title ↓
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 w-16">Year</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Author</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400 w-20">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {staticArticles.map((article, idx) => (
                <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors cursor-pointer">
                  <td className="px-4 py-3.5">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600" />
                  </td>
                  <td className="px-3 py-3.5 text-gray-400 dark:text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-gray-900 dark:text-gray-100 font-medium leading-snug line-clamp-2 mb-2">{article.title}</p>
                    <div className="flex flex-wrap gap-1">
                      {article.keywords.map((kw) => (
                        <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900">{kw}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{article.year}</td>
                  <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{article.author}</td>
                  <td className="px-4 py-3.5 text-center">{decisionDot(article.decision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-black shrink-0">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">Attach PDF</button>
            <button className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              Label
            </button>
            <button className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">Export</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-600 dark:text-gray-400">‹</button>
            <span className="text-xs text-gray-400 dark:text-gray-500">1 / 2</span>
            <button className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-600 dark:text-gray-400">›</button>
          </div>
        </div>
      </div>

      {/* ── Right: filters */}
      {showFilters && (
        <div className="w-60 shrink-0 bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Filters</span>
            <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">

              {/* Include keywords */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Include</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-medium">0</span>
                    <button className="text-green-600 dark:text-green-400 font-bold text-base leading-none">+</button>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {keywords.map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-green-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{word}</span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exclude keywords */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Exclude</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">0</span>
                    <button className="text-red-600 dark:text-red-400 font-bold text-base leading-none">+</button>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {keywords.map(({ word, count }) => (
                    <label key={word} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-red-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{word}</span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Year range */}
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5">Year range</p>
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={2000} className="w-24 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-gray-500" />
                  <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                  <input type="number" defaultValue={2030} className="w-24 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-gray-500" />
                </div>
              </div>

              {/* Publication type */}
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5">Publication type</p>
                <label className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">Journal Article</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">15</span>
                </label>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}