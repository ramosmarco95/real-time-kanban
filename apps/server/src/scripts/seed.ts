import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b566?w=150',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
    },
  });

  console.log('👥 Created users:', user1.name, user2.name);

  // Create sample board
  const board = await prisma.board.upsert({
    where: { id: 'sample-board' },
    update: {},
    create: {
      id: 'sample-board',
      title: 'Project Management Board',
      description: 'A sample Kanban board for project management',
    },
  });

  console.log('📋 Created board:', board.title);

  // Create columns
  const todoColumn = await prisma.column.upsert({
    where: { id: 'col-todo' },
    update: {},
    create: {
      id: 'col-todo',
      boardId: board.id,
      title: 'To Do',
      order: 1000,
    },
  });

  const inProgressColumn = await prisma.column.upsert({
    where: { id: 'col-in-progress' },
    update: {},
    create: {
      id: 'col-in-progress',
      boardId: board.id,
      title: 'In Progress',
      order: 2000,
    },
  });

  const reviewColumn = await prisma.column.upsert({
    where: { id: 'col-review' },
    update: {},
    create: {
      id: 'col-review',
      boardId: board.id,
      title: 'Review',
      order: 3000,
    },
  });

  const doneColumn = await prisma.column.upsert({
    where: { id: 'col-done' },
    update: {},
    create: {
      id: 'col-done',
      boardId: board.id,
      title: 'Done',
      order: 4000,
    },
  });

  console.log('📋 Created columns:', [todoColumn, inProgressColumn, reviewColumn, doneColumn].map(c => c.title).join(', '));

  // Create sample cards
  const cards = [
    {
      id: 'card-1',
      columnId: todoColumn.id,
      title: 'Design user interface mockups',
      description: 'Create wireframes and high-fidelity mockups for the main dashboard',
      order: 1000,
      assignedTo: user1.id,
      labels: JSON.stringify(['design']),
      dueDate: new Date('2024-12-01'),
    },
    {
      id: 'card-2',
      columnId: todoColumn.id,
      title: 'Set up development environment',
      description: 'Configure local development setup with Docker and necessary tools',
      order: 2000,
      assignedTo: user2.id,
      labels: JSON.stringify(['setup']),
      dueDate: new Date('2024-11-25'),
    },
    {
      id: 'card-3',
      columnId: inProgressColumn.id,
      title: 'Implement user authentication',
      description: 'Add login/logout functionality with JWT tokens',
      order: 1000,
      assignedTo: user2.id,
      labels: JSON.stringify(['backend']),
      dueDate: new Date('2024-11-30'),
    },
    {
      id: 'card-4',
      columnId: reviewColumn.id,
      title: 'Create API documentation',
      description: 'Document all REST endpoints and WebSocket events',
      order: 1000,
      assignedTo: user1.id,
      labels: JSON.stringify(['api']),
      dueDate: new Date('2024-11-20'),
    },
    {
      id: 'card-5',
      columnId: doneColumn.id,
      title: 'Set up project repository',
      description: 'Initialize Git repository with proper folder structure',
      order: 1000,
      assignedTo: user2.id,
      labels: JSON.stringify(['git']),
    },
  ];

  for (const cardData of cards) {
    await prisma.card.upsert({
      where: { id: cardData.id },
      update: {},
      create: cardData,
    });
  }

  console.log('📝 Created', cards.length, 'sample cards');
  console.log('✅ Seed completed successfully!');
  console.log('🔗 Sample board ID:', board.id);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });