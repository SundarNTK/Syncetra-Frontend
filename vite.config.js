import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import fs from "fs";

const apiTarget = "http://127.0.0.1:4010";

// Injects VITE_FIREBASE_* env vars into the public service worker file at build time.
// Service workers live outside the Vite module graph so they cannot use import.meta.env.
function injectSwEnvPlugin(env) {
  return {
    name: "inject-sw-env",
    closeBundle() {
      const swPath = path.resolve(__dirname, "dist/firebase-messaging-sw.js");
      if (!fs.existsSync(swPath)) return;
      let content = fs.readFileSync(swPath, "utf-8");
      const replacements = {
        __FIREBASE_API_KEY__: env.VITE_FIREBASE_API_KEY,
        __FIREBASE_AUTH_DOMAIN__: env.VITE_FIREBASE_AUTH_DOMAIN,
        __FIREBASE_PROJECT_ID__: env.VITE_FIREBASE_PROJECT_ID,
        __FIREBASE_STORAGE_BUCKET__: env.VITE_FIREBASE_STORAGE_BUCKET,
        __FIREBASE_MESSAGING_SENDER_ID__: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        __FIREBASE_APP_ID__: env.VITE_FIREBASE_APP_ID,
      };
      for (const [key, value] of Object.entries(replacements)) {
        if (value) content = content.replaceAll(`"${key}"`, `"${value}"`);
      }
      fs.writeFileSync(swPath, content, "utf-8");
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
  plugins: [
    react(),
    basicSsl(),
    injectSwEnvPlugin(env),
    VitePWA({
      registerType: "autoUpdate",
      // firebase-messaging-sw.js is manually registered in fcm.js — exclude it
      // from Workbox's precache to avoid scope conflicts.
      filename: "sw.js",
      includeAssets: ["logo.png", "Full_logo.png", "alarm-icon.svg", "alarm.mp3"],
      manifest: {
        name: "Syncetra",
        short_name: "Syncetra",
        description: "Smart trip coordination — alarms, expenses, attendance & more",
        theme_color: "#059669",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        // start_url with standalone display lets the app open as a full-screen
        // PWA when launched from the home screen (critical for alarm delivery).
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,mp3}"],
        // Do not let Workbox touch the FCM service worker
        globIgnores: ["firebase-messaging-sw.js"],
        runtimeCaching: [
          {
            // Cache API responses briefly so the app works after brief offline periods
            urlPattern: /\/api\/v1\/alarm\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "alarm-api-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 300 },
            },
          },
        ],
      },
      // Avoid registering dev-sw.js on https://localhost with a self-signed cert (often fails and spams the console).
      devOptions: {
        enabled: false,
        type: "module",
      },
    }),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-redux", "react-quill", "quill"],
  },
  server: {
    port: 5173,
    host: true,
    https: true,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/socket.io": { target: apiTarget, ws: true, changeOrigin: true },
    },
  },
  };
});
