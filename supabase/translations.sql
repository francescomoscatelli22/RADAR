-- Radar: lingue e traduzioni dei contenuti.
-- Da incollare nel "SQL Editor" di Supabase PRIMA di pubblicare la nuova versione dell'app
-- e della raccolta (altrimenti salvare i contenuti e leggere il feed daranno errore).
-- Si può rilanciare senza danni: ogni istruzione controlla se esiste già.

-- Lingua in cui è scritto un contenuto ("it", "en"…). Vuota = non riconosciuta: non si traduce.
alter table items add column if not exists lang text;

-- Traduzioni già fatte: una riga per contenuto e lingua. Si traduce una volta sola,
-- poi la riga viene riusata per tutti (così il piano gratuito del traduttore basta).
create table if not exists translations (
  item_id    uuid not null references items(id) on delete cascade,
  lang       text not null,
  title      text not null,
  summary    text not null default '',
  created_at timestamptz not null default now(),
  primary key (item_id, lang)
);

alter table translations enable row level security;
grant all on table translations to service_role;
