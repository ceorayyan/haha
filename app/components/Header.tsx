"use client";

import ThemeToggle from "./ThemeToggle";
import { useData } from "../context/DataContext";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  showTitle?: boolean;
}

export default function Header({ onMenuClick, title = "Rayyan", showTitle = true }: HeaderProps) {
  const { user } = useData();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-12 flex items-center px-4 gap-3 shrink-0">
      {/* Menu Button */}
      <button
        onClick={onMenuClick}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-black dark:bg-white rounded flex items-center justify-center shrink-0">
          <span className="text-white dark:text-black font-bold text-sm">R</span>
        </div>
        {showTitle && (
          <span className="font-semibold text-base text-gray-900 dark:text-white">{title}</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
        <span className="text-white dark:text-black text-sm font-medium">{user.avatar}</span>
      </div>
    </header>
  );
}
