/*
  # Initial Database Schema

  1. New Tables
    - `users` - User accounts with roles
    - `materials` - Available construction materials
    - `categories` - Material categories
    - `prices` - Price list entries
    - `calculations` - Saved calculations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by authenticated users" 
  ON categories FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Categories are editable by admins" 
  ON categories FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  unit text NOT NULL,
  category_id uuid REFERENCES categories(id),
  overall_width numeric(10,2),
  working_width numeric(10,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materials are viewable by authenticated users" 
  ON materials FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Materials are editable by admins" 
  ON materials FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Prices table
CREATE TABLE IF NOT EXISTS prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES materials(id),
  coating text NOT NULL,
  thickness numeric(10,2) NOT NULL,
  price numeric(10,2) NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prices are viewable by authenticated users" 
  ON prices FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Prices are editable by admins" 
  ON prices FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Calculations table
CREATE TABLE IF NOT EXISTS calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calculations" 
  ON calculations FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calculations" 
  ON calculations FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calculations" 
  ON calculations FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calculations" 
  ON calculations FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS materials_category_id_idx ON materials(category_id);
CREATE INDEX IF NOT EXISTS prices_material_id_idx ON prices(material_id);
CREATE INDEX IF NOT EXISTS calculations_user_id_idx ON calculations(user_id);
CREATE INDEX IF NOT EXISTS calculations_type_idx ON calculations(type);