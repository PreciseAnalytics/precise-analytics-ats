// complete-file-mapper.js
// Run: node complete-file-mapper.js

const fs = require('fs');
const path = require('path');

console.log('🗂️  COMPLETE PROJECT FILE STRUCTURE\n');
console.log('📍 Current directory:', process.cwd());
console.log('═'.repeat(60));

// Function to map directory structure
function mapDirectory(dir, prefix = '', maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return;
  
  try {
    const items = fs.readdirSync(dir);
    
    // Sort items: directories first, then files
    const sorted = items.sort((a, b) => {
      const aPath = path.join(dir, a);
      const bPath = path.join(dir, b);
      const aIsDir = fs.statSync(aPath).isDirectory();
      const bIsDir = fs.statSync(bPath).isDirectory();
      
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
    
    sorted.forEach((item, index) => {
      // Skip node_modules, .git, .next, and other large directories
      if ([
        'node_modules', '.git', '.next', 'dist', 'build', 
        '.vercel', '.vscode', 'coverage', '.nyc_output'
      ].includes(item)) {
        console.log(`${prefix}📁 ${item}/ (skipped)`);
        return;
      }
      
      const fullPath = path.join(dir, item);
      const isLast = index === sorted.length - 1;
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      const connector = isLast ? '└── ' : '├── ';
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          console.log(`${prefix}${connector}📁 ${item}/`);
          mapDirectory(fullPath, newPrefix, maxDepth, currentDepth + 1);
        } else {
          const size = stat.size;
          const ext = path.extname(item);
          let icon = '📄';
          
          // Different icons for different file types
          if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) icon = '⚡';
          else if (['.json'].includes(ext)) icon = '📋';
          else if (['.md', '.txt'].includes(ext)) icon = '📝';
          else if (['.css', '.scss', '.sass'].includes(ext)) icon = '🎨';
          else if (['.env'].includes(ext) || item.startsWith('.env')) icon = '🔧';
          
          console.log(`${prefix}${connector}${icon} ${item} (${formatBytes(size)})`);
        }
      } catch (err) {
        console.log(`${prefix}${connector}❌ ${item} (access denied)`);
      }
    });
  } catch (err) {
    console.log(`${prefix}❌ Cannot read directory: ${err.message}`);
  }
}

// Format file sizes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Show specific important files with content
function showImportantFiles() {
  console.log('\n🔍 IMPORTANT FILES CONTENT:');
  console.log('═'.repeat(60));
  
  const importantFiles = [
    'package.json',
    'next.config.js',
    'next.config.mjs', 
    'tsconfig.json',
    '.env',
    '.env.local',
    '.env.production',
    'vercel.json'
  ];
  
  importantFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`\n📄 ${file}:`);
      console.log('─'.repeat(30));
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Mask sensitive data in env files
        if (file.includes('.env')) {
          content = content.split('\n').map(line => {
            if (line.includes('=') && !line.startsWith('#')) {
              const [key] = line.split('=');
              return `${key}=****`;
            }
            return line;
          }).join('\n');
        }
        
        // Limit content length
        if (content.length > 1000) {
          content = content.substring(0, 1000) + '\n... (truncated)';
        }
        
        console.log(content);
      } catch (err) {
        console.log(`Error reading ${file}: ${err.message}`);
      }
    }
  });
}

// Show API routes specifically
function showApiRoutes() {
  console.log('\n🌐 API ROUTES ANALYSIS:');
  console.log('═'.repeat(60));
  
  const apiDirs = ['app/api', 'pages/api', 'src/app/api', 'src/pages/api'];
  
  apiDirs.forEach(apiDir => {
    if (fs.existsSync(apiDir)) {
      console.log(`\n📁 Found API directory: ${apiDir}`);
      console.log('─'.repeat(30));
      mapApiRoutes(apiDir, apiDir);
    }
  });
}

function mapApiRoutes(dir, baseApiDir, route = '') {
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Handle dynamic routes like [id], [...slug]
        let routePart = item;
        if (item.startsWith('[') && item.endsWith(']')) {
          routePart = `:${item.slice(1, -1)}`;
        }
        
        const newRoute = route + '/' + routePart;
        console.log(`📁 ${fullPath} → ${newRoute}`);
        mapApiRoutes(fullPath, baseApiDir, newRoute);
      } else if (item === 'route.ts' || item === 'route.js' || item.match(/\.(js|ts)$/)) {
        const endpoint = route || '/';
        console.log(`⚡ ${fullPath} → /api${endpoint}`);
        
        // Show file content preview
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const methods = [];
          if (content.includes('export async function GET')) methods.push('GET');
          if (content.includes('export async function POST')) methods.push('POST');
          if (content.includes('export async function PUT')) methods.push('PUT');
          if (content.includes('export async function DELETE')) methods.push('DELETE');
          if (content.includes('export async function PATCH')) methods.push('PATCH');
          
          if (methods.length > 0) {
            console.log(`   Methods: ${methods.join(', ')}`);
          }
        } catch (err) {
          console.log(`   Error reading file: ${err.message}`);
        }
      }
    });
  } catch (err) {
    console.log(`Error reading ${dir}: ${err.message}`);
  }
}

// Run all analyses
console.log('Starting complete file analysis...\n');

// 1. Show overall structure
mapDirectory('.', '', 3, 0);

// 2. Show important files
showImportantFiles();

// 3. Show API routes
showApiRoutes();

console.log('\n✅ File analysis complete!');
console.log('\n📋 SUMMARY:');
console.log('- Check the API ROUTES section above to see what endpoints exist');
console.log('- Look for any missing route.ts files in app/api/jobs/');
console.log('- Verify your Next.js configuration in package.json');
console.log('- Check environment variables in .env files');