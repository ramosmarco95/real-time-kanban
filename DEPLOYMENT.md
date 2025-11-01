# Deployment Guide: Supabase + Netlify

This guide walks you through deploying your Real-Time Kanban app using Supabase as the database and Netlify for hosting.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **GitHub Repository**: Your code should be in a GitHub repo
4. **Node.js & pnpm**: Ensure you have Node.js 18+ and pnpm installed

## Step 1: Set up Supabase

### 1.1 Create a New Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created (usually takes 2-3 minutes)

### 1.2 Get Connection Details
1. Go to **Settings > Database**
2. Copy the connection string from "Connection string" section
3. Go to **Settings > API**
4. Copy your project URL and anon key

### 1.3 Set up Database Schema
1. Go to the **SQL Editor** in your Supabase dashboard
2. Run the following SQL to create your tables:

```sql
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
```

## Step 2: Configure Local Environment

### 2.1 Server Environment
1. Copy `apps/server/.env.example` to `apps/server/.env`
2. Update with your Supabase credentials:

```bash
# Environment
NODE_ENV=development
PORT=3001

# Supabase Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# CORS
CORS_ORIGIN="http://localhost:5173"

# JWT (for future authentication)
JWT_SECRET="your-jwt-secret-here"
```

### 2.2 Web Environment
1. Copy `apps/web/.env.example` to `apps/web/.env`
2. Update with your Supabase credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]

# API Configuration (for development)
VITE_API_BASE_URL=http://localhost:3001/api
```

### 2.3 Initialize Database
```bash
# Navigate to server directory
cd apps/server

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed the database (optional)
pnpm db:seed
```

## Step 3: Deploy to Netlify

### 3.1 Connect Repository
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Netlify should detect the `netlify.toml` configuration automatically

### 3.2 Configure Environment Variables
In your Netlify site settings, go to **Environment variables** and add:

```
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 3.3 Configure Build Settings
Netlify should automatically detect these from `netlify.toml`, but verify:
- **Build command**: `pnpm run build`
- **Publish directory**: `apps/web/dist`
- **Functions directory**: `netlify/functions`

### 3.4 Deploy
1. Click "Deploy site"
2. Wait for the build to complete
3. Your site will be available at a Netlify URL (e.g., `https://amazing-kanban-123.netlify.app`)

## Step 4: Update CORS Settings

### 4.1 Update Supabase CORS
1. In your Supabase dashboard, go to **Authentication > Settings**
2. Under "Site URL", add your Netlify URL
3. Under "Redirect URLs", add your Netlify URL + `/auth/callback`

### 4.2 Test Your Deployment
1. Visit your Netlify URL
2. Test creating boards, columns, and cards
3. Verify real-time updates work (open in multiple tabs)

## Step 5: Custom Domain (Optional)

### 5.1 Configure Custom Domain
1. In Netlify, go to **Domain settings**
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

### 5.2 Update Environment Variables
Update your environment variables to use your custom domain instead of the Netlify subdomain.

## Development Workflow

### Local Development
```bash
# Start development servers
pnpm dev

# This starts both web (port 5173) and server (port 3001)
```

### Production Deployment
```bash
# Build and deploy
pnpm run deploy

# Or just build for preview
pnpm run preview
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify your DATABASE_URL is correct
   - Ensure your IP is allowed in Supabase (or disable IP restrictions)
   - Check if the database is accessible

2. **CORS Errors**
   - Update CORS_ORIGIN in your environment variables
   - Verify Supabase CORS settings

3. **Build Failures**
   - Check that all environment variables are set in Netlify
   - Verify TypeScript errors are resolved
   - Ensure all dependencies are properly installed

4. **Function Errors**
   - Check Netlify function logs
   - Verify the functions are being built correctly
   - Test functions locally with `netlify dev`

### Useful Commands

```bash
# Test locally with Netlify CLI
npx netlify dev

# View Netlify logs
npx netlify logs

# Preview deployment
npx netlify deploy

# Production deployment
npx netlify deploy --prod
```

## Next Steps

1. **Authentication**: Implement user authentication using Supabase Auth
2. **Real-time Updates**: Use Supabase Realtime for live data synchronization
3. **File Uploads**: Add card attachments using Supabase Storage
4. **Monitoring**: Set up error tracking and analytics
5. **Performance**: Implement caching and optimization strategies

## Support

- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Prisma Documentation**: [prisma.io/docs](https://prisma.io/docs)