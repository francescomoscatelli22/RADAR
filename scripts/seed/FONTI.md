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

## Fonti primarie (laboratori, aziende e istituzioni che pubblicano in prima persona) (123)

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
| The Keyword (Google) | articoli | tutti i settori trovati con le parole chiave |
| Engineering at Meta | articoli | tutti i settori trovati con le parole chiave |
| Microsoft Official Blog | articoli | tutti i settori trovati con le parole chiave |
| Microsoft Source: AI | articoli | AI |
| IBM Research Blog | articoli | tutti i settori trovati con le parole chiave |
| Cloudflare Blog: AI | articoli | AI |
| Databricks Blog | articoli | tutti i settori trovati con le parole chiave |
| Together AI Blog | articoli | AI |
| Replicate Blog | articoli | AI, AI generativa |
| fal.ai Blog | articoli | AI, AI generativa |
| ElevenLabs Blog | articoli | AI generativa, Voce sintetica |
| Mozilla.ai Blog | articoli | AI, Modelli open source |
| Weights & Biases | articoli | AI |
| Unity Blog | articoli | tutti i settori trovati con le parole chiave |
| Unreal Engine News | articoli | tutti i settori trovati con le parole chiave |
| Netflix Tech Blog | articoli | tutti i settori trovati con le parole chiave |
| Salesforce AI Research | articoli | AI, Ricerca scientifica |
| Mistral AI News | articoli | AI |
| METR | articoli | Allineamento e sicurezza, Benchmark e valutazione |
| Alignment Forum | articoli | Allineamento e sicurezza |
| EPIC | articoli | tutti i settori trovati con le parole chiave |
| Commissione europea: strategia digitale | articoli | Europa (se è AI) |
| Hugging Face Daily Papers (non ufficiale) | articoli | AI, Ricerca scientifica |
| Google for Developers | video | tutti i settori trovati con le parole chiave |
| Google Cloud Tech | video | tutti i settori trovati con le parole chiave |
| Google Labs | video | AI |
| AI at Meta | video | AI |
| Microsoft Research (YouTube) | video | tutti i settori trovati con le parole chiave |
| NVIDIA Developer | video | tutti i settori trovati con le parole chiave |
| LangChain (YouTube) | video | AI, Agenti AI |
| Runway (YouTube) | video | AI generativa, Video |
| Luma AI (YouTube) | video | AI generativa, Video |
| Midjourney (YouTube) | video | AI generativa, Immagini |
| KREA (YouTube) | video | AI generativa |
| Figma (YouTube) | video | tutti i settori trovati con le parole chiave |
| Adobe Creative Cloud (YouTube) | video | tutti i settori trovati con le parole chiave |
| Blender (YouTube) | video | tutti i settori trovati con le parole chiave |
| Unreal Engine (YouTube) | video | tutti i settori trovati con le parole chiave |
| Y Combinator (YouTube) | video | tutti i settori trovati con le parole chiave |
| a16z (YouTube) | video | tutti i settori trovati con le parole chiave |
| Sequoia Capital (YouTube) | video | tutti i settori trovati con le parole chiave |
| SwarmUI (release) | release | AI generativa, Immagini |
| Krita AI Diffusion (release) | release | AI generativa, Immagini |
| kohya_ss (release) | release | AI generativa, Immagini |
| ComfyUI Desktop (release) | release | AI generativa, Flussi di lavoro |
| Jan (release) | release | AI, Modelli open source, AI sul dispositivo |
| LocalAI (release) | release | AI, Modelli open source |
| Aider (release) | release | AI, Assistenti per il codice |
| Cline (release) | release | AI, Assistenti per il codice, Agenti AI |
| Continue (release) | release | AI, Assistenti per il codice |
| OpenHands (release) | release | AI, Assistenti per il codice, Agenti AI |
| Goose (release) | release | AI, Agenti AI |
| Qwen Code (release) | release | AI, Assistenti per il codice |
| MCP Python SDK (release) | release | AI, Plugin e integrazioni |
| MCP TypeScript SDK (release) | release | AI, Plugin e integrazioni |
| LangGraph (release) | release | AI, Agenti AI |
| Semantic Kernel (release) | release | AI, Agenti AI |
| DSPy (release) | release | AI, Prompt design |
| Unsloth (release) | release | AI, Modelli open source |
| MLX (release) | release | AI, AI sul dispositivo |
| whisper.cpp (release) | release | AI, Riconoscimento vocale |
| smolagents (release) | release | AI, Agenti AI |
| SGLang (release) | release | AI, MLOps e infrastruttura |
| Dify (release) | release | AI, No-code, Agenti AI |
| Flowise (release) | release | AI, No-code |
| Langflow (release) | release | AI, No-code |
| AnythingLLM (release) | release | AI, Ricerca e RAG |
| Google Gen AI SDK Python (release) | release | AI, API e SDK |
| OpenAI Agents SDK (release) | release | AI, Agenti AI |
| Claude Agent SDK Python (release) | release | AI, Agenti AI |
| Google ADK (release) | release | AI, Agenti AI |
| Pydantic AI (release) | release | AI, Agenti AI |
| Roo Code (release) | release | AI, Assistenti per il codice |

