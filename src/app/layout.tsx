import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Martian_Mono,
  Instrument_Serif,
  Permanent_Marker,
  Newsreader,
  Unbounded,
} from "next/font/google";
import AppBoot from "@/components/AppBoot";
import RegisterSW from "@/components/RegisterSW";
import SyncAgent from "@/components/SyncAgent";
import "./globals.css";

// Titoli e interfaccia ("opsz" = a corpo grande le lettere diventano più compatte, come in Figma)
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

// Titolo "RADAR": largo e geometrico
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

// Adesivi scritti a pennarello
const permanent = Permanent_Marker({
  variable: "--font-permanent",
  subsets: ["latin"],
  weight: "400",
  // compare solo negli adesivi dell'intro: non serve scaricarlo prima di tutto il resto
  preload: false,
});

// Testi di lettura
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

// Etichette tecniche
const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
});

// Frasi di accento (solo corsivo)
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

export const metadata: Metadata = {
  title: "Radar",
  description: "Il radar personale che capta le novità sull'intelligenza artificiale.",
  // su iPhone, aggiunta alla Home: si apre a schermo intero con la barra di stato trasparente
  appleWebApp: { capable: true, title: "Radar", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

// viewportFit "cover" serve a far funzionare i margini di sicurezza dell'iPhone (notch, barra in basso)
export const viewport: Viewport = {
  themeColor: "#141414",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${bricolage.variable} ${martian.variable} ${instrument.variable} ${permanent.variable} ${newsreader.variable} ${unbounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SyncAgent />
        <RegisterSW />
        <AppBoot>{children}</AppBoot>
      </body>
    </html>
  );
}
