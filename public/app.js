
(()=>{'use strict';const $=id=>document.getElementById(id);const platforms=['ebay','vinted','instagram'];let step=0,activePlatform='ebay',article=null,editorIndex=-1,editorRatio='1',db;
const defaults=()=>({brightness:100,contrast:100,saturation:100,blur:0,sepia:0,grayscale:0,hue:0,warmth:0,sharpness:0,zoom:1,ox:.5,oy:.5});
const presets={Original:{},'Vintage Clean':{contrast:106,saturation:90,warmth:8},Studio:{brightness:108,contrast:108,saturation:102},Warm:{warmth:30,saturation:106},Cool:{warmth:-25,saturation:95},Retro:{sepia:35,contrast:92,saturation:80},'Film 90s':{contrast:115,saturation:75,sepia:18},'Soft Portrait':{brightness:105,contrast:92,blur:.5},'Schwarzweiß':{grayscale:100,contrast:115},'High Contrast':{contrast:145,saturation:108},'Pastell':{brightness:110,contrast:85,saturation:78},'Muted':{saturation:55,contrast:105},'Golden Hour':{warmth:40,brightness:107},'Kalt & Klar':{warmth:-20,contrast:120},'Faded':{contrast:78,brightness:108},'Dramatic':{contrast:140,brightness:92}};
const controls=[['brightness','Helligkeit',50,150,1],['contrast','Kontrast',50,160,1],['saturation','Sättigung',0,180,1],['warmth','Wärme',-60,60,1],['sharpness','Schärfe',0,100,1],['blur','Weichzeichnen',0,5,.1],['sepia','Sepia',0,100,1],['grayscale','Schwarzweiß',0,100,1],['hue','Farbton',-180,180,1],['zoom','Zoom',1,3,.05]];
function blank(){return {id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),sku:'',brand:'',size:'',condition:'',category:'',notes:'',cost:'',measurements:'',material:'',color:'',country:'',model:'',location:'',chest:'',length:'',purchaseDate:'',source:'',sale:null,articleStatus:'Entwurf',prices:{ebay:'',vinted:'',instagram:''},listings:{ebay:{title:'',description:''},vinted:{title:'',description:''},instagram:{title:'',description:''}},photos:[]}}
function dbOpen(){return new Promise((ok,no)=>{let q=indexedDB.open('RVStudioDB',1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('articles'))q.result.createObjectStore('articles',{keyPath:'id'})};q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})}
function store(mode,fn){return new Promise((ok,no)=>{const t=db.transaction('articles',mode),s=t.objectStore('articles');let touched=null;
 const wrapped=mode==='readwrite'?new Proxy(s,{get(target,key){
   if(key==='put')return function(a){if(!rvApplyingRemote){a.rvSyncModifiedAt=new Date().toISOString();touched={id:a.id,type:'put'}}return target.put(a)};
   if(key==='delete')return function(id){if(!rvApplyingRemote)touched={id,type:'delete'};return target.delete(id)};
   const value=target[key];return typeof value==='function'?value.bind(target):value;
 }}):s;
 let r;try{r=fn(wrapped)}catch(e){no(e);return}
 r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);
 t.oncomplete=()=>{if(touched){rvQueue(touched.id,touched.type);rvScheduleSync()}};
 })}
const fields=['sku','brand','size','condition','category','notes','cost','measurements','material','color','country','model','location','articleStatus','chest','length','purchaseDate','source'];function pull(){fields.forEach(k=>article[k]=$(k).value);platforms.forEach(k=>article.prices[k]=$('price'+k[0].toUpperCase()+k.slice(1)).value);article.listings[activePlatform]={title:$('listingTitle').value,description:$('listingDescription').value}}
function push(){fields.forEach(k=>$(k).value=article[k]||'');platforms.forEach(k=>$('price'+k[0].toUpperCase()+k.slice(1)).value=article.prices[k]||'');showListing();renderPhotos();paintCondition()}
function conditionText(v){v=Number(v);if(!v)return 'noch nicht gewählt';if(v>=10)return '10/10 · hervorragend';if(v>=8)return v+'/10 · sehr gut';if(v>=6)return v+'/10 · gut gebraucht';if(v>=4)return v+'/10 · deutlich gebraucht';return v+'/10 · stark gebraucht'}
function paintCondition(){document.querySelectorAll('#conditionScale button').forEach(b=>b.classList.toggle('on',b.dataset.v===$('condition').value));$('conditionLabel').textContent=conditionText($('condition').value)}
document.querySelectorAll('#conditionScale button').forEach(b=>b.onclick=()=>{$('condition').value=b.dataset.v;article.condition=b.dataset.v;paintCondition()});
function renderDetected(){
 const vals=[['Marke',article.brand],['Artikelart',article.category],['Farbe / Muster',article.color],['Größe',article.size],['Material',article.material],['Modell / Linie',article.model],['Made in',article.country],['Artikelnummer',article.sku]];
 $('detectedGrid').innerHTML='';
 vals.forEach(([k,v])=>{let d=document.createElement('div');d.className='detected-card';let s=document.createElement('small');s.textContent=k;let b=document.createElement('b');b.textContent=v||'Nicht erkannt';d.append(s,b);$('detectedGrid').append(d)});
}

function showListing(){let l=article.listings[activePlatform];$('listingTitle').value=l.title;$('listingDescription').value=l.description;document.querySelectorAll('#listingTabs .tab').forEach(b=>b.classList.toggle('on',b.dataset.platform===activePlatform))}
function selectBottomNav(id){document.querySelectorAll('#bottomnav button').forEach(b=>{const active=b.id===id;b.classList.toggle('selected',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function showStep(n){$('aiChat')&&$('aiChat').classList.add('hidden');$('settingsPage')&&$('settingsPage').classList.add('hidden');$('home').classList.add('hidden');$('finance').classList.add('hidden');document.querySelector('main.wrap').classList.remove('hidden');if(n!==4&&step===1)pull();step=n;for(let i=0;i<5;i++)$('s'+i).classList.toggle('hidden',i!==n);$('steps').classList.toggle('hidden',n===4);$('nav').classList.toggle('hidden',n===4);document.querySelectorAll('.step').forEach((x,i)=>{x.classList.toggle('active',i===n);x.classList.toggle('done',i<n)});$('back').disabled=n===0;$('next').textContent=n===3?'✓ Fertig': 'Weiter →';selectBottomNav(n===4?'navStock':'navStudio');if(n===4)renderLibrary();if(n===2)renderPhotos();if(n===1)renderDetected();paintCondition();window.scrollTo(0,0)}
$('next').onclick=()=>{pull();if(step===3){saveArticle();return}showStep(Math.min(3,step+1))};$('back').onclick=()=>showStep(Math.max(0,step-1));$('libraryBtn').onclick=()=>{pull();showStep(4)};$('newArticle').onclick=()=>{article=blank();push();showStep(0)};
$('listingTabs').onclick=e=>{const b=e.target.closest('[data-platform]');if(!b)return;pull();activePlatform=b.dataset.platform;showListing()};$('copyTitle').onclick=()=>copy($('listingTitle').value);$('copyDescription').onclick=()=>copy($('listingDescription').value);async function copy(v){try{await navigator.clipboard.writeText(v);alert('Kopiert')}catch{prompt('Zum Kopieren markieren:',v)}}
function fileToData(f){return new Promise((ok,no)=>{let r=new FileReader;r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)})}
async function shrink(data){let img=await imageFrom(data),scale=Math.min(1,1800/Math.max(img.width,img.height));let c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.88)}
function imageFrom(src){return new Promise((ok,no)=>{let im=new Image;im.onload=()=>ok(im);im.onerror=no;im.src=src})}
$('upload').onchange=async e=>{const files=[...e.target.files];for(const f of files){if(!f.type.startsWith('image/'))continue;try{const src=await shrink(await fileToData(f));article.photos.push({src,edit:defaults(),ratio:'1'})}catch{alert('Foto konnte nicht geladen werden: '+f.name)}}e.target.value='';renderPhotos()};$('addMore').onclick=()=>$('upload').click();
function renderPhotos(){$('photoCount').textContent=article.photos.length?article.photos.length+' Fotos ausgewählt – tippe auf ein Foto zum Bearbeiten.':'Noch keine Fotos ausgewählt.';for(const id of ['photos','editPhotos']){const el=$(id);el.innerHTML='';article.photos.forEach((p,i)=>{let div=document.createElement('div');div.className='thumb';let img=document.createElement('img');img.src=p.src;let btn=document.createElement('button');btn.textContent='✎ Bearbeiten';btn.onclick=()=>openEditor(i);div.append(img,btn);if(id==='editPhotos'){let bar=document.createElement('div');bar.className='photobar';for(const [t,fn] of [['←',()=>movePhoto(i,-1)],['→',()=>movePhoto(i,1)],['×',()=>removePhoto(i)]]){let x=document.createElement('button');x.textContent=t;x.onclick=fn;bar.append(x)}div.append(bar)}el.append(div)})}}
function movePhoto(i,d){let j=i+d;if(j<0||j>=article.photos.length)return;[article.photos[i],article.photos[j]]=[article.photos[j],article.photos[i]];renderPhotos()}function removePhoto(i){if(!confirm('Foto entfernen?'))return;article.photos.splice(i,1);renderPhotos()}function filter(e){return `brightness(${e.brightness}%) contrast(${e.contrast}%) saturate(${e.saturation}%) blur(${e.blur}px) sepia(${e.sepia}%) grayscale(${e.grayscale}%) hue-rotate(${e.hue}deg)`}
function crop(p,img,ratio){const a=+ratio,e=p.edit;let w=img.width,h=img.height,cw,ch;if(w/h>a){ch=h;cw=h*a}else{cw=w;ch=w/a}cw/=e.zoom;ch/=e.zoom;return {x:(w-cw)*e.ox,y:(h-ch)*e.oy,cw,ch}}
function drawOn(canvas,p,img,ratio){let a=+ratio;canvas.width=Math.round(a*900);canvas.height=900;let ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.filter=filter(p.edit);let r=crop(p,img,ratio);ctx.drawImage(img,r.x,r.y,r.cw,r.ch,0,0,canvas.width,canvas.height);if(p.edit.warmth){ctx.globalCompositeOperation='soft-light';ctx.fillStyle=p.edit.warmth>0?`rgba(255,120,25,${Math.abs(p.edit.warmth)/180})`:`rgba(30,120,255,${Math.abs(p.edit.warmth)/180})`;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over'}if(p.edit.sharpness){ctx.filter='none';ctx.globalAlpha=Math.min(.2,p.edit.sharpness/500);ctx.globalCompositeOperation='overlay';ctx.drawImage(canvas,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}}
let editorImg,editorBefore;async function openEditor(i){editorIndex=i;editorBefore=JSON.parse(JSON.stringify(article.photos[i]));const p=article.photos[i];editorRatio=p.ratio||'1';editorImg=await imageFrom(p.src);$('editor').classList.remove('hidden');$('editorLabel').textContent='Foto '+(i+1)+' / '+article.photos.length;document.querySelectorAll('#editor [data-ratio]').forEach(b=>b.classList.toggle('on',b.dataset.ratio===editorRatio));buildSliders();paint()}
function paint(){if(editorIndex<0)return;drawOn($('editCanvas'),article.photos[editorIndex],editorImg,editorRatio)}
function buildSliders(){const el=$('sliders');el.innerHTML='';let e=article.photos[editorIndex].edit;for(const [k,name,min,max,step] of controls){const r=document.createElement('div');r.className='sliderrow';const l=document.createElement('span');l.textContent=name;const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=e[k];const v=document.createElement('span');v.textContent=e[k];input.oninput=()=>{e[k]=+input.value;v.textContent=input.value;paint()};r.append(l,input,v);el.append(r)}}
$('presets').innerHTML='';Object.entries(presets).forEach(([name,vals])=>{let b=document.createElement('button');b.className='preset';b.textContent=name;b.onclick=()=>{let p=article.photos[editorIndex];p.edit={...defaults(),zoom:p.edit.zoom,ox:p.edit.ox,oy:p.edit.oy,...vals};buildSliders();paint()};$('presets').append(b)});
document.querySelectorAll('#editor [data-ratio]').forEach(b=>b.onclick=()=>{editorRatio=b.dataset.ratio;document.querySelectorAll('#editor [data-ratio]').forEach(x=>x.classList.toggle('on',x===b));paint()});
let drag=null;$('editCanvas').onpointerdown=e=>{const p=article.photos[editorIndex],r=crop(p,editorImg,editorRatio);drag={id:e.pointerId,x:e.clientX,y:e.clientY,ox:p.edit.ox,oy:p.edit.oy,r};e.target.setPointerCapture(e.pointerId)};$('editCanvas').onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;let p=article.photos[editorIndex],rect=e.target.getBoundingClientRect(),dx=(e.clientX-drag.x)/rect.width*drag.r.cw,dy=(e.clientY-drag.y)/rect.height*drag.r.ch;p.edit.ox=Math.max(0,Math.min(1,drag.ox-dx/Math.max(.001,editorImg.width-drag.r.cw)));p.edit.oy=Math.max(0,Math.min(1,drag.oy-dy/Math.max(.001,editorImg.height-drag.r.ch)));paint()};$('editCanvas').onpointerup=$('editCanvas').onpointercancel=()=>drag=null;
function closeEditor(){if(editorIndex>=0)article.photos[editorIndex].ratio=editorRatio;editorIndex=-1;$('editor').classList.add('hidden');renderPhotos()}$('closeEditor').onclick=()=>{if(editorIndex>=0&&editorBefore)article.photos[editorIndex]=editorBefore;closeEditor()};$('applyEditor').onclick=closeEditor;$('resetEdit').onclick=()=>{article.photos[editorIndex].edit=defaults();buildSliders();paint()};
async function blobFrom(p,ratio){const img=await imageFrom(p.src),c=document.createElement('canvas');drawOn(c,p,img,ratio);return new Promise(ok=>c.toBlob(ok,'image/jpeg',.92))}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),20000)}$('saveJpg').onclick=async()=>{const p=article.photos[editorIndex],blob=await blobFrom(p,editorRatio);download(blob,(article.sku||'Foto')+'_'+(editorIndex+1)+'.jpg')};
$('saveTemplate').onclick=()=>{localStorage.setItem('fsflow_template',$('template').value);alert('Vorlage gespeichert')};if(!$('template').value.trim()&&!localStorage.getItem('fsflow_template')){$('template').value='🥇 DAS STÜCK\n📐 MAẞE & PASSFORM\n👀 ZUSTAND\n⚠️ MÄNGEL\n👕 STYLING\n📦 VERSAND & ANGEBOTE\n🏷️ ARTIKELNUMMER\n\nStil: präzise, hochwertig, individuell, nicht übertrieben werblich. Maße nur aus Eingaben. Zustand und Mängel vorsichtig beschreiben. Abschlusstext: Schneller, sorgfältig verpackter Versand. Faire Preisvorschläge sind willkommen. Bei Fragen zur Passform schreib mir einfach.';}const rvDefaultAiEndpoint=location.origin;const rvProviderNames={openai:'OpenAI',claude:'Claude'};function getAiProvider(){return localStorage.getItem('rv_ai_provider')||'openai'}function getAiEndpoint(){return (localStorage.getItem('fsflow_endpoint')||rvDefaultAiEndpoint).trim().replace(/\/$/,'')}function updateAiConnectionLabels(){const provider=getAiProvider(),endpoint=getAiEndpoint();let host;try{host=new URL(endpoint,location.href).host}catch{}const hasPassword=Boolean(($('token')&&$('token').value)||sessionStorage.getItem('rv_token')||sessionStorage.getItem('rv-cloud-session-password'));const state=!host?'KI-Endpunkt ungültig':!hasPassword?'RV-Passwort fehlt':'Konfiguriert · Prüfung beim Senden';if($('settingsAiProviderLabel'))$('settingsAiProviderLabel').textContent=rvProviderNames[provider]||provider;if($('settingsAiChatState'))$('settingsAiChatState').textContent=state;if($('settingsAiListingState'))$('settingsAiListingState').textContent=state;}if($('aiProvider'))$('aiProvider').value=getAiProvider();if($('settingsAiProvider'))$('settingsAiProvider').value=getAiProvider();$('endpoint').value=getAiEndpoint();if($('settingsAiEndpoint'))$('settingsAiEndpoint').value=getAiEndpoint();$('token').value=sessionStorage.getItem('rv_token')||'';$('token').onchange=()=>{sessionStorage.setItem('rv_token',$('token').value);updateAiConnectionLabels()};$('endpoint').onchange=()=>{localStorage.setItem('fsflow_endpoint',$('endpoint').value.trim());if($('settingsAiEndpoint'))$('settingsAiEndpoint').value=$('endpoint').value.trim();updateAiConnectionLabels()};if($('aiProvider'))$('aiProvider').onchange=()=>{localStorage.setItem('rv_ai_provider',$('aiProvider').value);if($('settingsAiProvider'))$('settingsAiProvider').value=$('aiProvider').value;updateAiConnectionLabels()};if($('settingsAiProvider'))$('settingsAiProvider').onchange=()=>{localStorage.setItem('rv_ai_provider',$('settingsAiProvider').value);if($('aiProvider'))$('aiProvider').value=$('settingsAiProvider').value;updateAiConnectionLabels()};if($('settingsAiApply'))$('settingsAiApply').onclick=()=>{if($('settingsAiEndpoint')){$('endpoint').value=$('settingsAiEndpoint').value.trim();localStorage.setItem('fsflow_endpoint',$('endpoint').value.trim())}if($('settingsAiProvider')){localStorage.setItem('rv_ai_provider',$('settingsAiProvider').value);if($('aiProvider'))$('aiProvider').value=$('settingsAiProvider').value}updateAiConnectionLabels();alert('KI-Einstellungen gespeichert.')};if($('settingsAiUseCloud'))$('settingsAiUseCloud').onclick=()=>{const value=location.origin;$('endpoint').value=value;if($('settingsAiEndpoint'))$('settingsAiEndpoint').value=value;localStorage.setItem('fsflow_endpoint',value);updateAiConnectionLabels()};updateAiConnectionLabels();
$('aiBtn').onclick=async()=>{
 pull();
 if(!article.photos.length){$('aiStatus').textContent='Bitte zuerst Fotos hochladen.';return}
 if(!article.cost){$('aiStatus').textContent='Bitte Einkaufspreis eintragen.';return}
 if(!article.measurements){$('aiStatus').textContent='Bitte Maße eintragen.';return}
 if(!article.condition){$('aiStatus').textContent='Bitte Zustand 1–10 wählen.';return}
 const url=getAiEndpoint();
 const provider=getAiProvider();
 let token=rvAiPassword();
 if(!token){token=prompt('RV-Studio-Passwort eingeben (nicht deinen API-Key):')||'';if(token){$('token').value=token;sessionStorage.setItem('rv_token',token)}}
 if(!token){$('aiStatus').textContent='RV-Studio-Passwort fehlt.';return}
 const btn=$('aiBtn');btn.disabled=true;$('aiStatus').textContent=(rvProviderNames[provider]||'KI')+' prüft Fotos, Labels und Produktdetails …';
 try{
   const images=[];
   for(const p of article.photos.filter(x=>!x.cover).slice(0,8)){const c=document.createElement('canvas'),im=await imageFrom(p.src),scale=Math.min(1,1600/Math.max(im.width,im.height));c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);images.push(c.toDataURL('image/jpeg',.86))}
   const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),90000);let res;
   try{res=await fetch(url+'/api/listing',{method:'POST',headers:{'Content-Type':'application/json','X-RV-Password':token,'X-RV-Provider':provider},body:JSON.stringify({provider,images,fields:{sku:article.sku,condition:article.condition,notes:article.notes,measurements:article.measurements},template:$('template').value}),signal:ctrl.signal})}finally{clearTimeout(timeout)}
   let j=await res.json();if(!res.ok)throw Error([j.error,j.detail].filter(Boolean).join(' ')||'Serverfehler');
   if(!platforms.some(k=>typeof j[k]?.title==='string'&&j[k].title.trim()&&typeof j[k]?.description==='string'&&j[k].description.trim()))throw Error('Die KI hat keine verwertbaren Listingtexte geliefert. Bitte erneut versuchen.');
   if(j.detected){['brand','size','category','material','color','country','model'].forEach(k=>article[k]=j.detected[k]||'')}
   if(j.detected?.sku && !article.sku)article.sku=j.detected.sku;
   platforms.forEach(k=>{if(j[k]){let description=j[k].description||'';if(!article.notes.trim())description=description.replace(/(?:^|\n)\s*⚠️\s*MÄNGEL\s*\n[\s\S]*?(?=\n\s*(?:👕\s*STYLING|📦\s*VERSAND|🏷️\s*ARTIKELNUMMER)|$)/g,'').trim();article.listings[k]={title:j[k].title||'',description}}});
   push();renderDetected();$('aiStatus').textContent='✓ '+(rvProviderNames[provider]||'KI')+' hat erkannt und Listings erstellt.';showStep(1);
 }catch(e){$('aiStatus').textContent='KI nicht erreichbar: '+e.message}
 finally{btn.disabled=false}
}
async function saveArticle(){pull();try{await store('readwrite',s=>s.put(article));await renderHome();sxAfterSave()}catch(e){$('saveStatus').textContent='Speichern fehlgeschlagen: '+e.message}}
$('saveArticle').onclick=saveArticle;
let stockFilter='all',stockSelectedId=null;
const stockText=(v)=>String(v??'');
const stockStatus=(a)=>a.articleStatus==='Verkauft'?'sold':a.articleStatus==='Entwurf'?'draft':'active';
const stockRemoveNeeded=(a)=>a.articleStatus==='Verkauft'&&a.sale&&['ebay','vinted','instagram'].some(k=>k!==a.sale.platform&&!a.removedListings?.[k]&&(Boolean(a.listings?.[k]?.title)||Number(a.prices?.[k])>0));
async function renderLibrary(){
 const items=await allArticles(),search=($('searchArticles').value||'').trim().toLowerCase(),target=$('library');
 $('stockSummary').textContent=`${items.length} Artikel · ${items.filter(a=>stockStatus(a)==='active').length} aktiv · ${items.filter(a=>stockStatus(a)==='sold').length} verkauft`;
 const visible=(stockFilter==='archived'?allItems.filter(a=>Boolean(a.archivedAt)):items).filter(a=>{
  const text=[a.sku,a.brand,a.model,a.category,a.size,a.location,a.color,a.listings?.ebay?.title].map(stockText).join(' ').toLowerCase();
  return (!search||text.includes(search))&&(stockFilter==='all'||(stockFilter==='remove'?stockRemoveNeeded(a):stockStatus(a)===stockFilter));
 }).reverse();target.replaceChildren();
 if(!visible.length){const el=document.createElement('div');el.className='stock-empty';el.textContent='Noch keine passenden Artikel. Über + Neuen Artikel anlegen starten.';target.append(el);return}
 for(const a of visible){
  const btn=document.createElement('button');btn.type='button';btn.className='stock-card';btn.onclick=()=>openStockDetail(a.id);
  const picture=document.createElement('div');picture.className='stock-img';
  if(rvThumb(a)){const img=document.createElement('img');img.src=rvThumb(a);img.loading='lazy';img.alt='Foto '+(a.sku||'Artikel');picture.append(img)}else picture.textContent='RV';
  const info=document.createElement('div');info.className='stock-info';
  const name=document.createElement('div');name.className='stock-name';name.textContent=[a.brand,a.category].filter(Boolean).join(' ')||'Unbenannter Artikel';
  const meta=document.createElement('div');meta.className='stock-muted';meta.textContent=[a.sku,a.size&&('Gr. '+a.size),a.location].filter(Boolean).join(' · ')||'Ohne Details';
  const foot=document.createElement('div');foot.className='stock-price';const pill=document.createElement('span');pill.className='stock-pill';pill.textContent=a.archivedAt?'Archiviert':stockRemoveNeeded(a)?'Entfernen':a.articleStatus||'Entwurf';
  const cost=document.createElement('span');cost.textContent=a.sale?euro(Number(a.sale.price||0)-Number(a.cost||0)-Number(a.sale.fees||0)-Number(a.sale.shipping||0))+' Gewinn':euro(a.cost)+' EK';
  foot.append(pill,cost);info.append(name,meta,foot);btn.append(picture,info);target.append(btn);
 }
}
async function openStockDetail(id){
 const a=(await allArticles()).find(x=>x.id===id);if(!a)return;stockSelectedId=id;
 $('stockSku').textContent=a.sku||'Ohne Artikelnummer';$('stockTitle').textContent=[a.brand,a.model].filter(Boolean).join(' ')||[a.brand,a.category].filter(Boolean).join(' ')||'Artikel';
 $('stockMeta').textContent=[a.category,a.size&&'Größe '+a.size,a.color,a.material].filter(Boolean).join(' · ');
 $('stockHero').src=rvThumb(a)||'rv-logo.jpg';$('stockCost').textContent=euro(a.cost);$('stockCondition').textContent=a.condition?a.condition+'/10':'—';$('stockLocationText').textContent=a.location||'—';
 $('stockLocation').value=a.location||'';$('stockStatus').value=['Entwurf','Bereit','Online','Verkauft'].includes(a.articleStatus)?a.articleStatus:'Entwurf';
 const pp=$('stockPlatformPrices');pp.replaceChildren();for(const [k,title] of [['ebay','eBay'],['vinted','Vinted'],['instagram','Instagram']]){const row=document.createElement('div');row.className='stock-platform';const l=document.createElement('span'),v=document.createElement('b');l.textContent=title;v.textContent=a.prices?.[k]?euro(a.prices[k]):'Kein Preis';row.append(l,v);pp.append(row)}
 $('stockSalePanel').classList.toggle('hidden',a.articleStatus==='Verkauft');$('stockSoldPanel').classList.toggle('hidden',a.articleStatus!=='Verkauft');
 $('stockSaleMessage').textContent='';$('stockSaveMessage').textContent='';$('stockSalePrice').value='';$('stockSaleFees').value='0';$('stockSaleShipping').value='0';
 if(a.articleStatus==='Verkauft'){
 const sale=a.sale;$('stockSoldDetails').textContent=sale?`${sale.platform} · ${euro(sale.price)} Umsatz · ${euro(Number(sale.price||0)-Number(a.cost||0)-Number(sale.fees||0)-Number(sale.shipping||0))} Gewinn`:'Als verkauft markiert (keine Verkaufsdaten erfasst).';
 const check=$('stockRemoveChecklist');check.replaceChildren();let entries=0;
 if(sale)for(const [k,label] of [['ebay','eBay'],['vinted','Vinted'],['instagram','Instagram']]){
 if(k===sale.platform||(!a.listings?.[k]?.title&&!Number(a.prices?.[k])))continue;entries++;
 const line=document.createElement('label');const box=document.createElement('input');box.type='checkbox';box.checked=Boolean(a.removedListings?.[k]);box.onchange=async()=>{const latest=(await allArticles()).find(x=>x.id===id);if(!latest)return;latest.removedListings={...(latest.removedListings||{}),[k]:box.checked};await store('readwrite',s=>s.put(latest));await renderLibrary()};line.append(box,document.createTextNode(label+' · Listing entfernt'));check.append(line);
 }if(!entries)check.textContent='Keine weiteren Plattform-Listings hinterlegt.';
 }
 $('stockSheet').classList.remove('hidden');document.body.style.overflow='hidden';
}
function closeStockDetail(){$('stockSheet').classList.add('hidden');document.body.style.overflow='';stockSelectedId=null}
$('stockClose').onclick=closeStockDetail;
$('stockEdit').onclick=async()=>{const a=(await allArticles()).find(x=>x.id===stockSelectedId);if(!a)return;closeStockDetail();article=a;activePlatform='ebay';push();showStep(0)};
$('stockSave').onclick=async()=>{const a=(await allArticles()).find(x=>x.id===stockSelectedId);if(!a)return;const wasSold=a.articleStatus==='Verkauft';a.location=$('stockLocation').value.trim();const newStatus=$('stockStatus').value;
 if(newStatus==='Verkauft'&&!wasSold){$('stockSaveMessage').textContent='Bitte den Verkauf unten mit Preis und Plattform erfassen.';return}
 if(wasSold&&newStatus!=='Verkauft'){if(!confirm('Verkaufsdaten entfernen und Artikel wieder freigeben?'))return;a.sale=null;a.removedListings={}}
 a.articleStatus=newStatus;await store('readwrite',s=>s.put(a));await renderLibrary();await renderHome();await openStockDetail(a.id);$('stockSaveMessage').textContent='✓ Gespeichert';};
$('stockSell').onclick=async()=>{const a=(await allArticles()).find(x=>x.id===stockSelectedId);if(!a)return;const price=Number($('stockSalePrice').value),fees=Number($('stockSaleFees').value),shipping=Number($('stockSaleShipping').value);
 if($('stockSalePrice').value.trim()===''||![price,fees,shipping].every(Number.isFinite)||price<0||fees<0||shipping<0){$('stockSaleMessage').textContent='Bitte gültige Beträge eingeben.';return}
 if(!confirm('Artikel wirklich als verkauft markieren?'))return;
 a.sale={platform:$('stockSalePlatform').value,price,fees,shipping,date:new Date().toISOString()};a.articleStatus='Verkauft';a.removedListings={};
 await store('readwrite',s=>s.put(a));await renderLibrary();await renderHome();await openStockDetail(a.id);
};
$('stockFilters').querySelectorAll('[data-stock-filter]').forEach(btn=>btn.onclick=()=>{stockFilter=btn.dataset.stockFilter;$('stockFilters').querySelectorAll('[data-stock-filter]').forEach(b=>b.classList.toggle('selected',b===btn));renderLibrary()});
async function importBackupFile(file){try{if(!file) return;let data=JSON.parse(await file.text());if(!Array.isArray(data.articles))throw Error('Ungültige Datei');for(const a of data.articles)await store('readwrite',s=>s.put(a));await renderLibrary();await renderHome();alert('Backup importiert')}catch(err){alert('Import fehlgeschlagen: '+err.message)}}$('backup').onclick=async()=>{let all=await store('readonly',s=>s.getAll());download(new Blob([JSON.stringify({version:1,articles:all})],{type:'application/json'}),'rv-studio-backup.json')};$('restore').onchange=async e=>{await importBackupFile(e.target.files&&e.target.files[0]);e.target.value=''};
$('exportArticle').onclick=async()=>{pull();if(!window.JSZip){alert('ZIP-Bibliothek nicht geladen. Internetverbindung prüfen.');return}const zip=new JSZip(),base=article.sku||'Artikel';for(let i=0;i<article.photos.length;i++){const p=article.photos[i];for(const [k,ratio] of [['ebay','1'],['vinted','0.75'],['instagram','0.8']])zip.file(base+'_'+(i+1)+'_'+k+'.jpg',await blobFrom(p,ratio))}for(const k of platforms){const l=article.listings[k];zip.file(k+'.txt',`Titel: ${l.title}\nPreis: ${article.prices[k]||'-'} €\n\n${l.description}`)}download(await zip.generateAsync({type:'blob'}),base+'.zip')};

