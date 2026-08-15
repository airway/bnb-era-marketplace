import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (staticExport ? "/bnb-era-marketplace" : "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: staticExport ? "export" : undefined,
  basePath: basePath || undefined,
  trailingSlash: staticExport,
  images: {
    unoptimized: staticExport,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
