import React    from "react";
import ReactDOM  from "react-dom/client";
import App       from "./BakeryOS_v3.8.jsx";

// ── Enregistrement du Service Worker (géré par vite-plugin-pwa) ─────────────
// Le plugin injecte automatiquement le SW — ce bloc affiche juste
// un message console quand une mise à jour est disponible.
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  // Appelé quand une nouvelle version est prête (après autoUpdate)
  onRegisteredSW(swUrl, registration) {
    console.log("[BakeryOS] Service Worker enregistré :", swUrl);

    // Vérification de mise à jour toutes les heures (en cas de navigateur
    // ouvert en continu toute la journée en magasin)
    if (registration) {
      setInterval(function () {
        registration.update();
      }, 60 * 60 * 1000); // 1 heure
    }
  },

  onOfflineReady() {
    console.log("[BakeryOS] Application disponible hors-ligne ✅");
  },
});

// ── Montage React ────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
