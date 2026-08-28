create table if not exists public.board_games (
  id text primary key,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  name_zh text not null, name_en text not null default '', category text not null default '德式', sku text not null default '',
  min_players integer not null default 1 check (min_players > 0), max_players integer not null default 4 check (max_players >= min_players), age integer not null default 8 check (age >= 0), duration integer not null default 60 check (duration >= 0), weight numeric(2,1) not null default 2.0 check (weight between 1.0 and 5.0), total_sets integer not null default 1 check (total_sets >= 0),
  status text not null default '店内可游玩', location text not null default '', bundles text not null default '', images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.board_games enable row level security;
grant select, insert, update, delete on table public.board_games to authenticated;
drop policy if exists "Staff can view their own board games" on public.board_games;
drop policy if exists "Staff can add their own board games" on public.board_games;
drop policy if exists "Staff can edit their own board games" on public.board_games;
drop policy if exists "Staff can delete their own board games" on public.board_games;
create policy "Signed-in staff can view shared board games" on public.board_games for select to authenticated using (true);
create policy "Signed-in staff can add shared board games" on public.board_games for insert to authenticated with check ((select auth.uid()) is not null);
create policy "Signed-in staff can edit shared board games" on public.board_games for update to authenticated using (true) with check ((select auth.uid()) is not null);
create policy "Signed-in staff can delete shared board games" on public.board_games for delete to authenticated using (true);
create or replace function public.set_board_games_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;
drop trigger if exists board_games_updated_at on public.board_games;
create trigger board_games_updated_at before update on public.board_games
for each row execute function public.set_board_games_updated_at();
do $$ begin alter publication supabase_realtime add table public.board_games; exception when duplicate_object then null; end $$;
