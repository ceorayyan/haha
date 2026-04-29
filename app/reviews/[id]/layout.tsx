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
        // Fetch review data first to check if user has access
        const reviewData = await api.getReview(reviewId);
        setReview(reviewData);
        
        // Only try to accept invitation if user has a pending invitation
        // Check if user is already a member or has pending invitation
        const members = await api.getTeamMembers(reviewId);
        const currentUser = api.getStoredUser();
        
        if (currentUser) {
          const userMember = members.find((m: any) => 
            m.user_id === currentUser.id || m.email === currentUser.email
          );
          
          // Only attempt to accept if user has a pending invitation
          if (userMember && userMember.status === 'pending') {
            try {
              await api.request(`/reviews/${reviewId}/accept`, { method: 'POST' });
              setInvitationAccepted(true);
            } catch (error: any) {
              // Silently fail - invitation might have been accepted already
            }
          }
        }
      } catch (error: any) {
        // Only log errors that aren't 401/403 (those are handled by api.ts)
        if (!error.message?.includes('Session expired') && 
            !error.message?.includes('permission') && 
            !error.message?.includes('Unauthorized')) {
          console.error("Failed to load review:", error);
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
