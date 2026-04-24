"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useData } from "../context/DataContext";
import api from "../../lib/api";
import { getBrandingConfig, getLogoInitial, BrandingConfig } from "../../lib/branding";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  showTitle?: boolean;
}

export default function Header({ onMenuClick, title, showTitle = true }: HeaderProps) {
  const { user, blindMode, toggleBlindMode } = useData();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const userInitial = currentUser?.name?.charAt(0).toUpperCase() || "U";

  // Load user data on client side only to avoid hydration mismatch
  useEffect(() => {
    setCurrentUser(api.getStoredUser());
  }, []);

  // Load branding config on mount and listen for changes
  useEffect(() => {
    const loadBranding = async () => {
      const config = await getBrandingConfig();
      setBranding(config);
    };

    loadBranding();

    // Listen for branding config changes
    window.addEventListener("brandingConfigChanged", loadBranding);
    return () => window.removeEventListener("brandingConfigChanged", loadBranding);
  }, []);

  const displayTitle = title || branding?.websiteName || "StataNexus.Ai";
  const logoInitial = branding ? getLogoInitial(branding.websiteName) : "S";

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    }
  };

  return (
    <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 h-12 flex items-center px-4 gap-3 shrink-0">
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
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt="Logo"
            className="w-7 h-7 object-contain rounded"
          />
        ) : (
          <div className="w-7 h-7 bg-black dark:bg-white rounded flex items-center justify-center shrink-0">
            <span className="text-white dark:text-black font-bold text-sm">{logoInitial}</span>
          </div>
        )}
        {showTitle && (
          <span className="font-semibold text-base text-gray-900 dark:text-white">{displayTitle}</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Blind Mode Toggle */}
      <button
        onClick={toggleBlindMode}
        className={`p-1.5 rounded transition-colors ${
          blindMode.enabled
            ? "bg-black dark:bg-white text-white dark:text-black"
            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        }`}
        aria-label={blindMode.enabled ? "Disable blind mode" : "Enable blind mode"}
        title={blindMode.enabled ? "Blind mode: ON" : "Blind mode: OFF"}
      >
        {blindMode.enabled ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        )}
      </button>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* User Profile Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center hover:opacity-80 transition-opacity"
          title={currentUser?.name || "User"}
        >
          <span className="text-white dark:text-black text-sm font-medium">{userInitial}</span>
        </button>

        {showProfileMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowProfileMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
              {/* Profile Info */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentUser?.name || "User"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {currentUser?.email || ""}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Profile page can be added later
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Settings page can be added later
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  ⚙️ Settings
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
