"use client";

import React, { useMemo, useState } from "react";

type ResolveChoice = "left" | "right" | "both";

export type DuplicateResolvePair = {
  duplicateId: number;
  similarityScore: number;
  detectionReason: string;
  left: { articleId: number; title: string; authors: string; createdAt: string; url?: string };
  right: { articleId: number; title: string; authors: string; createdAt: string; url?: string };
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

const STOP_WORDS = new Set([
  "the","a","an","of","in","for","to","and","or","is","are","was","were","be","been",
  "being","have","has","had","do","does","did","will","would","should","could","may",
  "might","must","can","with","at","from","by","on","as","this","that","these","those",
  "its","it","we","our","their","who","which","how","when","where","what","all","but",
]);

function getUniqueWords(a: string, b: string): Set<string> {
  const wa = (a.toLowerCase().match(/\b\w{3,}\b/g) || []).filter(w => !STOP_WORDS.has(w));
  const wb = new Set((b.toLowerCase().match(/\b\w{3,}\b/g) || []).filter(w => !STOP_WORDS.has(w)));
  return new Set(wa.filter(w => !wb.has(w)));
}

function getSharedWords(a: string, b: string): Set<string> {
  const wa = (a.toLowerCase().match(/\b\w{3,}\b/g) || []).filter(w => !STOP_WORDS.has(w));
  const wb = new Set((b.toLowerCase().match(/\b\w{3,}\b/g) || []).filter(w => !STOP_WORDS.has(w)));
  return new Set(wa.filter(w => wb.has(w)));
}

function applyHighlight(text: string, unmatched: Set<string>, shared: Set<string>, on: boolean): string {
  if (!text || !on) return text;
  return text.replace(/\b(\w+)\b/g, (word) => {
    const l = word.toLowerCase();
    if (unmatched.has(l)) return `<span style="color:var(--accent);font-weight:600">${word}</span>`;
    if (shared.has(l)) return `<span style="color:var(--text-secondary)">${word}</span>`;
    return word;
  });
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{label}:</p>
        <div className="text-xs break-words" style={{ color: "var(--text-secondary)" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

export default function ManualDuplicateResolveModal({
  pair,
  index,
  total,
  totalInDb,
  isResolving,
  onClose,
  onChoose,
}: {
  pair: DuplicateResolvePair | null;
  index: number;
  total: number;          // queue length (loaded pairs)
  totalInDb?: number;     // real DB count for progress bar
  isResolving: boolean;
  onClose: () => void;
  onChoose: (choice: ResolveChoice) => void;
}) {
  const [highlightDiff, setHighlightDiff] = useState(true);

  const leftUnmatched = useMemo(() => pair ? getUniqueWords(pair.left.title, pair.right.title) : new Set<string>(), [pair?.left?.title, pair?.right?.title]);
  const rightUnmatched = useMemo(() => pair ? getUniqueWords(pair.right.title, pair.left.title) : new Set<string>(), [pair?.left?.title, pair?.right?.title]);
  const shared = useMemo(() => pair ? getSharedWords(pair.left.title, pair.right.title) : new Set<string>(), [pair?.left?.title, pair?.right?.title]);

  const simColor = useMemo(() => {
    const s = pair?.similarityScore ?? 0;
    if (s >= 90) return "#22c55e";
    if (s >= 70) return "#f97316";
    return "#ef4444";
  }, [pair?.similarityScore]);

  const realTotal = totalInDb ?? total;
  const done = index;
  const left = realTotal - done;
  const progressPct = realTotal > 0 ? Math.min(100, Math.round((done / realTotal) * 100)) : 0;

  if (!pair) return null;

  const leftHtml = applyHighlight(pair.left.title, leftUnmatched, shared, highlightDiff);
  const rightHtml = applyHighlight(pair.right.title, rightUnmatched, shared, highlightDiff);

  const IcoUser = <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const IcoCal = <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  const IcoLink = <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
  const IcoId = <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
  const IcoReason = <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl rounded-2xl flex flex-col"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-border)",
          height: "min(88vh, 720px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── HEADER ── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}
            >
              <svg className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Resolve Duplicates</h2>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Pair {index + 1} of {total} loaded · {realTotal.toLocaleString()} total unresolved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Keep Both */}
            <button
              disabled={isResolving}
              onClick={() => onChoose("both")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              Keep Both
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              disabled={isResolving}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── CARDS ── */}
        <div className="flex-1 grid grid-cols-2 divide-x overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>

          {/* LEFT */}
          <div className="flex flex-col overflow-hidden">
            {/* Title */}
            <div
              className="px-5 py-4 border-b shrink-0"
              style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
                >
                  Left
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>#{pair.left.articleId}</span>
              </div>
              <p
                className="text-sm font-semibold leading-snug"
                style={{ color: "var(--text-primary)" }}
                dangerouslySetInnerHTML={{ __html: leftHtml }}
              />
            </div>

            {/* Meta — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-1">
              <MetaRow icon={IcoUser} label="Authors" value={pair.left.authors || "—"} />
              <MetaRow icon={IcoCal} label="Date" value={formatDate(pair.left.createdAt)} />
              <MetaRow
                icon={IcoLink}
                label="DOI / URL"
                value={
                  pair.left.url ? (
                    <a href={pair.left.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }} className="hover:underline break-all">
                      {pair.left.url}
                    </a>
                  ) : "—"
                }
              />
              <MetaRow icon={IcoReason} label="Detection Reason" value={pair.detectionReason} />
              <MetaRow icon={IcoId} label="Article ID" value={`#${pair.left.articleId}`} />
            </div>

            {/* Card footer */}
            <div
              className="px-5 py-3 border-t shrink-0 flex items-center justify-between"
              style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
            >
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: simColor }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: simColor }} />
                Similarity: {pair.similarityScore}%
              </span>
              <button
                onClick={() => onChoose("left")}
                disabled={isResolving}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-border)",
                }}
              >
                {isResolving ? "Resolving…" : "Keep Left Article"}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col overflow-hidden">
            {/* Title */}
            <div
              className="px-5 py-4 border-b shrink-0"
              style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
                >
                  Right
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>#{pair.right.articleId}</span>
              </div>
              <p
                className="text-sm font-semibold leading-snug"
                style={{ color: "var(--text-primary)" }}
                dangerouslySetInnerHTML={{ __html: rightHtml }}
              />
            </div>

            {/* Meta — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-1">
              <MetaRow icon={IcoUser} label="Authors" value={pair.right.authors || "—"} />
              <MetaRow icon={IcoCal} label="Date" value={formatDate(pair.right.createdAt)} />
              <MetaRow
                icon={IcoLink}
                label="DOI / URL"
                value={
                  pair.right.url ? (
                    <a href={pair.right.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }} className="hover:underline break-all">
                      {pair.right.url}
                    </a>
                  ) : "—"
                }
              />
              <MetaRow icon={IcoReason} label="Detection Reason" value={pair.detectionReason} />
              <MetaRow icon={IcoId} label="Article ID" value={`#${pair.right.articleId}`} />
            </div>

            {/* Card footer */}
            <div
              className="px-5 py-3 border-t shrink-0 flex items-center justify-between"
              style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
            >
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: simColor }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: simColor }} />
                Similarity: {pair.similarityScore}%
              </span>
              <button
                onClick={() => onChoose("right")}
                disabled={isResolving}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--secondary, var(--accent)) 100%)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {isResolving ? "Resolving…" : "Keep Right Article"}
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div
          className="px-5 py-3 border-t shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}
        >
          {/* Toggle + legend */}
          <div className="flex items-center justify-between mb-2.5">
            <button
              onClick={() => setHighlightDiff(v => !v)}
              className="flex items-center gap-2 select-none"
            >
              <span
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                style={{ background: highlightDiff ? "var(--accent)" : "var(--border-subtle)" }}
              >
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: highlightDiff ? "translateX(18px)" : "translateX(2px)" }}
                />
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Highlight difference
              </span>
            </button>

            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm" style={{ background: "var(--accent)", opacity: 0.4 }} />
                Unique words
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm" style={{ background: "var(--border-subtle)" }} />
                Shared words
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-semibold whitespace-nowrap shrink-0" style={{ color: "var(--text-primary)" }}>
              {done.toLocaleString()} Done · {left.toLocaleString()} Left to Resolve
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, var(--accent), var(--secondary, var(--accent)))",
                }}
              />
            </div>
            <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
              {progressPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
