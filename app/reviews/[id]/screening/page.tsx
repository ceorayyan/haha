"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/api";
import FilterBar from "@/components/FilterBar";
import ArticleDisplay from "@/components/ArticleDisplay";

type Article = {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  url?: string;
  screening_decision?: "included" | "excluded" | "undecided";
  screening_decision_by?: string;
  screening_notes?: string;
  labels?: string[];
  exclusion_reasons?: string[];
  created_at: string;
  file_path?: string;
};

export default function ScreeningPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  const currentUserName = api.getStoredUser()?.name || "You";

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelInput, setLabelInput] = useState("");

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await api.getArticles(reviewId, 1, 100);
        const arr = Array.isArray(res) ? res : res?.data || [];
        setArticles(arr);
        setCurrentIndex(0);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load articles");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [reviewId]);

  const keywordFilteredArticles = useMemo(() => {
    const inc = includeKeywords.map((k) => k.toLowerCase());
    const exc = excludeKeywords.map((k) => k.toLowerCase());
    return articles.filter((article) => {
      const text = `${article.title} ${article.authors || ""} ${article.abstract || ""}`.toLowerCase();
      if (inc.length > 0 && !inc.some((k) => text.includes(k))) return false;
      if (exc.length > 0 && exc.some((k) => text.includes(k))) return false;
      return true;
    });
  }, [articles, includeKeywords, excludeKeywords]);

  const filteredArticles = keywordFilteredArticles;

  // Keep index in-bounds when filtering changes
  useEffect(() => {
    if (currentIndex >= filteredArticles.length) setCurrentIndex(0);
  }, [filteredArticles.length, currentIndex]);

  const currentArticle = filteredArticles[currentIndex] || null;

  const goNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, Math.max(filteredArticles.length - 1, 0)));
  };

  const updateDecision = async (articleId: number, decision: "included" | "excluded" | "undecided", extra?: Partial<Article>) => {
    const payload: any = {
      screening_decision: decision,
      screening_notes: extra?.screening_notes,
      labels: extra?.labels,
      exclusion_reasons: extra?.exclusion_reasons,
    };
    await api.updateArticleScreening(articleId, payload);
  };

  const handleInclude = async () => {
    if (!currentArticle) return;

    // Optimistic UI: switch status in-place.
    const articleToUpdate = currentArticle;
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleToUpdate.id ? { ...a, screening_decision: "included", screening_decision_by: currentUserName } : a
      )
    );

    // Advance immediately (no success toast).
    goNext();

    try {
      await updateDecision(articleToUpdate.id, "included");
    } catch (e: any) {
      setArticles((prev) => {
        return prev.map((a) =>
          a.id === articleToUpdate.id ? { ...a, screening_decision: "undecided", screening_decision_by: undefined } : a
        );
      });
      toast.error(e?.message || "Failed to update");
    }
  };

  const handleMaybe = async () => {
    // Treat “confused” as undecided for now (still advances)
    if (!currentArticle) return;
    goNext();
  };

  const handleExclude = async () => {
    if (!currentArticle) return;

    const articleToUpdate = currentArticle;

    // Optimistic UI: switch status in-place.
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleToUpdate.id ? { ...a, screening_decision: "excluded", screening_decision_by: currentUserName } : a
      )
    );

    // Advance immediately (no success toast).
    goNext();

    try {
      await updateDecision(articleToUpdate.id, "excluded");
    } catch (e: any) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleToUpdate.id ? { ...a, screening_decision: "undecided", screening_decision_by: undefined } : a
        )
      );
      toast.error(e?.message || "Failed to update");
    }
  };

  const openLabel = () => {
    if (!currentArticle) return;
    setLabelInput("");
    setShowLabelModal(true);
  };

  const saveLabel = async () => {
    if (!currentArticle) return;
    const decision = (currentArticle.screening_decision ?? "undecided") as "included" | "excluded" | "undecided";
    const nextLabels = labelInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (nextLabels.length === 0) {
      setShowLabelModal(false);
      return;
    }
    try {
      const merged = Array.from(new Set([...(currentArticle.labels || []), ...nextLabels]));
      await updateDecision(currentArticle.id, decision, { labels: merged });
      setArticles((prev) => prev.map((a) => (a.id === currentArticle.id ? { ...a, labels: merged } : a)));
      setShowLabelModal(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save labels");
    }
  };

  const saveNote = async (note: string) => {
    if (!currentArticle) return;
    const decision = (currentArticle.screening_decision ?? "undecided") as "included" | "excluded" | "undecided";
    try {
      await updateDecision(currentArticle.id, decision, { screening_notes: note });
      setArticles((prev) => prev.map((a) => (a.id === currentArticle.id ? { ...a, screening_notes: note } : a)));
    } catch (e: any) {
      toast.error(e?.message || "Failed to save note");
    }
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex bg-[var(--deep-space)] overflow-hidden">
      <Toaster position="top-right" />

      {/* Left list */}
      <aside className="w-80 border-r border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-y-auto">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Screening
            </div>
            <div className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
              {filteredArticles.length}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--text-muted)" }} />
              Undecided{" "}
              <span className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                {filteredArticles.filter((a) => !a.screening_decision || a.screening_decision === "undecided").length}
              </span>
            </span>
            <span className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.95)" }} />
              Included{" "}
              <span className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                {filteredArticles.filter((a) => a.screening_decision === "included").length}
              </span>
            </span>
            <span className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.95)" }} />
              Excluded{" "}
              <span className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                {filteredArticles.filter((a) => a.screening_decision === "excluded").length}
              </span>
            </span>
          </div>
        </div>
        {loading ? (
          <div className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
            No articles match filters.
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredArticles.map((a, idx) => (
              <button
                key={a.id}
                onClick={() => setCurrentIndex(idx)}
                className="w-full text-left px-3 py-2 rounded-lg border transition-colors"
                style={{
                  background: idx === currentIndex ? "var(--accent-soft)" : "transparent",
                  borderColor: idx === currentIndex ? "var(--accent-border)" : "transparent",
                  color: "var(--text-primary)",
                }}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{
                      background:
                        a.screening_decision === "included"
                          ? "rgba(34,197,94,0.95)"
                          : a.screening_decision === "excluded"
                            ? "rgba(239,68,68,0.95)"
                            : "var(--text-muted)",
                    }}
                  />
                  <div className="text-xs font-semibold line-clamp-2">{a.title}</div>
                </div>
                {a.authors && (
                  <div className="text-[11px] mt-1 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                    {a.authors}
                  </div>
                )}
                {(a.screening_decision === "included" || a.screening_decision === "excluded") && (
                  <div className="text-[10px] mt-1 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                    {a.screening_decision === "included" ? "Included by " : "Excluded by "}
                    {a.screening_decision_by || "—"}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Center */}
      <main className="flex-1 overflow-y-auto p-6">
        {currentArticle ? (
          <ArticleDisplay
            article={currentArticle as any}
            includeKeywords={includeKeywords}
            excludeKeywords={excludeKeywords}
            currentIndex={currentIndex}
            totalCount={filteredArticles.length}
          />
        ) : (
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Select an article to start screening.
          </div>
        )}
      </main>

      {/* Right filters */}
      <aside className="w-80 border-l border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-y-auto">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Filters
          </div>
        </div>
        <FilterBar
          includeKeywords={includeKeywords}
          excludeKeywords={excludeKeywords}
          onIncludeKeywordsChange={setIncludeKeywords}
          onExcludeKeywordsChange={setExcludeKeywords}
          articles={articles as any}
        />
      </aside>

      {/* Bottom action bar */}
      <div className="fixed left-0 right-0 bottom-0 border-t border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="max-w-[1600px] mx-auto px-6 py-2 grid grid-cols-[1fr_auto] items-center gap-4">
          <div className="flex items-center justify-start gap-2 flex-wrap">
            <button
              onClick={openLabel}
              disabled={!currentArticle}
              className="px-4 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50"
              style={{ borderColor: "var(--accent-border)", color: "var(--accent)" }}
            >
              Label
            </button>
            <button
              onClick={handleInclude}
              disabled={!currentArticle}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "rgba(34,197,94,0.12)", color: "rgba(34,197,94,0.95)" }}
            >
              ✓ Include
            </button>
            <button
              onClick={handleMaybe}
              disabled={!currentArticle}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "rgba(245,158,11,0.14)", color: "rgba(245,158,11,0.95)" }}
            >
              ? Confused
            </button>
            <button
              onClick={handleExclude}
              disabled={!currentArticle}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "rgba(239,68,68,0.12)", color: "rgba(239,68,68,0.95)" }}
            >
              ✗ Exclude
            </button>
          </div>

          <div className="flex items-center justify-end gap-3">
            <input
              disabled={!currentArticle}
              placeholder="Add note…"
              className="w-[360px] max-w-full px-3 py-2 rounded-lg text-sm border disabled:opacity-50"
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

            <button
              onClick={goNext}
              disabled={!currentArticle}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Label modal */}
      {showLabelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowLabelModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border overflow-hidden"
            style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Add labels
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Comma-separated.
              </div>
            </div>
            <div className="p-6">
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="e.g. RCT, pediatric, high-risk"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                onClick={() => setShowLabelModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={saveLabel}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "var(--accent)", color: "white" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
