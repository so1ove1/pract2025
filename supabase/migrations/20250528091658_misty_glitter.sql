-- Create users table
create table public.users (
  id uuid primary key default gen_random_uuid(),
  login text unique not null,
  name text not null,
  role text not null default 'user',
  last_login timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Create RLS policies
create policy "Users can read their own data" on users
  for select using (auth.uid() = id);

create policy "Admins can read all users" on users
  for select using (auth.role() = 'admin');

-- Create categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.categories enable row level security;

-- Create RLS policies
create policy "Anyone can read categories" on categories
  for select using (true);

create policy "Only admins can modify categories" on categories
  using (auth.role() = 'admin');

-- Create materials table
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  unit text not null,
  category_id uuid references public.categories(id),
  overall_width numeric(10,2),
  working_width numeric(10,2),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.materials enable row level security;

-- Create RLS policies
create policy "Anyone can read materials" on materials
  for select using (true);

create policy "Only admins can modify materials" on materials
  using (auth.role() = 'admin');

-- Create prices table
create table public.prices (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials(id),
  coating text not null,
  thickness numeric(10,2) not null,
  price numeric(10,2) not null,
  date date not null default current_date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.prices enable row level security;

-- Create RLS policies
create policy "Anyone can read prices" on prices
  for select using (true);

create policy "Only admins can modify prices" on prices
  using (auth.role() = 'admin');

-- Create calculations table
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  type text not null,
  amount numeric(10,2) not null,
  details jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.calculations enable row level security;

-- Create RLS policies
create policy "Users can read their own calculations" on calculations
  for select using (auth.uid() = user_id);

create policy "Users can insert their own calculations" on calculations
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own calculations" on calculations
  for update using (auth.uid() = user_id);

create policy "Users can delete their own calculations" on calculations
  for delete using (auth.uid() = user_id);