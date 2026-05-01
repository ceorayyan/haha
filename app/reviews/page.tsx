"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ProtectedRoute from "../components/ProtectedRoute";
import api from "../../lib/api";

type ModalStep = 1 | 2 | 3;

const inputCls = "w-full bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a5f7a] transition-colors";
const selectCls = "w-full bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a5f7a] transition-colors";

function StepIndicator({ step }: { step: ModalStep }) {
  const steps = [
    { n: 1, label: "Add review info" },
    { n: 2, label: "Upload Articles" },
    { n: 3, label: "Invite Members" },
  ];
  return (
    <div className="flex items-center px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          {i > 0 && <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === s.n ? "bg-black dark:bg-white text-white dark:text-black" : step > s.n ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
              {step > s.n ? "✓" : s.n}
            </div>
            <span className={`text-xs font-medium ${step === s.n ? "text-black dark:text-white" : step > s.n ? "text-gray-600 dark:text-gray-400" : "text-gray-400"}`}>{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<ModalStep>(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ 
    title: "", 
    type: "", 
    domain: "", 
    description: "", 
  });
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [currentReviewId, setCurrentReviewId] = useState<number | null>(null);

  // Fetch reviews on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = api.getStoredUser();
        setUser(userData);

        const reviewsData = await api.getReviews();
        // Ensure reviews is always an array
        const reviewsArray = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.data || []);
        setReviews(reviewsArray);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const createReview = async (reviewData: any) => {
    try {
      const newReview = await api.createReview(reviewData);
      // Add to the beginning of the array (top of the list)
      setReviews(prev => [newReview, ...prev]);
      setCurrentReviewId(newReview.id);
      return newReview;
    } catch (error) {
      console.error("Failed to create review:", error);
      alert("Failed to create review. Please try again.");
      return null;
    }
  };

  const uploadArticles = async (reviewId: number) => {
    if (selectedFiles.length === 0) {
      handleSkip();
      return;
    }

    setUploading(true);
    try {
      let successCount = 0;
      let failureCount = 0;
      
      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
          formData.append('file', file);
          await api.createArticle(reviewId, formData);
          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failureCount++;
        }
      }
      
      // Refresh the review data to get updated article count
      await refreshReviews();
      
      if (failureCount > 0) {
        alert(`Uploaded ${successCount} article(s). Failed to upload ${failureCount} article(s).`);
      }
      handleSkip();
    } catch (error) {
      console.error("Failed to upload articles:", error);
      alert("Failed to upload articles. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const refreshReviews = async () => {
    try {
      const reviewsData = await api.getReviews();
      const reviewsArray = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.data || []);
      setReviews(reviewsArray);
    } catch (error) {
      console.error("Failed to refresh reviews:", error);
    }
  };

  const inviteMembers = async (reviewId: number) => {
    if (!inviteEmails.trim() || !inviteRole) {
      handleSkip();
      return;
    }

    setInviting(true);
    try {
      const emails = inviteEmails.split(',').map(e => e.trim()).filter(e => e);
      let successCount = 0;
      let failureCount = 0;
      
      for (const email of emails) {
        try {
          await api.addTeamMember(reviewId, {
            email,
            role: inviteRole.toLowerCase(),
            message: inviteMsg || undefined,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to invite ${email}:`, error);
          failureCount++;
        }
      }
      
      if (successCount > 0) {
        alert(`Invited ${successCount} member(s)${failureCount > 0 ? `. Failed to invite ${failureCount} member(s).` : '.'}`);
      } else if (failureCount > 0) {
        alert(`Failed to invite ${failureCount} member(s). Please check the email addresses.`);
      }
      handleSkip();
    } catch (error) {
      console.error("Failed to invite members:", error);
      alert("Failed to invite members. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const deleteReview = async (id: number) => {
    try {
      await api.deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Failed to delete review. Please try again.");
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setStep(1);
    setForm({ title: "", type: "", domain: "", description: "" });
    setSelectedFiles([]);
    setInviteEmails("");
    setInviteRole("");
    setInviteMsg("");
    setCurrentReviewId(null);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!form.title || !form.type || !form.domain) {
        alert("Please fill in all required fields");
        return;
      }
      const newReview = await createReview(form);
      if (newReview) {
        setStep(2);
      }
    } else if (step === 2) {
      if (currentReviewId) {
        await uploadArticles(currentReviewId);
        setStep(3);
      }
    } else if (step === 3) {
      if (currentReviewId) {
        await inviteMembers(currentReviewId);
        resetModal();
      }
    }
  };

  const handleSkip = () => {
    if (step < 3) {
      setStep((step + 1) as ModalStep);
    } else {
      resetModal();
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "N/A";
    }
  };

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-gray-100 dark:border-gray-800">
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded shrink-0"></div>
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
      </td>
      <td className="px-6 py-3.5"><div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
      <td className="px-6 py-3.5"><div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-28"></div></td>
      <td className="px-6 py-3.5"><div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-10"></div></td>
      <td className="px-6 py-3.5"><div className="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
    </tr>
  );

  return (
    <ProtectedRoute>
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Reviews" />

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">

            {/* Page header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">My Reviews</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {loading ? "Loading…" : `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                style={{ background: "#1a5f7a" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Review
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d]">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Articles</th>
                    <th className="px-6 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(26,95,122,0.08)" }}>
                            <svg className="w-6 h-6" style={{ color: "#1a5f7a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">No reviews yet</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create your first review to get started</p>
                          </div>
                          <button
                            onClick={() => setShowModal(true)}
                            className="mt-1 text-xs font-medium transition-colors hover:opacity-80"
                            style={{ color: "#1a5f7a" }}
                          >
                            + Create Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => (
                      <tr key={review.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group">
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/reviews/${review.id}/overview`}
                            className="flex items-center gap-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors hover:opacity-80"
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(26,95,122,0.1)" }}>
                              <svg className="w-3.5 h-3.5" style={{ color: "#1a5f7a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            {review.title}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-500 dark:text-gray-400">{formatDate(review.created_at)}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1a5f7a" }}>
                              <span className="text-[9px] font-bold text-white">
                                {(review.user?.name || "?").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{review.user?.name || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {(review.articles ?? review.articles_count ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === review.id ? null : review.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>
                          {openMenuId === review.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-2 mt-1 w-36 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                                <Link
                                  href={`/reviews/${review.id}/overview`}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  Open
                                </Link>
                                <button
                                  onClick={() => { if (confirm("Delete this review? This cannot be undone.")) { deleteReview(review.id); setOpenMenuId(null); } }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#111] rounded-2xl w-full max-w-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a5f7a" }}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Create New Review</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Step {step} of 3</p>
                </div>
              </div>
              <button onClick={resetModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center gap-2">
                {[
                  { n: 1, label: "Review Info" },
                  { n: 2, label: "Upload Articles" },
                  { n: 3, label: "Invite Members" },
                ].map((s, i) => (
                  <div key={s.n} className="flex items-center gap-2 flex-1">
                    <div className={`flex items-center gap-1.5 ${i > 0 ? "flex-1" : ""}`}>
                      {i > 0 && (
                        <div className="flex-1 h-px" style={{ background: step > s.n - 1 ? "#2dd4a0" : "#e5e7eb" }} />
                      )}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={
                          step === s.n ? { background: "#1a5f7a", color: "#fff" } :
                          step > s.n ? { background: "rgba(45,212,160,0.18)", color: "#1a5f7a" } :
                          { background: "#f3f4f6", color: "#9ca3af" }
                        }
                      >
                        {step > s.n ? "✓" : s.n}
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium whitespace-nowrap ${step === s.n ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Review Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="e.g. Effects of Exercise on Mental Health"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Review Type <span className="text-red-500">*</span>
                    </label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={selectCls}>
                      <option value="">Choose type</option>
                      <option>Systematic Review</option>
                      <option>Meta-analysis</option>
                      <option>Scoping Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Domain <span className="text-red-500">*</span>
                    </label>
                    <select value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} className={selectCls}>
                      <option value="">Choose domain</option>
                      <option>Biomedical</option>
                      <option>Psychology</option>
                      <option>Public Health</option>
                      <option>Education</option>
                      <option>Engineering</option>
                      <option>Social Sciences</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Brief description of your review objectives…"
                    rows={3}
                    className={inputCls + " resize-none"}
                  />
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="px-6 py-4">
                <div className="flex gap-4">
                  <div className="w-40 shrink-0 bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">Supported Formats</p>
                    <ul className="space-y-1">
                      {["CSV", "RIS / Refman", "BibTeX", "PubMed XML", ".nbib", "Web of Science"].map(f => (
                        <li key={f} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#2dd4a0" }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="flex-1 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-[#2dd4a0]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(26,95,122,0.08)" }}>
                      <svg className="w-5 h-5" style={{ color: "#1a5f7a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Drop files here or click to browse"}
                    </p>
                    <p className="text-xs text-gray-400">Up to 10 files, max 10MB each</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".csv,.ris,.bib,.xml,.nbib"
                      onChange={e => { if (e.target.files) setSelectedFiles(Array.from(e.target.files).slice(0, 10)); }}
                      className="hidden"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 w-full space-y-1">
                        {selectedFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1">
                            <svg className="w-3 h-3 shrink-0" style={{ color: "#2dd4a0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="truncate">{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="px-6 py-4 space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Invite collaborators to work on this review together.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Addresses <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inviteEmails}
                    onChange={e => setInviteEmails(e.target.value)}
                    placeholder="email@example.com, another@example.com"
                    className={inputCls}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Separate multiple emails with commas</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className={selectCls}>
                    <option value="">Select role</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="observer">Observer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Message (optional)</label>
                  <textarea
                    value={inviteMsg}
                    onChange={e => setInviteMsg(e.target.value)}
                    placeholder="Add a personal message to the invitation…"
                    rows={2}
                    className={inputCls + " resize-none"}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d]">
              <button
                onClick={step === 1 ? resetModal : handleSkip}
                disabled={uploading || inviting}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {step === 1 ? "Cancel" : "Skip"}
              </button>
              <button
                onClick={handleNext}
                disabled={(step === 1 && (!form.title || !form.type || !form.domain)) || uploading || inviting}
                className="flex items-center gap-2 text-white text-xs px-5 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#1a5f7a" }}
              >
                {uploading || inviting ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </>
                ) : step === 1 ? "Create & Continue →" : step === 2 ? "Upload & Continue →" : "Send Invites"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
