import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  const server = {
    host: "::",
    port: mode === 'development' ? 8080 : 1420,
    strictPort: mode !== 'development',
    // Add proxy configuration for CopilotKit API
    proxy: {
      '/api/copilotkit': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
    },
  };

  return {
    server,
    plugins: [
      react(),
      nodePolyfills({
        // Whether to polyfill specific globals.
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        // Whether to polyfill Node.js built-in modules.
        protocolImports: true,
      }),
      // Only load componentTagger in development mode and handle ESM import properly
      ...(mode === 'development' ? [
        (async () => {
          const { componentTagger } = await import("lovable-tagger");
          return componentTagger();
        })()
      ] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Add Node.js polyfill aliases for better compatibility
        util: 'util',
        buffer: 'buffer',
        process: 'process/browser',
      },
    },
    envPrefix: ['VITE_', 'TAURI_'],
    define: {
      'process.env': JSON.stringify(process.env),
      global: 'globalThis',
      'process.platform': JSON.stringify('browser'), 
      'process.version': JSON.stringify(''),
    },
    // Add optimizeDeps configuration to fix the 504 error and Node.js polyfill issues
    optimizeDeps: {
      include: [
        '@vapi-ai/web',
        '@vapi-ai/server-sdk',
        'react',
        'react-dom',
        '@supabase/supabase-js',
        '@radix-ui/react-dialog',
        '@radix-ui/react-slider',
        'framer-motion',
        'lucide-react',
        'util',
        'buffer',
        'process'
      ],
      exclude: [],
      // Force re-optimization when dependencies change
      force: mode === 'development',
      esbuildOptions: {
        // Node.js global polyfills for esbuild
        define: {
          global: 'globalThis'
        }
      }
    },
    // prevent vite from obscuring rust errors
    clearScreen: false,
    build: {
      // Tauri supports es2021
      target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
      // don't minify for debug builds
      minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
      // produce sourcemaps for debug builds
      sourcemap: true,
      // Configure chunking
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunk for node_modules
            if (id.includes('node_modules')) {
              if (id.includes('@radix-ui')) {
                return 'vendor-ui';
              }
              if (id.includes('react') || 
                  id.includes('@tanstack') || 
                  id.includes('@supabase')) {
                return 'vendor-core';
              }
              if (id.includes('@vapi-ai')) {
                return 'vendor-vapi';
              }
              return 'vendor';
            }
          }
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
  };
});
