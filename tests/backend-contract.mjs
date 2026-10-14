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
} finally { globalThis.fetch = originalFetch; }

const report={scope:'Isolierte API-Vertragstests mit in-memory D1/R2 und gemocktem KI-fetch. Keine echten Cloudflare- oder Provider-Zugriffe.',passed:tests.length,failed:0,knownLimits:['Ungültiges vom Provider erzeugtes Listing-JSON liefert aktuell HTTP 200 mit leeren Listings; der Test dokumentiert diesen bestehenden API-Vertrag.','D1/R2-Doubles prüfen den API-Vertrag, nicht echte Cloudflare-SQL-/Storage-Ausführung oder Parallelzugriffe.'],tests};
await fs.writeFile(new URL('./backend-contract-results.json', import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
