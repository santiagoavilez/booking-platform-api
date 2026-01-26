-- Drop existing users table and recreate with correct column order
-- WARNING: This will delete all existing user data (acceptable in development)
DROP TABLE IF EXISTS "users" CASCADE;--> statement-breakpoint

CREATE TABLE "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "password_hash" text NOT NULL,
  "role" "role" NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);