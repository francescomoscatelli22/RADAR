# Radar

App personale (PWA): un "radar" per sbirciare il web. Feed continuo di segnali da piattaforme diverse (video YouTube, post LinkedIn, articoli/RSS, thread Reddit/HN, podcast, release GitHub), con notifiche. Utente unico: Francesco.
**Cambio di rotta (20/11/2026)**: la parte "corsi LUMSA" è stata tolta (inutile). Restano solo i settori di interesse come etichette; i filtri principali sono per formato/piattaforma. Attenzione tecnica: LinkedIn non ha feed pubblici né API gratuite per leggere i post (ToS vieta lo scraping): nel design c'è la card "Post LinkedIn", ma in pratica serviranno link salvati a mano o fonti alternative. Da verificare prima di promettere la funzione.
Leggi anche `AGENTS.md` (regole generate da Next.js: la versione di Next è recente, consulta `node_modules/next/dist/docs/` prima di scrivere codice).

## Come lavorare con Francesco
- Designer, alle prime armi con lo sviluppo: guidalo passo passo come un tutor, in italiano, spiegazioni schematiche con un esempio concreto.
- Prima di scrivere codice nuovo importante: proponi, spiega il perché (alternative scartate incluse), aspetta l'ok.
- Al massimo una domanda alla volta, solo se serve davvero.
- Se una richiesta è una cattiva idea o costa, dillo apertamente e proponi un'alternativa.
- Verifica limiti, piani gratuiti e API dei servizi sulla documentazione aggiornata (ricerca web), non a memoria.
- Commit piccoli con messaggio chiaro; spiega a Francesco cosa viene salvato. Aggiorna questo file alla fine di ogni fase.
- Budget zero: segnala prima qualunque costo.

