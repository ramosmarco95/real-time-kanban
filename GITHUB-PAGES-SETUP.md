# GitHub Pages Deployment Guide

This document provides specific instructions for deploying the Real-Time Kanban app to GitHub Pages.

## Quick Setup

### 1. Repository Configuration
Make sure your repository is public or you have GitHub Pro for private repositories with Pages.

### 2. Backend Deployment
Deploy your backend to a hosting service that supports Node.js:

**Recommended Options:**
- **Railway** ([railway.app](https://railway.app)) - Easy deployment, built-in PostgreSQL
- **Render** ([render.com](https://render.com)) - Free tier available, PostgreSQL support
- **Heroku** ([heroku.com](https://heroku.com)) - Traditional PaaS, add-on PostgreSQL

### 3. Database Setup
Use **Supabase** for PostgreSQL hosting:
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run the SQL schema from `DEPLOYMENT.md`
4. Get connection string and API keys

### 4. Environment Configuration

Set the following repository secret in GitHub:
- Go to Repository → Settings → Secrets and variables → Actions
- Add secret: `VITE_API_BASE_URL` with your backend URL

Example: `https://your-app-name.railway.app/api`

### 5. Enable GitHub Pages

1. Go to Repository → Settings → Pages
2. Source: **GitHub Actions**
3. Save

### 6. Deploy

Push to the `main` branch and GitHub Actions will automatically:
1. Build the frontend
2. Deploy to GitHub Pages
3. Your site will be available at: `https://yourusername.github.io/real-time-kanban/`

## Local Development

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

## Production URLs

After deployment, your app will be available at:
- **Frontend**: `https://yourusername.github.io/real-time-kanban/`
- **Backend**: `https://your-backend-host.com/api`

## Troubleshooting

### Build Fails
- Check GitHub Actions logs in the Actions tab
- Ensure all dependencies are in package.json
- Verify TypeScript compiles without errors

### CORS Errors
- Update backend CORS configuration to include your GitHub Pages URL
- Example: `https://yourusername.github.io`

### API Not Working
- Verify backend is deployed and running
- Check `VITE_API_BASE_URL` secret is set correctly
- Test API endpoints directly

## Architecture Notes

This setup separates concerns:
- **Static Frontend**: Hosted on GitHub Pages (free)
- **Dynamic Backend**: Hosted on Railway/Render/Heroku
- **Database**: PostgreSQL on Supabase
- **Real-time**: WebSocket connections to backend

This architecture is cost-effective and scalable for most use cases.