import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway sets PORT env var; Next.js uses it automatically
  // Standalone output for smaller Docker/Railway images (optional)
  // output: "standalone", // uncomment if you want standalone mode
  
  // Allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
