import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Static asset paths can be broken even when JavaScript passes a syntax check.
// In particular, Home must not merge until its imported customer-common module exists.
const publicRoot = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
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
test('the site favicon is shipped and linked from each HTML page', async () => {
  const favicon = resolve(publicRoot, 'favicon.svg');
  assert.equal(await existsWithinPublic(favicon), true, 'Missing browser favicon');
  const icon = await readFile(favicon, 'utf8');
  assert.ok(icon.includes('<svg '), 'Invalid SVG favicon');
  const missing = [];
  for (const filename of await walk(publicRoot)) {
    if (!filename.endsWith('.html')) continue;
    const html = await readFile(filename, 'utf8');
    if (!html.includes('rel="icon" type="image/svg+xml" href="/favicon.svg"'))
      missing.push(filename.slice(publicRoot.length));
  }
  assert.deepEqual(missing, [], 'HTML pages without a favicon link');
});

test('Browse preloads its heading font and the stylesheet serves all three WOFF2 assets', async () => {
  const browse = await readFile(resolve(publicRoot, 'browse.html'), 'utf8');
  const css = await readFile(resolve(publicRoot, 'css/style.css'), 'utf8');
  assert.match(browse, /rel="preload" href="\/fonts\/SpaceGrotesk700\.woff2" as="font" type="font\/woff2" crossorigin/);
  for (const name of ['DMSans400', 'DMSans700', 'SpaceGrotesk700']) {
    const font = await readFile(resolve(publicRoot, 'fonts', name + '.woff2'));
    const ttf = await stat(resolve(publicRoot, 'fonts', name + '.ttf'));
    assert.equal(font.subarray(0, 4).toString(), 'wOF2');
    assert.ok(font.length < ttf.size, name + ' should be smaller than the fallback font');
    assert.ok(css.includes(`url("/fonts/${name}.woff2") format("woff2")`));
  }
});

test('served HTML scripts, stylesheets and relative JS imports resolve to real files',async()=>{
  const missing=[];
  for (const filename of await walk(publicRoot)) {
    const source=await readFile(filename,'utf8');
    const dependencies=[];
    if (filename.endsWith('.html')) {
      for (const match of source.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)) dependencies.push(match[1]);
      for (const match of source.matchAll(/<link\b[^>]*>/g)) {
        if (!/\brel=["'](?:stylesheet|preload|modulepreload)["']/.test(match[0])) continue;
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

test('Detail and Selection back links return to Browse', async () => {
  const pages = [
    ['detail.html', /<a\b[^>]*class="detail-back"[^>]*href="\/browse\.html"[^>]*>/],
    ['selection.html', /<a\b[^>]*href="\/browse\.html"[^>]*>Back to Browse<\/a>/],
  ];
  for (const [page, pattern] of pages) {
    const source = await readFile(resolve(publicRoot, page), 'utf8');
    assert.match(source, pattern, page + ' should provide a back link to Browse');
  }
});
