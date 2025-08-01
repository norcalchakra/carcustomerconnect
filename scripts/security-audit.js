#!/usr/bin/env node

/**
 * Security and Performance Audit Script for Car Customer Connect
 * This script performs final security and performance checks before deployment
 */

const fs = require('fs');
const path = require('path');

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

function checkSecurityHeaders() {
  log('🛡️  Checking security headers configuration...', 'cyan');
  
  const htaccessPath = path.join(process.cwd(), 'public', '.htaccess');
  if (!fs.existsSync(htaccessPath)) {
    log('❌ .htaccess file not found', 'red');
    return false;
  }
  
  const htaccessContent = fs.readFileSync(htaccessPath, 'utf8');
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'Referrer-Policy'
  ];
  
  let allPresent = true;
  for (const header of requiredHeaders) {
    if (htaccessContent.includes(header)) {
      log(`✅ ${header} configured`, 'green');
    } else {
      log(`❌ ${header} missing`, 'red');
      allPresent = false;
    }
  }
  
  return allPresent;
}

function checkEnvironmentSecurity() {
  log('🔐 Checking environment security...', 'cyan');
  
  const issues = [];
  
  // Check for .env files in public directory
  const publicEnvPath = path.join(process.cwd(), 'public', '.env');
  if (fs.existsSync(publicEnvPath)) {
    issues.push('.env file found in public directory (security risk)');
  }
  
  // Check for hardcoded secrets in source files
  const srcPath = path.join(process.cwd(), 'src');
  const suspiciousPatterns = [
    /sk_live_[a-zA-Z0-9]{24,}/g,  // Stripe live keys (actual length)
    /pk_live_[a-zA-Z0-9]{24,}/g,  // Stripe public keys (actual length)
    /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
    /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g, // Google OAuth
    // Only flag actual hardcoded tokens, not environment variable references
    /['"]access_token['"]\s*:\s*['"][a-zA-Z0-9]{20,}['"]/gi, // Hardcoded access tokens
    /['"]api_key['"]\s*:\s*['"][a-zA-Z0-9]{20,}['"]/gi, // Hardcoded API keys
  ];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(content)) {
            issues.push(`Potential hardcoded secret in ${fullPath.replace(process.cwd(), '.')}`);
          }
        }
      }
    }
  }
  
  scanDirectory(srcPath);
  
  if (issues.length === 0) {
    log('✅ No security issues found', 'green');
    return true;
  } else {
    log('❌ Security issues found:', 'red');
    for (const issue of issues) {
      log(`   - ${issue}`, 'red');
    }
    return false;
  }
}

function checkPerformanceConfig() {
  log('⚡ Checking performance configuration...', 'cyan');
  
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  if (!fs.existsSync(viteConfigPath)) {
    log('❌ vite.config.ts not found', 'red');
    return false;
  }
  
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  const performanceFeatures = [
    { name: 'Minification', check: 'minify' },
    { name: 'Code Splitting', check: 'manualChunks' },
    { name: 'Asset Optimization', check: 'assetFileNames' },
    { name: 'Dependency Optimization', check: 'optimizeDeps' }
  ];
  
  let allConfigured = true;
  for (const feature of performanceFeatures) {
    if (viteConfig.includes(feature.check)) {
      log(`✅ ${feature.name} configured`, 'green');
    } else {
      log(`❌ ${feature.name} not configured`, 'red');
      allConfigured = false;
    }
  }
  
  return allConfigured;
}

