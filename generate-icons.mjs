/**
 * generate-icons.mjs
 * Génère toutes les icônes PNG nécessaires pour la PWA BakeryOS
 * à partir d'un SVG inline (croissant sur fond brun-or).
 *
 * Usage :
 *   node generate-icons.mjs
 *
 * Dépendance :
 *   npm install sharp --save-dev
 */

import sharp  from "sharp";
import fs     from "fs";
import path   from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "public", "icons");
fs.mkdirSync(OUT, { recursive: true });

// ── SVG source ───────────────────────────────────────────────────────────────
// Fond brun #1E0E05, cercle or #C8953A, croissant crème #FDF8F0
const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Fond -->
  <rect width="512" height="512" rx="100" fill="#1E0E05"/>

  <!-- Halo doux -->
  <circle cx="256" cy="256" r="195" fill="#2E1A0A"/>

  <!-- Anneau or -->
  <circle cx="256" cy="256" r="178" fill="none" stroke="#C8953A" stroke-width="6" opacity="0.35"/>

  <!-- Croissant stylisé -->
  <g transform="translate(256,265) scale(1.45)">
    <!-- Corps principal -->
    <path d="M-85,20 Q-70,-65 0,-70 Q70,-65 85,20 Q55,60 0,62 Q-55,60 -85,20 Z"
          fill="#C8953A"/>
    <!-- Ombres internes -->
    <path d="M-75,18 Q-62,-55 0,-60 Q62,-55 75,18 Q50,52 0,54 Q-50,52 -75,18 Z"
          fill="#E8A84A" opacity="0.4"/>
    <!-- Pointes -->
    <path d="M-85,20 Q-110,-20 -95,-55 Q-78,-30 -62,-10 Z"
          fill="#C8953A"/>
    <path d="M85,20 Q110,-20 95,-55 Q78,-30 62,-10 Z"
          fill="#C8953A"/>
    <!-- Reflet -->
    <ellipse cx="-15" cy="-25" rx="28" ry="14" fill="#FDF8F0" opacity="0.18" transform="rotate(-15,-15,-25)"/>
  </g>

  <!-- Lettre B stylisée en bas -->
  <text x="256" y="440"
        font-family="Georgia, serif"
        font-size="68"
        font-weight="bold"
        fill="#C8953A"
        text-anchor="middle"
        letter-spacing="8">OS</text>
</svg>
`;

const svgBuffer = Buffer.from(SVG);

// ── Tailles à générer ────────────────────────────────────────────────────────
const SIZES = [72, 96, 128, 192, 512];

for (const size of SIZES) {
  const outPath = path.join(OUT, `icon-${size}.png`);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✅ ${outPath}`);
}

// ── Icône maskable (padding 20% pour la "safe zone" Android) ─────────────────
// On regenere 192 et 512 avec un padding pour le format maskable
const MASKABLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1E0E05"/>
  <g transform="translate(256,265) scale(1.1)">
    <path d="M-85,20 Q-70,-65 0,-70 Q70,-65 85,20 Q55,60 0,62 Q-55,60 -85,20 Z"
          fill="#C8953A"/>
    <path d="M-75,18 Q-62,-55 0,-60 Q62,-55 75,18 Q50,52 0,54 Q-50,52 -75,18 Z"
          fill="#E8A84A" opacity="0.4"/>
    <path d="M-85,20 Q-110,-20 -95,-55 Q-78,-30 -62,-10 Z" fill="#C8953A"/>
    <path d="M85,20 Q110,-20 95,-55 Q78,-30 62,-10 Z" fill="#C8953A"/>
  </g>
</svg>
`;

for (const size of [192, 512]) {
  const outPath = path.join(OUT, `icon-${size}-maskable.png`);
  await sharp(Buffer.from(MASKABLE_SVG))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✅ maskable ${outPath}`);
}

console.log("\n🎉 Toutes les icônes générées dans public/icons/");
