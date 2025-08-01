// Script to start development server with HTTPS for Facebook API compatibility
// Run this with: node start-https-dev.js

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting HTTPS development server for Facebook API compatibility...');
console.log('📋 This will:');
console.log('   - Start Vite dev server with HTTPS');
console.log('   - Generate self-signed certificates automatically');
console.log('   - Enable Facebook API login and posting');
console.log('');

// Check if we're on Windows and adjust command accordingly
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';

// Start the development server
const devProcess = spawn(npmCommand, ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    HTTPS: 'true'
  }
});

devProcess.on('error', (error) => {
  console.error('❌ Failed to start development server:', error);
});

devProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Development server exited with code ${code}`);
  } else {
    console.log('✅ Development server stopped successfully');
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development server...');
  devProcess.kill('SIGTERM');
});
