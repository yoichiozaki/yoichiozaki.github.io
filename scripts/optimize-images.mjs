import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, parse } from "path";
import { cpus } from "os";

const DIR = "public/images/trips/seattle-vancouver-2025";
const WEBP_QUALITY = 80;
const CONCURRENCY = Math.max(1, cpus().length - 1);

const files = (await readdir(DIR)).filter((f) =>
  /\.(jpe?g|png)$/i.test(f)
);

console.log(`Found ${files.length} images to optimize (concurrency: ${CONCURRENCY}).\n`);

const results = [];
let completed = 0;

async function processFile(file) {
  const src = join(DIR, file);
  const { name } = parse(file);
  const dest = join(DIR, `${name}.webp`);

  const st = await stat(src);
  const originalKB = Math.round(st.size / 1024);

  const buf = await sharp(src)
    .rotate()
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const newKB = Math.round(buf.length / 1024);
  const ratio = originalKB > 0 ? Math.round((1 - newKB / originalKB) * 100) : 0;

  await sharp(buf).toFile(dest);

  completed++;
  const msg = `[${completed}/${files.length}] ${file} (${originalKB}KB) → ${name}.webp (${newKB}KB)  -${ratio}%`;
  console.log(msg);
  return { originalKB, newKB };
}

// Process in batches of CONCURRENCY
for (let i = 0; i < files.length; i += CONCURRENCY) {
  const batch = files.slice(i, i + CONCURRENCY);
  const batchResults = await Promise.all(batch.map(processFile));
  results.push(...batchResults);
}

const totalOriginal = results.reduce((s, r) => s + r.originalKB, 0);
const totalNew = results.reduce((s, r) => s + r.newKB, 0);
const totalRatio = totalOriginal > 0 ? Math.round((1 - totalNew / totalOriginal) * 100) : 0;
console.log(`\nDone! ${Math.round(totalOriginal/1024)}MB → ${Math.round(totalNew/1024)}MB  (-${totalRatio}%)`);