const euro=v=>(Number(v)||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
async function allArticles(){return await store('readonly',s=>s.getAll())}
let homeAiBooted=false,homeAiBusy=false;
function homeMessage(role,text,opts={}){const feed=$('homeAiFeed');if(!feed)return;const msg=document.createElement('div');msg.className='home-msg '+role;const label=document.createElement('small');label.textContent=role==='user'?'Du':opts.label||'RV AI';const body=document.createElement('div');if(role==='user'||opts.plain){body.textContent=String(text);body.style.whiteSpace='pre-wrap'}else body.innerHTML=text;msg.append(label,body);feed.append(msg);while(feed.children.length>8)feed.removeChild(feed.firstChild);feed.scrollTop=feed.scrollHeight;syncFeeds&&syncFeeds();return msg}
function clearHomeFeed(){const feed=$('homeAiFeed');if(feed)feed.innerHTML='';const alt=$('chatFeed');if(alt)alt.innerHTML='';homeAiBooted=false}
function homeSummaryText(all,sold,stock){const drafts=stock.filter(a=>a.articleStatus==='Entwurf').length,ready=stock.filter(a=>a.articleStatus==='Bereit').length,online=stock.filter(a=>a.articleStatus==='Online').length;return `Ich sehe aktuell <b>${stock.length}</b> aktive Artikel, <b>${sold.length}</b> verkaufte Artikel, <b>${drafts}</b> Entwürfe, <b>${ready}</b> bereite Artikel und <b>${online}</b> bereits online markierte Artikel.`}
function rvAiState(state,message){document.dispatchEvent(new CustomEvent('rv:ai-state',{detail:{state,message}}))}
function rvAiPassword(){return ($('token')&&$('token').value)||sessionStorage.getItem('rv_token')||rvCloudPassword||sessionStorage.getItem('rv-cloud-session-password')||($('rvCloudPassword')&&$('rvCloudPassword').value)||''}
async function runHomeAi(raw,opts={}){
 const sourceInput=raw!==undefined?null:document.activeElement===$('chatInput')?$('chatInput'):$('homeAiInput');
 const text=String(raw!==undefined?raw:(sourceInput&&sourceInput.value)||($('homeAiInput')&&$('homeAiInput').value)||'').trim();
 const localMessage=text=>homeMessage('assistant',text,{label:'RV lokal'});
 if(!text){localMessage('Schreib mir, was du brauchst – zum Beispiel <b>„Zeig mir meine Entwürfe“</b> oder <b>„Öffne den Bestand“</b>.');return}
 if(homeAiBusy){homeMessage('assistant','Eine KI-Anfrage läuft bereits. Warte bitte auf die Antwort.',{plain:true,label:'RV lokal'});return}
 homeMessage('user',opts.display||text);
 if(sourceInput)sourceInput.value='';if($('homeAiInput'))$('homeAiInput').value='';if($('chatInput'))$('chatInput').value='';
 const lower=text.toLowerCase(),escapeText=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 let all;
 try{all=await allArticles()}catch(e){const message='Deine lokalen Artikeldaten konnten nicht geladen werden: '+e.message;homeMessage('assistant',message,{plain:true});rvAiState('error',message);return}
 const sold=all.filter(a=>a.articleStatus==='Verkauft'&&a.sale),stock=all.filter(a=>!a.archivedAt&&a.articleStatus!=='Verkauft');
 const gain=sold.reduce((v,a)=>v+(Number(a.sale.price)||0)-(Number(a.cost)||0)-(Number(a.sale.fees)||0)-(Number(a.sale.shipping)||0),0);
 const drafts=stock.filter(a=>a.articleStatus==='Entwurf'),ready=stock.filter(a=>a.articleStatus==='Bereit'),online=stock.filter(a=>a.articleStatus==='Online'),remove=all.filter(a=>!a.archivedAt&&stockRemoveNeeded(a));
 if(!opts.remote){
  if(/neu|anlegen|erstellen/.test(lower)&&/artikel|listing|produkt|stück/.test(lower)){localMessage('Ich öffne jetzt das Studio für einen neuen Artikel.');setTimeout(()=>{article=blank();push();showStep(0)},120);return}
  if(/bestand|lager|inventory|artikel zeigen|öffne den bestand|zeige mir den bestand/.test(lower)){const m=lower.match(/(?:suche|zeige|finde)\s+(?:mir\s+)?(?:nach\s+)?(.+)/);const term=m&&m[1]&&!/bestand|artikel/.test(m[1])?m[1].trim():'';localMessage(term?`Ich öffne deinen Bestand und suche nach <b>${escapeText(term)}</b>.`:'Ich öffne jetzt deinen Bestand.');setTimeout(()=>{showStep(4);if(term){$('searchArticles').value=term;renderLibrary()}},120);return}
  if(/gewinn|umsatz|finanz|verkäuf|verkauf/.test(lower)){localMessage(`Aus deinen erfassten Daten: <b>${sold.length}</b> Verkäufe und <b>${euro(gain)}</b> realisierter Gewinn. Ich öffne die Finanzübersicht.`);setTimeout(showFinance,120);return}
  if(/entw[uü]rf|aufgabe|offen/.test(lower)){localMessage(`Aus deinem lokalen Bestand: <b>${drafts.length}</b> Entwürfe, <b>${ready.length}</b> bereite Artikel und <b>${online.length}</b> Online-Artikel. ${remove.length?`Bei <b>${remove.length}</b> verkauften Artikeln sind noch weitere Plattformlistings zu entfernen.`:''}`);return}
  if(/backup|sicher|export/.test(lower)){localMessage('Ich starte dein JSON-Backup. Wähle danach den Speicherort auf deinem Gerät.');setTimeout(()=>$('backup').click(),120);return}
  if(/sync|synchron/.test(lower)){localMessage(rvCloudPassword?'Ich starte jetzt die Cloud-Synchronisation.':'Bitte verbinde zuerst deine Cloud in den Einstellungen.');if(rvCloudPassword)setTimeout(()=>$('rvCloudSync').click(),120);return}
  if(/verkauft/.test(lower)&&!/gewinn|umsatz|finanz/.test(lower)){const latest=sold.slice().sort((a,b)=>String(b.sale.date||'').localeCompare(String(a.sale.date||''))).slice(0,3);localMessage(latest.length?`Zuletzt erfasst: <b>${latest.map(a=>escapeText(a.sku||'Artikel')).join(', ')}</b>. Insgesamt <b>${sold.length}</b> verkaufte Artikel.`:'Aktuell ist kein Verkauf erfasst.');return}
 }
 if(homeAiBusy){homeMessage('assistant','Eine KI-Anfrage läuft bereits. Warte bitte auf die Antwort.',{plain:true,label:'RV lokal'});return}
 const token=rvAiPassword(),endpoint=getAiEndpoint(),provider=getAiProvider();
 if(!token){const message='RV-Passwort fehlt. Trage dein RV-Studio-Kennwort in den KI-Einstellungen ein oder verbinde die Cloud. API-Schlüssel werden ausschließlich auf dem Server gespeichert.';homeMessage('assistant',message,{plain:true});rvAiState('setup',message);return}
 try{const url=new URL(endpoint,location.href);if(!['https:','http:'].includes(url.protocol))throw Error('Ungültiges Protokoll')}catch{const message='Der KI-Endpunkt ist ungültig. Prüfe die URL in den Einstellungen.';homeMessage('assistant',message,{plain:true});rvAiState('setup',message);return}
 // The existing chat endpoint reads its six summary fields. For explicit
 // assistant actions, attach bounded real product details to the message;
 // photos, credentials and cloud metadata are never included here.
 let requestMessage=text+(opts.extra||'');
 if(opts.remote||opts.withData){
  const field=value=>String(value??'').slice(0,240);
  const items=stock.slice(0,12).map(a=>({sku:field(a.sku),brand:field(a.brand),category:field(a.category),size:field(a.size),condition:field(a.condition),cost:Number(a.cost)||0,measurements:field(a.measurements),notes:field(a.notes),material:field(a.material),color:field(a.color),prices:a.prices?{ebay:field(a.prices.ebay),vinted:field(a.prices.vinted),instagram:field(a.prices.instagram)}:{},status:field(a.articleStatus),purchaseDate:field(a.purchaseDate)}));
  const sales=sold.slice(-12).map(a=>({sku:field(a.sku),category:field(a.category),price:Number(a.sale.price)||0,cost:Number(a.cost)||0,fees:Number(a.sale.fees)||0,shipping:Number(a.sale.shipping)||0,date:field(a.sale.date)}));
 requestMessage=text+(opts.extra||'')+'\n\nErfasste eigene App-Daten (begrenzte Auswahl, keine externen Marktpreise): '+JSON.stringify({stock:items,sales})+'\nNutze ausschließlich diese Angaben. Fehlende Merkmale und Markttrends nicht erfinden; fordere erforderliche Angaben an. Bei Artikeltexten nur einen Entwurf liefern. Die vollständige Foto-Listing-Erstellung erfolgt im Studio.';
 }
 if(opts.history)requestMessage='Bisheriger Gesprächsverlauf (gekürzt):\n'+opts.history+'\n\nNeue Nachricht: '+requestMessage;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000);
 homeAiBusy=true;rvAiState('busy',(rvProviderNames[provider]||'KI')+' antwortet …');
 const pending=homeMessage('assistant','Ich frage '+(rvProviderNames[provider]||'deine KI')+' an …',{plain:true});
 const removePending=()=>{if(pending&&pending.parentNode)pending.remove();syncFeeds()};
 try{
  const response=await fetch(endpoint+'/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json','X-RV-Password':token,'X-RV-Provider':provider},body:JSON.stringify({provider,message:requestMessage,context:{articles:all.length,sold:sold.length,drafts:drafts.length,ready:ready.length,online:online.length,profit:gain}}),signal:controller.signal});
  const data=await response.json().catch(()=>null);
  if(!response.ok){const error=Error([data&&data.error,data&&data.detail].filter(Boolean).join(' ')||'HTTP '+response.status);error.status=response.status;throw error}
  if(typeof data?.reply!=='string'||!data.reply.trim())throw Error('Der Server hat keine KI-Antwort geliefert.');
  removePending();homeMessage('assistant',data.reply,{plain:true});rvAiState('ready',(rvProviderNames[provider]||'KI')+' ist verbunden.');
 }catch(error){
  removePending();
  const reason=error.name==='AbortError'?'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.':error.message||'Netzwerkfehler';
  const message='KI-Anfrage fehlgeschlagen: '+reason;
  homeMessage('assistant',message,{plain:true});
  rvAiState(error.status===401||/(?:API_KEY|RV_SYNC_PASSWORD).*fehlt/.test(reason)?'setup':'error',message);
 }finally{clearTimeout(timeout);removePending();homeAiBusy=false}
}
document.addEventListener('rv:ai-request',event=>{if(typeof event.detail?.message==='string')runHomeAi(event.detail.message,{remote:true})});
async function renderHome(){const all=await allArticles(),sold=all.filter(a=>a.articleStatus==='Verkauft'&&a.sale),stock=all.filter(a=>a.articleStatus!=='Verkauft'&&!a.archivedAt);const gain=sold.reduce((v,a)=>v+(Number(a.sale.price)||0)-(Number(a.cost)||0)-(Number(a.sale.fees)||0)-(Number(a.sale.shipping)||0),0);const drafts=stock.filter(a=>a.articleStatus==='Entwurf').length,ready=stock.filter(a=>a.articleStatus==='Bereit').length,online=stock.filter(a=>a.articleStatus==='Online').length,remove=all.filter(a=>stockRemoveNeeded(a)).length;$('statStock').textContent=stock.length;$('statSold').textContent=sold.length;$('statInvest').textContent=euro(stock.reduce((v,a)=>v+(Number(a.cost)||0),0));$('statProfit').textContent=euro(gain);
const recent=$('homeRecent');recent.replaceChildren();const list=all.slice(-3).reverse();if(!list.length){const el=document.createElement('div');el.className='rv-recent-empty';el.textContent='Noch keine Artikel. Starte mit deinem ersten Produkt.';recent.append(el)}for(const a of list){const b=document.createElement('button');b.type='button';b.className='rv-product-card';const im=document.createElement('img');im.loading='lazy';im.src=rvThumb(a)||'rv-logo.jpg';im.alt='Artikelfoto';const title=document.createElement('strong');title.textContent=[a.brand,a.category].filter(Boolean).join(' ')||a.sku||'Artikel';const price=document.createElement('b');price.textContent=a.prices?.vinted?euro(a.prices.vinted):a.prices?.ebay?euro(a.prices.ebay):euro(a.cost)+' EK';const badge=document.createElement('small');badge.textContent=a.articleStatus||'Entwurf';b.append(im,title,price,badge);b.onclick=()=>openStockDetail(a.id);recent.append(b)}
const tasks=$('homeTasks');tasks.replaceChildren();
const relevant=all.filter(a=>!a.archivedAt&&a.articleStatus!=='Verkauft');
const actionList=[];
for(const a of relevant){
 if(actionList.length>=4)break;
 const title=[a.brand,a.category].filter(Boolean).join(' ')||a.sku||'Dein Artikel';
 let action='';
 if(!a.photos?.length)action='Fotos hinzufügen';
 else if(!Object.values(a.listings||{}).some(x=>x?.title))action='Beschreibung erstellen';
 else if(a.articleStatus==='Entwurf')action='Entwurf bearbeiten';
 else if(a.articleStatus==='Bereit')action='Artikel online stellen';
 if(action)actionList.push({a,title,action});
}
if(actionList.length){for(const {a,title,action} of actionList.slice(0,3)){
 const b=document.createElement('button');b.type='button';b.className='lux-task-item';
 const photo=document.createElement('img');photo.loading='lazy';photo.src=rvThumb(a)||'/rv-logo.jpg';photo.alt='Artikelfoto';
 const text=document.createElement('span');text.className='lux-task-description';
 const heading=document.createElement('strong');heading.textContent=action;
 const subtitle=document.createElement('small');subtitle.textContent=(a.sku?a.sku+' · ':'')+title;
 const chevron=document.createElement('span');chevron.className='lux-task-chevron';chevron.textContent='›';
 text.append(heading,subtitle);b.append(photo,text,chevron);b.onclick=()=>openStockDetail(a.id);tasks.append(b)
}} else {const empty=document.createElement('div');empty.className='lux-empty-task';empty.textContent=all.length?'Alles im Blick – aktuell keine offenen Artikel-Aufgaben.':'Noch keine Artikel. Lege deinen ersten Artikel an und RV Studio zeigt dir hier deine nächsten Schritte.';tasks.append(empty)}
if(!homeAiBooted)homeAiBooted=true}

function hidePrimaryViews(){document.querySelector('main.wrap').classList.add('hidden');$('finance').classList.add('hidden');$('aiChat')&&$('aiChat').classList.add('hidden');$('settingsPage')&&$('settingsPage').classList.add('hidden');$('nav').classList.add('hidden')}
function showHome(){hidePrimaryViews();document.querySelector('main.wrap').classList.remove('hidden');$('home').classList.remove('hidden');for(let i=0;i<5;i++)$('s'+i).classList.add('hidden');$('steps').classList.add('hidden');$('nav').classList.add('hidden');selectBottomNav('navHome');renderHome();window.scrollTo(0,0)}
async function showFinance(){hidePrimaryViews();$('finance').classList.remove('hidden');const all=await allArticles(),sold=all.filter(a=>a.articleStatus==='Verkauft'&&a.sale),stock=all.filter(a=>a.articleStatus!=='Verkauft'&&!a.archivedAt);const revenue=sold.reduce((v,a)=>v+Number(a.sale.price||0),0),fees=sold.reduce((v,a)=>v+Number(a.sale.fees||0)+Number(a.sale.shipping||0),0),purchase=sold.reduce((v,a)=>v+Number(a.cost||0),0),profit=revenue-fees-purchase;$('financeStock').textContent=euro(stock.reduce((v,a)=>v+Number(a.cost||0),0));$('financeRevenue').textContent=euro(revenue);$('financeFees').textContent=euro(fees);$('financeProfitHero').textContent=euro(profit);$('financeHeroHint').textContent=sold.length?('Basierend auf '+sold.length+' erfassten Verkäufen.'):'Sobald du Verkäufe speicherst, erscheint hier dein Gewinn.';$('financeSalesCount').textContent=sold.length;$('salesList').innerHTML='';for(const a of sold){let d=document.createElement('div');d.className='item';d.textContent=(a.sku||'Artikel')+' · '+a.sale.platform+' · '+euro(a.sale.price);$('salesList').append(d)}const insights=$('financeInsights');insights.innerHTML='';const top=sold.slice().sort((a,b)=>(Number(b.sale?.price||0)-Number(a.sale?.price||0)))[0];const stockValue=stock.reduce((v,a)=>v+Number(a.cost||0),0);const draftCount=stock.filter(a=>a.articleStatus==='Entwurf').length;[['BESTER EINZELVERKAUF', top?((top.sku||'Artikel')+' · '+euro(top.sale.price)):'Noch kein Verkauf'],['AKTIVER WARENWERT', euro(stockValue)],['OFFENE ENTWÜRFE', String(draftCount)],['GEWINNQUOTE', revenue?Math.round((profit/revenue)*100)+' %':'—']].forEach(([a,b])=>{const box=document.createElement('div');box.className='insight';const sm=document.createElement('small');sm.textContent=a;const st=document.createElement('strong');st.textContent=b;box.append(sm,st);insights.append(box)});selectBottomNav('navFinance');window.scrollTo(0,0)}
async function recordSale(a){let platform=prompt('Verkauft auf welcher Plattform? (ebay / vinted / instagram)','vinted');if(platform===null)return;platform=platform.toLowerCase().trim();if(!platforms.includes(platform)){alert('Bitte ebay, vinted oder instagram eingeben');return}let price=prompt('Tatsächlicher Verkaufspreis in Euro',a.prices?.[platform]||'');if(price===null)return;let fees=prompt('Verkaufsgebühren in Euro','0');if(fees===null)return;let shipping=prompt('Selbst bezahlte Versandkosten in Euro','0');if(shipping===null)return;let nums=[price,fees,shipping].map(x=>Number(String(x).replace(',','.')));if(nums.some(x=>!Number.isFinite(x)||x<0)){alert('Bitte gültige Beträge eingeben');return}a.sale={platform,price:nums[0],fees:nums[1],shipping:nums[2],date:new Date().toISOString()};a.articleStatus='Verkauft';await store('readwrite',s=>s.put(a));alert('Verkauf erfasst. Bitte die Inserate auf den anderen Plattformen manuell entfernen.');await renderLibrary();await renderHome()}
function syncFeeds(){const from=$('homeAiFeed');const to=$('chatFeed');if(from&&to)to.innerHTML=from.innerHTML}
function showChat(){closeStockDetail&&closeStockDetail();hidePrimaryViews();$('aiChat').classList.remove('hidden');selectBottomNav('navChat');syncFeeds();window.scrollTo(0,0);setTimeout(()=>{$('chatInput')&&$('chatInput').focus()},80)}
function showSettings(){closeStockDetail&&closeStockDetail();hidePrimaryViews();$('settingsPage').classList.remove('hidden');selectBottomNav('navSettings');window.scrollTo(0,0)}
$('stockNewArticleQuick').onclick=()=>$('newArticle').click();$('homeNew').onclick=()=>{article=blank();push();showStep(0)};$('homeLibrary').onclick=()=>showStep(4);$('homeLibraryTop').onclick=()=>showStep(4);$('homeBackup').onclick=()=>$('backup').click();$('homeToSettings').onclick=()=>showSettings();$('homeToChat').onclick=()=>showChat();$('homeRefresh').onclick=()=>renderHome();$('homeAiSend').onclick=()=>runHomeAi();$('chatSend').onclick=()=>runHomeAi($('chatInput').value);$('chatClear').onclick=()=>{clearHomeFeed();syncFeeds()};$('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runHomeAi($('chatInput').value)}});document.querySelectorAll('.chat-chip').forEach(b=>b.onclick=()=>runHomeAi(b.dataset.chatCmd||b.textContent));$('settingsBackup').onclick=()=>$('backup').click();$('settingsRestore').onchange=async e=>{await importBackupFile(e.target.files&&e.target.files[0]);e.target.value=''};$('homeAiClear').onclick=clearHomeFeed;$('homeAiAttach').onclick=()=>{article=blank();push();showStep(0);$('upload').click()};$('homeDrafts').onclick=()=>{showStep(4);stockFilter='draft';document.querySelectorAll('.stock-chip').forEach(b=>b.classList.toggle('selected',b.dataset.filter==='draft'));renderLibrary()};$('homeFinances').onclick=()=>showFinance();$('homeSyncShort').onclick=()=>{showSettings();setTimeout(()=>{$('rvCloudPassword').scrollIntoView({behavior:'smooth'});if(rvCloudPassword)$('rvCloudSync').click()},80)};$('homeStatStock').onclick=()=>showStep(4);$('homeStatSold').onclick=()=>showFinance();$('homeStatInvest').onclick=()=>showFinance();$('homeStatProfit').onclick=()=>showFinance();$('rvNotify').onclick=()=>{showHome();const tasks=$('homeTasks'),tools=tasks&&tasks.closest('details.v15-more-tools');if(tools)tools.open=true;if(tasks)requestAnimationFrame(()=>tasks.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}))};$('navChat').onclick=()=>showChat();$('navSettings').onclick=()=>showSettings();$('homeAiInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runHomeAi()}});document.querySelectorAll('.home-chip').forEach(b=>b.onclick=()=>runHomeAi(b.dataset.cmd||b.textContent));$('navHome').onclick=()=>showHome();$('navStock').onclick=()=>showStep(4);$('navStudio').onclick=()=>{article=blank();push();showStep(0)};$('navFinance').onclick=()=>showFinance();$('searchArticles').oninput=()=>renderLibrary();

