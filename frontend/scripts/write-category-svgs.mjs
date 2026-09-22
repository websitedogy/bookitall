import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webCat = join(root, "public", "categories");
const webBan = join(root, "public", "banners");
const webBrand = join(root, "public", "brand");
const appCat = join(root, "..", "mobile", "assets", "categories");
const appBan = join(root, "..", "mobile", "assets", "banners");
const appBrand = join(root, "..", "mobile", "assets", "brand");

for (const dir of [webCat, webBan, webBrand, appCat, appBan, appBrand]) mkdirSync(dir, { recursive: true });

function tile(bg, art) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="28" fill="${bg}"/>
  ${art}
</svg>
`;
}

const categories = {
  hotels: tile(
    "#DBEAFE",
    `<rect x="28" y="38" width="72" height="62" rx="6" fill="#1D4ED8"/>
     <rect x="36" y="28" width="56" height="18" rx="4" fill="#3B82F6"/>
     <rect x="44" y="18" width="40" height="16" rx="3" fill="#60A5FA"/>
     <rect x="54" y="72" width="20" height="28" rx="3" fill="#FEF3C7"/>
     <rect x="38" y="48" width="10" height="10" rx="2" fill="#DBEAFE"/>
     <rect x="54" y="48" width="10" height="10" rx="2" fill="#DBEAFE"/>
     <rect x="80" y="48" width="10" height="10" rx="2" fill="#DBEAFE"/>
     <rect x="38" y="64" width="10" height="10" rx="2" fill="#DBEAFE"/>
     <rect x="80" y="64" width="10" height="10" rx="2" fill="#DBEAFE"/>
     <circle cx="96" cy="30" r="8" fill="#FDE68A"/>`,
  ),
  tours: tile(
    "#F3E8FF",
    `<circle cx="92" cy="36" r="12" fill="#FBBF24"/>
     <path d="M18 96 L48 54 L68 78 L86 48 L110 96 Z" fill="#7C3AED"/>
     <path d="M18 96 L48 66 L70 88 L110 96 Z" fill="#A78BFA"/>
     <rect x="34" y="78" width="28" height="22" rx="4" fill="#6D28D9"/>
     <rect x="40" y="72" width="16" height="8" rx="2" fill="#C4B5FD"/>
     <circle cx="42" cy="96" r="4" fill="#FDE68A"/>
     <circle cx="54" cy="96" r="4" fill="#FDE68A"/>`,
  ),
  cabs: tile(
    "#E0F2FE",
    `<rect x="22" y="58" width="84" height="28" rx="10" fill="#0369A1"/>
     <path d="M36 58 L46 42 H82 L92 58 Z" fill="#0EA5E9"/>
     <rect x="48" y="46" width="14" height="10" rx="2" fill="#E0F2FE"/>
     <rect x="66" y="46" width="14" height="10" rx="2" fill="#E0F2FE"/>
     <circle cx="40" cy="88" r="10" fill="#0F172A"/>
     <circle cx="40" cy="88" r="5" fill="#94A3B8"/>
     <circle cx="88" cy="88" r="10" fill="#0F172A"/>
     <circle cx="88" cy="88" r="5" fill="#94A3B8"/>
     <rect x="58" y="64" width="12" height="8" rx="2" fill="#FDE68A"/>`,
  ),
  electrician: tile(
    "#FEF3C7",
    `<rect x="54" y="22" width="20" height="14" rx="4" fill="#B45309"/>
     <path d="M50 36 H78 L84 96 H44 Z" fill="#F59E0B"/>
     <circle cx="64" cy="58" r="10" fill="#FEF3C7"/>
     <path d="M64 48 L58 62 H64 L60 74 L72 58 H66 L70 48 Z" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
     <rect x="38" y="88" width="16" height="18" rx="3" fill="#92400E"/>
     <rect x="74" y="88" width="16" height="18" rx="3" fill="#92400E"/>`,
  ),
  plumber: tile(
    "#E0F2FE",
    `<path d="M36 40 H56 V56 H72 V40 H92 V56 H108 V72 H92 V88 H72 V72 H56 V88 H36 V72 H20 V56 H36 Z" fill="#0284C7"/>
     <circle cx="36" cy="48" r="8" fill="#7DD3FC"/>
     <circle cx="92" cy="48" r="8" fill="#7DD3FC"/>
     <rect x="86" y="78" width="22" height="10" rx="3" fill="#075985" transform="rotate(-25 97 83)"/>
     <circle cx="104" cy="92" r="8" fill="#BAE6FD" stroke="#075985" stroke-width="3"/>`,
  ),
  ac: tile(
    "#ECFEFF",
    `<rect x="24" y="40" width="80" height="48" rx="10" fill="#0891B2"/>
     <rect x="32" y="48" width="64" height="32" rx="6" fill="#CFFAFE"/>
     <path d="M40 58 H88 M40 66 H88 M40 74 H88" stroke="#22D3EE" stroke-width="3" stroke-linecap="round"/>
     <rect x="86" y="52" width="8" height="16" rx="2" fill="#0E7490"/>
     <path d="M44 96 C52 88 76 88 84 96" stroke="#67E8F9" stroke-width="3" fill="none"/>`,
  ),
  cleaning: tile(
    "#D1FAE5",
    `<rect x="58" y="22" width="8" height="52" rx="4" fill="#047857"/>
     <path d="M40 74 H88 L80 102 H48 Z" fill="#10B981"/>
     <path d="M48 86 H80" stroke="#A7F3D0" stroke-width="3"/>
     <circle cx="86" cy="36" r="10" fill="#6EE7B7"/>
     <path d="M82 28 L90 44 M90 28 L82 44" stroke="#047857" stroke-width="2"/>
     <circle cx="36" cy="40" r="6" fill="#34D399"/>`,
  ),
  jobs: tile(
    "#D1FAE5",
    `<rect x="30" y="48" width="68" height="46" rx="8" fill="#047857"/>
     <rect x="48" y="36" width="32" height="16" rx="4" fill="#059669"/>
     <rect x="42" y="62" width="44" height="8" rx="2" fill="#A7F3D0"/>
     <rect x="42" y="76" width="28" height="6" rx="2" fill="#6EE7B7"/>
     <circle cx="88" cy="80" r="8" fill="#FDE68A"/>`,
  ),
  beautician: tile(
    "#FCE7F3",
    `<circle cx="64" cy="46" r="18" fill="#F9A8D4"/>
     <path d="M46 62 C46 88 82 88 82 62" fill="#FB718C"/>
     <circle cx="56" cy="44" r="3" fill="#831843"/>
     <circle cx="72" cy="44" r="3" fill="#831843"/>
     <path d="M56 54 Q64 60 72 54" stroke="#BE185D" stroke-width="2" fill="none"/>
     <rect x="86" y="70" width="16" height="28" rx="6" fill="#DB2777"/>
     <circle cx="94" cy="66" r="7" fill="#F472B6"/>`,
  ),
  painting: tile(
    "#EDE9FE",
    `<rect x="36" y="28" width="16" height="72" rx="6" fill="#6D28D9"/>
     <rect x="28" y="22" width="32" height="18" rx="6" fill="#8B5CF6"/>
     <circle cx="86" cy="70" r="22" fill="#C4B5FD"/>
     <circle cx="78" cy="62" r="8" fill="#F472B6"/>
     <circle cx="96" cy="66" r="8" fill="#FBBF24"/>
     <circle cx="86" cy="82" r="8" fill="#34D399"/>
     <rect x="58" y="86" width="8" height="18" rx="2" fill="#4C1D95"/>`,
  ),
  carpenter: tile(
    "#FEF3C7",
    `<rect x="24" y="78" width="80" height="18" rx="4" fill="#B45309"/>
     <rect x="30" y="70" width="68" height="10" rx="3" fill="#D97706"/>
     <path d="M70 28 L86 32 L78 78 L62 74 Z" fill="#92400E"/>
     <rect x="48" y="36" width="14" height="36" rx="3" fill="#78350F"/>
     <circle cx="44" cy="48" r="10" fill="#F59E0B"/>
     <path d="M44 40 V56 M36 48 H52" stroke="#78350F" stroke-width="3"/>`,
  ),
};

categories.appliance = categories.ac;

function banner(bg, title, subtitle, art) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 360" fill="none">
  <rect width="960" height="360" rx="36" fill="${bg}"/>
  ${art}
  <text x="56" y="168" fill="white" font-family="Outfit, Arial, sans-serif" font-size="42" font-weight="700">${title}</text>
  <text x="56" y="214" fill="rgba(255,255,255,0.86)" font-family="Outfit, Arial, sans-serif" font-size="20">${subtitle}</text>
</svg>
`;
}

