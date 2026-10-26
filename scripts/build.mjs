import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true}); await mkdir('dist/src',{recursive:true}); await mkdir('dist/examples',{recursive:true});
for(const f of ['index.html','styles.css']) await cp(f,`dist/${f}`); await cp('src/app.mjs','dist/src/app.mjs'); await cp('src/core.mjs','dist/src/core.mjs'); await cp('examples/catalog.json','dist/examples/catalog.json');
