-- ReceiptVault — Supabase SQL Schema
-- Run this entire file in the Supabase SQL Editor before starting the app.
-- Enable the uuid-ossp extension first (already on by default in Supabase).

-- ─────────────────────────────────────────────
-- TABLE: receipts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone           TEXT NOT NULL,
  store_name           TEXT NOT NULL DEFAULT 'Unknown Store',
  purchase_date        DATE,
  total_amount         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency             CHAR(3)        NOT NULL DEFAULT 'INR',
  r2_image_url         TEXT,
  return_deadline_date DATE,
  warranty_expiry_date DATE,
  receipt_number       TEXT,
  date_inferred        BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user_phone       ON receipts (user_phone);
CREATE INDEX IF NOT EXISTS idx_receipts_return_deadline  ON receipts (return_deadline_date) WHERE return_deadline_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_purchase_date    ON receipts (purchase_date);

-- ─────────────────────────────────────────────
-- TABLE: gmail_accounts
-- Stores Gmail consent and refresh token per user.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gmail_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email                 TEXT NOT NULL UNIQUE,
  google_refresh_token  TEXT,
  consented_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status                TEXT NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gmail_accounts_user_id  ON gmail_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_status   ON gmail_accounts (status);

-- ─────────────────────────────────────────────
-- TABLE: receipt_items
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipt_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id    UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  quantity      NUMERIC(10, 3) NOT NULL DEFAULT 1,
  unit_price    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_consumable BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id    ON receipt_items (receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_is_consumable ON receipt_items (is_consumable) WHERE is_consumable = TRUE;

-- ─────────────────────────────────────────────
-- TABLE: subscriptions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone        TEXT           NOT NULL,
  service_name      TEXT           NOT NULL,
  renewal_amount    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency          CHAR(3)        NOT NULL DEFAULT 'INR',
  renewal_date      DATE           NOT NULL,
  cancellation_url  TEXT,
  status            TEXT           NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'cancelled', 'paused'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_phone    ON subscriptions (user_phone);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date  ON subscriptions (renewal_date) WHERE status = 'active';

-- ─────────────────────────────────────────────
-- SAMPLE TEST DATA  (delete before production)
-- ─────────────────────────────────────────────

-- Replace +919999999999 with your own TEST_PHONE number.

-- A receipt with a return deadline 3 days from now (triggers deadline-watch)
INSERT INTO receipts (user_phone, store_name, purchase_date, total_amount, currency, return_deadline_date)
VALUES (
  '+919999999999',
  'Croma',
  CURRENT_DATE - INTERVAL '7 days',
  4999.00,
  'INR',
  CURRENT_DATE + INTERVAL '3 days'
);

-- Receipt items including consumables (triggers consumable-tracker)
INSERT INTO receipt_items (receipt_id, name, quantity, unit_price, total_price, is_consumable)
SELECT
  id,
  'Amul Milk',
  2,
  30.00,
  60.00,
  TRUE
FROM receipts WHERE store_name = 'Croma' LIMIT 1;

-- A subscription renewing in 5 days (triggers sub-manager)
INSERT INTO subscriptions (user_phone, service_name, renewal_amount, currency, renewal_date, cancellation_url, status)
VALUES (
  '+919999999999',
  'Netflix',
  649.00,
  'INR',
  CURRENT_DATE + INTERVAL '5 days',
  'https://www.netflix.com/cancelplan',
  'active'
);
