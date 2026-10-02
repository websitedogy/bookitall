import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webBrand = join(root, "public", "brand");
const appBrand = join(root, "..", "mobile", "assets", "brand");
for (const dir of [webBrand, appBrand]) mkdirSync(dir, { recursive: true });

function mark(x, y, scale, rotate, body) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})">${body}</g>`;
}

const icons = {
  pin: `
    <path d="M18 4 C10 4 5 10 5 17 C5 28 18 40 18 40 S31 28 31 17 C31 10 26 4 18 4 Z"/>
    <circle cx="18" cy="16" r="4.5"/>`,
  charminar: `
    <path d="M6 22 H42 V62 H6 Z"/>
    <path d="M6 22 V10 H12 V22 M36 22 V10 H42 V22"/>
    <path d="M6 62 V72 H12 V62 M36 62 V72 H42 V62"/>
    <path d="M14 62 V40 C14 30 34 30 34 40 V62"/>
    <path d="M18 22 V32 H30 V22"/>
    <circle cx="9" cy="7" r="2"/>
    <circle cx="39" cy="7" r="2"/>`,
  car: `
    <path d="M4 34 L10 24 H22 L30 16 H52 L62 26 V36 H4 Z"/>
    <path d="M22 24 L28 17 H50 L58 26"/>
    <path d="M32 17 V26 M44 17 V26"/>
    <circle cx="18" cy="36" r="5"/>
    <circle cx="50" cy="36" r="5"/>`,
  gate: `
    <path d="M6 78 V22 H70 V78"/>
    <path d="M6 22 H70"/>
    <path d="M10 14 H66 L70 22 H6 Z"/>
    <path d="M22 78 V46 C22 30 54 30 54 46 V78"/>
    <circle cx="38" cy="28" r="3.2"/>
    <path d="M2 78 H16 M60 78 H74"/>`,
  signal: `
    <path d="M22 8 H40 V48 H22 Z"/>
    <circle cx="31" cy="16" r="3.2"/>
    <circle cx="31" cy="26" r="3.2"/>
    <circle cx="31" cy="36" r="3.2"/>
    <path d="M31 48 V78"/>
    <path d="M18 78 H44"/>`,
  auto: `
    <path d="M6 48 H16 L26 22 H62 C82 22 96 34 104 46 H118 V56 H6 Z"/>
    <path d="M26 22 V56"/>
    <path d="M48 22 V40 H92"/>
    <path d="M32 32 H46"/>
    <path d="M62 22 L70 8 H86"/>
    <circle cx="28" cy="56" r="6"/>
    <circle cx="92" cy="56" r="6"/>
    <circle cx="118" cy="52" r="3.2"/>`,
  person: `
    <circle cx="28" cy="12" r="8"/>
    <path d="M28 20 V46"/>
    <path d="M12 32 H40"/>
    <path d="M16 70 L28 46 L40 70"/>
    <path d="M40 32 L54 18"/>
    <rect x="48" y="8" width="14" height="22" rx="2"/>
    <path d="M52 14 H58 M52 18 H58"/>
    <path d="M70 6 C70 2 78 2 78 8 C78 14 70 16 70 16"/>
    <circle cx="74" cy="20" r="2"/>`,
  rider: `
    <circle cx="36" cy="78" r="16"/>
    <circle cx="108" cy="78" r="16"/>
    <path d="M36 78 L58 48 H88 L108 78"/>
    <path d="M58 48 L72 78 H98"/>
    <path d="M88 48 L104 28 H122"/>
    <path d="M104 28 L112 22"/>
    <circle cx="72" cy="28" r="10"/>
    <path d="M64 26 H80"/>
    <path d="M66 36 C62 48 60 58 66 66"/>
    <path d="M78 38 L96 52"/>
    <path d="M64 62 L50 74"/>
    <path d="M18 78 H8 M124 78 H136"/>`,
  taj: `
    <path d="M48 8 V16"/>
    <circle cx="48" cy="6" r="2.2"/>
    <path d="M48 16 C30 18 22 34 22 44 H74 C74 34 66 18 48 16 Z"/>
    <path d="M16 38 C10 38 8 46 8 52 H24 C24 46 22 38 16 38 Z"/>
    <path d="M80 38 C74 38 72 46 72 52 H88 C88 46 86 38 80 38 Z"/>
    <path d="M8 52 H88 V82 H8 Z"/>
    <path d="M36 82 V62 C36 54 60 54 60 62 V82"/>
    <path d="M16 82 V70 C16 64 28 64 28 70 V82"/>
    <path d="M68 82 V70 C68 64 80 64 80 70 V82"/>`,
  handPhone: `
    <path d="M18 46 C8 46 6 28 16 24 C14 14 28 10 32 20 C40 12 52 20 48 32 C58 34 58 48 48 50 Z"/>
    <rect x="28" y="6" width="22" height="36" rx="3"/>
    <path d="M34 14 H44 M39 28 L44 22"/>
    <circle cx="46" cy="18" r="2.4"/>`,
  helmet: `
    <path d="M12 36 C12 16 48 12 56 28 C64 18 78 24 74 40 H18"/>
    <path d="M18 40 H70"/>
    <path d="M22 40 V48 H62 V40"/>
    <path d="M28 28 H52"/>`,
  scooter: `
    <circle cx="22" cy="58" r="10"/>
    <circle cx="78" cy="58" r="10"/>
    <path d="M22 58 L40 28 H62 L78 58"/>
    <path d="M40 28 L48 58 H66"/>
    <path d="M62 28 L74 14 H88"/>
    <path d="M36 28 V18 H48"/>
    <path d="M48 22 H58"/>`,
  map: `
    <path d="M8 18 L28 10 L52 18 L72 10 V62 L52 70 L28 62 L8 70 Z"/>
    <path d="M28 10 V62 M52 18 V70"/>
    <path d="M36 28 C36 22 48 22 48 30 C48 40 36 42 36 42"/>
    <circle cx="42" cy="46" r="2"/>`,
  minar: `
    <path d="M28 6 L18 78 H46 L36 6 Z"/>
    <path d="M22 22 H42 M20 40 H44 M18 58 H46"/>
    <path d="M28 6 C28 1 36 1 36 6"/>
    <circle cx="32" cy="0" r="2.2"/>`,
  hotel: `
    <path d="M10 78 V22 H62 V78"/>
    <path d="M10 22 L36 6 L62 22"/>
    <path d="M18 34 H26 M34 34 H42 M50 34 H58"/>
    <path d="M18 48 H26 M34 48 H42 M50 48 H58"/>
    <path d="M18 62 H26 M50 62 H58"/>
    <path d="M30 78 V62 H42 V78"/>
    <path d="M22 22 V14 H30 V22"/>`,
  suitcase: `
    <path d="M10 24 H62 V70 H10 Z"/>
    <path d="M22 24 V12 H50 V24"/>
    <path d="M10 36 H62"/>
    <path d="M36 36 V58"/>
    <path d="M4 32 V40 M68 32 V40"/>`,
  plug: `
    <path d="M22 28 H50 V52 C50 64 22 64 22 52 Z"/>
    <path d="M30 28 V10 M42 28 V10"/>
    <path d="M36 64 V76"/>
    <path d="M28 76 H44"/>`,
  pipe: `
    <path d="M18 10 V36 H52 V68"/>
    <path d="M10 10 H26"/>
    <path d="M44 36 H60"/>
    <path d="M52 68 V82"/>
    <circle cx="52" cy="86" r="2.4"/>`,
  ac: `
    <path d="M6 16 H78 V50 H6 Z"/>
    <path d="M14 26 H70"/>
    <path d="M14 34 H70"/>
    <path d="M18 50 V66 M40 50 V72 M62 50 V66"/>`,
  broom: `
    <path d="M42 4 L30 42"/>
    <path d="M14 42 H58"/>
    <path d="M18 42 L12 74"/>
    <path d="M28 42 L26 74"/>
    <path d="M38 42 L40 74"/>
    <path d="M48 42 L54 74"/>`,
  mirror: `
    <circle cx="28" cy="28" r="18"/>
    <circle cx="28" cy="28" r="12"/>
    <path d="M28 46 L40 74"/>
    <path d="M34 74 H48"/>`,
  roller: `
    <path d="M4 18 H62 V40 H4 Z"/>
    <path d="M62 29 H78"/>
    <path d="M78 29 L92 58"/>
    <path d="M84 64 H100"/>`,
  saw: `
    <path d="M4 34 H66"/>
    <path d="M10 34 L16 48 L24 34 L32 48 L40 34 L48 48 L56 34"/>
    <path d="M66 20 H86 V46 H66 Z"/>
    <circle cx="76" cy="33" r="3"/>`,
  fridge: `
    <path d="M16 6 H56 V78 H16 Z"/>
    <path d="M16 36 H56"/>
    <path d="M48 16 V28 M48 48 V62"/>`,
  briefcase: `
    <path d="M8 28 H72 V70 H8 Z"/>
    <path d="M26 28 V16 H54 V28"/>
    <path d="M8 44 H72"/>
    <path d="M32 44 V52 H48 V44"/>`,
  pot: `
    <path d="M14 28 H58 V52 C58 66 14 66 14 52 Z"/>
    <path d="M14 28 C14 18 58 18 58 28"/>
    <path d="M6 36 H14 M58 36 H66"/>
    <path d="M28 18 C28 8 44 8 44 18"/>`,
  bus: `
    <path d="M8 22 H84 V58 H8 Z"/>
    <path d="M8 22 C8 12 16 12 20 12 H76 C82 12 84 18 84 22"/>
    <path d="M16 22 V40 H34 V22 M42 22 V40 H60 V22"/>
    <path d="M8 40 H84"/>
    <circle cx="24" cy="58" r="6"/>
    <circle cx="66" cy="58" r="6"/>
    <path d="M70 18 H80 V28"/>`,
  truck: `
    <path d="M4 24 H48 V58 H4 Z"/>
    <path d="M48 32 H70 L82 48 V58 H48"/>
    <path d="M54 32 V46 H74"/>
    <circle cx="20" cy="58" r="6"/>
    <circle cx="66" cy="58" r="6"/>`,
  boxes: `
    <path d="M8 40 L28 30 L48 40 L28 50 Z"/>
    <path d="M8 40 V58 L28 68 V50"/>
    <path d="M48 40 V58 L28 68"/>
    <path d="M36 28 L56 18 L76 28 L56 38 Z"/>
    <path d="M36 28 V46 L56 56 V38"/>
    <path d="M76 28 V46 L56 56"/>`,
  parcel: `
    <path d="M18 36 L8 28 L28 16 L48 28 L38 36"/>
    <path d="M18 36 V58 L38 70 V48"/>
    <path d="M38 36 V58"/>
    <path d="M48 28 V50 L38 58"/>
    <path d="M22 40 H34"/>`,
  sedan: `
    <path d="M4 40 L12 28 H28 L40 16 H78 L92 30 V44 H4 Z"/>
    <path d="M28 28 L36 18 H74 L86 30"/>
    <path d="M46 18 V30 M62 18 V30"/>
    <circle cx="26" cy="44" r="7"/>
    <circle cx="74" cy="44" r="7"/>`,
  gauge: `
    <circle cx="36" cy="36" r="26"/>
    <path d="M36 36 L50 22"/>
    <path d="M18 48 H22 M36 54 V50 M52 46 H48"/>
    <path d="M16 22 L20 26 M52 18 L48 24"/>`,
  shield: `
    <circle cx="22" cy="16" r="7"/>
    <path d="M22 23 V40"/>
    <path d="M10 32 H30"/>
    <path d="M14 58 L22 40 L30 58"/>
    <path d="M34 28 H62 V58 C62 70 34 74 34 58 Z"/>
    <path d="M40 46 L46 52 L56 38"/>`,
};

