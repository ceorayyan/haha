"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { useBranding } from "@/hooks/useBranding";
import { useTheme } from "../providers/ThemeProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { branding, loading: brandingLoading } = useBranding();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.login({ 
        email: email.toLowerCase().trim(), 
        password 
      });
      router.push("/reviews");
    } catch (err: any) {
      // Handle specific error messages
      if (err.message.includes('Too many')) {
        setError(err.message);
      } else if (err.message.includes('credentials')) {
        setError("Invalid email or password");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Only show loading if branding is not cached yet
  if (brandingLoading && !branding) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 transition-colors ${
        theme === "dark" 
          ? "bg-linear-to-br from-slate-900 via-slate-800 to-slate-900" 
          : "bg-linear-to-br from-slate-50 via-white to-slate-50"
      }`}>
        <div className="w-full max-w-md space-y-6 animate-pulse">
          {/* Logo skeleton */}
          <div className="flex justify-center">
            <div className={`h-16 w-32 rounded ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}></div>
          </div>
          {/* Title skeleton */}
          <div className={`h-8 rounded w-3/4 mx-auto ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}></div>
          {/* Card skeleton */}
          <div className={`border rounded-2xl p-8 ${
            theme === "dark"
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          }`}>
            <div className="space-y-4">
              <div className={`h-6 rounded w-1/2 ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}></div>
              <div className={`h-4 rounded w-3/4 ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}></div>
              <div className={`h-10 rounded ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}></div>
              <div className={`h-10 rounded ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}></div>
              <div className={`h-10 rounded ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors ${
      theme === "dark" 
        ? "bg-linear-to-br from-slate-900 via-slate-800 to-slate-900" 
        : "bg-linear-to-br from-slate-50 via-white to-slate-50"
    }`}>
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          {branding.logo_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={branding.logo_url} 
                alt={branding.website_name} 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <h1 className={`text-3xl font-bold tracking-tight ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}>
            {branding.website_name || "StataNex.Ai"}
          </h1>
          <p className={`mt-2 text-sm ${
            theme === "dark" ? "text-slate-400" : "text-slate-600"
          }`}>
            Systematic review and meta analysis
          </p>
        </div>

        {/* Card */}
        <div className={`border rounded-2xl p-8 shadow-lg transition-colors ${
          theme === "dark"
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        }`}>
          <h2 className={`text-xl font-semibold mb-1 ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}>
            Welcome back
          </h2>
          <p className={`text-sm mb-8 ${
            theme === "dark" ? "text-slate-400" : "text-slate-600"
          }`}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className={`px-4 py-3 rounded-lg text-sm border ${
                theme === "dark"
                  ? "bg-red-950/30 border-red-800 text-red-400"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-1.5 ${
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
                  theme === "dark"
                    ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:ring-teal-500/50 focus:border-teal-500"
                    : "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-teal-500/50 focus:border-teal-500"
                }`}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-1.5 ${
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition pr-10 ${
                    theme === "dark"
                      ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:ring-teal-500/50 focus:border-teal-500"
                      : "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-teal-500/50 focus:border-teal-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${
                    theme === "dark"
                      ? "text-slate-500 hover:text-slate-300"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-lg py-2.5 text-sm transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p className={`text-center text-sm mt-6 ${
          theme === "dark" ? "text-slate-400" : "text-slate-600"
        }`}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className={`font-medium hover:underline ${
            theme === "dark" ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"
          }`}>
            Contact admin to create account
          </Link>
        </p>
      </div>
    </div>
  );
}
