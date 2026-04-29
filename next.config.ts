import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false, // Disable React Compiler to prevent potential issues
  reactStrictMode: false, // Disable Strict Mode to prevent double-mounting in development
};

export default nextConfig;
