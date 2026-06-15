import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    qualities: [25, 50, 75, 100],
    dangerouslyAllowLocalIP: true,
    unoptimized: true,
  },
};

export default nextConfig;
