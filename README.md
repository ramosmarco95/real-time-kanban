# Real-Time Kanban Board

A modern, real-time collaborative Kanban board built with React, TypeScript, Node.js, and WebSockets.

## 🚀 Features

- **Real-time collaboration** - See changes from other users instantly
- **Drag & drop** - Intuitive card movement with smooth animations
- **Optimistic updates** - Immediate UI feedback with rollback on errors
- **User presence** - See who's online and editing cards
- **Card locking** - Prevent conflicts when multiple users edit
- **Responsive design** - Works on desktop and mobile
- **Type-safe** - Full TypeScript support across the stack

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Zustand + dnd-kit
- **Backend**: Node.js + Express + Socket.IO + Prisma
- **Database**: SQLite (easily changeable to PostgreSQL/MySQL)
- **Real-time**: WebSocket connections with Socket.IO
- **Monorepo**: pnpm workspaces with shared types

## 📦 Project Structure

```
real-time-kanban/
├── apps/
│   ├── web/          # React frontend
│   └── server/       # Node.js backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── package.json      # Root package.json
└── pnpm-workspace.yaml
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd real-time-kanban
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up the database:
   ```bash
   cd apps/server
   cp .env.example .env
   pnpm db:migrate
   pnpm db:seed
   ```

4. Start the development servers:
   ```bash
   # From the root directory
   pnpm dev
   ```

This will start:
- Frontend at http://localhost:5173
- Backend at http://localhost:3001
- API at http://localhost:3001/api

### Using the Application

1. Open http://localhost:5173 in your browser
2. Enter the board ID: `sample-board` (created by the seed script)
3. Start moving cards around and see real-time updates!

Try opening multiple browser tabs to see real-time collaboration in action.

## 🧪 Testing the Real-Time Features

1. **Multi-user testing**: Open the app in multiple browser windows/tabs
2. **Card movement**: Drag cards between columns - other windows will update instantly
3. **Card creation**: Add new cards and see them appear for all users
4. **User presence**: See online user count in the board header
5. **Connection status**: Check the connection indicator

## 🔧 Development

### Project Scripts

```bash
# Install dependencies
pnpm install

# Start all development servers
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Type check
pnpm type-check
```

### Database Commands

```bash
cd apps/server

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Reset database
pnpm db:reset
```

## 📡 API Endpoints

### REST API (http://localhost:3001/api)

- `GET /boards` - Get all boards
- `GET /boards/:id` - Get board by ID
- `POST /boards` - Create new board
- `PUT /boards/:id` - Update board
- `DELETE /boards/:id` - Delete board

- `POST /columns` - Create column
- `PUT /columns/:id` - Update column
- `DELETE /columns/:id` - Delete column

- `POST /cards` - Create card
- `PUT /cards/:id` - Update card
- `POST /cards/move` - Move card
- `DELETE /cards/:id` - Delete card

### WebSocket Events

**Client to Server:**
- `board:join` - Join a board
- `board:leave` - Leave a board
- `card:lock` - Lock a card for editing
- `card:unlock` - Unlock a card
- `card:move` - Move a card
- `card:create` - Create a new card

**Server to Client:**
- `card:moved` - Card was moved
- `card:created` - Card was created
- `card:locked` - Card was locked by user
- `card:unlocked` - Card was unlocked
- `user:joined` - User joined board
- `user:left` - User left board
- `users:online` - List of online users

## 🏆 Key Technologies

- **React 18** - UI library with hooks and modern patterns
- **TypeScript** - Type safety across the entire stack
- **Zustand** - Lightweight state management with optimistic updates
- **dnd-kit** - Accessible drag and drop library
- **Socket.IO** - Real-time bidirectional communication
- **Prisma** - Type-safe database ORM
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

## 🚀 Deployment

### Production Deployment Options

This app can be deployed using various strategies:

#### Option 1: GitHub Pages (Frontend Only) + Separate Backend
- **GitHub Pages** for static frontend hosting
- **Railway/Render/Heroku** for Node.js backend deployment
- **Supabase/PlanetScale** for PostgreSQL database

#### Option 2: Full-Stack Platform
- **Vercel/Railway/Render** for full-stack deployment
- Built-in PostgreSQL support available

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### GitHub Pages Deployment (Recommended for Frontend)

1. **Set up your backend**:
   - Deploy backend to Railway, Render, or Heroku
   - Use Supabase or similar for PostgreSQL database
   - Get your API endpoint URL

2. **Configure for GitHub Pages**:
   - Update `VITE_API_BASE_URL` in your environment
   - Ensure proper CORS configuration
   - Push to your GitHub repository

3. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Select "GitHub Actions" as source
   - The workflow will auto-deploy on push to main

### Local Development

```bash
# Install dependencies
pnpm install

# Set up local SQLite database
cd apps/server
cp .env.example .env
pnpm db:migrate
pnpm db:seed

# Start development servers
cd ..
pnpm dev
```

### Docker Deployment (Alternative)

```bash
# Build and start with Docker Compose
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built following modern React and Node.js best practices
- Inspired by tools like Trello, Notion, and Linear
- Uses the awesome dnd-kit library for drag and drop
- Socket.IO for reliable real-time communication