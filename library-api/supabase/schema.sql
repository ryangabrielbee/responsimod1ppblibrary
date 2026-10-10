-- Skema peminjaman buku untuk Supabase / Postgres.
-- Jalankan sekali di SQL Editor project Supabase.

create extension if not exists pgcrypto;

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  kode_anggota text not null,
  nama_anggota text not null,
  judul_buku text not null,
  isbn text,
  tanggal_pinjam date not null,
  tanggal_jatuh_tempo date not null,
  tanggal_kembali date,
  status text not null check (status in ('Dipinjam', 'Dikembalikan', 'Terlambat')),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loans_tempo_setelah_pinjam check (tanggal_jatuh_tempo >= tanggal_pinjam),
  constraint loans_kembali_setelah_pinjam check (
    tanggal_kembali is null or tanggal_kembali >= tanggal_pinjam
  )
);

create index if not exists loans_status_idx on public.loans (status);
create index if not exists loans_kode_anggota_idx on public.loans (kode_anggota);
create index if not exists loans_jatuh_tempo_idx on public.loans (tanggal_jatuh_tempo);

alter table public.loans enable row level security;

-- API ini tidak memakai login anggota. Service role melewati RLS.
-- Kebijakan di bawah membuat anon key (jika dipakai) tetap bisa CRUD.
drop policy if exists "loans_select" on public.loans;
drop policy if exists "loans_insert" on public.loans;
drop policy if exists "loans_update" on public.loans;
drop policy if exists "loans_delete" on public.loans;

create policy "loans_select" on public.loans for select using (true);
create policy "loans_insert" on public.loans for insert with check (true);
create policy "loans_update" on public.loans for update using (true) with check (true);
create policy "loans_delete" on public.loans for delete using (true);
