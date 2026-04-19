"use client";

import { useState } from "react";

interface QuickGuideProps {
  currentStep?: number;
  totalSteps?: number;
  steps?: string[];
}

export default function QuickGuide({
  currentStep = 1,
  totalSteps = 6,
  steps = [
    "Import your references",
    "Detect and resolve duplicates",
    "Define screening criteria",
    "Screen articles for inclusion",
    "Resolve conflicts between reviewers",
    "Export final results",
  ],
}: QuickGuideProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div
        className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Guide</h3>
        <button
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-3">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCurrentStep = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrentStep
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isCurrentStep
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {step}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    {stepNumber}/{totalSteps}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
