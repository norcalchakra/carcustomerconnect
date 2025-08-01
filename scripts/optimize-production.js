#!/usr/bin/env node

/**
 * Production Optimization Script for Car Customer Connect
 * This script optimizes the app for deployment by:
 * - Analyzing bundle size
 * - Optimizing assets
 * - Validating environment configuration
 * - Running production build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'yellow');
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} completed`, 'green');
    return output;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    throw error;
  }
}

function analyzeBundle() {
  log('📊 Analyzing bundle size...', 'cyan');
  
  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ No dist folder found. Run build first.', 'red');
    return;
  }

  // Get file sizes
  const files = [];
  function getFileSizes(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        getFileSizes(fullPath, prefix + item + '/');
      } else {
        const size = stat.size;
        const sizeKB = (size / 1024).toFixed(2);
        files.push({
          path: prefix + item,
          size: size,
          sizeKB: sizeKB
        });
      }
    }
  }
  
  getFileSizes(distPath);
  
  // Sort by size (largest first)
  files.sort((a, b) => b.size - a.size);
  
  log('📦 Bundle Analysis:', 'cyan');
  log('==================', 'cyan');
  
  let totalSize = 0;
  const largeFiles = files.filter(f => f.size > 100 * 1024); // Files > 100KB
  
  for (const file of files) {
    totalSize += file.size;
    const color = file.size > 500 * 1024 ? 'red' : file.size > 100 * 1024 ? 'yellow' : 'green';
    log(`${file.path}: ${file.sizeKB} KB`, color);
  }
  
  const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
  log(`\n📊 Total bundle size: ${totalMB} MB`, totalSize > 5 * 1024 * 1024 ? 'red' : 'green');
  
  if (largeFiles.length > 0) {
    log(`\n⚠️  Large files detected (>100KB):`, 'yellow');
    for (const file of largeFiles) {
      log(`   - ${file.path}: ${file.sizeKB} KB`, 'yellow');
    }
    log('\n💡 Consider code splitting or lazy loading for large components', 'blue');
  }
}

function optimizeAssets() {
  log('🎨 Optimizing assets...', 'cyan');
  
  // Check for unoptimized images
  const publicPath = path.join(process.cwd(), 'public');
  const srcPath = path.join(process.cwd(), 'src');
  
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
  const images = [];
  
  function findImages(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules') {
        findImages(fullPath);
      } else if (imageExtensions.some(ext => item.toLowerCase().endsWith(ext))) {
        const sizeKB = (stat.size / 1024).toFixed(2);
        images.push({
          path: fullPath.replace(process.cwd(), '.'),
          size: stat.size,
          sizeKB: sizeKB
        });
      }
    }
  }
  
  findImages(publicPath);
  findImages(srcPath);
  
  if (images.length > 0) {
    log('🖼️  Image assets found:', 'blue');
    for (const img of images) {
      const color = img.size > 500 * 1024 ? 'red' : img.size > 100 * 1024 ? 'yellow' : 'green';
      log(`   ${img.path}: ${img.sizeKB} KB`, color);
    }
    
    const largeImages = images.filter(img => img.size > 500 * 1024);
    if (largeImages.length > 0) {
      log('\n⚠️  Large images detected (>500KB). Consider optimizing:', 'yellow');
      for (const img of largeImages) {
        log(`   - ${img.path}: ${img.sizeKB} KB`, 'yellow');
      }
    }
  } else {
    log('✅ No image assets found to optimize', 'green');
  }
}

function validateEnvironment() {
  log('🔧 Validating environment configuration...', 'cyan');
  
  const envProdPath = path.join(process.cwd(), '.env.production');
  if (!fs.existsSync(envProdPath)) {
    log('❌ .env.production file not found', 'red');
    return false;
  }
  
  const envContent = fs.readFileSync(envProdPath, 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_APP_URL',
    'VITE_FACEBOOK_APP_ID'
  ];
  
  let allValid = true;
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`)) {
      log(`❌ ${varName} not properly configured`, 'red');
      allValid = false;
    } else {
      log(`✅ ${varName} configured`, 'green');
    }
  }
  
  return allValid;
}

function cleanBuild() {
  log('🧹 Cleaning previous build...', 'cyan');
  
  const distPath = path.join(process.cwd(), 'dist');
  const viteCachePath = path.join(process.cwd(), 'node_modules', '.vite');
  
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    log('✅ Removed dist folder', 'green');
  }
  
  if (fs.existsSync(viteCachePath)) {
    fs.rmSync(viteCachePath, { recursive: true, force: true });
    log('✅ Cleared Vite cache', 'green');
  }
}

async function main() {
  log('🚀 Car Customer Connect - Production Optimization', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  try {
    // Step 1: Validate environment
    log('\n📋 Step 1: Environment Validation', 'magenta');
    const envValid = validateEnvironment();
    if (!envValid) {
      log('❌ Environment validation failed. Please fix configuration.', 'red');
      process.exit(1);
    }
    
    // Step 2: Clean previous build
    log('\n🧹 Step 2: Clean Build', 'magenta');
    cleanBuild();
    
    // Step 3: Type check
    log('\n🔍 Step 3: Type Check', 'magenta');
    runCommand('npm run type-check', 'TypeScript type checking');
    
    // Step 4: Production build
    log('\n🏗️  Step 4: Production Build', 'magenta');
    runCommand('npm run build:prod', 'Production build');
    
    // Step 5: Bundle analysis
    log('\n📊 Step 5: Bundle Analysis', 'magenta');
    analyzeBundle();
    
    // Step 6: Asset optimization
    log('\n🎨 Step 6: Asset Optimization', 'magenta');
    optimizeAssets();
    
    // Step 7: Final validation
    log('\n✅ Step 7: Final Validation', 'magenta');
    const distExists = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
    if (distExists) {
      log('✅ Build completed successfully!', 'green');
      log('✅ dist/index.html exists', 'green');
      
      // Check for critical files
      const criticalFiles = ['assets', 'index.html'];
      const distPath = path.join(process.cwd(), 'dist');
      for (const file of criticalFiles) {
        const filePath = path.join(distPath, file);
        if (fs.existsSync(filePath)) {
          log(`✅ ${file} exists`, 'green');
        } else {
          log(`❌ ${file} missing`, 'red');
        }
      }
    } else {
      log('❌ Build failed - index.html not found', 'red');
      process.exit(1);
    }
    
    log('\n🎉 Production optimization completed!', 'green');
    log('📦 Your app is ready for deployment', 'green');
    log('\n📋 Next steps:', 'cyan');
    log('1. Test the build locally: npm run preview:prod', 'blue');
    log('2. Upload the dist/ folder to your hosting provider', 'blue');
    log('3. Configure your domain and SSL certificate', 'blue');
    log('4. Update Facebook app settings with your domain', 'blue');
    
  } catch (error) {
    log('\n❌ Optimization failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log('❌ Script failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
