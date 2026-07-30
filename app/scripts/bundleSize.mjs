import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function assertUnderBudget(name, sizeKb, limitKb) {
  if (sizeKb > limitKb) {
    throw new Error(
      `${name} is ${sizeKb.toFixed(1)} kB gzipped, over the ${limitKb} kB budget`,
    );
  }
  return true;
}

/** The entry chunk only. Async chunks (mermaid) are deliberately not measured. */
export async function entryChunkGzipKb(assetsDir) {
  const files = await readdir(assetsDir);
  const entry = files.find(f => /^index-.*\.js$/.test(f));
  if (!entry) throw new Error(`no entry chunk matching index-*.js in ${assetsDir}`);
  const buf = await readFile(path.join(assetsDir, entry));
  return { name: entry, kb: gzipSync(buf).length / 1024 };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const limitKb = Number(process.argv[2] ?? 200);
  const { name, kb } = await entryChunkGzipKb('dist/assets');
  console.log(`entry chunk ${name}: ${kb.toFixed(1)} kB gzipped (budget ${limitKb} kB)`);
  assertUnderBudget(name, kb, limitKb);
}
