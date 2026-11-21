# Fonti di Radar

Catalogo leggibile di `sources.json`. **Non modificare a mano questo file: descrive l'elenco**; la verità è `scripts/seed/sources.json`.
Verificate dal vivo il **21/11/2026** con `node scripts/check-sources.mjs` (risposta valida, contenuti recenti) e provate con il lettore vero (`npm run ingest:dry`).

## Come leggere le colonne
- **Argomenti fissi**: tutto ciò che la fonte pubblica è già di quell'argomento.
- **"(se è AI)"**: argomento aggiunto solo agli articoli che parlano davvero di AI (le fonti generaliste, come ANSA o BBC, mostrano solo i contenuti sull'AI).
- **Tutti i settori trovati con le parole chiave**: fonte generalista; ogni contenuto prende gli argomenti dalle parole chiave e viene scartato se non c'entra con l'AI.

## Come è stata decisa l'affidabilità
1. **Primarie**: chi produce la notizia (OpenAI, Google DeepMind, NVIDIA, Hugging Face, istituti e organizzazioni).
2. **Ricerca**: università e riviste scientifiche con revisione tra pari.
3. **Testate**: redazioni con una linea editoriale e correzioni pubbliche.
4. **Autori di riferimento**: esperti con un lavoro riconoscibile, ma opinioni personali (es. Gary Marcus è molto critico; Zvi scrive moltissimo).
5. **Canali YouTube e podcast**: ottimi per capire, meno controllati: tenerli come "secondi".
6. **Community (Hacker News)**: serve a scoprire cose nuove, non a verificarle.
Il giudizio è mio e discutibile: se una fonte non ti convince, si toglie con una riga.

## Escluse di proposito
- **Reddit**: RSS spenti il 13/11/2026 e API pubblica in chiusura.
- **LinkedIn**: nessun feed pubblico; solo link incollati a mano.
- **arXiv**: ~400 articoli scientifici al giorno, sommergerebbero il feed. Se serve, aggiungere una categoria alla volta (es. `cs.HC`) e filtrare.
- **Siti a pagamento** (Financial Times, The Information…): senza feed completo.

## Fonti primarie (laboratori, aziende e istituzioni che pubblicano in prima persona) (50)

| Fonte | Tipo | Argomenti |
|---|---|---|
| OpenAI News | articoli | AI |
| Google DeepMind Blog | articoli | AI, Ricerca scientifica |
| Google Research Blog | articoli | AI, Ricerca scientifica |
| Google AI Blog | articoli | AI |
| Microsoft Research Blog | articoli | tutti i settori trovati con le parole chiave |
| NVIDIA Blog | articoli | tutti i settori trovati con le parole chiave |
| NVIDIA Technical Blog | articoli | AI |
| Hugging Face Blog | articoli | AI |
| AWS Machine Learning Blog | articoli | AI, MLOps e infrastruttura |
| Apple Machine Learning Research | articoli | AI, Ricerca scientifica |
| GitHub Blog: AI e ML | articoli | AI, Assistenti per il codice |
| Anthropic News (non ufficiale) | articoli | AI |
| Anthropic Engineering (non ufficiale) | articoli | AI |
| Stability AI News | articoli | AI, AI generativa |
| Figma Blog | articoli | tutti i settori trovati con le parole chiave |
| Blender News | articoli | tutti i settori trovati con le parole chiave |
| Allen Institute for AI | articoli | AI, Ricerca scientifica |
| AlgorithmWatch | articoli | Società e regole (se è AI) |
| CSET (Georgetown) | articoli | Geopolitica, Regole e leggi |
| EFF: Deeplinks | articoli | tutti i settori trovati con le parole chiave |
| EU AI Act Newsletter | articoli | Regole e leggi, Europa |
| Future of Life Institute | articoli | Rischi (se è AI), Allineamento e sicurezza (se è AI) |
| Partnership on AI | articoli | Etica |
| PyTorch Blog | articoli | AI, Deep learning |
| NASA: notizie | articoli | tutti i settori trovati con le parole chiave |
| noyb | articoli | Privacy e dati personali (se è AI) |
| Creative Commons | articoli | Copyright e diritti (se è AI) |
| Google DeepMind (YouTube) | video | AI |
| OpenAI (YouTube) | video | AI |
| Anthropic (YouTube) | video | AI |
| NVIDIA (YouTube) | video | tutti i settori trovati con le parole chiave |
| Hugging Face (YouTube) | video | AI |
| Claude Code (release) | release | AI, Assistenti per il codice, Agenti AI |
| OpenAI Codex (release) | release | AI, Assistenti per il codice, Agenti AI |
| Gemini CLI (release) | release | AI, Assistenti per il codice |
| Ollama (release) | release | AI, Modelli open source |
| llama.cpp (release) | release | AI, Modelli open source, AI sul dispositivo |
| Transformers (release) | release | AI, Deep learning |
| Diffusers (release) | release | AI generativa, Modelli di diffusione |
| ComfyUI (release) | release | AI generativa, Immagini, Flussi di lavoro |
| InvokeAI (release) | release | AI generativa, Immagini |
| vLLM (release) | release | AI, MLOps e infrastruttura |
| LangChain (release) | release | AI, Agenti AI |
| LlamaIndex (release) | release | AI, Ricerca e RAG |
| PyTorch (release) | release | AI, Deep learning |
| Open WebUI (release) | release | AI, Modelli open source |
| n8n (release) | release | Automazione (se è AI), Flussi di lavoro (se è AI) |
| Anthropic SDK Python (release) | release | AI, API e SDK |
| OpenAI Python SDK (release) | release | AI, API e SDK |
| CrewAI (release) | release | AI, Agenti AI |

## Ricerca (università, riviste scientifiche) (10)

| Fonte | Tipo | Argomenti |
|---|---|---|
| Berkeley AI Research (BAIR) Blog | articoli | AI, Ricerca scientifica |
| CMU Machine Learning Blog | articoli | AI, Ricerca scientifica |
| MIT News: intelligenza artificiale | articoli | AI |
| Nature: machine learning | articoli | AI, Ricerca scientifica |
| Nature (news e ricerca) | articoli | tutti i settori trovati con le parole chiave |
| Quanta Magazine | articoli | tutti i settori trovati con le parole chiave |
| Science News | articoli | tutti i settori trovati con le parole chiave |
| ScienceDaily: AI | articoli | AI |
| Phys.org: machine learning e AI | articoli | AI |
| Epoch AI | articoli | AI, Ricerca scientifica |

## Testate e siti editoriali (102)

| Fonte | Tipo | Argomenti |
|---|---|---|
| MIT Technology Review: AI | articoli | AI |
| The Verge: AI | articoli | AI |
| TechCrunch AI | articoli | AI |
| Ars Technica: AI | articoli | AI |
| WIRED: AI | articoli | AI |
| IEEE Spectrum: AI | articoli | AI |
| IEEE Spectrum: robotica | articoli | Robotica |
| The Guardian: AI | articoli | AI |
| BBC Technology | articoli | tutti i settori trovati con le parole chiave |
| The Decoder | articoli | AI |
| ZDNET: AI | articoli | AI |
| The Robot Report | articoli | Robotica |
| O'Reilly Radar | articoli | tutti i settori trovati con le parole chiave |
| InfoQ: AI, ML e dati | articoli | AI |
| KDnuggets | articoli | AI, Machine learning |
| AI4Business | articoli | AI, Italia |
| Italian Tech (Repubblica) | articoli | Italia (se è AI) |
| Punto Informatico | articoli | Italia (se è AI) |
| Creative Bloq | articoli | tutti i settori trovati con le parole chiave |
| CG Channel | articoli | tutti i settori trovati con le parole chiave |
| 80 Level | articoli | tutti i settori trovati con le parole chiave |
| Game Developer | articoli | tutti i settori trovati con le parole chiave |
| Artificial Lawyer | articoli | Giustizia e diritto |
| EdSurge | articoli | tutti i settori trovati con le parole chiave |
| AgFunder News | articoli | tutti i settori trovati con le parole chiave |
| Finextra | articoli | tutti i settori trovati con le parole chiave |
| Krebs on Security | articoli | tutti i settori trovati con le parole chiave |
| Electrek | articoli | tutti i settori trovati con le parole chiave |
| SpaceNews | articoli | tutti i settori trovati con le parole chiave |
| Utility Dive | articoli | tutti i settori trovati con le parole chiave |
| HDblog | articoli | Italia (se è AI) |
| Webnews | articoli | Italia (se è AI) |
| Tom's Hardware Italia | articoli | Italia (se è AI) |
| Futuro Prossimo | articoli | Italia (se è AI) |
| Cybersecurity360 | articoli | Italia (se è AI), Cybersecurity (se è AI) |
| Forum PA | articoli | Italia (se è AI), Pubblica amministrazione (se è AI) |
| ANSA: ultima ora | articoli | Italia (se è AI) |
| Rest of World | articoli | tutti i settori trovati con le parole chiave |
| 404 Media | articoli | tutti i settori trovati con le parole chiave |
| Tom's Hardware | articoli | tutti i settori trovati con le parole chiave |
| Data Center Dynamics | articoli | Data center ed energia (se è AI) |
| Robohub | articoli | Robotica |
| The Quantum Insider | articoli | tutti i settori trovati con le parole chiave |
| Zapier Blog | articoli | tutti i settori trovati con le parole chiave |
| Vercel Blog | articoli | tutti i settori trovati con le parole chiave |
| Dezeen | articoli | tutti i settori trovati con le parole chiave |
| Designboom | articoli | tutti i settori trovati con le parole chiave |
| ArchDaily | articoli | tutti i settori trovati con le parole chiave |
| CSS-Tricks | articoli | tutti i settori trovati con le parole chiave |
| DPReview | articoli | tutti i settori trovati con le parole chiave |
| Hyperallergic | articoli | tutti i settori trovati con le parole chiave |
| ARTnews | articoli | tutti i settori trovati con le parole chiave |
| Music Business Worldwide | articoli | tutti i settori trovati con le parole chiave |
| Synthtopia | articoli | tutti i settori trovati con le parole chiave |
| Deadline | articoli | tutti i settori trovati con le parole chiave |
| The Hollywood Reporter | articoli | tutti i settori trovati con le parole chiave |
| Variety | articoli | tutti i settori trovati con le parole chiave |
| GamesIndustry.biz | articoli | tutti i settori trovati con le parole chiave |
| Publishers Weekly | articoli | tutti i settori trovati con le parole chiave |
| STAT | articoli | tutti i settori trovati con le parole chiave |
| Fierce Healthcare | articoli | tutti i settori trovati con le parole chiave |
| BioPharma Dive | articoli | tutti i settori trovati con le parole chiave |
| Banking Dive | articoli | tutti i settori trovati con le parole chiave |
| Insurance Journal | articoli | tutti i settori trovati con le parole chiave |
| Above the Law | articoli | tutti i settori trovati con le parole chiave |
| Inside Higher Ed | articoli | tutti i settori trovati con le parole chiave |
| HR Dive | articoli | tutti i settori trovati con le parole chiave |
| Manufacturing Dive | articoli | tutti i settori trovati con le parole chiave |
| Supply Chain Dive | articoli | tutti i settori trovati con le parole chiave |
| FreightWaves | articoli | tutti i settori trovati con le parole chiave |
| Carbon Brief | articoli | tutti i settori trovati con le parole chiave |
| Canary Media | articoli | tutti i settori trovati con le parole chiave |
| Retail Dive | articoli | tutti i settori trovati con le parole chiave |
| Modern Retail | articoli | tutti i settori trovati con le parole chiave |
| HousingWire | articoli | tutti i settori trovati con le parole chiave |
| Skift | articoli | tutti i settori trovati con le parole chiave |
| Nieman Lab | articoli | tutti i settori trovati con le parole chiave |
| Poynter | articoli | tutti i settori trovati con le parole chiave |
| Columbia Journalism Review | articoli | tutti i settori trovati con le parole chiave |
| Press Gazette | articoli | tutti i settori trovati con le parole chiave |
| Light Reading | articoli | tutti i settori trovati con le parole chiave |
| Defense One | articoli | tutti i settori trovati con le parole chiave |
| Breaking Defense | articoli | tutti i settori trovati con le parole chiave |
| War on the Rocks | articoli | tutti i settori trovati con le parole chiave |
| Space.com | articoli | tutti i settori trovati con le parole chiave |
| BleepingComputer | articoli | tutti i settori trovati con le parole chiave |
| The Hacker News | articoli | tutti i settori trovati con le parole chiave |
| Dark Reading | articoli | tutti i settori trovati con le parole chiave |
| SecurityWeek | articoli | tutti i settori trovati con le parole chiave |
| CX Today | articoli | tutti i settori trovati con le parole chiave |
| MarTech | articoli | tutti i settori trovati con le parole chiave |
| Marketing Dive | articoli | tutti i settori trovati con le parole chiave |
| Adweek | articoli | tutti i settori trovati con le parole chiave |
| Crunchbase News | articoli | tutti i settori trovati con le parole chiave |
| Sifted | articoli | Europa (se è AI) |
| EU-Startups | articoli | Europa (se è AI) |
| Politico Europe: tecnologia | articoli | Europa (se è AI) |
| Techdirt | articoli | tutti i settori trovati con le parole chiave |
| Bellingcat | articoli | tutti i settori trovati con le parole chiave |
| FactCheck.org | articoli | tutti i settori trovati con le parole chiave |
| Nextgov | articoli | tutti i settori trovati con le parole chiave |
| FedScoop | articoli | tutti i settori trovati con le parole chiave |

## Autori e newsletter di riferimento (24)

| Fonte | Tipo | Argomenti |
|---|---|---|
| Simon Willison | articoli | AI |
| Import AI | articoli | AI |
| Interconnects (Nathan Lambert) | articoli | AI, Modelli linguistici (LLM) |
| One Useful Thing (Ethan Mollick) | articoli | AI |
| Last Week in AI | articoli | AI |
| AI Snake Oil | articoli | AI, Società e regole |
| Gary Marcus | articoli | AI, Società e regole |
| Ahead of AI (Sebastian Raschka) | articoli | AI, Modelli linguistici (LLM) |
| Andrej Karpathy | articoli | AI |
| Bruce Schneier | articoli | tutti i settori trovati con le parole chiave |
| Platformer | articoli | tutti i settori trovati con le parole chiave |
| Understanding AI (Timothy Lee) | articoli | AI |
| Don't Worry About the Vase (Zvi) | articoli | AI |
| Ben's Bites | articoli | AI |
| Exponential View | articoli | AI |
| Air Street Press | articoli | AI |
| Astral Codex Ten | articoli | tutti i settori trovati con le parole chiave |
| Not Boring | articoli | tutti i settori trovati con le parole chiave |
| Benedict Evans | articoli | tutti i settori trovati con le parole chiave |
| ChinaTalk | articoli | Cina (se è AI), Geopolitica (se è AI) |
| AI Safety Newsletter | articoli | Allineamento e sicurezza, Rischi |
| Martin Fowler | articoli | tutti i settori trovati con le parole chiave |
| The Pragmatic Engineer | articoli | tutti i settori trovati con le parole chiave |
| Lenny's Newsletter | articoli | tutti i settori trovati con le parole chiave |

## Canali YouTube (15)

| Fonte | Tipo | Argomenti |
|---|---|---|
| Two Minute Papers | video | AI, Ricerca scientifica |
| Yannic Kilcher | video | AI, Ricerca scientifica |
| AI Explained | video | AI |
| Matt Wolfe | video | AI |
| DeepLearning.AI | video | AI |
| Andrej Karpathy | video | AI |
| Lex Fridman | video | tutti i settori trovati con le parole chiave |
| Fireship | video | tutti i settori trovati con le parole chiave |
| 3Blue1Brown | video | tutti i settori trovati con le parole chiave |
| Computerphile | video | tutti i settori trovati con le parole chiave |
| Matthew Berman | video | AI |
| Sam Witteveen | video | AI, Agenti AI |
| Olivio Sarikas | video | AI generativa, Immagini |
| AI Search | video | AI |
| Wes Roth | video | AI |

## Podcast (11)

| Fonte | Tipo | Argomenti |
|---|---|---|
| Latent Space | podcast | AI |
| Lex Fridman Podcast | podcast | tutti i settori trovati con le parole chiave |
| Hard Fork (NYT) | podcast | tutti i settori trovati con le parole chiave |
| Practical AI | podcast | AI |
| Dwarkesh Podcast | podcast | tutti i settori trovati con le parole chiave |
| The TWIML AI Podcast | podcast | AI |
| Eye on AI | podcast | AI |
| NVIDIA AI Podcast | podcast | AI |
| No Priors | podcast | AI |
| The Cognitive Revolution | podcast | AI |
| Machine Learning Street Talk | podcast | AI |

## Community (Hacker News: voti alti, meno controllo editoriale) (6)

| Fonte | Tipo | Argomenti |
|---|---|---|
| Hacker News: LLM | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: agenti AI | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: AI generativa | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: modelli di diffusione | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: OpenAI | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: machine learning | discussioni | tutti i settori trovati con le parole chiave |

## Provate e scartate (62)
Non rispondono, non sono feed, o non pubblicano da troppo tempo. Da ricontrollare ogni tanto: un sito può riaprire il feed.

| Fonte | Motivo |
|---|---|
| Microsoft AI Blog | HTTP 410 |
| Cohere Blog | non è un feed RSS/Atom (probabile pagina web) |
| Mistral AI News | HTTP 404 |
| Runway News | HTTP 404 |
| Adobe Blog | HTTP 404 |
| PyTorch Blog | HTTP 404 |
| TensorFlow Blog | ultimo contenuto 126 giorni fa |
| LangChain Blog | non è un feed RSS/Atom (probabile pagina web) |
| Stanford HAI | non è un feed RSS/Atom (probabile pagina web) |
| The Gradient | ultimo contenuto 275 giorni fa |
| Nature Machine Intelligence | non è un feed RSS/Atom (probabile pagina web) |
| npj Digital Medicine | HTTP 404 |
| VentureBeat: AI | HTTP 429 |
| AI News | non è un feed RSS/Atom (probabile pagina web) |
| ANSA: Tecnologia | ultimo contenuto 1270 giorni fa |
| Wired Italia | ultimo contenuto 143 giorni fa |
| Corriere: Tecnologia | ultimo contenuto 1606 giorni fa |
| Il Sole 24 Ore: Tecnologia | HTTP 404 |
| Lil'Log (Lilian Weng) | ultimo contenuto 140 giorni fa |
| Chip Huyen | ultimo contenuto 674 giorni fa |
| Jay Alammar | ultimo contenuto 382 giorni fa |
| The Batch (DeepLearning.AI) | HTTP 404 |
| MobiHealthNews | HTTP 403 |
| OECD.AI | HTTP 404 |
| Brookings: AI | non è un feed RSS/Atom (probabile pagina web) |
| AI Now Institute | HTTP 403 |
| Garante Privacy: news | HTTP 404 |
| Gradient Dissent | HTTP 404 |
| AI in Business | HTTP 404 |
| AutoGen (release) | ultimo contenuto 417 giorni fa |
| Stable Diffusion WebUI (release) | ultimo contenuto 650 giorni fa |
| LangChain Blog | non è un feed RSS/Atom (probabile pagina web) |
| Stanford HAI | non è un feed RSS/Atom (probabile pagina web) |
| Stanford HAI (news) | non è un feed RSS/Atom (probabile pagina web) |
| AI News | non è un feed RSS/Atom (probabile pagina web) |
| Data & Society | feed vuoto |
| Open: Tech | HTTP 404 |
| Il Sole 24 Ore: Tecnologie | HTTP 404 |
| Pagella Politica | non è un feed RSS/Atom (probabile pagina web) |
| Facta News | HTTP 404 |
| SemiAnalysis | ultimo contenuto 430 giorni fa |
| Every | non è un feed RSS/Atom (probabile pagina web) |
| Core77 | HTTP 404 |
| Codrops | HTTP 403 |
| Business of Fashion | HTTP 403 |
| Healthcare IT News | HTTP 403 |
| Fierce Biotech | HTTP 403 |
| Endpoints News | HTTP 403 |
| Inman | HTTP 403 |
| SportTechie | fetch failed |
| Wareable | HTTP 403 |
| Search Engine Land | HTTP 403 |
| a16z | HTTP 404 |
| World Economic Forum | HTTP 403 |
| EURACTIV: digitale | HTTP 403 |
| DigiChina (Stanford) | feed vuoto |
| IAPP: notizie | non è un feed RSS/Atom (probabile pagina web) |
| The A11Y Project | ultimo contenuto 621 giorni fa |
| GovTech | non è un feed RSS/Atom (probabile pagina web) |
| Brookings (tutto) | non è un feed RSS/Atom (probabile pagina web) |
| Nature Medicine | risposta instabile (reindirizzamento incostante) |
| Stable Diffusion WebUI, AutoGen, Chip Huyen, Jay Alammar | ferme da oltre un anno |
