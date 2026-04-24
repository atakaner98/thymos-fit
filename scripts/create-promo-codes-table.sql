-- Supabase SQL Editor'da çalıştır
-- Dashboard → SQL Editor → New query

create table if not exists public.promo_codes (
  id            uuid primary key default gen_random_uuid(),
  waitlist_id   uuid references public.waitlist(id) on delete set null,
  email         text not null,
  code          text not null unique,
  sent_at       timestamptz not null,
  redeemed_at   timestamptz,
  created_at    timestamptz default now()
);

-- Kod araması için index
create index if not exists promo_codes_code_idx  on public.promo_codes (code);
create index if not exists promo_codes_email_idx on public.promo_codes (email);

-- Script service key ile yazacak, RLS'i kapat (ya da service key bypass eder zaten)
alter table public.promo_codes enable row level security;

-- Service role her şeyi yapabilir (otomatik), ek policy gerekmez
