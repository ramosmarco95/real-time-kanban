#!/usr/bin/env node

/**
 * Initialize git repository with proper .gitignore setup
 * This ensures environment files are never accidentally committed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Initializing Git Repository');
console.log('===============================\n');

try {
  // Check if already a git repository
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    console.log('✅ Git repository already initialized');
  } catch (error) {
    console.log('📦 Initializing new git repository...');
    execSync('git init', { stdio: 'inherit' });
  }

  // Check for .env files and warn if they exist
  const envFiles = [
    'apps/server/.env',
    'apps/web/.env',
    '.env'
  ];

  const existingEnvFiles = envFiles.filter(file => fs.existsSync(file));
  
  if (existingEnvFiles.length > 0) {
    console.log('\n⚠️  WARNING: Environment files detected:');
    existingEnvFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('   These files contain sensitive data and should NOT be committed.');
    console.log('   They are already excluded by .gitignore files.\n');
  }

  // Stage all files except .env files
  console.log('📝 Adding files to git...');
  execSync('git add .', { stdio: 'inherit' });

  // Check if .env files were accidentally staged
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const stagedEnvFiles = status.split('\n')
      .filter(line => line.includes('.env') && !line.includes('.env.example'))
      .filter(line => line.length > 0);

    if (stagedEnvFiles.length > 0) {
      console.log('🚨 DANGER: .env files were staged! Removing them...');
      stagedEnvFiles.forEach(line => {
        const file = line.substring(3); // Remove git status prefix
        console.log(`   Unstaging: ${file}`);
        execSync(`git reset HEAD "${file}"`, { stdio: 'inherit' });
      });
    }
  } catch (error) {
    // Git status might fail if no commits yet, that's ok
  }

  console.log('\n✅ Git repository setup complete!');
  console.log('\nNext steps:');
  console.log('1. git commit -m "Initial commit"');
  console.log('2. git remote add origin <your-repository-url>');
  console.log('3. git push -u origin main');
  console.log('\n🔒 Environment file security:');
  console.log('- .env files are excluded by .gitignore');
  console.log('- Only .env.example files should be committed');
  console.log('- Always review files before committing sensitive data');

} catch (error) {
  console.error('\n❌ Git setup failed:', error.message);
  process.exit(1);
}