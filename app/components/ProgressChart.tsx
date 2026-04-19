"use client";

interface ProgressChartProps {
  percentage: number;
  screened: number;
  total: number;
  onStartScreening?: () => void;
}

export default function ProgressChart({
  percentage,
  screened,
  total,
  onStartScreening,
}: ProgressChartProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center">
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-black dark:text-white transition-all duration-500"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">Screened</span>
        </div>
      </div>

      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {screened} of {total} Articles
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {total - screened} articles to screen
        </p>
      </div>

      {percentage === 0 && onStartScreening && (
        <button
          onClick={onStartScreening}
          className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black text-sm font-medium py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Start Screening
        </button>
      )}
    </div>
  );
}
