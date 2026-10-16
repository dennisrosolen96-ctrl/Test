
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});
function same(a,b){if(!a||!b)return false;const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);let diff=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)diff|=(x[i]||0)^(y[i]||0);return diff===0}
function cleanProvider(v){return String(v||'').toLowerCase()==='claude'?'claude':'openai'}
function extractJson(text){
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fence ? fence[1] : text).trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
}
function base64Parts(dataUrl){const m=String(dataUrl||'').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);return m?{mediaType:m[1],data:m[2]}:null}
async function callOpenAI(env, prompt, images = [], max_output_tokens = 1800){
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY fehlt auf dem Server.');
  const content = [{ type:'input_text', text: prompt }, ...images.map(image_url => ({ type:'input_image', image_url, detail:'low' }))];
  const result = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({ model: env.OPENAI_MODEL || 'gpt-4.1-mini', input:[{ role:'user', content }], max_output_tokens, temperature: 0.4 })
  });
  const data = await result.json().catch(()=>({}));
  if (!result.ok) throw new Error(data.error?.message || 'OpenAI-Fehler');
  return (data.output || []).flatMap(o => o.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('\n').trim();
}
async function callClaude(env, prompt, images = [], max_tokens = 1800){
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY fehlt auf dem Server.');
  const content = [{ type:'text', text: prompt }, ...images.map(url => {const p=base64Parts(url); if(!p) return null; return { type:'image', source:{ type:'base64', media_type:p.mediaType, data:p.data } };}).filter(Boolean)];
  const result = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json'},
    body:JSON.stringify({ model: env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest', max_tokens, temperature: 0.4, messages:[{ role:'user', content }] })
  });
  const data = await result.json().catch(()=>({}));
  if (!result.ok) throw new Error(data.error?.message || data.error?.type || 'Claude-Fehler');
  return Array.isArray(data.content) ? data.content.filter(x => x.type === 'text').map(x => x.text).join('\n').trim() : '';
}
async function callProvider(env, provider, prompt, images = [], maxTokens = 1800){
  if (provider === 'claude') return callClaude(env, prompt, images, maxTokens);
  return callOpenAI(env, prompt, images, maxTokens);
}
function sanitizeListingPayload(data){
  const fallback = { detected:{}, ebay:{title:'',description:''}, vinted:{title:'',description:''}, instagram:{title:'',description:''} };
  if (!data || typeof data !== 'object') return fallback;
  for (const key of ['ebay','vinted','instagram']) {
    data[key] = data[key] && typeof data[key] === 'object' ? data[key] : { title:'', description:'' };
    data[key].title = String(data[key].title || '').slice(0, 180);
    data[key].description = String(data[key].description || '').slice(0, 8000);
  }
  data.detected = data.detected && typeof data.detected === 'object' ? data.detected : {};
  for (const k of ['brand','size','category','material','color','country','model','sku']) data.detected[k] = String(data.detected[k] || '').slice(0, 180);
  return data;
}
async function handleAiChat(request, env){
  const data = await request.json().catch(()=>null);
  if (!data || typeof data.message !== 'string' || !data.message.trim()) return json({ error:'Nachricht fehlt.' }, 400);
  const provider = cleanProvider(request.headers.get('X-RV-Provider') || data.provider || env.AI_PROVIDER);
  const ctx = data.context && typeof data.context === 'object' ? data.context : {};
  const prompt = `Du bist RV AI, ein sehr hilfreicher deutschsprachiger Assistent für ein Reselling-Workspace namens RV Studio. Antworte locker, klar, hochwertig und konkret. Nutze nur den gegebenen Kontext. Wenn etwas unklar ist, sage es offen.

Kontext:
- Artikel gesamt: ${ctx.articles ?? 'unbekannt'}
- Verkauft: ${ctx.sold ?? 'unbekannt'}
- Entwürfe: ${ctx.drafts ?? 'unbekannt'}
- Bereit: ${ctx.ready ?? 'unbekannt'}
- Online: ${ctx.online ?? 'unbekannt'}
- Realisierter Gewinn: ${ctx.profit ?? 'unbekannt'}

Frage des Nutzers: ${data.message.trim()}

Antworte in 2 bis 8 Sätzen. Wenn sinnvoll, nenne konkrete nächste Schritte.`;
  try {
    const replyText = await callProvider(env, provider, prompt, [], 700);
    return json({ reply: replyText || 'Gerade konnte ich keine Antwort erzeugen.' });
  } catch (err) {
    return json({ error:'KI-Chat fehlgeschlagen.', detail:String(err.message || err) }, 502);
  }
}
async function handleListing(request, env){
  const data = await request.json().catch(()=>null);
  if (!data || !Array.isArray(data.images) || !data.images.length) return json({ error:'Bitte mindestens ein Bild senden.' }, 400);
  const images = data.images.slice(0, 8).filter(i => typeof i === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(i));
  if (!images.length) return json({ error:'Bilder ungültig.' }, 400);
  const provider = cleanProvider(request.headers.get('X-RV-Provider') || data.provider || env.AI_PROVIDER);
  const f = data.fields && typeof data.fields === 'object' ? data.fields : {};
  const template = String(data.template || '').slice(0, 4000);
  const defectsNotes = String(f.notes || '').trim();
  const prompt = `Du analysierst Produktfotos für RV Studio und erstellst deutsche Listings für Secondhand-Mode. Arbeite vorsichtig und erfinde nichts. Beschreibe nur, was auf den Fotos klar erkennbar ist oder in den Eingaben steht.

Eingaben:
- SKU: ${String(f.sku || '')}
- Zustandsskala 1-10: ${String(f.condition || '')}
- Maße: ${String(f.measurements || '')}
- Mängel/Hinweise: ${defectsNotes || 'keine Angaben'}

WICHTIG:
- Wenn das Feld Mängel leer ist, darf in der Beschreibung KEIN Mängel-Abschnitt mit 'keine Mängel' o.ä. stehen. Dann lasse den Abschnitt komplett weg.
- Keine erfundenen Maße, Materialien oder Länder.
- Erkenne nach Möglichkeit: Marke, Kategorie, Größe, Material, Farbe, Herkunft, Modell. Nur wenn plausibel erkennbar.
- Gib AUSSCHLIESSLICH gültiges JSON zurück, ohne Markdown.

Template-Stil des Nutzers:
${template || 'Hochwertiger deutscher Listing-Stil'}

JSON-Format:
{
  "detected": {"brand":"","size":"","category":"","material":"","color":"","country":"","model":"","sku":""},
  "ebay": {"title":"","description":""},
  "vinted": {"title":"","description":""},
  "instagram": {"title":"","description":""}
}

Die Beschreibung soll hochwertig und verkaufsstark sein. Plattformtexte dürfen leicht unterschiedlich formuliert sein, aber inhaltlich gleich bleiben.`;
  try {
    const raw = await callProvider(env, provider, prompt, images, 2200);
    const parsed = sanitizeListingPayload(extractJson(raw));
    return json(parsed);
  } catch (err) {
    return json({ error:'KI-Anfrage fehlgeschlagen.', detail:String(err.message || err) }, 502);
  }
}
// Freisteller über einen spezialisierten Dienst. Schlüssel bleiben auf dem Server.
function bytesToBase64(bytes){let out='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)out+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));return btoa(out)}
function cutoutProvider(env){if(env.PHOTOROOM_API_KEY)return 'photoroom';if(env.REMOVE_BG_API_KEY)return 'removebg';return ''}
async function handleCutout(request, env){
  const provider=cutoutProvider(env);
  if(request.method==='GET')return json({available:Boolean(provider),provider});
  if(!provider)return json({error:'Kein Freisteller-Dienst eingerichtet.',detail:'PHOTOROOM_API_KEY oder REMOVE_BG_API_KEY als Secret setzen.'},501);
  const data=await request.json().catch(()=>null);
  const part=base64Parts(data?.image);
  if(!part)return json({error:'Bild ungültig.'},400);
  const raw=Uint8Array.from(atob(part.data),c=>c.charCodeAt(0));
  if(raw.byteLength>10_000_000)return json({error:'Bild zu groß.'},413);
  const form=new FormData();
  form.append('image_file',new Blob([raw],{type:part.mediaType}),'foto.'+(part.mediaType==='image/png'?'png':part.mediaType==='image/webp'?'webp':'jpg'));
  let res;
  if(provider==='photoroom'){
    form.append('format','png');form.append('despill','true');
    res=await fetch('https://sdk.photoroom.com/v1/segment',{method:'POST',headers:{'x-api-key':env.PHOTOROOM_API_KEY},body:form});
  }else{
    form.append('size','auto');form.append('type','product');form.append('format','png');
    res=await fetch('https://api.remove.bg/v1.0/removebg',{method:'POST',headers:{'X-Api-Key':env.REMOVE_BG_API_KEY},body:form});
  }
  if(!res.ok){const t=await res.text().catch(()=>'');return json({error:'Freisteller fehlgeschlagen.',detail:t.slice(0,300)},502)}
  const out=new Uint8Array(await res.arrayBuffer());
  return json({image:'data:image/png;base64,'+bytesToBase64(out),provider});
}
// ---------- Poof.bg: Freisteller für das interne RVO-Titelbild ----------
// Der Schlüssel (POOF_BG_API_KEY) wird nur hier aus der Cloudflare-Umgebung gelesen, nie geloggt und nie zurückgegeben.
// Schutz: RV-Kennwort (wie alle Cloud-Routen), Typ-/Größenprüfung, Zeitlimit, Rate-Limit, keine Wiederholungen,
// identische Bilder werden aus dem Cloudflare-Cache beantwortet (kein zweiter Credit).
const POOF_URL='https://api.poof.bg/v1/remove', POOF_ME='https://api.poof.bg/v1/me';
const POOF_MAX_BYTES=20_000_000, POOF_TIMEOUT_MS=45_000;
const poofMemory={hits:[]};
function sniffImage(b){
  if(b.length>3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg';
  if(b.length>8&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return 'image/png';
  if(b.length>12&&b[0]===0x52&&b[1]===0x49&&b[2]===0x46&&b[3]===0x46&&b[8]===0x57&&b[9]===0x45&&b[10]===0x42&&b[11]===0x50)return 'image/webp';
  return '';
}
async function sha256Hex(buf){const h=new Uint8Array(await crypto.subtle.digest('SHA-256',buf));return [...h].map(x=>x.toString(16).padStart(2,'0')).join('')}
// Ratenbegrenzung: bevorzugt dauerhaft in D1, sonst pro Worker-Instanz im Speicher.
async function poofRateCheck(env){
  const perMin=Math.max(1,Number(env.POOF_MAX_PER_MINUTE)||4), perDay=Math.max(1,Number(env.POOF_MAX_PER_DAY)||50), now=Date.now();
  if(env.RV_DB){
    try{
      await env.RV_DB.prepare('CREATE TABLE IF NOT EXISTS poof_calls (ts INTEGER NOT NULL)').run();
      const row=await env.RV_DB.prepare('SELECT SUM(CASE WHEN ts>? THEN 1 ELSE 0 END) AS m, COUNT(*) AS d FROM poof_calls WHERE ts>?').bind(now-60_000,now-86_400_000).first();
      if((row?.m||0)>=perMin)return {ok:false,error:'Zu viele Freistellungen pro Minute. Bitte kurz warten.',code:'rate_limit_local'};
      if((row?.d||0)>=perDay)return {ok:false,error:'Tageslimit für Freistellungen erreicht ('+perDay+'). Morgen geht es weiter oder das Limit in POOF_MAX_PER_DAY anheben.',code:'daily_limit'};
      await env.RV_DB.prepare('INSERT INTO poof_calls (ts) VALUES (?)').bind(now).run();
      await env.RV_DB.prepare('DELETE FROM poof_calls WHERE ts<?').bind(now-2*86_400_000).run();
      return {ok:true};
    }catch(e){/* D1 nicht verfügbar: Speicher-Variante */}
  }
  poofMemory.hits=poofMemory.hits.filter(t=>t>now-86_400_000);
  if(poofMemory.hits.filter(t=>t>now-60_000).length>=perMin)return {ok:false,error:'Zu viele Freistellungen pro Minute. Bitte kurz warten.',code:'rate_limit_local'};
  if(poofMemory.hits.length>=perDay)return {ok:false,error:'Tageslimit für Freistellungen erreicht ('+perDay+').',code:'daily_limit'};
  poofMemory.hits.push(now);return {ok:true};
}
const POOF_ERRORS={
  payment_required:[402,'Deine Poof-Credits für diesen Monat sind aufgebraucht. Originalfotos und vorhandene Titelbilder bleiben erhalten.'],
  authentication_error:[502,'Poof-Schlüssel ungültig. Bitte POOF_BG_API_KEY in Cloudflare prüfen.'],
  permission_denied:[502,'Diese Poof-Funktion ist in deinem Tarif nicht enthalten.'],
  rate_limit_exceeded:[429,'Poof-Limit pro Minute erreicht. Bitte in einer Minute erneut versuchen.'],
  image_too_large:[413,'Das Foto ist zu groß (max. 20 MB).'],
  invalid_image:[422,'Poof konnte das Foto nicht lesen. Bitte JPEG, PNG oder WebP verwenden.'],
  validation_error:[400,'Poof hat die Anfrage abgelehnt (ungültige Parameter).'],
  missing_image:[400,'Kein Foto übertragen.'],
  processing_failed:[502,'Poof konnte dieses Foto nicht freistellen. Bitte ein anderes Foto versuchen.'],
  upstream_error:[503,'Poof ist gerade nicht erreichbar. Bitte später erneut versuchen.'],
  internal_server_error:[503,'Poof hatte einen Serverfehler. Bitte später erneut versuchen.']
};
async function handlePoof(request, env, ctx){
  const key=env.POOF_BG_API_KEY;
  if(request.method==='GET'){
    if(!key)return json({available:false});
    try{
      const r=await fetch(POOF_ME,{headers:{'x-api-key':key},signal:AbortSignal.timeout(10_000)});
      if(!r.ok)return json({available:true,account:null,status:r.status});
      const a=await r.json();
      return json({available:true,account:{plan:String(a.plan||''),maxCredits:Number(a.maxCredits)||0,usedCredits:Number(a.usedCredits)||0}});
    }catch(e){return json({available:true,account:null})}
  }
  if(!key)return json({error:'Poof ist noch nicht eingerichtet.',detail:'Secret POOF_BG_API_KEY in Cloudflare Pages setzen.',code:'not_configured'},501);
  const len=Number(request.headers.get('Content-Length')||0);
  if(len>POOF_MAX_BYTES*1.4+4096)return json({error:'Das Foto ist zu groß (max. 20 MB).',code:'image_too_large'},413);
  const data=await request.json().catch(()=>null);
  const part=base64Parts(data?.image);
  if(!part)return json({error:'Foto ungültig. Erlaubt sind JPEG, PNG und WebP.',code:'invalid_image'},415);
  let raw;try{raw=Uint8Array.from(atob(part.data),c=>c.charCodeAt(0))}catch{return json({error:'Foto ungültig.',code:'invalid_image'},415)}
  if(!raw.byteLength||raw.byteLength>POOF_MAX_BYTES)return json({error:'Das Foto ist zu groß (max. 20 MB).',code:'image_too_large'},413);
  const type=sniffImage(raw);
  if(!type)return json({error:'Foto ungültig. Erlaubt sind JPEG, PNG und WebP.',code:'invalid_image'},415);
  // Gleiches Bild schon freigestellt? Dann ohne neuen Credit aus dem Cache.
  const hash=await sha256Hex(raw), cacheKey=new Request('https://rv-cache.invalid/poof/'+hash);
  const cache=typeof caches!=='undefined'&&caches.default?caches.default:null;
  if(cache){const hit=await cache.match(cacheKey).catch(()=>null);if(hit){const j=await hit.json().catch(()=>null);if(j&&j.image)return json({...j,cached:true})}}
  const rate=await poofRateCheck(env);
  if(!rate.ok)return json({error:rate.error,code:rate.code},429);
  const form=new FormData();
  form.append('image_file',new Blob([raw],{type}),'foto.'+(type==='image/png'?'png':type==='image/webp'?'webp':'jpg'));
  form.append('format','png');form.append('size','full');
  let res;
  try{res=await fetch(POOF_URL,{method:'POST',headers:{'x-api-key':key},body:form,signal:AbortSignal.timeout(POOF_TIMEOUT_MS)})}
  catch(e){const to=e&&(e.name==='TimeoutError'||e.name==='AbortError');return json({error:to?'Poof hat nicht rechtzeitig geantwortet. Es wurde kein Credit berechnet.':'Poof ist nicht erreichbar.',code:to?'timeout':'network'},504)}
  if(!res.ok){
    let body=null;try{body=await res.json()}catch{}
    const code=String(body?.code||''), map=POOF_ERRORS[code];
    const status=map?map[0]:(res.status===402?402:res.status===429?429:res.status>=500?503:502);
    const msg=map?map[1]:(res.status===402?POOF_ERRORS.payment_required[1]:'Poof-Fehler ('+res.status+').');
    return json({error:msg,code:code||('http_'+res.status),requestId:String(body?.request_id||res.headers.get('X-Request-ID')||'')},status);
  }
  const ct=res.headers.get('Content-Type')||'';
  const out=new Uint8Array(await res.arrayBuffer());
  if(!ct.startsWith('image/png')||sniffImage(out)!=='image/png')return json({error:'Poof hat kein PNG geliefert.',code:'bad_output'},502);
  const result={image:'data:image/png;base64,'+bytesToBase64(out),engine:'poof',
    width:Number(res.headers.get('X-Image-Width'))||0,height:Number(res.headers.get('X-Image-Height'))||0,
    confidence:Number(res.headers.get('X-Matte-Confidence'))||null,ambiguous:Number(res.headers.get('X-Matte-Ambiguous-Ratio'))||null,
    requestId:String(res.headers.get('X-Request-ID')||'')};
  if(cache){const put=cache.put(cacheKey,new Response(JSON.stringify(result),{headers:{'Content-Type':'application/json','Cache-Control':'private, max-age=604800'}})).catch(()=>{});if(ctx&&ctx.waitUntil)ctx.waitUntil(put)}
  return json(result);
}
export async function onRequest(context){
  const { request, env } = context;
  const url = new URL(request.url);
  const sub = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const protectedRoutes = new Set(['ping','articles','photo','meta','ai-chat','listing','cutout','poof']);
  if (protectedRoutes.has(sub[0])) {
    if (!env.RV_SYNC_PASSWORD) return json({ error:'RV_SYNC_PASSWORD fehlt.' }, 503);
    if (!same(request.headers.get('X-RV-Password'), env.RV_SYNC_PASSWORD)) return json({ error:'Falsches Cloud-Kennwort.' }, 401);
  }
  try {
    if (sub[0] === 'ping' && request.method === 'GET') return json({ ok:true });
    if (sub[0] === 'ai-chat' && request.method === 'POST') return handleAiChat(request, env);
    if (sub[0] === 'listing' && request.method === 'POST') return handleListing(request, env);
    if (sub[0] === 'poof' && (request.method === 'POST' || request.method === 'GET')) return handlePoof(request, env, context);
    if (sub[0] === 'cutout' && (request.method === 'POST' || request.method === 'GET')) return handleCutout(request, env);
    if (!env.RV_DB || !env.RV_PHOTOS) return json({ error:'Cloudflare-Bindings fehlen.' }, 503);
    if (sub[0]==='articles'&&sub.length===1&&request.method==='GET') { const rows=await env.RV_DB.prepare('SELECT id,revision FROM articles WHERE deleted=0 ORDER BY id').all(); return json({items:rows.results||[]}); }
    if (sub[0]==='articles'&&sub.length===2) {
      const id=decodeURIComponent(sub[1]); if(!/^[A-Za-z0-9_-]{1,110}$/.test(id)) return json({error:'Ungültige ID.'},400);
      const current=await env.RV_DB.prepare('SELECT revision,deleted,body FROM articles WHERE id=?').bind(id).first();
      if(request.method==='GET'){if(!current||current.deleted)return json({error:'Nicht gefunden.'},404);return json({article:JSON.parse(current.body),revision:current.revision})}
      if(request.method==='PUT'){ const data=await request.json(); if(data?.article?.id!==id||!Array.isArray(data.article.photos))return json({error:'Ungültiger Artikel.'},400); if(JSON.stringify(data.article).length>350000)return json({error:'Artikel zu groß; Fotos müssen separat gespeichert werden.'},413); const expected=Number(data.revision)||0; const body=JSON.stringify(data.article); let result; if(!current&&expected===0){result=await env.RV_DB.prepare('INSERT OR IGNORE INTO articles(id,revision,deleted,body) VALUES(?,1,0,?)').bind(id,body).run()} else if(current&&expected===current.revision){result=await env.RV_DB.prepare('UPDATE articles SET revision=revision+1,deleted=0,body=? WHERE id=? AND revision=?').bind(body,id,expected).run()} else return json({error:'Versionskonflikt: Artikel wurde auf einem anderen Gerät geändert.'},409); if(!result.meta?.changes)return json({error:'Versionskonflikt. Bitte auf beiden Geräten prüfen.'},409); return json({revision:expected+1}); }
      if(request.method==='DELETE'){ const data=await request.json(); const expected=Number(data?.revision)||0; if(!current&&expected===0)return json({revision:0}); if(!current||current.revision!==expected)return json({error:'Versionskonflikt beim Löschen.'},409); const r=await env.RV_DB.prepare('UPDATE articles SET revision=revision+1,deleted=1 WHERE id=? AND revision=?').bind(id,expected).run(); if(!r.meta?.changes)return json({error:'Versionskonflikt.'},409); return json({revision:expected+1}); }
    }
    if(sub[0]==='photo'&&sub.length>=2){
      if(request.method==='PUT'&&sub.length===3){ const id=decodeURIComponent(sub[1]),hash=sub[2]; if(!/^[A-Za-z0-9_-]{1,110}$/.test(id)||!/^[a-f0-9]{64}$/.test(hash))return json({error:'Foto-ID ungültig.'},400); const ct=request.headers.get('Content-Type'); if(!['image/jpeg','image/png','image/webp'].includes(ct))return json({error:'Fotoformat ungültig.'},415); const bytes=await request.arrayBuffer(); if(!bytes.byteLength||bytes.byteLength>8_000_000)return json({error:'Fotodatei muss zwischen 1 Byte und 8 MB liegen.'},413); const ext=ct==='image/png'?'png':ct==='image/webp'?'webp':'jpg'; const key='articles/'+id+'/'+hash+'.'+ext; await env.RV_PHOTOS.put(key,bytes,{httpMetadata:{contentType:ct}}); return json({key}); }
      if(request.method==='GET'){ const key=decodeURIComponent(sub.slice(1).join('/')); if(!/^articles\/[A-Za-z0-9_-]{1,110}\/[a-f0-9]{64}\.(jpg|png|webp)$/.test(key))return json({error:'Ungültiger Fotoschlüssel.'},400); const obj=await env.RV_PHOTOS.get(key); if(!obj)return json({error:'Foto nicht gefunden.'},404); return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}}) }
    }
    if(sub[0]==='meta'&&sub.length===1){ const row=await env.RV_DB.prepare('SELECT revision,body FROM app_meta WHERE id=?').bind('batches').first(); if(request.method==='GET')return json({revision:row?.revision||0,value:row?JSON.parse(row.body):[]}); if(request.method==='PUT'){ const data=await request.json(); if(!Array.isArray(data.value))return json({error:'Ungültige Einkaufschargen.'},400); const expected=Number(data.revision)||0,body=JSON.stringify(data.value); if(body.length>200000)return json({error:'Chargen zu groß.'},413); let result; if(!row&&expected===0)result=await env.RV_DB.prepare('INSERT OR IGNORE INTO app_meta(id,revision,body) VALUES(?,1,?)').bind('batches',body).run(); else if(row&&expected===row.revision)result=await env.RV_DB.prepare('UPDATE app_meta SET revision=revision+1,body=? WHERE id=? AND revision=?').bind(body,'batches',expected).run(); else return json({error:'Einkaufschargen-Konflikt. Bitte Daten prüfen.'},409); if(!result.meta?.changes)return json({error:'Versionskonflikt.'},409); return json({revision:expected+1}); } }
    return json({error:'Nicht gefunden.'},404);
  } catch(err) {
    console.error('rv api error', err);
    return json({error:'Serverfehler.', detail:String(err.message || err)},500);
  }
}
