-- Add table for storing generated dungeons
create table if not exists generated_dungeons (
  id text primary key,
  guild text not null,
  dungeon_number int not null,
  level int not null default 1,
  width int not null,
  height int not null,
  tiles jsonb not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(guild, dungeon_number, level)
);

-- Add index for faster lookups
create index if not exists idx_generated_dungeons_guild_number on generated_dungeons(guild, dungeon_number);