// V5 Bestand: only inventory UI; photo upload, AI and editor remain V4 originals.
let v5Tab='all',v5List=(()=>{try{return localStorage.getItem('rv_stock_view')==='list'}catch(e){return false}})(),v5Selecting=false,v5Picked=new Set(),v5WorkFilter='',v5Cache=[];
const v5Date=a=>{const v=a.purchaseDate||a.createdAt||a.date||'';const t=Date.parse(v);return Number.isFinite(t)?t:null};
const v5Age=a=>{const t=v5Date(a);return t===null?null:Math.max(0,Math.floor((Date.now()-t)/86400000))};
const v5Available=a=>a.articleStatus!=='Verkauft';
const v5HasListing=a=>['ebay','vinted','instagram'].some(k=>a.listings?.[k]?.title || Number(a.prices?.[k])>0);
const v5Task=(a,key)=>{
 if(key==='draft')return v5Available(a)&&a.articleStatus==='Entwurf';
 if(key==='unlisted')return v5Available(a)&&!v5HasListing(a);
 if(key==='sale')return a.articleStatus==='Verkauft'&&a.sale&&!a.shippedAt;
 if(key==='remove')return stockRemoveNeeded(a);
 return true;
};
// Bestands-Übersicht im Aufbau der Startseite: Kennzahlen links, Status-Ring in der Mitte, Kategorien rechts.
const bxEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bxSvg=d=>'<svg class="bx-ico" viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
const BX_ICONS={
 coins:bxSvg('<ellipse cx="12" cy="6" rx="6" ry="2.5"/><path d="M6 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6M6 10v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4M6 14v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/>'),
 tag:bxSvg('<path d="M3 12V4h8l9 9-8 8-9-9Z"/><circle cx="7.5" cy="8.5" r="1.5"/>'),
 clock:bxSvg('<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>'),
 chart:bxSvg('<path d="M5 20v-5M10 20V11M15 20V6M20 20V3"/>'),
 globe:bxSvg('<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16"/>'),
 percent:bxSvg('<path d="M6 18 18 6"/><circle cx="7.5" cy="7.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>'),
 active:bxSvg('<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>'),
 incomplete:bxSvg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M12 12v3M12 18h.01"/>'),
 stale:bxSvg('<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>'),
 price:bxSvg('<path d="M3 12V4h8l9 9-8 8-9-9Z"/><path d="M9.5 9.5 14 14M14 9.5 9.5 14"/>')
};
const BX_STATUS=[['online','Online','#3d9bff'],['ready','Bereit','#8fd4ff'],['draft','Entwurf','#7f8da8'],['sold','Verkauft','#ffb060']];
function bxStatusKey(a){return ({Entwurf:'draft',Bereit:'ready',Online:'online',Verkauft:'sold'}[a.articleStatus]||'draft')}
function bxMaxPrice(a){return Math.max(0,...Object.values(a.prices||{}).map(Number).filter(Number.isFinite))}
function bxProfit(a){return a.sale?Number(a.sale.price||0)-Number(a.cost||0)-Number(a.sale.fees||0)-Number(a.sale.shipping||0):0}
function bxMetric(icon,label,value,delta,cls,extra){return '<div class="bx-m'+(extra?' has-spark':'')+'"><span class="mi">'+BX_ICONS[icon]+'</span><span class="tx"><span class="lbl">'+label+'</span><span class="val">'+bxEsc(value)+'</span><span class="dl '+(cls||'')+'">'+bxEsc(delta)+'</span></span>'+(extra||'')+'</div>'}
function bxBars(rows,unit){return rows.map(([name,val,pct])=>'<div class="row"><span class="nm">'+bxEsc(name)+'</span><span class="tr"><s style="width:'+Math.max(4,Math.round(pct))+'%"></s></span><span class="pc">'+bxEsc(val)+(unit||'')+'</span></div>').join('')}
function bxSpark(values){
 if(values.filter(v=>v).length<2)return '';
 const w=86,h=34,max=Math.max(...values,1),min=Math.min(...values,0),step=w/(values.length-1);
 const pts=values.map((v,i)=>[i*step,h-3-((v-min)/(max-min||1))*(h-8)]);
 const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 return '<svg class="bx-spark" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><defs><linearGradient id="bxSpF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d9bff" stop-opacity=".45"/><stop offset="1" stop-color="#3d9bff" stop-opacity="0"/></linearGradient></defs><path d="'+d+' L'+w+' '+h+' L0 '+h+' Z" fill="url(#bxSpF)"/><path d="'+d+'" fill="none" stroke="#5fb4ff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}
function v5Analytics(items){
 const available=items.filter(v5Available),sold=items.filter(a=>a.articleStatus==='Verkauft'&&a.sale);
 const cost=available.reduce((n,a)=>n+Number(a.cost||0),0);
 const potential=available.reduce((n,a)=>n+bxMaxPrice(a),0);
 const ages=available.map(v5Age).filter(x=>x!==null);
 const avgAge=ages.length?Math.round(ages.reduce((a,b)=>a+b,0)/ages.length):null,old60=ages.filter(x=>x>60).length;
 const profit=sold.reduce((n,a)=>n+bxProfit(a),0),revenue=sold.reduce((n,a)=>n+Number(a.sale.price||0),0);
 const listed=available.filter(a=>bxMaxPrice(a)>0),listedCost=listed.reduce((n,a)=>n+Number(a.cost||0),0),spread=potential-listedCost;
 const weeks=Array(8).fill(0),now=Date.now();for(const a of sold){const t=Date.parse(a.sale.date);if(!Number.isFinite(t))continue;const w=Math.floor((now-t)/(7*86400000));if(w>=0&&w<8)weeks[7-w]+=bxProfit(a)}
 const counts=Object.fromEntries(BX_STATUS.map(([k])=>[k,0]));for(const a of items)counts[bxStatusKey(a)]++;
 const total=items.length||0;
 // Status-Ring
 const R=78,C=2*Math.PI*R;let off=0,ring='';
 for(const [k,,color] of BX_STATUS){const part=total?counts[k]/total:0;if(!part)continue;const len=Math.max(0,part*C-3);ring+='<circle class="seg" cx="100" cy="100" r="'+R+'" stroke="'+color+'" stroke-dasharray="'+len.toFixed(1)+' '+(C-len).toFixed(1)+'" stroke-dashoffset="'+(-off).toFixed(1)+'" style="--glow:'+color+'"/>';off+=part*C}
 const legend=BX_STATUS.map(([k,label,color])=>'<span><i style="background:'+color+';box-shadow:0 0 8px '+color+'"></i>'+label+'<b>'+counts[k]+'</b></span>').join('');
 // Kategorien
 const cat=new Map();for(const a of available){const k=String(a.category||'Ohne Kategorie').trim()||'Ohne Kategorie';cat.set(k,(cat.get(k)||0)+1)}
 let cats=[...cat.entries()].sort((x,y)=>y[1]-x[1]);if(cats.length>5){const rest=cats.slice(4).reduce((n,x)=>n+x[1],0);cats=cats.slice(0,4).concat([['Sonstiges',rest]])}
 const catRows=cats.map(([n,c])=>[n,Math.round(c/(available.length||1)*100),c/(cats[0]?.[1]||1)*100]);
 const online=items.filter(a=>a.articleStatus==='Online').length,quote=total?Math.round(sold.length/total*100):0;
 let html='<div class="bx-ph"><span class="bx-hx">'+BX_ICONS.chart+'</span><div class="bx-tt"><h2 class="bx-title">Bestands-Übersicht</h2><span class="bx-sub">Live aus deinem Lager</span></div>'
  +(v5Tab==='analytics'?'':'<button type="button" class="bx-link" data-bx-tab="analytics">Analyse <svg class="bx-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>')+'</div>'
  +'<div class="bx-body"><div class="bx-col">'
  +bxMetric('coins','Warenwert (EK)',euro(cost),available.length+' Artikel im Lager','nil')
  +bxMetric('tag','Verkaufswert',euro(potential),spread>0?'↗ +'+euro(spread)+' Spanne':'Noch keine Preise',spread>0?'':'nil')
  +bxMetric('clock','Ø Lagerdauer',avgAge===null?'—':avgAge+' Tage',old60?old60+' Artikel über 60 Tage':'↗ Alles frisch',old60?'warn':'')
  +bxMetric('chart','Realisierter Gewinn',euro(profit),revenue>0?'↗ Ø '+Math.round(profit/revenue*100)+' % Marge':'Noch keine Verkäufe',revenue>0?'':'nil',bxSpark(weeks))
  +'</div><div class="bx-ring" role="img" aria-label="'+(total-counts.sold)+' Artikel im Lager, '+counts.sold+' verkauft">'
  +'<svg viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="bxCore" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#2a5fae" stop-opacity=".55"/><stop offset=".7" stop-color="#0c1a33" stop-opacity=".2"/><stop offset="1" stop-color="#050a14" stop-opacity="0"/></radialGradient></defs>'
  +'<circle cx="100" cy="100" r="96" class="hud a"/><circle cx="100" cy="100" r="90" class="hud b"/><circle cx="100" cy="100" r="66" fill="url(#bxCore)"/>'
  +'<circle cx="100" cy="100" r="'+R+'" class="track"/>'+ring+'<g class="orbit"><circle cx="100" cy="4" r="2.6" class="dot"/></g></svg>'
  +'<div class="bx-ring-c"><b>'+(total-counts.sold)+'</b><span>im Lager</span><small>'+counts.sold+' verkauft</small></div>'
  +'<div class="bx-legend">'+legend+'</div></div>'
  +'<div class="bx-col"><div class="bx-cat"><div class="hd"><b>Top Kategorien</b><small>% vom Bestand</small></div>'+(catRows.length?bxBars(catRows,' %'):'<p class="bx-empty">Noch keine Artikel im Lager.</p>')+'</div>'
  +'<div class="bx-s2"><span class="mi">'+BX_ICONS.globe+'</span><span class="tx"><span class="lbl">Online-Angebote</span><span class="val">'+online+'</span></span></div>'
  +'<div class="bx-s2"><span class="mi">'+BX_ICONS.percent+'</span><span class="tx"><span class="lbl">Verkaufsquote</span><span class="val">'+quote+' %</span></span></div>'
  +'</div></div>';
 if(v5Tab==='analytics')html+=bxAnalyticsExtras(available);
 const root=$('v5Analysis');root.innerHTML=html;
 root.querySelectorAll('[data-bx-tab]').forEach(b=>b.onclick=()=>{v5SetTab(b.dataset.bxTab);$('v5Tabs').scrollIntoView({behavior:'smooth',block:'start'})});
 root.querySelectorAll('[data-bx-open]').forEach(b=>b.onclick=()=>openStockDetail(b.dataset.bxOpen));
}
function bxAnalyticsExtras(available){
 const buckets=[['0–30 Tage',0,30],['31–60 Tage',31,60],['61–90 Tage',61,90],['über 90 Tage',91,1e9]].map(([n,lo,hi])=>[n,available.filter(a=>{const d=v5Age(a);return d!==null&&d>=lo&&d<=hi}).length]);
 const maxB=Math.max(1,...buckets.map(x=>x[1]));
 const brands=new Map();for(const a of available){const k=String(a.brand||'Ohne Marke').trim()||'Ohne Marke';brands.set(k,(brands.get(k)||0)+bxMaxPrice(a))}
 const topB=[...brands.entries()].sort((x,y)=>y[1]-x[1]).slice(0,5),maxM=Math.max(1,...topB.map(x=>x[1]));
 const slow=[...available].filter(a=>v5Age(a)!==null).sort((x,y)=>v5Age(y)-v5Age(x)).slice(0,4);
 return '<div class="bx-ana">'
  +'<div class="bx-cat"><div class="hd"><b>Lager-Alter</b><small>Artikel</small></div>'+bxBars(buckets.map(([n,c])=>[n,c,c/maxB*100]))+'</div>'
  +'<div class="bx-cat"><div class="hd"><b>Top Marken</b><small>Verkaufswert</small></div>'+(topB.length?bxBars(topB.map(([n,v])=>[n,euro(v),v/maxM*100])):'<p class="bx-empty">Noch keine Daten.</p>')+'</div>'
  +'<div class="bx-cat bx-slow"><div class="hd"><b>Ladenhüter</b><small>längste Lagerdauer</small></div>'
  +(slow.length?slow.map(a=>'<button type="button" class="bx-slowrow" data-bx-open="'+bxEsc(a.id)+'">'+(rvThumb(a)?'<img src="'+bxEsc(rvThumb(a))+'" alt="" loading="lazy">':'<span class="ph">RV</span>')+'<span class="nm"><b>'+bxEsc([a.brand,a.model].filter(Boolean).join(' ')||a.category||'Artikel')+'</b><small>'+bxEsc(a.location||a.sku||'')+'</small></span><span class="dd">'+v5Age(a)+' T</span></button>').join(''):'<p class="bx-empty">Keine Artikel im Lager.</p>')
  +'</div></div>';
}
function v5Work(items){
 const defs=[['draft','Entwürfe','Noch fertigstellen'],['unlisted','Ohne Listing','Plattformen prüfen'],['sale','Verkauf abwickeln','Versand bestätigen'],['remove','Listings entfernen','Andere Plattformen']];
 const root=$('v5Work');root.replaceChildren();for(const [k,label,desc] of defs){const b=document.createElement('button');b.type='button';b.innerHTML='<span></span><strong></strong><span></span>';b.children[0].textContent=label;b.children[1].textContent=items.filter(a=>v5Task(a,k)).length;b.children[2].textContent=desc;b.onclick=()=>{v5Tab='all';v5WorkFilter=k;$('v5Tabs').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.v5Tab==='all'));$('v5Work').classList.add('v5-hidden');$('v5InventoryArea').classList.remove('v5-hidden');renderLibrary()};root.append(b)}
}
function v5BulkRefresh(){ $('v5Bulk').classList.toggle('v5-hidden',!v5Selecting);$('v5SelectedCount').textContent=v5Picked.size+' ausgewählt';$('v5Multi').classList.toggle('active',v5Selecting);$('v5Multi').innerHTML=v5Selecting?'<svg class="bx-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg><span>Fertig</span>':'<svg class="bx-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg><span>Auswahl</span>';}
function v5SetTab(tab){v5Tab=tab;v5WorkFilter='';$('v5Tabs').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.v5Tab===tab));$('v5Work').classList.toggle('v5-hidden',tab!=='work');$('v5InventoryArea').classList.toggle('v5-hidden',tab!=='all');$('v5Analysis').classList.toggle('v5-hidden',tab==='work'||tab==='brands');$('v6Brands').classList.toggle('v5-hidden',tab!=='brands');renderLibrary()}
$('v5Tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>v5SetTab(b.dataset.v5Tab));
$('v5Sort').onchange=()=>renderLibrary();
const bxViewLabel=()=>{$('v5View').innerHTML=v5List?'<svg class="bx-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg><span>Raster</span>':'<svg class="bx-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>Liste</span>'};
bxViewLabel();$('v5View').onclick=()=>{v5List=!v5List;try{localStorage.setItem('rv_stock_view',v5List?'list':'grid')}catch(e){}bxViewLabel();renderLibrary()};
$('v5Multi').onclick=()=>{v5Selecting=!v5Selecting;if(!v5Selecting)v5Picked.clear();v5BulkRefresh();renderLibrary()};
$('v5Cancel').onclick=()=>{v5Selecting=false;v5Picked.clear();v5BulkRefresh();renderLibrary()};
$('v5SelectAll').onclick=()=>{v5Picked=new Set(v5Cache.filter(v5Available).map(x=>x.id));v5BulkRefresh();renderLibrary()};
$('v5BulkAction').onchange=()=>{for(const key of ['Status','Location','Price'])$('v5Bulk'+key).classList.toggle('v5-hidden',$('v5BulkAction').value!==key.toLowerCase())};
$('v5Apply').onclick=async()=>{
 const action=$('v5BulkAction').value,ids=new Set(v5Picked),all=await allArticles();let updated=0;
 if(!ids.size){alert('Bitte zuerst Artikel auswählen.');return}
 let price,location,status;
 if(action==='price'){price=Number($('v5BulkPriceValue').value);if($('v5BulkPriceValue').value.trim()===''||!Number.isFinite(price)||price<0){alert('Bitte gültigen Preis eingeben.');return}}
 if(action==='location')location=$('v5BulkLocationValue').value.trim();
 if(action==='status')status=$('v5BulkStatusValue').value;
 if(!confirm(ids.size+' Artikel gemeinsam ändern?'))return;
 for(const a of all){if(!ids.has(a.id)||!v5Available(a))continue;
   if(action==='status')a.articleStatus=status;
   if(action==='location')a.location=location;
   if(action==='price'){const platform=$('v5BulkPlatform').value;v6RecordPrice(a,platform,price);a.prices=a.prices||{};a.prices[platform]=price}
   await store('readwrite',s=>s.put(a));updated++;
 }
 v5Selecting=false;v5Picked.clear();v5BulkRefresh();await renderLibrary();await renderHome();alert(updated+' Artikel aktualisiert.');
};

// V6: inventory-only augmentations. The image uploader, AI generation and editor remain untouched.
function v6Missing(a){
 const checks=[['Foto',(a.photos||[]).some(p=>p.src)],['Artikelnummer',Boolean(String(a.sku||'').trim())],['Marke',Boolean(String(a.brand||'').trim())],['Kategorie',Boolean(String(a.category||'').trim())],['Größe',Boolean(String(a.size||'').trim())],['Einkaufspreis',a.cost!==''&&a.cost!=null&&Number.isFinite(Number(a.cost))&&Number(a.cost)>=0],['Maße',Boolean(String(a.measurements||a.chest||'').trim())],['Zustand',Number(a.condition)>=1&&Number(a.condition)<=10],['Mängelangabe',Boolean(String(a.notes||'').trim())],['Plattformpreis',Object.values(a.prices||{}).some(p=>p!==''&&Number(p)>0)],['Listingtext',Object.values(a.listings||{}).some(l=>l&&l.title&&l.description)]];
 return checks.filter(x=>!x[1]).map(x=>x[0]);
}
function v6RecordPrice(a,platform,price){
 const old=a.prices?.[platform];const prev=old===''||old==null?null:Number(old),next=Number(price);
 if(!Number.isFinite(next)||next<0||prev===next)return false;
 a.priceHistory=Array.isArray(a.priceHistory)?a.priceHistory:[];
 a.priceHistory.push({platform,old:prev,new:next,at:new Date().toISOString()});return true;
}
function v6ShowFilter(key){
 v5Tab='all';v5WorkFilter=key;stockFilter='all';$('stockFilters').querySelectorAll('[data-stock-filter]').forEach(b=>b.classList.toggle('selected',b.dataset.stockFilter==='all'));
 $('v5Tabs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v5Tab==='all'));
 $('v5Work').classList.add('v5-hidden');$('v5InventoryArea').classList.remove('v5-hidden');$('v5Analysis').classList.remove('v5-hidden');$('v6Brands').classList.add('v5-hidden');renderLibrary();
 $('v5InventoryArea').scrollIntoView({behavior:'smooth',block:'start'});
}
function v6RenderCockpit(items){
 const active=items.filter(v5Available);
 const stats=[['active','Aktive Artikel',active.length],['incomplete','Unvollständige Artikel',active.filter(a=>v6Missing(a).length).length],['stale','Über 30 Tage',active.filter(a=>(v5Age(a)??-1)>=30).length],['price','Preis prüfen',active.filter(a=>v5HasListing(a)&&(v5Age(a)??-1)>=30).length]];
 const r=$('v6Tiles');r.replaceChildren();stats.forEach(([k,label,count])=>{const b=document.createElement('button');b.type='button';b.className='v6-tile bx-q'+(count?'':' bx-zero');b.innerHTML='<span class="ic">'+BX_ICONS[k]+'</span><span class="lb"></span><strong class="bd"></strong>';b.querySelector('.lb').textContent=label;b.querySelector('.bd').textContent=count;b.onclick=()=>v6ShowFilter(k);r.append(b)});
}
function v6RenderBrands(items){
 const target=$('v6Brands');target.replaceChildren();const h=document.createElement('h3');h.textContent='Marken-Analyse';target.append(h);
 const hint=document.createElement('p');hint.className='v6-hint';hint.textContent='Verkaufspreise, Artikelgewinne und Verkaufsdauer pro Marke. Nur Artikel mit erfasstem Verkauf zählen zu den Gewinnen.';target.append(hint);
 const map=new Map();for(const a of items){const name=String(a.brand||'Ohne Marke').trim()||'Ohne Marke',key=name.toLocaleLowerCase('de');if(!map.has(key))map.set(key,{name,total:0,available:0,sales:0,profit:0,days:[]});const x=map.get(key);x.total++;if(v5Available(a))x.available++;
 if(a.articleStatus==='Verkauft'&&a.sale){x.sales++;x.profit+=Number(a.sale.price||0)-Number(a.cost||0)-Number(a.sale.fees||0)-Number(a.sale.shipping||0);const start=v5Date(a),end=Date.parse(a.sale.date);if(start!==null&&Number.isFinite(end)&&end>=start)x.days.push(Math.round((end-start)/86400000))}}
 const table=document.createElement('table');table.className='v6-table';const tr=document.createElement('tr');for(const label of ['Marke','Artikel','Verkauft','Gewinn','Ø Tage']){const th=document.createElement('th');th.textContent=label;tr.append(th)}const thead=document.createElement('thead');thead.append(tr);table.append(thead);const body=document.createElement('tbody');const ranked=[...map.values()].sort((a,b)=>b.profit-a.profit||b.sales-a.sales);for(const x of ranked){const row=document.createElement('tr');for(const val of [x.name,x.total,x.sales,euro(x.profit),x.days.length?Math.round(x.days.reduce((a,b)=>a+b,0)/x.days.length):'—']){const cell=document.createElement('td');cell.textContent=val;row.append(cell)}body.append(row)}table.append(body);target.append(table);if(!ranked.length){const p=document.createElement('p');p.className='v6-hint';p.textContent='Noch keine Artikel vorhanden.';target.append(p)}
}
function v6RenderDetail(a){
 const c=$('v6Checklist');c.replaceChildren();const missing=new Set(v6Missing(a));
 for(const label of ['Foto','Artikelnummer','Marke','Kategorie','Größe','Einkaufspreis','Maße','Zustand','Mängelangabe','Plattformpreis','Listingtext']){const r=document.createElement('div');r.className='v6-check'+(!missing.has(label)?' ok':'');r.textContent=(missing.has(label)?'○':'✓')+' '+label;c.append(r)}
 const history=$('v6PriceHistory');history.replaceChildren();const logs=Array.isArray(a.priceHistory)?a.priceHistory:[];
 if(!logs.length){history.textContent='Noch keine Preisänderungen protokolliert.';return}
 const ordered=[...logs].sort((x,y)=>Date.parse(y.at)-Date.parse(x.at));for(const l of ordered){const p=document.createElement('div');p.className='v5-listing';const d=Date.parse(l.at),dt=Number.isFinite(d)?new Date(d).toLocaleString('de-DE'):'Datum unbekannt';p.textContent=dt+' · '+l.platform+' · '+(l.old===null?'Erstpreis':euro(l.old))+' → '+euro(l.new);history.append(p)}
}
// On-demand perceptual image hash. No picture leaves the device for duplicate detection.
async function v6ImageHash(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=9;canvas.height=8;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas');ctx.drawImage(im,0,0,9,8);const pix=ctx.getImageData(0,0,9,8).data,gray=[];for(let i=0;i<pix.length;i+=4)gray.push(pix[i]*.299+pix[i+1]*.587+pix[i+2]*.114);let bits='';for(let y=0;y<8;y++)for(let x=0;x<8;x++)bits+=gray[y*9+x]>gray[y*9+x+1]?'1':'0';resolve(bits)}catch(e){reject(e)}};im.onerror=()=>reject(Error('Bild nicht lesbar'));im.src=src})}
function v6Similarity(x,y){if(!x||!y)return 0;let diff=0;for(let i=0;i<64;i++)if(x[i]!==y[i])diff++;return 1-diff/64}
async function v6FindDuplicates(){
 const status=$('v6DuplicateStatus'),root=$('v6DuplicateResults');root.replaceChildren();status.textContent='Vergleiche Fotos und Artikelmerkmale …';
 const items=await allArticles(),signatures=[];
 for(const a of items){let hash=null;try{if(a.photos?.[0]?.src)hash=await v6ImageHash(a.photos[0].src)}catch{}signatures.push({a,hash})}
 const pairs=[];for(let i=0;i<signatures.length;i++)for(let j=i+1;j<signatures.length;j++){
 const A=signatures[i],B=signatures[j],visual=v6Similarity(A.hash,B.hash),brand=String(A.a.brand||'').trim().toLowerCase(),sameBrand=brand&&brand===String(B.a.brand||'').trim().toLowerCase(),cat=String(A.a.category||'').trim().toLowerCase(),sameCat=cat&&cat===String(B.a.category||'').trim().toLowerCase(),sameSize=A.a.size&&String(A.a.size).toLowerCase()===String(B.a.size||'').toLowerCase();
 const exact=A.a.photos?.[0]?.src&&A.a.photos[0].src===B.a.photos?.[0]?.src;const metadata=sameBrand&&sameCat&&sameSize;
 if(exact||visual>=.91||(metadata&&visual>=.73))pairs.push({x:A.a,y:B.a,score:exact?1:visual,mode:exact?'Identisches Foto':visual>=.91?'Sehr ähnliches Foto':'Foto und Produktmerkmale'})
 }
 pairs.sort((a,b)=>b.score-a.score);status.textContent=pairs.length?'Mögliche Duplikate: '+pairs.length+' Paar(e) · Bitte manuell prüfen.':'Keine auffälligen Doppelanlagen gefunden. Vergleich ausschließlich auf diesem Gerät.';
 for(const pair of pairs.slice(0,15)){const r=document.createElement('div');r.className='v6-warning';const b=document.createElement('button');b.type='button';b.className='v6-small-btn';b.textContent=(pair.x.sku||pair.x.brand||'Artikel A')+' ↔ '+(pair.y.sku||pair.y.brand||'Artikel B')+' · '+pair.mode+' · Öffnen';b.onclick=()=>openStockDetail(pair.x.id);r.append(b);root.append(r)}
}
$('v6DuplicateCheck').onclick=()=>v6FindDuplicates().catch(e=>{$('v6DuplicateStatus').textContent='Prüfung fehlgeschlagen: '+e.message});
$('v6Reset').onclick=()=>v6ShowFilter('');
// Replace only the existing save button callback with a guarded price-history wrapper.
const v6OriginalSave=$('saveArticle').onclick;
$('saveArticle').onclick=async()=>{
 try{pull();const previous=(await allArticles()).find(a=>a.id===article.id);// Capture history on article for each changed price.
 if(previous){article.priceHistory=Array.isArray(previous.priceHistory)?[...previous.priceHistory]:[];for(const k of platforms){const val=article.prices?.[k];if(val!==''&&val!=null)v6RecordPrice({prices:previous.prices,priceHistory:article.priceHistory},k,val)}}
 else{article.priceHistory=Array.isArray(article.priceHistory)?article.priceHistory:[];for(const k of platforms){const val=article.prices?.[k];if(val!==''&&val!=null)v6RecordPrice({prices:{},priceHistory:article.priceHistory},k,val)}}
 }catch(e){console.warn('Preisverlauf konnte nicht gelesen werden',e)}
 return v6OriginalSave();
};

// Override only the inventory renderer. All shared app functions remain unchanged.
renderLibrary=async function(){
 const allItems=await allArticles(),items=allItems.filter(a=>!a.archivedAt),search=($('searchArticles').value||'').trim().toLowerCase(),target=$('library');
 $('stockSummary').textContent=`${items.length} Artikel · ${items.filter(a=>stockStatus(a)==='active').length} aktiv · ${items.filter(a=>stockStatus(a)==='sold').length} verkauft`;
 v5Analytics(items);v5Work(items);v6RenderCockpit(items);v6RenderBrands(items);
 const visible=(stockFilter==='archived'?allItems.filter(a=>Boolean(a.archivedAt)):items).filter(a=>{
 const text=[a.sku,a.brand,a.model,a.category,a.size,a.location,a.color,a.listings?.ebay?.title].map(stockText).join(' ').toLowerCase();
 return (!search||text.includes(search))&&(stockFilter==='archived'||stockFilter==='all'||(stockFilter==='remove'?stockRemoveNeeded(a):stockStatus(a)===stockFilter))&&(stockFilter==='archived'||!v5WorkFilter||(v5WorkFilter==='active'?v5Available(a):v5WorkFilter==='incomplete'?v6Missing(a).length>0&&v5Available(a):v5WorkFilter==='stale'?v5Available(a)&&(v5Age(a)??-1)>=30:v5WorkFilter==='price'?v5Available(a)&&v5HasListing(a)&&(v5Age(a)??-1)>=30:v5Task(a,v5WorkFilter)));
 });
 const mode=$('v5Sort').value;
 visible.sort((a,b)=>{
  if(mode==='brand')return String(a.brand||'').localeCompare(String(b.brand||''),'de');
  if(mode==='price')return Math.max(...Object.values(b.prices||{}).map(Number),0)-Math.max(...Object.values(a.prices||{}).map(Number),0);
  if(mode==='days')return (v5Age(b)??-1)-(v5Age(a)??-1);
  const va=v5Date(a)??items.indexOf(a),vb=v5Date(b)??items.indexOf(b);
  return mode==='old'?va-vb:vb-va;
 });
 v5Cache=visible;$('v5Count').textContent=visible.length+' Treffer'+(v5WorkFilter?' · Arbeitsfilter aktiv':'');
 target.replaceChildren();if(!visible.length){const el=document.createElement('div');el.className='stock-empty';el.textContent='Keine passenden Artikel gefunden.';target.append(el);return}
 target.classList.toggle('bx-listview',v5List);
 for(const a of visible){
 const rvSt=a.archivedAt?'archived':stockRemoveNeeded(a)?'remove':bxStatusKey(a);
 const btn=document.createElement('button');btn.type='button';btn.className='bx-card'+(v5Picked.has(a.id)?' v5-picked':'');btn.dataset.status=rvSt;
 btn.onclick=()=>{if(v5Selecting){if(!v5Available(a))return;if(v5Picked.has(a.id))v5Picked.delete(a.id);else v5Picked.add(a.id);v5BulkRefresh();renderLibrary()}else openStockDetail(a.id)};
 const vk=a.sale?Number(a.sale.price||0):bxMaxPrice(a),ek=Number(a.cost||0),age=v5Age(a),missing=v6Missing(a);
 const statusLabel=a.archivedAt?'Archiviert':rvSt==='remove'?'Listing entfernen':a.articleStatus||'Entwurf';
 let delta='',deltaCls='';
 if(a.sale){const p=bxProfit(a);delta=(p>=0?'↗ +':'↘ ')+euro(p)+' Gewinn';deltaCls=p>=0?'':'neg'}
 else if(vk>0){const m=vk-ek;delta=(m>=0?'↗ +':'↘ ')+euro(m)+(ek>0?' · '+Math.round(m/ek*100)+' %':'');deltaCls=m>=0?'':'neg'}
 else{delta='';deltaCls='nil'}
 const name=[a.brand,a.model].filter(Boolean).join(' ')||[a.brand,a.category].filter(Boolean).join(' ')||'Unbenannter Artikel';
 const meta=[a.size&&('Gr. '+a.size),a.condition&&('Zustand '+a.condition+'/10'),a.color].filter(Boolean).join(' · ');
 btn.innerHTML='<span class="bx-img">'+(rvThumb(a)?'<img src="'+bxEsc(rvThumb(a))+'" alt="" loading="lazy" decoding="async">':'<span class="bx-noimg">RV</span>')
  +'<span class="bx-st" data-status="'+rvSt+'"><i></i>'+bxEsc(statusLabel)+'</span>'+(age!==null&&!a.sale?'<span class="bx-age">'+age+' T</span>':'')+'</span>'
  +'<span class="bx-info"><span class="bx-sku">'+bxEsc([a.sku,a.location].filter(Boolean).join(' · ')||'Ohne Nummer')+'</span>'
  +'<span class="bx-name">'+bxEsc(name)+'</span><span class="bx-meta">'+bxEsc(meta)+'</span>'
  +'<span class="bx-price">'+(vk>0?'<b>'+euro(vk)+'</b>':'<b class="nop">Preis festlegen</b>')+'<small>EK '+euro(ek)+'</small></span>'
  +(delta?'<span class="bx-dl '+deltaCls+'">'+bxEsc(delta)+'</span>':'')
  +(missing.length&&v5Available(a)?'<span class="bx-miss v6-badge">'+missing.length+(missing.length===1?' Angabe fehlt':' Angaben fehlen')+'</span>':'')+'</span>';
 btn.querySelector('.bx-img').setAttribute('aria-hidden','true');btn.setAttribute('aria-label',name+', '+statusLabel+(vk>0?', '+euro(vk):''));
 if(v5Selecting&&v5Available(a)){const dot=document.createElement('span');dot.className='v5-selectdot';dot.textContent=v5Picked.has(a.id)?'✓':'+';btn.append(dot)}
 if(v5Selecting&&!v5Available(a))btn.disabled=true;
 target.append(btn);
 }
};
const v5OpenStockOriginal=openStockDetail;
openStockDetail=async function(id){await v5OpenStockOriginal(id);const a=(await allArticles()).find(x=>x.id===id);if(!a)return;
 const photos=$('v5DetailPhotos');photos.replaceChildren();for(const [i,p] of (a.photos||[]).entries()){if(!p.src)continue;const img=document.createElement('img');img.src=p.src;img.alt='Foto '+(i+1);img.loading='lazy';photos.append(img)}if(!photos.children.length)photos.textContent='Keine Fotos hinterlegt.';
 const listings=$('v5DetailListings');listings.replaceChildren();for(const [platform,label] of [['ebay','eBay'],['vinted','Vinted'],['instagram','Instagram']]){
 const l=a.listings?.[platform]||{},r=document.createElement('div');r.className='v5-listing';const heading=document.createElement('b');heading.textContent=label+' · '+(a.prices?.[platform]?euro(a.prices[platform]):'Kein Preis');r.append(heading);
 for(const [key,title] of [['title','Titel'],['description','Beschreibung']]){const wrap=document.createElement('div');wrap.style.marginTop='7px';const t=document.createElement('div');t.className='muted';t.style.fontSize='11px';t.textContent=l[key]?String(l[key]).slice(0,130)+(String(l[key]).length>130?'…':''):'Kein '+title.toLowerCase()+' vorhanden';const b=document.createElement('button');b.type='button';b.textContent=title+' kopieren';b.disabled=!l[key];b.onclick=()=>copy(l[key]);wrap.append(t,b);r.append(wrap)}listings.append(r)
 }
 v6RenderDetail(a);const history=$('v5DetailHistory');history.replaceChildren();const events=[];
 if(a.purchaseDate)events.push(['Einkauf',a.purchaseDate]);if(a.createdAt||a.date)events.push(['Erfasst',a.createdAt||a.date]);if(a.articleStatus)events.push(['Aktueller Status: '+a.articleStatus,'']);if(a.sale?.date)events.push(['Verkauft über '+a.sale.platform,a.sale.date]);if(a.shippedAt)events.push(['Versand bestätigt',a.shippedAt]);
 if(!events.length)events.push(['Noch keine Datumsangaben hinterlegt','']);for(const [label,date] of events){const x=document.createElement('div');let display=date;try{if(date)display=new Date(date).toLocaleDateString('de-DE')}catch{}x.textContent=label+(display?' · '+display:'');history.append(x)};
 // Sale follow-up: record dispatch for workflow. Only visible after a recorded sale.
 let ship=$('v5Shipped');if(!ship){ship=document.createElement('button');ship.id='v5Shipped';ship.type='button';ship.className='btn secondary wide';$('stockSoldPanel').append(ship)}
 ship.classList.toggle('hidden',!a.sale);ship.textContent=a.shippedAt?'✓ Versand bestätigt':'📦 Versand als erledigt markieren';
 ship.onclick=async()=>{if(a.shippedAt)return;const fresh=(await allArticles()).find(x=>x.id===id);if(!fresh||!fresh.sale)return;fresh.shippedAt=new Date().toISOString();await store('readwrite',s=>s.put(fresh));await renderLibrary();await openStockDetail(id)};
};


// V6.1 — Safe inventory removal. Sold transactions are retained in the archive.
const v61OpenDetailOriginal=openStockDetail;
openStockDetail=async function(id){
 await v61OpenDetailOriginal(id);
 const a=(await allArticles()).find(x=>x.id===id);if(!a)return;
 const archived=Boolean(a.archivedAt),sold=a.articleStatus==='Verkauft'||Boolean(a.sale);
 $('v61Delete').textContent=archived?'Artikel aus Archiv wiederherstellen':sold?'Artikel aus Bestand archivieren':'Artikel endgültig löschen';
 $('v61Delete').classList.toggle('v61-danger',!archived);
 $('v61DeleteHint').textContent=archived?'Der Artikel und seine Historie bleiben gespeichert. Du kannst ihn wieder in den Bestand holen.':sold?'Verkaufte Artikel bleiben wegen Verkaufsnachweis und Finanzen gespeichert; sie werden nur aus dem aktiven Bestand ausgeblendet.':'Dies entfernt den Artikel einschließlich gespeicherter Fotos dauerhaft von diesem Gerät. Bitte vorher ein Backup erstellen.';
 $('v61DeleteStatus').textContent='';
 $('v61Delete').disabled=false;
};
$('v61Delete').onclick=async function(){
 const id=stockSelectedId;if(!id)return;
 const btn=this;btn.disabled=true;
 try{
  const a=(await allArticles()).find(x=>x.id===id);if(!a){closeStockDetail();return}
  const title=[a.sku,a.brand,a.category].filter(Boolean).join(' · ')||'Artikel';
  if(a.archivedAt){
   if(!confirm('Artikel „'+title+'“ aus dem Archiv wiederherstellen?'))return;
   delete a.archivedAt;
   await store('readwrite',s=>s.put(a));
   closeStockDetail();stockFilter='all';v5WorkFilter='';
  }else if(a.articleStatus==='Verkauft'||a.sale){
   if(!confirm('Verkauften Artikel „'+title+'“ archivieren?\n\nEr wird aus dem Bestand ausgeblendet, aber die Verkaufsdaten bleiben für Finanzen und Nachweise erhalten.'))return;
   a.archivedAt=new Date().toISOString();
   await store('readwrite',s=>s.put(a));
   closeStockDetail();
  }else{
   const answer=prompt('Artikel „'+title+'“ mit ALLEN Fotos endgültig löschen?\n\nDies kann ohne Backup nicht rückgängig gemacht werden.\n\nTippe LÖSCHEN zur Bestätigung:','');
   if(answer!=='LÖSCHEN')return;
   await store('readwrite',s=>s.delete(a.id));
   v5Picked.delete(a.id);v5BulkRefresh();
   closeStockDetail();
  }
  // Update every inventory surface, including analytics and home counts.
  const chip=$('stockFilters').querySelector('[data-stock-filter="'+stockFilter+'"]');
  $('stockFilters').querySelectorAll('[data-stock-filter]').forEach(c=>c.classList.toggle('selected',c===chip));
  await renderLibrary();await renderHome();
 }catch(err){console.error('Artikel entfernen:',err);$('v61DeleteStatus').textContent='Aktion fehlgeschlagen: '+(err.message||String(err))}
 finally{btn.disabled=false}
};


// V7 inventory extensions. No photo-upload / editor / AI handlers modified.
const v7BatchKey='rv_v7_purchase_batches';
const v7BackupDB='RVStudioBackupDB';
function v7Batches(){try{const x=JSON.parse(localStorage.getItem(v7BatchKey)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
function v7SetBatches(b){localStorage.setItem(v7BatchKey,JSON.stringify(b))}
function v7Date(x){const t=Date.parse(x||'');return Number.isFinite(t)?new Date(t).toLocaleDateString('de-DE'):'—'}
function v7SafeUrl(u){try{const x=new URL(u);return ['https:','http:'].includes(x.protocol)?x.href:''}catch{return ''}}
function v7El(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function v7PlatformRows(a){const root=$('v7PlatformRows');root.replaceChildren();for(const [id,name] of [['ebay','eBay'],['vinted','Vinted'],['instagram','Instagram']]){
 const data=a.publishInfo?.[id]||{},wrap=v7El('div',undefined,'v7-box'),title=v7El('strong',name),select=v7El('select'),link=v7El('input'),date=v7El('input');select.id='v7PubStatus_'+id;link.id='v7PubLink_'+id;date.id='v7PubDate_'+id;
 for(const [v,t] of [['not_listed','Nicht eingestellt'],['listed','Online'],['paused','Pausiert'],['removed','Entfernt']]){const opt=v7El('option',t);opt.value=v;select.append(opt)}select.value=data.status||'not_listed';link.placeholder='https://… Listing-Link';link.value=data.url||'';date.type='date';date.value=(data.date||'').slice(0,10);
 for(const [label,control] of [['Status',select],['Listing-Link',link],['Eingestellt am',date]]){const box=v7El('div');box.append(v7El('label',label,'v7-mini'),control);box.style.marginTop='8px';wrap.append(box)}wrap.prepend(title);
 const safe=v7SafeUrl(data.url||'');if(safe){const anchor=v7El('a','Listing öffnen ↗','v7-mini');anchor.href=safe;anchor.target='_blank';anchor.rel='noopener noreferrer';wrap.append(anchor)}root.append(wrap)
 }}
function v7RenderBatchSelect(a){const s=$('v7BatchSelect');s.replaceChildren();const zero=v7El('option','Keine Einkaufscharge');zero.value='';s.append(zero);for(const b of v7Batches()){const o=v7El('option',(b.date||'')+' · '+b.name+' · '+euro(b.total));o.value=b.id;s.append(o)}s.value=a.batchId||''}
async function v7OpenExtras(id){const a=(await allArticles()).find(x=>x.id===id);if(!a)return;v7PlatformRows(a);v7RenderBatchSelect(a);$('v7PlatformMessage').textContent='';$('v7BatchMessage').textContent=''}
const v7PreviousOpen=openStockDetail;
openStockDetail=async function(id){await v7PreviousOpen(id);await v7OpenExtras(id)};
$('v7SavePlatforms').onclick=async()=>{const a=(await allArticles()).find(x=>x.id===stockSelectedId);if(!a)return;a.publishInfo={...(a.publishInfo||{})};for(const p of ['ebay','vinted','instagram']){
 const status=$('v7PubStatus_'+p).value,url=$('v7PubLink_'+p).value.trim(),date=$('v7PubDate_'+p).value;
 if(url&&!v7SafeUrl(url)){$('v7PlatformMessage').textContent='Ungültiger Link für '+p;return}
 a.publishInfo[p]={status,url,date:date||null,updatedAt:new Date().toISOString()};
 }await store('readwrite',s=>s.put(a));$('v7PlatformMessage').textContent='✓ Plattform-Status gespeichert';await renderLibrary()};
$('v7BatchAssign').onclick=async()=>{const a=(await allArticles()).find(x=>x.id===stockSelectedId);if(!a)return;a.batchId=$('v7BatchSelect').value||'';await store('readwrite',s=>s.put(a));$('v7BatchMessage').textContent='✓ Zuordnung gespeichert';await renderLibrary()};
function v7PurchaseUI(){const root=$('v7Purchases');root.replaceChildren();root.append(v7El('h3','EINKAUFSCHARGEN'),v7El('p','Gemeinsame Einkäufe dokumentieren. Die Summe der Artikel-EKs sollte zum tatsächlich bezahlten Einkauf passen. Keine steuerlich geprüfte Buchhaltung.','v7-help'));
 const form=v7El('form');form.id='v7BatchForm';const grid=v7El('div',undefined,'v7-grid');
 const inputs=[['name','Bezeichnung / Quelle','text'],['date','Einkaufsdatum','date'],['total','Gesamtbetrag €','number'],['proof','Belegreferenz / Notiz','text']];for(const [key,label,type] of inputs){const wrap=v7El('div'),l=v7El('label',label,'v7-mini'),i=v7El('input');i.name=key;i.type=type;i.required=key!=='proof';if(key==='date')i.value=new Date().toISOString().slice(0,10);if(key==='total'){i.min='0';i.step='0.01'}wrap.append(l,i);grid.append(wrap)}form.append(grid);const b=v7El('button','+ Einkaufscharge anlegen','v7-cta');b.type='submit';form.append(b);root.append(form);
 form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form),total=Number(f.get('total'));if(!Number.isFinite(total)||total<0)return;const rows=v7Batches();rows.push({id:'batch_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),name:String(f.get('name')).trim(),date:String(f.get('date')),total,proof:String(f.get('proof')||''),createdAt:new Date().toISOString()});v7SetBatches(rows);v7PurchaseUI()};
 const batches=v7Batches();const all=v7CachedItems||[];for(const b of batches.slice().reverse()){
 const linked=all.filter(x=>x.batchId===b.id);const sum=linked.reduce((n,x)=>n+Number(x.cost||0),0);const row=v7El('div',undefined,'v7-entry');row.append(v7El('strong',b.name+' · '+v7Date(b.date)),v7El('div','Gesamt: '+euro(b.total)+' · Zugeordnet: '+euro(sum)+' · '+linked.length+' Artikel','v7-mini'),v7El('div','Differenz: '+euro(b.total-sum)+' · '+(b.proof||'Ohne Belegreferenz'),'v7-mini'));
 const del=v7El('button','Charge entfernen');del.type='button';del.onclick=async()=>{if(linked.length){alert('Bitte zuerst alle Artikel von dieser Charge lösen.');return}if(confirm('Einkaufscharge entfernen?')){v7SetBatches(v7Batches().filter(x=>x.id!==b.id));v7PurchaseUI()}};row.append(del);root.append(row)
 }if(!batches.length)root.append(v7El('p','Noch keine Einkaufschargen angelegt.','v7-help'))
}
let v7CachedItems=[];
function v7TaskUI(){const root=$('v7Tasks');root.replaceChildren();root.append(v7El('h3','WIEDERVORLAGEN'),v7El('p','Aus deinem Bestand abgeleitete Aufgaben. Preis-Checks ab 30 Tagen, offene Listings nach Verkauf und Versand.','v7-help'));
 const rows=[['30+ Tage online / im Bestand',v7CachedItems.filter(a=>v5Available(a)&&(v5Age(a)??-1)>=30),'price'],['Fehlende Artikelangaben',v7CachedItems.filter(a=>v5Available(a)&&v6Missing(a).length),'incomplete'],['Verkauft, noch nicht versendet',v7CachedItems.filter(a=>a.sale&&!a.shippedAt),'sale'],['Listings noch entfernen',v7CachedItems.filter(a=>stockRemoveNeeded(a)),'remove']];
 for(const [name,items,filter] of rows){const line=v7El('button',name+' · '+items.length);line.className='v7-entry';line.style.width='100%';line.style.textAlign='left';line.onclick=()=>{v5SetTab('all');v6ShowFilter(filter==='sale'?'sale':filter);};root.append(line)}
}
// Expand tab behavior without altering existing V5 tab logic.
const v7SetTabPrevious=v5SetTab;
v5SetTab=function(tab){if(tab==='purchases'||tab==='tasks'){
 v5Tab=tab;v5WorkFilter='';$('v5Tabs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v5Tab===tab));
 for(const id of ['v5Work','v5InventoryArea','v5Analysis','v6Brands','v7Purchases','v7Tasks'])$(id).classList.add('v5-hidden');
 $(tab==='purchases'?'v7Purchases':'v7Tasks').classList.remove('v5-hidden');
 (tab==='purchases'?v7PurchaseUI:v7TaskUI)();return;
 }$('v7Purchases').classList.add('v5-hidden');$('v7Tasks').classList.add('v5-hidden');v7SetTabPrevious(tab);
};
$('v5Tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>v5SetTab(b.dataset.v5Tab));
const v7PrevRenderLibrary=renderLibrary;
renderLibrary=async function(){await v7PrevRenderLibrary();v7CachedItems=(await allArticles()).filter(a=>!a.archivedAt);if(v5Tab==='purchases')v7PurchaseUI();if(v5Tab==='tasks')v7TaskUI();};

// Purchase intelligence: observed sell-through, average realized profit and typical holding time.
const v7PreviousBrands=v6RenderBrands;
v6RenderBrands=function(items){v7PreviousBrands(items);const root=$('v6Brands'),sold=items.filter(a=>a.sale),groups=new Map();
 for(const a of items){const name=String(a.brand||'Ohne Marke').trim()||'Ohne Marke',key=name.toLowerCase();if(!groups.has(key))groups.set(key,{name,total:0,sold:0,profit:0,days:[]});const g=groups.get(key);g.total++;
 if(a.sale){g.sold++;g.profit+=Number(a.sale.price||0)-Number(a.cost||0)-Number(a.sale.fees||0)-Number(a.sale.shipping||0);const start=v5Date(a),end=Date.parse(a.sale.date||'');if(start!==null&&Number.isFinite(end)&&end>=start)g.days.push(Math.round((end-start)/86400000))}}
 const h=v7El('h3','EINKAUFSANALYSE');h.style.marginTop='25px';root.append(h);
 root.append(v7El('p','Entscheidungshilfe aus tatsächlich erfassten Verkäufen. Kleine Stichproben und noch unverkaufte Artikel können die Werte stark verzerren.','v7-help'));
 const arr=[...groups.values()].filter(g=>g.sold>0).sort((a,b)=>b.profit/b.sold-a.profit/a.sold);
 for(const g of arr){const div=v7El('div',undefined,'v7-entry');div.append(v7El('strong',g.name),v7El('div','Verkäufe: '+g.sold+' von '+g.total+' Artikeln · Ø Artikelgewinn: '+euro(g.profit/g.sold)+' · Ø erfasste Verkaufsdauer: '+(g.days.length?Math.round(g.days.reduce((n,d)=>n+d,0)/g.days.length)+' Tage':'—'),'v7-mini'));root.append(div)}
 if(!arr.length)root.append(v7El('p','Noch keine Verkäufe für eine aussagekräftige Einkaufsanalyse.','v7-help'));
};
// Automatic local snapshot (one rolling copy, at most once per 24h).
function v7OpenBackupDB(){return new Promise((ok,no)=>{const r=indexedDB.open(v7BackupDB,1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots',{keyPath:'key'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function v7SnapGet(key){const d=await v7OpenBackupDB();return new Promise((ok,no)=>{const t=d.transaction('snapshots','readonly'),r=t.objectStore('snapshots').get(key);r.onsuccess=()=>{d.close();ok(r.result)};r.onerror=()=>{d.close();no(r.error)}})}
async function v7SnapPut(value){const d=await v7OpenBackupDB();return new Promise((ok,no)=>{const t=d.transaction('snapshots','readwrite');t.objectStore('snapshots').put(value);t.oncomplete=()=>{d.close();ok()};t.onerror=()=>{d.close();no(t.error)}})}
async function v7BackupStatus(){try{const x=await v7SnapGet('latest');$('v7BackupState').textContent=x?'Letzte lokale Sicherung: '+new Date(x.date).toLocaleString('de-DE')+' · '+x.articles.length+' Artikel':'Noch keine lokale Sicherung vorhanden.'}catch(e){$('v7BackupState').textContent='Lokale Sicherung in diesem Browser nicht verfügbar.'}}
async function v7MakeBackup(force=false){const prev=await v7SnapGet('latest');if(!force&&prev&&Date.now()-Date.parse(prev.date)<86400000)return false;const arr=await allArticles();const obj={key:'latest',date:new Date().toISOString(),articles:arr,batches:v7Batches()};await v7SnapPut(obj);return true}
$('v7BackupNow').onclick=async()=>{try{await v7MakeBackup(true);await v7BackupStatus();alert('Lokale Sicherung erstellt. Für echte Sicherheit auch JSON exportieren.')}catch(e){alert('Sicherung fehlgeschlagen: '+e.message)}};
$('v7RestoreLocal').onclick=async()=>{try{const data=await v7SnapGet('latest');if(!data){alert('Noch keine lokale Kopie vorhanden.');return}if(!confirm('Lokale Kopie vom '+new Date(data.date).toLocaleString('de-DE')+' wiederherstellen? Vorhandene Artikel mit derselben ID werden überschrieben.'))return;for(const a of data.articles)await store('readwrite',s=>s.put(a));v7SetBatches(data.batches||[]);await renderLibrary();alert('Lokale Kopie eingespielt.')}catch(e){alert('Wiederherstellung fehlgeschlagen: '+e.message)}};
// Extend normal JSON backup to include purchase batches, and extend import to restore them.
$('backup').onclick=async()=>{const all=await allArticles();download(new Blob([JSON.stringify({version:7,exportedAt:new Date().toISOString(),articles:all,batches:v7Batches()})],{type:'application/json'}),'rv-studio-backup-'+new Date().toISOString().slice(0,10)+'.json')};
$('restore').onchange=async e=>{try{const f=e.target.files?.[0];if(!f)return;const data=JSON.parse(await f.text());if(!Array.isArray(data.articles)||data.articles.some(a=>!a||typeof a.id!=='string'))throw Error('Ungültiges Artikel-Backup');if(!confirm(data.articles.length+' Artikel aus Backup importieren? Vorhandene IDs werden überschrieben.'))return;for(const a of data.articles)await store('readwrite',s=>s.put(a));if(Array.isArray(data.batches))v7SetBatches(data.batches);await renderLibrary();alert('Backup importiert')}catch(err){alert('Import fehlgeschlagen: '+err.message)}finally{e.target.value=''}};
// Automatic once-a-day local snapshot after DB initialization. Fail safely without stopping app startup.
window.addEventListener('load',()=>{setTimeout(async()=>{try{if(db)await v7MakeBackup(false)}catch(e){console.warn('RV Backup:',e)}await v7BackupStatus()},1600)});


// RV Studio V8.1 – explicit conflict resolution, guarded revision sync.
let rvApplyingRemote=false,rvCloudPassword='',rvSyncBusy=false,rvSyncTimer=0;
const rvSyncQueueKey='rvstudio-v8-queue',rvSyncRevsKey='rvstudio-v8-revs',rvConflictKey='rvstudio-v81-conflicts';
function rvReadJSON(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return {}}}
function rvPersist(key,value){localStorage.setItem(key,JSON.stringify(value))}
function rvQueue(id,type){const q=rvReadJSON(rvSyncQueueKey);q[id]=type;rvPersist(rvSyncQueueKey,q)}
function rvScheduleSync(){if(!rvCloudPassword)return;clearTimeout(rvSyncTimer);rvSyncTimer=setTimeout(()=>rvSync().catch(console.warn),3000)}
function rvStatus(msg,bad=false){const el=$('rvCloudStatus');if(el){el.textContent=msg;el.classList.toggle('rvcloud-error',bad);el.classList.toggle('rvcloud-ok',!bad)}}
async function rvAPI(path,opts={}){
 if(!rvCloudPassword)throw Error('Bitte Cloud-Kennwort eingeben.');
 const headers=new Headers(opts.headers||{});headers.set('X-RV-Password',rvCloudPassword);
 const response=await fetch('/api/'+path,{...opts,headers,cache:'no-store'});
 if(!response.ok){let msg;try{msg=(await response.json()).error}catch{};const e=Error(msg||('HTTP '+response.status));e.status=response.status;throw e}
 const ct=response.headers.get('content-type')||'';
 return ct.includes('application/json')?response.json():response.blob();
}
async function rvDigest(data){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function rvUploadPhoto(id,src){
 if(typeof src!=='string'||!src.startsWith('data:image/'))return src;
 const comma=src.indexOf(',');if(comma<0)throw Error('Ungültiges Foto');
 const contentType=src.slice(5,src.indexOf(';'));if(!['image/jpeg','image/png','image/webp'].includes(contentType))throw Error('Nicht unterstütztes Cloud-Fotoformat: '+contentType);
 const bytes=Uint8Array.from(atob(src.slice(comma+1)),c=>c.charCodeAt(0));
 const hash=await rvDigest(src.slice(comma+1));
 const result=await rvAPI('photo/'+encodeURIComponent(id)+'/'+hash,{method:'PUT',headers:{'Content-Type':contentType},body:bytes});return 'r2:'+result.key;
}
async function rvHydratePhoto(p){if(!p?.src?.startsWith('r2:'))return p;
 const photo=await rvAPI('photo/'+encodeURIComponent(p.src.slice(3)));const data=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(photo)});
 return {...p,src:data};
}
async function rvUploadRecord(a){const clone=structuredClone(rvSplitCover(a));clone.photos=await Promise.all((clone.photos||[]).map(async p=>({...p,src:await rvUploadPhoto(clone.id,p.src)})));
 // RVO-Titelbild und Freistellung liegen getrennt von den Fotos und werden ebenfalls nach R2 ausgelagert.
 if(clone.rvCover&&clone.rvCover.src)clone.rvCover={...clone.rvCover,src:await rvUploadPhoto(clone.id,clone.rvCover.src)};
 if(clone.rvCutout&&clone.rvCutout.src)clone.rvCutout={...clone.rvCutout,src:await rvUploadPhoto(clone.id,await rvFitCutout(clone.rvCutout.src))};
 return clone}
async function rvHydrateRecord(a){a=rvSplitCover(a);a.photos=await Promise.all((a.photos||[]).map(rvHydratePhoto));if(a.rvCover)a.rvCover=await rvHydratePhoto(a.rvCover);if(a.rvCutout)a.rvCutout=await rvHydratePhoto(a.rvCutout);return a}
// Große Freistellungen (> 7,5 MB) für die Cloud als WebP mit Transparenz speichern (R2-Limit 8 MB).
async function rvFitCutout(src){if(typeof src!=='string'||!src.startsWith('data:')||src.length*0.75<7_500_000)return src;const im=await imageFrom(src),c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c.toDataURL('image/webp',0.95)}
// Alte Versionen speicherten das Titelbild als erstes Foto (cover:true). Getrennt halten: Fotos bleiben Fotos.
function rvSplitCover(a){if(!a||!Array.isArray(a.photos)||!a.photos.some(p=>p&&p.cover))return a;const c=a.photos.find(p=>p&&p.cover);
 a.rvCover=a.rvCover&&a.rvCover.src?a.rvCover:{src:c.src,engine:(a.coverSettings&&a.coverSettings.engine)||'',style:(a.coverSettings&&a.coverSettings.style)||'',bg:(a.coverSettings&&a.coverSettings.bg)||'',at:(a.coverSettings&&a.coverSettings.at)||'',migrated:true};
 a.photos=a.photos.filter(p=>!(p&&p.cover));return a}
// Bild für Listen: internes RVO-Titelbild, sonst erstes Originalfoto.
function rvThumb(a){return (a&&a.rvCover&&a.rvCover.src)||(a&&a.photos&&(a.photos.find(p=>p&&p.cover)||a.photos[0])||{}).src||''}
function rvCaptureConflict(id,reason='Artikel wurde auf einem anderen Gerät geändert.'){
 const m=rvReadJSON(rvConflictKey);m[id]={reason,date:new Date().toISOString()};rvPersist(rvConflictKey,m);rvRenderConflicts();
}
function rvClearConflict(id){const m=rvReadJSON(rvConflictKey);delete m[id];rvPersist(rvConflictKey,m);rvRenderConflicts()}
function rvCell(tag,str){const el=document.createElement(tag);el.textContent=String(str??'—');return el}
function rvDescribe(a,k){if(!a)return '—';const v=a[k];if(k==='photos')return (v||[]).length+' Foto(s)';if(k==='sale')return v?'Verkauf '+(v.price??'?')+' € / '+(v.platform||''):'Nicht verkauft';if(k==='prices')return ['ebay','vinted','instagram'].map(p=>p+': '+(v?.[p]??'—')).join(' · ');if(k==='listings')return ['ebay','vinted','instagram'].map(p=>p+': '+(v?.[p]?.title||'—')).join(' · ');return v==null||v===''?'—':typeof v==='object'?JSON.stringify(v):String(v)}
async function rvRenderConflicts(){
 const box=$('rvConflictSection'),list=$('rvConflictList');if(!box||!list)return;
 const all=rvReadJSON(rvConflictKey),entries=Object.entries(all);box.hidden=!entries.length;$('rvConflictCount').textContent='('+entries.length+')';list.replaceChildren();
 for(const [id,meta] of entries){
  const root=document.createElement('article');root.className='rvconflict';root.append(rvCell('h4','Artikel '+id));
  const msg=rvCell('p',meta.reason||'Versionskonflikt');msg.className='rvcon-notice';root.append(msg);
  const view=document.createElement('div'),actions=document.createElement('div');actions.className='rvconflict-actions';
  const check=document.createElement('button');check.type='button';check.textContent='Versionen vergleichen';
  check.onclick=async()=>{
   view.replaceChildren(rvCell('p','Lade Versionen …'));
   try{
    const local=(await allArticles()).find(x=>x.id===id)||null,cloud=await rvAPI('articles/'+encodeURIComponent(id));
    view.replaceChildren();const tab=document.createElement('table');const head=document.createElement('tr');for(const name of ['Feld','Dieses Gerät','Cloud'])head.append(rvCell('th',name));tab.append(head);
    for(const [key,label] of [['sku','Artikelnummer'],['location','Lagerplatz'],['articleStatus','Status'],['brand','Marke'],['category','Artikeltyp'],['size','Größe'],['cost','EK'],['prices','Preise'],['sale','Verkauf'],['photos','Fotos'],['listings','Listings'],['notes','Mängel']]){
     const l=rvDescribe(local,key),r=rvDescribe(cloud.article,key);if(l===r)continue;const tr=document.createElement('tr');tr.append(rvCell('td',label),rvCell('td',l),rvCell('td',r));tab.append(tr)
    }
    if(tab.children.length===1)view.append(rvCell('p','In den wichtigsten Feldern keine Unterschiede. Weitere technische Felder können abweichen.'));
    else view.append(tab);
    const note=rvCell('p','Cloud-Version '+cloud.revision+' · Noch nichts überschrieben.');note.className='rvcon-notice';view.append(note);
   }catch(e){view.replaceChildren(rvCell('p','Vergleich fehlgeschlagen: '+e.message))}
  };
  const useCloud=document.createElement('button');useCloud.type='button';useCloud.textContent='Cloud übernehmen';
  useCloud.onclick=async()=>rvResolveConflict(id,'cloud');
  const useLocal=document.createElement('button');useLocal.type='button';useLocal.textContent='Dieses Gerät übernehmen';
  useLocal.onclick=async()=>rvResolveConflict(id,'local');
  actions.append(check,useCloud,useLocal);root.append(view,actions);list.append(root);
 }
}
async function rvResolveConflict(id,choice){
 if(rvSyncBusy){rvStatus('Warte, bis die aktuelle Synchronisation abgeschlossen ist.',true);return}
 const local=(await allArticles()).find(a=>a.id===id);
 if(!confirm('Vorher JSON-Backups von Mac UND Handy erstellt? Die verworfene Version kann sonst verloren gehen. Fortfahren?'))return;
 rvSyncBusy=true;
 try{
  // Always refetch the current server revision; only a deliberate choice can supersede it.
  const remote=await rvAPI('articles/'+encodeURIComponent(id));
  const revs=rvReadJSON(rvSyncRevsKey),q=rvReadJSON(rvSyncQueueKey);
  if(choice==='cloud'){
   const a=await rvHydrateRecord(remote.article);
   rvApplyingRemote=true;try{await store('readwrite',s=>s.put(a))}finally{rvApplyingRemote=false}
   revs[id]=remote.revision;delete q[id];rvPersist(rvSyncQueueKey,q);rvPersist(rvSyncRevsKey,revs);
  }else{
   if(!local)throw Error('Lokaler Artikel fehlt. Bitte zuerst das Backup prüfen.');
   const article=await rvUploadRecord(local);
   const result=await rvAPI('articles/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({article,revision:remote.revision})});
   revs[id]=result.revision;delete q[id];rvPersist(rvSyncQueueKey,q);rvPersist(rvSyncRevsKey,revs);
  }
  rvClearConflict(id);await renderHome();if(!$('s4').classList.contains('hidden'))await renderLibrary();
  rvStatus('✓ Konflikt für '+(local?.sku||id)+' gelöst. Auf dem anderen Gerät ebenfalls synchronisieren.');
 }catch(e){rvCaptureConflict(id,e.message);rvStatus('Konflikt noch offen: '+e.message,true)}finally{rvSyncBusy=false}
}
async function rvSync(){
 if(rvSyncBusy||!rvCloudPassword||!navigator.onLine)return;
 rvSyncBusy=true;rvStatus('Synchronisiere …');
 try{
  await rvAPI('ping');let q=rvReadJSON(rvSyncQueueKey),revs=rvReadJSON(rvSyncRevsKey);const server=await rvAPI('articles');
  const serverMap=new Map(server.items.map(x=>[x.id,x]));const local=await allArticles(),localMap=new Map(local.map(x=>[x.id,x]));
  let pushed=0,pulled=0;const errors=[];
  // Do not automatically upload unresolved conflicts, even on subsequent sync attempts.
  for(const [id,type] of Object.entries(q)){
   if(rvReadJSON(rvConflictKey)[id])continue;
   let uploadModified;
   try{
    if(type==='delete'){
      await rvAPI('articles/'+encodeURIComponent(id),{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:revs[id]||0})});
      delete revs[id];serverMap.delete(id);
    }else{
      const a=localMap.get(id);if(!a){delete q[id];continue}
      uploadModified=a.rvSyncModifiedAt;
      const cloud=await rvUploadRecord(a);
      const result=await rvAPI('articles/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({article:cloud,revision:revs[id]||0})});
      revs[id]=result.revision;serverMap.set(id,{id,revision:result.revision});
    }
    // Do not discard an edit queued while a request was in flight.
    const currentQueue=rvReadJSON(rvSyncQueueKey);
    const now=(await allArticles()).find(x=>x.id===id);
    const changedDuringUpload=type!=='delete'&&now?.rvSyncModifiedAt!==uploadModified;
    if(currentQueue[id]===type&&!changedDuringUpload)delete currentQueue[id];
    rvPersist(rvSyncQueueKey,currentQueue);q=currentQueue;pushed++;
   }catch(e){if(e.status===409){rvCaptureConflict(id,e.message)}errors.push((localMap.get(id)?.sku||id)+': '+e.message)}
   rvPersist(rvSyncRevsKey,revs);
  }
  const latest=await rvAPI('articles');
  for(const item of latest.items){
   const liveQ=rvReadJSON(rvSyncQueueKey);if(liveQ[item.id]||rvReadJSON(rvConflictKey)[item.id])continue;
   const localItem=localMap.get(item.id),knownRev=revs[item.id]||0;
   if(localItem&&!knownRev){rvCaptureConflict(item.id,'Artikel existiert auf diesem Gerät und in der Cloud, ohne gemeinsamen Versionsstand.');errors.push('Konflikt '+(localItem.sku||item.id));continue}
   if(localItem&&knownRev===item.revision)continue;
   try{
    const result=await rvAPI('articles/'+encodeURIComponent(item.id));
    // Check once more: may have been edited while photo fetch was in flight.
    const a=await rvHydrateRecord(result.article);
    if(rvReadJSON(rvSyncQueueKey)[item.id])continue;
    rvApplyingRemote=true;try{await store('readwrite',s=>s.put(a))}finally{rvApplyingRemote=false}
    revs[item.id]=result.revision;pulled++;
   }catch(e){errors.push('Download '+item.id+': '+e.message)}
  }
  const remoteIds=new Set(latest.items.map(x=>x.id));
  for(const [id] of Object.entries(revs)){
   if(!remoteIds.has(id)&&!rvReadJSON(rvSyncQueueKey)[id]&&!rvReadJSON(rvConflictKey)[id]){
     rvApplyingRemote=true;try{await store('readwrite',s=>s.delete(id))}finally{rvApplyingRemote=false}
     delete revs[id];pulled++;
   }
  }
  for(const a of local){if(revs[a.id]||rvReadJSON(rvSyncQueueKey)[a.id]||rvReadJSON(rvConflictKey)[a.id]||remoteIds.has(a.id))continue;
   try{const data=await rvUploadRecord(a);const result=await rvAPI('articles/'+encodeURIComponent(a.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({article:data,revision:0})});revs[a.id]=result.revision;pushed++}
   catch(e){if(e.status===409)rvCaptureConflict(a.id,e.message);errors.push('Erstimport '+(a.sku||a.id)+': '+e.message)}
  }
  rvPersist(rvSyncRevsKey,revs);
  try{
   const meta=await rvAPI('meta');const localBatchVersion=Number(localStorage.getItem('rv-v8-batch-rev')||0);
   if(localStorage.getItem('rv-v8-batch-dirty')==='1'||(!meta.value&&v7Batches().length&&localBatchVersion===0)){
     const updated=await rvAPI('meta',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({value:v7Batches(),revision:localBatchVersion})});
     localStorage.setItem('rv-v8-batch-rev',String(updated.revision));localStorage.removeItem('rv-v8-batch-dirty');
   }else if(meta.revision>localBatchVersion){rvApplyingRemote=true;try{v7SetBatches(meta.value||[])}finally{rvApplyingRemote=false};localStorage.setItem('rv-v8-batch-rev',String(meta.revision))}
  }catch(e){errors.push('Einkaufschargen: '+e.message)}
  await renderHome();if(!$('s4').classList.contains('hidden'))await renderLibrary();rvRenderConflicts();
  const unresolved=Object.keys(rvReadJSON(rvConflictKey)).length;
  rvStatus(unresolved||errors.length?'⚠️ '+unresolved+' ungelöste Artikelkonflikte · '+errors.slice(0,1).join(' '):'✓ Synchronisiert: '+pushed+' hochgeladen, '+pulled+' geladen · '+new Date().toLocaleTimeString('de-DE'),Boolean(unresolved||errors.length));
 }catch(e){rvStatus('Synchronisation fehlgeschlagen: '+e.message,true)}finally{rvSyncBusy=false}
}
$('rvCloudConnect').onclick=async()=>{
 const password=$('rvCloudPassword').value.trim();if(password.length<16){rvStatus('Mindestens 16 Zeichen für dein Sync-Kennwort.',true);return}
 rvCloudPassword=password;$('rvCloudPassword').value='';
 try{await rvAPI('ping');sessionStorage.setItem('rv-cloud-session-password',password);rvStatus('Verbunden. Synchronisierung startet …');await rvSync()}
 catch(e){rvCloudPassword='';rvStatus('Keine Verbindung: '+e.message,true)}
};
$('rvCloudSync').onclick=()=>rvSync();
$('rvCloudDisconnect').onclick=()=>{rvCloudPassword='';sessionStorage.removeItem('rv-cloud-session-password');rvStatus('Getrennt. Änderungen bleiben lokal bis zur nächsten Verbindung.')};
const rvOldSetBatches=v7SetBatches;
v7SetBatches=function(b){rvOldSetBatches(b);if(!rvApplyingRemote){localStorage.setItem('rv-v8-batch-dirty','1');rvScheduleSync()}};
window.addEventListener('online',()=>rvScheduleSync());
window.addEventListener('load',()=>{rvRenderConflicts();if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(console.warn);
 const session=sessionStorage.getItem('rv-cloud-session-password');if(session){rvCloudPassword=session;setTimeout(()=>rvSync(),1600)}
 setInterval(()=>rvSync().catch(console.warn),30000);
});

(async()=>{const extra=$('settingsExtras');if(extra&&$('v7BackupPanel'))extra.append($('v7BackupPanel'));try{db=await dbOpen()}catch(e){alert('Lokaler Speicher ist in diesem Browser nicht verfügbar: '+e.message)}article=blank();$('template').value=localStorage.getItem('fsflow_template')||'RV STIL: Erstelle einen präzisen, suchoptimierten Titel mit Marke, Kleidungsart, Größe, Farben und belegten Besonderheiten. Beschreibung mit genau diesen Überschriften: 🥇 DAS STÜCK, 📐 MAẞE & PASSFORM, 👀 ZUSTAND, ⚠️ MÄNGEL, 👕 STYLING, 📦 VERSAND & ANGEBOTE, 🏷️ ARTIKELNUMMER. Beschreibe das konkrete Stück lebendig, aber sachlich. Brustweite und Länge nur aus meinen Eingaben. Keine unbelegten Material-, Alters-, Herkunfts- oder Zustandsbehauptungen. Bei nicht sichtbaren Mängeln vorsichtig formulieren. Abschlusstext: Schneller, sorgfältig verpackter Versand. Faire Preisvorschläge sind willkommen. Bei Fragen zur Passform schreib mir einfach.';push();showHome()})();
// ===================== Studio V22: Titelbild-Automatik, Texte, Preise, Veröffentlichen =====================
const SX_PLATFORMS=[['ebay','eBay','eB','https://www.ebay.de/sl/sell'],['vinted','Vinted','V','https://www.vinted.de/items/new'],['instagram','Instagram','IG','https://www.instagram.com/']];
const SX_TITLE_MAX={ebay:80};
const SX_FEES_DEFAULT={ebay:{pct:0,fix:0,buf:10},vinted:{pct:0,fix:0,buf:15},instagram:{pct:0,fix:0,buf:5}};
const sxGet=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch{return d}};
const sxSet=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const sxIcon=d=>'<svg class="sx-ico" viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
// V31.3: Standard-Freisteller ist Poof.bg. „Automatisch“ und „Einfach“ gibt es nicht mehr; Photoroom nur noch bei ausdrücklicher Wahl.
if(['auto','device'].includes(sxGet('rv_cutout_engine','poof')))sxSet('rv_cutout_engine','poof');
let sxCoverBusy=false,sxCoverMsg='',sxServerCutout=null,sxCutCache=null,sxAiCache=null;
const sxClone=c=>{const n=document.createElement('canvas');n.width=c.width;n.height=c.height;n.getContext('2d').drawImage(c,0,0);return n};
const sxSources=()=>article.photos.filter(p=>!p.cover);
// Das RVO-Titelbild ist ausschließlich für die interne Bestandsliste und liegt getrennt von den Fotos (article.rvCover).
const sxCover=()=>article&&article.rvCover&&article.rvCover.src?article.rvCover:null;
function sxEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function sxToast(text){let t=$('sxToast');if(!t){t=document.createElement('div');t.id='sxToast';t.setAttribute('role','status');t.style.cssText='position:fixed;left:50%;bottom:170px;transform:translateX(-50%);z-index:60;padding:12px 18px;border-radius:999px;font:500 14px Segoe UI,Inter,system-ui,sans-serif;color:#fff0d6;background:radial-gradient(ellipse at 50% 0,rgba(255,160,80,.35),rgba(40,22,10,.92));box-shadow:inset 0 0 0 1.5px #ffb060,0 0 18px rgba(255,150,60,.5),0 12px 30px rgba(0,0,0,.5);transition:opacity .3s;pointer-events:none';document.body.append(t)}t.textContent=text;t.style.opacity='1';clearTimeout(t._h);t._h=setTimeout(()=>t.style.opacity='0',2200)}
async function sxCopy(text,btn){try{await navigator.clipboard.writeText(text)}catch{prompt('Zum Kopieren markieren:',text);return}if(btn){const old=btn.innerHTML;btn.textContent='✓ Kopiert';setTimeout(()=>btn.innerHTML=old,1500)}else sxToast('✓ Kopiert')}

/* ---------- Fotos ---------- */
async function sxAddFiles(files){
 const list=[...files].filter(f=>f&&f.type&&f.type.startsWith('image/'));if(!list.length)return;
 const hadSources=sxSources().length;
 $('photoCount').textContent='Fotos werden geladen …';
 for(const f of list){try{const src=await shrink(await fileToData(f));article.photos.push({src,edit:defaults(),ratio:'1'})}catch{alert('Foto konnte nicht geladen werden: '+f.name)}}
 renderPhotos();
 if(sxGet('rv_cover_auto','1')==='1'&&!sxCover()&&!hadSources)sxMakeCover({source:0,auto:true});
}
$('upload').onchange=async e=>{await sxAddFiles(e.target.files);e.target.value=''};
$('sxCamera').onchange=async e=>{await sxAddFiles(e.target.files);e.target.value=''};
$('sxCameraBtn').onclick=()=>$('sxCamera').click();
{const drop=$('sxDrop');['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,()=>drop.classList.remove('drag')));drop.addEventListener('drop',e=>{e.preventDefault();sxAddFiles(e.dataTransfer.files)})}
function sxMove(i,d){const j=i+d;if(j<0||j>=article.photos.length||article.photos[j].cover||article.photos[i].cover)return;[article.photos[i],article.photos[j]]=[article.photos[j],article.photos[i]];renderPhotos()}
renderPhotos=function(){
 if(!article)return;
 const n=sxSources().length;
 $('photoCount').textContent=n?n+(n===1?' Foto':' Fotos')+(sxCover()?' · Titelbild erstellt':''):'Noch keine Fotos ausgewählt';
 for(const id of ['photos','editPhotos']){
  const el=$(id);el.replaceChildren();let k=0;
  const cv=sxCover();
  if(cv){const d=document.createElement('div');d.className='sx-thumb cover';const img=document.createElement('img');img.src=cv.src;img.alt='RVO-Titelbild';img.loading='lazy';
   const tag=document.createElement('span');tag.className='tag';tag.textContent='★ Titelbild';const bar=document.createElement('div');bar.className='bar';
   const b=document.createElement('button');b.type='button';b.innerHTML='×';b.title='Titelbild entfernen';b.setAttribute('aria-label','Titelbild entfernen');b.onclick=()=>{if(!confirm('Titelbild entfernen? Die Originalfotos bleiben erhalten.'))return;article.rvCover=null;sxCoverMsg='';renderPhotos()};
   bar.append(b);d.append(img,tag,bar);el.append(d)}
  article.photos.forEach((p,i)=>{
   const d=document.createElement('div');d.className='sx-thumb'+(p.cover?' cover':'');
   const img=document.createElement('img');img.src=p.src;img.alt=p.cover?'Titelbild':'Foto '+(k+1);img.loading='lazy';if(p.edit)img.style.filter=filter({...defaults(),...p.edit,blur:0});
   const tag=document.createElement('span');tag.className='tag'+(p.cover?'':' n');tag.textContent=p.cover?'★ Titelbild':String(++k);
   const bar=document.createElement('div');bar.className='bar';
   const acts=[];
   if(id==='editPhotos'&&!p.cover)acts.push(['←','Nach vorne',()=>sxMove(i,-1)],['→','Nach hinten',()=>sxMove(i,1)]);
   acts.push([sxIcon('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),'Bearbeiten',()=>openEditor(i)],['×','Entfernen',()=>{if(!confirm(p.cover?'Titelbild entfernen?':'Foto entfernen?'))return;article.photos.splice(i,1);if(p.cover)article.coverSettings=null;renderPhotos()}]);
   for(const [t,label,fn] of acts){const b=document.createElement('button');b.type='button';b.innerHTML=t;b.title=label;b.setAttribute('aria-label',label);b.onclick=fn;bar.append(b)}
   d.append(img,tag,bar);el.append(d);
  });
 }
 sxRenderCoverViews();
};
$('addMore').onclick=()=>$('upload').click();

/* ---------- Titelbild ---------- */
async function sxServerCut(src){
 if(sxServerCutout===false)throw Error('kein Freisteller-Dienst eingerichtet');
 if(sxCutCache&&sxCutCache.src===src)return sxCutCache.png;
 const token=rvAiPassword();if(!token)throw Error('RV-Passwort fehlt');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),45000);let res;
 try{res=await fetch(getAiEndpoint()+'/api/cutout',{method:'POST',headers:{'Content-Type':'application/json','X-RV-Password':token},body:JSON.stringify({image:src}),signal:ctrl.signal})}finally{clearTimeout(timer)}
 const j=await res.json().catch(()=>({}));
 if(res.status===501||res.status===404){sxServerCutout=false;throw Error('kein Freisteller-Dienst eingerichtet')}
 if(!res.ok||!j.image)throw Error(j.error||('Fehler '+res.status));
 sxServerCutout=true;sxCutCache={src,png:j.image};return j.image;
}
/* Freistellen (transparentes PNG) und Titelbild erstellen (Freistellung auf RVO-Hintergrund) sind getrennt.
   Eine Freistellung wird je Foto wiederverwendet (am Artikel und im Gerätespeicher) – Stil/Hintergrund ändern kostet keinen Credit. */
function sxEngineLabel(e){return {poof:'Poof.bg',ai:'KI auf dem Gerät',server:'Photoroom',original:'Original',device:'Einfach'}[e]||''}
function sxEngineNow(){const e=sxGet('rv_cutout_engine','poof');return ['poof','ai','server','original'].includes(e)?e:'poof'}
function sxPaid(e){return e==='poof'||e==='server'}
var sxInflight=new Map(),sxPoofAccount=null;
async function sxKeyOf(src){return 'c'+(await rvDigest(String(src))).slice(0,40)}
async function sxCutStoreGet(key){try{const c=await caches.open('rv-cutouts'),r=await c.match('/__rv_cutout/'+key);return r?await r.json():null}catch{return null}}
async function sxCutStorePut(v){try{const c=await caches.open('rv-cutouts');await c.put('/__rv_cutout/'+v.key,new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}}))}catch{}}
async function sxPoofCut(src){
 const token=rvAiPassword();if(!token)throw Object.assign(Error('Cloud-Kennwort fehlt. Bitte unter Einstellungen › Cloud eintragen.'),{code:'no_password'});
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),60000);let res;
 try{res=await fetch(getAiEndpoint()+'/api/poof',{method:'POST',headers:{'Content-Type':'application/json','X-RV-Password':token},body:JSON.stringify({image:src}),signal:ctrl.signal})}
 catch(e){throw Object.assign(Error(e.name==='AbortError'?'Zeitüberschreitung bei Poof. Es wurde vermutlich kein Credit berechnet.':'Keine Verbindung zum Server.'),{code:'network'})}
 finally{clearTimeout(timer)}
 const j=await res.json().catch(()=>({}));
 if(!res.ok||!j.image)throw Object.assign(Error(j.error||('Fehler '+res.status)),{code:j.code||('http_'+res.status),status:res.status});
 return {png:j.image,meta:{confidence:j.confidence??null,ambiguous:j.ambiguous??null,cached:!!j.cached,requestId:j.requestId||''}};
}
async function sxCanvasPng(c){return c.toDataURL('image/png')}
/* Liefert die Freistellung für ein Foto. API nur, wenn allowApi (= ausdrücklicher Klick) und nichts im Speicher liegt. */
async function sxEnsureCutout(si,{force=false,allowApi=false,engine=sxEngineNow()}={}){
 const srcs=sxSources();if(!srcs[si])throw Error('Foto nicht gefunden');
 const src=srcs[si].src,key=await sxKeyOf(src);
 if(!force){
  if(article.rvCutout&&article.rvCutout.key===key&&article.rvCutout.src)return article.rvCutout;
  const c=await sxCutStoreGet(key);if(c&&c.src){article.rvCutout=c;return c}
 }
 if(engine==='original')return null;
 if(sxPaid(engine)&&!allowApi)throw Object.assign(Error('Tippe auf „Titelbild erstellen“ oder „Nur freistellen“ – Poof wird nur auf Klick genutzt.'),{code:'needs_click'});
 if(sxInflight.has(key))return sxInflight.get(key);
 const job=(async()=>{
  let png,meta={};
  if(engine==='poof'){const r=await sxPoofCut(src);png=r.png;meta=r.meta}
  else if(engine==='server'){png=await sxServerCut(src)}
  else if(engine==='ai'){if(!window.RVAI||!RVAI.supported())throw Error('KI auf dem Gerät wird von diesem Browser nicht unterstützt.');let last=-9;
   const c=await RVAI.cut(src,{onProgress:(f)=>{const pc=Math.round(f*100);if(pc-last>=2||pc===100||pc<last){last=pc;sxCoverMsg=pc<100?'KI-Modell wird einmalig geladen … '+pc+' %':'KI schneidet aus …';sxRenderCoverViews()}}});
   png=await sxCanvasPng(c);meta={device:RVAI.device()}}
  const v={src:png,key,engine,source:si,at:new Date().toISOString(),meta};
  article.rvCutout=v;await sxCutStorePut(v);return v;
 })();
 sxInflight.set(key,job);
 try{return await job}finally{sxInflight.delete(key)}
}
function sxErrText(e){
 if(e&&e.code==='payment_required')return 'Deine Poof-Credits für diesen Monat sind aufgebraucht. Originalfotos und vorhandene Titelbilder bleiben erhalten. Du kannst unter „Freisteller“ auf „KI auf dem Gerät“ wechseln.';
 return (e&&e.message)||'Unbekannter Fehler';
}
async function sxCutOnly({force=false}={}){
 const srcs=sxSources();if(!srcs.length){sxCoverMsg='Bitte zuerst Fotos hochladen.';sxRenderCoverViews();return}
 if(sxCoverBusy)return;
 const si=Math.min((article.coverSettings||{}).source||0,srcs.length-1),engine=sxEngineNow();
 if(engine==='original'){sxCoverMsg='Mit „Original“ wird nicht freigestellt. Bitte einen Freisteller wählen.';sxRenderCoverViews();return}
 sxCoverBusy=true;sxCoverMsg=engine==='poof'?'Poof stellt frei …':'Wird freigestellt …';sxRenderCoverViews();
 try{const c=await sxEnsureCutout(si,{force,allowApi:true,engine});sxCoverMsg='Freigestellt mit '+sxEngineLabel(c.engine)+(c.meta&&c.meta.cached?' (aus dem Zwischenspeicher, kein neuer Credit)':'')+'.';sxPoofRefresh()}
 catch(e){sxCoverMsg='Freistellen fehlgeschlagen: '+sxErrText(e)}
 finally{sxCoverBusy=false;sxRenderCoverViews()}
}
async function sxMakeCover(opts={}){
 const srcs=sxSources();if(!srcs.length){sxCoverMsg='Bitte zuerst Fotos hochladen.';sxRenderCoverViews();return}
 if(sxCoverBusy)return;
 const prev=article.coverSettings||{};let si=opts.source??prev.source??0;if(si>=srcs.length)si=0;
 const engine=sxEngineNow(),bg=opts.bg||prev.bg||sxGet('rv_cover_bg','sand'),style=opts.style||prev.style||sxGet('rv_cover_style','app');
 // Automatisch nach dem Hochladen oder nur Stil/Hintergrund geändert: niemals einen kostenpflichtigen Aufruf auslösen.
 const allowApi=!opts.auto&&!opts.restyle;
 sxCoverBusy=true;sxCoverMsg=opts.restyle?'Titelbild wird neu gestaltet …':engine==='original'?'Titelbild wird zugeschnitten …':'Titelbild wird erstellt …';sxRenderCoverViews();
 try{
  let cut=null;
  if(engine!=='original'){
   try{cut=await sxEnsureCutout(si,{allowApi,engine})}
   catch(e){
    if(e.code==='needs_click'){
     if(opts.restyle&&sxCover()){sxCoverMsg='Für dieses Foto gibt es noch keine Freistellung. Tippe auf „Titelbild erstellen“.';return}
     if(opts.auto){sxCoverMsg='Fotos geladen. Tippe auf „Titelbild erstellen“ – Poof wird nur auf Klick genutzt.';return}
    }
    throw e;
   }
  }
  const useOriginal=!cut;
  const r=await RVCutout.makeCover(srcs[si].src,{engine:useOriginal?'original':'cutout',bg,style,cutoutPng:useOriginal?null:cut.src,noRefine:cut&&cut.engine!=='ai'});
  const used=useOriginal?'original':cut.engine;
  article.rvCover={src:r.src,engine:used,style,bg,source:si,cutoutKey:cut?cut.key:null,at:new Date().toISOString()};
  article.coverSettings={...prev,bg,style,source:si,engine:used,warning:r.warning||'',at:article.rvCover.at};
  sxCoverMsg=r.warning||('Titelbild erstellt'+(used==='original'?' (Originalfoto, ohne Freistellung).':' – freigestellt mit '+sxEngineLabel(used)+(cut.meta&&cut.meta.cached?' (wiederverwendet, kein neuer Credit).':'.')));
  if(allowApi&&sxPaid(engine))sxPoofRefresh();
 }catch(e){sxCoverMsg='Titelbild konnte nicht erstellt werden: '+sxErrText(e)+(sxCover()?' Das bisherige Titelbild bleibt erhalten.':'')}
 finally{sxCoverBusy=false;renderPhotos()}
}
async function sxPoofRefresh(){
 const token=rvAiPassword();if(!token||sxEngineNow()!=='poof'){sxPoofAccount=null;return}
 try{const r=await fetch(getAiEndpoint()+'/api/poof',{headers:{'X-RV-Password':token}});const j=await r.json();sxPoofAccount=r.ok?j:null}catch{sxPoofAccount=null}
 sxRenderCoverViews();
}
function sxCoverHtml(){
 const c=sxCover(),s=article.coverSettings||{};
 if(c){const label=({poof:'Poof.bg',ai:'KI auf dem Gerät',server:'Photoroom',device:'Einfach freigestellt',original:'Original'}[c.engine||s.engine]||'Titelbild');return '<img src="'+sxEsc(c.src)+'" alt="Titelbild"><span class="badge'+(s.warning?' warn':'')+'"><i></i>'+label+'</span>'}
 return '<div class="empty">'+sxIcon('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>')+(sxCoverBusy?'Titelbild wird erstellt …':sxSources().length?'Noch kein Titelbild – „Titelbild erstellen“ antippen':'Lade Fotos hoch und tippe auf „Titelbild erstellen“')+'</div>';
}
function sxRenderCoverViews(){
 if(!article)return;
 for(const id of ['sxCover','sxCoverLarge']){const el=$(id);if(!el)continue;el.innerHTML=sxCoverHtml();el.classList.toggle('busy',sxCoverBusy)}
 const s=article.coverSettings||{},bg=s.bg||sxGet('rv_cover_bg','sand'),engine=sxEngineNow(),style=s.style||sxGet('rv_cover_style','app');
 $('sxStyle').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.style===style));$('sxSwWrap').style.display=style==='app'?'none':'';
 const sw=$('sxSwatches');sw.replaceChildren();for(const [key,[a,b,name]] of Object.entries(RVCutout.BACKDROPS)){const btn=document.createElement('button');btn.type='button';btn.title=name;btn.setAttribute('aria-label','Hintergrund '+name);btn.style.background='linear-gradient(180deg,'+a+','+b+')';btn.classList.toggle('on',key===bg);btn.onclick=()=>{sxSet('rv_cover_bg',key);article.coverSettings={...(article.coverSettings||{}),bg:key};if(sxCover())sxMakeCover({bg:key,restyle:true});else sxRenderCoverViews()};sw.append(btn)}
 const src=$('sxSources');src.replaceChildren();sxSources().forEach((p,i)=>{const btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-label','Foto '+(i+1)+' als Ausgangsfoto');btn.classList.toggle('on',i===(s.source||0));btn.innerHTML='<img src="'+sxEsc(p.src)+'" alt="">';btn.onclick=()=>sxMakeCover({source:i});src.append(btn)});
 $('sxEngine').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.engine===engine));
 $('sxTolWrap').style.display='none';
 $('sxTol').value=s.tolerance||0;$('sxTolVal').textContent=s.tolerance?String(s.tolerance):('Automatisch'+(s.autoTolerance?' ('+s.autoTolerance+')':''));
 $('sxAutoCover').checked=sxGet('rv_cover_auto','1')==='1';
 const eng=sxEngineNow();
 $('sxCoverStatus').textContent=sxCoverMsg||({poof:'Poof.bg stellt über deinen Server frei (1 Credit pro neuer Freistellung). Stil und Hintergrund ändern kostet nichts.',ai:'KI auf dem Gerät: kostenlos, ohne Upload. Beim ersten Mal wird das Modell einmalig geladen (ca. 90 MB).',server:'Photoroom über deinen Server – kostenpflichtig, nur bei ausdrücklicher Wahl.',original:'Originalfoto im Titelbild-Format, ohne Freistellung.'}[eng]||'');
 for(const id of ['sxCoverMake','sxCoverRedo','sxCutMake'])if($(id))$(id).disabled=sxCoverBusy||!sxSources().length;
 $('sxCoverRemove').disabled=sxCoverBusy||!sxCover();
 const cut=article.rvCutout&&article.rvCutout.src?article.rvCutout:null;
 $('sxCutView').hidden=!cut;if(cut){const im=$('sxCutImg').querySelector('img');if(!im||im.src!==cut.src)$('sxCutImg').innerHTML='<img src="'+sxEsc(cut.src)+'" alt="Freigestelltes Produkt">';$('sxCutView').querySelector('.sx-cut-lbl').textContent='Freigestellt mit '+sxEngineLabel(cut.engine)+' (transparent)'}
 const acc=sxPoofAccount&&sxPoofAccount.account;
 $('sxPoofInfo').textContent=eng!=='poof'?'':sxPoofAccount&&sxPoofAccount.available===false?'Poof ist auf dem Server noch nicht eingerichtet (Secret POOF_BG_API_KEY).':acc?('Poof '+acc.plan+': '+Math.max(0,acc.maxCredits-acc.usedCredits)+' von '+acc.maxCredits+' Credits übrig'):'';
 sxRenderPreview();
}
function sxRenderPreview(){if(!article)return;const first=article.photos[0],root=$('sxPreview');root.replaceChildren();
 for(const [name,ratio,label] of [['eBay','1/1','1:1'],['Vinted','3/4','3:4'],['Instagram','4/5','4:5']]){const f=document.createElement('figure');f.innerHTML='<div class="fr" style="aspect-ratio:'+ratio+'">'+(first?'<img src="'+sxEsc(first.src)+'" alt="">':'')+'</div><figcaption>'+name+'<small>'+label+'</small></figcaption>';if(first&&first.edit)f.querySelector('img').style.filter=filter({...defaults(),...first.edit,blur:0});root.append(f)}}
$('sxCoverRedo').onclick=()=>sxMakeCover();$('sxCoverMake').onclick=()=>sxMakeCover();
$('sxCutMake').onclick=async()=>{const srcs=sxSources(),si=Math.min((article.coverSettings||{}).source||0,Math.max(0,srcs.length-1));if(!srcs.length)return sxCutOnly();const key=await sxKeyOf(srcs[si].src),has=(article.rvCutout&&article.rvCutout.key===key)||await sxCutStoreGet(key);
 if(has&&sxPaid(sxEngineNow())&&!confirm('Dieses Foto ist schon freigestellt. Erneut freistellen verbraucht 1 Credit. Fortfahren?')){await sxEnsureCutout(si,{allowApi:false}).catch(()=>{});sxRenderCoverViews();return}
 sxCutOnly({force:!!has})};
$('sxCutDownload').onclick=()=>{const c=article.rvCutout;if(!c||!c.src)return;const a=document.createElement('a');a.href=c.src;a.download=(article.sku||'artikel')+'_freigestellt.png';document.body.append(a);a.click();a.remove()};
$('sxCoverRemove').onclick=()=>{if(!sxCover())return;if(!confirm('Titelbild entfernen? Die Originalfotos bleiben erhalten.'))return;article.rvCover=null;sxCoverMsg='';renderPhotos()};
$('sxStyle').onclick=e=>{const b=e.target.closest('[data-style]');if(!b)return;sxSet('rv_cover_style',b.dataset.style);article.coverSettings={...(article.coverSettings||{}),style:b.dataset.style};if(sxCover())sxMakeCover({style:b.dataset.style,restyle:true});else sxRenderCoverViews()};
$('sxEngine').onclick=e=>{const b=e.target.closest('[data-engine]');if(!b)return;sxSet('rv_cutout_engine',b.dataset.engine);sxServerCutout=null;sxCoverMsg='';sxRenderCoverViews();if(b.dataset.engine==='poof')sxPoofRefresh()};  // Wechsel löst keinen Aufruf aus
$('sxTol').oninput=()=>{$('sxTolVal').textContent=+$('sxTol').value?$('sxTol').value:'Automatisch'};
$('sxTol').onchange=()=>{article.coverSettings={...(article.coverSettings||{}),tolerance:+$('sxTol').value};sxMakeCover({tolerance:+$('sxTol').value})};
$('sxAutoCover').onchange=()=>sxSet('rv_cover_auto',$('sxAutoCover').checked?'1':'0');
$('sxAutoEnhance').onclick=async()=>{
 const list=sxSources();if(!list.length){sxToast('Noch keine Fotos');return}
 for(const p of list){try{const im=await imageFrom(p.src),c=document.createElement('canvas'),s=64/Math.max(im.width,im.height);c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,c.width,c.height);const d=ctx.getImageData(0,0,c.width,c.height).data,lum=[];for(let i=0;i<d.length;i+=4)lum.push(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2]);lum.sort((a,b)=>a-b);
  const lo=lum[Math.floor(lum.length*.02)],hi=lum[Math.floor(lum.length*.98)],mean=lum.reduce((a,b)=>a+b,0)/lum.length;
  p.edit={...defaults(),...p.edit,contrast:Math.round(Math.max(100,Math.min(130,100*235/Math.max(60,hi-lo)*.85))),brightness:Math.round(Math.max(96,Math.min(124,100*138/Math.max(40,mean)))),saturation:106};
 }catch{}}
 renderPhotos();sxToast('✓ '+list.length+(list.length===1?' Foto':' Fotos')+' optimiert');
};

/* ---------- Angaben ---------- */
$('sxDefectChips').onclick=e=>{const b=e.target.closest('[data-defect]');if(!b)return;const v=b.dataset.defect,cur=$('notes').value.trim();
 if(v==='Keine Mängel')$('notes').value='Keine Mängel';else{const parts=cur.split(/,\s*/).filter(x=>x&&x!=='Keine Mängel');if(!parts.includes(v))parts.push(v);$('notes').value=parts.join(', ')}article.notes=$('notes').value;sxPaintDefects()};
function sxPaintDefects(){const cur=$('notes').value;$('sxDefectChips').querySelectorAll('button').forEach(b=>b.classList.toggle('on',cur.split(/,\s*/).includes(b.dataset.defect)))}
$('notes').addEventListener('input',sxPaintDefects);
$('sxNoAi').onclick=()=>{pull();const empty=platforms.every(k=>!article.listings[k].title&&!article.listings[k].description);showStep(1);if(empty&&(article.brand||article.category))sxLocalListings(true)};
$('sxNewArticle').onclick=()=>{if(article.photos.length&&!confirm('Neuen Artikel beginnen? Nicht gespeicherte Änderungen gehen verloren.'))return;article=blank();sxCoverMsg='';activePlatform='ebay';push();showStep(0)};
document.querySelectorAll('#steps [data-sx-step]').forEach(b=>b.onclick=()=>{pull();showStep(+b.dataset.sxStep)});
document.querySelectorAll('[data-sx-go]').forEach(b=>b.onclick=()=>{pull();showStep(+b.dataset.sxGo)});

/* ---------- Produktdaten & Texte ---------- */
function sxRenderDataScore(){const keys=['brand','model','category','size','color','material','sku'],n=keys.filter(k=>$(k).value.trim()).length;$('sxDataScore').innerHTML='<b>'+n+'/'+keys.length+'</b> Angaben <i><s style="width:'+Math.round(n/keys.length*100)+'%"></s></i>'}
renderDetected=function(){sxRenderDataScore()};
['brand','model','category','size','color','material','country','sku'].forEach(k=>$(k).addEventListener('input',()=>{article[k]=$(k).value;sxRenderDataScore();sxListingMeta();sxSubtitle()}));
async function sxNextSku(){const items=await allArticles();let max=0;for(const a of items){const m=String(a.sku||'').match(/^RV-(\d+)$/i);if(m)max=Math.max(max,+m[1])}return 'RV-'+String(max+1).padStart(4,'0')}
$('sxSkuGen').onclick=async()=>{$('sku').value=await sxNextSku();article.sku=$('sku').value;sxRenderDataScore();sxSubtitle()};
const SX_CAT_TAG={'jacken':'jacke','hoodies & pullover':'hoodie','shirts & tops':'shirt','hosen':'hose','kleider & röcke':'kleid','sneaker & schuhe':'sneaker','accessoires':'accessoires','taschen':'tasche'};
const sxSlug=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,'');
function sxHashtags(){const a=article,out=[],add=t=>{t=sxSlug(t);if(t&&t.length>1&&!out.includes('#'+t))out.push('#'+t)};
 add(a.brand);const cat=SX_CAT_TAG[String(a.category||'').toLowerCase()]||a.category;add(cat);if(a.brand&&cat)add(a.brand+cat);add(a.model);add(a.color);['secondhand','preloved','reselling','fashion'].forEach(add);return out.slice(0,10)}
function sxListingMeta(){
 const t=$('listingTitle').value,d=$('listingDescription').value,max=SX_TITLE_MAX[activePlatform];
 $('sxTitleCount').textContent=max?t.length+'/'+max:t.length+' Zeichen';$('sxTitleCount').classList.toggle('over',Boolean(max&&t.length>max));
 $('sxDescCount').textContent=activePlatform==='instagram'?d.length+'/2200':d.length+' Zeichen';$('sxDescCount').classList.toggle('over',activePlatform==='instagram'&&d.length>2200);
 const low=t.toLowerCase(),checks=[];
 if(article.brand)checks.push(['Marke',low.includes(String(article.brand).toLowerCase())]);
 if(article.size)checks.push(['Größe',low.includes(String(article.size).toLowerCase())]);
 if(article.color)checks.push(['Farbe',low.includes(String(article.color).toLowerCase().split(/[\s/]/)[0])]);
 if(t)checks.push([max?'Länge ≤ '+max:'Länge',!max||t.length<=max]);
 $('sxTitleChecks').innerHTML=checks.map(([k,ok])=>'<span class="'+(ok?'ok':'miss')+'">'+(ok?'✓ ':'○ ')+k+'</span>').join('');
 const tags=$('sxTags');tags.replaceChildren();
 if(activePlatform==='instagram'){const list=sxHashtags();if(list.length){for(const tg of list){const b=document.createElement('button');b.type='button';b.textContent=tg;b.onclick=()=>sxInsertTags([tg]);tags.append(b)}const all=document.createElement('button');all.type='button';all.className='on';all.textContent='＃ Alle einfügen';all.onclick=()=>sxInsertTags(list);tags.append(all)}}
}
function sxInsertTags(list){const ta=$('listingDescription'),cur=ta.value,add=list.filter(t=>!cur.includes(t));if(!add.length)return;ta.value=cur.replace(/\s*$/,'')+(cur.trim()?'\n\n':'')+add.join(' ');article.listings[activePlatform].description=ta.value;sxListingMeta()}
$('listingTitle').addEventListener('input',sxListingMeta);$('listingDescription').addEventListener('input',sxListingMeta);
{const prevShow=showListing;showListing=function(){prevShow();sxListingMeta()}}
$('copyTitle').onclick=()=>sxCopy($('listingTitle').value,$('copyTitle'));
$('copyDescription').onclick=()=>sxCopy($('listingDescription').value,$('copyDescription'));
$('sxCopyAll').onclick=()=>sxCopy($('listingTitle').value+'\n\n'+$('listingDescription').value,$('sxCopyAll'));
function sxLocalListings(force){
 pull();const a=article,has=platforms.some(k=>a.listings[k].title||a.listings[k].description);
 if(has&&!force&&!confirm('Vorhandene Texte für alle Plattformen ersetzen?'))return;
 const SXN={'jacken':'Jacke','hoodies & pullover':'Pullover','shirts & tops':'Shirt','hosen':'Hose','kleider & röcke':'Kleid','sneaker & schuhe':'Sneaker','accessoires':'','taschen':'Tasche'};
 const name=[a.brand,a.model].filter(Boolean).join(' ')||a.category||'Artikel',lowModel=String(a.model||'').toLowerCase(),noun=SXN[String(a.category||'').toLowerCase()]??a.category??'';
 const cat=noun&&!lowModel.includes(noun.toLowerCase())&&!/hoodie|sweat|cardigan|jacke|jacket|weste|mantel|polo|tee|hemd|jeans|pant|shorts|rock|kleid|sneaker|boot|cap|beanie|mütze/.test(lowModel)?noun:'';
 const size=a.size?'Gr. '+a.size:'',defects=String(a.notes||'').trim(),noDefects=!defects||/^keine/i.test(defects);
 const piece=name+(cat?' – '+cat:'')+(a.color?' in '+a.color:'')+(a.material?' aus '+a.material:'')+(a.country?', Made in '+a.country:'')+'.';
 const sections=['🥇 DAS STÜCK\n'+piece,'📐 MASSE & PASSFORM\n'+[a.size&&'Größe '+a.size,a.measurements&&'Maße: '+a.measurements].filter(Boolean).join(' · ')+(a.measurements?'':'\nMaße auf Anfrage.'),'👀 ZUSTAND\n'+conditionText(a.condition)+(noDefects&&defects?' – keine Mängel bekannt.':'.')];
 if(!noDefects)sections.push('⚠️ MÄNGEL\n'+defects+'.');
 sections.push('📦 VERSAND & ANGEBOTE\nSchneller, sorgfältig verpackter Versand. Faire Preisvorschläge sind willkommen. Bei Fragen zur Passform schreib mir einfach.');
 if(a.sku)sections.push('🏷️ ARTIKELNUMMER\n'+a.sku);
 const body=sections.join('\n\n');
 a.listings.ebay={title:[a.brand,a.model,cat,a.color,size,a.material].filter(Boolean).join(' ').replace(/\s+/g,' ').slice(0,80),description:body};
 a.listings.vinted={title:[a.brand,a.model||cat,a.color,size].filter(Boolean).join(' '),description:body};
 a.listings.instagram={title:name+(size?' · '+size:''),description:'✨ '+piece+'\n\n'+[size,a.measurements&&'Maße: '+a.measurements,'Zustand '+(a.condition||'—')+'/10',!noDefects&&'Mängel: '+defects].filter(Boolean).join(' · ')+'\n\n📩 Bei Interesse per DM.'+(sxHashtags().length?'\n\n'+sxHashtags().join(' '):'')};
 showListing();sxToast('✓ Texte für alle Plattformen erstellt');
}
$('sxLocalTexts').onclick=()=>sxLocalListings(false);

/* ---------- Preise ---------- */
function sxFees(){try{return {...SX_FEES_DEFAULT,...JSON.parse(sxGet('rv_fees','{}'))}}catch{return {...SX_FEES_DEFAULT}}}
function sxPsych(x){if(!(x>0))return 0;let r=Math.ceil(x-1e-9);if(r<20)return r;while(![5,9].includes(r%10))r++;return r}
function sxRenderFees(root){root=root||$('sxFees');const fees=sxFees();root.replaceChildren();
 for(const [k,name] of SX_PLATFORMS){const f=fees[k],box=document.createElement('div');box.innerHTML='<b>'+name+'</b><label>Gebühr %<input type="number" min="0" max="60" step="0.1" data-k="'+k+'" data-f="pct"></label><label>Fixgebühr €<input type="number" min="0" step="0.01" data-k="'+k+'" data-f="fix"></label><label>Puffer %<input type="number" min="0" max="60" step="1" data-k="'+k+'" data-f="buf"></label>';
  box.querySelectorAll('input').forEach(inp=>{inp.value=f[inp.dataset.f];inp.onchange=()=>{const all=sxFees();all[k]={...all[k],[inp.dataset.f]:Math.max(0,Number(inp.value)||0)};sxSet('rv_fees',JSON.stringify(all));sxRenderProfits()}});root.append(box)}}
function sxRenderProfits(){const fees=sxFees(),ek=Number($('cost').value)||0;
 for(const [k] of SX_PLATFORMS){const el=$('sxProfit_'+k),vk=Number($('price'+k[0].toUpperCase()+k.slice(1)).value)||0;if(!vk){el.textContent=ek?'EK '+euro(ek):'';el.className='dl nil';continue}
  const net=vk*(1-fees[k].pct/100)-fees[k].fix,profit=net-ek;el.className='dl'+(profit<0?' neg':'');el.textContent=(profit>=0?'↗ +':'↘ ')+euro(profit)+(ek>0?' · '+Math.round(profit/ek*100)+' %':' Erlös')}}
['priceEbay','priceVinted','priceInstagram','cost'].forEach(id=>$(id).addEventListener('input',()=>{sxRenderProfits();if(step===3)sxRenderPublish()}));
$('sxApplyPrices').onclick=()=>{const target=Number($('sxTarget').value);if(!(target>0)){$('sxTarget').focus();sxToast('Bitte Wunschbetrag eintragen');return}const fees=sxFees();
 for(const [k] of SX_PLATFORMS){const f=fees[k];$('price'+k[0].toUpperCase()+k.slice(1)).value=sxPsych((target+f.fix)/(1-Math.min(.9,f.pct/100))*(1+f.buf/100))}pull();sxRenderProfits();sxRenderPublish();sxToast('✓ Preise für alle Plattformen gesetzt')};
async function sxRenderHistory(){const el=$('sxPriceHint');el.textContent='';const items=(await allArticles()).filter(a=>a.id!==article.id&&a.sale&&Number(a.sale.price)>0);
 const brand=String(article.brand||'').trim().toLowerCase(),cat=String(article.category||'').trim().toLowerCase();
 let pool=brand?items.filter(a=>String(a.brand||'').trim().toLowerCase()===brand):[],label=article.brand;
 if(pool.length<1&&cat){pool=items.filter(a=>String(a.category||'').trim().toLowerCase()===cat);label=article.category}
 if(!pool.length){el.textContent=items.length?'Noch keine Verkäufe dieser Marke oder Kategorie – Preise frei wählen.':'';return}
 const avg=pool.reduce((n,a)=>n+Number(a.sale.price),0)/pool.length,days=pool.map(a=>{const s=v5Date(a),e=Date.parse(a.sale.date);return s!==null&&Number.isFinite(e)?Math.max(0,Math.round((e-s)/864e5)):null}).filter(x=>x!==null);
 el.innerHTML='Deine Verkäufe <b>'+sxEsc(label)+'</b>: Ø <b>'+euro(avg)+'</b>'+(days.length?' nach Ø '+Math.round(days.reduce((a,b)=>a+b,0)/days.length)+' Tagen':'')+' ('+pool.length+(pool.length===1?' Verkauf':' Verkäufe')+') ';
 const b=document.createElement('button');b.type='button';b.className='sx-mini';b.textContent='Als Wunschbetrag';b.onclick=()=>{$('sxTarget').value=Math.round(avg);$('sxApplyPrices').click()};el.append(b)}

/* ---------- Lager ---------- */
async function sxRenderLager(){const items=await allArticles(),loc=new Map(),src=new Set(),brands=new Set();
 for(const a of items){if(a.location)loc.set(a.location,Math.max(loc.get(a.location)||0,Date.parse(a.updatedAt||a.rvSyncModifiedAt||0)||0));if(a.source&&a.source!=='Beispiel')src.add(a.source);if(a.brand)brands.add(a.brand)}
 const fill=(id,vals)=>{const dl=$(id);dl.replaceChildren();for(const v of vals){const o=document.createElement('option');o.value=v;dl.append(o)}};
 fill('sxLocList',[...loc.keys()].sort());fill('sxSrcList',[...src].sort());fill('sxBrandList',[...brands].sort());
 const chips=$('sxLocChips');chips.replaceChildren();[...loc.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([v])=>{const b=document.createElement('button');b.type='button';b.textContent=v;b.onclick=()=>{$('location').value=v;article.location=v};chips.append(b)});
 if(!$('purchaseDate').value)$('purchaseDate').value=new Date().toISOString().slice(0,10)}

/* ---------- Veröffentlichen ---------- */
async function sxShareFiles(){const files=[];for(const [i,p] of article.photos.slice(0,10).entries()){try{const b=await (await fetch(p.src)).blob();files.push(new File([b],(article.sku||'rv')+'-'+(i+1)+'.jpg',{type:b.type||'image/jpeg'}))}catch{}}return files}
function sxRenderPublish(){const root=$('sxPublish');root.replaceChildren();article.publishInfo=article.publishInfo||{};
 const canShare=Boolean(navigator.canShare&&navigator.share);
 for(const [k,name,short,url] of SX_PLATFORMS){
  const info=article.publishInfo[k]||{},live=info.status==='listed',price=Number($('price'+k[0].toUpperCase()+k.slice(1)).value)||0,l=article.listings[k]||{title:'',description:''};
  const card=document.createElement('div');card.className='sx-pub'+(live?' live':'');card.dataset.p=k;
  card.innerHTML='<div class="sx-pub-hd"><span class="mi">'+short+'</span><div><b>'+name+'</b><small>'+(price?euro(price):'Kein Preis')+' · '+(l.title?sxEsc(l.title):'Kein Titel')+'</small></div><span class="sx-pub-st"><i></i>'+(live?'Online':'Nicht online')+'</span></div>'
   +'<div class="sx-row"><button type="button" class="sx-btn" data-a="copy">'+sxIcon('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>')+'Kopieren</button><button type="button" class="sx-btn" data-a="open">'+sxIcon('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>')+'Öffnen</button>'+(canShare?'<button type="button" class="sx-btn" data-a="share">'+sxIcon('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/>')+'Teilen</button>':'')+'</div>'
   +'<input type="url" placeholder="Listing-Link (optional)" data-a="url">'
   +'<label class="sx-switch"><input type="checkbox" data-a="live"'+(live?' checked':'')+'><span></span>Online gestellt</label>';
  const text=()=>{pull();const L=article.listings[k]||{};return [L.title,L.description,k==='instagram'&&price?'Preis: '+euro(price):''].filter(Boolean).join('\n\n')};
  card.querySelector('[data-a=copy]').onclick=e=>sxCopy(text(),e.currentTarget);
  card.querySelector('[data-a=open]').onclick=async e=>{await sxCopy(text(),e.currentTarget);window.open(url,'_blank','noopener')};
  const sh=card.querySelector('[data-a=share]');if(sh)sh.onclick=async()=>{const files=await sxShareFiles(),data={title:(article.listings[k]||{}).title||'',text:text()};if(files.length&&navigator.canShare({files}))data.files=files;try{await navigator.share(data)}catch(err){if(err.name!=='AbortError')sxToast('Teilen nicht möglich: '+err.message)}};
  const inp=card.querySelector('[data-a=url]');inp.value=info.url||'';inp.onchange=()=>{const v=inp.value.trim();if(v&&!/^https?:\/\//i.test(v)){sxToast('Bitte einen vollständigen Link eingeben');return}article.publishInfo[k]={...(article.publishInfo[k]||{status:'not_listed'}),url:v,updatedAt:new Date().toISOString()}};
  card.querySelector('[data-a=live]').onchange=e=>{const on=e.target.checked;article.publishInfo[k]={...(article.publishInfo[k]||{}),status:on?'listed':'not_listed',url:inp.value.trim(),date:on?new Date().toISOString().slice(0,10):null,updatedAt:new Date().toISOString()};
   if(on&&$('articleStatus').value!=='Verkauft'){$('articleStatus').value='Online';article.articleStatus='Online'}sxRenderPublish();sxRenderReady()};
  root.append(card);
 }}

/* ---------- Fertig-Check ---------- */
const SX_STEP_OF={Foto:0,Einkaufspreis:0,'Maße':0,Zustand:0,'Mängelangabe':0,Artikelnummer:1,Marke:1,Kategorie:1,'Größe':1,Listingtext:1,Plattformpreis:3};
function sxRenderReady(){pull();const missing=v6Missing(article),total=11,done=total-missing.length,pct=done/total,C=2*Math.PI*30,color=pct>=1?'#2ee0a0':'#3d9bff';
 $('sxReady').innerHTML='<svg class="ring" viewBox="0 0 76 76" aria-hidden="true"><circle class="t" cx="38" cy="38" r="30"/><circle class="v" cx="38" cy="38" r="30" stroke="'+color+'" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-pct)).toFixed(1)+'"/><text x="38" y="44" text-anchor="middle">'+Math.round(pct*100)+'%</text></svg>'
  +'<div class="sx-ready-tx"><b>'+(missing.length?'Noch '+missing.length+(missing.length===1?' Angabe':' Angaben')+' offen':'Alles bereit zum Verkaufen')+'</b><div class="sx-chips">'+missing.map(m=>'<button type="button" data-step="'+(SX_STEP_OF[m]??0)+'">'+sxEsc(m)+'</button>').join('')+'</div></div>';
 $('sxReady').querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>showStep(+b.dataset.step));}

/* ---------- Schritte, Speichern ---------- */
function sxSubtitle(){if(!article)return;const name=[article.brand,article.model].filter(Boolean).join(' ');$('sxSubtitle').textContent=(name||'Neuer Artikel')+(article.sku?' · '+article.sku:'')}
{const prevShowStep=showStep;showStep=function(n){prevShowStep(n);if(n>3)return;sxSubtitle();
 if(n===1){sxRenderDataScore();sxListingMeta();sxRenderLager()}
 if(n===2)sxRenderCoverViews();
 if(n===3){sxRenderFees();sxRenderProfits();sxRenderHistory();sxRenderLager();sxRenderPublish();sxRenderReady();$('next').textContent='✓ Im Bestand speichern'}}}
{const prevPush=push;push=function(){prevPush();sxSubtitle();sxPaintDefects();sxRenderDataScore();sxListingMeta()}}
$('next').onclick=()=>{pull();if(step===3){$('saveArticle').click();return}showStep(Math.min(3,step+1))};
{const prevSave=$('saveArticle').onclick;$('saveArticle').onclick=async()=>{pull();if(!article.sku){article.sku=await sxNextSku();$('sku').value=article.sku}if(!article.purchaseDate){article.purchaseDate=new Date().toISOString().slice(0,10);$('purchaseDate').value=article.purchaseDate}article.updatedAt=new Date().toISOString();if(!article.createdAt)article.createdAt=article.updatedAt;return prevSave()}}
function sxAfterSave(){$('saveStatus').textContent='';article=blank();sxCoverMsg='';activePlatform='ebay';push();showStep(4);sxToast('✓ Im Bestand gespeichert')}
renderPhotos();sxSubtitle();
// ===================== Einstellungen V23: Kontrollzentrum =====================
const ST_KEY='rv_settings_v1';
const ST_DEF={name:'',shop:'',closing:'Schneller, sorgfältig verpackter Versand. Faire Preisvorschläge sind willkommen. Bei Fragen zur Passform schreib mir einfach.',tags:'',platforms:{ebay:true,vinted:true,instagram:true},rounding:'59',shipping:'',staleDays:'60',skuPrefix:'RV',defaultStatus:'Entwurf',backupDays:'14'};
function stAll(){let v={};try{v=JSON.parse(sxGet(ST_KEY,'{}'))||{}}catch{}return {...ST_DEF,...v,platforms:{...ST_DEF.platforms,...(v.platforms||{})}}}
function stSave(patch){const v={...stAll(),...patch};sxSet(ST_KEY,JSON.stringify(v));stApply();return v}
window.RVSettings={get:stAll};
function stApply(){const s=stAll();for(const [k] of SX_PLATFORMS)document.body.classList.toggle('rv-off-'+k,!s.platforms[k]);
 const g=$('v11Greet');if(g){const h=new Date().getHours(),w=h<11?'Guten Morgen':h<18?'Guten Tag':'Guten Abend';g.textContent=w+(s.name?', '+s.name:'')+'!'}}
// Einstellungen in Studio und Bestand wirksam machen
sxPsych=function(x){if(!(x>0))return 0;const mode=stAll().rounding;if(mode==='int')return Math.ceil(x-1e-9);if(mode==='90'){const r=Math.floor(x)+.9;return r>=x-1e-9?r:r+1}let r=Math.ceil(x-1e-9);if(r<20)return r;while(![5,9].includes(r%10))r++;return r};
sxNextSku=async function(){const pre=(stAll().skuPrefix||'RV').trim().toUpperCase().replace(/[^A-Z0-9]/g,'')||'RV',items=await allArticles(),re=new RegExp('^'+pre+'-(\\d+)$','i');let max=0;for(const a of items){const m=String(a.sku||'').match(re);if(m)max=Math.max(max,+m[1])}return pre+'-'+String(max+1).padStart(4,'0')};
{const prevBlank=blank;blank=function(){const a=prevBlank();a.articleStatus=stAll().defaultStatus||'Entwurf';return a}}
{const prevTags=sxHashtags;sxHashtags=function(){const own=String(stAll().tags||'').split(/[\s,]+/).filter(Boolean).map(t=>'#'+t.replace(/^#+/,'')).filter(t=>t.length>1);return [...new Set([...own,...prevTags()])].slice(0,14)}}
{const prevLocal=sxLocalListings;sxLocalListings=function(force){prevLocal(force);const s=stAll(),closing=String(s.closing||'').trim(),sign=s.shop?'\n\n– '+s.shop:'';
 for(const k of platforms){const l=article.listings[k];if(!l||!l.description)continue;let d=l.description.replace(/📦 VERSAND & ANGEBOTE\n[^\n]*/,'📦 VERSAND & ANGEBOTE\n'+(closing||ST_DEF.closing));if(sign&&k!=='instagram'&&!d.endsWith(sign))d+=sign;l.description=d}showListing()}}
{const prevOpen=openStockDetail;openStockDetail=async function(id){await prevOpen(id);const ship=Number(stAll().shipping);if(ship>0&&$('stockSaleShipping'))$('stockSaleShipping').value=ship}}
{const prevBackup=$('backup').onclick;$('backup').onclick=async()=>{await prevBackup();sxSet('rv_last_backup',new Date().toISOString());stRenderMetrics()}}
// Ladenhüter-Grenze in der Bestandsübersicht
{const prevAna=v5Analytics;v5Analytics=function(items){prevAna(items);const days=Number(stAll().staleDays)||60;if(days===60)return;const n=items.filter(v5Available).map(v5Age).filter(x=>x!==null&&x>days).length,el=$('v5Analysis').querySelectorAll('.bx-m .dl')[2];if(el){el.textContent=n?n+' Artikel über '+days+' Tage':'↗ Alles frisch';el.className='dl '+(n?'warn':'')}}}

/* ---------- Oberfläche ---------- */
function stFmtAgo(iso){const t=Date.parse(iso||'');if(!Number.isFinite(t))return null;const d=Math.floor((Date.now()-t)/864e5);return d<=0?'Heute':d===1?'Gestern':'vor '+d+' Tagen'}
async function stStorage(){try{if(navigator.storage?.estimate){const e=await navigator.storage.estimate();return {used:e.usage||0,quota:e.quota||0}}}catch{}return null}
const stMB=b=>b>=1e9?(b/1e9).toLocaleString('de-DE',{maximumFractionDigits:1})+' GB':Math.max(0.1,b/1e6).toLocaleString('de-DE',{maximumFractionDigits:1})+' MB';
function stMetric(icon,label,value,delta,cls){return '<div class="bx-m st-m"><span class="mi">'+sxIcon(icon)+'</span><span class="tx"><span class="lbl">'+label+'</span><span class="val">'+sxEsc(value)+'</span><span class="dl '+(cls||'')+'">'+sxEsc(delta)+'</span></span></div>'}
async function stRenderMetrics(){const root=$('stMetrics');if(!root)return;const items=await allArticles(),st=await stStorage(),last=sxGet('rv_last_backup',''),ago=stFmtAgo(last),days=Number(stAll().backupDays)||0,old=last?Math.floor((Date.now()-Date.parse(last))/864e5):null;
 const hasPw=Boolean(rvAiPassword());
 root.innerHTML=stMetric('<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z"/>','Cloud-Sync',rvCloudPassword?'Verbunden':'Lokal',rvCloudPassword?'↗ Automatisch alle 30 s':'Nur auf diesem Gerät',rvCloudPassword?'':'nil')
  +stMetric('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>','KI',hasPw?'Bereit':'Passwort fehlt',rvProviderNames[getAiProvider()]||'KI',hasPw?'':'warn')
  +stMetric('<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>','Letztes Backup',ago||'Noch nie',ago?(days&&old>=days?'Erinnerung fällig':'↗ Datei gesichert'):'Jetzt sichern empfohlen',ago&&!(days&&old>=days)?'':'warn')
  +stMetric('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>','Speicher',st?stMB(st.used):items.length+' Artikel',items.length+' Artikel'+(st&&st.quota?' · '+Math.max(1,Math.round(st.used/st.quota*100))+' % belegt':''),'nil');
 $('stSubtitle').textContent=(stAll().shop||'Dein Kontrollzentrum')+' · '+items.length+' Artikel';}
function stFill(){const s=stAll();
 document.querySelectorAll('#settingsPage [data-st-key]').forEach(el=>{el.value=s[el.dataset.stKey]??''});
 $('stTemplate').value=$('template').value;
 const pf=$('stPlatforms');pf.replaceChildren();for(const [k,name] of SX_PLATFORMS){const l=document.createElement('label');l.className='sx-switch st-pf';l.innerHTML='<input type="checkbox"'+(s.platforms[k]?' checked':'')+'><span></span>'+name;l.querySelector('input').onchange=e=>{const p={...stAll().platforms,[k]:e.target.checked};if(!Object.values(p).some(Boolean)){e.target.checked=true;sxToast('Mindestens eine Plattform bleibt aktiv');return}stSave({platforms:p});sxToast(name+(e.target.checked?' aktiviert':' ausgeblendet'))};pf.append(l)}
 $('stRounding').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===s.rounding));
 sxRenderFees($('stFees'));
 $('stCoverAuto').checked=sxGet('rv_cover_auto','1')==='1';
 const bg=sxGet('rv_cover_bg','sand'),sw=$('stBg');sw.replaceChildren();for(const [key,[a,b,name]] of Object.entries(RVCutout.BACKDROPS)){const btn=document.createElement('button');btn.type='button';btn.title=name;btn.setAttribute('aria-label','Hintergrund '+name);btn.style.background='linear-gradient(180deg,'+a+','+b+')';btn.classList.toggle('on',key===bg);btn.onclick=()=>{sxSet('rv_cover_bg',key);stFill();sxToast('Standard-Hintergrund: '+name)};sw.append(btn)}
 const eng=sxEngineNow();$('stEngine').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.engine===eng));
 const view=sxGet('rv_stock_view','grid')==='list'?'list':'grid';$('stStockView').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));
 $('stAiToken').value=$('token').value||sessionStorage.getItem('rv_token')||'';
 updateAiConnectionLabels();stRenderPersist();stRenderInfo();stRenderMetrics();}
document.querySelectorAll('#settingsPage [data-st-key]').forEach(el=>el.addEventListener('change',()=>{stSave({[el.dataset.stKey]:el.value.trim()});sxToast('✓ Gespeichert');stRenderMetrics()}));
$('stTemplate').addEventListener('change',()=>{$('template').value=$('stTemplate').value;localStorage.setItem('fsflow_template',$('stTemplate').value);sxToast('✓ Vorlage gespeichert')});
$('stRounding').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;stSave({rounding:b.dataset.v});stFill();sxToast('Preisrundung: '+b.textContent)};
$('stCoverAuto').onchange=()=>{sxSet('rv_cover_auto',$('stCoverAuto').checked?'1':'0');sxToast($('stCoverAuto').checked?'Titelbild-Automatik an':'Titelbild-Automatik aus')};
$('stEngine').onclick=e=>{const b=e.target.closest('[data-engine]');if(!b)return;sxSet('rv_cutout_engine',b.dataset.engine);sxServerCutout=null;stFill();sxToast('Freisteller: '+b.textContent)};
$('stStockView').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;sxSet('rv_stock_view',b.dataset.v);v5List=b.dataset.v==='list';bxViewLabel();stFill();sxToast('Bestand startet als '+b.textContent)};
$('stAiToken').addEventListener('change',()=>{const v=$('stAiToken').value;$('token').value=v;if(v)sessionStorage.setItem('rv_token',v);else sessionStorage.removeItem('rv_token');updateAiConnectionLabels();stRenderMetrics()});
$('stAiTest').onclick=async()=>{const out=$('stAiResult'),btn=$('stAiTest');btn.disabled=true;out.innerHTML='<span>Teste Verbindung …</span>';
 const base=getAiEndpoint(),pw=rvAiPassword(),rows=[];const add=(ok,t)=>rows.push('<span class="'+(ok===true?'ok':ok===false?'miss':'')+'">'+(ok===true?'✓ ':ok===false?'○ ':'· ')+sxEsc(t)+'</span>');
 try{const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),12000);let r;try{r=await fetch(base+'/api/ping',{headers:{'X-RV-Password':pw||''},signal:ctrl.signal})}finally{clearTimeout(tm)}
  if(r.ok){add(true,'Server erreichbar');add(true,'Passwort korrekt')}else if(r.status===401){add(true,'Server erreichbar');add(false,pw?'Passwort falsch':'Passwort fehlt')}else if(r.status===503){add(true,'Server erreichbar');add(false,'RV_SYNC_PASSWORD auf dem Server fehlt')}else add(false,'Server antwortet mit '+r.status);
  if(r.ok){try{const c=await fetch(base+'/api/cutout',{headers:{'X-RV-Password':pw}});const j=await c.json().catch(()=>({}));add(c.ok&&j.available?true:null,c.ok&&j.available?'Freisteller: '+(j.provider==='photoroom'?'Photoroom':'remove.bg'):'Freisteller: auf dem Gerät (kein Dienst eingerichtet)');sxServerCutout=c.ok&&j.available?true:false}catch{add(null,'Freisteller: auf dem Gerät')}}
 }catch(e){add(false,'Server nicht erreichbar'+(e.name==='AbortError'?' (Zeitüberschreitung)':''))}
 out.innerHTML=rows.join('');btn.disabled=false;stRenderMetrics()};
