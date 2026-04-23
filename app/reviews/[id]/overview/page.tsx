"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "../../../../lib/api";

export default function OverviewPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);

  const [editModal, setEditModal] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);
  const [editData, setEditData] = useState({ title: "", type: "", domain: "", description: "" });
  const [invite, setInvite] = useState({ email: "", role: "reviewer", message: "" });

  // Fetch review data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const reviewData = await api.getReview(reviewId);
        setReview(reviewData);
        
        // Fetch members
        const membersData = await api.getTeamMembers(reviewId);
        const membersArray = Array.isArray(membersData) ? membersData : [];
        setMembers(membersArray);
      } catch (error) {
        console.error("Failed to fetch review:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reviewId]);

  // Skeleton loader components
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
      <div className="p-6 space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );

  const SkeletonStat = () => (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center bg-white dark:bg-black animate-pulse">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mb-2"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
    </div>
  );

  const SkeletonMemberRow = () => (
    <tr className="border-b border-gray-200 dark:border-gray-800 animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Action Buttons Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          <div className="flex items-center gap-3">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <SkeletonCard />
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm animate-pulse">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6"></div>
            <div className="grid grid-cols-3 gap-4">
              <SkeletonStat />
              <SkeletonStat />
              <SkeletonStat />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonMemberRow />
              <SkeletonMemberRow />
              <SkeletonMemberRow />
            </tbody>
          </table>
        </div>

        <SkeletonCard />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Review not found.</p>
          <a href="/reviews" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            ← Back to Reviews
          </a>
        </div>
      </div>
    );
  }

  const openEdit = () => {
    setEditData({ 
      title: review.title, 
      type: review.type || "", 
      domain: review.domain || "", 
      description: review.description || "" 
    });
    setEditModal(true);
  };

  const saveEdit = async () => {
    try {
      await api.updateReview(reviewId, editData);
      setReview({ ...review, ...editData });
      setEditModal(false);
    } catch (error) {
      console.error("Failed to update review:", error);
      alert("Failed to update review. Please try again.");
    }
  };

  const sendInvite = async () => {
    if (!invite.email) return;
    try {
      await api.addTeamMember(reviewId, invite);
      // Refresh members
      const membersData = await api.getTeamMembers(reviewId);
      const membersArray = Array.isArray(membersData) ? membersData : [];
      setMembers(membersArray);
      setInvite({ email: "", role: "reviewer", message: "" });
      setInviteModal(false);
      alert("Invitation sent successfully!");
    } catch (error) {
      console.error("Failed to send invitation:", error);
      alert("Failed to send invitation. Please try again.");
    }
  };

  const inputCls = "w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors";

  // Get article count from review data (which includes articles_count from backend)
  const totalArticles = review?.articles_count || review?.articles?.length || 0;
  const screenedCount = 0; // TODO: Implement screening status
  const progressPercentage = totalArticles > 0 ? Math.round((screenedCount / totalArticles) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Overview</h1>
        <div className="flex items-center gap-3">
          <button onClick={openEdit} className="bg-black dark:bg-white text-white dark:text-black text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
            Edit Info
          </button>
          <button onClick={() => setInviteModal(true)} className="border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            + Invite Member
          </button>
        </div>
      </div>

      {/* Review Info */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Information</h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Title:</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.title}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Owner:</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.user?.name || "N/A"}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Status:</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.status || "active"}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Description:</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.description || "No description"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Summary</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {totalArticles > 0 
              ? `You have successfully imported ${totalArticles} articles! 🎉` 
              : "No articles imported yet. Upload articles to get started."}
          </p>
          <div className="grid grid-cols-3 gap-4">
            {/* Total Articles */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center bg-white dark:bg-black">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Articles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalArticles}</p>
            </div>
            {/* Team Members */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center bg-white dark:bg-black">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Team Members</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{members.length}</p>
            </div>
            {/* Screened */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center bg-white dark:bg-black">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Screened</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{screenedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Members */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Members ({members.length})</h2>
          <button onClick={() => setInviteModal(true)} className="text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            + Invite Member
          </button>
        </div>
        {members.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, idx) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                        <span className="text-white dark:text-black text-sm font-medium">
                          {m.user?.name?.charAt(0).toUpperCase() || m.email?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{m.user?.name || m.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{m.user?.email || m.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{m.role}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      m.status === "accepted" 
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" 
                        : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                    }`}>
                      {m.status || "pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No members yet. Invite team members to collaborate!
          </div>
        )}
      </div>

      {/* Screening Progress */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Progress</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-8">
            {/* Circular Progress */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-800" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 54}`} strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercentage / 100)}`} strokeLinecap="round" className="text-green-500 transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{progressPercentage}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Screened</span>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalArticles}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Articles</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{screenedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Screened</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalArticles - screenedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Info Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Edit Review Info</span>
              <button onClick={() => setEditModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Review Title</label>
                <input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} rows={3} className={inputCls + " resize-none"} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => setEditModal(false)} className="text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded">Cancel</button>
              <button onClick={saveEdit} className="text-xs bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-200">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Invite Member</span>
              <button onClick={() => setInviteModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={invite.email} onChange={e => setInvite({...invite, email: e.target.value})} placeholder="member@email.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select value={invite.role} onChange={e => setInvite({...invite, role: e.target.value})} className={inputCls}>
                  <option value="reviewer">Reviewer</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="observer">Observer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Message (Optional)</label>
                <textarea value={invite.message} onChange={e => setInvite({...invite, message: e.target.value})} placeholder="Add a personal message..." rows={2} className={inputCls + " resize-none"} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => setInviteModal(false)} className="text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded">Cancel</button>
              <button onClick={sendInvite} disabled={!invite.email} className="text-xs bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed">Send Invitation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