function checkBuildOutput() {
  log('📦 Checking build output...', 'cyan');
  
  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ No build output found. Run npm run build:prod first.', 'red');
    return false;
  }
  
  // Check for critical files
  const criticalFiles = [
    'index.html',
    'assets',
    '.htaccess'
  ];
  
  let allPresent = true;
  for (const file of criticalFiles) {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      log(`✅ ${file} present in build`, 'green');
    } else {
      log(`❌ ${file} missing from build`, 'red');
      allPresent = false;
    }
  }
  
  // Check bundle size
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    let totalSize = 0;
    let largeFiles = [];
    
    for (const file of files) {
      const filePath = path.join(assetsPath, file);
      const stat = fs.statSync(filePath);
      totalSize += stat.size;
      
      if (stat.size > 1024 * 1024) { // > 1MB
        largeFiles.push({ name: file, size: (stat.size / 1024 / 1024).toFixed(2) });
      }
    }
    
    const totalMB = (totalSize / 1024 / 1024).toFixed(2);
    if (totalSize < 10 * 1024 * 1024) { // < 10MB
      log(`✅ Total bundle size: ${totalMB} MB (good)`, 'green');
    } else {
      log(`⚠️  Total bundle size: ${totalMB} MB (consider optimization)`, 'yellow');
    }
    
    if (largeFiles.length > 0) {
      log('⚠️  Large files detected:', 'yellow');
      for (const file of largeFiles) {
        log(`   - ${file.name}: ${file.size} MB`, 'yellow');
      }
    }
  }
  
  return allPresent;
}

function checkFacebookCompliance() {
  log('📘 Checking Facebook compliance...', 'cyan');
  
  const requiredPages = [
    { path: 'src/pages/PrivacyPolicy.tsx', name: 'Privacy Policy' },
    { path: 'src/pages/DataDeletion.tsx', name: 'Data Deletion' }
  ];
  
  let allPresent = true;
  for (const page of requiredPages) {
    const pagePath = path.join(process.cwd(), page.path);
    if (fs.existsSync(pagePath)) {
      log(`✅ ${page.name} page exists`, 'green');
    } else {
      log(`❌ ${page.name} page missing`, 'red');
      allPresent = false;
    }
  }
  
  // Check environment variables
  const envProdPath = path.join(process.cwd(), '.env.production');
  if (fs.existsSync(envProdPath)) {
    const envContent = fs.readFileSync(envProdPath, 'utf8');
    const fbRequiredVars = [
      'VITE_FACEBOOK_APP_ID',
      'VITE_PRIVACY_POLICY_URL',
      'VITE_DATA_DELETION_URL'
    ];
    
    for (const varName of fbRequiredVars) {
      if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your-`)) {
        log(`✅ ${varName} configured`, 'green');
      } else {
        log(`❌ ${varName} not configured`, 'red');
        allPresent = false;
      }
    }
  }
  
  return allPresent;
}

async function main() {
  log('🔍 Car Customer Connect - Security & Performance Audit', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  const checks = [
    { name: 'Security Headers', fn: checkSecurityHeaders },
    { name: 'Environment Security', fn: checkEnvironmentSecurity },
    { name: 'Performance Configuration', fn: checkPerformanceConfig },
    { name: 'Build Output', fn: checkBuildOutput },
    { name: 'Facebook Compliance', fn: checkFacebookCompliance }
  ];
  
  let allPassed = true;
  const results = [];
  
  for (const check of checks) {
    log(`\n🔍 ${check.name}`, 'magenta');
    log('-'.repeat(30), 'magenta');
    
    try {
      const result = check.fn();
      results.push({ name: check.name, passed: result });
      if (!result) allPassed = false;
    } catch (error) {
      log(`❌ ${check.name} failed: ${error.message}`, 'red');
      results.push({ name: check.name, passed: false });
      allPassed = false;
    }
  }
  
  // Summary
  log('\n📊 Audit Summary', 'cyan');
  log('=' .repeat(30), 'cyan');
  
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  }
  
  if (allPassed) {
    log('\n🎉 All checks passed! Your app is ready for production deployment.', 'green');
    log('📋 Next steps:', 'cyan');
    log('1. Upload the dist/ folder to your hosting provider', 'blue');
    log('2. Configure your domain and SSL certificate', 'blue');
    log('3. Update Facebook app settings with your production domain', 'blue');
    log('4. Test the deployed application thoroughly', 'blue');
  } else {
    log('\n❌ Some checks failed. Please address the issues above before deploying.', 'red');
    process.exit(1);
  }
}

// Run the audit
main().catch(error => {
  log('❌ Audit failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
