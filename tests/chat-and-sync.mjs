import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// Exercise the actual app functions with isolated browser/API doubles.
// Browser QA requires separate Playwright execution; it was blocked in this environment.
const source=await fs.readFile(new URL('../app.js',import.meta.url),'utf8');
const chatSource=source.slice(source.indexOf('let homeAiBooted='),source.indexOf('async function renderHome()'));
const apiSource=source.slice(source.indexOf('async function rvAPI('),source.indexOf('async function rvDigest('));
const syncSource=source.slice(source.indexOf('async function rvSync(){'),source.indexOf("$('rvCloudConnect').onclick="));
assert.ok(chatSource&&apiSource&&syncSource,'Core functions must be present');
const results=[];
async function test(name,fn){await fn();results.push({name,result:'passed'})}
class Element {
  constructor(){this.children=[];this.style={};this.value='';this.innerHTML='';this.ownText='';this.parentNode=null;this.className='';}
  get textContent(){return this.ownText+this.children.map(x=>x.textContent).join('')}
  set textContent(value){this.ownText=String(value);this.children=[];this.innerHTML='';}
  append(...children){for(const c of children){c.parentNode=this;this.children.push(c)}}
  removeChild(child){this.children.splice(this.children.indexOf(child),1);child.parentNode=null;return child}
  remove(){this.parentNode?.removeChild(this)}
  get firstChild(){return this.children[0]}
}
const fixture=[
  {id:'online',articleStatus:'Online',cost:'20'},
  {id:'draft',articleStatus:'Entwurf',cost:'10'},
  {id:'archived',articleStatus:'Bereit',cost:'500',archivedAt:'2026-10-01'},
  {id:'sold',articleStatus:'Verkauft',cost:'20',sale:{price:100,fees:5,shipping:7,date:'2026-10-14T10:00:00Z'}}
];
function chatHarness(options={}){
  const ids=new Map(['homeAiFeed','chatFeed','homeAiInput','chatInput','token','rvCloudPassword','searchArticles','rvCloudSync','backup'].map(id=>[id,new Element()]));
  ids.get('token').value=options.token??'test-rv-password';
  const listeners=new Map(),states=[],requests=[],navigation=[],timers=[];
  const context={
    $:id=>ids.get(id),document:{activeElement:null,createElement:()=>new Element(),addEventListener:(type,fn)=>listeners.set(type,fn),dispatchEvent:event=>states.push(event.detail)},
    CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},
    sessionStorage:{getItem:()=>null},rvCloudPassword:options.cloudPassword||'',
    getAiEndpoint:()=>options.endpoint||'https://qa.invalid',getAiProvider:()=>options.provider||'openai',rvProviderNames:{openai:'OpenAI',claude:'Claude'},
    location:{href:'https://qa.invalid/'},URL,AbortController,
    allArticles:async()=>structuredClone(fixture),stockRemoveNeeded:()=>false,
    euro:value=>value+' €',syncFeeds:()=>{},setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length},clearTimeout:()=>{},
    showStep:step=>navigation.push(step),showFinance:()=>navigation.push('finance'),renderLibrary:()=>{},blank:()=>({}),push:()=>{},
    fetch:async(url,options)=>{requests.push({url,options});return options.signal?.aborted?Promise.reject(Object.assign(new Error('Aborted'),{name:'AbortError'})):new Response(JSON.stringify({reply:'Echte Testantwort'}),{headers:{'Content-Type':'application/json'}})}
  };
  if(options.fetch)context.fetch=async(url,init)=>{requests.push({url,options:init});return options.fetch(url,init)};
  vm.createContext(context);vm.runInContext(chatSource,context);
  return {context,ids,states,requests,navigation,timers,listeners};
}
const feedText=h=>h.ids.get('homeAiFeed').textContent;
const jsonResponse=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});

