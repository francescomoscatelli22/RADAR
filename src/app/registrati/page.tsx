// Segnaposto: qui arriverà la registrazione e la scelta degli argomenti (chip), quando collegheremo Supabase.
export default function Registrati() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-3 px-6">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink/60">Registrati</p>
      <h1 className="text-6xl font-extrabold tracking-tight">Benvenuto</h1>
      <p className="font-accent text-2xl italic">La registrazione arriva qui.</p>
      {/* <a> normale (non Link) di proposito: ricarica la pagina e rimostra la schermata iniziale */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="mt-6 font-mono text-xs uppercase tracking-[0.14em] underline">
        ← Indietro
      </a>
    </main>
  );
}
