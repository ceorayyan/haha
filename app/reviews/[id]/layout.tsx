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
  const [blindMode, setBlindMode] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Auto-accept invitation when user visits the review
  useEffect(() => {
    const autoAcceptInvitation = async () => {
      try {
        // Fetch review data first to check if user has access
        const reviewData = await api.getReview(reviewId);
        setReview(reviewData);
        setBlindMode(reviewData.blind_mode || false);
        
        // Check if current user is the owner
        const currentUser = api.getStoredUser();
        if (currentUser && reviewData.user) {
          setIsOwner(currentUser.id === reviewData.user.id);
        }
        
        // Only try to accept invitation if user has a pending invitation
        // Check if user is already a member or has pending invitation
        const members = await api.getTeamMembers(reviewId);
        
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

  const handleToggleBlindMode = async () => {
    try {
      const response = await api.toggleBlindMode(reviewId);
      const newBlindMode = response.data.blind_mode;
      setBlindMode(newBlindMode);
      // Store in localStorage so child pages can detect the change and re-fetch
      localStorage.setItem(`blind_mode_${reviewId}`, String(newBlindMode));
      // Reload the page so all article data is re-fetched with correct blind mode
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to toggle blind mode:", error);
      alert(`Failed to toggle blind mode: ${error.message || 'Please try again.'}`);
    }
  };

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
        <div className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-gray-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <Link
                key={tab.id}
                href={tab.href}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={currentTab === tab.id ? {
                  borderColor: "#1a5f7a",
                  color: "#1a5f7a",
                } : {
                  borderColor: "transparent",
                  color: "#6b7280",
                }}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Blind Mode Toggle - Only visible to owner */}
          {isOwner && (
            <button
              onClick={handleToggleBlindMode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={blindMode ? { 
                background: "#1a5f7a", 
                color: "#fff" 
              } : { 
                background: "#f3f4f6", 
                color: "#6b7280" 
              }}
              title={blindMode ? "Blind mode: ON - Users can only see their own work" : "Blind mode: OFF - All work is visible"}
            >
              {blindMode ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856A9.97 9.97 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
              <span>{blindMode ? "Blind Mode: ON" : "Blind Mode: OFF"}</span>
            </button>
          )}
        </div>

        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-black">
          {children}
        </main>
      </div>
    </div>
  );
}
