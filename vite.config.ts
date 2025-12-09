import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { build } from "esbuild";

// Plugin to build the content script with React (for sidebar)
function buildContentScript() {
  return {
    name: "build-content-script",
    closeBundle: async () => {
      try {
        // Build the main content script with sidebar support
        await build({
          entryPoints: ["src/content/linkedinContent.ts"],
          bundle: true,
          outfile: "dist/linkedin-content.js",
          format: "iife",
          target: "chrome100",
          minify: true,
          // Include React and all dependencies
          external: [],
          // Define for production React build
          define: {
            'process.env.NODE_ENV': '"production"',
          },
          // Handle JSX
          loader: {
            '.tsx': 'tsx',
            '.ts': 'ts',
            '.png': 'dataurl',
          },
          // Resolve aliases
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
        });
        console.log("✓ Content script built: dist/linkedin-content.js");
      } catch (error) {
        console.error("Failed to build content script:", error);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    buildContentScript(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
