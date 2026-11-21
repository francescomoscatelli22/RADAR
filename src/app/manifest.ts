import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Radar",
    short_name: "Radar",
    description: "Il radar personale che capta le novità sull'intelligenza artificiale.",
    lang: "it",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    categories: ["news", "productivity"],
    background_color: "#141414",
    theme_color: "#141414",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // scorciatoie tenendo premuta l'icona (Android/desktop)
    shortcuts: [
      { name: "Seguiti", url: "/seguiti" },
      { name: "Salvati", url: "/salvati" },
    ],
  };
}
