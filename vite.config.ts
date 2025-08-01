import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    // Enable minification
    minify: 'terser',
    // Enable source maps for debugging (disable in production if not needed)
    sourcemap: false,
    // Optimize chunk size
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils-vendor': ['date-fns', 'zustand'],
          // UI chunks
          'auth-components': [
            './src/components/auth/Auth.tsx',
            './src/context/AuthContext.tsx'
          ],
          'vehicle-components': [
            './src/components/VehicleDetail.tsx',
            './src/components/vehicles/WorkflowDashboard.tsx',
            './src/components/vehicles/VehicleProgressTracker.tsx'
          ],
          'onboarding-components': [
            './src/pages/DealerOnboardingPage.tsx'
          ]
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for better optimization
    target: 'es2015'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'date-fns',
      'zustand'
    ]
  },
  // Enable compression
  define: {
    // Remove console.log in production
    __DEV__: JSON.stringify(false)
  }
});