## Ricerca (università, riviste scientifiche) (14)

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
| The Conversation: AI | articoli | AI |
| TechXplore: machine learning e AI | articoli | AI |
| New Scientist: tecnologia | articoli | tutti i settori trovati con le parole chiave |
| Stanford Online | video | tutti i settori trovati con le parole chiave |

## Testate e siti editoriali (185)

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
| NYT Technology | articoli | tutti i settori trovati con le parole chiave |
| Washington Post: tecnologia | articoli | tutti i settori trovati con le parole chiave |
| Bloomberg Technology | articoli | tutti i settori trovati con le parole chiave |
| CNBC Technology | articoli | tutti i settori trovati con le parole chiave |
| Fast Company: tecnologia | articoli | tutti i settori trovati con le parole chiave |
| Fast Company: design | articoli | tutti i settori trovati con le parole chiave |
| Engadget | articoli | tutti i settori trovati con le parole chiave |
| Gizmodo | articoli | tutti i settori trovati con le parole chiave |
| Mashable: tecnologia | articoli | tutti i settori trovati con le parole chiave |
| CNET | articoli | tutti i settori trovati con le parole chiave |
| The Register: AI e ML | articoli | AI |
| SiliconANGLE: AI | articoli | AI |
| AI Business | articoli | AI |
| MarkTechPost | articoli | AI |
| Unite.AI | articoli | AI |
| Analytics India Magazine | articoli | AI |
| InfoWorld | articoli | tutti i settori trovati con le parole chiave |
| The New Stack | articoli | tutti i settori trovati con le parole chiave |
| 9to5Mac | articoli | tutti i settori trovati con le parole chiave |
| 9to5Google | articoli | tutti i settori trovati con le parole chiave |
| MacRumors | articoli | tutti i settori trovati con le parole chiave |
| Android Authority | articoli | tutti i settori trovati con le parole chiave |
| Neowin | articoli | tutti i settori trovati con le parole chiave |
| TestingCatalog | articoli | AI |
| Tech.eu | articoli | Europa (se è AI) |
| The Next Web | articoli | tutti i settori trovati con le parole chiave |
| Towards Data Science | articoli | AI |
| Machine Learning Mastery | articoli | AI, Machine learning |
| Analytics Vidhya | articoli | AI |
| DigiTimes Asia | articoli | tutti i settori trovati con le parole chiave |
| South China Morning Post: tecnologia | articoli | Cina (se è AI) |
| Euronews: Next | articoli | Europa (se è AI) |
| The Guardian: tecnologia | articoli | tutti i settori trovati con le parole chiave |
| Le Monde: Pixels | articoli | Europa (se è AI) |
| No Film School | articoli | tutti i settori trovati con le parole chiave |
| PetaPixel | articoli | tutti i settori trovati con le parole chiave |
| Fstoppers | articoli | tutti i settori trovati con le parole chiave |
| Cartoon Brew | articoli | tutti i settori trovati con le parole chiave |
| befores & afters | articoli | tutti i settori trovati con le parole chiave |
| fxguide | articoli | tutti i settori trovati con le parole chiave |
| Motionographer | articoli | tutti i settori trovati con le parole chiave |
| Smashing Magazine | articoli | tutti i settori trovati con le parole chiave |
| UX Collective | articoli | tutti i settori trovati con le parole chiave |
| Nielsen Norman Group | articoli | tutti i settori trovati con le parole chiave |
| Design Week | articoli | tutti i settori trovati con le parole chiave |
| Abduzeedo | articoli | tutti i settori trovati con le parole chiave |
| BlenderNation | articoli | tutti i settori trovati con le parole chiave |
| UploadVR | articoli | tutti i settori trovati con le parole chiave |
| Road to VR | articoli | tutti i settori trovati con le parole chiave |
| Music Ally | articoli | tutti i settori trovati con le parole chiave |
| Digital Music News | articoli | tutti i settori trovati con le parole chiave |
| CDM Create Digital Music | articoli | tutti i settori trovati con le parole chiave |
| MusicRadar | articoli | tutti i settori trovati con le parole chiave |
| PocketGamer.biz | articoli | tutti i settori trovati con le parole chiave |
| Digiday | articoli | tutti i settori trovati con le parole chiave |
| Search Engine Journal | articoli | tutti i settori trovati con le parole chiave |
| Search Engine Roundtable | articoli | tutti i settori trovati con le parole chiave |
| WWD | articoli | tutti i settori trovati con le parole chiave |
| Fashionista | articoli | tutti i settori trovati con le parole chiave |
| The Architect's Newspaper | articoli | tutti i settori trovati con le parole chiave |
| Parametric Architecture | articoli | tutti i settori trovati con le parole chiave |
| IndieWire | articoli | tutti i settori trovati con le parole chiave |
| TheWrap | articoli | tutti i settori trovati con le parole chiave |
| Jane Friedman | articoli | tutti i settori trovati con le parole chiave |
| Stable Diffusion Art | articoli | AI generativa, Immagini |
| Agenda Digitale | articoli | Italia (se è AI) |
| EconomyUp | articoli | Italia (se è AI) |
| ZeroUno | articoli | Italia (se è AI) |
| Digital4 | articoli | Italia (se è AI) |
| Innovation Post | articoli | Italia (se è AI) |
| StartupItalia | articoli | Italia (se è AI) |
| Il Post: tecnologia | articoli | Italia (se è AI) |
| Sky TG24: tecnologia | articoli | Italia (se è AI) |
| Tech Princess | articoli | Italia (se è AI) |
| SmartWorld | articoli | Italia (se è AI) |
| Macitynet | articoli | Italia (se è AI) |
| Key4biz | articoli | Italia (se è AI) |
| AGI: innovazione | articoli | Italia (se è AI) |
| DDay.it | articoli | Italia (se è AI) |
| Corriere: tecnologia | articoli | Italia (se è AI) |
| Il Sole 24 Ore: tecnologia | articoli | Italia (se è AI) |
| Startupbusiness | articoli | Italia (se è AI) |
| Corriere Comunicazioni | articoli | Italia (se è AI) |

