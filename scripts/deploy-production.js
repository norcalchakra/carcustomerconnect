#!/usr/bin/env node

/**
 * Production Deployment Script for Car Customer Connect
 * This script prepares the application for Hostinger deployment with Facebook compliance
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

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing: ${filePath}`, 'red');
    return false;
  }
}

function checkEnvVariable(envContent, variable, description) {
  if (envContent.includes(`${variable}=`) && !envContent.includes(`${variable}=your-`)) {
    log(`✅ ${description} configured`, 'green');
    return true;
  } else {
    log(`❌ ${description} not configured: ${variable}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 Car Customer Connect - Production Deployment Script', 'cyan');
  log('=' .repeat(60), 'cyan');

  let allChecksPass = true;

  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('❌ Not in project root directory. Please run from the project root.', 'red');
    process.exit(1);
  }

  log('\n📋 Pre-deployment Checklist', 'yellow');
  log('-'.repeat(30), 'yellow');

  // Check for required files
  const requiredFiles = [
    ['package.json', 'Package configuration'],
    ['vite.config.ts', 'Vite configuration'],
    ['src/pages/PrivacyPolicy.tsx', 'Privacy Policy page'],
    ['src/pages/DataDeletion.tsx', 'Data Deletion page'],
    ['src/pages/DataDeletionStatus.tsx', 'Data Deletion Status page'],
    ['src/lib/facebookDataDeletion.ts', 'Facebook data deletion handler'],
    ['public/.htaccess', 'Apache configuration'],
    ['public/facebook-compliance/app-review-guide.md', 'Facebook app review guide'],
    ['public/facebook-compliance/data-deletion-callback.md', 'Data deletion callback docs']
  ];

  for (const [file, description] of requiredFiles) {
    if (!checkFile(file, description)) {
      allChecksPass = false;
    }
  }

  // Check environment configuration
  log('\n🔧 Environment Configuration', 'yellow');
  log('-'.repeat(30), 'yellow');

  const envProdPath = '.env.production';
  if (fs.existsSync(envProdPath)) {
    log('✅ Production environment file exists', 'green');
    
    const envContent = fs.readFileSync(envProdPath, 'utf8');
    const requiredEnvVars = [
      ['VITE_SUPABASE_URL', 'Supabase URL'],
      ['VITE_SUPABASE_ANON_KEY', 'Supabase Anonymous Key'],
      ['VITE_FACEBOOK_APP_ID', 'Facebook App ID'],
      ['FACEBOOK_APP_SECRET', 'Facebook App Secret'],
      ['VITE_APP_URL', 'Application URL'],
      ['VITE_PRIVACY_POLICY_URL', 'Privacy Policy URL'],
      ['VITE_DATA_DELETION_URL', 'Data Deletion URL'],
      ['VITE_COMPANY_NAME', 'Company Name'],
      ['VITE_COMPANY_EMAIL', 'Company Email']
    ];

    for (const [envVar, description] of requiredEnvVars) {
      if (!checkEnvVariable(envContent, envVar, description)) {
        allChecksPass = false;
      }
    }
  } else {
    log('❌ Production environment file missing. Copy .env.production.example to .env.production', 'red');
    allChecksPass = false;
  }

  // Check dependencies
  log('\n📦 Dependencies Check', 'yellow');
  log('-'.repeat(30), 'yellow');

  try {
    log('Checking for outdated dependencies...', 'blue');
    execSync('npm outdated', { stdio: 'pipe' });
    log('✅ All dependencies are up to date', 'green');
  } catch (error) {
    log('⚠️  Some dependencies may be outdated. Consider running "npm update"', 'yellow');
  }

  // Build the application
  if (allChecksPass) {
    log('\n🔨 Building Application', 'yellow');
    log('-'.repeat(30), 'yellow');

    try {
      log('Installing dependencies...', 'blue');
      execSync('npm install', { stdio: 'inherit' });

      log('Building for production...', 'blue');
      execSync('npm run build', { stdio: 'inherit' });

      log('✅ Build completed successfully', 'green');

      // Verify build output
      const distPath = 'dist';
      if (fs.existsSync(distPath)) {
        const distFiles = fs.readdirSync(distPath);
        log(`✅ Build output contains ${distFiles.length} files/directories`, 'green');
        
        // Check for critical files in dist
        const criticalFiles = ['index.html', 'assets'];
        for (const file of criticalFiles) {
          if (distFiles.includes(file)) {
            log(`✅ ${file} found in build output`, 'green');
          } else {
            log(`❌ ${file} missing from build output`, 'red');
            allChecksPass = false;
          }
        }

        // Check if facebook-compliance docs are included
        if (fs.existsSync(path.join(distPath, 'facebook-compliance'))) {
          log('✅ Facebook compliance documentation included in build', 'green');
        } else {
          log('❌ Facebook compliance documentation missing from build', 'red');
          allChecksPass = false;
        }
      } else {
        log('❌ Build output directory not found', 'red');
        allChecksPass = false;
      }
    } catch (error) {
      log('❌ Build failed', 'red');
      log(error.message, 'red');
      allChecksPass = false;
    }
  }

  // Final summary
  log('\n📊 Deployment Summary', 'cyan');
  log('='.repeat(30), 'cyan');

  if (allChecksPass) {
    log('🎉 All checks passed! Ready for deployment to Hostinger.', 'green');
    log('\nNext steps:', 'yellow');
    log('1. Upload contents of "dist/" folder to your Hostinger public_html directory', 'blue');
    log('2. Ensure HTTPS is enabled on your domain', 'blue');
    log('3. Update Facebook App settings with your production URLs', 'blue');
    log('4. Test the deployed application', 'blue');
    log('5. Submit your app for Facebook review', 'blue');
    
    log('\nImportant URLs to configure in Facebook App Dashboard:', 'yellow');
    log('- Privacy Policy: https://your-domain.com/privacy-policy', 'blue');
    log('- Data Deletion: https://your-domain.com/data-deletion', 'blue');
    log('- Data Deletion Callback: https://your-domain.com/api/facebook/data-deletion-callback', 'blue');
  } else {
    log('❌ Some checks failed. Please address the issues above before deploying.', 'red');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log('❌ Script failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
