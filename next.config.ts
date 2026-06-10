import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 75, 100],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
