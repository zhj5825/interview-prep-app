import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow production builds to succeed even if ESLint finds issues.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
