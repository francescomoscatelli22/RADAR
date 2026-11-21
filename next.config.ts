import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // L'indirizzo di Supabase è lo stesso per server e browser: basta SUPABASE_URL, senza doppioni.
  env: { NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "" },
  /* config options here */
  // Permette all'iPhone (stessa rete Wi-Fi) di aprire il server di sviluppo del PC.
  allowedDevOrigins: ["192.168.1.10"],
  // il service worker non deve mai restare in cache: così gli aggiornamenti arrivano subito
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
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
