#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Extracting files needed for deployment...\n');

// Create output directory
const outputDir = './deployment-files';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Files and folders to extract
const itemsToExtract = [
  // Shared types (if they exist)
  'shared/',
  
  // Environment example
  '.env.example',
  '.env.local.example',
  
  // Any additional server routes not in src/routes/
  'server/',
  'api/',
  'routes/',
  
  // Database schema and migrations
  'prisma/',
  
  // Package files
  'package.json',
  'package-lock.json',
  
  // Any additional config files
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
  'vite.config.ts',
  'next.config.js',
  'nuxt.config.js',
  
  // Any additional public assets
  'public/',
  'static/',
  'assets/',
  
  // Any additional client source (if not already extracted)
  'src/',
  'app/',
  'pages/',
  'components/',
  
  // Documentation
  'README.md',
  'DEPLOYMENT.md',
  'docs/',
  
  // Any scripts
  'scripts/',
  'deploy/',
  'build/',
  
  // Docker files
  'Dockerfile',
  'docker-compose.yml',
  '.dockerignore',
  
  // Deployment configs
  'railway.json',
  'render.yaml',
  'fly.toml',
  'vercel.json',
  'netlify.toml',
  
  // Any additional environment files
  '.env.production',
  '.env.staging',
];

// Function to safely copy files/folders
function safeCopy(src, dest) {
  try {
    if (fs.existsSync(src)) {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        // Copy directory recursively
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const items = fs.readdirSync(src);
        for (const item of items) {
          safeCopy(path.join(src, item), path.join(dest, item));
        }
      } else {
        // Copy file
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied: ${src}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not copy ${src}: ${error.message}`);
  }
}

// Extract items
console.log('📁 Extracting files and folders...\n');

for (const item of itemsToExtract) {
  const srcPath = item;
  const destPath = path.join(outputDir, item);
  
  if (fs.existsSync(srcPath)) {
    safeCopy(srcPath, destPath);
  } else {
    console.log(`❌ Not found: ${srcPath}`);
  }
}

// Get environment variables (without secrets)
console.log('\n🔧 Extracting environment variables...\n');

const envFiles = ['.env', '.env.local', '.env.production', '.env.staging'];
const envVars = new Set();

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    try {
      const content = fs.readFileSync(envFile, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key] = trimmed.split('=');
          if (key) {
            envVars.add(key);
          }
        }
      }
      
      console.log(`✅ Found env file: ${envFile}`);
    } catch (error) {
      console.log(`⚠️  Could not read ${envFile}: ${error.message}`);
    }
  }
}

// Create .env.example with found variables
if (envVars.size > 0) {
  const envExample = Array.from(envVars)
    .sort()
    .map(key => `${key}=your_${key.toLowerCase()}_here`)
    .join('\n');
  
  fs.writeFileSync(path.join(outputDir, '.env.example'), envExample);
  console.log(`✅ Created .env.example with ${envVars.size} variables`);
}

// Get database info
console.log('\n🗄️  Extracting database information...\n');

try {
  // Check if there's a database file
  const dbFiles = ['prisma/dev.db', 'dev.db', 'database.db', 'app.db'];
  for (const dbFile of dbFiles) {
    if (fs.existsSync(dbFile)) {
      console.log(`✅ Found database: ${dbFile}`);
      
      // Try to get schema info
      try {
        const schemaInfo = execSync(`sqlite3 "${dbFile}" ".schema"`, { encoding: 'utf8' });
        fs.writeFileSync(path.join(outputDir, 'database-schema.sql'), schemaInfo);
        console.log(`✅ Exported database schema`);
      } catch (error) {
        console.log(`⚠️  Could not export schema: ${error.message}`);
      }
      break;
    }
  }
} catch (error) {
  console.log(`⚠️  Database extraction failed: ${error.message}`);
}

// Get package.json dependencies
console.log('\n📦 Extracting dependency information...\n');

try {
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const depInfo = {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      scripts: pkg.scripts || {},
      engines: pkg.engines || {}
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'package-info.json'), 
      JSON.stringify(depInfo, null, 2)
    );
    console.log('✅ Extracted package information');
  }
} catch (error) {
  console.log(`⚠️  Could not extract package info: ${error.message}`);
}

// Create summary
console.log('\n📋 Creating extraction summary...\n');

const summary = {
  extractedAt: new Date().toISOString(),
  itemsFound: [],
  itemsNotFound: [],
  environmentVariables: Array.from(envVars),
  databaseFound: false,
  packageInfo: {}
};

// Check what was actually extracted
for (const item of itemsToExtract) {
  const destPath = path.join(outputDir, item);
  if (fs.existsSync(destPath)) {
    summary.itemsFound.push(item);
  } else {
    summary.itemsNotFound.push(item);
  }
}

// Check for database
const dbFiles = ['prisma/dev.db', 'dev.db', 'database.db', 'app.db'];
summary.databaseFound = dbFiles.some(db => fs.existsSync(db));

// Add package info
try {
  if (fs.existsSync('package.json')) {
    summary.packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  }
} catch (error) {
  console.log(`⚠️  Could not read package.json: ${error.message}`);
}

fs.writeFileSync(
  path.join(outputDir, 'extraction-summary.json'), 
  JSON.stringify(summary, null, 2)
);

// Create zip file
console.log('\n📦 Creating deployment package...\n');

try {
  execSync(`cd "${outputDir}" && zip -r ../deployment-package.zip .`, { stdio: 'inherit' });
  console.log('✅ Created deployment-package.zip');
} catch (error) {
  console.log(`⚠️  Could not create zip: ${error.message}`);
  console.log('📁 Files are in the deployment-files/ directory');
}

console.log('\n🎉 Extraction complete!');
console.log('\n📁 Files extracted to: deployment-files/');
console.log('📦 Package created: deployment-package.zip');
console.log('\n📋 Summary:');
console.log(`✅ Found: ${summary.itemsFound.length} items`);
console.log(`❌ Missing: ${summary.itemsNotFound.length} items`);
console.log(`🔧 Environment variables: ${summary.environmentVariables.length}`);
console.log(`🗄️  Database: ${summary.databaseFound ? 'Found' : 'Not found'}`);

if (summary.itemsNotFound.length > 0) {
  console.log('\n⚠️  Missing items:');
  summary.itemsNotFound.forEach(item => console.log(`   - ${item}`));
}

console.log('\n🚀 Ready for deployment! Upload the deployment-package.zip file.');