await test('Remote-Aktion ohne Kennwort zeigt Setup und keinen stillen lokalen Ersatz',async()=>{
  const h=chatHarness({token:''});await h.context.runHomeAi('Lager optimieren',{remote:true});
  assert.equal(h.requests.length,0);assert.equal(h.navigation.length,0);assert.match(feedText(h),/RV-Passwort fehlt/);assert.equal(h.states.at(-1).state,'setup');
});
await test('Alle sechs KI-Aktionen umgehen lokale Regex-Navigation und verwenden den API-Vertrag',async()=>{
  for(const action of ['Artikel bewerten','Verkaufstext erstellen','Marktanalyse','Preisempfehlung','Lager optimieren','Ideen & Strategien']){
    const h=chatHarness();await h.context.runHomeAi(action,{remote:true});
    assert.equal(h.requests.length,1);assert.equal(h.navigation.length,0);
    assert.equal(h.requests[0].url,'https://qa.invalid/api/ai-chat');
    assert.equal(h.requests[0].options.headers['X-RV-Password'],'test-rv-password');
    const body=JSON.parse(h.requests[0].options.body);assert.ok(body.message.startsWith(action));assert.match(body.message,/Erfasste eigene App-Daten/);assert.doesNotMatch(body.message,/"sku":"archived"/);assert.equal(body.context.profit,68);assert.equal(body.context.ready,0);
    assert.equal(h.states.at(-1).state,'ready');assert.doesNotMatch(feedText(h),/Ich frage/);
  }
});
await test('Providerantworten bleiben reiner Text statt ausführbarem HTML',async()=>{
  const reply='<img src=x onerror="alert(1)">\nZeile 2';
  const h=chatHarness({fetch:async()=>jsonResponse({reply})});await h.context.runHomeAi('Berate mich',{remote:true});
  const message=h.ids.get('homeAiFeed').children.at(-1),body=message.children[1];
  assert.equal(body.textContent,reply);assert.equal(body.innerHTML,'');assert.equal(body.children.length,0);assert.equal(body.style.whiteSpace,'pre-wrap');
});
await test('Fehlender API-Key wird mit Serverdetail und ohne erfundene Antwort angezeigt',async()=>{
  const h=chatHarness({fetch:async()=>jsonResponse({error:'KI-Chat fehlgeschlagen.',detail:'OPENAI_API_KEY fehlt auf dem Server.'},502)});
  await h.context.runHomeAi('Berate mich',{remote:true});assert.match(feedText(h),/OPENAI_API_KEY fehlt/);assert.equal(h.states.at(-1).state,'setup');assert.doesNotMatch(feedText(h),/Ich frage|Ich sehe aktuell/);
});
await test('HTTP-, Netzwerk- und leere Providerantwortfehler entfernen die Wartemeldung',async()=>{
  for(const fetch of [async()=>jsonResponse({error:'Service nicht erreichbar'},502),async()=>{throw Error('Netzwerk unterbrochen')},async()=>jsonResponse({reply:''})]){
    const h=chatHarness({fetch});await h.context.runHomeAi('Berate mich',{remote:true});assert.equal(h.states.at(-1).state,'error');assert.match(feedText(h),/KI-Anfrage fehlgeschlagen/);assert.doesNotMatch(feedText(h),/Ich frage/);
  }
});
await test('Chat-Timeout bricht den Request ab und bereinigt die Wartemeldung',async()=>{
  const h=chatHarness({fetch:async(_url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(Error('Aborted'),{name:'AbortError'}))))});
  const promise=h.context.runHomeAi('Berate mich',{remote:true});await new Promise(resolve=>setImmediate(resolve));
  const timeout=h.timers.find(t=>t.delay===60000);assert.ok(timeout);timeout.fn();await promise;
  assert.match(feedText(h),/zu lange gedauert/);assert.equal(h.states.at(-1).state,'error');assert.doesNotMatch(feedText(h),/Ich frage/);
});
await test('Normaler lokaler Navigationsbefehl bleibt erhalten und ist als lokal markiert',async()=>{
  const h=chatHarness({token:''});await h.context.runHomeAi('Öffne den Bestand');assert.equal(h.requests.length,0);h.timers.find(t=>t.delay===120).fn();assert.equal(h.navigation[0],4);assert.match(feedText(h),/RV lokal/);
});
await test('Dokumentevent rv:ai-request startet erzwungene Remote-Anfrage',async()=>{
  const h=chatHarness();h.listeners.get('rv:ai-request')({detail:{message:'Lager optimieren'}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.requests.length,1);assert.equal(h.navigation.length,0);assert.ok(JSON.parse(h.requests[0].options.body).message.startsWith('Lager optimieren')); 
});
await test('Aktives Cloudkennwort wird für KI genutzt, auch wenn das Kennwortfeld geleert wurde',async()=>{
  const h=chatHarness({token:'',cloudPassword:'connected-cloud-password'});await h.context.runHomeAi('Berate mich',{remote:true});assert.equal(h.requests[0].options.headers['X-RV-Password'],'connected-cloud-password');
});
await test('Parallele Remote-Klicks starten nur einen laufenden Request',async()=>{
  let answer;const h=chatHarness({fetch:async()=>new Promise(resolve=>answer=resolve)});
  const first=h.context.runHomeAi('Berate mich',{remote:true}),second=h.context.runHomeAi('Lager optimieren',{remote:true});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(h.requests.length,1);answer(jsonResponse({reply:'Antwort'}));await Promise.all([first,second]);
});
await test('Cloud-Sync verwendet den bestehenden X-RV-Password-Vertrag',async()=>{
  let headers;const context={rvCloudPassword:'test-cloud-password',Headers,fetch:async(_url,init)=>{headers=init.headers;return jsonResponse({ok:true})}};
  vm.createContext(context);vm.runInContext(apiSource,context);await context.rvAPI('ping');assert.equal(headers.get('X-RV-Password'),'test-cloud-password');assert.equal(headers.get('X-RV-Sync-Password'),null);
});
function syncHarness(changeDuringUpload=false){
  const keys={queue:'queue',revs:'revs',conflicts:'conflicts'},data={queue:{item:'put'},revs:{},conflicts:{}};
  const local=[{id:'item',sku:'QA',photos:[],rvSyncModifiedAt:'2026-10-14T10:00:00Z'}],remote=new Map(),statuses=[];
  const context={
    rvSyncBusy:false,rvCloudPassword:'password',navigator:{onLine:true},
    rvSyncQueueKey:keys.queue,rvSyncRevsKey:keys.revs,rvConflictKey:keys.conflicts,
    rvReadJSON:key=>structuredClone(data[key]||{}),rvPersist:(key,value)=>data[key]=structuredClone(value),
    allArticles:async()=>structuredClone(local),rvUploadRecord:async a=>structuredClone(a),rvCaptureConflict:()=>{},
    rvAPI:async(path,options={})=>{
      if(path==='ping')return {ok:true};
      if(path==='articles')return {items:[...remote].map(([id,x])=>({id,revision:x.revision}))};
      if(path==='articles/item'&&options.method==='PUT'){
        const sent=JSON.parse(options.body),revision=sent.revision+1;remote.set('item',{article:sent.article,revision});
        if(changeDuringUpload)local[0].rvSyncModifiedAt='2026-10-14T10:01:00Z';return {revision};
      }
      if(path==='meta')return {revision:0,value:[]};
      throw Error('Unexpected API path '+path);
    },
    localStorage:{getItem:()=>null},v7Batches:()=>[],v7SetBatches:()=>{},renderHome:async()=>{},renderLibrary:async()=>{},rvRenderConflicts:()=>{},
    $:()=>({classList:{contains:()=>true}}),rvStatus:(message,bad)=>statuses.push({message,bad}),Date
  };
  vm.createContext(context);vm.runInContext(syncSource,context);return {context,data,local,remote,statuses};
}
await test('Erfolgreicher Artikel-Sync leert die Queue ohne uploadModified-Scopefehler',async()=>{
  const h=syncHarness();await h.context.rvSync();assert.deepEqual(h.data.queue,{});assert.equal(h.data.revs.item,1);assert.equal(h.statuses.at(-1).bad,false);assert.match(h.statuses.at(-1).message,/Synchronisiert/);
});
await test('Während eines Uploads geänderter Artikel bleibt für nächsten Sync in der Queue',async()=>{
  const h=syncHarness(true);await h.context.rvSync();assert.equal(h.data.queue.item,'put');assert.equal(h.data.revs.item,1);assert.equal(h.statuses.at(-1).bad,false);
});

const report={scope:'Tatsächliche Chat-/Sync-Funktionen aus app.js, ausgeführt mit isolierten DOM/IndexedDB/API-Doubles. Kein Browser- oder Live-Cloudnachweis.',passed:results.length,failed:0,tests:results};
await fs.writeFile(new URL('./chat-and-sync-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
