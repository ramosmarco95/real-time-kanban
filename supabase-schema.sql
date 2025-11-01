-- Real-Time Kanban Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  "order" REAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, "order")
);

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "order" REAL NOT NULL,
  assigned_to UUID REFERENCES users(id),
  labels TEXT, -- JSON array stored as text
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(column_id, "order")
);

-- Create indexes for better performance
CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_cards_column_id ON cards(column_id);
CREATE INDEX idx_cards_assigned_to ON cards(assigned_to);

-- Insert sample data for testing
INSERT INTO boards (id, title, description) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Sample Board', 'A demo board to get you started');

INSERT INTO columns (id, board_id, title, "order") VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'To Do', 1),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'In Progress', 2),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Done', 3);

INSERT INTO cards (column_id, title, description, "order") VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Welcome to your Kanban board!', 'This is a sample card. You can edit or delete it.', 1),
  ('550e8400-e29b-41d4-a716-446655440001', 'Create your first real task', 'Add some actual work items to get started.', 2),
  ('550e8400-e29b-41d4-a716-446655440002', 'Set up your team', 'Invite team members to collaborate on this board.', 1),
  ('550e8400-e29b-41d4-a716-446655440003', 'Complete setup', 'You have successfully set up your Kanban board!', 1);