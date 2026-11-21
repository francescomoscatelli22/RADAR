// Esporta la pubblicità (/ad) in MP4 1920×1080, 30 fps.
// Come funziona: apre la pagina in Chrome, imposta l'orologio della pubblicità su ogni
// fotogramma (window.__ad.setTime), fa uno screenshot e lo passa a ffmpeg.
// Uso: npm run dev (in un'altra finestra), poi: node scripts/export-ad.mjs [url] [file.mp4]

import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "brandkit/radar-ad-16x9.mp4";
const FPS = 30;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}/ad?render=1`, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__ad !== undefined);
await page.evaluate(() => document.fonts.ready);
// nasconde il pallino "N" di Next.js (esiste solo in modalità sviluppo)
await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

const duration = await page.evaluate(() => window.__ad.duration);
const frames = Math.round(duration * FPS);

const ffmpeg = spawn(
  "ffmpeg",
  ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
   "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow",
   "-movflags", "+faststart", OUT],
  { stdio: ["pipe", "inherit", "inherit"] },
);

for (let i = 0; i < frames; i++) {
  await page.evaluate(
    (t) =>
      new Promise((resolve) => {
        window.__ad.setTime(t);
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
    i / FPS,
  );
  const png = await page.screenshot({ type: "png" });
  if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
  if (i % 60 === 0) console.log(`fotogramma ${i}/${frames}`);
}

ffmpeg.stdin.end();
await new Promise((r) => ffmpeg.on("close", r));
await browser.close();
console.log(`Fatto: ${OUT}`);
