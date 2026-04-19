"use client";

import type { TeamMemberProgress } from "../context/DataContext";

interface TeamProgressProps {
  teamProgress: TeamMemberProgress[];
  blindMode?: boolean;
}

export default function TeamProgress({ teamProgress, blindMode = false }: TeamProgressProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team Progress</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {teamProgress.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">No team members yet</p>
          </div>
        ) : (
          teamProgress.map((member) => (
            <div key={member.memberId} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {!blindMode && (
                    <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                      <span className="text-white dark:text-black text-xs font-medium">
                        {member.memberName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {blindMode ? `Reviewer ${member.memberId}` : member.memberName}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <p className="text-gray-600 dark:text-gray-400">Screened</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{member.screened}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <p className="text-gray-600 dark:text-gray-400">Conflicts</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{member.conflicts}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <p className="text-gray-600 dark:text-gray-400">Confirmations</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{member.confirmations}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
