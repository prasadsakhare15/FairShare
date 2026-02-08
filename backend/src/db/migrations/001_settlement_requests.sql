-- Migration: Add settlement_requests table for approval flow
-- Run with: psql -U postgres -d fairshare -f src/db/migrations/001_settlement_requests.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'settlement_request_status') THEN
    CREATE TYPE settlement_request_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS settlement_requests (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  initiator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status settlement_request_status NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMPTZ,
  CONSTRAINT valid_settlement_pair CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_settlement_requests_group ON settlement_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_status ON settlement_requests(status);