$('settingsRestore').closest('label').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('settingsRestore').click()}});$('settingsRestore').closest('label').tabIndex=0;
function stCsvCell(v){v=v==null?'':String(v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
const stNum=v=>v===''||v==null||!Number.isFinite(Number(v))?'':Number(v).toFixed(2).replace('.',',');
$('stCsv').onclick=async()=>{const items=await allArticles(),head=['Artikelnummer','Marke','Modell','Kategorie','Größe','Farbe','Zustand','Status','Lagerplatz','Einkaufsdatum','Bezugsquelle','EK','Preis eBay','Preis Vinted','Preis Instagram','Verkauft über','Verkaufsdatum','Verkaufspreis','Gebühren','Versand','Gewinn'];
 const rows=items.map(a=>{const s=a.sale;return [a.sku,a.brand,a.model,a.category,a.size,a.color,a.condition,a.archivedAt?'Archiviert':a.articleStatus,a.location,a.purchaseDate,a.source,stNum(a.cost),stNum(a.prices?.ebay),stNum(a.prices?.vinted),stNum(a.prices?.instagram),s?.platform||'',s?.date?String(s.date).slice(0,10):'',stNum(s?.price),stNum(s?.fees),stNum(s?.shipping),s?stNum(Number(s.price||0)-Number(a.cost||0)-Number(s.fees||0)-Number(s.shipping||0)):'']});
 const csv='﻿'+[head,...rows].map(r=>r.map(stCsvCell).join(';')).join('\r\n');download(new Blob([csv],{type:'text/csv;charset=utf-8'}),'rv-studio-bestand-'+new Date().toISOString().slice(0,10)+'.csv');sxToast('✓ '+items.length+' Artikel exportiert')};
async function stRenderPersist(){const el=$('stPersistState');if(!navigator.storage?.persisted){el.textContent='Von diesem Browser nicht unterstützt';$('stPersist').disabled=true;return}const p=await navigator.storage.persisted();el.textContent=p?'✓ Geschützt – Browser löscht nichts automatisch':'Browser darf Daten bei Platzmangel löschen';$('stPersist').classList.toggle('done',p)}
$('stPersist').onclick=async()=>{try{const ok=await navigator.storage.persist();sxToast(ok?'✓ Speicher ist geschützt':'Browser hat den Schutz abgelehnt – App installieren hilft meist')}catch{sxToast('Nicht unterstützt')}stRenderPersist()};
let stInstallEvt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();stInstallEvt=e;$('stInstall').hidden=false});
$('stInstall').onclick=async()=>{if(!stInstallEvt)return;stInstallEvt.prompt();await stInstallEvt.userChoice.catch(()=>{});stInstallEvt=null;$('stInstall').hidden=true};
$('stReload').onclick=async()=>{try{const regs=await navigator.serviceWorker?.getRegistrations?.()||[];await Promise.all(regs.map(r=>r.update()));const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('rv-studio-')).map(k=>caches.delete(k)))}catch{}location.reload()};
async function stRenderInfo(){const items=await allArticles(),st=await stStorage(),standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 $('stInfoList').innerHTML=[['Version','V23'],['Artikel',items.length+' ('+items.filter(a=>String(a.id).startsWith('demo-')).length+' Beispiele)'],['Speicher',st?stMB(st.used)+' von '+stMB(st.quota):'unbekannt'],['Modus',standalone?'Installierte App':'Browser'],['Server',getAiEndpoint().replace(/^https?:\/\//,'')]].map(([k,v])=>'<div><small>'+k+'</small><strong>'+sxEsc(v)+'</strong></div>').join('')}
document.querySelectorAll('#settingsPage .st-nav [data-st]').forEach(b=>b.onclick=()=>{$(b.dataset.st).scrollIntoView({behavior:'smooth',block:'start'})});
if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)document.querySelectorAll('#settingsPage .st-nav [data-st]').forEach(b=>b.classList.toggle('on',b.dataset.st===e.target.id))},{rootMargin:'-35% 0px -55% 0px'});document.querySelectorAll('#settingsPage .st-sec').forEach(s=>io.observe(s))}
{const prevSettings=showSettings;showSettings=function(){prevSettings();stFill()}}
{const prevSyncSel=$('settingsAiApply').onclick;$('settingsAiApply').onclick=()=>{prevSyncSel&&prevSyncSel();sxToast('✓ KI-Einstellungen übernommen');stRenderMetrics()}}
// Backup-Erinnerung beim Start
setTimeout(()=>{const days=Number(stAll().backupDays)||0;if(!days)return;const last=Date.parse(sxGet('rv_last_backup',''));allArticles().then(items=>{if(!items.some(a=>!String(a.id).startsWith('demo-')))return;if(!Number.isFinite(last)||Date.now()-last>days*864e5)sxToast(Number.isFinite(last)?'Dein letztes Backup ist '+Math.floor((Date.now()-last)/864e5)+' Tage alt – Einstellungen › Daten':'Noch kein Backup – Einstellungen › Daten & Backup')}).catch(()=>{})},4000);
{const prevStep=showStep;showStep=function(n){if(n===1&&!stAll().platforms[activePlatform]){pull();activePlatform=SX_PLATFORMS.map(x=>x[0]).find(k=>stAll().platforms[k])||'ebay'}prevStep(n);if(n===1)showListing()}}
stApply();
// ===================== Insights V24 =====================
const IN_PF=[['ebay','eBay','#3a8ef0'],['vinted','Vinted','#2aa57a'],['instagram','Instagram','#cf7f2a']];
const IN_REV='#3a8ef0',IN_PRO='#2aa57a',DAY=864e5;
const inPfName=k=>(IN_PF.find(x=>x[0]===String(k||'').toLowerCase())||[0,k||'Sonstige'])[1];
const inPfColor=k=>(IN_PF.find(x=>x[0]===String(k||'').toLowerCase())||[0,0,'#7f8da8'])[2];
function inSaleTime(a){const t=Date.parse(a.sale?.date||'');return Number.isFinite(t)?t:null}
function inDays(a){const s=v5Date(a),e=inSaleTime(a);return s!==null&&e!==null&&e>=s?Math.round((e-s)/DAY):null}
function inStats(list){const rev=list.reduce((n,a)=>n+Number(a.sale.price||0),0),pro=list.reduce((n,a)=>n+bxProfit(a),0),cost=list.reduce((n,a)=>n+Number(a.sale.fees||0)+Number(a.sale.shipping||0),0),days=list.map(inDays).filter(x=>x!==null);
 return {rev,pro,cost,count:list.length,avg:list.length?rev/list.length:0,margin:rev?pro/rev:null,days:days.length?days.reduce((a,b)=>a+b,0)/days.length:null}}
