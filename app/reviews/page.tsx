"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ProtectedRoute from "../components/ProtectedRoute";
import api from "../../lib/api";

type ModalStep = 1 | 2 | 3;

const inputCls = "w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500";
const selectCls = "w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500";

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
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </td>
      <td className="px-6 py-4">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </td>
    </tr>
  );

  return (
    <ProtectedRoute>
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} title="Active Reviews" />

        {/* Main */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Reviews</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Showing {reviews.length} active reviews</p>
              </div>
              <button onClick={() => setShowModal(true)} className="bg-black dark:bg-white text-white dark:text-black text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                + Create Review
              </button>
            </div>

            <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date Created</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Articles</th>
                    <th className="px-6 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loading ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/reviews/${review.id}/overview`} className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-black dark:hover:text-white text-sm font-medium transition-colors">
                          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          {review.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(review.created_at)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{review.user?.name || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{review.articles_count || 0}</td>
                      <td className="px-6 py-4 relative">
                        <button onClick={() => setOpenMenuId(openMenuId === review.id ? null : review.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                        </button>
                        {openMenuId === review.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                              <button onClick={() => { if (confirm("Delete this review?")) { deleteReview(review.id); setOpenMenuId(null); } }} className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">Delete Review</button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-black rounded-lg w-full max-w-2xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">Create New Review</span>
              </div>
              <button onClick={resetModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <StepIndicator step={step} />

            {/* Step 1 */}
            {step === 1 && (
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Review Title <span className="text-red-500">*</span></label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Review title has to be unique" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Review Type <span className="text-red-500">*</span></label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={selectCls}>
                      <option value="">Choose type</option>
                      <option>Systematic Review</option>
                      <option>Meta-analysis</option>
                      <option>Scoping Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Review Domain <span className="text-red-500">*</span></label>
                    <select value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} className={selectCls}>
                      <option value="">Choose domain</option>
                      <option>Biomedical</option>
                      <option>Psychology</option>
                      <option>Public Health</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your review" rows={3} className={inputCls + " resize-none"} />
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="p-5 flex gap-4">
                <div className="w-44 shrink-0">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Supported Formats</p>
                  <p className="text-xs text-gray-500 mb-2">Visit <span className="text-orange-500 cursor-pointer">Help Center</span> to learn more</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {["EndNote Export", "Refman/RIS", "CSV", "BibTeX", "PubMed XML", "New PubMed Format/.nbib", "Web of Science/CIW"].map(f => (
                      <li key={f} className="flex items-center gap-1"><span className="w-1 h-1 bg-gray-400 rounded-full shrink-0" />{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Select Files</p>
                  <p className="text-xs text-gray-400 mb-3">Select up to 10 files...</p>
                  <svg className="w-10 h-10 text-gray-500 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-xs text-gray-600 mb-1">Select files to import</p>
                  <p className="text-xs text-gray-400 mb-3">Import and manage your data set!</p>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-black dark:bg-white text-white dark:text-black text-xs px-4 py-1.5 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200">Select Files</button>
                  <input ref={fileInputRef} type="file" multiple accept=".csv,.ris,.bib,.xml,.nbib" onChange={e => { if (e.target.files) setSelectedFiles(Array.from(e.target.files).slice(0, 10)); }} className="hidden" />
                  {selectedFiles.length > 0 && <p className="text-xs text-gray-500 mt-2">{selectedFiles.length} file(s) selected</p>}
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="p-5 space-y-3">
                <p className="text-sm font-bold text-gray-800">Accelerate your work and Invite members to your review!</p>
                <p className="text-xs text-gray-500">The <span className="text-red-500">*</span> symbol represents required fields.</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">User Email <span className="text-red-500">*</span></label>
                  <input type="text" value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} placeholder="Use comma, to add multiple emails" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">User Role <span className="text-red-500">*</span></label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className={selectCls}>
                    <option value="">Select member role</option>
                    <option>Reviewer</option>
                    <option>Collaborator</option>
                    <option>Observer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reason/Message</label>
                  <textarea value={inviteMsg} onChange={e => setInviteMsg(e.target.value)} placeholder="Add a reason/message for the user invitation email" rows={3} className={inputCls + " resize-none"} />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
              {step === 1 ? (
                <button onClick={resetModal} className="text-xs text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded">Cancel</button>
              ) : (
                <button onClick={handleSkip} disabled={uploading || inviting} className="text-xs text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded disabled:opacity-50">Skip</button>
              )}
              <button
                onClick={handleNext}
                disabled={(step === 1 && (!form.title || !form.type || !form.domain)) || uploading || inviting}
                className="bg-black dark:bg-white text-white dark:text-black text-xs px-4 py-1.5 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading || inviting ? "Processing..." : step === 1 ? "Create & Continue" : step === 2 ? "Upload & Continue" : "Send Invites"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
