#!/usr/bin/env node

/**
 * Migration script to help transition from local SQLite to Supabase PostgreSQL
 * Run this after setting up your Supabase project and updating environment variables
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Real-Time Kanban Migration to Supabase');
console.log('==========================================\n');

console.log('⚠️  IMPORTANT: Environment Variable Security');
console.log('   Make sure to NEVER commit .env files to version control!');
console.log('   These files contain sensitive database credentials.\n');

// Check if .env files exist
const serverEnvPath = path.join(__dirname, 'apps', 'server', '.env');
const webEnvPath = path.join(__dirname, 'apps', 'web', '.env');

if (!fs.existsSync(serverEnvPath)) {
  console.log('❌ Missing apps/server/.env file');
  console.log('   Please copy apps/server/.env.example to apps/server/.env and update with your Supabase credentials');
  process.exit(1);
}

if (!fs.existsSync(webEnvPath)) {
  console.log('❌ Missing apps/web/.env file');
  console.log('   Please copy apps/web/.env.example to apps/web/.env and update with your Supabase credentials');
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('pnpm install', { stdio: 'inherit' });

  console.log('\n🔧 Building shared package...');
  execSync('pnpm run --filter ./packages/shared build', { stdio: 'inherit' });

  console.log('\n🗄️  Generating Prisma client...');
  execSync('pnpm run --filter ./apps/server db:generate', { stdio: 'inherit' });

  console.log('\n📊 Running database migrations...');
  execSync('pnpm run --filter ./apps/server db:migrate', { stdio: 'inherit' });

  console.log('\n🌱 Seeding database (optional)...');
  try {
    execSync('pnpm run --filter ./apps/server db:seed', { stdio: 'inherit' });
    console.log('   ✅ Database seeded successfully');
  } catch (error) {
    console.log('   ⚠️  Seeding skipped (this is optional)');
  }

  console.log('\n🎉 Migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test locally: pnpm dev');
  console.log('2. Deploy to Netlify following DEPLOYMENT.md');
  console.log('3. Set up Supabase Auth (optional)');
  console.log('4. Configure real-time subscriptions (optional)');

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\nPlease check:');
  console.log('- Your Supabase credentials are correct');
  console.log('- Your Supabase database is accessible');
  console.log('- You have the necessary permissions');
  process.exit(1);
}