function inDelta(cur,prev,fmt){if(prev===null||prev===undefined||!Number.isFinite(prev)||prev===0||cur===null)return ['Kein Vergleich','nil'];const d=(cur-prev)/Math.abs(prev);return [(d>=0?'↗ +':'↘ ')+Math.round(d*100)+' % '+fmt,d>=0?'':'neg']}
function inPeriod(){return sxGet('rv_insights_period','30')}
function inRange(all){const p=inPeriod(),now=Date.now();if(p==='all'){const ts=all.map(inSaleTime).filter(x=>x!==null);const start=ts.length?Math.min(...ts):now-30*DAY;return {start:new Date(new Date(start).getFullYear(),new Date(start).getMonth(),1).getTime(),end:now,prev:null,label:'Seit Beginn'}}
 const len=Number(p)*DAY,start=now-len;return {start,end:now,prev:[start-len,start],label:'Letzte '+(p==='365'?'12 Monate':p+' Tage')+' · Vergleich mit dem Zeitraum davor'}}
function inBuckets(r){const p=inPeriod(),out=[],d0=new Date(r.start);
 if(p==='7'||p==='30'){d0.setHours(0,0,0,0);for(let t=d0.getTime();t<=r.end;t+=DAY){const d=new Date(t);out.push({s:t,e:t+DAY,label:d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}),long:d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'long'})})}return out}
 if(p==='90'){d0.setHours(0,0,0,0);d0.setDate(d0.getDate()-((d0.getDay()+6)%7));for(let t=d0.getTime();t<=r.end;t+=7*DAY){const d=new Date(t);out.push({s:t,e:t+7*DAY,label:d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}),long:'Woche ab '+d.toLocaleDateString('de-DE',{day:'2-digit',month:'long'})})}return out}
 const m=new Date(d0.getFullYear(),d0.getMonth(),1);while(m.getTime()<=r.end){const s=m.getTime();m.setMonth(m.getMonth()+1);const d=new Date(s);out.push({s,e:m.getTime(),label:d.toLocaleDateString('de-DE',{month:'short'}),long:d.toLocaleDateString('de-DE',{month:'long',year:'numeric'})})}return out.slice(-36)}