const roads = `
  <path d="M30 145 C200 115 380 175 620 125" stroke-dasharray="6 7"/>
  <path d="M700 175 C860 140 1040 190 1280 145" stroke-dasharray="6 7"/>
  <path d="M1320 190 C1460 160 1560 200 1660 170" stroke-dasharray="6 7"/>
  <path d="M40 300 C220 270 400 330 640 285" stroke-dasharray="6 7"/>
  <path d="M720 320 C900 285 1100 345 1380 300" stroke-dasharray="6 7"/>
  <path d="M420 455 C620 425 820 480 1100 440" stroke-dasharray="6 7"/>
  <path d="M1160 470 C1320 440 1480 490 1640 450" stroke-dasharray="6 7"/>
`;

const placements = [
  mark(36, 18, 1.05, -8, icons.pin),
  mark(150, 8, 1.0, 0, icons.charminar),
  mark(280, 36, 1.0, -3, icons.car),
  mark(430, 6, 0.95, 0, icons.gate),
  mark(590, 10, 0.95, 0, icons.signal),
  mark(720, 12, 1.0, 0, icons.hotel),
  mark(900, 16, 1.05, -2, icons.auto),
  mark(1160, 10, 1.0, 0, icons.person),
  mark(1360, 22, 0.9, -4, icons.suitcase),
  mark(1520, 16, 0.95, 4, icons.plug),
  mark(20, 175, 1.05, -6, icons.rider),
  mark(250, 185, 0.95, 2, icons.taj),
  mark(430, 205, 0.9, 6, icons.handPhone),
  mark(590, 190, 0.9, -8, icons.helmet),
  mark(760, 180, 0.95, 4, icons.scooter),
  mark(960, 170, 0.9, -4, icons.map),
  mark(1140, 160, 0.95, 2, icons.minar),
  mark(1320, 175, 0.85, 0, icons.shield),
  mark(1480, 185, 0.85, 6, icons.broom),
  mark(580, 325, 0.9, -2, icons.bus),
  mark(790, 335, 0.9, 2, icons.truck),
  mark(1000, 325, 0.85, -4, icons.boxes),
  mark(1180, 345, 0.85, 4, icons.parcel),
  mark(1340, 320, 0.85, 0, icons.ac),
  mark(1500, 340, 0.8, 4, icons.roller),
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1680 520" fill="none" aria-hidden="true">
  <g fill="none" stroke="#B7C3CE" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    ${roads}
    ${placements.join("\n    ")}
  </g>
</svg>
`;

writeFileSync(join(webBrand, "footer-doodle.svg"), svg);
writeFileSync(join(appBrand, "footer-doodle.svg"), svg);
console.log("Wrote Rapido-style footer doodle for web and mobile.");
