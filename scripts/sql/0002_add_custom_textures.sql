-- Add custom_textures column to maps table
alter table maps add column if not exists custom_textures jsonb default '[]'::jsonb;
