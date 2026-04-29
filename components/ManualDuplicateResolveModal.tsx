"use client";

import React, { useMemo } from "react";

type ResolveChoice = "left" | "right" | "both";

export type DuplicateResolvePair = {
  duplicateId: number;
  similarityScore: number;
  detectionReason: string;
  left: { articleId: number; title: string; authors: string; createdAt: string };
  right: { articleId: number; title: string; authors: string; createdAt: string };
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ManualDuplicateResolveModal({
  pair,
  index,
  total,
  isResolving,
  onClose,
  onChoose,
}: {
  pair: DuplicateResolvePair | null;
  index: number;
  total: number;
  isResolving: boolean;
  onClose: () => void;
  onChoose: (choice: ResolveChoice) => void;
}) {
  const stopWords = useMemo(
    () => [
      "the",
      "a",
      "an",
      "of",
      "in",
      "for",
      "to",
      "and",
      "or",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "may",
      "might",
      "must",
      "can",
      "with",
      "at",
      "from",
      "by",
      "on",
      "as",
      "this",
      "that",
      "these",
      "those",
    ],
    []
  );

  const commonKeywords = useMemo(() => {
    const l = pair?.left?.title?.toLowerCase() || "";
    const r = pair?.right?.title?.toLowerCase() || "";
    if (!l || !r) return [];

    const w1 = l.match(/\b\w{4,}\b/g) || [];
    const w2 = r.match(/\b\w{4,}\b/g) || [];
    const set2 = new Set(w2.filter((w) => !stopWords.includes(w)));
    return Array.from(new Set(w1.filter((w) => set2.has(w) && !stopWords.includes(w))));
  }, [pair?.left?.title, pair?.right?.title, stopWords]);

  const highlightKeywords = (text: string) => {
    if (!text || commonKeywords.length === 0) return text;

    let out = text;
    commonKeywords.forEach((kw) => {
      const regex = new RegExp(`\\b(${kw})\\b`, "gi");
      out = out.replace(
        regex,
        '<mark class="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 px-1 rounded font-medium">$1</mark>'
      );
    });
    return out;
  };

  const similarityTone = useMemo(() => {
    const s = pair?.similarityScore ?? 0;
    if (s >= 90) return { dot: "bg-green-500", text: "text-green-400" };
    if (s >= 70) return { dot: "bg-orange-500", text: "text-orange-400" };
    return { dot: "bg-red-500", text: "text-red-400" };
  }, [pair?.similarityScore]);

  if (!pair) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-2xl border"
        style={{
          background: "var(--surface-1)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Resolve duplicates
              </h3>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {index + 1} / {total}
              </span>
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              Similarity{" "}
              <span className={`inline-flex items-center gap-2 font-semibold ${similarityTone.text}`}>
                <span className={`w-2 h-2 rounded-full ${similarityTone.dot}`} />
                {pair.similarityScore}%
              </span>{" "}
              • {pair.detectionReason}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: "var(--text-muted)" }}
            disabled={isResolving}
            aria-label="Close"
            title={isResolving ? "Resolving…" : "Close"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-xl"
                      style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}
                    >
                      <span className={`w-2 h-2 rounded-full ${similarityTone.dot}`} />
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                      Left Article
                    </span>
                  </div>
                  <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                    #{pair.left.articleId}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div
                  className="text-sm font-semibold leading-snug"
                  style={{ color: "var(--text-primary)" }}
                  title={pair.left.title}
                >
                  <span dangerouslySetInnerHTML={{ __html: highlightKeywords(pair.left.title) }} />
                </div>
                {pair.left.authors && (
                  <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }} title={pair.left.authors}>
                    {pair.left.authors}
                  </div>
                )}
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatDate(pair.left.createdAt)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-xl"
                      style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}
                    >
                      <span className={`w-2 h-2 rounded-full ${similarityTone.dot}`} />
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                      Right Article
                    </span>
                  </div>
                  <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                    #{pair.right.articleId}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div
                  className="text-sm font-semibold leading-snug"
                  style={{ color: "var(--text-primary)" }}
                  title={pair.right.title}
                >
                  <span dangerouslySetInnerHTML={{ __html: highlightKeywords(pair.right.title) }} />
                </div>
                {pair.right.authors && (
                  <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }} title={pair.right.authors}>
                    {pair.right.authors}
                  </div>
                )}
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatDate(pair.right.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => onChoose("left")}
              disabled={isResolving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
                border: "1px solid var(--accent-border)",
              }}
            >
              Keep Left
            </button>
            <button
              onClick={() => onChoose("right")}
              disabled={isResolving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              Keep Right
            </button>
            <button
              onClick={() => onChoose("both")}
              disabled={isResolving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Keep Both
            </button>
          </div>

          <div className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            {isResolving ? "Resolving…" : "Choose one option to continue to the next pair."}
          </div>
        </div>
      </div>
    </div>
  );
}

