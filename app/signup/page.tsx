"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBranding } from "@/hooks/useBranding";

export default function SignupPage() {
  const router = useRouter();
  const { branding, loading: brandingLoading } = useBranding();

  useEffect(() => {
    router.push("/login");
  }, [router]);

  // Only show loading if branding is not cached yet
  if (brandingLoading && !branding) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          {branding.logo_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={branding.logo_url} 
                alt={branding.website_name} 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {branding.website_name}
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Redirecting to login...
          </p>
        </div>
      </div>
    </div>
  );
}
