import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('_site');
const read=p=>readFile(path.join(root,p),'utf8');
const index=JSON.parse(await read('notes-index.json'));
assert(Array.isArray(index)&&index.length>0,'Markdown index must not be empty');
assert.equal(new Set(index).size,index.length,'Duplicate document URLs');
async function exists(url){const file=path.resolve(root,'.'+decodeURIComponent(url));assert(file.startsWith(root+path.sep),'Asset path escapes build');await access(file);return file;}
for(const url of index){assert(url.startsWith('/notes/')&&url.endsWith('.md'));const md=await readFile(await exists(url),'utf8');for(const match of md.matchAll(/!?\[[^\]]*\]\(([^\s)]+)\)/g)){const target=new URL(match[1],'https://preview.example'+url);if(target.origin==='https://preview.example')await exists(target.pathname);}}
const html=await read('index.html');
for(const match of html.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g))await exists('/'+match[1]);
const visible=html.replace(/<[^>]*>/g,'');assert(!/zone\s*2022/i.test(visible),'Old display name remains');assert(html.includes('<title>Lynn'));
assert(!(await read('notes-index.json')).includes('{%'),'Liquid was not rendered');
console.log(`PASS: ${index.length} documents, relative links, local assets, rendered index and Lynn branding.`);