## Decisioni prese
| Tema | Scelta |
|---|---|
| App | PWA installabile (iPhone 17, iOS 26 + computer). Niente app nativa per ora (servirebbe un Mac + Apple Developer Program a pagamento). |
| Framework | Next.js (App Router) + TypeScript, npm |
| Stile | Tailwind CSS v4, token di design in un solo file (`src/design/tokens.css`) |
| Hosting | Vercel Hobby (gratis, HTTPS). Termini "non commerciale": da rileggere se diventa prodotto. |
| Database | Supabase Postgres (free: 500 MB, 2 progetti, pausa dopo 1 settimana di poca attività) |
| Raccolta | GitHub Actions ogni 30 min, `scripts/ingest.ts`. Repo **pubblico** (Actions gratis e illimitate; i cron si disattivano dopo 60 giorni senza attività nel repo). |
| Push | Libreria `web-push` + chiavi VAPID; `VAPID_SUBJECT` = `mailto:...` senza spazi (Apple è severa) |
| Accesso | Password unica (`APP_PASSWORD`) + cookie firmato. Supabase Auth solo se diventa prodotto. |
| Lettura | Reader mode: `@mozilla/readability` + `linkedom`, HTML ripulito con `sanitize-html`, salvato in DB alla raccolta. Niente iframe. |
| Offline | Service worker con Serwist (+ handler push che mostra sempre una notifica, altrimenti Safari revoca l'iscrizione) |
| Design (v2) | I due concept v1 (A Rivista, B Strumento radar) sono **scartati** (troppo generici). Nuovi concept in Figma, pagine "C · Signal" (dark-first, nero + giallo acido, titoli giganti, anelli radar, mono) e "D · Zine" (neo-brutalista, carta + blocchi di colore per piattaforma, bordi spessi, ombre dure). Card diverse per formato: video, post LinkedIn, articolo, thread, release GitHub, podcast. Scelta: **D · Zine** (20/11/2026). Tipografia D v2: Bricolage Grotesque (titoli/UI, 96pt ExtraBold per i numeri grandi), Newsreader (testi di lettura), Instrument Serif Italic (frasi di accento), Martian Mono (etichette), Permanent Marker (adesivi). Dettagli zine: nastro ticker, adesivi, nastro adesivo, mezzatinta sulle anteprime video. Backup della versione precedente: pagina "D · Zine (v1, backup)". Struttura dell'app: **da discutere** con Francesco. |
| Design (v1, scartato) | Due direzioni da scegliere: A "Rivista" (serif, carta calda, accento vermiglio) o B "Strumento radar" (dark-first, mono, colore per argomento). Scelta: **da fare**. Il design si fa in Figma (draft "Radar – Design (draft)", https://www.figma.com/design/hvdlGT9ydcOKcZ7EsRFrF5): pagine A e B con feed/lettura/impostazioni in chiaro e scuro, token come variabili (collezioni "A · Rivista" e "B · Radar", modi Light/Dark). Il file `design/mockups.html` è solo una bozza HTML iniziale. |

Struttura: `src/lib/` logica dati (senza UI), `src/app/api/` route API, `src/design/` token e stile, `scripts/` raccolta. Tenere la logica separata dall'interfaccia permette un futuro impacchettamento nativo.

## Segreti
Mai nel codice. Nomi in `.env.example`; valori in `.env.local` (escluso da git), su Vercel (Environment Variables) e su GitHub (Secrets). Nel database: RLS attiva senza policy.

## Comandi utili
```powershell
npm run dev     # server locale su http://localhost:3000
npm run build   # build di produzione (controlla errori)
npm run lint    # controllo del codice
git status      # cosa è cambiato
git log --oneline
```

## Fasi e stato
- [ ] **Fase 0 Fondamenta**: repo, scheletro Next.js, scelta design, account (GitHub, Vercel, Supabase), pagina vuota online in HTTPS. *In corso: scheletro creato, git inizializzato, nessun commit ancora (manca nome/email git di Francesco).*
- [ ] **Fase 1 MVP**: 1 argomento (AI e strumenti agentici), 3 fonti, DB, workflow Actions, feed, reader, password, manifest/icone iOS, guida installazione. Checklist test iPhone.
- [ ] **Fase 2 Push**: VAPID, pulsante "Attiva notifiche", notifica di prova e reale, `push_log` + diagnostica.
- [ ] **Fase 3 Argomenti/fonti/preferenze**: tutti gli argomenti e corsi, gestione fonti, filtri, ricerca, salvati, riepilogo giornaliero, ore di silenzio.
- [ ] **Fase 4 Offline e rifinitura**: cache, indicatore offline, dark/light, pulizia articoli vecchi.
- Dopo: riassunti/digest con API Claude (disattivabili, costi da verificare), rilevanza, tag corsi + Notion, statistiche.

## Fonti verificate (20/11/2026)
OK: Claude Code releases (`https://github.com/anthropics/claude-code/releases.atom`), Simon Willison (`https://simonwillison.net/atom/everything/`), Hugging Face (`https://huggingface.co/blog/feed.xml`), Import AI, The Verge AI, arXiv cs.AI/cs.CY (`https://rss.arxiv.org/rss/cs.AI`), Agenda Digitale, NN/g, Smashing, UX Collective, A List Apart, PetaPixel, No Film School, Fstoppers, Social Media Today, TechCrunch, MIT Tech Review, MIT SMR, HN front page, Il Post Tecnologia, Google News RSS.
Con riserva: Anthropic non ha feed ufficiale (usare `Olshansk/rss-feeds`, non ufficiale); arXiv cs.AI = 400 voci/giorno, da filtrare; Google News ha link "avvolti".
KO: StartupItalia (403), Eye on Design, Service Design Network, Internazionale (404), HBR feed, Frizzifrizzi (fermo 2024).
Elenco per argomento: vedi il piano iniziale (copiare qui in Fase 1 quando si crea lo schema).

## Note iOS (verificate)
- Push solo da app installata sulla Home; permesso solo dopo un tocco; `userVisibleOnly: true`; niente push silenziose.
- iOS 26: ogni sito aggiunto alla Home si apre come web app per default (l'utente può spegnere "Apri come web app").
- Declarative Web Push (iOS 18.4+): payload `{"web_push": 8030, "notification": {"title", "navigate", ...}}`.
