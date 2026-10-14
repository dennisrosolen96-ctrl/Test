/* Reproducible browser QA. Not executed in the restricted Codex environment:
   Chromium could not create local sockets there. Run on a normal workstation. */
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'))}catch{throw Error('Playwright fehlt. Ausführen: npm install --no-save --package-lock=false playwright@1.62.1')}
const root=fileURLToPath(new URL('../public/',import.meta.url));
const output=fileURLToPath(new URL('../test-results/',import.meta.url));
await fs.mkdir(output,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.otf':'font/otf','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({error:'Lokaler UI-Test: Cloudflare-Backend nicht verbunden.'}));return}
  const file=path.join(root,decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root)){res.writeHead(403);res.end();return}
  try{const body=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
const report=[];
try{
  const options={headless:true};
  if(process.env.RV_BROWSER_EXECUTABLE)options.executablePath=process.env.RV_BROWSER_EXECUTABLE;
  browser=await chromium.launch(options);
  for(const [width,height] of [[390,844],[430,932],[768,1024],[1440,900],[720,1280]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    // The command-center font and all art are local, including offline tests.
    await context.route('https://fonts.googleapis.com/**',route=>route.abort());
    await context.route('https://fonts.gstatic.com/**',route=>route.abort());
    await page.goto(base,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(1500);
    assert.equal(await page.locator('#v11-rev-val').textContent(),'0 €');
    assert.equal(await page.locator('#v11-cnt-val').textContent(),'0');
    assert.equal(await page.locator('#v11-pro-val').textContent(),'0 €');
    assert.equal(await page.locator('.v11-m svg.spark').count(),0);
    const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,sections:[...document.querySelectorAll('#v11Root > *')].map(e=>({name:e.className,rect:e.getBoundingClientRect().toJSON()})),frames:document.querySelectorAll('.hud-frame').length}));
    await page.screenshot({path:path.join(output,`v16-${width}x${height}-full.png`),fullPage:true});
    await page.screenshot({path:path.join(output,`v16-${width}x${height}.png`)});
    assert.ok(layout.scroll<=width,`Horizontaler Überlauf bei ${width}: ${layout.scroll}`);
    assert.ok(layout.frames>=20,'HUD-Rahmen wurden nicht gezeichnet');
    assert.deepEqual(errors,[],`JavaScriptfehler bei ${width}`);
    for(const [route,view] of [['studio','#s0'],['stock','#s4'],['purchases','#v7Purchases'],['sales','#s4'],['chat','#aiChat'],['settings','#settingsPage']]){
      await page.locator(`.v11-tiles [data-go="${route}"]`).click();
      await page.locator(view).waitFor({state:'visible'});
      if(route==='sales')await page.locator('#navSales[aria-current="page"]').waitFor();
      await page.locator('#navHome').click();
      await page.locator('#home').waitFor({state:'visible'});
    }
    await page.locator('.v11-prompts [data-ai-request]').first().click();
    await page.waitForFunction(()=>document.getElementById('homeAiFeed').textContent.includes('RV-Passwort fehlt'));
    assert.equal(await page.locator('#v16AiState').textContent(),'Einrichten');
    await page.locator('#v11Bell').click();
    assert.equal(await page.locator('details.v15-more-tools').getAttribute('open'),'');
    report.push({viewport:{width,height},errors,layout,navigation:'passed',missingAiPassword:'passed',notification:'passed'});
    console.log(`${width} × ${height}: Screenshot, Navigation, Nullwerte, KI-Setup, Glocke geprüft.`);
    await context.close();
  }
  await fs.writeFile(path.join(output,'browser-report.json'),JSON.stringify({scope:'Lokaler statischer Browserlauf; keine echten Cloudflare-/KI-Providerzugriffe',runs:report},null,2));
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
