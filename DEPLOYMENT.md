# Deployment Guide: GitHub Pages + Backend Services

This guide walks you through deploying your Real-Time Kanban app using GitHub Pages for the frontend and various backend hosting options.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Backend Hosting Account**: Railway, Render, Heroku, or similar
3. **Database Service**: Supabase, PlanetScale, or PostgreSQL hosting
4. **Node.js & pnpm**: Ensure you have Node.js 18+ and pnpm installed

## Deployment Architecture

- **Frontend**: GitHub Pages (static hosting)
- **Backend**: Railway/Render/Heroku (Node.js API server)
- **Database**: Supabase/PlanetScale (PostgreSQL)
- **Real-time**: WebSocket server with Socket.IO

## Step 1: Set up Database (Supabase)

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
  password VARCHAR(255) NOT NULL,
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

-- Insert sample data
INSERT INTO boards (id, title, description) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Sample Board', 'A sample Kanban board for testing');

INSERT INTO columns (id, board_id, title, "order") VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'To Do', 1),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'In Progress', 2),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Done', 3);

INSERT INTO cards (id, column_id, title, description, "order") VALUES 
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Plan project architecture', 'Define the overall structure and components', 1),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Set up development environment', 'Install necessary tools and dependencies', 2),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Implement drag and drop', 'Add card movement functionality', 1),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Initial setup complete', 'Project structure and basic features', 1);
```

## Step 2: Deploy Backend

### Option A: Railway Deployment

1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **Create New Project**: Connect your GitHub repository
3. **Configure Environment Variables**:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   JWT_SECRET=your-secure-jwt-secret-here
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://yourusername.github.io
   ```
4. **Set Root Directory**: Set to `apps/server`
5. **Deploy**: Railway will automatically build and deploy

### Option B: Render Deployment

1. **Create Render Account**: Go to [render.com](https://render.com)
2. **Create Web Service**: Connect your GitHub repository
3. **Configure Build Settings**:
   - **Root Directory**: `apps/server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Set Environment Variables** (same as Railway above)

### Option C: Heroku Deployment

1. **Create Heroku Account**: Go to [heroku.com](https://heroku.com)
2. **Install Heroku CLI** and login
3. **Create and Deploy**:
   ```bash
   # Create Heroku app
   heroku create your-kanban-api
   
   # Set environment variables
   heroku config:set DATABASE_URL="your-supabase-url"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN="https://yourusername.github.io"
   
   # Deploy
   git subtree push --prefix apps/server heroku main
   ```

## Step 3: Configure Frontend for GitHub Pages

### 3.1 Update Environment Configuration
Create or update `apps/web/.env.production`:

```bash
# Your deployed backend URL
VITE_API_BASE_URL=https://your-api-domain.railway.app/api
# or https://your-api-domain.onrender.com/api
# or https://your-kanban-api.herokuapp.com/api
```

### 3.2 Update Vite Configuration
Ensure `apps/web/vite.config.ts` is configured for GitHub Pages:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/real-time-kanban/', // Replace with your repository name
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    host: true,
    port: 5173
  }
})
```

### 3.3 Update API Base URL
Update `apps/web/src/services/api.ts` to use environment variable:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
```

## Step 4: Set up GitHub Pages Deployment

### 4.1 Create GitHub Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build shared package
      run: pnpm run --filter ./packages/shared build
      
    - name: Build web app
      run: pnpm run --filter ./apps/web build
      env:
        VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./apps/web/dist
```

### 4.2 Configure Repository Settings

1. **Go to Repository Settings**:
   - Navigate to your GitHub repository
   - Click on "Settings" tab

2. **Configure Secrets**:
   - Go to "Secrets and variables" > "Actions"
   - Add repository secret:
     - `VITE_API_BASE_URL`: Your deployed backend URL

3. **Enable GitHub Pages**:
   - Go to "Pages" section
   - Source: "GitHub Actions"
   - The workflow will automatically deploy on push to main

### 4.3 Update Backend CORS

Update your backend's CORS configuration to allow your GitHub Pages URL:

```typescript
// In your backend CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://yourusername.github.io' // Add your GitHub Pages URL
  ],
  credentials: true
};
```

## Step 5: Test Your Deployment

### 5.1 Verify Backend
1. Test your backend API endpoints
2. Check database connections
3. Verify WebSocket connections

### 5.2 Test Frontend
1. Visit your GitHub Pages URL: `https://yourusername.github.io/real-time-kanban/`
2. Test authentication (register/login)
3. Test board creation and card management
4. Verify real-time updates work

## Development Workflow

### Local Development
```bash
# Start development servers
pnpm dev

# This starts both web (port 5173) and server (port 3001)
```

### Production Deployment
```bash
# Deploy backend (if using git-based deployment)
git push origin main

# Frontend will auto-deploy via GitHub Actions
git push origin main
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify backend CORS settings include your GitHub Pages URL
   - Check API URL is correctly set in environment variables

2. **Build Failures**
   - Ensure all dependencies are correctly specified
   - Check TypeScript errors
   - Verify environment variables are set in GitHub Secrets

3. **API Connection Issues**
   - Verify backend is deployed and accessible
   - Check API endpoints are responding
   - Ensure WebSocket connections work

4. **GitHub Pages Not Loading**
   - Check if base URL is correctly set in Vite config
   - Verify GitHub Pages is enabled in repository settings
   - Check GitHub Actions workflow logs

### Useful Commands

```bash
# Test build locally
pnpm run build
pnpm run preview

# Check for TypeScript errors
pnpm run type-check

# Test backend locally
cd apps/server
npm run dev
```

## Alternative Deployment Options

### Vercel (Full-Stack)
- Deploy both frontend and backend API routes
- Built-in PostgreSQL database support
- Automatic deployments from Git

### Railway (Full-Stack)
- Deploy monorepo with both apps
- Built-in PostgreSQL database
- Simple environment variable management

### Render (Full-Stack)
- Deploy static site + web service
- PostgreSQL database available
- Free tier available

## Next Steps

1. **Custom Domain**: Configure a custom domain for your GitHub Pages site
2. **SSL Certificate**: GitHub Pages provides HTTPS automatically
3. **Performance**: Implement caching strategies and CDN
4. **Monitoring**: Set up error tracking and analytics
5. **CI/CD**: Enhance workflow with testing and linting

## Support

- **GitHub Pages Documentation**: [docs.github.com/pages](https://docs.github.com/pages)
- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)