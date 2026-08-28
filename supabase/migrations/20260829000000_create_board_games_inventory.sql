create table if not exists public.board_games (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name_zh text not null, name_en text not null default '', category text not null default '德式', sku text not null default '',
  min_players integer not null default 1 check (min_players > 0), max_players integer not null default 4 check (max_players >= min_players), age integer not null default 8 check (age >= 0), duration integer not null default 60 check (duration >= 0), weight numeric(2,1) not null default 2.0 check (weight between 1.0 and 5.0), total_sets integer not null default 1 check (total_sets >= 0),
  status text not null default '店内可游玩', location text not null default '', bundles text not null default '', images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists board_games_owner_id_idx on public.board_games(owner_id);
alter table public.board_games enable row level security;
grant select, insert, update, delete on table public.board_games to authenticated;
create policy "Staff can view their own board games" on public.board_games for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Staff can add their own board games" on public.board_games for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Staff can edit their own board games" on public.board_games for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Staff can delete their own board games" on public.board_games for delete to authenticated using ((select auth.uid()) = owner_id);
do $$ begin alter publication supabase_realtime add table public.board_games; exception when duplicate_object then null; end $$;
