"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useData } from "../context/DataContext";
import { useTheme } from "../providers/ThemeProvider";
import api from "../../lib/api";
import { getBrandingConfig, getLogoInitial, BrandingConfig } from "../../lib/branding";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  showTitle?: boolean;
}

type StoredUser = {
  id?: number;
  name?: string;
  email?: string;
};

export default function Header({ onMenuClick, title, showTitle = true }: HeaderProps) {
  const { theme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [brandingLoaded, setBrandingLoaded] = useState(false);
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
      setBrandingLoaded(true);
    };

    loadBranding();

    // Listen for branding config changes
    window.addEventListener("brandingConfigChanged", loadBranding);
    return () => window.removeEventListener("brandingConfigChanged", loadBranding);
  }, []);

  const displayTitle = title || branding?.websiteName || "StataNex.Ai";
  const logoInitial = branding ? getLogoInitial(branding.websiteName) : "S";
  const logoUrl = branding?.logoUrl;

  const handleLogout = async () => {
    setLoggingOut(true);
    setShowProfileMenu(false);
    try {
      await api.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-gray-800 h-12 flex items-center px-4 gap-3 shrink-0">
      {/* Menu Button */}
      <button
        onClick={onMenuClick}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded" />
        ) : (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#1a5f7a" }}>
            <span className="text-white font-bold text-sm">{logoInitial}</span>
          </div>
        )}
        {showTitle && (
          <span className="font-semibold text-sm text-gray-900 dark:text-white">{displayTitle}</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* User Profile Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: "#1a5f7a" }}
          title={currentUser?.name || "User"}
        >
          {loggingOut ? (
            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <span className="text-white text-sm font-semibold">{userInitial}</span>
          )}
        </button>

        {/* Logging out overlay */}
        {loggingOut && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(26,95,122,0.1)" }}>
                <svg className="animate-spin w-6 h-6" style={{ color: "#1a5f7a" }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Logging out {currentUser?.name || "User"}…</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Please wait</p>
              </div>
            </div>
          </div>
        )}

        {showProfileMenu && !loggingOut && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl z-20 overflow-hidden">
              {/* Profile header */}
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800" style={{ background: "rgba(26,95,122,0.04)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm" style={{ background: "#1a5f7a" }}>
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser?.name || "User"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email || ""}</p>
                  </div>
                </div>
                {/* Online indicator */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1.5">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span>Settings</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 dark:border-gray-800 p-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-3 rounded-xl"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
