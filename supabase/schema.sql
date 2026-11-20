-- Radar: schema del database (Supabase / Postgres).
-- Da incollare nel "SQL Editor" di Supabase, una volta sola.
-- Sicurezza: RLS attiva e NESSUNA policy = nessuno può leggere o scrivere
-- con la chiave pubblica. Accede solo il server con la chiave "service role".

-- Argomenti che l'utente può scegliere in registrazione (chip).
-- "keywords" servono a capire a quale argomento appartiene un contenuto.
create table if not exists topics (
  slug        text primary key,
  label       text not null,
  parent_slug text references topics(slug),
  keywords    text[] not null default '{}',
  sort_order  int not null default 0
);

-- Le fonti da leggere (canale YouTube, blog RSS, podcast, repo GitHub, ricerca HN).
create table if not exists sources (
  id              uuid primary key default gen_random_uuid(),
  platform        text not null check (platform in ('youtube','article','podcast','github','hn')),
  name            text not null,
  url             text not null unique,
  topics          text[] not null default '{}',   -- argomenti fissi della fonte
  match_keywords  boolean not null default false, -- true = deduci gli argomenti dalle parole chiave
  active          boolean not null default true,
  last_fetched_at timestamptz,
  last_error      text
);

-- I contenuti raccolti (una riga per video / articolo / episodio / release / post HN).
create table if not exists items (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid not null references sources(id) on delete cascade,
  platform     text not null,
  external_id  text not null,           -- identificativo dato dalla fonte
  title        text not null,
  url          text not null,
  published_at timestamptz not null,
  summary      text not null default '',
  image_url    text,
  topics       text[] not null default '{}',
  meta         jsonb not null default '{}'::jsonb, -- extra per formato (durata, audio, punti HN...)
  created_at   timestamptz not null default now(),
  unique (source_id, external_id)       -- evita i doppioni a ogni raccolta
);

-- Feed cronologico: i più recenti prima; filtro per argomento.
create index if not exists items_published_idx on items (published_at desc);
create index if not exists items_topics_idx on items using gin (topics);

alter table topics  enable row level security;
alter table sources enable row level security;
alter table items   enable row level security;

-- Il server (script di raccolta, chiave "service role") deve poter usare le tabelle
-- anche se in Supabase hai lasciato spenta l'opzione "Grant API access to new tables".
-- Chi usa la chiave pubblica (anon / authenticated) continua a non avere accesso.
grant usage on schema public to service_role;
grant all on table topics, sources, items to service_role;
