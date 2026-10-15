
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
   for(const p of article.photos.slice(0,8)){const c=document.createElement('canvas'),im=await imageFrom(p.src),scale=Math.min(1,1600/Math.max(im.width,im.height));c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);images.push(c.toDataURL('image/jpeg',.86))}
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
async function saveArticle(){pull();try{await store('readwrite',s=>s.put(article));$('saveStatus').textContent='✓ Artikel lokal gespeichert';await renderHome();showHome();alert('Artikel im Bestand gespeichert!')}catch(e){$('saveStatus').textContent='Speichern fehlgeschlagen: '+e.message}}
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
  if(a.photos?.[0]?.src){const img=document.createElement('img');img.src=a.photos[0].src;img.loading='lazy';img.alt='Foto '+(a.sku||'Artikel');picture.append(img)}else picture.textContent='RV';
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
 $('stockHero').src=a.photos?.[0]?.src||'rv-logo.jpg';$('stockCost').textContent=euro(a.cost);$('stockCondition').textContent=a.condition?a.condition+'/10':'—';$('stockLocationText').textContent=a.location||'—';
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
 homeMessage('user',text);
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
 let requestMessage=text;
 if(opts.remote){
  const field=value=>String(value??'').slice(0,240);
  const items=stock.slice(0,12).map(a=>({sku:field(a.sku),brand:field(a.brand),category:field(a.category),size:field(a.size),condition:field(a.condition),cost:Number(a.cost)||0,measurements:field(a.measurements),notes:field(a.notes),material:field(a.material),color:field(a.color),prices:a.prices?{ebay:field(a.prices.ebay),vinted:field(a.prices.vinted),instagram:field(a.prices.instagram)}:{},status:field(a.articleStatus),purchaseDate:field(a.purchaseDate)}));
  const sales=sold.slice(-12).map(a=>({sku:field(a.sku),category:field(a.category),price:Number(a.sale.price)||0,cost:Number(a.cost)||0,fees:Number(a.sale.fees)||0,shipping:Number(a.sale.shipping)||0,date:field(a.sale.date)}));
  requestMessage=text+'\n\nErfasste eigene App-Daten (begrenzte Auswahl, keine externen Marktpreise): '+JSON.stringify({stock:items,sales})+'\nNutze ausschließlich diese Angaben. Fehlende Merkmale und Markttrends nicht erfinden; fordere erforderliche Angaben an. Bei Artikeltexten nur einen Entwurf liefern. Die vollständige Foto-Listing-Erstellung erfolgt im Studio.';
 }
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
const recent=$('homeRecent');recent.replaceChildren();const list=all.slice(-3).reverse();if(!list.length){const el=document.createElement('div');el.className='rv-recent-empty';el.textContent='Noch keine Artikel. Starte mit deinem ersten Produkt.';recent.append(el)}for(const a of list){const b=document.createElement('button');b.type='button';b.className='rv-product-card';const im=document.createElement('img');im.loading='lazy';im.src=a.photos?.[0]?.src||'rv-logo.jpg';im.alt='Artikelfoto';const title=document.createElement('strong');title.textContent=[a.brand,a.category].filter(Boolean).join(' ')||a.sku||'Artikel';const price=document.createElement('b');price.textContent=a.prices?.vinted?euro(a.prices.vinted):a.prices?.ebay?euro(a.prices.ebay):euro(a.cost)+' EK';const badge=document.createElement('small');badge.textContent=a.articleStatus||'Entwurf';b.append(im,title,price,badge);b.onclick=()=>openStockDetail(a.id);recent.append(b)}
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
 const photo=document.createElement('img');photo.loading='lazy';photo.src=a.photos?.[0]?.src||'/rv-logo.jpg';photo.alt='Artikelfoto';
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
$('stockNewArticleQuick').onclick=()=>$('newArticle').click();$('homeNew').onclick=()=>{article=blank();push();showStep(0)};$('homeLibrary').onclick=()=>showStep(4);$('homeLibraryTop').onclick=()=>showStep(4);$('homeBackup').onclick=()=>$('backup').click();$('homeToSettings').onclick=()=>showSettings();$('homeToChat').onclick=()=>showChat();$('homeRefresh').onclick=()=>renderHome();$('homeAiSend').onclick=()=>runHomeAi();$('chatSend').onclick=()=>runHomeAi($('chatInput').value);$('chatClear').onclick=()=>{clearHomeFeed();syncFeeds()};$('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runHomeAi($('chatInput').value)}});document.querySelectorAll('.chat-chip').forEach(b=>b.onclick=()=>runHomeAi(b.dataset.chatCmd||b.textContent));$('settingsBackup').onclick=()=>$('backup').click();$('settingsRestore').onchange=async e=>{await importBackupFile(e.target.files&&e.target.files[0]);e.target.value=''};$('homeAiClear').onclick=clearHomeFeed;$('homeAiAttach').onclick=()=>{article=blank();push();showStep(0);$('upload').click()};$('homeDrafts').onclick=()=>{showStep(4);stockFilter='draft';document.querySelectorAll('.stock-chip').forEach(b=>b.classList.toggle('selected',b.dataset.filter==='draft'));renderLibrary()};$('homeFinances').onclick=showFinance;$('homeSyncShort').onclick=()=>{showSettings();setTimeout(()=>{$('rvCloudPassword').scrollIntoView({behavior:'smooth'});if(rvCloudPassword)$('rvCloudSync').click()},80)};$('homeStatStock').onclick=()=>showStep(4);$('homeStatSold').onclick=showFinance;$('homeStatInvest').onclick=showFinance;$('homeStatProfit').onclick=showFinance;$('rvNotify').onclick=()=>{showHome();const tasks=$('homeTasks'),tools=tasks&&tasks.closest('details.v15-more-tools');if(tools)tools.open=true;if(tasks)requestAnimationFrame(()=>tasks.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}))};$('navChat').onclick=showChat;$('navSettings').onclick=showSettings;$('homeAiInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runHomeAi()}});document.querySelectorAll('.home-chip').forEach(b=>b.onclick=()=>runHomeAi(b.dataset.cmd||b.textContent));$('navHome').onclick=showHome;$('navStock').onclick=()=>showStep(4);$('navStudio').onclick=()=>{article=blank();push();showStep(0)};$('navFinance').onclick=showFinance;$('searchArticles').oninput=()=>renderLibrary();

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
  +(slow.length?slow.map(a=>'<button type="button" class="bx-slowrow" data-bx-open="'+bxEsc(a.id)+'">'+(a.photos?.[0]?.src?'<img src="'+bxEsc(a.photos[0].src)+'" alt="" loading="lazy">':'<span class="ph">RV</span>')+'<span class="nm"><b>'+bxEsc([a.brand,a.model].filter(Boolean).join(' ')||a.category||'Artikel')+'</b><small>'+bxEsc(a.location||a.sku||'')+'</small></span><span class="dd">'+v5Age(a)+' T</span></button>').join(''):'<p class="bx-empty">Keine Artikel im Lager.</p>')
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
 btn.innerHTML='<span class="bx-img">'+(a.photos?.[0]?.src?'<img src="'+bxEsc(a.photos[0].src)+'" alt="" loading="lazy" decoding="async">':'<span class="bx-noimg">RV</span>')
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
async function rvUploadRecord(a){const clone=structuredClone(a);clone.photos=await Promise.all((clone.photos||[]).map(async p=>({...p,src:await rvUploadPhoto(clone.id,p.src)})));return clone}
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
   const a=remote.article;a.photos=await Promise.all((a.photos||[]).map(rvHydratePhoto));
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
    const a=result.article;a.photos=await Promise.all((a.photos||[]).map(rvHydratePhoto));
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
// Externe Datenänderungen (z. B. Beispielartikel laden/entfernen) neu anzeigen.
window.addEventListener('rv:data-changed',()=>{renderLibrary().catch(()=>{});try{renderHome()}catch(e){}});
})();
