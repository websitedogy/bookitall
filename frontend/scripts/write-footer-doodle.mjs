import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webBrand = join(root, "public", "brand");
const appBrand = join(root, "..", "mobile", "assets", "brand");
for (const dir of [webBrand, appBrand]) mkdirSync(dir, { recursive: true });

function mark(x, y, scale, rotate, body) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" fill="none">${body}</g>`;
}

const icons = {
  house: `
    <path d="M4 22 L20 8 L36 22"/>
    <path d="M9 20 V34 H31 V20"/>
    <path d="M16 34 V24 H24 V34"/>
    <path d="M25 14 V10 H30 V18"/>`,
  building: `
    <path d="M10 36 V8 H30 V36"/>
    <path d="M14 14 H18 M22 14 H26 M14 20 H18 M22 20 H26 M14 26 H18 M22 26 H26"/>
    <path d="M17 36 V30 H23 V36"/>`,
  tallBuilding: `
    <path d="M12 38 V4 H28 V38"/>
    <path d="M16 10 H18 M22 10 H24 M16 16 H18 M22 16 H24 M16 22 H18 M22 22 H24 M16 28 H18 M22 28 H24"/>
    <path d="M18 4 V1 H22 V4"/>`,
  car: `
    <path d="M3 24 L7 18 H13 L17 13 H31 L37 19 V26 H3 Z"/>
    <path d="M13 18 L16 14 H30 L34 19"/>
    <circle cx="12" cy="26" r="3.2"/>
    <circle cx="29" cy="26" r="3.2"/>`,
  auto: `
    <path d="M5 26 H10 L13 16 H23 C28 16 31 20 33 24 H37 V28 H5 Z"/>
    <path d="M13 16 V28"/>
    <path d="M23 16 V22 H31"/>
    <path d="M16 19 H21"/>
    <circle cx="13" cy="28" r="3.1"/>
    <circle cx="31" cy="28" r="3.1"/>`,
  bus: `
    <path d="M4 14 H36 V28 H4 Z"/>
    <path d="M4 14 C4 10 8 10 10 10 H34 C36 10 36 14 36 14"/>
    <path d="M8 14 V22 H16 V14 M20 14 V22 H28 V14"/>
    <path d="M4 22 H36"/>
    <circle cx="12" cy="28" r="3.2"/>
    <circle cx="30" cy="28" r="3.2"/>
    <path d="M33 16 H36 V20"/>`,
  bike: `
    <circle cx="11" cy="26" r="6"/>
    <circle cx="31" cy="26" r="6"/>
    <path d="M11 26 L18 14 H26 L31 26"/>
    <path d="M18 14 L20 26 H28"/>
    <path d="M26 14 L30 10 H34"/>
    <path d="M20 14 V10"/>`,
  pin: `
    <path d="M20 6 C13 6 8 12 8 18 C8 28 20 36 20 36 S32 28 32 18 C32 12 27 6 20 6 Z"/>
    <circle cx="20" cy="17" r="4"/>`,
  suitcase: `
    <path d="M8 14 H32 V34 H8 Z"/>
    <path d="M14 14 V9 H26 V14"/>
    <path d="M8 20 H32"/>
    <path d="M20 20 V28"/>`,
  shopping: `
    <path d="M10 14 H30 L27 34 H13 Z"/>
    <path d="M16 14 C16 8 24 8 24 14"/>`,
  box: `
    <path d="M8 16 L20 10 L32 16 L20 22 Z"/>
    <path d="M8 16 V28 L20 34 V22"/>
    <path d="M32 16 V28 L20 34"/>
    <path d="M20 10 V16"/>`,
  wrench: `
    <path d="M12 8 C8 8 7 14 11 15 L25 29 C27 31 31 31 32 27 C33 23 29 22 27 24 L14 11 C15 9 14 8 12 8 Z"/>
    <circle cx="11" cy="11" r="2.2"/>`,
  screwdriver: `
    <path d="M8 32 L24 16"/>
    <path d="M24 16 L28 12 L32 16 L28 20 Z"/>
    <path d="M8 32 L5 35 L9 36 Z"/>`,
  hammer: `
    <path d="M18 14 L22 36"/>
    <path d="M8 10 H28 L30 16 H10 Z"/>`,
  plug: `
    <path d="M14 16 H26 V30 C26 34 22 36 20 36 C18 36 14 34 14 30 Z"/>
    <path d="M17 16 V8 M23 16 V8"/>
    <path d="M20 36 V40"/>`,
  bulb: `
    <path d="M20 6 C13 6 10 13 12 18 C14 22 16 24 16 28 H24 C24 24 26 22 28 18 C30 13 27 6 20 6 Z"/>
    <path d="M16 30 H24 M17 33 H23 M18 36 H22"/>`,
  broom: `
    <path d="M20 4 V24"/>
    <path d="M11 24 H29 L26 36 H14 Z"/>
    <path d="M14 28 L12 36 M20 24 V36 M26 28 L28 36"/>`,
  bucket: `
    <path d="M12 16 H28 L26 34 H14 Z"/>
    <path d="M12 16 C12 10 28 10 28 16"/>
    <path d="M20 10 V6"/>`,
  mop: `
    <path d="M20 4 V26"/>
    <path d="M12 26 C12 22 28 22 28 26 C28 34 12 34 12 26 Z"/>`,
  pan: `
    <ellipse cx="16" cy="20" rx="12" ry="8"/>
    <path d="M28 20 H40"/>
    <path d="M38 17 V23"/>`,
  pot: `
    <path d="M10 16 H30 V30 C30 34 26 36 20 36 C14 36 10 34 10 30 Z"/>
    <path d="M10 16 C10 12 30 12 30 16"/>
    <path d="M6 20 H10 M30 20 H34"/>`,
  chefHat: `
    <path d="M12 22 C8 22 8 12 16 12 C16 6 24 6 24 12 C32 12 32 22 28 22 Z"/>
    <path d="M13 22 H27 V26 H13 Z"/>`,
  worker: `
    <circle cx="20" cy="8" r="5"/>
    <path d="M20 13 V24"/>
    <path d="M10 18 H30"/>
    <path d="M12 38 L20 24 L28 38"/>
    <path d="M30 18 L36 12"/>`,
  chef: `
    <path d="M12 10 C10 4 30 4 28 10 H12 Z"/>
    <circle cx="20" cy="16" r="4.5"/>
    <path d="M20 21 V30"/>
    <path d="M11 26 H29"/>
    <path d="M13 40 L20 30 L27 40"/>
    <path d="M29 26 L34 22"/>`,
  truck: `
    <path d="M3 14 H22 V28 H3 Z"/>
    <path d="M22 18 H33 L36 26 V28 H22"/>
    <path d="M24 18 V24 H33"/>
    <circle cx="10" cy="28" r="3.2"/>
    <circle cx="28" cy="28" r="3.2"/>`,
  tree: `
    <path d="M20 18 C10 18 8 8 20 6 C32 8 30 18 20 18 Z"/>
    <path d="M12 26 C8 26 8 18 20 16 C32 18 32 26 28 26 H12 Z"/>
    <path d="M20 26 V38"/>`,
  pine: `
    <path d="M20 4 L8 18 H32 Z"/>
    <path d="M20 12 L6 28 H34 Z"/>
    <path d="M20 22 L10 36 H30 Z"/>
    <path d="M20 36 V40"/>`,
  cloud: `
    <path d="M12 24 C6 24 6 14 14 14 C16 8 28 8 30 14 C38 14 38 24 32 24 Z"/>`,
  taj: `
    <path d="M40 6 V12"/>
    <circle cx="40" cy="5" r="1.6"/>
    <path d="M40 12 C26 14 20 26 20 34 H60 C60 26 54 14 40 12 Z"/>
    <path d="M16 30 C12 30 10 36 10 40 H22 C22 36 20 30 16 30 Z"/>
    <path d="M64 30 C60 30 58 36 58 40 H70 C70 36 68 30 64 30 Z"/>
    <path d="M10 40 H70 V66 H10 Z"/>
    <path d="M32 66 V50 C32 44 48 44 48 50 V66"/>
    <path d="M16 66 V56 C16 52 26 52 26 56 V66"/>
    <path d="M54 66 V56 C54 52 64 52 64 56 V66"/>
    <path d="M4 28 V66 M4 28 V22"/>
    <circle cx="4" cy="21" r="2"/>
    <path d="M1 40 H7 M1 52 H7"/>
    <path d="M76 28 V66 M76 28 V22"/>
    <circle cx="76" cy="21" r="2"/>
    <path d="M73 40 H79 M73 52 H79"/>`,
  lotus: `
    <path d="M40 66 C18 64 6 40 18 20 C28 32 36 36 40 26 C44 36 52 32 62 20 C74 40 62 64 40 66 Z"/>
    <path d="M40 60 C26 58 18 40 28 26 C34 36 38 38 40 30 C42 38 46 36 52 26 C62 40 54 58 40 60 Z"/>
    <path d="M24 66 H56"/>`,
  gate: `
    <path d="M8 70 V20 H72 V70"/>
    <path d="M8 20 H72"/>
    <path d="M12 12 H68 L72 20 H8 Z"/>
    <path d="M24 70 V42 C24 28 56 28 56 42 V70"/>
    <circle cx="40" cy="24" r="3"/>
    <path d="M4 70 H18 M62 70 H76"/>`,
  minar: `
    <path d="M22 8 L16 70 H36 L30 8 Z"/>
    <path d="M18 22 H34 M17 38 H35 M16 54 H36"/>
    <path d="M22 8 C22 3 30 3 30 8"/>
    <circle cx="26" cy="2" r="1.6"/>`,
  charminar: `
    <path d="M8 18 H32 V58 H8 Z"/>
    <path d="M8 18 V8 H12 V18 M28 18 V8 H32 V18"/>
    <path d="M8 58 V66 H12 V58 M28 58 V66 H32 V58"/>
    <path d="M14 58 V40 C14 32 26 32 26 40 V58"/>
    <path d="M16 18 V26 H24 V18"/>
    <circle cx="10" cy="6" r="1.4"/>
    <circle cx="30" cy="6" r="1.4"/>`,
};

