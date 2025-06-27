
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['@pdf-viewer/react', 'pdfjs-dist']
  },
  build: {
    commonjsOptions: {
      include: [/@pdf-viewer/, /node_modules/]
    }
  },
  worker: {
    format: 'es'
  },
  assetsInclude: ['**/*.wasm']
}));
