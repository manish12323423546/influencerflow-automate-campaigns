import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  const server = {
    host: "::",
    port: mode === 'development' ? 8080 : 1420,
    strictPort: mode !== 'development',
  };

  return {
    server,
    plugins: [
      react(),
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
      },
    },
    envPrefix: ['VITE_', 'TAURI_'],
    define: {
      'process.env': {},
    },
    // prevent vite from obscuring rust errors
    clearScreen: false,
    build: {
      // Tauri supports es2021
      target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
      // don't minify for debug builds
      minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
      // produce sourcemaps for debug builds
      sourcemap: !!process.env.TAURI_DEBUG,
    },
  };
});
