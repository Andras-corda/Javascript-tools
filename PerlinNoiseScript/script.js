// ============================================================
//  perlin.js — Générateur de bruit de Perlin
//  Usage : node PerlinNoiseGenerator.js [options]
//
//  Options :
//    --scale   <number>   Zoom du bruit        (défaut: 4)
//    --seed    <number>   Seed aléatoire       (défaut: aléatoire)
//    --count   <number>   Nombre d'images      (défaut: 1)
//    --width   <number>   Largeur en px        (défaut: 1024)
//    --height  <number>   Hauteur en px        (défaut: 1024)
//    --out     <string>   Dossier de sortie    (défaut: bureau)
//    --help               Affiche l'aide
// ============================================================

const { writeFileSync, mkdirSync, existsSync } = require("fs");
const { join } = require("path");
const { homedir } = require("os");
const { PNG } = require("pngjs");

// ── Résolution de l'argument --out vers un chemin réel ───────
function resolveOutputDir(raw) {
  const aliases = {
    bureau:    join(homedir(), "Desktop"),
    desktop:   join(homedir(), "Desktop"),
    documents: join(homedir(), "Documents"),
    downloads: join(homedir(), "Downloads"),
    home:      homedir(),
  };
  return aliases[raw?.toLowerCase()] ?? raw ?? join(homedir(), "Desktop");
}

// ── Parsing des arguments CLI ─────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get  = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : fallback;
  };

  if (args.includes("--help")) {
    console.log(`
  PerlinNoiseGenerator.js

  Options :
    --scale  <n>   Zoom du bruit       (défaut: 4)
    --seed   <n>   Seed                (défaut: aléatoire)
    --count  <n>   Nombre d'images     (défaut: 1)
    --width  <n>   Largeur px          (défaut: 1024)
    --height <n>   Hauteur px          (défaut: 1024)
    --out    <dir> Dossier de sortie   (défaut: bureau)
    --help         Affiche ce message
    `);
    process.exit(0);
  }

  return {
    scale:  parseFloat(get("--scale",  "4")),
    seed:   parseInt  (get("--seed",   String(Math.floor(Math.random() * 65536))), 10),
    count:  parseInt  (get("--count",  "1"),  10),
    width:  parseInt  (get("--width",  "1024"), 10),
    height: parseInt  (get("--height", "1024"), 10),
    outDir: resolveOutputDir(get("--out", "bureau")),
  };
}

// ── PRNG déterministe (mulberry32) ────────────────────────────
function makePRNG(seed) {
  let s = seed >>> 0;
  return function() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Table de permutation ──────────────────────────────────────
function buildPermutation(rand) {
  const p = Array.from({ length: 256 }, function(_, i) { return i; });
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
  }
  return p.concat(p);
}

// ── Fade / Lerp / Gradient 2D ─────────────────────────────────
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }

function grad2(hash, x, y) {
  switch (hash & 3) {
    case 0: return  x + y;
    case 1: return -x + y;
    case 2: return  x - y;
    case 3: return -x - y;
  }
}

// ── Bruit de Perlin 2D ────────────────────────────────────────
function perlin2D(perm, x, y) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  const aa = perm[perm[xi]     + yi];
  const ab = perm[perm[xi]     + yi + 1];
  const ba = perm[perm[xi + 1] + yi];
  const bb = perm[perm[xi + 1] + yi + 1];

  return lerp(
    lerp(grad2(aa, xf,     yf    ), grad2(ba, xf - 1, yf    ), u),
    lerp(grad2(ab, xf,     yf - 1), grad2(bb, xf - 1, yf - 1), u),
    v
  );
}

// ── Génération d'une image ────────────────────────────────────
function generateImage(cfg) {
  const width = cfg.width, height = cfg.height;
  const rand = makePRNG(cfg.seed);
  const perm = buildPermutation(rand);
  const png  = new PNG({ width: width, height: height, filterType: -1 });

  let min = Infinity, max = -Infinity;
  const raw = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x / width)  * cfg.scale;
      const ny = (y / height) * cfg.scale;
      const v  = perlin2D(perm, nx, ny);
      raw[y * width + x] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const range = max - min || 1;
  for (let i = 0; i < raw.length; i++) {
    const lum = Math.round(((raw[i] - min) / range) * 255);
    const idx = i * 4;
    png.data[idx]     = lum;
    png.data[idx + 1] = lum;
    png.data[idx + 2] = lum;
    png.data[idx + 3] = 255;
  }

  return PNG.sync.write(png);
}

// ── Timestamp court pour nommage ──────────────────────────────
function timestamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
    "_",
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join("");
}

// ── Point d'entrée ────────────────────────────────────────────
(function main() {
  const cfg = parseArgs();
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║        Perlin Noise Generator         ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log("  Résolution : " + cfg.width + "×" + cfg.height);
  console.log("  Scale      : " + cfg.scale);
  console.log("  Seed       : " + cfg.seed);
  console.log("  Images     : " + cfg.count);
  console.log("  Sortie     : " + cfg.outDir + "\n");

  if (!existsSync(cfg.outDir)) {
    mkdirSync(cfg.outDir, { recursive: true });
    console.log("  Dossier créé : " + cfg.outDir);
  }

  const ts = timestamp();

  for (let i = 0; i < cfg.count; i++) {
    const seed  = cfg.count === 1 ? cfg.seed : cfg.seed + i;
    const label = cfg.count === 1 ? ts : ts + "_" + String(i + 1).padStart(3, "0");
    const name  = "perlin_" + label + "_s" + cfg.scale + "_seed" + seed + ".png";
    const path  = join(cfg.outDir, name);

    const buf = generateImage(Object.assign({}, cfg, { seed: seed }));
    writeFileSync(path, buf);
    console.log("  \u2714 " + name);
  }

  console.log("\n  " + cfg.count + " image(s) générée(s) avec succès.\n");
})();
