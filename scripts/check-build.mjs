import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('_site');
const read=p=>readFile(path.join(root,p),'utf8');
const index=JSON.parse(await read('notes-index.json'));
assert(Array.isArray(index),'Expected an array of Markdown paths');
assert.equal(new Set(index).size,index.length,'Duplicate document URLs');
async function exists(url){const file=path.resolve(root,'.'+decodeURIComponent(url));assert(file.startsWith(root+path.sep),'Asset path escapes build');await access(file);return file;}
for(const url of index){assert(url.startsWith('/notes/')&&url.endsWith('.md'));const md=await readFile(await exists(url),'utf8');for(const match of md.matchAll(/!?\[[^\]]*\]\(([^\s)]+)\)/g)){const target=new URL(match[1],'https://preview.example'+url);if(target.origin==='https://preview.example')await exists(target.pathname);}}
const html=await read('index.html');
const catalog = JSON.parse(await read('archive-index.json'));
const searchable = JSON.parse(await read('archive-search.json'));
for (const rows of [catalog, searchable]) {
  assert.deepEqual(rows.map(row => row.path).sort(), [...index].sort(), 'Both indexes must cover every Markdown file');
}
for (const row of catalog) {
  assert(row.title && row.category && Number.isInteger(row.minutes) && row.minutes >= 1);
  assert.equal(typeof row.excerpt, 'string');
  assert(!('text' in row), 'The shelf must not download full article text');
}
for (const row of searchable) {
  const raw = await readFile(await exists(row.path), 'utf8');
  const normalize = text => text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trimEnd();
  assert.equal(normalize(row.text), normalize(raw), 'Full-text index must contain the original Markdown');
}
for(const match of html.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g))await exists('/'+match[1]);
const visible=html.replace(/<[^>]*>/g,'');assert(!/zone\s*2022/i.test(visible),'Old display name remains');assert(html.includes('<title>Lynn'));
assert(!(await read('notes-index.json')).includes('{%'),'Liquid was not rendered');
console.log(`PASS: ${index.length} documents, relative links, local assets, rendered index and Lynn branding.`);