## Autori e newsletter di riferimento (46)

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
| Big Technology (Alex Kantrowitz) | articoli | tutti i settori trovati con le parole chiave |
| Stratechery (articoli gratuiti) | articoli | tutti i settori trovati con le parole chiave |
| The Algorithmic Bridge | articoli | AI |
| AI Supremacy | articoli | AI |
| Hyperdimensional (Dean Ball) | articoli | AI, Regole e leggi |
| Eugene Yan | articoli | AI |
| Hamel Husain | articoli | AI |
| Max Woolf (minimaxir) | articoli | tutti i settori trovati con le parole chiave |
| fast.ai | articoli | AI |
| Answer.AI | articoli | AI |
| Elevate (Addy Osmani) | articoli | tutti i settori trovati con le parole chiave |
| The Rundown AI | articoli | AI |
| Vicki Boykis | articoli | tutti i settori trovati con le parole chiave |
| Daniel Miessler | articoli | tutti i settori trovati con le parole chiave |
| Pete Warden | articoli | tutti i settori trovati con le parole chiave |
| Benn Stancil | articoli | tutti i settori trovati con le parole chiave |
| Tomasz Tunguz | articoli | tutti i settori trovati con le parole chiave |
| UX Tigers (Jakob Nielsen) | articoli | UI/UX e prodotto (se è AI) |
| Luke Wroblewski | articoli | tutti i settori trovati con le parole chiave |
| Artificial Ignorance | articoli | AI |
| Nate's Newsletter (Nate B Jones) | articoli | AI |
| Creator Economy (Peter Yang) | articoli | tutti i settori trovati con le parole chiave |

