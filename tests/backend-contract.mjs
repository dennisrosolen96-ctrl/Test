import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

// Contract tests use isolated in-memory D1/R2 doubles; no production requests.
const source = await fs.readFile(new URL('../functions/api/[[path]].js', import.meta.url), 'utf8');
const { onRequest } = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(source));
const password = 'qa-only-not-a-production-secret';
const articles = new Map();
let batches = null;
const photos = new Map();
const db = {
  prepare(sql) {
    return { params: [], bind(...params) { this.params = params; return this; },
      async all() { return { results: [...articles].filter(([,x]) => !x.deleted).sort(([a],[b]) => a.localeCompare(b)).map(([id,x]) => ({id, revision:x.revision})) }; },
      async first() { return sql.includes('app_meta') ? batches : articles.get(this.params[0]) || null; },
      async run() {
        let changes = 0;
        const p = this.params;
        if (sql.startsWith('INSERT') && sql.includes('articles')) {
          if (!articles.has(p[0])) { articles.set(p[0], {revision:1, deleted:0, body:p[1]}); changes = 1; }
        } else if (sql.startsWith('UPDATE articles')) {
          const deleting = sql.includes('deleted=1');
          const id = deleting ? p[0] : p[1];
          const expected = deleting ? p[1] : p[2];
          const row = articles.get(id);
          if (row && row.revision === expected) { row.revision++; row.deleted = deleting ? 1 : 0; if (!deleting) row.body = p[0]; changes = 1; }
        } else if (sql.startsWith('INSERT') && sql.includes('app_meta')) {
          if (!batches) { batches = {revision:1, body:p[1]}; changes = 1; }
        } else if (sql.startsWith('UPDATE app_meta')) {
          if (batches?.revision === p[2]) { batches.revision++; batches.body = p[0]; changes = 1; }
        }
        return {meta:{changes}};
      }
    };
  }
};
const bucket = {
  async put(key, bytes, options) { photos.set(key, {body:bytes, httpMetadata:options.httpMetadata}); },
  async get(key) { return photos.get(key) || null; }
};
const env = {RV_SYNC_PASSWORD:password, RV_DB:db, RV_PHOTOS:bucket};
const tests = [];
async function call(method, path, body, extra={}) {
  const headers = {'X-RV-Password':password, ...extra.headers};
  if (body !== undefined && !(body instanceof Uint8Array)) headers['Content-Type'] ||= 'application/json';
  const request = new Request('https://qa.invalid/api/' + path, {method, headers, ...(body !== undefined ? {body:body instanceof Uint8Array ? body : JSON.stringify(body)} : {})});
  return onRequest({request, env:extra.env || env});
}
async function test(name, fn) { await fn(); tests.push({name, result:'passed'}); }
async function expectStatus(response, code) { assert.equal(response.status, code); return response.headers.get('content-type')?.includes('application/json') ? response.json() : null; }
const article = {id:'qa_article', articleStatus:'Online', cost:'20', photos:[], prices:{ebay:'60'}, listings:{ebay:{title:'QA listing',description:'QA description'}}};

