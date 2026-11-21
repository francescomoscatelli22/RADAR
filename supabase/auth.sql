-- Radar: dati dell'utente (account). Da incollare nel "SQL Editor" di Supabase, una volta sola,
-- DOPO schema.sql.
--
-- Una riga per utente con argomenti scelti, fonti seguite e contenuti salvati.
-- Sicurezza: RLS attiva e UNA sola regola: ognuno legge e scrive SOLO la propria riga
-- (auth.uid() = user_id). Le tabelle dei contenuti restano senza regole pubbliche.

create table if not exists user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at bigint not null default 0   -- millisecondi: decide quale copia è la più recente
);

alter table user_state enable row level security;

drop policy if exists "user_state_own" on user_state;
create policy "user_state_own" on user_state
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Serve anche se in Supabase hai lasciato spenta l'opzione "Grant API access to new tables".
grant usage on schema public to authenticated;
grant select, insert, update, delete on table user_state to authenticated;