## Canali YouTube (44)

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
| Theoretically Media | video | AI generativa |
| Curious Refuge | video | AI generativa, Cinema e TV |
| MattVidPro AI | video | AI generativa |
| Nerdy Rodent | video | AI generativa, Immagini |
| Sebastian Kamph | video | AI generativa, Immagini |
| pixaroma | video | AI generativa, Immagini, Flussi di lavoro |
| bycloud | video | AI, Ricerca scientifica |
| Jeremy Howard | video | AI |
| Umar Jamil | video | AI, Deep learning |
| AI Coffee Break with Letitia | video | AI, Ricerca scientifica |
| Machine Learning Street Talk (YouTube) | video | AI |
| Dwarkesh Patel | video | tutti i settori trovati con le parole chiave |
| StatQuest | video | AI, Machine learning |
| sentdex | video | AI |
| The AI Advantage | video | AI |
| AI Jason | video | AI, Agenti AI |
| Prompt Engineering | video | AI |
| All About AI | video | AI |
| Cole Medin | video | AI, Agenti AI |
| IndyDevDan | video | AI, Assistenti per il codice |
| Riley Brown | video | AI, No-code |
| Nate B Jones | video | AI |
| David Ondrej | video | AI |
| Futurepedia | video | AI |
| Greg Isenberg | video | tutti i settori trovati con le parole chiave |
| Blender Guru | video | tutti i settori trovati con le parole chiave |
| Corridor Crew | video | tutti i settori trovati con le parole chiave |
| Marques Brownlee | video | tutti i settori trovati con le parole chiave |
| ColdFusion | video | tutti i settori trovati con le parole chiave |

## Podcast (34)

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
| The AI Daily Brief | podcast | AI |
| Decoder (The Verge) | podcast | tutti i settori trovati con le parole chiave |
| The Vergecast | podcast | tutti i settori trovati con le parole chiave |
| 80,000 Hours Podcast | podcast | tutti i settori trovati con le parole chiave |
| Big Technology Podcast | podcast | tutti i settori trovati con le parole chiave |
| AI + a16z | podcast | AI |
| Unsupervised Learning (Redpoint) | podcast | AI |
| Me, Myself, and AI (MIT Sloan) | podcast | AI |
| Your Undivided Attention | podcast | tutti i settori trovati con le parole chiave |
| The TED AI Show | podcast | AI |
| The Artificial Intelligence Show | podcast | AI |
| Lenny's Podcast | podcast | tutti i settori trovati con le parole chiave |
| Dive Club (design) | podcast | tutti i settori trovati con le parole chiave |
| Google DeepMind: The Podcast | podcast | AI |
| OpenAI Podcast | podcast | AI |
| The MAD Podcast (Matt Turck) | podcast | AI |
| Gradient Dissent | podcast | AI |
| Super Data Science | podcast | AI |
| AI Inside | podcast | AI |
| Data Skeptic | podcast | AI |
| The Daily AI Show | podcast | AI |
| Possible (Reid Hoffman) | podcast | tutti i settori trovati con le parole chiave |
| Mixture of Experts (IBM) | podcast | AI |

