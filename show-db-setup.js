// show-db-setup.js
// Save this file and run: node show-db-setup.js

const fs = require('fs');

console.log('=== YOUR DATABASE SETUP ===\n');

// Check for common database files
const dbFiles = [
  'lib/db.js',
  'lib/database.js', 
  'utils/db.js',
  'db.js'
];

dbFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`📄 FOUND: ${file}`);
    console.log('─'.repeat(40));
    const content = fs.readFileSync(file, 'utf8');
    console.log(content);
    console.log('═'.repeat(40));
    console.log('');
  }
});

// Show package.json dependencies
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('📦 DATABASE DEPENDENCIES:');
  console.log('─'.repeat(40));
  
  const dbDeps = ['pg', '@vercel/postgres', 'prisma', '@prisma/client'];
  dbDeps.forEach(dep => {
    if (pkg.dependencies?.[dep]) {
      console.log(`${dep}: ${pkg.dependencies[dep]}`);
    }
  });
  console.log('');
}

// Show environment variables (masked)
if (fs.existsSync('.env') || fs.existsSync('.env.local')) {
  console.log('🔧 ENVIRONMENT VARIABLES:');
  console.log('─'.repeat(40));
  
  ['.env', '.env.local'].forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const lines = content.split('\n').filter(line => 
        line.includes('DATABASE') || line.includes('NEON')
      );
      lines.forEach(line => {
        if (line.includes('=')) {
          const [key] = line.split('=');
          console.log(`${key}=****`);
        }
      });
    }
  });
}