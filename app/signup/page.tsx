"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Rayyan
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Redirecting to login...
          </p>
        </div>
      </div>
    </div>
  );
}
