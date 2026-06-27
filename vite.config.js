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
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
          {
            // Trips list — cache so users can see their trips offline
            urlPattern: /\/api\/v1\/alarm\/(admin|user)\/trips$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "trips-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 3600 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Trip detail pages: expenses, attendance, tasks, checklists, members, etc.
            urlPattern: /\/api\/v1\/alarm\/(admin|user)\/trips\/[^/]+\/(expenses|attendance|tasks|vehicles|checklists|members|polls|itinerary|schedules|share-collections|media)(\?.*)?$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "trip-detail-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 3600 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Trip hub and individual trip
            urlPattern: /\/api\/v1\/alarm\/(admin|user)\/trips\/[^/]+(\/hub)?$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "trip-hub-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 3600 },
              networkTimeoutSeconds: 5,
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
    port: 2003,
    host: true,
    https: true,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/socket.io": { target: apiTarget, ws: true, changeOrigin: true },
    },
  },
  };
});
