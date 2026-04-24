"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useState, useEffect } from "react";
import api from "../../../lib/api";

export default function ReviewDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const reviewId = Number(params.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [invitationAccepted, setInvitationAccepted] = useState(false);

  // Auto-accept invitation when user visits the review
  useEffect(() => {
    const autoAcceptInvitation = async () => {
      try {
        // Try to accept invitation first (will only work if user has a pending invitation)
        try {
          await api.request(`/reviews/${reviewId}/accept`, { method: 'POST' });
          setInvitationAccepted(true);
          console.log("Invitation auto-accepted");
        } catch (error: any) {
          // Silently fail - user might not have a pending invitation or already accepted
          // This is expected for users who are already members or not invited
          console.log("No pending invitation to accept or already accepted");
        }
        
        // Fetch review data after attempting to accept invitation
        const reviewData = await api.getReview(reviewId);
        setReview(reviewData);
      } catch (error: any) {
        console.error("Failed to load review:", error);
        // Don't show error for permission issues - user might not have access yet
        if (error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
          console.log("Waiting for review access...");
        }
      }
    };

    autoAcceptInvitation();
  }, [reviewId]);

  const tabs = [
    { id: "overview", label: "Overview", href: `/reviews/${reviewId}/overview` },
    { id: "data", label: "Review data", href: `/reviews/${reviewId}/data` },
    { id: "screening", label: "Screening", href: `/reviews/${reviewId}/screening` },
    { id: "fulltext", label: "Full text screening", href: `/reviews/${reviewId}/fulltext` },
  ];

  const currentTab = pathname.includes("/overview") ? "overview"
    : pathname.includes("/data") ? "data"
    : pathname.includes("/fulltext") ? "fulltext"
    : pathname.includes("/screening") ? "screening"
    : "overview";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} title={review?.title || "Review"} />

        {/* Invitation accepted notification */}
        {invitationAccepted && (
          <div className="bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-800 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-medium">Welcome! You've been added to this review.</span>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 flex items-center gap-1 shrink-0">
          {tabs.map(tab => (
            <Link key={tab.id} href={tab.href} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${currentTab === tab.id ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}>
              {tab.label}
            </Link>
          ))}
        </div>

        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-black">
          {children}
        </main>
      </div>
    </div>
  );
}
