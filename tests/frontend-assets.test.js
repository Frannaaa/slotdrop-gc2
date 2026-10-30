import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Static asset paths can be broken even when JavaScript passes a syntax check.
// In particular, Home must not merge until its imported customer-common module exists.
const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
async function walk(folder) {
  const all = [];
  for (const item of await readdir(folder, {withFileTypes:true})) {
    const path = resolve(folder,item.name);
    if (item.isDirectory()) all.push(...await walk(path));
    else if (item.isFile() && /\.(html|js)$/.test(item.name)) all.push(path);
  }
  return all;
}
async function existsWithinPublic(filename) {
  if (!filename.startsWith(publicRoot+sep)) return false;
  try { return (await stat(filename)).isFile(); } catch { return false; }
}
test('served HTML scripts, stylesheets and relative JS imports resolve to real files',async()=>{
  const missing=[];
  for (const filename of await walk(publicRoot)) {
    const source=await readFile(filename,'utf8');
    const dependencies=[];
    if (filename.endsWith('.html')) {
      for (const match of source.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)) dependencies.push(match[1]);
      for (const match of source.matchAll(/<link\b[^>]*>/g)) {
        if (!/\brel=["']stylesheet["']/.test(match[0])) continue;
        const href=match[0].match(/\bhref=["']([^"']+)["']/);
        if (href) dependencies.push(href[1]);
      }
    } else {
      for (const match of source.matchAll(/\b(?:import|export)\s+(?:[^;'"]*?\s+from\s*)?["']([^"']+)["']/g)) {
        if (match[1].startsWith('.')) dependencies.push(match[1]);
      }
    }
    for (const link of dependencies) {
      if (!link.startsWith('/') && !link.startsWith('.')) continue; // remote or bare module
      const clean=link.split(/[?#]/,1)[0];
      const target=link.startsWith('/') ? resolve(publicRoot,'.'+clean) : resolve(dirname(filename),clean);
      if (!(await existsWithinPublic(target))) missing.push(filename.slice(publicRoot.length)+' -> '+link);
    }
  }
  assert.deepEqual(missing,[],'Missing first-party scripts, styles or module imports');
});
