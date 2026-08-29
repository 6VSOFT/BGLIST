create table if not exists public.wolf_judge_notes (
  id text primary key,
  title text not null default '未命名对局',
  game_date date,
  variant text not null default '',
  round text not null default '',
  content text not null default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wolf_judge_notes enable row level security;
grant select, insert, update, delete on table public.wolf_judge_notes to authenticated;
create policy "Signed-in staff can view shared judge notes" on public.wolf_judge_notes for select to authenticated using (true);
create policy "Signed-in staff can add shared judge notes" on public.wolf_judge_notes for insert to authenticated with check ((select auth.uid()) is not null);
create policy "Signed-in staff can edit shared judge notes" on public.wolf_judge_notes for update to authenticated using (true) with check ((select auth.uid()) is not null);
create policy "Signed-in staff can delete shared judge notes" on public.wolf_judge_notes for delete to authenticated using (true);

create or replace function public.set_wolf_judge_notes_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;
drop trigger if exists wolf_judge_notes_updated_at on public.wolf_judge_notes;
create trigger wolf_judge_notes_updated_at before update on public.wolf_judge_notes
for each row execute function public.set_wolf_judge_notes_updated_at();
