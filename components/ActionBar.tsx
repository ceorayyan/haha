"use client";

import { useState, useRef, useEffect } from "react";

const SUGGESTED_LABELS = [
  "Irrelevant",
  "Not Needed",
  "Out of Scope",
  "Duplicate",
  "Low Quality",
  "Wrong Language",
  "Wrong Study Type",
  "Wrong Population",
  "Wrong Intervention",
  "Wrong Outcome",
  "Full Text Unavailable",
  "Conference Abstract Only",
];

interface ActionBarProps {
  disabled?: boolean;
  onAttachPdf: () => void;
  onLabel: (label: string) => void;
  onAddNote?: (note: string) => void;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  loadingPages?: boolean;
  // Selection info
  selectionCount?: number;
}

export default function ActionBar({
  disabled = false,
  onAttachPdf,
  onLabel,
  onAddNote,
  currentPage = 1,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  loadingPages = false,
  selectionCount = 0,
}: ActionBarProps) {
  const [noteText, setNoteText] = useState("");
  const [labelPopupOpen, setLabelPopupOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const labelBtnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    if (!labelPopupOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        labelBtnRef.current &&
        !labelBtnRef.current.contains(e.target as Node)
      ) {
        setLabelPopupOpen(false);
        setCustomLabel("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [labelPopupOpen]);

  const handleAddNoteSubmit = () => {
    if (!disabled && noteText.trim() && onAddNote) {
      onAddNote(noteText.trim());
      setNoteText("");
    }
  };

  const applyLabel = (label: string) => {
    if (!label.trim()) return;
    onLabel(label.trim());
    setLabelPopupOpen(false);
    setCustomLabel("");
  };

  const hasPagination = totalPages > 1 || currentPage > 1;

  return (
    <div
      className="h-12 border-t shrink-0 flex items-center px-4 gap-3 relative"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Left: action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAttachPdf}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{
            background: "var(--accent-soft)",
            borderColor: "var(--accent-border)",
            color: "var(--accent)",
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Attach PDF
        </button>

        {/* Label button + popup */}
        <div className="relative">
          <button
            ref={labelBtnRef}
            onClick={() => { if (!disabled) setLabelPopupOpen((v) => !v); }}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{
              background: labelPopupOpen ? "var(--accent-soft)" : "transparent",
              borderColor: "var(--accent-border)",
              color: "var(--accent)",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Label
            <svg className={`w-3 h-3 transition-transform ${labelPopupOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Label popup — anchored above the button */}
          {labelPopupOpen && (
            <div
              ref={popupRef}
              className="absolute bottom-full left-0 mb-2 w-64 rounded-xl shadow-2xl border overflow-hidden z-[80]"
              style={{
                background: "var(--surface-1)",
                borderColor: "var(--border-subtle)",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.18), 0 0 0 1px var(--border-subtle)",
              }}
            >
              {/* Popup header */}
              <div
                className="px-3 py-2.5 border-b flex items-center justify-between"
                style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    Apply Label
                    {selectionCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        {selectionCount}
                      </span>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => { setLabelPopupOpen(false); setCustomLabel(""); }}
                  className="p-0.5 rounded transition-all hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Suggested labels */}
              <div className="py-1.5 max-h-52 overflow-y-auto">
                {SUGGESTED_LABELS.map((label) => (
                  <button
                    key={label}
                    onClick={() => applyLabel(label)}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <svg className="w-3 h-3 shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {label}
                  </button>
                ))}
              </div>

              {/* Custom label input */}
              <div
                className="px-3 py-2.5 border-t"
                style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customLabel.trim()) applyLabel(customLabel);
                      if (e.key === "Escape") { setLabelPopupOpen(false); setCustomLabel(""); }
                    }}
                    placeholder="Custom label…"
                    autoFocus
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all"
                    style={{
                      background: "var(--surface-1)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": "var(--accent)",
                    }}
                  />
                  <button
                    onClick={() => applyLabel(customLabel)}
                    disabled={!customLabel.trim()}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: note input */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)" }}
        >
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && noteText.trim()) handleAddNoteSubmit();
              if (e.key === "Escape") setNoteText("");
            }}
            placeholder="Add note…"
            disabled={disabled}
            className="w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
              // @ts-expect-error CSS custom property
              "--tw-ring-color": "var(--accent)",
            }}
          />
          {noteText.trim() && !disabled && (
            <button
              onClick={handleAddNoteSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-all hover:opacity-80"
              style={{ color: "var(--accent)" }}
              aria-label="Send note"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Right: pagination */}
      {hasPagination && (
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            onClick={onPrevPage}
            disabled={currentPage === 1 || loadingPages}
            className="w-7 h-7 flex items-center justify-center border rounded-md hover:bg-[var(--surface-2)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            ‹
          </button>
          <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={currentPage === totalPages || loadingPages}
            className="w-7 h-7 flex items-center justify-center border rounded-md hover:bg-[var(--surface-2)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
