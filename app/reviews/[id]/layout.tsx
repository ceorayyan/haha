"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useData } from "../../context/DataContext";
import { useState } from "react";

export default function ReviewDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const reviewId = Number(params.id);
  const { getReviewById } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const review = getReviewById(reviewId);

  const tabs = [
    { id: "overview", label: "Overview", href: `/reviews/${reviewId}/overview` },
    { id: "data", label: "Review data", href: `/reviews/${reviewId}/data` },
    { id: "screening", label: "Screening", href: `/reviews/${reviewId}/screening` },
    { id: "fulltext", label: "Full text screening", href: `/reviews/${reviewId}/fulltext` },
    { id: "extraction", label: "Data extraction", href: `/reviews/${reviewId}/extraction` },
  ];

  const currentTab = pathname.includes("/overview") ? "overview"
    : pathname.includes("/data") ? "data"
    : pathname.includes("/fulltext") ? "fulltext"
    : pathname.includes("/screening") ? "screening"
    : pathname.includes("/extraction") ? "extraction"
    : "overview";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} title={review?.title || "Review"} />

        {/* Tab bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center gap-1 shrink-0">
          {tabs.map(tab => (
            <Link key={tab.id} href={tab.href} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${currentTab === tab.id ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}>
              {tab.label}
            </Link>
          ))}
        </div>

        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