function inNice(max){if(max<=0)return 10;const p=Math.pow(10,Math.floor(Math.log10(max))),f=max/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p}
const inEuroShort=v=>Math.abs(v)>=1000?(v/1000).toLocaleString('de-DE',{maximumFractionDigits:1})+' T€':Math.round(v)+' €';
function inRenderChart(sales,r){
 const bs=inBuckets(r);for(const b of bs){const l=sales.filter(a=>{const t=inSaleTime(a);return t>=b.s&&t<b.e});b.rev=l.reduce((n,a)=>n+Number(a.sale.price||0),0);b.pro=l.reduce((n,a)=>n+bxProfit(a),0);b.n=l.length}
 const W=Math.max(300,Math.round($('inChart').clientWidth||$('finance').clientWidth-64||800)),H=W<500?210:250,L=W<500?42:52,R=8,T=14,B=28,iw=W-L-R,ih=H-T-B;
 const top=inNice(Math.max(0,...bs.map(b=>Math.max(b.rev,b.pro)))),bottom=Math.min(0,...bs.map(b=>b.pro))<0?-inNice(-Math.min(...bs.map(b=>b.pro))):0;
 const y=v=>T+ih-(v-bottom)/(top-bottom)*ih,step=iw/bs.length,bw=Math.max(2,Math.min(26,step*.62));
 let g='';for(let i=0;i<=4;i++){const v=bottom+(top-bottom)*i/4,yy=y(v);g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy.toFixed(1)+'" y2="'+yy.toFixed(1)+'" class="'+(v===0?'zero':'grid')+'"/><text x="'+(L-8)+'" y="'+(yy+4).toFixed(1)+'" class="ax" text-anchor="end">'+inEuroShort(v)+'</text>'}
 const every=Math.ceil(bs.length/(W<500?5:8));let bars='',xl='',pts=[];
 bs.forEach((b,i)=>{const cx=L+step*i+step/2,y0=y(0),y1=y(b.rev),h=Math.max(0,y0-y1);if(h>0){const rr=Math.min(4,bw/2,h);bars+='<path class="bar" data-i="'+i+'" d="M'+(cx-bw/2).toFixed(1)+' '+y0.toFixed(1)+'V'+(y1+rr).toFixed(1)+'Q'+(cx-bw/2).toFixed(1)+' '+y1.toFixed(1)+' '+(cx-bw/2+rr).toFixed(1)+' '+y1.toFixed(1)+'H'+(cx+bw/2-rr).toFixed(1)+'Q'+(cx+bw/2).toFixed(1)+' '+y1.toFixed(1)+' '+(cx+bw/2).toFixed(1)+' '+(y1+rr).toFixed(1)+'V'+y0.toFixed(1)+'Z"/>'}
  if(i%every===0||i===bs.length-1&&bs.length<=8)xl+='<text x="'+cx.toFixed(1)+'" y="'+(H-8)+'" class="ax" text-anchor="middle">'+b.label+'</text>';pts.push([cx,y(b.pro)])});
 const line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const hits=bs.map((b,i)=>'<rect class="hit" data-i="'+i+'" x="'+(L+step*i).toFixed(1)+'" y="'+T+'" width="'+step.toFixed(1)+'" height="'+ih+'"/>').join('');
 const any=bs.some(b=>b.n);
 $('inChart').innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Umsatz und Gewinn je '+(bs.length>40?'Monat':'Abschnitt')+'"><g>'+g+'</g><g class="bars">'+bars+'</g><path class="line" d="'+line+'"/><line class="cross" x1="0" x2="0" y1="'+T+'" y2="'+(T+ih)+'" hidden/><circle class="dot" r="5" hidden/><g>'+xl+'</g><g class="hits">'+hits+'</g></svg><div class="in-tip" hidden></div>'+(any?'':'<p class="in-empty">Noch keine Verkäufe in diesem Zeitraum.</p>');
 const svg=$('inChart').querySelector('svg'),tip=$('inChart').querySelector('.in-tip'),cross=svg.querySelector('.cross'),dot=svg.querySelector('.dot');
 const show=i=>{const b=bs[i],[cx,cy]=pts[i];cross.setAttribute('x1',cx);cross.setAttribute('x2',cx);cross.hidden=false;dot.setAttribute('cx',cx);dot.setAttribute('cy',cy);dot.hidden=false;svg.querySelectorAll('.bar').forEach(x=>x.classList.toggle('on',x.dataset.i==i));
  tip.innerHTML='<b>'+sxEsc(b.long)+'</b><span><i class="sw rev"></i>Umsatz<em>'+euro(b.rev)+'</em></span><span><i class="sw pro"></i>Gewinn<em>'+euro(b.pro)+'</em></span><span><i></i>Verkäufe<em>'+b.n+'</em></span>';tip.hidden=false;
  const box=$('inChart').getBoundingClientRect(),px=cx/W*box.width;tip.style.left=Math.max(4,Math.min(box.width-tip.offsetWidth-4,px-tip.offsetWidth/2))+'px'};
 const hide=()=>{cross.hidden=true;dot.hidden=true;tip.hidden=true;svg.querySelectorAll('.bar.on').forEach(x=>x.classList.remove('on'))};
 svg.querySelectorAll('.hit').forEach(h=>{h.addEventListener('pointerenter',()=>show(+h.dataset.i));h.addEventListener('pointerdown',()=>show(+h.dataset.i))});svg.addEventListener('pointerleave',hide);
 $('inTable').innerHTML='<table><thead><tr><th>Zeitraum</th><th>Verkäufe</th><th>Umsatz</th><th>Gewinn</th></tr></thead><tbody>'+bs.filter(b=>b.n).reverse().map(b=>'<tr><td>'+sxEsc(b.long)+'</td><td>'+b.n+'</td><td>'+euro(b.rev)+'</td><td>'+euro(b.pro)+'</td></tr>').join('')+(any?'':'<tr><td colspan="4">Keine Verkäufe</td></tr>')+'</tbody></table>';
 $('inChartSub').textContent=bs.length+' '+(inPeriod()==='90'?'Wochen':inPeriod()==='7'||inPeriod()==='30'?'Tage':'Monate')+' · '+(sales.length?sales.length+' Verkäufe':'keine Verkäufe');
}
function inRenderPlatforms(sales){const tot=sales.reduce((n,a)=>n+Number(a.sale.price||0),0);const rows=IN_PF.map(([k,name,color])=>{const l=sales.filter(a=>String(a.sale.platform||'').toLowerCase()===k),s=inStats(l);return {k,name,color,...s}}).filter(r=>r.count||stAll().platforms[r.k]);
 const best=rows.filter(r=>r.count>=1).sort((a,b)=>(b.margin??-1)-(a.margin??-1))[0];
 $('inPlatforms').innerHTML=(tot?'<div class="in-stack" role="img" aria-label="Umsatzanteile">'+rows.filter(r=>r.rev>0).map(r=>'<i style="flex:'+r.rev+';background:'+r.color+'" title="'+r.name+' '+Math.round(r.rev/tot*100)+' %"></i>').join('')+'</div>':'')
  +rows.map(r=>'<div class="in-pf"><div class="hd"><span class="dot" style="background:'+r.color+'"></span><b>'+r.name+'</b>'+(best&&best.k===r.k&&rows.filter(x=>x.count).length>1?'<span class="badge">Beste Marge</span>':'')+'<em>'+(tot?Math.round(r.rev/tot*100):0)+' % Umsatz</em></div><div class="vals"><span><small>Verkäufe</small>'+r.count+'</span><span><small>Umsatz</small>'+euro(r.rev)+'</span><span><small>Gewinn</small><b class="'+(r.pro<0?'neg':'pos')+'">'+euro(r.pro)+'</b></span><span><small>Marge</small>'+(r.margin===null?'—':Math.round(r.margin*100)+' %')+'</span><span><small>Ø Tage</small>'+(r.days===null?'—':Math.round(r.days))+'</span></div></div>').join('')}
function inRenderGoal(all){const s=stAll(),goal=Number(s.goal)||0,type=s.goalType||'profit',now=new Date(),ms=new Date(now.getFullYear(),now.getMonth(),1).getTime(),dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(),day=now.getDate();
 const l=all.filter(a=>a.sale&&inSaleTime(a)>=ms),st=inStats(l),cur=type==='revenue'?st.rev:st.pro,forecast=cur/day*dim,pct=goal?Math.min(1,cur/goal):0,C=2*Math.PI*44;
 $('inGoalValue').value=goal||'';$('inGoalType').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===type));
 $('inGoalSub').textContent=now.toLocaleDateString('de-DE',{month:'long',year:'numeric'})+' · Tag '+day+' von '+dim;
 $('inGoal').innerHTML='<svg class="ring" viewBox="0 0 104 104" aria-hidden="true"><circle class="t" cx="52" cy="52" r="44"/><circle class="v" cx="52" cy="52" r="44" stroke="'+(pct>=1?IN_PRO:IN_REV)+'" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-pct)).toFixed(1)+'"/><text x="52" y="58" text-anchor="middle">'+(goal?Math.round(cur/goal*100)+'%':'—')+'</text></svg>'
  +'<div class="tx"><span class="lbl">'+(type==='revenue'?'Umsatz':'Gewinn')+' diesen Monat</span><span class="val">'+euro(cur)+'</span>'
  +(goal?'<span class="dl '+(forecast>=goal?'':'warn')+'">'+(cur>=goal?'✓ Ziel erreicht':'Noch '+euro(goal-cur)+' bis '+euro(goal))+'</span><span class="dl nil">Prognose bei aktuellem Tempo: '+euro(forecast)+'</span>':'<span class="dl nil">Lege unten ein Monatsziel fest.</span>')+'</div>'}
function inRenderCats(sales){const m=new Map();for(const a of sales){const k=String(a.category||'Ohne Kategorie');if(!m.has(k))m.set(k,[]);m.get(k).push(a)}
 const rows=[...m.entries()].map(([k,l])=>({k,...inStats(l)})).sort((a,b)=>b.pro-a.pro).slice(0,6),max=Math.max(1,...rows.map(r=>Math.abs(r.pro)));
 $('inCats').innerHTML=rows.length?rows.map(r=>'<div class="row" title="'+sxEsc(r.k)+': '+euro(r.pro)+' Gewinn aus '+r.count+' Verkäufen"><span class="nm">'+sxEsc(r.k)+'</span><span class="tr"><s style="width:'+Math.max(3,Math.abs(r.pro)/max*100)+'%"></s></span><span class="pc">'+euro(r.pro)+'</span><span class="sm">'+r.count+'× · '+(r.days===null?'—':Math.round(r.days)+' T')+'</span></div>').join(''):'<p class="in-empty">Noch keine Verkäufe in diesem Zeitraum.</p>'}
function inRenderBrands(sales,all){const m=new Map();for(const a of sales){const k=String(a.brand||'Ohne Marke').trim();if(!m.has(k))m.set(k,[]);m.get(k).push(a)}
 const avail=all.filter(v5Available),rows=[...m.entries()].map(([k,l])=>{const s=inStats(l),stock=avail.filter(a=>String(a.brand||'').trim()===k).length;return {k,...s,stock,thr:s.count/(s.count+stock)}}).sort((a,b)=>b.pro-a.pro).slice(0,6);
 $('inBrands').innerHTML=rows.length?'<table><thead><tr><th>Marke</th><th>Verk.</th><th>Gewinn</th><th>Abverkauf</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+sxEsc(r.k)+'</td><td>'+r.count+'</td><td class="'+(r.pro<0?'neg':'pos')+'">'+euro(r.pro)+'</td><td><span class="thr"><i style="width:'+Math.round(r.thr*100)+'%"></i></span>'+Math.round(r.thr*100)+' %</td></tr>').join('')+'</tbody></table><p class="sx-note">Abverkauf = verkauft ÷ (verkauft + noch im Lager).</p>':'<p class="in-empty">Noch keine Verkäufe in diesem Zeitraum.</p>'}
function inRenderStock(all){const avail=all.filter(v5Available),stale=Number(stAll().staleDays)||60,ages=avail.map(v5Age).filter(x=>x!==null),cap=avail.reduce((n,a)=>n+Number(a.cost||0),0),pot=avail.reduce((n,a)=>n+bxMaxPrice(a),0),old=ages.filter(x=>x>stale).length;
 $('inStockKpis').innerHTML=stMetric('<ellipse cx="12" cy="6" rx="6" ry="2.5"/><path d="M6 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6M6 10v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/>','Gebundenes Kapital',euro(cap),avail.length+' Artikel · Verkaufswert '+euro(pot),'nil')
  +stMetric('<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>','Ø Lagerdauer',ages.length?Math.round(ages.reduce((a,b)=>a+b,0)/ages.length)+' Tage':'—',ages.length?'Ältester Artikel '+Math.max(...ages)+' Tage':'Noch keine Daten','nil')
  +stMetric('<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>','Ladenhüter',String(old),old?'über '+stale+' Tage im Lager':'↗ Keine über '+stale+' Tage',old?'warn':'');
 const B=[['0–30 Tage',0,30,'#9fc8f5'],['31–60 Tage',31,60,'#5fa3ef'],['61–90 Tage',61,90,'#2f78d6'],['über 90 Tage',91,1e9,'#1d4f99']].map(([n,lo,hi,c])=>[n,ages.filter(d=>d>=lo&&d<=hi).length,c]),tot=ages.length||1;
 $('inAge').innerHTML='<div class="in-agebar" role="img" aria-label="Altersstruktur des Bestands">'+B.filter(b=>b[1]).map(([n,c,col])=>'<i style="flex:'+c+';background:'+col+'" title="'+n+': '+c+' Artikel"></i>').join('')+'</div><div class="in-agelegend">'+B.map(([n,c,col])=>'<span><i style="background:'+col+'"></i>'+n+'<b>'+c+'</b><em>'+Math.round(c/tot*100)+' %</em></span>').join('')+'</div>'}
function inTips(sales,all){const tips=[],avail=all.filter(v5Available),stale=Number(stAll().staleDays)||60;
 const pf=IN_PF.map(([k,name])=>({name,...inStats(sales.filter(a=>String(a.sale.platform||'').toLowerCase()===k))})).filter(r=>r.count>=2&&r.margin!==null).sort((a,b)=>b.margin-a.margin);
 if(pf.length>=2)tips.push(['<path d="M3 17l6-6 4 4 8-8"/>',pf[0].name+' bringt die beste Marge','Ø '+Math.round(pf[0].margin*100)+' % gegenüber '+Math.round(pf[pf.length-1].margin*100)+' % bei '+pf[pf.length-1].name+'. Stelle neue Artikel zuerst dort ein.']);
 const cm=new Map();for(const a of sales){const d=inDays(a);if(d===null)continue;const k=a.category||'Ohne Kategorie';if(!cm.has(k))cm.set(k,[]);cm.get(k).push(d)}
 const fast=[...cm.entries()].filter(([,l])=>l.length>=2).map(([k,l])=>[k,l.reduce((a,b)=>a+b,0)/l.length]).sort((a,b)=>a[1]-b[1])[0];
 if(fast)tips.push(['<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',fast[0]+' verkaufen sich am schnellsten','Im Schnitt nach '+Math.round(fast[1])+' Tagen. Beim nächsten Einkauf mehr davon mitnehmen.']);
 const old=avail.filter(a=>(v5Age(a)??-1)>stale);if(old.length)tips.push(['<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',old.length+(old.length===1?' Artikel liegt':' Artikel liegen')+' über '+stale+' Tage','Darin stecken '+euro(old.reduce((n,a)=>n+Number(a.cost||0),0))+' Einkauf. Preis senken, neu einstellen oder bündeln.',['Älteste zuerst',()=>{showStep(4);setTimeout(()=>{v6ShowFilter('');$('v5Sort').value='days';renderLibrary()},60)}]]);
 if(sales.length>=5){const wd=Array(7).fill(0);sales.forEach(a=>wd[new Date(inSaleTime(a)).getDay()]++);const i=wd.indexOf(Math.max(...wd)),names=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];tips.push(['<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>','Dein stärkster Verkaufstag: '+names[i],wd[i]+' von '+sales.length+' Verkäufen. Neue Artikel am Vorabend einstellen bringt frische Sichtbarkeit.'])}
 const drafts=avail.filter(a=>a.articleStatus==='Entwurf');if(drafts.length)tips.push(['<path d="M4 20h4L19 9l-4-4L4 16z"/>',drafts.length+(drafts.length===1?' Entwurf wartet':' Entwürfe warten'),'Fertig gestellt könnten sie '+euro(drafts.reduce((n,a)=>n+bxMaxPrice(a),0)||drafts.reduce((n,a)=>n+Number(a.cost||0)*2,0))+' bringen.',['Öffnen',()=>{showStep(4);setTimeout(()=>{const b=document.querySelector('[data-stock-filter="draft"]');b&&b.click()},60)}]]);
 const st=inStats(sales);if(st.rev>0&&st.cost/st.rev>.15)tips.push(['<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>','Gebühren und Versand fressen '+Math.round(st.cost/st.rev*100)+' % vom Umsatz','Prüfe Versandoptionen oder kalkuliere die Kosten über den Preisrechner im Studio mit ein.']);
 if(!tips.length)tips.push(['<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>','Mehr Daten, bessere Tipps','Sobald ein paar Verkäufe erfasst sind, erscheinen hier Empfehlungen aus deinen eigenen Zahlen.']);
 const root=$('inTips');root.replaceChildren();for(const [ic,t,d,act] of tips){const c=document.createElement('div');c.className='in-tipcard';c.innerHTML='<span class="mi">'+sxIcon(ic)+'</span><div><b>'+sxEsc(t)+'</b><p>'+sxEsc(d)+'</p></div>';if(act){const b=document.createElement('button');b.type='button';b.className='sx-btn';b.textContent=act[0];b.onclick=act[1];c.append(b)}root.append(c)}}