## Community (Hacker News: voti alti, meno controllo editoriale) (17)

| Fonte | Tipo | Argomenti |
|---|---|---|
| Hacker News: LLM | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: agenti AI | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: AI generativa | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: modelli di diffusione | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: OpenAI | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: machine learning | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: Claude | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: Gemini | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: Anthropic | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: generazione immagini | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: generazione video | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: modelli open weights | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: coding con AI | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: Hugging Face | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: Mistral | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: DeepSeek | discussioni | tutti i settori trovati con le parole chiave |
| Hacker News: ChatGPT | discussioni | tutti i settori trovati con le parole chiave |

## Provate e scartate (107)
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
| Google Cloud: AI e ML | non è un feed RSS/Atom (probabile pagina web) |
| Meta AI Blog | HTTP 404 |
| EleutherAI Blog | HTTP 404 |
| LAION Blog | HTTP 404 |
| Autodesk News | feed vuoto |
| Adobe Blog | HTTP 404 |
| Canva Newsroom | HTTP 403 |
| Framer Blog | HTTP 404 |
| Perplexity Blog | HTTP 404 |
| Ada Lovelace Institute | feed vuoto |
| Center for Democracy & Technology | feed vuoto |
| Stanford AI Lab Blog | ultimo contenuto 1631 giorni fa |
| MIT CSAIL News | ultimo contenuto 2700 giorni fa |
| Communications of the ACM | HTTP 403 |
| Transformer Circuits (Anthropic) | HTTP 403 |
| Fortune: AI | HTTP 404 |
| Synced | ultimo contenuto 465 giorni fa |
| VentureBeat | HTTP 429 |
| Axios: tecnologia | HTTP 404 |
| Semafor: tecnologia | HTTP 404 |
| Tech Policy Press | non è un feed RSS/Atom (probabile pagina web) |
| KrASIA | HTTP 404 |
| heise online (EN) | HTTP 404 |
| Animation Magazine | HTTP 403 |
| It's Nice That | HTTP 404 |
| AIGA Eye on Design | HTTP 404 |
| Radiance Fields | HTTP 404 |
| The Drum | HTTP 404 |
| Hardware Upgrade | non è un feed RSS/Atom (probabile pagina web) |
| Rai News: tecnologia | HTTP 404 |
| Multiplayer.it | HTTP 404 |
| Wired Italia | ultimo contenuto 144 giorni fa |
| swyx | ultimo contenuto 140 giorni fa |
| Rising Tide (Helen Toner) | ultimo contenuto 229 giorni fa |
| Miles Brundage | ultimo contenuto 128 giorni fa |
| AI Tidbits | ultimo contenuto 221 giorni fa |
| The Neuron | non è un feed RSS/Atom (probabile pagina web) |
| Davis Summarizes Papers | ultimo contenuto 818 giorni fa |
| Blender MCP (release) | feed vuoto |
| Hacker News: Stable Diffusion | ultimo contenuto 280 giorni fa |
| Industry4Business | reindirizza a Innovation Post (doppione) |
| TechNode | feed con 2.000 voci, troppo pesante da leggere ogni 3 minuti |
| Lawfare | feed con una sola voce |
| Training Data (Sequoia), Everyday AI, Last Week in AI (podcast) | episodi senza link alla pagina: il lettore li scarta |
| Google Developers Blog, Science (AAAS), Nikkei Asia | contenuti senza data leggibile: il lettore li scarta |
