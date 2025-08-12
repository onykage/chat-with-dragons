-- Maps store the tile grid as JSONB
create table if not exists maps (
  id uuid primary key,
  name text not null,
  width int not null,
  height int not null,
  tiles jsonb not null,
  created_at timestamptz not null default now()
);

-- Heroes (scaffold)
create table if not exists heroes (
  id uuid primary key,
  name text not null,
  level int not null default 1,
  skills jsonb not null default '[]'::jsonb,
  inventory jsonb not null default '[]'::jsonb,
  map_id uuid references maps(id) on delete set null,
  x int not null default 0,
  y int not null default 0,
  created_at timestamptz not null default now()
);

-- Parties (optional future work)
create table if not exists parties (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists party_members (
  party_id uuid references parties(id) on delete cascade,
  hero_id uuid references heroes(id) on delete cascade,
  primary key (party_id, hero_id)
);