function inRenderSales(sales){const list=[...sales].sort((a,b)=>inSaleTime(b)-inSaleTime(a)),root=$('inSales');root.replaceChildren();$('inSalesSub').textContent=list.length?list.length+(list.length===1?' Verkauf':' Verkäufe')+' im Zeitraum':'Keine Verkäufe im Zeitraum';
 for(const a of list.slice(0,12)){const b=document.createElement('button');b.type='button';b.className='in-sale';const p=bxProfit(a);
  b.innerHTML=(rvThumb(a)?'<img src="'+sxEsc(rvThumb(a))+'" alt="" loading="lazy">':'<span class="ph">RV</span>')+'<span class="nm"><b>'+sxEsc([a.brand,a.model].filter(Boolean).join(' ')||a.sku||'Artikel')+'</b><small><i style="background:'+inPfColor(a.sale.platform)+'"></i>'+sxEsc(inPfName(a.sale.platform))+' · '+new Date(inSaleTime(a)).toLocaleDateString('de-DE')+(inDays(a)!==null?' · nach '+inDays(a)+' T':'')+'</small></span><span class="pr"><b>'+euro(a.sale.price)+'</b><small class="'+(p<0?'neg':'pos')+'">'+(p>=0?'+':'')+euro(p)+'</small></span>';
  b.onclick=()=>openStockDetail(a.id);root.append(b)}
 if(list.length>12){const m=document.createElement('p');m.className='sx-hint';m.textContent='+ '+(list.length-12)+' weitere – vollständige Liste über „Tabelle exportieren“.';root.append(m)}}
async function inRender(){const all=await allArticles(),sales=all.filter(a=>a.sale&&a.articleStatus==='Verkauft'&&inSaleTime(a)!==null),r=inRange(all);
 const cur=sales.filter(a=>{const t=inSaleTime(a);return t>=r.start&&t<=r.end}),prev=r.prev?sales.filter(a=>{const t=inSaleTime(a);return t>=r.prev[0]&&t<r.prev[1]}):null,c=inStats(cur),p=prev?inStats(prev):null;
 $('inPeriod').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.p===inPeriod()));$('inRangeLabel').textContent=r.label;
 const sold=cur.length,avail=all.filter(v5Available).length,thr=sold+avail?sold/(sold+avail):0;
 const k=[['<ellipse cx="12" cy="6" rx="6" ry="2.5"/><path d="M6 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6M6 10v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4M6 14v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/>','Umsatz',euro(c.rev),p&&inDelta(c.rev,p.rev,'')],
  ['<path d="M5 20v-5M10 20V11M15 20V6M20 20V3"/>','Gewinn',euro(c.pro),p&&inDelta(c.pro,p.pro,'')],
  ['<path d="M3 4h2.5l2 11h10.5l2-8H7"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>','Verkäufe',String(c.count),p&&inDelta(c.count,p.count,'')],
  ['<path d="M6 18 18 6"/><circle cx="7.5" cy="7.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>','Ø Marge',c.margin===null?'—':Math.round(c.margin*100)+' %',p&&p.margin!==null&&c.margin!==null?[(c.margin>=p.margin?'↗ +':'↘ ')+Math.round((c.margin-p.margin)*100)+' Pkt.',c.margin>=p.margin?'':'neg']:null],
  ['<path d="M3 12V4h8l9 9-8 8-9-9Z"/><circle cx="7.5" cy="8.5" r="1.5"/>','Ø Verkaufspreis',c.count?euro(c.avg):'—',p&&inDelta(c.avg,p.avg,'')],
  ['<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>','Ø Tage bis Verkauf',c.days===null?'—':Math.round(c.days)+' Tage',p&&p.days!==null&&c.days!==null?[(c.days<=p.days?'↗ ':'↘ ')+Math.abs(Math.round(c.days-p.days))+' Tage '+(c.days<=p.days?'schneller':'langsamer'),c.days<=p.days?'':'neg']:null],
  ['<path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/>','Gebühren & Versand',euro(c.cost),[c.rev?Math.round(c.cost/c.rev*100)+' % vom Umsatz':'—','nil']],
  ['<path d="M4 12a8 8 0 1 0 8-8"/><path d="M12 4v8l5 3"/>','Abverkaufsquote',Math.round(thr*100)+' %',[sold+' verkauft · '+avail+' im Lager','nil']]];
 $('inKpis').innerHTML=k.map(([ic,l,v,d])=>stMetric(ic,l,v,(d||['Kein Vergleich'])[0],(d||[0,'nil'])[1])).join('');
 $('inSubtitle').textContent=(stAll().shop?stAll().shop+' · ':'')+sales.length+' Verkäufe insgesamt · '+euro(sales.reduce((n,a)=>n+bxProfit(a),0))+' Gewinn';
 inRenderChart(cur,r);inRenderPlatforms(cur);inRenderGoal(all);inRenderCats(cur);inRenderBrands(cur,all);inRenderStock(all);inTips(cur,all);inRenderSales(cur)}
showFinance=async function(){hidePrimaryViews();$('finance').classList.remove('hidden');selectBottomNav('navFinance');window.scrollTo(0,0);await inRender()};
$('inPeriod').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;sxSet('rv_insights_period',b.dataset.p);inRender()};
$('inTableBtn').onclick=()=>{const on=$('inTable').hidden;$('inTable').hidden=!on;$('inChart').hidden=on;$('inTableBtn').setAttribute('aria-pressed',String(on));$('inTableBtn').textContent=on?'Diagramm':'Tabelle'};
$('inGoalValue').addEventListener('change',()=>{stSave({goal:Math.max(0,Number($('inGoalValue').value)||0)});inRender()});
$('inGoalType').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;stSave({goalType:b.dataset.v});inRender()};
$('inCsv').onclick=()=>$('stCsv').click();
{let rz=0,lastW=0;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if($('finance').classList.contains('hidden'))return;const w=$('inChart').clientWidth;if(Math.abs(w-lastW)>40){lastW=w;inRender()}},250)})}
// ===================== KI-Chat V25 =====================
const CH_KEY='rv_chat_v1',CH_MAX=60;
const CH_QUICK=[['<path d="M3 12 12 3h8v8l-9 9-8-8Z"/><circle cx="16" cy="8" r="1.3"/>','Bestand bewerten','Was ist gut, was liegt zu lange?','Bewerte meinen aktuellen Bestand: Was läuft gut, was liegt zu lange, wo sollte ich handeln?'],
 ['<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>','Preise prüfen','Welche Preise anpassen?','Welche meiner Preise sollte ich anpassen? Begründe kurz pro Artikel.'],
 ['<path d="M7 3h7l4 4v14H7V3Z"/><path d="M14 3v4h4M9.5 12h6M9.5 16h6"/>','Verkaufstext','Für den neuesten Artikel','Schreibe einen Verkaufstext für meinen neuesten Artikel im Bestand.'],
 ['<path d="M5 20V13M10 20V9M15 20V5M20 20V11"/>','Sortiment-Analyse','Stärken und Lücken','Analysiere mein Sortiment anhand meiner Verkäufe: Welche Kategorien und Marken lohnen sich?'],
 ['<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>','Lager optimieren','Ladenhüter & Kapital','Wie kann ich mein Lager optimieren und gebundenes Kapital freisetzen?'],
 ['<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>','Woche planen','Konkrete To-dos','Plane meine Reselling-Woche mit konkreten Aufgaben, basierend auf meinem Bestand.'],
 ['<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>','Ideen & Strategien','Für mehr Umsatz','Gib mir Ideen und Strategien für mehr Umsatz mit meinem Reselling-Business.']];
const CH_CMDS=[['Bestand öffnen','Öffne den Bestand'],['Entwürfe zeigen','Zeige meine offenen Entwürfe'],['Neuer Artikel','Neuen Artikel anlegen'],['Gewinn & Insights','Zeig mir meinen Gewinn'],['Backup erstellen','Backup erstellen'],['Synchronisieren','Synchronisieren']];
const CH_CTX_ASK=[['Was ist er wert?','Was ist ein realistischer Verkaufspreis für diesen Artikel auf eBay, Vinted und Instagram?'],['Text für Vinted','Schreibe einen Vinted-Text für diesen Artikel.'],['Schneller verkaufen','Wie verkaufe ich diesen Artikel schneller?']];
const CH_FOLLOW=['Konkreter, bitte','Als kurze Stichpunkte','Was mache ich als Erstes?'];
let chPendingCtx=null,chWelcome=null;
let chHistory=(()=>{try{return JSON.parse(localStorage.getItem(CH_KEY)||'[]')}catch{return []}})(),chTyping=false,chCtxId=null,chLastUser='';
function chSave(){try{localStorage.setItem(CH_KEY,JSON.stringify(chHistory.slice(-CH_MAX)))}catch{}}
function chFormat(text){const lines=sxEsc(text).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').split('\n');let out='',list=null;
 for(const raw of lines){const ln=raw.trim(),ul=ln.match(/^[-•*]\s+(.*)/),ol=ln.match(/^\d+[.)]\s+(.*)/);
  if(ul||ol){const t=ul?'ul':'ol';if(list!==t){if(list)out+='</'+list+'>';out+='<'+t+'>';list=t}out+='<li>'+(ul||ol)[1]+'</li>';continue}
  if(list){out+='</'+list+'>';list=null}out+=ln?'<p>'+ln+'</p>':''}
 if(list)out+='</'+list+'>';return out}
function chTime(t){return new Date(t).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}
function chRender(){const feed=$('chFeed');if(!feed)return;feed.replaceChildren();
 if(!rvAiPassword()){const s=document.createElement('div');s.className='ch-setup';s.innerHTML='<span class="mi">'+sxIcon('<path d="M9 7H6a4 4 0 0 0 0 8h3M15 7h3a4 4 0 0 1 0 8h-3M8 11h8"/>')+'</span><div><b>KI verbinden</b><p>Für Antworten der KI brauchst du dein RV-Passwort (nur für diese Sitzung). App-Befehle funktionieren auch ohne.</p><div class="sx-row"><input type="password" id="chPw" placeholder="RV-Studio-Passwort" autocomplete="current-password"><button type="button" class="sx-btn" id="chPwGo">Verbinden</button><button type="button" class="sx-btn" id="chPwSet">Einstellungen</button></div></div>';feed.append(s);
  s.querySelector('#chPwGo').onclick=()=>{const v=s.querySelector('#chPw').value.trim();if(!v)return;$('token').value=v;sessionStorage.setItem('rv_token',v);updateAiConnectionLabels();chRender();sxToast('✓ Passwort für diese Sitzung gesetzt')};
  s.querySelector('#chPwSet').onclick=()=>{showSettings();setTimeout(()=>$('stKi').scrollIntoView({behavior:'smooth'}),80)}}
 if(!chHistory.length){if(!chWelcome){chWelcome=document.createElement('div');chWelcome.className='ch-welcome';chWelcome.innerHTML='<div class="ch-orb" id="ccChatBot" aria-hidden="true"></div><b class="hi"></b><p>Ich kenne deinen Bestand und deine Verkäufe. Frag mich nach Preisen, Texten oder Strategien – oder häng einen Artikel an.</p>'}chWelcome.querySelector('.hi').textContent=stAll().name?'Hallo '+stAll().name+'! 👋':'Hallo! 👋';feed.append(chWelcome)}
 for(const [i,m] of chHistory.entries()){const row=document.createElement('div');row.className='ch-msg '+(m.role==='user'?'me':'ai')+(m.local?' local':'')+(m.error?' err':'');
  const body=m.role==='user'?'<p>'+sxEsc(m.text).replace(/\n/g,'<br>')+'</p>':m.html?m.text:chFormat(m.text);
  row.innerHTML=(m.role==='user'?'':'<span class="ch-av" aria-hidden="true">'+sxIcon('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>')+'</span>')+'<div class="ch-bubble">'+(m.ctx?'<span class="ch-tag">'+sxIcon('<path d="M3 12V4h8l9 9-8 8-9-9Z"/>')+sxEsc(m.ctx)+'</span>':'')+body+'<div class="ch-meta"><small>'+(m.role==='user'?'Du':sxEsc(m.label||'KI'))+' · '+chTime(m.t)+'</small>'+(m.role!=='user'&&!m.local&&!m.error?'<button type="button" class="ch-act" data-copy="'+i+'">'+sxIcon('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>')+'Kopieren</button>':'')+(m.error&&chLastUser?'<button type="button" class="ch-act" data-retry="1">Erneut senden</button>':'')+'</div></div>';
  feed.append(row)}
 if(chTyping){const t=document.createElement('div');t.className='ch-msg ai';t.innerHTML='<span class="ch-av" aria-hidden="true">'+sxIcon('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>')+'</span><div class="ch-bubble ch-typing" aria-label="KI schreibt"><i></i><i></i><i></i></div>';feed.append(t)}
 feed.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>sxCopy(chHistory[+b.dataset.copy].text,b));
 feed.querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>chSend(chLastUser));
 const last=chHistory[chHistory.length-1],fol=$('chFollow');fol.replaceChildren();
 if(last&&last.role!=='user'&&!last.local&&!last.error&&!chTyping)for(const f of CH_FOLLOW){const b=document.createElement('button');b.type='button';b.textContent=f;b.onclick=()=>chSend(f);fol.append(b)}
 $('chSub').textContent=(rvProviderNames[getAiProvider()]||'KI')+' · '+(chHistory.length?chHistory.filter(m=>m.role==='user').length+' Fragen in diesem Chat':'Dein Partner für Bestand, Preise und Texte');
 if(!$('aiChat').classList.contains('hidden'))requestAnimationFrame(()=>{const r=feed.lastElementChild;if(r&&chHistory.length)r.scrollIntoView({block:'nearest',behavior:'smooth'})});
}
{const prevHM=homeMessage;homeMessage=function(role,text,opts={}){const el=prevHM(role,text,opts);const s=String(text);
 if(role!=='user'&&/^Ich frage .+ an …$/.test(s))return el;
 const local=opts.label==='RV lokal'||/^RV lokal/.test(opts.label||''),error=role!=='user'&&/^(KI-Anfrage fehlgeschlagen|RV-Passwort fehlt|Der KI-Endpunkt|Eine KI-Anfrage läuft)/.test(s);
 chHistory.push({role,text:s,html:role!=='user'&&!opts.plain,local,error,label:local?'RV App':opts.label||(rvProviderNames[getAiProvider()]||'KI'),t:Date.now(),ctx:role==='user'?chPendingCtx:null});chPendingCtx=null;chHistory=chHistory.slice(-CH_MAX);chSave();chRender();return el}}
{const prevClear=clearHomeFeed;clearHomeFeed=function(){prevClear();chHistory=[];chSave();chRender()}}
document.addEventListener('rv:ai-state',e=>{const st=e.detail.state;chTyping=st==='busy';chRender()});
function chHistoryText(){return chHistory.filter(m=>!m.local&&!m.error).slice(-6).map(m=>(m.role==='user'?'Nutzer: ':'Assistent: ')+String(m.text).replace(/<[^>]+>/g,'').slice(0,500)).join('\n')}
const CH_LOCAL=/^(öffne|zeig|zeige|starte|mach|erstelle\s+(ein\s+)?backup|backup|sync|synchronisier|neuen?\s+artikel|neues?\s+(produkt|listing))/i;
async function chSend(raw){const text=String(raw??$('chatInput').value).trim();if(!text)return;chLastUser=text;$('chatInput').value='';chAutosize();
 if(CH_LOCAL.test(text)){runHomeAi(text);return}
 let extra='',display=text;if(chCtxId){const a=(await allArticles()).find(x=>x.id===chCtxId);if(a){const f=v=>String(v??'').slice(0,240);
  extra='\n\nBezogen auf diesen Artikel aus meinem Bestand: '+JSON.stringify({sku:f(a.sku),marke:f(a.brand),modell:f(a.model),kategorie:f(a.category),groesse:f(a.size),farbe:f(a.color),material:f(a.material),zustand:f(a.condition),maengel:f(a.notes),masse:f(a.measurements),ek:Number(a.cost)||0,preise:a.prices||{},status:f(a.articleStatus),tageImLager:v5Age(a),verkauft:a.sale?{preis:a.sale.price,plattform:a.sale.platform}:null});
  chPendingCtx=[a.brand,a.model].filter(Boolean).join(' ')||a.sku||'Artikel'}}
 runHomeAi(text,{remote:true,withData:true,extra,display,history:chHistoryText()})}
$('chatSend').onclick=()=>chSend();
$('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();e.stopImmediatePropagation();chSend()}},true);
function chAutosize(){const t=$('chatInput');t.style.height='auto';t.style.height=Math.min(160,t.scrollHeight)+'px'}
$('chatInput').addEventListener('input',chAutosize);
$('chatClear').onclick=()=>{if(chHistory.length&&!confirm('Neuen Chat beginnen? Der bisherige Verlauf wird gelöscht.'))return;clearHomeFeed();chSetCtx(null)};
{const q=$('chQuick');for(const [ic,t,s,ask] of CH_QUICK){const b=document.createElement('button');b.type='button';b.className='ch-q';b.innerHTML='<span class="mi">'+sxIcon(ic)+'</span><span class="tx"><b>'+t+'</b><small>'+s+'</small></span>'+sxIcon('<path d="m9 5 7 7-7 7"/>');b.onclick=()=>chSend(ask);q.append(b)}
 const c=$('chCmds');for(const [t,cmd] of CH_CMDS){const b=document.createElement('button');b.type='button';b.textContent=t;b.onclick=()=>runHomeAi(cmd);c.append(b)}}
/* Artikel als Kontext */
async function chSetCtx(id){chCtxId=id;const box=$('chCtx');if(!id){box.hidden=true;box.replaceChildren();return}
 const a=(await allArticles()).find(x=>x.id===id);if(!a){chSetCtx(null);return}
 box.hidden=false;box.innerHTML=(rvThumb(a)?'<img src="'+sxEsc(rvThumb(a))+'" alt="">':'')+'<span class="nm"><b>'+sxEsc([a.brand,a.model].filter(Boolean).join(' ')||a.sku||'Artikel')+'</b><small>'+sxEsc([a.sku,a.size&&'Gr. '+a.size,a.articleStatus].filter(Boolean).join(' · '))+'</small></span><span class="asks"></span><button type="button" class="ch-x" aria-label="Artikel entfernen">×</button>';
 const asks=box.querySelector('.asks');for(const [t,q] of CH_CTX_ASK){const b=document.createElement('button');b.type='button';b.textContent=t;b.onclick=()=>chSend(q);asks.append(b)}
 box.querySelector('.ch-x').onclick=()=>chSetCtx(null)}
async function chPickerRender(){const term=$('chPickerSearch').value.trim().toLowerCase(),items=(await allArticles()).filter(a=>!a.archivedAt).filter(a=>!term||[a.sku,a.brand,a.model,a.category,a.size].join(' ').toLowerCase().includes(term)).reverse().slice(0,40),root=$('chPickerList');root.replaceChildren();
 if(!items.length){root.innerHTML='<p class="sx-hint">Keine passenden Artikel.</p>';return}
 for(const a of items){const b=document.createElement('button');b.type='button';b.className='ch-pick';b.innerHTML=(rvThumb(a)?'<img src="'+sxEsc(rvThumb(a))+'" alt="" loading="lazy">':'<span class="ph">RV</span>')+'<span class="nm"><b>'+sxEsc([a.brand,a.model].filter(Boolean).join(' ')||a.sku||'Artikel')+'</b><small>'+sxEsc([a.sku,a.category,a.size&&'Gr. '+a.size].filter(Boolean).join(' · '))+'</small></span><span class="st">'+sxEsc(a.articleStatus||'Entwurf')+'</span>';b.onclick=()=>{chSetCtx(a.id);$('chPicker').hidden=true;$('chatInput').focus()};root.append(b)}}
$('chCtxBtn').onclick=()=>{$('chPicker').hidden=false;$('chPickerSearch').value='';chPickerRender();setTimeout(()=>$('chPickerSearch').focus(),50)};
$('chPickerSearch').addEventListener('input',chPickerRender);
$('chPickerClose').onclick=()=>{$('chPicker').hidden=true};
$('chPicker').addEventListener('click',e=>{if(e.target===$('chPicker'))$('chPicker').hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('chPicker').hidden)$('chPicker').hidden=true});
// Aus der Artikelakte: „KI fragen“
{const prevOpenCh=openStockDetail;openStockDetail=async function(id){await prevOpenCh(id);let b=$('chAskArticle');if(!b){b=document.createElement('button');b.type='button';b.id='chAskArticle';b.className='btn secondary';b.textContent='✦ KI zu diesem Artikel fragen';const head=document.querySelector('#stockSheet .sheet-header');head&&head.after(b)}b.onclick=()=>{const sid=stockSelectedId;closeStockDetail();showChat();chSetCtx(sid)}}}
{const prevShowChat=showChat;showChat=function(){prevShowChat();$('chatInput').placeholder=innerWidth<560?'Frag mich etwas …':'Frag nach Preisen, Texten, Strategien …';chRender();chAutosize();if(matchMedia('(hover:hover)').matches)setTimeout(()=>$('chatInput').focus(),120)}}
chRender();
// ===================== Kopfmenü V26 (ersetzt das untere Menü) =====================
const TOP_MAP={navHome:'home',navStudio:'studio',navStock:'stock',navPurchases:'purchases',navSales:'sales',navFinance:'sales',navChat:'chat',navSettings:'settings'};
function topActive(key){document.querySelectorAll('#rvTop [data-nav]').forEach(b=>{const on=b.dataset.nav===key;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 $('rvTopSub').textContent=key==='home'?'Dein Reselling Command Center':'‹ Zur Startseite';$('rvTopHome').setAttribute('aria-current',key==='home'?'page':'false')}
{const prevSel=selectBottomNav;selectBottomNav=function(id){prevSel(id);topActive(id==='navStock'&&v5Tab==='purchases'?'purchases':TOP_MAP[id]||'')}}
{const prevTab=v5SetTab;v5SetTab=function(tab){prevTab(tab);if(!$('s4').classList.contains('hidden'))topActive(tab==='purchases'?'purchases':'stock')}}
const TOP_GO={
 studio:()=>{showStep(step>=0&&step<=3?step:0)},
 stock:()=>{showStep(4);if(v5Tab!=='all')v5SetTab('all');topActive('stock')},
 purchases:()=>{showStep(4);v5SetTab('purchases');topActive('purchases')},
 sales:()=>showFinance(),chat:()=>showChat(),settings:()=>showSettings()};
document.querySelectorAll('#rvTop [data-nav]').forEach(b=>b.onclick=()=>{TOP_GO[b.dataset.nav]&&TOP_GO[b.dataset.nav]();window.scrollTo(0,0)});
$('rvTopHome').onclick=()=>{showHome();window.scrollTo(0,0)};
// ===================== Startseite V27 =====================
// Lebende Teile der alten Startseite (Globus, KI-Kugel, KI-Eingabe) in die neue Startseite umziehen.
{const mv=(sel,to)=>{const e=document.querySelector(sel),t=$(to);if(e&&t)t.append(e)};
 mv('#v11Root .v15-globe-wrap','hmGlobe');mv('#v11Root .v15-bot-frame','hmOrb');mv('#homeAiFeed','hmFeedSlot');mv('#v16AiState','hmAiStateSlot');
 const entry=$('hmEntry'),old=document.querySelector('#v11Root .rv-crafted-chat');if(old&&entry){['v16Mic','homeAiInput','homeAiSend'].forEach(id=>{const e=$(id);if(e)entry.append(e)});old.remove()}}
const HM_QUICK=[['photo','<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>','Artikel fotografieren'],['new','<path d="M12 5v14M5 12h14"/>','Neuen Artikel anlegen'],['purchases','<path d="M3 4h2.5l2 11h10.5l2-8H7"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>','Einkauf erfassen'],['sell','<path d="M3 12V4h8l9 9-8 8-9-9Z"/><circle cx="7.5" cy="8.5" r="1.5"/>','Artikel verkaufen'],['scan','<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8"/>','Barcode scannen'],['stats','<path d="M5 20v-5M10 20V11M15 20V6M20 20V3"/>','Statistiken anzeigen']];
const HM_PROMPTS=[['Artikel bewerten','Bewerte meinen aktuellen Bestand'],['Verkaufstext','Erstelle einen Verkaufstext für meinen neuesten Artikel'],['Preisempfehlung','Welche Preise soll ich anpassen?'],['Lager optimieren','Wie kann ich mein Lager optimieren?'],['Ideen & Strategien','Gib mir Ideen und Strategien für mein Reselling-Business']];
const hmName=a=>[a.brand,a.model].filter(Boolean).join(' ')||[a.brand,a.category].filter(Boolean).join(' ')||a.sku||'Artikel';
const hmImg=a=>rvThumb(a)?'<img src="'+sxEsc(rvThumb(a))+'" alt="" loading="lazy">':'<span class="ph">RV</span>';
function hmWhen(t){const d=new Date(t),now=new Date(),day=Math.round((new Date(now.getFullYear(),now.getMonth(),now.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/DAY),hm=d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});return day===0?'Heute, '+hm:day===1?'Gestern, '+hm:day<7?d.toLocaleDateString('de-DE',{weekday:'long'}):d.toLocaleDateString('de-DE')}
function hmRange(p){const now=Date.now();if(p==='today'){const s=new Date();s.setHours(0,0,0,0);return {s:s.getTime(),e:now,prev:[s.getTime()-DAY,s.getTime()]}}if(p==='all')return {s:0,e:now,prev:null};const len=Number(p)*DAY;return {s:now-len,e:now,prev:[now-2*len,now-len]}}
function hmSeries(sales,p,f){const now=Date.now(),n=p==='today'?6:p==='7'?7:p==='30'?10:12,out=Array(n).fill(0);let start;
 if(p==='today'){const s=new Date();s.setHours(0,0,0,0);start=s.getTime()}else if(p==='all'){const ts=sales.map(inSaleTime).filter(x=>x!==null);start=ts.length?Math.min(...ts):now-DAY}else start=now-Number(p)*DAY;
 const step=Math.max(1,(now-start)/n);for(const a of sales){const t=inSaleTime(a);if(t===null||t<start)continue;out[Math.min(n-1,Math.floor((t-start)/step))]+=f(a)}return out}
function hmGo(k){({stock:()=>TOP_GO.stock(),insights:()=>showFinance(),chat:()=>showChat()})[k]?.();window.scrollTo(0,0)}
function hmOld(go){const b=document.querySelector('#v11Root [data-go="'+go+'"]');if(b)b.click()}
async function hmRender(){if(!$('hmRoot'))return;const all=await allArticles(),sales=all.filter(a=>a.sale&&a.articleStatus==='Verkauft'&&inSaleTime(a)!==null),avail=all.filter(a=>v5Available(a)&&!a.archivedAt);
 const p=sxGet('rv_home_period','30'),r=hmRange(p),cur=sales.filter(a=>{const t=inSaleTime(a);return t>=r.s&&t<=r.e}),prev=r.prev?sales.filter(a=>{const t=inSaleTime(a);return t>=r.prev[0]&&t<r.prev[1]}):null,c=inStats(cur),pv=prev?inStats(prev):null;
 $('hmPeriod').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
 const kp=[['<ellipse cx="12" cy="6" rx="6" ry="2.5"/><path d="M6 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6M6 10v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4M6 14v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/>','Umsatz',euro(c.rev),pv&&inDelta(c.rev,pv.rev,''),hmSeries(cur,p,a=>Number(a.sale.price)||0)],
  ['<path d="M3 4h2.5l2 11h10.5l2-8H7"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>','Verkäufe',String(c.count),pv&&inDelta(c.count,pv.count,''),hmSeries(cur,p,()=>1)],
  ['<path d="M5 20v-5M10 20V11M15 20V6M20 20V3"/>','Gewinn',euro(c.pro),pv&&inDelta(c.pro,pv.pro,''),hmSeries(cur,p,a=>bxProfit(a))],
  ['<path d="M3 12V4h8l9 9-8 8-9-9Z"/><circle cx="7.5" cy="8.5" r="1.5"/>','Ø Verkaufspreis',c.count?euro(c.avg):'—',pv&&inDelta(c.avg,pv.avg,''),null]];
 $('hmKpis').innerHTML=kp.map(([ic,l,v,d,ser])=>'<div class="st-m hm-m'+(ser?' has-spark':'')+'"><span class="mi">'+sxIcon(ic)+'</span><span class="tx"><span class="lbl">'+l+'</span><span class="val">'+sxEsc(v)+'</span><span class="dl '+((d||[0,'nil'])[1])+'">'+sxEsc((d||[p==='all'?'Gesamt':'Kein Vergleich'])[0])+'</span></span>'+(ser?bxSpark(ser):'')+'</div>').join('');
 const cm=new Map();for(const a of cur){const k=a.category||'Sonstiges';cm.set(k,(cm.get(k)||0)+Number(a.sale.price||0))}const tot=[...cm.values()].reduce((x,y)=>x+y,0),top=[...cm.entries()].sort((x,y)=>y[1]-x[1]).slice(0,5);
 $('hmCats').innerHTML='<div class="hd"><b>Top Kategorien</b><small>% vom Umsatz</small></div>'+(top.length?top.map(([k,v])=>'<div class="row"><span class="nm">'+sxEsc(k)+'</span><span class="tr"><s style="width:'+Math.max(4,Math.round(v/tot*100))+'%"></s></span><span class="pc">'+Math.round(v/tot*100)+' %</span></div>').join(''):'<p class="hm-empty">Noch keine Verkäufe in diesem Zeitraum.</p>');
 const online=avail.filter(a=>a.articleStatus==='Online').length,worth=avail.reduce((n,a)=>n+(bxMaxPrice(a)||Number(a.cost)||0),0);
 $('hmActive').innerHTML='<span class="mi">'+sxIcon('<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16"/>')+'</span><span class="tx"><span class="lbl">Aktive Angebote</span><span class="val">'+online+'</span></span>';
 $('hmWorth').innerHTML='<span class="mi">'+sxIcon('<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>')+'</span><span class="tx"><span class="lbl">Lagerwert (geschätzt)</span><span class="val">'+euro(worth)+'</span></span>';
 // Neueste Artikel & Verkäufe
 const byNew=[...all].filter(a=>!a.archivedAt).sort((x,y)=>(Date.parse(y.createdAt||y.purchaseDate||0)||0)-(Date.parse(x.createdAt||x.purchaseDate||0)||0)).slice(0,4);
 $('hmNew').innerHTML=byNew.length?byNew.map(a=>'<button type="button" class="hm-row" data-open="'+sxEsc(a.id)+'">'+hmImg(a)+'<span class="nm"><b>'+sxEsc(hmName(a))+'</b><small>'+sxEsc([a.size&&'Gr. '+a.size,a.location].filter(Boolean).join(' · ')||a.category||'')+'</small></span><span class="pr"><b>'+(bxMaxPrice(a)?euro(bxMaxPrice(a)):'—')+'</b><small class="st" data-s="'+bxStatusKey(a)+'">'+sxEsc(a.articleStatus||'Entwurf')+'</small></span>'+sxIcon('<path d="m9 5 7 7-7 7"/>')+'</button>').join(''):'<p class="hm-empty">Noch keine Artikel. Starte im Studio mit deinem ersten Produkt.</p>';
 const bySale=[...sales].sort((x,y)=>inSaleTime(y)-inSaleTime(x)).slice(0,4);
 $('hmSales').innerHTML=bySale.length?bySale.map(a=>{const pr=bxProfit(a);return '<button type="button" class="hm-row" data-open="'+sxEsc(a.id)+'">'+hmImg(a)+'<span class="nm"><b>'+sxEsc(hmName(a))+'</b><small><i style="background:'+inPfColor(a.sale.platform)+'"></i>'+sxEsc(inPfName(a.sale.platform))+(a.size?' · Gr. '+sxEsc(a.size):'')+'</small></span><span class="pr"><b class="pos">'+euro(a.sale.price)+'</b><small>'+hmWhen(inSaleTime(a))+'</small></span>'+sxIcon('<path d="m9 5 7 7-7 7"/>')+'</button>'}).join(''):'<p class="hm-empty">Noch keine Verkäufe erfasst.</p>';
 // Kategorien mit Bild
 const cg=new Map();for(const a of avail){const k=a.category||'Sonstiges';if(!cg.has(k))cg.set(k,[]);cg.get(k).push(a)}
 const cats=[...cg.entries()].sort((x,y)=>y[1].length-x[1].length).slice(0,6);
 $('hmCatTiles').innerHTML=cats.length?cats.map(([k,l])=>{const pic=l.find(a=>rvThumb(a));return '<button type="button" class="hm-cattile" data-cat="'+sxEsc(k)+'">'+(pic?'<img src="'+sxEsc(rvThumb(pic))+'" alt="" loading="lazy">':'<span class="ph">RV</span>')+'<b>'+sxEsc(k)+'</b><small>'+l.length+' Artikel</small></button>'}).join(''):'<p class="hm-empty">Noch keine Artikel im Lager.</p>';
 hmRenderPerf(all,sales);hmRenderTasks(all,sales,avail);hmRenderTrends(sales);
 $('homeAiInput').placeholder=innerWidth<560?'Frag mich etwas …':'Frag deinen KI-Assistenten …';$('hmAiHello').textContent=stAll().name?'Hallo '+stAll().name+'! 👋':'Hallo! 👋';
 document.querySelectorAll('#hmRoot [data-open]').forEach(b=>b.onclick=()=>openStockDetail(b.dataset.open));
 document.querySelectorAll('#hmCatTiles [data-cat]').forEach(b=>b.onclick=()=>{TOP_GO.stock();$('searchArticles').value=b.dataset.cat;renderLibrary()});
}
let hmSeriesOn={rev:true,pro:true};
function hmRenderPerf(all,sales){const p=sxGet('rv_home_perf','30'),days=Number(p),now=new Date();now.setHours(0,0,0,0);const start=now.getTime()-(days-1)*DAY,pts=[];let rev=0,pro=0;
 for(let i=0;i<days;i++){const s=start+i*DAY,e=s+DAY,l=sales.filter(a=>{const t=inSaleTime(a);return t>=s&&t<e});rev+=l.reduce((n,a)=>n+Number(a.sale.price||0),0);pro+=l.reduce((n,a)=>n+bxProfit(a),0);pts.push({s,rev,pro,n:l.length})}
 $('hmPerfPeriod').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
 const host=$('hmChart'),W=Math.max(300,Math.round(host.clientWidth||600)),H=W<500?190:230,L=W<500?44:52,R=10,T=12,B=26,iw=W-L-R,ih=H-T-B;
 const vis=[['rev','Umsatz','#3a8ef0'],['pro','Gewinn','#2aa57a']].filter(([k])=>hmSeriesOn[k]);
 const top=inNice(Math.max(1,...pts.flatMap(q=>vis.map(([k])=>q[k])))),bot=Math.min(0,...pts.map(q=>hmSeriesOn.pro?q.pro:0))<0?-inNice(-Math.min(...pts.map(q=>q.pro))):0;
 const x=i=>L+(days===1?iw/2:i*iw/(days-1)),y=v=>T+ih-(v-bot)/(top-bot)*ih;
 let g='';for(let i=0;i<=4;i++){const v=bot+(top-bot)*i/4;g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'" class="'+(v===0?'zero':'grid')+'"/><text x="'+(L-8)+'" y="'+(y(v)+4).toFixed(1)+'" class="ax" text-anchor="end">'+inEuroShort(v)+'</text>'}
 const every=Math.ceil(days/(W<500?4:7));let xl='';pts.forEach((q,i)=>{if(i%every===0)xl+='<text x="'+x(i).toFixed(1)+'" y="'+(H-7)+'" class="ax" text-anchor="middle">'+new Date(q.s).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+'</text>'});
 let lines='';for(const [k,,col] of vis){const d=pts.map((q,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(q[k]).toFixed(1)).join(' ');lines+='<path d="'+d+' L'+x(days-1).toFixed(1)+' '+y(bot).toFixed(1)+' L'+x(0).toFixed(1)+' '+y(bot).toFixed(1)+'Z" fill="'+col+'" opacity=".12"/><path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'}
 const step=iw/Math.max(1,days-1);
 host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Umsatz und Gewinn kumuliert, letzte '+days+' Tage">'+g+lines+xl+'<line class="cross" x1="0" x2="0" y1="'+T+'" y2="'+(T+ih)+'" hidden/>'+vis.map(([k,,col])=>'<circle class="dot" data-k="'+k+'" r="4.5" fill="'+col+'" hidden/>').join('')+pts.map((q,i)=>'<rect class="hit" data-i="'+i+'" x="'+(x(i)-step/2).toFixed(1)+'" y="'+T+'" width="'+step.toFixed(1)+'" height="'+ih+'"/>').join('')+'</svg><div class="in-tip" hidden></div>';
 const svg=host.querySelector('svg'),tip=host.querySelector('.in-tip'),cross=svg.querySelector('.cross');
 svg.querySelectorAll('.hit').forEach(h=>{const show=()=>{const i=+h.dataset.i,q=pts[i];cross.setAttribute('x1',x(i));cross.setAttribute('x2',x(i));cross.hidden=false;svg.querySelectorAll('.dot').forEach(dt=>{dt.setAttribute('cx',x(i));dt.setAttribute('cy',y(q[dt.dataset.k]));dt.hidden=false});
  tip.innerHTML='<b>bis '+new Date(q.s).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'long'})+'</b><span><i class="sw rev"></i>Umsatz<em>'+euro(q.rev)+'</em></span><span><i class="sw pro"></i>Gewinn<em>'+euro(q.pro)+'</em></span><span><i></i>Verkäufe am Tag<em>'+q.n+'</em></span>';tip.hidden=false;const bw=host.getBoundingClientRect().width;tip.style.left=Math.max(4,Math.min(bw-tip.offsetWidth-4,x(i)/W*bw-tip.offsetWidth/2))+'px'};h.addEventListener('pointerenter',show);h.addEventListener('pointerdown',show)});
 svg.addEventListener('pointerleave',()=>{cross.hidden=true;tip.hidden=true;svg.querySelectorAll('.dot').forEach(dt=>dt.hidden=true)});
 const last=pts[pts.length-1]||{rev:0,pro:0},nSales=pts.reduce((n,q)=>n+q.n,0),nNew=all.filter(a=>{const t=Date.parse(a.createdAt||a.purchaseDate||'');return Number.isFinite(t)&&t>=start}).length;
 $('hmLegend').innerHTML=[['rev','Umsatz',euro(last.rev),'#3a8ef0',true],['pro','Gewinn',euro(last.pro),'#2aa57a',true],['n','Verkäufe',String(nSales),null,false],['a','Neue Artikel',String(nNew),null,false]].map(([k,l,v,col,tg])=>tg?'<label class="hm-lg"><input type="checkbox" data-k="'+k+'"'+(hmSeriesOn[k]?' checked':'')+'><i style="background:'+col+'"></i><span>'+l+'</span><b>'+v+'</b></label>':'<div class="hm-lg"><i class="nil"></i><span>'+l+'</span><b>'+v+'</b></div>').join('');
 $('hmLegend').querySelectorAll('input').forEach(c=>c.onchange=()=>{hmSeriesOn[c.dataset.k]=c.checked;if(!hmSeriesOn.rev&&!hmSeriesOn.pro){hmSeriesOn[c.dataset.k]=true;c.checked=true}hmRenderPerf(all,sales)})}
function hmStock(){$('searchArticles').value='';TOP_GO.stock()}
function hmRenderTasks(all,sales,avail){const stale=Number(stAll().staleDays)||60,days=Number(stAll().backupDays)||0,last=Date.parse(sxGet('rv_last_backup',''));
 const T=[[avail.filter(a=>a.articleStatus==='Entwurf').length,'Entwürfe fertigstellen','Fotos, Texte oder Preise fehlen',()=>{hmStock();setTimeout(()=>{const b=document.querySelector('[data-stock-filter="draft"]');b&&b.click()},60)}],
  [avail.filter(a=>a.articleStatus==='Bereit').length,'Bereite Artikel einstellen','Fertig, aber noch nicht online',()=>{hmStock();setTimeout(()=>{$('searchArticles').value='';v6ShowFilter('');renderLibrary()},60)}],
  [all.filter(a=>a.sale&&!a.shippedAt).length,'Versand bestätigen','Verkauft, aber noch nicht als versendet markiert',()=>{hmStock();setTimeout(()=>v6ShowFilter('sale'),60)}],
  [all.filter(a=>!a.archivedAt&&stockRemoveNeeded(a)).length,'Listings entfernen','Auf anderen Plattformen noch online',()=>{hmStock();setTimeout(()=>{const b=document.querySelector('[data-stock-filter="remove"]');b&&b.click()},60)}],
  [avail.filter(a=>(v5Age(a)??-1)>stale).length,'Ladenhüter prüfen','Länger als '+stale+' Tage im Lager',()=>{hmStock();setTimeout(()=>{v6ShowFilter('');$('v5Sort').value='days';renderLibrary()},60)}],
  [avail.filter(a=>v6Missing(a).length).length,'Angaben ergänzen','Artikel mit fehlenden Angaben',()=>{hmStock();setTimeout(()=>v6ShowFilter('incomplete'),60)}],
  [days&&(!Number.isFinite(last)||Date.now()-last>days*DAY)&&all.some(a=>!String(a.id).startsWith('demo-'))?1:0,'Backup erstellen',Number.isFinite(last)?'Letztes Backup '+stFmtAgo(new Date(last).toISOString()):'Noch kein Backup',()=>$('backup').click()]].filter(t=>t[0]);
 const root=$('hmTasks');root.replaceChildren();if(!T.length){root.innerHTML='<p class="hm-empty">Alles erledigt – nichts offen. 🎉</p>';return}
 for(const [n,t,s,fn] of T.slice(0,5)){const b=document.createElement('button');b.type='button';b.className='hm-task';b.innerHTML='<span class="ck" aria-hidden="true"></span><span class="nm"><b>'+t+'</b><small>'+s+'</small></span><span class="bd">'+n+'</span>'+sxIcon('<path d="m9 5 7 7-7 7"/>');b.onclick=()=>{fn();window.scrollTo(0,0)};root.append(b)}}
function hmRenderTrends(sales){const now=Date.now(),cur=sales.filter(a=>inSaleTime(a)>=now-30*DAY),prev=sales.filter(a=>{const t=inSaleTime(a);return t>=now-60*DAY&&t<now-30*DAY});
 const key=a=>String(a.brand||a.category||'Ohne Marke').trim(),m=new Map();for(const a of cur){const k=key(a);if(!m.has(k))m.set(k,{n:0,rev:0,prev:0,wk:Array(6).fill(0)});const o=m.get(k);o.n++;o.rev+=Number(a.sale.price||0);const w=Math.min(5,Math.floor((now-inSaleTime(a))/(5*DAY)));o.wk[5-w]++}
 for(const a of prev){const o=m.get(key(a));if(o)o.prev++}
 const rows=[...m.entries()].sort((x,y)=>y[1].rev-x[1].rev).slice(0,4),root=$('hmTrends');
 if(!rows.length){root.innerHTML='<p class="hm-empty">Sobald du in den letzten 30 Tagen verkaufst, siehst du hier deine stärksten Marken.</p>';return}
 root.innerHTML=rows.map(([k,o])=>{const d=o.prev?Math.round((o.n-o.prev)/o.prev*100):null,max=Math.max(1,...o.wk),pts=o.wk.map((v,i)=>(i*12).toFixed(0)+','+(22-v/max*18).toFixed(1)).join(' ');
  const pic=sales.find(a=>key(a)===k&&rvThumb(a));return '<div class="hm-trend">'+(pic?'<img src="'+sxEsc(rvThumb(pic))+'" alt="" loading="lazy">':'<span class="ph">RV</span>')+'<span class="nm"><b>'+sxEsc(k)+'</b><small>'+o.n+(o.n===1?' Verkauf':' Verkäufe')+' · '+euro(o.rev)+'</small></span><svg class="sp" viewBox="0 0 60 24" aria-hidden="true"><polyline points="'+pts+'" fill="none" stroke="#2aa57a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg><span class="dl '+(d===null?'new':d<0?'neg':'')+'">'+(d===null?'neu':(d>=0?'+':'')+d+' %')+'</span></div>'}).join('')}
$('hmQuick').innerHTML=HM_QUICK.map(([k,ic,l])=>'<button type="button" class="bx-q hm-q" data-q="'+k+'"><span class="ic">'+sxIcon(ic)+'</span><span class="lb">'+l+'</span></button>').join('');
$('hmQuick').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const k=b.dataset.q;if(k==='new'){article=blank();sxCoverMsg='';push();showStep(0)}else if(k==='purchases')TOP_GO.purchases();else hmOld(k)});
$('hmPrompts').innerHTML='';for(const [l,q] of HM_PROMPTS){const b=document.createElement('button');b.type='button';b.textContent=l;b.onclick=()=>document.dispatchEvent(new CustomEvent('rv:ai-request',{detail:{message:q}}));$('hmPrompts').append(b)}
$('hmPeriod').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;sxSet('rv_home_period',b.dataset.p);hmRender()};
$('hmPerfPeriod').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;sxSet('rv_home_perf',b.dataset.p);hmRender()};
document.querySelectorAll('#hmRoot [data-hm-go]').forEach(b=>b.onclick=()=>hmGo(b.dataset.hmGo));
{const prevRH=renderHome;renderHome=async function(){await prevRH();await hmRender()}}
{let rz=0,lw=0;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if($('home').classList.contains('hidden'))return;const w=$('hmChart').clientWidth;if(Math.abs(w-lw)>40){lw=w;hmRender()}},250)})}
// ===================== Snipes V30 (Vinted-Funde mit Gewinnbewertung) =====================
// Abgefragt wird ausschließlich vom eigenen Gerät über ein Userscript (deine Sitzung, nur lesend, ohne Tarnung).
// Bei Sperre (403/429) pausiert die Abfrage und wird länger, sie versucht nichts zu umgehen.
const SN_KEY='rv_snipe_v1',SN_DEF={minProfit:15,minMargin:40,inShip:3.9,sellFee:5,interval:75,domain:'de',auto:true,notify:true};
const SN_DOMAINS=['de','at','fr','nl','pl','it','es','co.uk'];
let SN={searches:[],hits:[],seen:{},cfg:{...SN_DEF}},snTab='snipes',snBridge=false,snSeq=0,snBusy=false,snTimer=0,snBack=0,snBlockedUntil=0;
const snReq=new Map(),snSleep=ms=>new Promise(r=>setTimeout(r,ms));
function snLoad(){try{const v=JSON.parse(sxGet(SN_KEY,'{}'))||{};SN={searches:Array.isArray(v.searches)?v.searches:[],hits:Array.isArray(v.hits)?v.hits:[],seen:v.seen&&typeof v.seen==='object'?v.seen:{},cfg:{...SN_DEF,...(v.cfg||{})}}}catch{}
 if(!SN_DOMAINS.includes(SN.cfg.domain))SN.cfg.domain='de'}
