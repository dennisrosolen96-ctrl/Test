import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url);
await fs.copyFile(new URL('app.js',root),new URL('public/app.js',root));
console.log('RV Studio V16: public/app.js aus der autoritativen app.js aktualisiert. Kein Framework-Build erforderlich.');
