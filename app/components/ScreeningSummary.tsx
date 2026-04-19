"use client";

import ProgressChart from "./ProgressChart";
import TeamProgress from "./TeamProgress";
import QuickGuide from "./QuickGuide";
import type { ScreeningSummary as ScreeningSummaryType } from "../context/DataContext";

interface ScreeningSummaryProps {
  summary: ScreeningSummaryType;
  blindMode?: boolean;
  onStartScreening?: () => void;
}

export default function ScreeningSummary({
  summary,
  blindMode = false,
  onStartScreening,
}: ScreeningSummaryProps) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Screening Summary</h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Your Progress</h3>
          <ProgressChart
            percentage={summary.progressPercentage}
            screened={summary.screened}
            total={summary.totalArticles}
            onStartScreening={onStartScreening}
          />
        </div>

        {/* Team Progress */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Team Progress</h3>
          <TeamProgress teamProgress={summary.teamProgress} blindMode={blindMode} />
        </div>

        {/* Quick Guide */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Guide</h3>
          <QuickGuide currentStep={1} totalSteps={6} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Articles</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalArticles}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Screened</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.screened}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Unscreened</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.unscreened}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Conflicts</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.conflicts}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
