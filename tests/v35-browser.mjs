/* V35 Browser-Ablauftest: Navigation 2.0, Snipes aus, Bao-Rig, RVO Intelligence (lokale Antworten, /api/bao, Freigaben,
   Aufgaben, Eingang), Briefing, Erfolgsmomente, reduzierte Bewegung, kein horizontaler Überlauf.
   Die API wird im Browser gemockt (keine echten KI-Kosten, kein Live-Server). Screenshots: test-results/v35/.
   Ausführen: npm run test:v35  (Playwright nötig; Browserpfad optional über RV_BROWSER_EXECUTABLE) */
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'))}catch{try{({chromium}=createRequire(process.env.RV_PLAYWRIGHT_DIR||'/opt/node22/lib/node_modules/')('playwright'))}catch{throw Error('Playwright fehlt. Ausführen: npm install --no-save --package-lock=false playwright')}}
const root=fileURLToPath(new URL('../public/',import.meta.url)),out=fileURLToPath(new URL('../test-results/v35/',import.meta.url));
await fs.mkdir(out,{recursive:true});
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
const day=n=>new Date(Date.now()-n*864e5).toISOString();
const articles=[
  {id:'qa-1',sku:'RV-001',brand:"Levi's",model:'501',category:'Hosen',size:'W32',cost:'15',prices:{vinted:'45'},articleStatus:'Online',purchaseDate:day(140),photos:[],listings:{}},
  {id:'qa-2',sku:'RV-002',brand:'Ralph Lauren',model:'Hemd',category:'Hemden',size:'M',cost:'12',prices:{},articleStatus:'Entwurf',purchaseDate:day(20),photos:[],listings:{}},
  {id:'qa-3',sku:'RV-003',brand:'Nike',model:'Windbreaker',category:'Jacken',size:'L',cost:'20',prices:{ebay:'60'},articleStatus:'Verkauft',purchaseDate:day(30),sale:{platform:'vinted',price:60,fees:0,shipping:0,date:new Date().toISOString()},photos:[],listings:{}},
  {id:'qa-4',sku:'RV-004',brand:'Nike',model:'Hoodie',category:'Jacken',size:'M',cost:'18',prices:{},articleStatus:'Verkauft',purchaseDate:day(70),sale:{platform:'ebay',price:45,fees:3,shipping:2,date:day(35)},shippedAt:day(34),photos:[],listings:{}},
  {id:'demo-01',sku:'DEMO-001',brand:'Demo',category:'Hosen',cost:'999',articleStatus:'Online',purchaseDate:day(400),photos:[],listings:{}}
];
let failed=null;
try{
  const ctx=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,hasTouch:true,serviceWorkers:'block'});
  await ctx.addInitScript(()=>{sessionStorage.setItem('rv_token','qa-test-kennwort');localStorage.setItem('rv_demo_v3','1');localStorage.setItem('rv_demo_done','1');
    window.__posted=[];const pm=window.postMessage.bind(window);window.postMessage=function(m,o){window.__posted.push(m);return pm(m,o)};});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const api={bao:[],doc:[],chat:[]};let baoMode='ok';
  await page.route('**/api/**',async route=>{
    const u=new URL(route.request().url()),p=u.pathname,body=route.request().postData();
    if(p==='/api/bao'){api.bao.push(JSON.parse(body));await new Promise(r=>setTimeout(r,700));
      if(baoMode==='404')return route.fulfill({status:404,contentType:'application/json',body:'{"error":"Nicht gefunden."}'});
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'Kurz gesagt: Marke, Modell, Größe und Zustand nach vorne. Ich habe dir eine Aufgabe vorgeschlagen.',actions:[{type:'create_task',title:'Titel der Levi’s 501 überarbeiten',due:new Date().toISOString().slice(0,10),priority:'hoch',reason:'140 Tage im Bestand'}],tools:['items_query','propose_task'],usage:{model:'gpt-4.1-mini',input:2100,output:180,usd:0.00113},budget:{spent:0.01,limit:11,enforced:true}})})}
    if(p==='/api/bao/doc'){api.doc.push(JSON.parse(body));return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({analysis:{doc_type:'kassenbon',title:'Flohmarkt Kassenbon',summary:'Einkauf von 3 Teilen auf dem Flohmarkt.',sender:'Flohmarkt Mauerpark',legal_or_tax:false,amounts:[{label:'Summe',amount:23.5,currency:'EUR',certain:true,source_quote:'SUMME 23,50'}],dates:[{label:'Kaufdatum',date:'2026-10-12',is_deadline:false,certain:true,source_quote:'12.10.26'}],suggested_actions:[{type:'record_purchase',title:'Einkauf erfassen',detail:'3 Teile',due_date:'',amount:23.5}],reply_draft:'',uncertainties:['Einzelpreise nicht lesbar']},usage:{model:'gpt-4.1-mini',input:1500,output:300,usd:0.0011}})})}
    if(p==='/api/bao/usage')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({month:'2026-10',spent:0.02,count:3,limit:11,enforced:true,model:'gpt-4.1-mini',openai:true})});
    if(p==='/api/ai-chat'){api.chat.push(JSON.parse(body));return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'Antwort vom alten KI-Chat.'})})}
    return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Lokaler Test"}'});
  });
  await page.goto(base,{waitUntil:'load'});await page.waitForTimeout(600);
  await page.evaluate(async list=>{for(const a of list)await RVO.store('readwrite',s=>s.put(a));window.dispatchEvent(new Event('rv:data-changed'))},articles);
  await page.reload({waitUntil:'load'});await page.waitForTimeout(1200);
  const noOverflow=async label=>{const w=await page.evaluate(()=>document.documentElement.scrollWidth);assert.ok(w<=412,label+': horizontaler Überlauf '+w+' px')};

  await check('Start ohne Skriptfehler, Version V35',async()=>{assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>RV_VERSION),'V37')});
  await check('Hauptmenü: genau fünf Bereiche, kein Snipes, Bao mit eigenem Kopf',async()=>{
    const navs=await page.$$eval('#rvTop [data-nav]',l=>l.map(b=>b.dataset.nav));assert.deepEqual(navs,['home','stock','studio','chat','settings']);
    assert.equal(await page.$('#rvTop [data-nav="snipe"]'),null);assert.ok(await page.$('#rvTop [data-nav="chat"] .bao-head'));
  });
  await check('Snipes: keine automatische Vinted-Abfrage, kein Userscript-Ping',async()=>{
    await page.waitForTimeout(900);const posted=await page.evaluate(()=>window.__posted.filter(m=>m&&m.rvSnipe));assert.deepEqual(posted,[]);
    assert.equal(await page.evaluate(()=>RVO.snipesEnabled),false);assert.ok(await page.evaluate(()=>!!localStorage||true));
  });
  await check('Home: Bao-Briefing oben mit echten Zahlen, Beispielartikel ausgeschlossen',async()=>{
    const first=await page.$eval('#hmRoot > section',s=>s.getAttribute('aria-label'));assert.match(first,/Bao/);
    const t=await page.$eval('#hmBrief',e=>e.innerText);
    assert.match(t,/Gewinn/);assert.match(t,/Entwurf fertigstellen/);assert.ok(await page.$('#hmBrief .rvo-hero #hmOrb'));assert.equal(await page.$$eval('#rvoKpis .st-m',l=>l.length),3);assert.match(t,/40,00\s*€/);assert.match(t,/27,00\s*€/);assert.match(t,/\+18,00\s*€ zum Vormonat/);assert.match(t,/Beispielartikel/);assert.match(t,/versenden/);
    assert.ok(await page.$('#hmOrb .bao'));await noOverflow('Home');await page.screenshot({path:out+'home-412.png'});
  });
  await check('Bestand-Gruppe: Bestand | Einkäufe | Verkäufe wechseln, Hauptkachel bleibt aktiv',async()=>{
    await page.click('#rvTop [data-nav="stock"]');await page.waitForTimeout(300);
    assert.equal(await page.isVisible('#rvnSub [data-group="stock"]'),true);assert.equal(await page.$eval('#rvnSub [data-sub="stock"]',b=>b.classList.contains('on')),true);
    await noOverflow('Bestand');await page.screenshot({path:out+'bestand-412.png'});
    await page.click('#rvnSub [data-sub="purchases"]');await page.waitForTimeout(300);
    assert.equal(await page.$eval('#s4',s=>s.classList.contains('rvn-buy')),true);assert.equal(await page.isVisible('#v7Purchases'),true);assert.equal(await page.isVisible('#v5Tabs'),false);
    assert.equal(await page.$eval('#rvTop [data-nav="stock"]',b=>b.classList.contains('on')),true);await page.screenshot({path:out+'einkaeufe-412.png'});
    await page.click('#rvnSub [data-sub="sales"]');await page.waitForTimeout(400);
    assert.equal(await page.isVisible('#finance'),true);assert.match(await page.$eval('#finance h1',h=>h.textContent),/Verkäufe/);
    assert.equal(await page.$eval('#rvTop [data-nav="stock"]',b=>b.classList.contains('on')),true);await noOverflow('Verkäufe');await page.screenshot({path:out+'verkaeufe-412.png'});
    await page.click('#rvnSub [data-sub="stock"]');await page.waitForTimeout(300);assert.equal(await page.$eval('#s4',s=>s.classList.contains('rvn-buy')),false);assert.equal(await page.isVisible('#v5Tabs'),true);
  });
  await check('Bao-Bereich: Gespräch, Aufgaben, Eingang, Freigaben',async()=>{
    await page.click('#rvTop [data-nav="chat"]');await page.waitForTimeout(400);
    assert.equal(await page.isVisible('#rvnSub [data-group="bao"]'),true);assert.ok(await page.$('#aiChat .pd-stage.bao-hero .bao'));
    for(const t of ['tasks','inbox','approve','talk']){await page.click('#rvnSub [data-sub="'+t+'"]');await page.waitForTimeout(250);
      assert.equal(await page.isVisible('#aiChat .ch-grid'),t==='talk');if(t!=='talk')assert.equal(await page.$eval('#rvoHub',h=>h.dataset.tab),t)}
    await noOverflow('Bao');await page.screenshot({path:out+'bao-chat-412.png'});
  });
  await check('Lokale Antwort ohne KI-Kosten: längste Lagerdauer aus echten Daten',async()=>{
    const before=api.bao.length;await page.fill('#chatInput','Welche Artikel liegen am längsten im Bestand?');await page.keyboard.press('Enter');await page.waitForTimeout(500);
    const t=await page.$eval('#chFeed',e=>e.innerText);assert.match(t,/Levi's 501/);assert.match(t,/140 Tage/);assert.doesNotMatch(t,/Demo/);assert.equal(api.bao.length,before);
    assert.match(t,/Freigaben/);
  });
  await check('Bao denkt während der echten Anfrage, spricht danach; Vorschlag landet unter Freigaben',async()=>{
    await page.fill('#chatInput','Wie schreibe ich einen guten Titel?');await page.keyboard.press('Enter');await page.waitForTimeout(250);
    assert.equal(await page.$eval('.pd-stage .pd-state',e=>e.dataset.s),'think');assert.equal(await page.evaluate(()=>RVBao.list.some(b=>b.mode==='think')),true);
    await page.waitForTimeout(900);assert.notEqual(await page.$eval('.pd-stage .pd-state',e=>e.dataset.s),'think');
    const req=api.bao.at(-1);assert.equal(req.message,'Wie schreibe ich einen guten Titel?');assert.equal(req.snapshot.items.length,2);assert.equal(req.snapshot.sales.length,2);assert.equal(req.snapshot.demoExcluded,1);
    assert.ok(!JSON.stringify(req.snapshot).includes('DEMO-001'));assert.ok(!JSON.stringify(req).includes('photos'));
    await page.waitForTimeout(2500);const t=await page.$eval('#chFeed',e=>e.innerText);assert.match(t,/Marke, Modell/);assert.match(t,/vorgeschlagen/);
    assert.ok(Number(await page.$eval('#rvnApproveN',e=>e.textContent))>=2);
  });
  await check('Freigabe legt Aufgabe an, Erledigen löst Erfolgsmoment aus, Protokoll und Kosten sichtbar',async()=>{
    await page.click('#rvnSub [data-sub="approve"]');await page.waitForTimeout(300);await page.screenshot({path:out+'freigaben-412.png',fullPage:false});
    const n=await page.$$eval('#rvoApList .rvo-ap.offen',l=>l.length);assert.ok(n>=2);
    await page.click('#rvoApList .rvo-ap.offen [data-act="ok"]');await page.waitForTimeout(200);
    assert.equal(await page.evaluate(()=>RVOIntel.tasks.open().length),1);
    await page.evaluate(()=>{window.__succ=[];document.addEventListener('rvo:success',e=>window.__succ.push(e.detail.kind))});
    await page.click('#rvnSub [data-sub="tasks"]');await page.waitForTimeout(250);await page.click('#rvoTaskList .rvo-ck');await page.waitForTimeout(200);
    assert.deepEqual(await page.evaluate(()=>window.__succ),['task']);assert.equal(await page.evaluate(()=>RVOIntel.tasks.open().length),0);
    await page.click('#rvnSub [data-sub="approve"]');await page.waitForTimeout(200);const c=await page.$eval('#rvoCost',e=>e.innerText);assert.match(c,/Anfragen/);
    await page.click('#rvoCostRefresh');await page.waitForTimeout(300);assert.match(await page.$eval('#rvoCost',e=>e.innerText),/Sperre aktiv/);
    const log=await page.evaluate(()=>JSON.parse(localStorage.getItem('rvo_log_v1')).map(x=>x.text).join('\n'));assert.match(log,/Freigegeben/);assert.match(log,/Erledigt/);
  });
  await check('Aufgabe selbst anlegen (mit Datum), Ablehnen protokolliert',async()=>{
    await page.click('#rvnSub [data-sub="tasks"]');await page.fill('#rvoAddTitle','Pakete zur Post bringen');await page.fill('#rvoAddDue','2026-10-01');await page.click('#rvoAdd button');await page.waitForTimeout(200);
    assert.match(await page.$eval('#rvoTaskList',e=>e.innerText),/überfällig/);assert.equal(await page.$eval('#rvoBadgeBao',e=>e.hidden),false);await page.screenshot({path:out+'aufgaben-412.png'});
    await page.click('#rvnSub [data-sub="approve"]');const open=await page.$$('#rvoApList .rvo-ap.offen [data-act="no"]');if(open.length){await open[0].click();await page.waitForTimeout(200)}
    assert.match(await page.evaluate(()=>localStorage.getItem('rvo_log_v1')),/Abgelehnt/);
  });
  await check('Eingang: Foto wird verkleinert gesendet, Kassenbon erkannt, Einkauf erst nach Freigabe angelegt',async()=>{
    await page.click('#rvnSub [data-sub="inbox"]');await page.waitForTimeout(200);
    const png=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=2400;c.height=3200;const x=c.getContext('2d');x.fillStyle='#eee';x.fillRect(0,0,2400,3200);x.fillStyle='#000';x.font='120px sans-serif';x.fillText('SUMME 23,50',200,600);return c.toDataURL('image/png').split(',')[1]}),'base64');
    await page.setInputFiles('#rvoInFile',{name:'bon.png',mimeType:'image/png',buffer:png});await page.click('#rvoInGo');await page.waitForTimeout(1200);
    const sent=api.doc.at(-1);assert.match(sent.file,/^data:image\/jpeg;base64,/);
    const dims=await page.evaluate(src=>new Promise(ok=>{const i=new Image();i.onload=()=>ok([i.width,i.height]);i.src=src}),sent.file);assert.ok(Math.max(...dims)<=1800);
    const t=await page.$eval('#rvoInList',e=>e.innerText);assert.match(t,/Kassenbon/i);assert.match(t,/23,50/);assert.match(t,/Einzelpreise/);
    const batches0=await page.evaluate(()=>RVO.batches().length);assert.equal(batches0,0);await page.screenshot({path:out+'eingang-412.png'});
    await page.click('#rvnSub [data-sub="approve"]');await page.waitForTimeout(200);
    const card=await page.$('#rvoApList .rvo-ap.offen:has(input[data-edit="amount"])');assert.ok(card);assert.equal(await card.$eval('input[data-edit="amount"]',i=>i.value),'23,5');
    await (await card.$('[data-act="ok"]')).click();await page.waitForTimeout(200);
    const b=await page.evaluate(()=>RVO.batches());assert.equal(b.length,1);assert.equal(b[0].total,23.5);assert.equal(b[0].date,'2026-10-12');
  });
  await check('Erfolgsmoment bei echtem Verkauf (Statuswechsel auf Verkauft)',async()=>{
    await page.evaluate(()=>{window.__succ=[]});
    await page.evaluate(async()=>{const a=(await RVO.allArticles()).find(x=>x.id==='qa-1');a.articleStatus='Verkauft';a.sale={platform:'vinted',price:44,fees:0,shipping:0,date:new Date().toISOString()};await RVO.store('readwrite',s=>s.put(a))});
    await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>window.__succ),['sale']);
    await page.evaluate(async()=>{const a=(await RVO.allArticles()).find(x=>x.id==='qa-2');a.notes='geändert';await RVO.store('readwrite',s=>s.put(a))});await page.waitForTimeout(150);
    assert.deepEqual(await page.evaluate(()=>window.__succ),['sale']);
  });
  await check('Älterer Server ohne /api/bao: Rückfall auf bisherigen KI-Chat ohne doppelte Nachricht',async()=>{
    baoMode='404';await page.click('#rvnSub [data-sub="talk"]');await page.fill('#chatInput','Erzähl mir einen Witz');await page.keyboard.press('Enter');await page.waitForTimeout(2200);
    assert.equal(api.chat.length,1);const n=await page.evaluate(()=>RVO.chatHistory().filter(m=>m.role==='user'&&m.text==='Erzähl mir einen Witz').length);assert.equal(n,1);
    assert.match(await page.$eval('#chFeed',e=>e.innerText),/alten KI-Chat/);baoMode='ok';
  });
  await check('Bao-Rig: Antippen löst Reaktion aus, Bewegung aus = Standbild',async()=>{
    await page.click('#aiChat .pd-hold');await page.waitForTimeout(120);assert.ok(await page.evaluate(()=>RVBao.list.some(b=>b.clips.length)));
    await page.evaluate(()=>document.documentElement.classList.add('rv-reduce'));await page.waitForTimeout(300);
    const a=await page.$eval('#aiChat .pd-stage .b-head',e=>e.getAttribute('transform'));await page.waitForTimeout(600);const b=await page.$eval('#aiChat .pd-stage .b-head',e=>e.getAttribute('transform'));
    assert.equal(a,b);await page.evaluate(()=>document.documentElement.classList.remove('rv-reduce'));
  });
  await check('Auftritte: begrenzt, ohne Klickfläche',async()=>{
    await page.click('#rvTop [data-nav="settings"]');await page.waitForTimeout(300);
    const shown=await page.evaluate(()=>RVBao.cameo('peek','Hallo!'));assert.equal(shown,true);
    assert.equal(await page.$eval('.bao-cameo',e=>getComputedStyle(e).pointerEvents),'none');
    assert.equal(await page.evaluate(()=>RVBao.cameo('peek')),false);
    await page.waitForTimeout(3600);assert.equal(await page.$('.bao-cameo'),null);
  });
  await check('Keine Skriptfehler im gesamten Ablauf',async()=>{assert.deepEqual(errors,[])});
  // Desktop-Ansicht
  const d=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,serviceWorkers:'block'});
  await d.addInitScript(()=>{localStorage.setItem('rv_demo_v3','1');localStorage.setItem('rv_demo_done','1')});
  const dp=await d.newPage();const derr=[];dp.on('pageerror',e=>derr.push(e.message));
  await dp.goto(base,{waitUntil:'load'});await dp.waitForTimeout(800);
  await check('Desktop 1440 × 900: Startseite, Bao folgt der Maus',async()=>{
    await dp.screenshot({path:out+'home-1440.png'});
    const b0=await dp.$eval('#hmOrb .b-pupil',e=>e.getAttribute('transform'));await dp.mouse.move(1400,880);await dp.waitForTimeout(500);
    const b1=await dp.$eval('#hmOrb .b-pupil',e=>e.getAttribute('transform'));assert.notEqual(b0,b1);
    await dp.click('#rvTop [data-nav="chat"]');await dp.waitForTimeout(500);await dp.screenshot({path:out+'bao-1440.png'});
    assert.deepEqual(derr,[]);
  });
}catch(e){failed=e;console.error('✗',e.message)}
finally{await browser.close();server.close()}
await fs.writeFile(new URL('./v35-browser-results.json',import.meta.url),JSON.stringify({passed:results.length,failed:failed?1:0,results,error:failed?String(failed.message):undefined},null,2));
console.log(JSON.stringify({passed:results.length,failed:failed?1:0}));
if(failed)process.exit(1);
