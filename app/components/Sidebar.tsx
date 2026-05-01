"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "../../lib/api";
import { useState, useEffect } from "react";
import { getBrandingConfig, getLogoInitial, BrandingConfig } from "../../lib/branding";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const currentUser = api.getStoredUser();

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

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      setLoggingOut(true);
      try {
        await api.logout();
        router.push("/login");
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        setLoggingOut(false);
      }
    }
  };

  const menuItems = [
    {
      id: "reviews",
      label: "Active Reviews",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: "/reviews",
    },
    {
      id: "archived",
      label: "Archived Reviews",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      href: "/archived",
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: "/settings",
    },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-white dark:bg-[#111] border-r border-gray-100 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded-lg" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#1a5f7a" }}>
                  <span className="text-white font-bold text-xs">
                    {branding ? getLogoInitial(branding.websiteName) : "S"}
                  </span>
                </div>
              )}
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {branding?.websiteName || "StataNexus.Ai"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-0.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={isActive ? {
                    background: "#1a5f7a",
                    color: "#fff",
                  } : {
                    color: "var(--text-secondary, #475569)",
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{loggingOut ? "Logging out..." : "Logout"}</span>
            </button>
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
              {branding?.websiteName || "StataNexus.Ai"} v1.0.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
