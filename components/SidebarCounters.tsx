"use client";

import type { StatusCounts } from "@/types/duplicate";

interface SidebarCountersProps {
  counts: StatusCounts;
  activeStatus: string;
  onStatusClick: (status: string) => void;
}

export default function SidebarCounters({ counts, activeStatus, onStatusClick }: SidebarCountersProps) {
  const statusItems = [
    {
      key: "unresolved",
      label: "Unresolved",
      count: counts.unresolved,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      dotColor: "#F97316", // orange-500
    },
    {
      key: "deleted",
      label: "Deleted",
      count: counts.deleted,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      dotColor: "#EF4444", // red-500
    },
    {
      key: "not_duplicate",
      label: "Not Duplicate",
      count: counts.not_duplicate,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      dotColor: "#3B82F6", // blue-500
    },
    {
      key: "resolved",
      label: "Resolved",
      count: counts.resolved,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      dotColor: "#22C55E", // green-500
    },
  ];

  return (
    <div className="space-y-0.5">
      {statusItems.map((item) => {
        const isActive = activeStatus === item.key;

        return (
          <button
            key={item.key}
            onClick={() => onStatusClick(item.key)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-left"
            style={{
              background: isActive ? "var(--accent-soft)" : "transparent",
              border: isActive ? "1px solid var(--accent-border)" : "1px solid transparent",
            }}
            aria-label={`Filter by ${item.label}`}
            aria-pressed={isActive}
          >
            <div className="flex items-center gap-2">
              {/* Colored status dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: item.dotColor }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: isActive ? "var(--accent)" : "var(--text-secondary)" }}
              >
                {item.label}
              </span>
            </div>
            <span
              className="text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-md"
              style={{
                background: isActive ? "var(--accent)" : "var(--surface-3)",
                color: isActive ? "#fff" : "var(--text-muted)",
              }}
            >
              {item.count}
            </span>
          </button>
        );
      })}

      {/* Total */}
      <div
        className="mt-2 pt-2 border-t flex items-center justify-between px-3 py-1.5"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Total
        </span>
        <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
          {counts.total}
        </span>
      </div>
    </div>
  );
}
