// Segnaposto temporaneo: il feed "Per te" arriverà qui. Serve a dare qualcosa da scoprire
// quando la schermata di caricamento si apre.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-3 px-6">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink/60">Per te</p>
      <h1 className="text-6xl font-extrabold tracking-tight">Radar</h1>
      <p className="font-accent text-2xl italic">Il feed arriva qui.</p>
    </main>
  );
}
