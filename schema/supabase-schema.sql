-- SETUP SCRIPT FOR SPOTIFY SONG OF THE DAY APP

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- Drop existing RLS policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own song history" ON public.song_history;
DROP POLICY IF EXISTS "Users can insert their own song history" ON public.song_history;
DROP POLICY IF EXISTS "Users can update their own song history" ON public.song_history;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;
DROP POLICY IF EXISTS "Anyone can update users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view song history" ON public.song_history;
DROP POLICY IF EXISTS "Anyone can insert song history" ON public.song_history;
DROP POLICY IF EXISTS "Anyone can update song history" ON public.song_history;

-- -----------------------------------------------------
-- Drop triggers explicitly
-- -----------------------------------------------------
DROP TRIGGER IF EXISTS users_updated_at ON public.users;

-- -----------------------------------------------------
-- Drop functions and tables
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS handle_updated_at CASCADE;
DROP FUNCTION IF EXISTS immutable_date_trunc CASCADE;
DROP FUNCTION IF EXISTS save_song_of_day CASCADE;
DROP INDEX IF EXISTS unique_song_per_day_per_user;
DROP INDEX IF EXISTS song_history_user_id_index;
DROP INDEX IF EXISTS song_history_revealed_at_index;
DROP TABLE IF EXISTS public.song_history;
DROP TABLE IF EXISTS public.users;

-- -----------------------------------------------------
-- Create users table
-- -----------------------------------------------------
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT UNIQUE,
  spotify_id TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to users table for updated_at
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- -----------------------------------------------------
-- Function to get date part in an immutable way
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION immutable_date_trunc(text, timestamp with time zone)
RETURNS timestamp with time zone
LANGUAGE SQL IMMUTABLE
AS $$
  SELECT date_trunc($1, $2)
$$;

-- -----------------------------------------------------
-- Create song_history table
-- -----------------------------------------------------
CREATE TABLE public.song_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  song_id TEXT NOT NULL,
  song_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT NOT NULL,
  album_image_url TEXT,
  revealed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  popularity INTEGER,
  external_url TEXT
);

-- Create a unique index for one song per day
CREATE UNIQUE INDEX unique_song_per_day_per_user 
ON public.song_history (user_id, immutable_date_trunc('day', revealed_at));

-- -----------------------------------------------------
-- Create indexes for better performance
-- -----------------------------------------------------
CREATE INDEX song_history_user_id_index ON public.song_history(user_id);
CREATE INDEX song_history_revealed_at_index ON public.song_history(revealed_at);

-- -----------------------------------------------------
-- Set up Row Level Security (RLS)
-- -----------------------------------------------------
-- Enable RLS on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_history ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies for users table that work without auth
CREATE POLICY "Anyone can view users"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON public.users
  FOR UPDATE
  USING (true);

-- Create new RLS policies for song_history table
CREATE POLICY "Anyone can view song history"
  ON public.song_history
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert song history"
  ON public.song_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update song history"
  ON public.song_history
  FOR UPDATE
  USING (true);

-- -----------------------------------------------------
-- Grant necessary permissions
-- -----------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.song_history TO anon, authenticated;
GRANT EXECUTE ON FUNCTION immutable_date_trunc TO anon, authenticated;
GRANT EXECUTE ON FUNCTION handle_updated_at TO anon, authenticated; 