const banners = {
  hotels: banner(
    "#0F766E",
    "Hotels &amp; Resorts",
    "Rooms you can actually trust.",
    `<rect x="620" y="70" width="260" height="220" rx="16" fill="#115E59"/>
     <rect x="650" y="110" width="40" height="40" rx="6" fill="#99F6E4"/>
     <rect x="710" y="110" width="40" height="40" rx="6" fill="#99F6E4"/>
     <rect x="770" y="110" width="40" height="40" rx="6" fill="#99F6E4"/>
     <rect x="650" y="170" width="40" height="40" rx="6" fill="#99F6E4"/>
     <rect x="770" y="170" width="40" height="40" rx="6" fill="#99F6E4"/>
     <rect x="710" y="210" width="40" height="80" rx="6" fill="#FDE68A"/>`,
  ),
  tours: banner(
    "#6D28D9",
    "Tours &amp; Packages",
    "Pilgrimage to weekend getaways.",
    `<circle cx="820" cy="90" r="36" fill="#FBBF24"/>
     <path d="M560 300 L700 140 L780 220 L860 120 L940 300 Z" fill="#A78BFA"/>
     <path d="M560 300 L700 190 L820 300 Z" fill="#C4B5FD"/>`,
  ),
  cabs: banner(
    "#0369A1",
    "Cabs &amp; Rentals",
    "Local, outstation, live tracking.",
    `<rect x="600" y="150" width="280" height="90" rx="28" fill="#0EA5E9"/>
     <path d="M650 150 L690 100 H830 L870 150 Z" fill="#7DD3FC"/>
     <circle cx="670" cy="250" r="28" fill="#0F172A"/>
     <circle cx="830" cy="250" r="28" fill="#0F172A"/>
     <circle cx="670" cy="250" r="12" fill="#94A3B8"/>
     <circle cx="830" cy="250" r="12" fill="#94A3B8"/>`,
  ),
  home: banner(
    "#047857",
    "Experts near you",
    "Electrician to carpenter, booked in minutes.",
    `<rect x="640" y="90" width="90" height="180" rx="16" fill="#10B981"/>
     <rect x="760" y="130" width="90" height="140" rx="16" fill="#34D399"/>
     <rect x="700" y="70" width="90" height="200" rx="16" fill="#6EE7B7"/>
     <circle cx="745" cy="140" r="18" fill="#ECFDF5"/>`,
  ),
};

const pattern = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" fill="none">
  <rect width="800" height="400" fill="#F8FAFC"/>
  <g stroke="#CBD5E1" stroke-width="1.2" opacity="0.55">
    ${Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 12 }, (_, col) => {
        const x = 40 + col * 66;
        const y = 30 + row * 48;
        return `<circle cx="${x}" cy="${y}" r="16"/><circle cx="${x}" cy="${y}" r="7"/>`;
      }).join(""),
    ).join("")}
  </g>
</svg>
`;

for (const [id, svg] of Object.entries(categories)) {
  writeFileSync(join(webCat, `${id}.svg`), svg);
  writeFileSync(join(appCat, `${id}.svg`), svg);
}
for (const [id, svg] of Object.entries(banners)) {
  writeFileSync(join(webBan, `${id}.svg`), svg);
  writeFileSync(join(appBan, `${id}.svg`), svg);
}
writeFileSync(join(webBrand, "india-pattern.svg"), pattern);
writeFileSync(join(appBrand, "india-pattern.svg"), pattern);
console.log("Wrote SVG categories, banners and brand pattern.");

await import("./write-footer-doodle.mjs");
