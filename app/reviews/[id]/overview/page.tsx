"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useData } from "../../../context/DataContext";

export default function OverviewPage() {
  const params = useParams();
  const reviewId = Number(params.id);
  const { getReviewById, updateReview, addMemberToReview } = useData();
  const review = getReviewById(reviewId);

  const [editModal, setEditModal] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);
  const [editData, setEditData] = useState({ title: "", type: "", domain: "", description: "" });
  const [invite, setInvite] = useState({ name: "", email: "", role: "Reviewer" });

  if (!review) return <div className="p-4 text-xs text-gray-500">Review not found.</div>;

  const openEdit = () => {
    setEditData({ title: review.title, type: review.type, domain: review.domain, description: review.description });
    setEditModal(true);
  };

  const saveEdit = () => {
    updateReview(reviewId, editData);
    setEditModal(false);
  };

  const sendInvite = () => {
    if (!invite.name || !invite.email) return;
    addMemberToReview(reviewId, { ...invite, status: "Pending", avatar: invite.name[0].toUpperCase() });
    setInvite({ name: "", email: "", role: "Reviewer" });
    setInviteModal(false);
  };

  const inputCls = "w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors";

  // Calculate screening progress
  const { getArticlesByReviewId } = useData();
  const allArticles = getArticlesByReviewId(reviewId);
  const screenedCount = allArticles.filter(a => a.status === "included" || a.status === "excluded").length;
  const totalCount = allArticles.length;
  const progressPercentage = totalCount > 0 ? Math.round((screenedCount / totalCount) * 100) : 0;

  // Debug function to reset data
  const resetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Overview</h1>
        <div className="flex items-center gap-3">
          <button onClick={resetData} className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            Reset Data
          </button>
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
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Type:</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.type}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Domain:</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.domain}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Description:</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.description}</p>
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
            Hooray! 🎉 you have successfully imported data to Rayyan! now it&apos;s time to detect duplicates.
          </p>
          <div className="grid grid-cols-4 gap-4">
            {/* Imported References */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center bg-white dark:bg-black">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Imported References</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{review.stats.importedReferences}</p>
              <button className="mt-3 w-full text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-2 rounded-lg transition-colors">Add References</button>
            </div>
            {/* Total Duplicates */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center bg-white dark:bg-black">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Duplicates</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{review.stats.totalDuplicates}</p>
              <button className="mt-3 w-full text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-2 rounded-lg transition-colors">Detect Duplicates</button>
            </div>
            {/* Unresolved */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center bg-white dark:bg-black">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Unresolved</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{review.stats.unresolved}</p>
              <button className="mt-3 w-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 py-2 rounded-lg cursor-not-allowed" disabled>Start Resolving</button>
            </div>
            {/* Stats */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3 bg-white dark:bg-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Resolved</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{review.stats.resolved}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Not Duplicate</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{review.stats.notDuplicate}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deleted</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{review.stats.deleted}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Members */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Members</h2>
          <button onClick={() => setInviteModal(true)} className="text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            + Invite Member
          </button>
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
            {review.members.map(m => (
              <tr key={m.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                      <span className="text-white dark:text-black text-sm font-medium">{m.avatar}</span>
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">{m.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{m.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{m.role}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.status === "Active" ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"}`}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-200 dark:text-gray-800"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercentage / 100)}`}
                  strokeLinecap="round"
                  className="text-green-500 transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{progressPercentage}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Screened</span>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Articles</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{screenedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Screened</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount - screenedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Remaining</p>
              </div>
            </div>
          </div>

          {progressPercentage < 100 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <a
                href={`/reviews/${reviewId}/screening`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Continue Screening
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Edit Info Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-800">Edit Review Info</span>
              <button onClick={() => setEditModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Review Title</label>
                <input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                  <select value={editData.type} onChange={e => setEditData({...editData, type: e.target.value})} className={inputCls}>
                    <option>Systematic Review</option><option>Meta-analysis</option><option>Scoping Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Domain</label>
                  <select value={editData.domain} onChange={e => setEditData({...editData, domain: e.target.value})} className={inputCls}>
                    <option>Biomedical</option><option>Psychology</option><option>Public Health</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} rows={3} className={inputCls + " resize-none"} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
              <button onClick={() => setEditModal(false)} className="text-xs text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded">Cancel</button>
              <button onClick={saveEdit} className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-800">Invite Member</span>
              <button onClick={() => setInviteModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input value={invite.name} onChange={e => setInvite({...invite, name: e.target.value})} placeholder="Member name" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={invite.email} onChange={e => setInvite({...invite, email: e.target.value})} placeholder="member@email.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                <select value={invite.role} onChange={e => setInvite({...invite, role: e.target.value})} className={inputCls}>
                  <option>Reviewer</option><option>Collaborator</option><option>Observer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
              <button onClick={() => setInviteModal(false)} className="text-xs text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded">Cancel</button>
              <button onClick={sendInvite} disabled={!invite.name || !invite.email} className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed">Send Invitation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
