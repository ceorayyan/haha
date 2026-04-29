"use client";

import { useState } from "react";

interface ActionButtonsProps {
  onInclude: () => void;
  onExclude: () => void;
  onConfused: () => void;
  disabled: boolean;
}

export default function ActionButtons({ onInclude, onExclude, onConfused, disabled }: ActionButtonsProps) {
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const handleAction = async (action: string, callback: () => void) => {
    if (disabled || processingAction) return;
    
    setProcessingAction(action);
    try {
      await callback();
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
      
      {/* Include Button */}
      <button
        onClick={() => handleAction('include', onInclude)}
        disabled={disabled || processingAction !== null}
        className="group relative flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[120px] sm:min-h-[140px]"
        style={{
          borderColor: processingAction === 'include' ? 'var(--accent)' : 'var(--border-subtle)',
          background: processingAction === 'include' ? 'var(--accent-soft)' : 'white',
          boxShadow: processingAction === 'include' ? '0 0 20px var(--accent-glow)' : 'none'
        }}
        aria-label="Mark article as included"
        role="button"
        tabIndex={0}
      >
        <div 
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
          style={{
            background: processingAction === 'include' 
              ? 'var(--accent)' 
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
          }}
        >
          {processingAction === 'include' ? (
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="text-center">
          <div className="text-base sm:text-lg font-bold text-green-700 dark:text-green-400 mb-1">Include</div>
          <div className="text-xs text-green-600 dark:text-green-500 font-medium">
            {processingAction === 'include' ? 'Processing...' : 'Accept this article'}
          </div>
        </div>
        
        {/* Keyboard shortcut hint */}
        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-green-700 dark:text-green-400">I</span>
        </div>
      </button>

      {/* Confused Button */}
      <button
        onClick={() => handleAction('confused', onConfused)}
        disabled={disabled || processingAction !== null}
        className="group relative flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[120px] sm:min-h-[140px]"
        style={{
          borderColor: processingAction === 'confused' ? 'var(--accent)' : 'var(--border-subtle)',
          background: processingAction === 'confused' ? 'var(--accent-soft)' : 'white',
          boxShadow: processingAction === 'confused' ? '0 0 20px var(--accent-glow)' : 'none'
        }}
        aria-label="Mark article as confused or needing more review"
        role="button"
        tabIndex={0}
      >
        <div 
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
          style={{
            background: processingAction === 'confused' 
              ? 'var(--accent)' 
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
          }}
        >
          {processingAction === 'confused' ? (
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="text-center">
          <div className="text-base sm:text-lg font-bold text-orange-700 dark:text-orange-400 mb-1">Confused</div>
          <div className="text-xs text-orange-600 dark:text-orange-500 font-medium">
            {processingAction === 'confused' ? 'Processing...' : 'Need more review'}
          </div>
        </div>
        
        {/* Keyboard shortcut hint */}
        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-orange-700 dark:text-orange-400">?</span>
        </div>
      </button>

      {/* Exclude Button */}
      <button
        onClick={() => handleAction('exclude', onExclude)}
        disabled={disabled || processingAction !== null}
        className="group relative flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[120px] sm:min-h-[140px]"
        style={{
          borderColor: processingAction === 'exclude' ? 'var(--accent)' : 'var(--border-subtle)',
          background: processingAction === 'exclude' ? 'var(--accent-soft)' : 'white',
          boxShadow: processingAction === 'exclude' ? '0 0 20px var(--accent-glow)' : 'none'
        }}
        aria-label="Mark article as excluded"
        role="button"
        tabIndex={0}
      >
        <div 
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
          style={{
            background: processingAction === 'exclude' 
              ? 'var(--accent)' 
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
          }}
        >
          {processingAction === 'exclude' ? (
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div className="text-center">
          <div className="text-base sm:text-lg font-bold text-red-700 dark:text-red-400 mb-1">Exclude</div>
          <div className="text-xs text-red-600 dark:text-red-500 font-medium">
            {processingAction === 'exclude' ? 'Processing...' : 'Reject this article'}
          </div>
        </div>
        
        {/* Keyboard shortcut hint */}
        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-red-700 dark:text-red-400">X</span>
        </div>
      </button>
    </div>
  );
}