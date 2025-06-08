
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Only load componentTagger in development mode and handle ESM import properly
    ...(mode === 'development' ? [
      (async () => {
        const { componentTagger } = await import("lovable-tagger");
        return componentTagger();
      })()
    ] : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: 'VITE_',
  define: {
    'process.env': {},
  },
}));
