import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Production
  poweredByHeader: false,
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
