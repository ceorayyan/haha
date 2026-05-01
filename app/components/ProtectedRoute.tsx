"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  if (!api.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-4">
          {/* Skeleton header */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
