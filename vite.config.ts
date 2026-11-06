import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";
// Set by GitHub Pages at build time; empty means hosting at the domain root.
const basePath = (process.env.VITE_BASE_PATH ?? "").replace(/^\/+|\/+$/g, "");
const base = basePath ? `/${basePath}/` : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      base,
      scope: base,
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Injekto-log",
        short_name: "Injekto-log",
        description: "Persönliches Protokoll für Injektionen und Gewicht",
        lang: "de-DE",
        start_url: base,
        scope: base,
        display: "standalone",
        theme_color: "#12171b",
        background_color: "#12171b",
        icons: [
          { src: `${base}icon-192.png`, sizes: "192x192", type: "image/png" },
          {
            src: `${base}icon-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${base}icon-maskable.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  server: { allowedHosts: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("recharts") || id.includes("/d3-")) return "charts";
          if (id.includes("@js-temporal")) return "time";
          if (id.includes("/zod/")) return "validation";
          if (
            id.includes("/react-dom/") ||
            id.includes("/react/") ||
            id.includes("/scheduler/")
          )
            return "react";
        },
      },
    },
  },
});
