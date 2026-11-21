import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Permette all'iPhone (stessa rete Wi-Fi) di aprire il server di sviluppo del PC.
  allowedDevOrigins: ["192.168.1.10"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