await test('Authentifizierung: fehlendes Serverkennwort (503), falsches Kennwort (401)', async () => {
  await expectStatus(await call('GET','ping',undefined,{env:{}}),503);
  await expectStatus(await call('GET','ping',undefined,{headers:{'X-RV-Password':'wrong'}}),401);
});
await test('Vertrag: X-RV-Sync-Password allein ist nicht das akzeptierte Auth-Headerfeld', async () => {
  await expectStatus(await call('GET','ping',undefined,{headers:{'X-RV-Password':'','X-RV-Sync-Password':password}}),401);
});
await test('Ping funktioniert ohne Speicherbindings; Artikeldaten benötigen D1/R2 (503)', async () => {
  assert.deepEqual(await expectStatus(await call('GET','ping',undefined,{env:{RV_SYNC_PASSWORD:password}}),200),{ok:true});
  await expectStatus(await call('GET','articles',undefined,{env:{RV_SYNC_PASSWORD:password}}),503);
});
await test('Artikel: Anlegen, Auflisten und Laden mit Revision 1', async () => {
  assert.deepEqual(await expectStatus(await call('PUT','articles/qa_article',{article,revision:0}),200),{revision:1});
  assert.deepEqual(await expectStatus(await call('GET','articles'),200),{items:[{id:'qa_article',revision:1}]});
  assert.deepEqual(await expectStatus(await call('GET','articles/qa_article'),200),{article,revision:1});
});
await test('Artikel: ID-/Foto-Validierung und Größenlimit', async () => {
  await expectStatus(await call('GET','articles/bad%2Fid'),400);
  await expectStatus(await call('PUT','articles/qa_article',{article:{id:'qa_article'},revision:1}),400);
  await expectStatus(await call('PUT','articles/qa_article',{article:{...article,notes:'x'.repeat(350001)},revision:1}),413);
});
await test('Artikel: Optimistische Revision verhindert Überschreiben, Update erhöht Revision', async () => {
  await expectStatus(await call('PUT','articles/qa_article',{article,revision:0}),409);
  assert.deepEqual(await expectStatus(await call('PUT','articles/qa_article',{article:{...article,cost:'25'},revision:1}),200),{revision:2});
});
await test('Artikel: Löschen mit Revision, Tombstone und explizite Wiederherstellung', async () => {
  await expectStatus(await call('DELETE','articles/qa_article',{revision:1}),409);
  assert.deepEqual(await expectStatus(await call('DELETE','articles/qa_article',{revision:2}),200),{revision:3});
  await expectStatus(await call('GET','articles/qa_article'),404);
  assert.deepEqual(await expectStatus(await call('GET','articles'),200),{items:[]});
  await expectStatus(await call('PUT','articles/qa_article',{article,revision:0}),409);
  assert.deepEqual(await expectStatus(await call('PUT','articles/qa_article',{article,revision:3}),200),{revision:4});
});
await test('Einkaufschargen: Meta lesen, schreiben, Versionskonflikt und Validierung', async () => {
  assert.deepEqual(await expectStatus(await call('GET','meta'),200),{revision:0,value:[]});
  assert.deepEqual(await expectStatus(await call('PUT','meta',{value:[{id:'batch',total:42}],revision:0}),200),{revision:1});
  await expectStatus(await call('PUT','meta',{value:[],revision:0}),409);
  await expectStatus(await call('PUT','meta',{value:{},revision:1}),400);
  assert.deepEqual(await expectStatus(await call('GET','meta'),200),{revision:1,value:[{id:'batch',total:42}]});
});
const hash = 'a'.repeat(64);
await test('Fotos: R2 Upload/Download mit geschütztem no-store-Vertrag', async () => {
  const bytes = new Uint8Array([255,216,255,217]);
  const {key} = await expectStatus(await call('PUT','photo/qa_article/'+hash,bytes,{headers:{'Content-Type':'image/jpeg'}}),200);
  assert.equal(key,'articles/qa_article/'+hash+'.jpg');
  const result = await call('GET','photo/'+encodeURIComponent(key));
  assert.equal(result.status,200); assert.equal(result.headers.get('Cache-Control'),'private, no-store');
  assert.deepEqual(new Uint8Array(await result.arrayBuffer()),bytes);
});
await test('Fotos: Ungültige ID, MIME, leere Datei und ungültiger Schlüssel', async () => {
  await expectStatus(await call('PUT','photo/bad%2Fid/'+hash,new Uint8Array([1]),{headers:{'Content-Type':'image/jpeg'}}),400);
  await expectStatus(await call('PUT','photo/qa_article/'+hash,new Uint8Array([1]),{headers:{'Content-Type':'text/plain'}}),415);
  await expectStatus(await call('PUT','photo/qa_article/'+hash,new Uint8Array(),{headers:{'Content-Type':'image/jpeg'}}),413);
  await expectStatus(await call('GET','photo/not-a-key'),400);
});
await test('KI: Fehlende Nachricht/Bilder und fehlende Provider-Secrets werden gemeldet', async () => {
  await expectStatus(await call('POST','ai-chat',{message:''}),400);
  await expectStatus(await call('POST','listing',{images:[]}),400);
  await expectStatus(await call('POST','listing',{images:['invalid']}),400);
  const error = await expectStatus(await call('POST','ai-chat',{message:'Bitte beraten'}),502);
  assert.match(error.detail,/OPENAI_API_KEY fehlt/);
  const claudeError = await expectStatus(await call('POST','ai-chat',{message:'Bitte beraten'},{headers:{'X-RV-Provider':'claude'}}),502);
  assert.match(claudeError.detail,/ANTHROPIC_API_KEY fehlt/);
});
const originalFetch = globalThis.fetch;
let upstream = [];
try {
  globalThis.fetch = async (url, options) => {
    const payload = JSON.parse(options.body); upstream.push({url:String(url),payload});
    const prompt = payload.input?.[0]?.content?.[0]?.text || payload.messages?.[0]?.content?.[0]?.text || '';
    const text = prompt.includes('JSON-Format:') ? JSON.stringify({detected:{brand:'QA Marke'},ebay:{title:'QA',description:'Nur geprüfte Daten'},vinted:{title:'QA',description:'Nur geprüfte Daten'},instagram:{title:'QA',description:'Nur geprüfte Daten'}}) : 'QA Providerantwort';
    return new Response(JSON.stringify(String(url).includes('anthropic')?{content:[{type:'text',text}]}:{output:[{content:[{type:'output_text',text}]}]}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const aiEnv={...env,OPENAI_API_KEY:'mock',ANTHROPIC_API_KEY:'mock'};
  await test('KI-Chat: OpenAI Responses und Claude Messages werden weiter angebunden', async () => {
    assert.deepEqual(await expectStatus(await call('POST','ai-chat',{message:'Bitte beraten',context:{articles:2,profit:25}},{env:aiEnv}),200),{reply:'QA Providerantwort'});
    assert.deepEqual(await expectStatus(await call('POST','ai-chat',{message:'Bitte beraten'},{env:aiEnv,headers:{'X-RV-Provider':'claude'}}),200),{reply:'QA Providerantwort'});
    assert.match(upstream[0].url,/openai/); assert.match(upstream[1].url,/anthropic/);
  });
  await test('Listing: Fotodaten, Nutzerfelder und JSON-Listings für alle drei Plattformen', async () => {
    const result=await expectStatus(await call('POST','listing',{images:['data:image/jpeg;base64,/9j/2Q=='],fields:{sku:'QA-1',condition:'8',measurements:'60 cm'},template:'QA Vorlage'},{env:aiEnv}),200);
    assert.equal(result.detected.brand,'QA Marke');
    for (const p of ['ebay','vinted','instagram']) assert.equal(result[p].title,'QA');
    assert.equal(upstream.at(-1).payload.input[0].content[1].type,'input_image');
    assert.match(upstream.at(-1).payload.input[0].content[0].text,/QA-1/);
  });
  await test('Listing: Claude erhält Fotos als Base64-Bildblöcke und Nutzerfelder', async () => {
    const result=await expectStatus(await call('POST','listing',{images:['data:image/jpeg;base64,/9j/2Q=='],fields:{sku:'QA-CLAUDE',notes:'Kleiner Fleck'},template:'Claude QA Vorlage'},{env:aiEnv,headers:{'X-RV-Provider':'claude'}}),200);
    assert.equal(result.detected.brand,'QA Marke');
    for (const p of ['ebay','vinted','instagram']) assert.equal(result[p].title,'QA');
    const request=upstream.at(-1);
    assert.match(request.url,/anthropic/);
    assert.deepEqual(request.payload.messages[0].content[1],{type:'image',source:{type:'base64',media_type:'image/jpeg',data:'/9j/2Q=='}});
    assert.match(request.payload.messages[0].content[0].text,/QA-CLAUDE/);
    assert.match(request.payload.messages[0].content[0].text,/Kleiner Fleck/);
  });
  await test('KI: Providerfehler bleiben bei Chat und Listing verständliche 502-Antworten', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({error:{message:'QA Provider nicht verfügbar'}}),{status:429,headers:{'Content-Type':'application/json'}});
    for (const provider of ['openai','claude']) {
      for (const [path,body] of [['ai-chat',{message:'Bitte beraten'}],['listing',{images:['data:image/jpeg;base64,/9j/2Q==']}]]) {
        const error=await expectStatus(await call('POST',path,body,{env:aiEnv,headers:{'X-RV-Provider':provider}}),502);
        assert.match(error.error,/KI-/);
        assert.equal(error.detail,'QA Provider nicht verfügbar');
      }
    }
  });
  await test('Bekannte Grenze: Ungültiges Listing-JSON liefert den bestehenden leeren 200-Fallback', async () => {
    globalThis.fetch = async (url) => {
      const text='{ "detected": invalid JSON }';
      return new Response(JSON.stringify(String(url).includes('anthropic')?{content:[{type:'text',text}]}:{output:[{content:[{type:'output_text',text}]}]}),{status:200,headers:{'Content-Type':'application/json'}});
    };
    for (const provider of ['openai','claude']) {
      const result=await expectStatus(await call('POST','listing',{images:['data:image/jpeg;base64,/9j/2Q==']},{env:aiEnv,headers:{'X-RV-Provider':provider}}),200);
      assert.deepEqual(result,{detected:{},ebay:{title:'',description:''},vinted:{title:'',description:''},instagram:{title:'',description:''}});
    }
  });
  await test('Freisteller: ohne Dienst 501, mit Photoroom/remove.bg PNG als Data-URL, Schlüssel nur serverseitig', async () => {
    const info=await expectStatus(await call('GET','cutout'),200);assert.deepEqual(info,{available:false,provider:''});
    await expectStatus(await call('POST','cutout',{image:'data:image/jpeg;base64,/9j/2Q=='}),501);
    const png=new Uint8Array([137,80,78,71,13,10,26,10]);
    for (const [key,host,header] of [['PHOTOROOM_API_KEY','sdk.photoroom.com','x-api-key'],['REMOVE_BG_API_KEY','api.remove.bg','X-Api-Key']]) {
      let seen=null;
      globalThis.fetch = async (url, options) => { seen={url:String(url),key:options.headers[header]}; return new Response(png,{status:200,headers:{'Content-Type':'image/png'}}); };
      const cutEnv={...env,[key]:'qa-cutout-key'};
      await expectStatus(await call('POST','cutout',{image:'data:image/png;base64,'},{env:cutEnv}),400);
      const r=await expectStatus(await call('POST','cutout',{image:'data:image/jpeg;base64,/9j/2Q=='},{env:cutEnv}),200);
      assert.ok(seen.url.includes(host));assert.equal(seen.key,'qa-cutout-key');
      assert.equal(r.image,'data:image/png;base64,iVBORw0KGgo=');assert.ok(!JSON.stringify(r).includes('qa-cutout-key'));
    }
    globalThis.fetch = async () => new Response('limit',{status:402});
    await expectStatus(await call('POST','cutout',{image:'data:image/jpeg;base64,/9j/2Q=='},{env:{...env,REMOVE_BG_API_KEY:'k'}}),502);
    await expectStatus(await call('POST','cutout',{image:'data:image/jpeg;base64,/9j/2Q=='},{headers:{'X-RV-Password':'wrong'}}),401);
  });
  await test('Poof.bg: geschützt, Typ/Größe geprüft, Schlüssel nur serverseitig, Fehler/Timeout/Limit sauber, kein Doppel-Credit', async () => {
    const jpeg='data:image/jpeg;base64,/9j/2Q==';
    // Ohne Secret
    assert.deepEqual(await expectStatus(await call('GET','poof'),200),{available:false});
    const nc=await expectStatus(await call('POST','poof',{image:jpeg}),501);assert.equal(nc.code,'not_configured');
    const penv={...env,POOF_BG_API_KEY:'qa-poof-key'};
    // Ohne/mit falschem Kennwort
    await expectStatus(await call('POST','poof',{image:jpeg},{env:penv,headers:{'X-RV-Password':'wrong'}}),401);
    // Typ- und Größenprüfung (vor jedem Poof-Aufruf)
    let calls=[];
    globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});throw new Error('darf nicht aufgerufen werden')};
    await expectStatus(await call('POST','poof',{image:'data:image/jpeg;base64,'+Buffer.from('GIF89a-kein-jpeg').toString('base64')},{env:penv}),415);
    await expectStatus(await call('POST','poof',{image:'data:image/gif;base64,R0lGODlh'},{env:penv}),415);
    await expectStatus(await call('POST','poof',{},{env:penv}),415);
    const big=Buffer.alloc(20_000_001);big[0]=0xff;big[1]=0xd8;big[2]=0xff;
    await expectStatus(await call('POST','poof',{image:'data:image/jpeg;base64,'+big.toString('base64')},{env:penv}),413);
    assert.equal(calls.length,0);
    // Erfolg: richtige Felder, Schlüssel nur im Header zu Poof
    const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13]);
    globalThis.fetch=async(url,options)=>{calls.push({url:String(url),key:options.headers['x-api-key'],form:options.body});
      return new Response(png,{status:200,headers:{'Content-Type':'image/png','X-Image-Width':'800','X-Image-Height':'1000','X-Matte-Confidence':'0.97','X-Request-ID':'req_qa'}})};
    const ok=await expectStatus(await call('POST','poof',{image:jpeg},{env:penv}),200);
    assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.poof.bg/v1/remove');assert.equal(calls[0].key,'qa-poof-key');
    assert.equal(calls[0].form.get('format'),'png');assert.equal(calls[0].form.get('size'),'full');assert.ok(calls[0].form.get('image_file') instanceof Blob);
    assert.equal(ok.image,'data:image/png;base64,'+Buffer.from(png).toString('base64'));assert.equal(ok.engine,'poof');assert.equal(ok.width,800);assert.equal(ok.confidence,0.97);
    assert.ok(!JSON.stringify(ok).includes('qa-poof-key'));
    // Fehler-Zuordnung, jeweils genau EIN Aufruf (keine Wiederholung)
    for(const [st,code,expect,re] of [[402,'payment_required',402,/aufgebraucht/],[429,'rate_limit_exceeded',429,/Minute/],[401,'authentication_error',502,/Schlüssel/],[500,'processing_failed',502,/nicht freistellen/],[503,'upstream_error',503,/nicht erreichbar/],[418,'',502,/Poof-Fehler/]]){
      calls=[];globalThis.fetch=async()=>{calls.push(1);return new Response(JSON.stringify({code,message:'x',request_id:'req_e'}),{status:st,headers:{'Content-Type':'application/json'}})};
      const e=await expectStatus(await call('POST','poof',{image:jpeg},{env:penv}),expect);
      assert.match(e.error,re);assert.equal(calls.length,1);assert.ok(!JSON.stringify(e).includes('qa-poof-key'));
    }
    // Zeitüberschreitung
    globalThis.fetch=async()=>{const e=new Error('timeout');e.name='TimeoutError';throw e};
    const to=await expectStatus(await call('POST','poof',{image:jpeg},{env:penv}),504);assert.equal(to.code,'timeout');
    // Kein PNG zurück
    globalThis.fetch=async()=>new Response('nope',{status:200,headers:{'Content-Type':'text/html'}});
    await expectStatus(await call('POST','poof',{image:jpeg},{env:penv}),502);
    // Doppelte Anfrage mit gleichem Bild: aus dem Cache, kein zweiter Poof-Aufruf
    const store=new Map();globalThis.caches={default:{async match(r){return store.has(r.url)?new Response(store.get(r.url)):undefined},async put(r,res){store.set(r.url,await res.text())}}};
    calls=[];globalThis.fetch=async()=>{calls.push(1);return new Response(png,{status:200,headers:{'Content-Type':'image/png'}})};
    const c1=await expectStatus(await call('POST','poof',{image:'data:image/jpeg;base64,/9j/4AAQ'},{env:penv}),200);
    const c2=await expectStatus(await call('POST','poof',{image:'data:image/jpeg;base64,/9j/4AAQ'},{env:penv}),200);
    assert.equal(calls.length,1);assert.equal(c2.cached,true);assert.equal(c1.image,c2.image);
    delete globalThis.caches;
    // Eigenes Rate-Limit (ohne D1: Speicher-Variante), 3. Anfrage in der Minute wird abgelehnt, ohne Poof-Aufruf
    const renv={...penv,RV_DB:undefined,POOF_MAX_PER_MINUTE:'2'};calls=[];
    await expectStatus(await call('POST','poof',{image:jpeg},{env:renv}),200);
    await expectStatus(await call('POST','poof',{image:jpeg},{env:renv}),200);
    const rl=await expectStatus(await call('POST','poof',{image:jpeg},{env:renv}),429);
    assert.equal(rl.code,'rate_limit_local');assert.equal(calls.length,2);
    // Credit-Stand (kostenlos über /v1/me)
    globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://api.poof.bg/v1/me');assert.equal(options.headers['x-api-key'],'qa-poof-key');return new Response(JSON.stringify({plan:'Free',maxCredits:50,usedCredits:7,organizationId:'org'}),{status:200,headers:{'Content-Type':'application/json'}})};
    const acc=await expectStatus(await call('GET','poof',undefined,{env:penv}),200);
    assert.deepEqual(acc,{available:true,account:{plan:'Free',maxCredits:50,usedCredits:7}});
  });
} finally { globalThis.fetch = originalFetch; }

const report={scope:'Isolierte API-Vertragstests mit in-memory D1/R2 und gemocktem KI-fetch. Keine echten Cloudflare- oder Provider-Zugriffe.',passed:tests.length,failed:0,knownLimits:['Ungültiges vom Provider erzeugtes Listing-JSON liefert aktuell HTTP 200 mit leeren Listings; der Test dokumentiert diesen bestehenden API-Vertrag.','D1/R2-Doubles prüfen den API-Vertrag, nicht echte Cloudflare-SQL-/Storage-Ausführung oder Parallelzugriffe.'],tests};
await fs.writeFile(new URL('./backend-contract-results.json', import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
