-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'manager', 'salesperson')),
  active boolean default true,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products Table
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  base_commission_rate numeric not null,
  commission_type text not null check (commission_type in ('percentage_on_sale', 'percentage_on_profit')),
  base_cost numeric,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sales Table
create table sales (
  id uuid primary key default uuid_generate_v4(),
  client_type text not null,
  responsible_name text not null,
  student_name text,
  amount numeric not null,
  date date not null,
  campaign text,
  salesperson_id uuid references users(id),
  product_id uuid references products(id),
  installment_start_date date not null,
  due_day integer not null,
  status text not null default 'Completed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Installments Table
create table installments (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id) on delete cascade,
  installment_number integer not null,
  total_installments integer not null,
  due_date date not null,
  amount numeric not null,
  commission_amount numeric not null,
  client_paid boolean default false,
  seller_paid boolean default false,
  paid_date timestamp with time zone,
  status text default 'Pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Seed Data (Users)
insert into users (name, email, role, active, avatar_url) values
('Administrador', 'admin@improve.com', 'admin', true, 'https://i.pravatar.cc/150?u=admin'),
('Gerente Comercial', 'gerente@improve.com', 'manager', true, 'https://i.pravatar.cc/150?u=manager'),
('João Silva', 'joao@improve.com', 'salesperson', true, 'https://i.pravatar.cc/150?u=joao'),
('Maria Souza', 'maria@improve.com', 'salesperson', true, 'https://i.pravatar.cc/150?u=maria');

-- Insert Seed Data (Products)
insert into products (name, description, base_commission_rate, commission_type, base_cost, active) values
('Curso de Inglês - Semestral', 'Curso completo de inglês (6 meses)', 10, 'percentage_on_sale', null, true),
('Material Didático', 'Kit de livros e acesso online', 15, 'percentage_on_profit', 150.00, true),
('Preparatório TOEFL', 'Curso intensivo para certificação', 12, 'percentage_on_sale', null, true);
