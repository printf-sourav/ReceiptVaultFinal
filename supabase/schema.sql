-- ================================================================
-- ReceiptVault — Full Supabase Schema
-- Run this entire file in SQL Editor → New Query
-- ================================================================

-- ----------------------------------------------------------------
-- TABLE 1: users
-- One row per WhatsApp phone number that has used the bot.
-- ----------------------------------------------------------------
create table if not exists users (
  id              uuid primary key default gen_random_uuid(),
  phone           text not null unique,          -- international format: 919876543210
  display_name    text,
  email           text,
  created_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- TABLE 1B: gmail_accounts
-- Stores Gmail consent and refresh token per user.
-- ----------------------------------------------------------------
create table if not exists gmail_accounts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id) on delete cascade unique,
  email                 text not null unique,
  google_refresh_token  text,
  consented_at          timestamptz not null default now(),
  status                text not null default 'pending', -- 'pending' | 'active' | 'revoked'
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- TABLE 2: receipts
-- One row per scanned receipt (WhatsApp photo or Gmail email).
-- ----------------------------------------------------------------
create table if not exists receipts (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references users(id) on delete cascade,
  user_phone              text not null,                    -- denormalised for fast lookups
  store_name              text not null default 'Unknown Store',
  purchase_date           date,
  total_amount            numeric(10,2) not null default 0,
  currency                char(3) not null default 'INR',
  r2_image_url            text,                             -- Cloudflare R2 public URL
  return_deadline_date    date,                             -- computed: purchase_date + return_deadline_days
  warranty_expiry_date    date,                             -- computed: purchase_date + warranty_months*30
  receipt_number          text,
  date_inferred           boolean not null default false,   -- true if Gemini could not read the date
  source                  text not null default 'whatsapp', -- 'whatsapp' | 'gmail'
  gemini_raw              jsonb,                            -- raw JSON blob returned by Gemini
  created_at              timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- TABLE 3: receipt_items
-- One row per line item within a receipt.
-- ----------------------------------------------------------------
create table if not exists receipt_items (
  id             uuid primary key default gen_random_uuid(),
  receipt_id     uuid not null references receipts(id) on delete cascade,
  name           text not null,
  quantity       numeric(8,2) not null default 1,
  unit_price     numeric(10,2) not null default 0,
  total_price    numeric(10,2) not null default 0,
  is_consumable  boolean not null default false,   -- used by consumable-tracker skill
  category       text                              -- optional: 'food', 'electronics', etc.
);

-- ----------------------------------------------------------------
-- TABLE 4: subscriptions
-- Tracked subscriptions (Netflix, Spotify, etc.).
-- ----------------------------------------------------------------
create table if not exists subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete cascade,
  user_phone        text not null,
  service_name      text not null,
  renewal_amount    numeric(10,2) not null,
  currency          char(3) not null default 'INR',
  renewal_date      date not null,
  billing_cycle     text not null default 'monthly',  -- 'monthly' | 'annual' | 'weekly'
  status            text not null default 'active',   -- 'active' | 'cancelled' | 'paused'
  cancellation_url  text,
  notes             text,
  created_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- TABLE 5: alerts_queue
-- Durable record of every alert that has been sent or is pending.
-- BullMQ handles in-flight scheduling; this table is the audit log.
-- ----------------------------------------------------------------
create table if not exists alerts_queue (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade,
  user_phone     text not null,
  receipt_id     uuid references receipts(id) on delete set null,
  alert_type     text not null,        -- 'return_deadline' | 'warranty_expiry' | 'reorder' | 'subscription'
  scheduled_for  timestamptz not null,
  sent_at        timestamptz,          -- null = not yet sent
  status         text not null default 'pending',  -- 'pending' | 'sent' | 'failed' | 'cancelled'
  message_text   text,                -- the exact WhatsApp message body
  payload        jsonb,               -- extra data (days_remaining, store_name, etc.)
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- TABLE 6: price_history
-- Tracks price of items across receipts for price-drop detection.
-- ----------------------------------------------------------------
create table if not exists price_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  user_phone   text not null,
  item_name    text not null,           -- normalised lowercase item name
  store_name   text not null,
  unit_price   numeric(10,2) not null,
  currency     char(3) not null default 'INR',
  receipt_id   uuid references receipts(id) on delete set null,
  purchased_at date not null,
  created_at   timestamptz not null default now()
);

-- ================================================================
-- INDEXES
-- ================================================================

-- receipts: most queried columns
create index if not exists idx_receipts_user_id              on receipts(user_id);
create index if not exists idx_receipts_user_phone           on receipts(user_phone);
create index if not exists idx_receipts_return_deadline      on receipts(return_deadline_date);
create index if not exists idx_receipts_warranty_expiry      on receipts(warranty_expiry_date);
create index if not exists idx_receipts_purchase_date        on receipts(purchase_date);

-- receipt_items: joined frequently with receipts
create index if not exists idx_receipt_items_receipt_id      on receipt_items(receipt_id);
create index if not exists idx_receipt_items_is_consumable   on receipt_items(is_consumable);
create index if not exists idx_receipt_items_name            on receipt_items(name);

-- subscriptions: daily cron scans by user + status + date
create index if not exists idx_subscriptions_user_phone      on subscriptions(user_phone);
create index if not exists idx_subscriptions_status_date     on subscriptions(status, renewal_date);

-- alerts_queue: scheduler checks pending alerts by scheduled_for
create index if not exists idx_alerts_queue_status           on alerts_queue(status, scheduled_for);
create index if not exists idx_alerts_queue_user_phone       on alerts_queue(user_phone);

-- price_history: grouped by user + item for price-drop detection
create index if not exists idx_price_history_user_item       on price_history(user_phone, item_name);
create index if not exists idx_price_history_purchased_at    on price_history(purchased_at);
create index if not exists idx_gmail_accounts_user_id         on gmail_accounts(user_id);
create index if not exists idx_gmail_accounts_status          on gmail_accounts(status);

-- ================================================================
-- ROW LEVEL SECURITY
-- Enabled on all tables with permissive policies (no auth yet).
-- When you add Supabase Auth, replace these with user-scoped policies.
-- ================================================================

alter table users           enable row level security;
alter table gmail_accounts  enable row level security;
alter table receipts        enable row level security;
alter table receipt_items   enable row level security;
alter table subscriptions   enable row level security;
alter table alerts_queue    enable row level security;
alter table price_history   enable row level security;

-- Permissive: allow all operations from the service_role key
-- (your backend uses service_role, so these policies apply to anon/authenticated only)
create policy "allow_all_users"         on users           for all using (true) with check (true);
create policy "allow_all_gmail_accounts" on gmail_accounts  for all using (true) with check (true);
create policy "allow_all_receipts"      on receipts        for all using (true) with check (true);
create policy "allow_all_items"         on receipt_items   for all using (true) with check (true);
create policy "allow_all_subscriptions" on subscriptions   for all using (true) with check (true);
create policy "allow_all_alerts"        on alerts_queue    for all using (true) with check (true);
create policy "allow_all_price_history" on price_history   for all using (true) with check (true);

-- ================================================================
-- SEED: Insert a test user so FK constraints work during testing
-- Replace the phone number with your own WhatsApp number.
-- ================================================================

insert into users (phone, display_name)
values ('910000000000', 'Test User')
on conflict (phone) do nothing;
