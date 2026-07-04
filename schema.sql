-- schema.sql
-- Run this in your Supabase SQL Editor to initialize the invitations table

create table if not exists public.invitations (
  id uuid default gen_random_uuid() primary key,
  movie_title text not null,
  movie_poster text,
  movie_backdrop text,
  streaming_url text not null,
  partner_name text not null,
  sender_name text not null,
  date text not null,
  time text not null,
  location text not null,
  letter text not null,
  theme text not null default 'light', -- 'light' | 'luxury'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table public.invitations enable row level security;

-- Drop existing policies if they exist to avoid duplication errors
drop policy if exists "Allow public read access" on public.invitations;
drop policy if exists "Allow public write access" on public.invitations;

-- Create policies that allow anyone to view an invitation and anyone to create one
create policy "Allow public read access" on public.invitations
  for select using (true);

create policy "Allow public write access" on public.invitations
  for insert with check (true);
