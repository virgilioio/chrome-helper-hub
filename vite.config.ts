import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { build } from "esbuild";
import fs from "fs";

// Plugin to build the content script separately
function buildContentScript() {
  return {
    name: "build-content-script",
    closeBundle: async () => {
      try {
        await build({
          entryPoints: ["src/content/linkedinProfile.ts"],
          bundle: true,
          outfile: "dist/linkedin-content.js",
          format: "iife",
          target: "chrome100",
          minify: true,
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
