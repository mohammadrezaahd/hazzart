import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server is also reached through the sandbox preview proxy, which uses its
  // own hostname. Allowing it keeps HMR and dev assets working behind that proxy.
  allowedDevOrigins: ['*.e2b.app', 'localhost'],
};

export default nextConfig;
