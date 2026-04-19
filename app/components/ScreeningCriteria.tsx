"use client";

import { useState } from "react";
import type { ScreeningCriteria as ScreeningCriteriaType } from "../context/DataContext";

interface ScreeningCriteriaProps {
  reviewId: number;
  criteria: ScreeningCriteriaType[];
  onAddCriteria: (type: 'inclusion' | 'exclusion', criteria: string, description?: string) => void;
  onDeleteCriteria: (id: number) => void;
}

export default function ScreeningCriteria({
  reviewId,
  criteria,
  onAddCriteria,
  onDeleteCriteria,
}: ScreeningCriteriaProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'inclusion' | 'exclusion'>('inclusion');
  const [newCriteria, setNewCriteria] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const inclusionCriteria = criteria.filter((c) => c.type === 'inclusion');
  const exclusionCriteria = criteria.filter((c) => c.type === 'exclusion');

  const handleAddCriteria = () => {
    if (newCriteria.trim()) {
      onAddCriteria(addType, newCriteria, newDescription || undefined);
      setNewCriteria("");
      setNewDescription("");
      setShowAddModal(false);
    }
  };

  const CriteriaColumn = ({
    title,
    type,
    items,
  }: {
    title: string;
    type: 'inclusion' | 'exclusion';
    items: ScreeningCriteriaType[];
  }) => (
    <div className="flex-1">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <span className="inline-block bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">
          {items.length} criteria
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-start justify-between hover:shadow-sm transition-shadow"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.criteria}</p>
              {item.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
              )}
            </div>
            <button
              onClick={() => onDeleteCriteria(item.id)}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              aria-label={`Delete ${item.criteria}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          setAddType(type);
          setShowAddModal(true);
        }}
        className="mt-3 w-full text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        + Add {type === 'inclusion' ? 'Inclusion' : 'Exclusion'} Criteria
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Screening Criteria</h2>
      </div>
      <div className="p-6 flex gap-6">
        <CriteriaColumn title="Inclusion Criteria" type="inclusion" items={inclusionCriteria} />
        <CriteriaColumn title="Exclusion Criteria" type="exclusion" items={exclusionCriteria} />
      </div>

      {/* Add Criteria Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Add {addType === 'inclusion' ? 'Inclusion' : 'Exclusion'} Criteria
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Criteria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  placeholder="Enter criteria text"
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCriteria}
                disabled={!newCriteria.trim()}
                className="text-sm bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
              >
                Add Criteria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
