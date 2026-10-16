/* V31.3 Fotostudio – Browser-Ablauftest mit gemockter Poof-API (keine echten Credits, kein Live-Server).
   Prüft: kein Poof-Aufruf ohne Klick, Doppelklick-Schutz, Wiederverwendung der Freistellung, getrenntes Titelbild,
   Originalfotos unverändert, Credits-aufgebraucht-Meldung, Speichern + Neuladen, Bestandsliste, Umzug alter Titelbilder.
   Ausführen: npm run test:fotostudio  (Playwright nötig; Browserpfad optional über RV_BROWSER_EXECUTABLE) */
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'))}catch{try{({chromium}=createRequire(process.env.RV_PLAYWRIGHT_DIR||'/opt/node22/lib/node_modules/')('playwright'))}catch{throw Error('Playwright fehlt. Ausführen: npm install --no-save --package-lock=false playwright')}}
const root=fileURLToPath(new URL('../public/',import.meta.url));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.otf':'font/otf','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({error:'Lokaler Test: Backend nicht verbunden.'}));return}
  const file=path.join(root,decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root)){res.writeHead(403);res.end();return}
  try{const body=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base=`http://127.0.0.1:${server.address().port}`;
const results=[];const check=async(name,fn)=>{await fn();results.push(name);console.log('✓',name)};
const opts={headless:true};if(process.env.RV_BROWSER_EXECUTABLE)opts.executablePath=process.env.RV_BROWSER_EXECUTABLE;
const browser=await chromium.launch(opts);
try{
  const ctx=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,serviceWorkers:'block'});
  await ctx.addInitScript(()=>{sessionStorage.setItem('rv_token','qa-test-kennwort')});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let poof={calls:0,mode:'ok',bodies:[]};let dialogs=[];
  page.on('dialog',d=>{dialogs.push(d.message());d.dismiss()});
  await page.goto(base,{waitUntil:'load'});await page.waitForTimeout(800);
  // Testbilder im Browser erzeugen: dunkler Strickpullover auf dunklem, unruhigem Teppich (hoch- und querformatig)
  const make=(w,h,col)=>page.evaluate(([w,h,col])=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
    for(let i=0;i<w*h/40;i++){x.fillStyle=`rgb(${30+Math.random()*30|0},${28+Math.random()*25|0},${26+Math.random()*25|0})`;x.fillRect(Math.random()*w,Math.random()*h,3,3)}
    x.fillStyle=col;x.beginPath();x.moveTo(w*.3,h*.2);x.lineTo(w*.7,h*.2);x.lineTo(w*.92,h*.45);x.lineTo(w*.78,h*.5);x.lineTo(w*.74,h*.85);x.lineTo(w*.26,h*.85);x.lineTo(w*.22,h*.5);x.lineTo(w*.08,h*.45);x.closePath();x.fill();
    return c.toDataURL('image/jpeg',.9).split(',')[1]},[w,h,col]);
  const portrait=Buffer.from(await make(900,1200,'#2a1f24'),'base64'),landscape=Buffer.from(await make(1400,900,'#1d2433'),'base64');
  // Antwort wie Poof: transparentes PNG mit freigestelltem Motiv
  const cutPng=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=900;c.height=1200;const x=c.getContext('2d');x.fillStyle='#5a2f3a';x.beginPath();x.moveTo(270,240);x.lineTo(630,240);x.lineTo(830,540);x.lineTo(700,600);x.lineTo(666,1020);x.lineTo(234,1020);x.lineTo(200,600);x.lineTo(70,540);x.closePath();x.fill();return c.toDataURL('image/png')});
  await page.route('**/api/poof',async route=>{
    if(route.request().method()==='GET'){await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({available:true,account:{plan:'Free',maxCredits:50,usedCredits:poof.calls}})});return}
    poof.calls++;poof.bodies.push(route.request().headers()['x-rv-password']);await new Promise(r=>setTimeout(r,300));
    if(poof.mode==='credits'){await route.fulfill({status:402,contentType:'application/json',body:JSON.stringify({error:'Deine Poof-Credits für diesen Monat sind aufgebraucht. Originalfotos und vorhandene Titelbilder bleiben erhalten.',code:'payment_required'})});return}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({image:cutPng,engine:'poof',confidence:0.98,requestId:'req_qa'})});
  });
  await page.click('#rvTop [data-nav="studio"]');await page.waitForTimeout(400);
  await page.setInputFiles('#upload',[{name:'hoch.jpg',mimeType:'image/jpeg',buffer:portrait},{name:'quer.jpg',mimeType:'image/jpeg',buffer:landscape}]);
  await page.waitForTimeout(1500);
  await check('Hochladen löst keinen Poof-Aufruf aus (nur auf Klick)',async()=>{assert.equal(poof.calls,0);assert.match(await page.textContent('#sxCoverStatus'),/Klick|Titelbild erstellen/)});
  const origPhotos=await page.$$eval('#photos .sx-thumb:not(.cover) img',l=>l.map(i=>i.src));
  await check('Zwei Originalfotos (hoch und quer) vorhanden',async()=>assert.equal(origPhotos.length,2));
  await page.evaluate(()=>{document.getElementById('sxCoverRedo').click();document.getElementById('sxCoverRedo').click();document.getElementById('sxCoverMake').click()});
  await page.waitForFunction(()=>document.querySelector('#sxCover img'),null,{timeout:15000});await page.waitForTimeout(300);
  await check('Dreifachklick erzeugt genau einen Poof-Aufruf, Kennwort im Header',async()=>{assert.equal(poof.calls,1);assert.equal(poof.bodies[0],'qa-test-kennwort')});
  const cover1=await page.getAttribute('#sxCover img','src');
  await check('Titelbild erstellt, Abzeichen „Poof.bg“, JPEG im 4:5-Format',async()=>{
    assert.match(cover1,/^data:image\/jpeg/);assert.match(await page.textContent('#sxCover .badge'),/Poof\.bg/);
    const [w,h]=await page.evaluate(s=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.naturalWidth,i.naturalHeight]);i.src=s}),cover1);assert.equal(w,1000);assert.equal(h,1250)});
  await check('Originalfotos unverändert, Titelbild als eigene Kachel davor',async()=>{
    assert.deepEqual(await page.$$eval('#photos .sx-thumb:not(.cover) img',l=>l.map(i=>i.src)),origPhotos);
    assert.equal(await page.$$eval('#photos .sx-thumb.cover',l=>l.length),1)});
  await page.evaluate(()=>document.querySelector('#sxStyle [data-style="studio"]').click());await page.waitForTimeout(900);
  await page.evaluate(()=>document.querySelector('#sxSwatches button:nth-child(3)').click());await page.waitForTimeout(900);
  await check('Stil- und Hintergrundwechsel ohne neuen Poof-Aufruf',async()=>{assert.equal(poof.calls,1);assert.notEqual(await page.getAttribute('#sxCover img','src'),cover1)});
  await page.evaluate(()=>document.getElementById('sxCutMake').click());await page.waitForTimeout(600);
  await check('„Nur freistellen“ bei vorhandener Freistellung fragt nach und verbraucht ohne Zustimmung keinen Credit',async()=>{assert.ok(dialogs.some(d=>/Credit/.test(d)));assert.equal(poof.calls,1)});
  await check('Transparente Freistellung (PNG) separat sichtbar',async()=>{assert.equal(await page.getAttribute('#sxCutView','hidden'),null);assert.match(await page.getAttribute('#sxCutImg img','src'),/^data:image\/png/)});
  // Credits aufgebraucht beim zweiten Ausgangsfoto: Fehlermeldung, bisheriges Titelbild bleibt
  poof.mode='credits';const coverBefore=await page.getAttribute('#sxCover img','src');
  await page.evaluate(()=>document.querySelector('#sxSources button:nth-child(2)').click());
  await page.waitForFunction(()=>/aufgebraucht/.test(document.getElementById('sxCoverStatus').textContent),null,{timeout:15000});
  await check('Credits aufgebraucht: klare Meldung, Titelbild und Fotos bleiben erhalten, keine Wiederholung',async()=>{
    assert.equal(poof.calls,2);assert.equal(await page.getAttribute('#sxCover img','src'),coverBefore);
    assert.deepEqual(await page.$$eval('#photos .sx-thumb:not(.cover) img',l=>l.map(i=>i.src)),origPhotos)});
  poof.mode='ok';
  await page.screenshot({path:fileURLToPath(new URL('../test-results/fotostudio.png',import.meta.url)),fullPage:false}).catch(()=>{});
  await page.evaluate(()=>document.getElementById('saveArticle').click());await page.waitForTimeout(1200);
  const stored=await page.evaluate(()=>new Promise((ok,no)=>{const q=indexedDB.open('RVStudioDB');q.onsuccess=()=>{const t=q.result.transaction('articles','readonly').objectStore('articles').getAll();t.onsuccess=()=>ok(t.result);t.onerror=()=>no(t.error)}}));
  const art=stored.find(a=>a.rvCover);
  await check('Gespeichert: rvCover und rvCutout getrennt, Fotos ohne Titelbild',async()=>{
    assert.ok(art);assert.match(art.rvCover.src,/^data:image\/jpeg/);assert.equal(art.rvCover.engine,'poof');assert.match(art.rvCutout.src,/^data:image\/png/);
    assert.equal(art.photos.length,2);assert.ok(art.photos.every(p=>!p.cover));assert.deepEqual(art.photos.map(p=>p.src),origPhotos)});
  await page.reload({waitUntil:'load'});await page.waitForTimeout(1000);
  await page.click('#rvTop [data-nav="stock"]');await page.waitForTimeout(800);
  await check('Nach Neuladen zeigt die Bestandsliste das RVO-Titelbild',async()=>{
    const srcs=await page.$$eval('#s4 img',l=>l.map(i=>i.src));assert.ok(srcs.includes(art.rvCover.src))});
  await check('„KI auf dem Gerät“ nur wählbar, wenn das lokale Modell enthalten ist',async()=>{
    const hasModel=await fs.access(path.join(root,'ai-model','isnet-rv1.onnx.part00')).then(()=>true,()=>false);
    assert.equal(await page.$eval('#sxEngine [data-engine="ai"]',b=>b.disabled),!hasModel)});
  await check('Keine Skriptfehler',async()=>assert.deepEqual(errors,[]));

  // Umzug alter Daten: Titelbild war früher Foto Nr. 1 (cover:true)
  const ctx2=await browser.newContext({serviceWorkers:'block'});const p2=await ctx2.newPage();
  await p2.goto(base+'/manifest.webmanifest');
  await p2.evaluate(()=>new Promise(ok=>{const q=indexedDB.open('RVStudioDB',1);q.onupgradeneeded=()=>q.result.createObjectStore('articles',{keyPath:'id'});
    q.onsuccess=()=>{const t=q.result.transaction('articles','readwrite');t.objectStore('articles').put({id:'alt1',brand:'Alt',photos:[{src:'data:image/jpeg;base64,/9j/AAA=',cover:true},{src:'data:image/jpeg;base64,/9j/BBB='}],coverSettings:{engine:'ai',style:'app'},prices:{},listings:{}});t.oncomplete=()=>{q.result.close();ok()}}}));
  await p2.goto(base,{waitUntil:'load'});await p2.waitForTimeout(1500);
  const old=await p2.evaluate(()=>new Promise(ok=>{const q=indexedDB.open('RVStudioDB');q.onsuccess=()=>{const t=q.result.transaction('articles').objectStore('articles').get('alt1');t.onsuccess=()=>ok(t.result)}}));
  await check('Alte Artikel: Titelbild in rvCover verschoben, Originalfoto bleibt',async()=>{
    assert.equal(old.rvCover.src,'data:image/jpeg;base64,/9j/AAA=');assert.deepEqual(old.photos.map(p=>p.src),['data:image/jpeg;base64,/9j/BBB='])});
  await ctx2.close();
}finally{await browser.close();server.close()}
const report={scope:'Browser-Ablauftest Fotostudio mit gemockter Poof-API. Kein echter Poof-Aufruf, kein Android-Gerät.',passed:results.length,failed:0,tests:results};
await fs.writeFile(new URL('./fotostudio-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:results.length,failed:0}));
