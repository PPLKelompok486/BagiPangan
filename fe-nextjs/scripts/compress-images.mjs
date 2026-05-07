/**
 * Image compression script using sharp.
 * Run: node scripts/compress-images.mjs
 *
 * Compresses all JPG/PNG images in public/images (recursively) to WebP + replaces originals.
 * Target: < 400 KB per image, max width 1920px.
 */

import sharp from "sharp";
import { readdir, stat, rename, unlink } from "fs/promises";
import { join, extname, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_IMAGES_DIR = join(__dirname, "../public/images");

const CONFIG = {
  /** Max width in px — Next.js deviceSizes tops at 1920 */
  maxWidth: 1920,
  /** JPEG quality (1-100) */
  jpegQuality: 78,
  /** WebP quality (1-100) */
  webpQuality: 75,
  /** Don't process files already under this size (bytes) */
  skipIfUnderBytes: 200_000, // 200 KB
};

async function getAllImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllImages(full)));
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function compressImage(filePath) {
  const { size: originalSize } = await stat(filePath);

  if (originalSize < CONFIG.skipIfUnderBytes) {
    console.log(`  ⏭  Skipped (already small): ${basename(filePath)} — ${formatBytes(originalSize)}`);
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const isJpeg = ext === ".jpg" || ext === ".jpeg";
  const tempPath = filePath + ".tmp";

  try {
    const img = sharp(filePath);
    const meta = await img.metadata();

    // Resize only if wider than maxWidth
    const pipeline = meta.width > CONFIG.maxWidth
      ? img.resize(CONFIG.maxWidth, null, { withoutEnlargement: true })
      : img;

    if (isJpeg) {
      await pipeline.jpeg({ quality: CONFIG.jpegQuality, progressive: true, mozjpeg: true }).toFile(tempPath);
    } else {
      // PNG → convert to JPEG (much smaller)
      await pipeline.jpeg({ quality: CONFIG.jpegQuality, progressive: true, mozjpeg: true }).toFile(tempPath);
    }

    const { size: newSize } = await stat(tempPath);

    if (newSize < originalSize) {
      await unlink(filePath);
      await rename(tempPath, filePath);
      const saved = originalSize - newSize;
      const pct = ((saved / originalSize) * 100).toFixed(1);
      console.log(`  ✅ ${basename(filePath)}: ${formatBytes(originalSize)} → ${formatBytes(newSize)} (saved ${formatBytes(saved)}, ${pct}%)`);
    } else {
      // New file is bigger, keep original
      await unlink(tempPath);
      console.log(`  ℹ️  ${basename(filePath)}: Skipped — compressed (${formatBytes(newSize)}) not smaller than original (${formatBytes(originalSize)})`);
    }
  } catch (err) {
    // Clean up temp if it exists
    try { await unlink(tempPath); } catch { /* ignore */ }
    console.error(`  ❌ Error processing ${basename(filePath)}: ${err.message}`);
  }
}

async function main() {
  console.log("🔍 Scanning for images in public/images...\n");
  const images = await getAllImages(PUBLIC_IMAGES_DIR);

  if (images.length === 0) {
    console.log("No images found.");
    return;
  }

  console.log(`Found ${images.length} image(s). Compressing...\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const img of images) {
    const { size: before } = await stat(img);
    totalBefore += before;
    await compressImage(img);
    const { size: after } = await stat(img);
    totalAfter += after;
  }

  const totalSaved = totalBefore - totalAfter;
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📊 Summary:`);
  console.log(`   Before : ${formatBytes(totalBefore)}`);
  console.log(`   After  : ${formatBytes(totalAfter)}`);
  console.log(`   Saved  : ${formatBytes(totalSaved)} (${((totalSaved / totalBefore) * 100).toFixed(1)}%)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