function snPersist(){const ids=Object.keys(SN.seen);if(ids.length>3000)for(const k of ids.slice(0,ids.length-2000))delete SN.seen[k];SN.hits=SN.hits.slice(0,150);sxSet(SN_KEY,JSON.stringify(SN))}
const snMedian=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const snNum=v=>{const n=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0};
function snUserscript(){const o=location.origin;return `// ==UserScript==
// @name         RV Studio – Vinted-Abfrage
// @namespace    rv-studio
// @version      1.0
// @description  Fragt Vinted-Suchen für deine RV-Studio-App ab. Nur lesend, mit deiner eigenen Sitzung.
// @match        ${o}/*
// @grant        GM_xmlhttpRequest
// @connect      vinted.de
// @connect      vinted.at
// @connect      vinted.fr
// @connect      vinted.nl
// @connect      vinted.pl
// @connect      vinted.it
// @connect      vinted.es
// @connect      vinted.co.uk
// ==/UserScript==
(function () {
  'use strict';
  var OK = /^https:\\/\\/www\\.vinted\\.(de|at|fr|nl|pl|it|es|co\\.uk)\\/api\\/v2\\/catalog\\/items\\?/;
  function reply(id, status, text) { window.postMessage({ rvSnipe: 'res', id: id, status: status, text: text }, location.origin); }
  function hello() { window.postMessage({ rvSnipe: 'hello', v: 1 }, location.origin); }
  window.addEventListener('message', function (e) {
    if (e.source !== window || e.origin !== location.origin || !e.data) return;
    var d = e.data;
    if (d.rvSnipe === 'ping') { hello(); return; }
    if (d.rvSnipe !== 'req') return;
    if (typeof d.url !== 'string' || !OK.test(d.url)) { reply(d.id, 0, ''); return; }
    GM_xmlhttpRequest({
      method: 'GET', url: d.url, headers: { Accept: 'application/json' }, timeout: 20000,
      onload: function (r) { reply(d.id, r.status, r.responseText); },
      onerror: function () { reply(d.id, 0, ''); },
      ontimeout: function () { reply(d.id, 0, ''); }
    });
  });
  hello();
})();
`}
window.addEventListener('message',e=>{if(e.source!==window||e.origin!==location.origin)return;const d=e.data;if(!d||typeof d!=='object')return;
 if(d.rvSnipe==='hello'){snBridge=true;snRenderLink();snState()}
 else if(d.rvSnipe==='res'){const f=snReq.get(d.id);if(f){snReq.delete(d.id);f(d)}}});
const snPing=()=>window.postMessage({rvSnipe:'ping'},location.origin);
function snAsk(url){return new Promise((ok,no)=>{if(!snBridge)return no(Error('nobridge'));const id=++snSeq,t=setTimeout(()=>{snReq.delete(id);no(Error('timeout'))},25000);snReq.set(id,d=>{clearTimeout(t);ok(d)});window.postMessage({rvSnipe:'req',id,url},location.origin)})}
function snUrl(s){const q=new URLSearchParams({search_text:s.q,order:'newest_first',per_page:'40',page:'1'});if(s.max>0)q.set('price_to',String(s.max));return 'https://www.vinted.'+SN.cfg.domain+'/api/v2/catalog/items?'+q}
function snNorm(it){const p=it&&it.price,price=snNum(p&&typeof p==='object'?p.amount:p),ph=it&&it.photo||{},dom=SN.cfg.domain;
 let url=String(it&&it.url||'');if(url&&!/^https:\/\//.test(url))url='https://www.vinted.'+dom+(url.startsWith('/')?'':'/')+url;
 if(!/^https:\/\/www\.vinted\.[a-z.]+\//.test(url))url=it&&it.id?'https://www.vinted.'+dom+'/items/'+it.id:'';
 let img=String(ph.url||ph.full_size_url||'');if(!/^https:\/\//.test(img))img='';
 return {id:String(it&&it.id||''),title:String(it&&it.title||'').slice(0,120),price,brand:String(it&&it.brand_title||'').slice(0,40),size:String(it&&it.size_title||'').slice(0,20),status:String(it&&it.status||'').slice(0,30),img,url}}
async function snOwnMedian(q){const words=q.toLowerCase().split(/\s+/).filter(w=>w.length>1);if(!words.length)return null;
 const prices=(await allArticles()).filter(a=>a.articleStatus==='Verkauft'&&a.sale&&Number(a.sale.price)>0&&words.every(w=>[a.brand,a.model,a.category,a.listings?.vinted?.title,a.listings?.ebay?.title].join(' ').toLowerCase().includes(w))).map(a=>Number(a.sale.price));
 return prices.length>=2?snMedian(prices):null}
const snBuyCost=(price)=>price+0.7+0.05*price+SN.cfg.inShip;
function snRate(price,est){const buy=snBuyCost(price),profit=est*(1-SN.cfg.sellFee/100)-buy;return {profit,margin:buy>0?profit/buy:0}}
async function snRunSearch(s,silent){
 const r=await snAsk(snUrl(s));
 if([401,403,429].includes(r.status))throw Object.assign(Error('blocked'),{status:r.status});
 if(r.status!==200)throw Error('Antwort '+(r.status||'ohne Verbindung'));
 let j;try{j=JSON.parse(r.text)}catch{throw Error('Antwort nicht lesbar')}
 const all=(Array.isArray(j.items)?j.items:[]).map(snNorm).filter(x=>x.id&&x.price>0);
 const sz=String(s.size||'').toLowerCase().trim(),items=sz?all.filter(x=>x.size.toLowerCase().split(/[\s/,]+/).includes(sz)||x.size.toLowerCase().includes(sz)):all;
 let est=null,src='';
 if(s.resale>0){est=s.resale;src='dein Wert'}
 else{const own=await snOwnMedian(s.q);if(own){est=own;src='deine Verkäufe'}else if(all.length>=8){est=snMedian(all.map(x=>x.price))*0.85;src='Marktmedian'}}
 let added=0;
 for(const x of items){if(SN.seen[x.id])continue;SN.seen[x.id]=1;
  const rt=est?snRate(x.price,est):{profit:0,margin:0},snipe=!!est&&rt.profit>=SN.cfg.minProfit&&rt.margin>=SN.cfg.minMargin/100;
  const h={...x,sid:s.id,sname:s.q,est:est?Math.round(est):0,src,profit:rt.profit,margin:rt.margin,snipe,found:Date.now(),isNew:!silent};
  SN.hits.unshift(h);added++;if(snipe&&!silent)snAlert(h)}
 return {added,total:items.length}}
function snAlert(h){try{navigator.vibrate&&navigator.vibrate([120,60,120])}catch{}
 sxToast('🎯 Snipe: '+h.title.slice(0,36)+' · '+euro(h.price)+' → +'+euro(h.profit));
 if(!SN.cfg.notify||typeof Notification==='undefined'||Notification.permission!=='granted')return;
 const opt={body:euro(h.price)+' · Gewinn ca. '+euro(h.profit)+' ('+Math.round(h.margin*100)+' %)',icon:'/icons/icon-192.png',tag:'sn-'+h.id,data:{url:h.url}};
 try{navigator.serviceWorker?.getRegistration().then(r=>r?r.showNotification('Snipe: '+h.title.slice(0,50),opt):new Notification('Snipe: '+h.title.slice(0,50),opt))}catch{}}
function snLog(t){const el=$('snLog');if(el)el.textContent=t}
function snState(){const el=$('snState');if(!el)return;const act=SN.searches.some(s=>s.active);
 const st=Date.now()<snBlockedUntil?'wait':(SN.cfg.auto&&snBridge&&act?'on':'off');el.dataset.s=st;el.textContent=st==='on'?'Läuft':st==='wait'?'Pausiert':'Aus'}
function snSchedule(ms){clearTimeout(snTimer);if(!SN.cfg.auto)return;const base=Math.max(45,SN.cfg.interval)*1000;snTimer=setTimeout(snTick,ms??base*(0.8+Math.random()*0.5))}
async function snTick(){if(document.hidden||Date.now()<snBlockedUntil){snSchedule(Date.now()<snBlockedUntil?snBlockedUntil-Date.now()+1000:undefined);return}await snRunAll()}
async function snRunAll(manual){
 if(snBusy)return;const act=SN.searches.filter(s=>s.active);
 if(!act.length){if(manual)snLog('Lege zuerst einen aktiven Suchauftrag an.');snSchedule();return}
 if(Date.now()<snBlockedUntil){if(manual)snLog('Vinted hat zuletzt abgelehnt. Pause noch '+Math.ceil((snBlockedUntil-Date.now())/60000)+' Min.');snSchedule(snBlockedUntil-Date.now()+1000);return}
 if(!snBridge){snPing();await snSleep(500);if(!snBridge){snLog('Userscript nicht verbunden. Installiere es unten und lade die Seite neu.');snState();snSchedule();return}}
 snBusy=true;snLog('Frage ab …');let added=0,err='';
 try{for(let i=0;i<act.length;i++){const s=act[i];
  try{const r=await snRunSearch(s,!s.seeded);s.seeded=true;added+=r.added;snBack=0}
  catch(e){if(e.status){snBack=Math.min(snBack?snBack*2:5,30);snBlockedUntil=Date.now()+snBack*60000;err='Vinted hat die Abfrage abgelehnt ('+e.status+'). Ich pausiere '+snBack+' Min. und versuche nichts zu umgehen.';break}err='Fehler bei „'+s.q+'“: '+e.message}
  if(i<act.length-1)await snSleep(4000+Math.random()*5000)}}
 finally{snBusy=false;snPersist();snRender();snState();
  snLog(err||('Zuletzt '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+' · '+added+' neue Treffer'));
  snSchedule(snBack&&Date.now()<snBlockedUntil?snBlockedUntil-Date.now()+1000:undefined)}}
function snEl(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function snCard(h){const c=snEl('article','sn-hit'+(h.snipe?' snipe':'')+(h.isNew?' new':''));
 if(h.img){const im=snEl('img','sn-img');im.src=h.img;im.alt='';im.loading='lazy';im.referrerPolicy='no-referrer';c.append(im)}else c.append(snEl('div','sn-img'));
 const b=snEl('div','sn-body');b.append(snEl('h3','',h.title||'Ohne Titel'));
 b.append(snEl('div','sn-meta',[h.brand,h.size,h.status].filter(Boolean).join(' · ')||h.sname));
 const n=snEl('div','sn-nums');n.append(snEl('span','sn-price',euro(h.price)));
 if(h.est){const p=snEl('span','sn-profit'+(h.profit<0?' bad':''),(h.profit>=0?'+':'')+euro(h.profit)+' · '+Math.round(h.margin*100)+' %');n.append(p);n.append(snEl('span','sn-est','Verkauf ca. '+euro(h.est)+' ('+h.src+')'))}
 else n.append(snEl('span','sn-est','Keine Bewertung möglich'));
 b.append(n);const a=snEl('div','sn-act');
 if(h.url){const l=snEl('a','go','Öffnen');l.href=h.url;l.target='_blank';l.rel='noopener noreferrer';a.append(l)}
 const sv=snEl('button',h.saved?'on':'',h.saved?'★ Gemerkt':'☆ Merken');sv.type='button';sv.onclick=()=>{h.saved=!h.saved;snPersist();snRender()};
 const bg=snEl('button','','Gekauft');bg.type='button';bg.onclick=()=>snBought(h);
 const rm=snEl('button','','×');rm.type='button';rm.title='Ausblenden';rm.setAttribute('aria-label','Ausblenden');rm.onclick=()=>{SN.hits=SN.hits.filter(x=>x!==h);snPersist();snRender()};
 a.append(sv,bg,rm);b.append(a);c.append(b);return c}
function snRender(){const root=$('snHits');if(!root)return;
 document.querySelectorAll('#snTabs [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===snTab));
 let list=SN.hits.filter(h=>!h.bought);
 if(snTab==='snipes')list=list.filter(h=>h.snipe).sort((a,b)=>b.profit-a.profit);else if(snTab==='saved')list=list.filter(h=>h.saved);
 list=list.slice(0,60);root.replaceChildren(...list.map(snCard));
 const em=$('snEmpty');em.hidden=list.length>0;
 em.textContent=!SN.searches.length?'Lege unten einen Suchauftrag an, zum Beispiel „Nike Tech Fleece“ mit Höchstpreis 40 €.':snTab==='snipes'?'Noch keine Snipes. Sobald ein Fund deine Regeln (Mindestgewinn und Marge) erfüllt, erscheint er hier.':snTab==='saved'?'Noch nichts gemerkt.':'Noch keine Treffer.';
 $('snHitSub').textContent=snTab==='snipes'?'Sortiert nach Gewinn':'Neueste zuerst';
 const sl=$('snSearches');sl.replaceChildren(...SN.searches.map(s=>{const r=snEl('div','sn-s'),d=snEl('div');d.append(snEl('b','',s.q),snEl('small','',[s.max>0?'bis '+euro(s.max):'',s.size?'Gr. '+s.size:'',s.resale>0?'Verkauf '+euro(s.resale):'Verkauf automatisch'].filter(Boolean).join(' · ')));
  const sw=snEl('label','sx-switch');const ck=snEl('input');ck.type='checkbox';ck.checked=!!s.active;ck.setAttribute('aria-label','Aktiv');ck.onchange=()=>{s.active=ck.checked;snPersist();snState()};sw.append(ck,snEl('span'));
  const x=snEl('button','del','×');x.type='button';x.setAttribute('aria-label','Suchauftrag löschen');x.onclick=()=>{if(!confirm('Suchauftrag „'+s.q+'“ löschen?'))return;SN.searches=SN.searches.filter(y=>y!==s);snPersist();snRender();snState()};
  r.append(d,sw,x);return r}));
 $('snSub').textContent=SN.searches.filter(s=>s.active).length+' aktiv · '+SN.hits.filter(h=>h.snipe&&!h.bought).length+' Snipes';snState()}
function snRenderLink(){const l=$('snLink');if(!l)return;l.replaceChildren();
 const a=snEl('span',snBridge?'ok':'miss',snBridge?'✓ Userscript verbunden':'○ Userscript nicht verbunden');l.append(a);
 const n=typeof Notification==='undefined'?null:Notification.permission;l.append(snEl('span',n==='granted'?'ok':'miss',n==='granted'?'✓ Benachrichtigungen erlaubt':'○ Benachrichtigungen aus'));
 $('snLinkSub').textContent=snBridge?'Bereit, Vinted abzufragen':'Userscript auf diesem Gerät nötig'}
async function snBought(h){
 const def=snBuyCost(h.price).toFixed(2).replace('.',','),v=prompt('Was hast du insgesamt bezahlt (inkl. Versand und Käuferschutz) in €?',def);if(v===null)return;
 const cost=snNum(v);if(!(cost>=0)){sxToast('Betrag ungültig');return}
 const a=blank();a.cost=String(Math.round(cost*100)/100);a.brand=h.brand;a.size=h.size;a.model=h.title;a.source='Vinted';a.purchaseDate=new Date().toISOString().slice(0,10);a.notes='Vinted-Einkauf: '+h.url;
 try{a.sku=await sxNextSku()}catch{}
 try{await store('readwrite',s=>s.put(a))}catch(e){sxToast('Speichern fehlgeschlagen');return}
 h.bought=true;snPersist();snRender();window.dispatchEvent(new Event('rv:data-changed'));sxToast('Im Bestand angelegt: '+(a.sku||a.model))}
function snBind(){
 document.querySelectorAll('#snTabs [data-t]').forEach(b=>b.onclick=()=>{snTab=b.dataset.t;snRender()});
 document.querySelectorAll('[data-sn]').forEach(el=>{const k=el.dataset.sn;if(el.type==='checkbox')el.checked=!!SN.cfg[k];else el.value=SN.cfg[k];
  el.onchange=async()=>{let v=el.type==='checkbox'?el.checked:el.type==='number'?snNum(el.value):el.value;
   if(k==='interval')v=Math.max(45,v||75);if(k==='domain'&&!SN_DOMAINS.includes(v))v='de';
   SN.cfg[k]=v;if(el.type==='number')el.value=v;
   if(k==='notify'&&v&&typeof Notification!=='undefined'&&Notification.permission==='default'){try{await Notification.requestPermission()}catch{}snRenderLink()}
   if(k==='domain'){SN.seen={};SN.searches.forEach(s=>s.seeded=false)}
   snPersist();if(k==='auto'){v?snSchedule(3000):clearTimeout(snTimer)}snState()}});
 $('snForm').onsubmit=e=>{e.preventDefault();const q=$('snQ').value.trim();if(!q)return;
  SN.searches.push({id:'s'+Date.now().toString(36),q,max:snNum($('snMax').value),size:$('snSize').value.trim(),resale:snNum($('snResale').value),active:true,seeded:false});
  $('snForm').reset();snPersist();snRender();snLog('Suchauftrag angelegt. Die ersten Treffer werden still übernommen, Alarme gibt es ab der zweiten Abfrage.');if(SN.cfg.auto)snSchedule(1500)};
 $('snDl').onclick=()=>{const u=URL.createObjectURL(new Blob([snUserscript()],{type:'text/javascript'})),a=document.createElement('a');a.href=u;a.download='rv-studio-vinted.user.js';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)};
 $('snCopy').onclick=async()=>{try{await navigator.clipboard.writeText(snUserscript());sxToast('Code kopiert – in Tampermonkey als neues Skript einfügen')}catch{snLog('Kopieren nicht möglich. Nutze „Userscript herunterladen“.')}};
 $('snPing').onclick=async()=>{snBridge=false;snPing();await snSleep(600);snRenderLink();snState();snLog(snBridge?'Verbunden.':'Keine Antwort. Userscript installiert, aktiviert und Seite neu geladen?')};
 $('snRun').onclick=()=>snRunAll(true)}
function showSniper(){closeStockDetail&&closeStockDetail();hidePrimaryViews();$('sniper').classList.remove('hidden');topActive('snipe');snRender();snRenderLink();snPing();window.scrollTo(0,0)}
{const prev=hidePrimaryViews;hidePrimaryViews=function(){prev();$('sniper')&&$('sniper').classList.add('hidden')}}
{const prev=showStep;showStep=function(n){$('sniper')&&$('sniper').classList.add('hidden');return prev.apply(this,arguments)}}
TOP_GO.snipe=showSniper;
snLoad();snBind();snRender();snRenderLink();setTimeout(snPing,700);snSchedule(8000);
// ===================== V31.3: RVO-Titelbild getrennt von den Fotos =====================
// Einmalig: alte Titelbilder (erstes Foto mit cover:true) in article.rvCover verschieben. Originalfotos bleiben unverändert.
(async()=>{try{
 if(sxGet('rv_cover_split_v313','')==='1')return;
 for(let i=0;i<100&&!db;i++)await new Promise(r=>setTimeout(r,100));
 if(!db)return;
 const all=await allArticles();let n=0;
 for(const a of all){if(Array.isArray(a.photos)&&a.photos.some(p=>p&&p.cover)){rvSplitCover(a);await store('readwrite',st=>st.put(a));n++}}
 sxSet('rv_cover_split_v313','1');
 if(n)window.dispatchEvent(new Event('rv:data-changed'));
}catch(e){console.warn('Titelbild-Umzug',e)}})();
// Beim Öffnen eines Artikels im Studio ebenfalls trennen (z. B. aus einem alten Backup).
{const prevPush=push;push=function(){if(article)rvSplitCover(article);return prevPush.apply(this,arguments)}}
setTimeout(()=>{try{sxPoofRefresh()}catch{}},1500);
// Externe Datenänderungen (z. B. Beispielartikel laden/entfernen) neu anzeigen.
window.addEventListener('rv:data-changed',()=>{renderLibrary().catch(()=>{});try{renderHome()}catch(e){}});
})();
