import { defineConfig } from "vite";
import react            from "@vitejs/plugin-react";
import { VitePWA }      from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // "autoUpdate" = le service worker se met à jour silencieusement
      // à chaque nouveau déploiement, sans popup ni action utilisateur
      registerType: "autoUpdate",

      // Fichiers à mettre en cache hors-ligne (tout le build Vite)
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        // Cache de navigation : retourne index.html pour toutes les routes
        navigateFallback: "index.html",

        // Stratégie pour les assets compilés (hash dans le nom = cache à vie)
        runtimeCaching: [
          {
            // Google Fonts — cache 1 an
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // Manifest de l'application (identité PWA)
      manifest: {
        name:             "BakeryOS — Gestion Boulangerie",
        short_name:       "BakeryOS",
        description:      "SaaS de gestion multi-magasins pour boulangeries et pâtisseries",
        start_url:        "/",
        scope:            "/",
        display:          "standalone",       // plein écran, sans barre du navigateur
        orientation:      "any",
        background_color: "#1E0E05",          // couleur pendant le chargement / splash
        theme_color:      "#C8953A",          // barre de status Android
        lang:             "fr",
        categories:       ["business", "food"],

        icons: [
          {
            src:     "/icons/icon-72.png",
            sizes:   "72x72",
            type:    "image/png",
            purpose: "any"
          },
          {
            src:     "/icons/icon-96.png",
            sizes:   "96x96",
            type:    "image/png",
            purpose: "any"
          },
          {
            src:     "/icons/icon-128.png",
            sizes:   "128x128",
            type:    "image/png",
            purpose: "any"
          },
          {
            src:     "/icons/icon-192.png",
            sizes:   "192x192",
            type:    "image/png",
            purpose: "any maskable"
          },
          {
            src:     "/icons/icon-512.png",
            sizes:   "512x512",
            type:    "image/png",
            purpose: "any maskable"
          }
        ],

        // Raccourcis dans le menu contextuel (appui long sur l'icône)
        shortcuts: [
          {
            name:       "Caisse",
            short_name: "POS",
            url:        "/",
            icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }]
          },
          {
            name:       "Production",
            short_name: "Prod.",
            url:        "/",
            icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }]
          }
        ],

        // Captures d'écran pour le prompt d'installation enrichi (Chrome/Edge)
        screenshots: [
          {
            src:          "/icons/screenshot-wide.png",
            sizes:        "1280x800",
            type:         "image/png",
            form_factor:  "wide",
            label:        "BakeryOS — Dashboard Admin"
          },
          {
            src:          "/icons/screenshot-mobile.png",
            sizes:        "390x844",
            type:         "image/png",
            form_factor:  "narrow",
            label:        "BakeryOS — Caisse POS"
          }
        ]
      },

      // Injection automatique du lien vers le manifest dans index.html
      injectRegister: "auto",

      // Afficher un log console quand le SW est prêt (utile en dev)
      devOptions: {
        enabled: false   // mettre true pour tester le SW en local (vite dev)
      }
    }),
  ],

  build: {
    // Découpe le bundle pour un chargement plus rapide
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
