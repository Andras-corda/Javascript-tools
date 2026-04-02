const { createCanvas } = require("canvas");
const fs               = require("fs");
const path             = require("path");
const GIFEncoder       = require("gifencoder");

// Configuration
const OUTPUT_DIR   = "OUTPUT";       // dossier de sortie
const FRAME_COUNT  = 24;              // nombre de frames
const WIDTH        = 128;             // largeur 
const HEIGHT       = 128;             // hauteur 
const GIF_DELAY    = 50;              // délai entre frames : ms
const GIF_QUALITY  = 10;             // qualité GIF (1=meilleure, 20=pire)

function generateFrame(time, width, height) {
  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext("2d");
  const img    = ctx.createImageData(width, height);
  const data   = img.data;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let n = 0.0;

      for (let dir = 0; dir < 2; dir++) {
        let sx = (x - dir * (width  / 2)) / width  * 2.0;
        let sy = (y - dir * (height / 2)) / height * 2.0;

        if (sx < -1) sx += 2; else if (sx >= 1) sx -= 2;
        if (sy < -1) sy += 2; else if (sy >= 1) sy -= 2;

        const mag    = sx * sx + sy * sy;
        let   spiral = Math.atan2(sy, sx);

        spiral += ((time * Math.PI * 2) - (mag * 10) + (dir * 2)) * (dir * 2 - 1);

        let outSpiral  = Math.sin(spiral) * 0.5 + 0.5;
        outSpiral     /= mag + 1;
        n             += outSpiral / 2;
      }

      n = Math.max(0, Math.min(n, 1));

      const v   = Math.min(255, Math.floor(n * 255));
      const idx = (y * width + x) * 4;
      data[idx]     = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`folder created : ${OUTPUT_DIR}`);
}

// Génération des frames PNG 
console.log(`\n => ${FRAME_COUNT} frame`);
const frames = [];

for (let i = 0; i < FRAME_COUNT; i++) {
  const time   = i / FRAME_COUNT;
  const canvas = generateFrame(time, WIDTH, HEIGHT);
  frames.push(canvas);

  const fileName = `frame_${String(i).padStart(2, "0")}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  process.stdout.write(`  ✓ ${fileName}\n`);
}

// GIF
console.log(`\n GIF`);

const gifPath   = path.join(OUTPUT_DIR, "portal.gif");
const encoder   = new GIFEncoder(WIDTH, HEIGHT);
const gifStream = fs.createWriteStream(gifPath);

encoder.createReadStream().pipe(gifStream);
encoder.start();
encoder.setRepeat(0);        // 0
encoder.setDelay(GIF_DELAY);
encoder.setQuality(GIF_QUALITY);

for (const frame of frames) {
  const ctx = frame.getContext("2d");
  encoder.addFrame(ctx);
}

encoder.finish();
console.log(`portal.gif`);

// Sprite sheet 
console.log(`\n sprite sheet`);

const sheetWidth  = WIDTH * FRAME_COUNT;
const sheetHeight = HEIGHT;
const sheet       = createCanvas(sheetWidth, sheetHeight);
const sheetCtx    = sheet.getContext("2d");

for (let i = 0; i < frames.length; i++) {
  sheetCtx.drawImage(frames[i], i * WIDTH, 0);
}

const sheetPath = path.join(OUTPUT_DIR, "portal_spritesheet.png");
fs.writeFileSync(sheetPath, sheet.toBuffer("image/png"));
console.log(`  ✓ portal_spritesheet.png  (${sheetWidth}×${sheetHeight}px)`);

//
console.log(`\nTerminé : ${path.resolve(OUTPUT_DIR)}`);
console.log(`${FRAME_COUNT} frames PNG (${WIDTH}×${HEIGHT}px chacune)`);
console.log(`portal.gif (${WIDTH}×${HEIGHT}px, ${GIF_DELAY}ms/frame)`);
console.log(`portal_spritesheet.png (${sheetWidth}×${sheetHeight}px)`);
