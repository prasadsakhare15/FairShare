-- Migration: Add currency column to user_groups
-- Run this on an existing database that already has the user_groups table.

ALTER TABLE user_groups
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR';