const placements = [
  mark(36, 70, 0.95, -2, icons.gate),
  mark(168, 200, 0.92, -4, icons.lotus),
  mark(400, 56, 1.05, 1, icons.taj),
  mark(730, 390, 0.9, 3, icons.minar),
  mark(1368, 48, 1.15, -3, icons.charminar),
  mark(70, 390, 0.95, -7, icons.house),
  mark(980, 36, 0.82, 8, icons.house),
  mark(1248, 268, 0.9, 4, icons.building),
  mark(590, 18, 0.72, -5, icons.tallBuilding),
  mark(1508, 300, 0.7, 6, icons.building),
  mark(292, 372, 1.02, -5, icons.auto),
  mark(1088, 168, 0.88, 6, icons.auto),
  mark(840, 128, 0.92, 3, icons.car),
  mark(188, 488, 0.78, -8, icons.car),
  mark(1040, 430, 0.95, -2, icons.bus),
  mark(500, 488, 0.86, 5, icons.bike),
  mark(1448, 410, 0.8, -6, icons.bike),
  mark(768, 228, 0.92, 4, icons.truck),
  mark(118, 148, 0.72, 8, icons.truck),
  mark(1288, 150, 0.7, -7, icons.truck),
  mark(638, 188, 0.92, -4, icons.worker),
  mark(910, 292, 0.9, 5, icons.chef),
  mark(1488, 190, 0.76, 9, icons.worker),
  mark(350, 48, 0.62, 0, icons.pin),
  mark(872, 408, 0.58, 10, icons.pin),
  mark(1228, 70, 0.55, -8, icons.pin),
  mark(58, 286, 0.5, 12, icons.pin),
  mark(1540, 470, 0.52, -6, icons.pin),
  mark(528, 338, 0.82, -5, icons.suitcase),
  mark(1172, 338, 0.76, 7, icons.shopping),
  mark(392, 518, 0.72, 4, icons.box),
  mark(1310, 500, 0.66, -6, icons.box),
  mark(680, 500, 0.6, 12, icons.box),
  mark(248, 28, 0.68, 22, icons.wrench),
  mark(1004, 518, 0.68, -16, icons.screwdriver),
  mark(580, 430, 0.62, 18, icons.hammer),
  mark(698, 48, 0.64, 8, icons.plug),
  mark(1524, 70, 0.6, -10, icons.bulb),
  mark(148, 548, 0.74, 10, icons.broom),
  mark(812, 530, 0.66, -4, icons.bucket),
  mark(1410, 530, 0.6, 8, icons.mop),
  mark(1118, 70, 0.7, 14, icons.pan),
  mark(470, 28, 0.58, -10, icons.chefHat),
  mark(960, 200, 0.62, 6, icons.pot),
  mark(78, 518, 0.78, 0, icons.tree),
  mark(608, 540, 0.68, 6, icons.tree),
  mark(1390, 540, 0.74, -4, icons.tree),
  mark(330, 268, 0.58, 0, icons.pine),
  mark(880, 20, 0.52, 4, icons.pine),
  mark(240, 8, 0.82, 0, icons.cloud),
  mark(700, 6, 0.7, 4, icons.cloud),
  mark(1190, 8, 0.76, -3, icons.cloud),
  mark(40, 8, 0.52, 2, icons.cloud),
  mark(980, 230, 0.5, 8, icons.cloud),
  mark(1560, 140, 0.48, -6, icons.cloud),
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640" fill="none" aria-hidden="true">
  <g stroke="#94A3B8" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" opacity="0.92">
    ${placements.join("\n    ")}
  </g>
</svg>
`;

writeFileSync(join(webBrand, "footer-doodle.svg"), svg);
writeFileSync(join(appBrand, "footer-doodle.svg"), svg);
console.log("Wrote footer doodle pattern for web and mobile.");
