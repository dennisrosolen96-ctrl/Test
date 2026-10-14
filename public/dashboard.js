
(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var DAY=86400000;
var state={period:(function(){try{var p=localStorage.getItem('rv_v11_period');return ['today','7','30','all'].indexOf(p)>-1?p:'today'}catch(e){return 'today'}})(),articles:[]};
function fmtEuro(n){n=Number(n)||0;var r=Math.round(n*100)/100;return new Intl.NumberFormat('de-DE',{minimumFractionDigits:Number.isInteger(r)?0:2,maximumFractionDigits:2}).format(r)+' €'}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

/* ---------- Daten aus der App-Datenbank lesen (nur lesend) ---------- */
function readArticles(){
  return new Promise(function(res){
    if(!window.indexedDB){res([]);return}
    function go(ver){
      var r;try{r=indexedDB.open('RVStudioDB',ver)}catch(e){res([]);return}
      r.onerror=function(){res([])};
      r.onsuccess=function(){
        var db=r.result;
        if(!db.objectStoreNames.contains('articles')){db.close();res([]);return}
        var g=db.transaction('articles','readonly').objectStore('articles').getAll();
        g.onsuccess=function(){db.close();res(g.result||[])};
        g.onerror=function(){db.close();res([])};
      };
    }
    if(indexedDB.databases){
      indexedDB.databases().then(function(l){
        var d=(l||[]).filter(function(x){return x.name==='RVStudioDB'})[0];
        if(!d){res([]);return}
        go(d.version);
      }).catch(function(){go(1)});
    }else go(1);
  });
}

/* ---------- Zeiträume ---------- */
// Calendar periods use local midnight, matching date-only sale inputs.
function localTime(value){
  var match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
  var t=match?new Date(+match[1],+match[2]-1,+match[3]).getTime():Date.parse(value||'');
  return Number.isFinite(t)?t:null;
}
function rangeOf(p){
  var now=Date.now(),today=new Date();today.setHours(0,0,0,0);
  function back(days){var d=new Date(today);d.setDate(d.getDate()-days);return d.getTime()}
  if(p==='today')return {from:back(0),to:now+1,pf:back(1),pt:back(0)};
  if(p==='7'||p==='30'){var n=+p;return {from:back(n-1),to:now+1,pf:back(2*n-1),pt:back(n-1)}}
  return {from:-Infinity,to:Infinity,pf:null,pt:null};
}
function saleTime(a){return localTime(a.sale&&a.sale.date)}
function isSold(a){return a.articleStatus==='Verkauft'&&a.sale}
function soldIn(list,from,to,all){
  return list.filter(function(a){
    if(!isSold(a))return false;
    var t=saleTime(a);
    if(t===null)return all;           // Verkäufe ohne Datum zählen nur bei „Alle“
    return t>=from&&t<to;
  });
}
function profitOf(a){return (Number(a.sale.price)||0)-(Number(a.cost)||0)-(Number(a.sale.fees)||0)-(Number(a.sale.shipping)||0)}
function calc(list){
  var rev=0,pro=0;list.forEach(function(a){rev+=Number(a.sale.price)||0;pro+=profitOf(a)});
  return {rev:rev,cnt:list.length,pro:pro,avg:list.length?rev/list.length:0};
}
function delta(cur,prev){
  if(prev===null||prev===undefined)return null;
  if(!(prev>0))return null;
  return (cur-prev)/prev*100;
}
function buckets(list,rg,n){
  var all=rg.from===-Infinity;
  var times=list.map(saleTime).filter(function(t){return t!==null});
  if(times.length<2||new Set(times).size<2)return null;
  var from=all?Math.min.apply(null,times):rg.from,to=Date.now();
  if(!(to>from))return null;
  var w=(to-from)/n,out=[];
  for(var i=0;i<n;i++)out.push({rev:0,cnt:0,pro:0});
  list.forEach(function(a){
    var t=saleTime(a);if(t===null)return;
    var i=Math.min(n-1,Math.max(0,Math.floor((t-from)/w)));
    out[i].rev+=Number(a.sale.price)||0;out[i].cnt++;out[i].pro+=profitOf(a);
  });
  return out;
}
// Fallback trend like the reference: daily sales of the trailing days up to today.
function trailing(list,days){
  var today=new Date();today.setHours(0,0,0,0);
  var from=today.getTime()-(days-1)*DAY,out=[],any=false;
  for(var i=0;i<days;i++)out.push({rev:0,cnt:0,pro:0});
  list.forEach(function(a){
    if(!isSold(a))return;var t=saleTime(a);if(t===null||t<from)return;
    var i=Math.min(days-1,Math.floor((t-from)/DAY));out[i].rev+=Number(a.sale.price)||0;out[i].cnt++;out[i].pro+=profitOf(a);any=true;
  });
  return any?out:null;
}
function sparkSvg(vals){
  if(!vals||vals.length<2)return '';
  var max=Math.max.apply(null,vals),min=Math.min.apply(null,vals);
  if(max===min){return '<svg class="spark" viewBox="0 0 44 22" aria-hidden="true"><path d="M1 16 H43" stroke="#ff5a44" stroke-width="1.2" stroke-dasharray="2 2" fill="none" opacity=".6"/></svg>'}
  var pts=vals.map(function(v,i){return (1+i*(42/(vals.length-1))).toFixed(1)+','+(20-((v-min)/(max-min))*17).toFixed(1)}).join(' ');
  return '<svg class="spark" viewBox="0 0 44 22" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="spk" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ff3b2f" stop-opacity=".35"/><stop offset="1" stop-color="#ff3b2f" stop-opacity="0"/></linearGradient></defs><polygon points="1,22 '+pts+' 43,22" fill="url(#spk)"/><polyline points="'+pts+'" fill="none" stroke="#ff4a36" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" style="filter:drop-shadow(0 0 3px rgba(255,59,47,.9))"/></svg>';
}
function setMetric(key,val,d,spark){
  var v=$('v11-'+key+'-val'),dl=$('v11-'+key+'-dl'),sp=$('v11-'+key+'-sp');
  if(v){v.textContent=val;v.title=val;}
  if(dl){
    if(d===null){dl.textContent='–';dl.className='dl nil'}
    else{var r=Math.round(d);dl.textContent=(r>=0?'↗ +':'↘ ')+r+' %';dl.className='dl'+(r<0?' neg':'')}
  }
  if(sp){sp.innerHTML=spark||'';sp.closest('.v11-m').classList.toggle('has-trend',Boolean(spark))}
  if(dl)dl.title=d===null?'Kein belastbarer Vergleich mit dem Vorzeitraum':'Veränderung gegenüber dem Vorzeitraum';
}

/* ---------- Anzeige ---------- */
function render(){
  var all=state.articles,rg=rangeOf(state.period),isAll=state.period==='all';
  var cur=soldIn(all,rg.from,rg.to,isAll),m=calc(cur);
  var pm=null;
  if(!isAll){pm=calc(soldIn(all,rg.pf,rg.pt,false))}
  var bk=buckets(cur,rg,10)||trailing(all,state.period==='30'?30:14);
  setMetric('rev',fmtEuro(m.rev),pm?delta(m.rev,pm.rev):null,bk&&sparkSvg(bk.map(function(b){return b.rev})));
  setMetric('cnt',String(m.cnt),pm?delta(m.cnt,pm.cnt):null,bk&&sparkSvg(bk.map(function(b){return b.cnt})));
  setMetric('pro',fmtEuro(m.pro),pm?delta(m.pro,pm.pro):null,bk&&sparkSvg(bk.map(function(b){return b.pro})));
  setMetric('avg',fmtEuro(m.avg),pm?delta(m.avg,pm.avg):null,bk&&sparkSvg(bk.map(function(b){return b.cnt?b.rev/b.cnt:0})));
  // Kategorien nach Umsatz
  var cat={};cur.forEach(function(a){var k=(a.category||'Sonstiges').trim()||'Sonstiges';cat[k]=(cat[k]||0)+(Number(a.sale.price)||0)});
  var rows=Object.keys(cat).map(function(k){return {k:k,v:cat[k]}}).sort(function(a,b){return b.v-a.v});
  var total=rows.reduce(function(n,r){return n+r.v},0);
  if(rows.length>5){var rest=rows.slice(4).reduce(function(n,r){return n+r.v},0);rows=rows.slice(0,4).concat([{k:'Sonstiges',v:rest}])}
  var box=$('v11-cats');
  if(box){
    if(!rows.length||!(total>0)){box.innerHTML='<div class="empty">Noch keine Verkäufe in diesem Zeitraum.</div><div class="v16-empty-bars" aria-hidden="true"><i></i><i></i><i></i></div>'}
    else{var mx=rows[0].v;box.innerHTML=rows.map(function(r){return '<div class="row"><span class="nm">'+esc(r.k)+'</span><span class="tr"><s style="width:'+Math.max(4,Math.round(r.v/mx*100))+'%"></s></span><span class="pc">'+Math.round(r.v/total*100)+' %</span></div>'}).join('')}
  }
  // Lager
  var stock=all.filter(function(a){return a.articleStatus!=='Verkauft'&&!a.archivedAt});
  var online=stock.filter(function(a){return a.articleStatus==='Online'}).length;
  var worth=stock.reduce(function(n,a){var ps=Object.values(a.prices||{}).map(Number).filter(function(v){return Number.isFinite(v)&&v>0});return n+(ps.length?ps.reduce(function(v,p){return v+p},0)/ps.length:(Number(a.cost)||0))},0);
  if($('v11-act'))$('v11-act').textContent=String(online);
  if($('v11-worth'))$('v11-worth').textContent=fmtEuro(worth);
  // Abzeichen: verkauft, Versand noch nicht bestätigt
  var toShip=all.filter(function(a){return isSold(a)&&!a.shippedAt&&!a.archivedAt}).length;
  var bd=$('v11-badge-sales');if(bd){bd.textContent=String(toShip);bd.hidden=!toShip}
  if($('v11Bell'))$('v11Bell').classList.toggle('has-tasks',toShip>0||stock.some(function(a){return a.articleStatus==='Entwurf'}));
  insights(all,stock);
  if(window.RVFrames)window.RVFrames.refresh();
}
function ageDays(a){var v=a.purchaseDate||a.createdAt||a.date||'';var t=localTime(v);return t!==null?Math.max(0,Math.floor((Date.now()-t)/DAY)):null}
function insights(all,stock){
  var aged=stock.filter(function(a){var d=ageDays(a);return d!==null&&d>=60});
  var oldest=aged.reduce(function(n,a){return Math.max(n,ageDays(a))},0);
  var ready=stock.filter(function(a){return a.articleStatus==='Bereit'}).length;
  var drafts=stock.filter(function(a){return a.articleStatus==='Entwurf'}).length;
  var sold30=soldIn(all,rangeOf('30').from,Date.now()+1,false);
  var catSum={},tot=0;sold30.forEach(function(a){var k=(a.category||'Sonstiges').trim()||'Sonstiges';var v=Number(a.sale.price)||0;catSum[k]=(catSum[k]||0)+v;tot+=v});
  var top=Object.keys(catSum).sort(function(a,b){return catSum[b]-catSum[a]})[0];
  var c1,c2,c3;
  c1=top&&tot>0
    ?{t:'Trend erkannt',b:'<em>'+esc(top)+'</em> bringt <em>'+Math.round(catSum[top]/tot*100)+' %</em> deines Umsatzes in den letzten 30 Tagen. Mehr davon einkaufen?',go:'finance',i:'bolt'}
    :{t:'Trend erkannt',b:'Sobald du verkaufst, zeigt dir die App hier deine stärkste Kategorie.',go:'finance',i:'bolt'};
  c2=ready
    ?{t:'Optimierung',b:'<em>'+ready+'</em> '+(ready===1?'Artikel ist':'Artikel sind')+' fertig vorbereitet, aber noch nicht online. Jetzt Angebote einstellen!',go:'ready',i:'bars'}
    :(drafts?{t:'Optimierung',b:'<em>'+drafts+'</em> '+(drafts===1?'Artikel wartet':'Artikel warten')+' noch auf Fotos, Maße oder Beschreibung.',go:'draft',i:'bars'}
    :{t:'Optimierung',b:'Es gibt keine offenen Entwürfe. Lege den nächsten Artikel an.',go:'new',i:'bars'});
  c3=aged.length
    ?{t:'Lager-Hinweis',b:'<em>'+aged.length+'</em> '+(aged.length===1?'Artikel liegt':'Artikel liegen')+' seit mindestens 60 Tagen im Bestand (am längsten <em>'+oldest+' Tage</em>). Prüfe eine Preisreduzierung.',go:'aged',i:'cube'}
    :{t:'Lager-Hinweis',b:stock.some(function(a){return ageDays(a)===null})?'Für einige Artikel fehlt das Einkaufsdatum. Ergänze es für Lagerhinweise.':'Kein Artikel liegt mindestens 60 Tage im Bestand.',go:'stock',i:'cube'};
  var icons={bolt:'<path d="M13 3 5 13h6l-1 8 9-11h-6l0-7Z"/>',bars:'<path d="M5 20V12M10 20V8M15 20V4M20 20V10" stroke-width="2.2"/>',cube:'<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>'};
  var host=$('v11-insights');if(!host)return;
  host.innerHTML=[c1,c2,c3].map(function(c){
    return '<button type="button" class="v11-card v11-hud" data-go="'+c.go+'"><svg class="ci v11-ico" viewBox="0 0 24 24" aria-hidden="true">'+icons[c.i]+'</svg><span><b>'+c.t+'</b><p>'+c.b+'</p></span><svg class="ch v11-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>';
  }).join('');
}

/* ---------- Navigation: die neuen Elemente lösen die bestehenden Schaltflächen aus ---------- */
function click(id){var e=$(id);if(e)e.click()}
function afterBestand(fn,ms){click('homeLibrary');setTimeout(function(){var tab=document.querySelector('[data-v5-tab="all"]');if(tab)tab.click();fn()},ms||90)}
var actions={
  studio:function(){click('homeNew')},
  stock:function(){afterBestand(function(){})},
  purchases:function(){afterBestand(function(){var t=document.querySelector('[data-v5-tab="purchases"]');if(t)t.click()})},
  sales:function(){click('navSales')},
  chat:function(){click('homeToChat')},
  settings:function(){click('homeToSettings')},
  photo:function(){click('homeNew');var f=$('upload');if(f){f.setAttribute('capture','environment');f.click();setTimeout(function(){f.removeAttribute('capture')},1000)}},
  sell:function(){afterBestand(function(){var f=document.querySelector('[data-stock-filter="active"]');if(f)f.click()})},
  stats:function(){click('navFinance')},
  scan:function(){scan()},
  ready:function(){afterBestand(function(){var f=document.querySelector('[data-stock-filter="active"]');if(f)f.click()})},
  draft:function(){click('homeDrafts')},
  'new':function(){click('homeNew')},
  aged:function(){afterBestand(function(){var t=document.querySelector('#v6Tiles .v6-tile:nth-child(3)');if(t)t.click()},140)},
  finance:function(){click('navFinance')}
};
function bind(){
  var root=$('v11Root');if(!root)return;
  root.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-go]');
    if(b&&actions[b.getAttribute('data-go')]){actions[b.getAttribute('data-go')]();return}
    var p=e.target.closest&&e.target.closest('[data-period]');
    if(p){state.period=p.getAttribute('data-period');try{localStorage.setItem('rv_v11_period',state.period)}catch(e){}[].forEach.call(root.querySelectorAll('[data-period]'),function(x){x.setAttribute('aria-pressed',x===p?'true':'false')});render();return}
    var pr=e.target.closest&&e.target.closest('[data-ai-request]');
    if(pr){document.dispatchEvent(new CustomEvent('rv:ai-request',{detail:{message:pr.getAttribute('data-ai-request')}}));return}
  });
  var pill=$('v11AiPill');if(pill)pill.addEventListener('click',function(){click('homeToChat')});
  var bell=$('v11Bell');if(bell)bell.addEventListener('click',function(){click('rvNotify')});
  var sales=$('navSales');if(sales)sales.addEventListener('click',function(){click('navStock');setTimeout(function(){var tab=document.querySelector('[data-v5-tab="all"]');if(tab)tab.click();var f=document.querySelector('[data-stock-filter="sold"]');if(f)f.click();var e=$('navSales');if(e){document.querySelectorAll('#bottomnav button').forEach(function(b){b.classList.toggle('selected',b===e);if(b===e)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}},90)});
  var mic=document.querySelector('#v11Root .rv-crafted-chat-icon');if(mic){mic.addEventListener('click',listen)}
  var more=$('v11InsightsAll');if(more)more.addEventListener('click',function(){click('navFinance')});
}

/* ---------- Sprachaufnahme (nur wenn der Browser sie anbietet) ---------- */
function listen(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  var ta=$('homeAiInput');if(!ta)return;
  if(!SR){ta.focus();ta.placeholder='Spracheingabe hier nicht unterstützt – bitte tippen.';return}
  try{
    var r=new SR();r.lang='de-DE';r.interimResults=false;r.maxAlternatives=1;
    r.onresult=function(ev){var t=ev.results[0][0].transcript;ta.value=t;ta.dispatchEvent(new Event('input',{bubbles:true}))};
    r.onerror=function(){ta.focus()};
    r.start();
  }catch(e){ta.focus()}
}

/* ---------- Barcode- und QR-Scan (nur wenn der Browser BarcodeDetector hat) ---------- */
function scan(){
  function search(){click('homeLibrary');setTimeout(function(){var s=$('searchArticles');if(s){s.focus()}},120)}
  if(!('BarcodeDetector' in window)||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){search();setTimeout(function(){var s=$('searchArticles');if(s)s.placeholder='Barcode eingeben – Kamera-Scan hier nicht unterstützt'},150);return}
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:500;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#f7ecdc;font:600 14px system-ui';
  ov.innerHTML='<video playsinline muted style="width:100%;max-height:70vh;object-fit:cover"></video><div>Code in den Rahmen halten</div><button type="button" style="padding:10px 18px;border-radius:10px;border:1px solid #ff5a44;background:#3a0a08;color:#ffe3b0;font:600 14px system-ui">Abbrechen</button>';
  document.body.appendChild(ov);
  var video=ov.querySelector('video'),stream=null,alive=true;
  function close(){alive=false;if(stream)stream.getTracks().forEach(function(t){t.stop()});ov.remove()}
  ov.querySelector('button').addEventListener('click',close);
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(function(s){
    if(!alive){s.getTracks().forEach(function(t){t.stop()});return}
    stream=s;video.srcObject=s;video.play().catch(function(){});
    var det;try{det=new window.BarcodeDetector()}catch(e){close();search();return}
    (function loop(){
      if(!alive)return;
      det.detect(video).then(function(codes){
        if(codes&&codes.length){
          var val=codes[0].rawValue||'';close();click('homeLibrary');
          setTimeout(function(){var f=$('searchArticles');if(f){f.value=val;f.dispatchEvent(new Event('input',{bubbles:true}));f.focus()}},140);
        }else setTimeout(loop,280);
      }).catch(function(){setTimeout(loop,400)});
    })();
  }).catch(function(){close();search()});
}

/* ---------- Start ---------- */
function greet(){
  var t=$('v11Greet');if(t)t.textContent='Guten Tag!';
}
var timer=null;
function refresh(){clearTimeout(timer);timer=setTimeout(function(){readArticles().then(function(l){state.articles=l;render()})},180)}
function start(){
  greet();bind();
  [].forEach.call(document.querySelectorAll('#v11Root [data-period]'),function(x){x.setAttribute('aria-pressed',x.getAttribute('data-period')===state.period?'true':'false')});
  ['statStock','statSold','statInvest','statProfit'].forEach(function(id){
    var e=$(id);if(e&&window.MutationObserver)new MutationObserver(refresh).observe(e,{childList:true,characterData:true,subtree:true});
  });
  var nh=$('navHome');if(nh)nh.addEventListener('click',function(){greet();refresh()});
  setTimeout(refresh,700);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* Sized metallic SVG frames. Fixed corner dimensions and stroke widths survive
   responsive resizing; no business text or data is ever rasterized. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const observed=new Set();
  let serial=0;
  function draw(el) {
    const width=Math.round(el.clientWidth),height=Math.round(el.clientHeight);
    if(width<20||height<20)return;
    let svg=el.querySelector(':scope > .hud-frame');
    if(!svg){svg=document.createElementNS(NS,'svg');svg.classList.add('hud-frame');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');el.prepend(svg)}
    const panel=el.classList.contains('v11-panel'),nav=el.id==='bottomnav';
    const gold=el.classList.contains('gold')||el.classList.contains('v11-m')||el.classList.contains('v11-cat')||el.classList.contains('v11-s2')||el.classList.contains('v11-card')||el.parentElement.classList.contains('v11-prompts');
    const red=el.classList.contains('red')||el.classList.contains('v11-ai')||el.classList.contains('v11-ins');
    const id=svg.dataset.uid||(svg.dataset.uid='cc'+(++serial));
    const glass=el.classList.contains('v11-m')||el.classList.contains('v11-cat')||el.classList.contains('v11-s2');
    const signature=[width,height,panel,nav,gold,red,glass].join(':');
    if(svg.dataset.size===signature)return;
    svg.dataset.size=signature;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const w=width,h=height,c=panel?18:nav?22:10;
    const color=gold?'#ffd795':red?'#ff5140':panel?'#ffce85':'#ff7650';
    const outline=(p,cut)=>`M ${p+cut} ${p} H ${w-p-cut} L ${w-p} ${p+cut} V ${h-p-cut} L ${w-p-cut} ${h-p} H ${p+cut} L ${p} ${h-p-cut} V ${p+cut} Z`;
    const path=(d,stroke,sw=1,extra='')=>`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="miter" ${extra}/>`;
    if(glass){svg.innerHTML=glassFrame(el,w,h,id);return}
    let markup=`<defs>
      <linearGradient id="${id}m" x1="0" y1="0" x2=".75" y2="1" gradientUnits="objectBoundingBox">
        <stop stop-color="#4c463c"/><stop offset=".12" stop-color="#0e100f"/><stop offset=".26" stop-color="#70543a"/><stop offset=".4" stop-color="#181817"/><stop offset=".55" stop-color="#4b4031"/><stop offset=".7" stop-color="#11110f"/><stop offset=".87" stop-color="#5d492e"/><stop offset="1" stop-color="#1b1b18"/>
      </linearGradient>
      <linearGradient id="${id}e" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#fff2c2"/><stop offset=".14" stop-color="${color}"/><stop offset=".28" stop-color="#78542b"/><stop offset=".42" stop-color="#321e12"/><stop offset=".62" stop-color="${color}"/><stop offset=".77" stop-color="#a56a34"/><stop offset="1" stop-color="#ffe8b0"/>
      </linearGradient>
      <linearGradient id="${id}l" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0"><stop stop-color="${color}" stop-opacity="0"/><stop offset=".48" stop-color="#ffca72"/><stop offset=".53" stop-color="#fff8d7"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>
      <filter id="${id}g" filterUnits="userSpaceOnUse" x="-20" y="-20" width="${w+40}" height="${h+40}"><feGaussianBlur stdDeviation="2.2"/></filter>
    </defs>`;
    markup+=path(outline(2,c-2),'#030303',panel?11:6);
    markup+=path(outline(panel?5:3,c-3),`url(#${id}m)`,panel?7:4);
    markup+=path(outline(2,c-2),`url(#${id}e)`,panel?1.3:.8);
    markup+=path(outline(panel?9:5,Math.max(3,c-6)),panel?'#94734b':'#80603a',.65);
    markup+=path(outline(panel?12:7,Math.max(2,c-9)),panel?'#312c25':'#2b251c',.6);
    // Bright corner bevels, separated illuminated edges and black metal rails.
    const p=panel?6:3,corner=panel?21:13;
    const cornerLines=`M ${p} ${p+corner+10} V ${p+corner} L ${p+corner} ${p} H ${p+corner+21} M ${w-p-corner-21} ${p} H ${w-p-corner} L ${w-p} ${p+corner} V ${p+corner+10} M ${p} ${h-p-corner-10} V ${h-p-corner} L ${p+corner} ${h-p} H ${p+corner+21} M ${w-p-corner-21} ${h-p} H ${w-p-corner} L ${w-p} ${h-p-corner} V ${h-p-corner-10}`;
    markup+=path(cornerLines,gold?'#ffbc61':'#ff392d',3,`opacity=".8" filter="url(#${id}g)"`);
    markup+=path(cornerLines,`url(#${id}e)`,1.25);
    if(panel){
      // Bevel plates: opposing dark faces and polished diagonal reflections.
      const left=`M 2 29 L 29 2 H 59 L 50 8 H 30 L 8 30 V 51 L 2 60 Z`;
      const right=`M ${w-2} ${h-29} L ${w-29} ${h-2} H ${w-59} L ${w-50} ${h-8} H ${w-30} L ${w-8} ${h-30} V ${h-51} L ${w-2} ${h-60} Z`;
      markup+=`<path d="${left}" fill="url(#${id}m)" stroke="#5c4d36" stroke-width=".5"/><path d="${right}" fill="url(#${id}m)" stroke="#5c4d36" stroke-width=".5"/>`;
      markup+=path(`M 7 24 L 24 7 H 46 M ${w-7} ${h-24} L ${w-24} ${h-7} H ${w-46}`,'#ffdfac',1.1);
      markup+=path(`M 9 39 V 23 L 23 9 H 38 M ${w-9} ${h-39} V ${h-23} L ${w-23} ${h-9} H ${w-38}`,'#fff4d4',3,`opacity=".7" filter="url(#${id}g)"`);
    }
    const bottom=`M ${w*.30} ${h-(panel?6:3)} H ${w*.70}`;
    markup+=path(bottom,gold?'#ffc170':'#ff302b',4,`filter="url(#${id}g)"`);
    markup+=path(bottom,`url(#${id}l)`,1.5);
    if(panel||nav){
      const shine=`M ${w*.42} ${h-6} H ${w*.58}`;
      markup+=path(shine,'#ffc76d',6,`opacity=".8" filter="url(#${id}g)"`);
      markup+=path(shine,`url(#${id}l)`,2);
      const x=w*.5,y=h-6;
      markup+=`<circle cx="${x}" cy="${y}" r="3" fill="#fff5cb" filter="url(#${id}g)"/><path d="M ${x} ${y-7} V ${y+6}" stroke="#ffb449" stroke-width=".5" opacity=".7"/>`;
    }
    if(panel||nav){
      const n=w*.16,mid=w/2;
      markup+=`<path d="M ${mid-n-11} 2 L ${mid-n} 13 H ${mid+n} L ${mid+n+11} 2" fill="#080908" stroke="#786249" stroke-width=".7"/>
       <path d="M ${mid-n+9} 3 L ${mid-n+17} 8 H ${mid+n-17} L ${mid+n-9} 3" fill="#1a1915" stroke="#343028" stroke-width=".8"/>`;
      markup+=path(`M ${mid-n*.58} 3 H ${mid+n*.58}`,`url(#${id}l)`,1.8);
      markup+=path(`M ${mid-n-9} ${h-2} L ${mid-n} ${h-11} H ${mid+n} L ${mid+n+9} ${h-2}`,'#635440',.7);
      markup+=path(`M 4 ${h*.26} V ${h*.42} M ${w-4} ${h*.60} V ${h*.77}`,red?'#ff342a':'#e09b4c',1.5);
      // Rote Lichtstreifen an den Seiten, glühende Ecken und feine Skalen wie in der Referenz
      const strips=`M 4 ${h*.14} V ${h*.6} M ${w-4} ${h*.4} V ${h*.88}`;
      markup+=`<g class="cc-edge-strip">${path(strips,'#ff2a1e',12,`opacity=".85" filter="url(#${id}g)"`)}${path(strips,'#ff3b28',3.4)}${path(strips,'#ffe2cc',1.1)}</g>`;
      const cg=`M 3 ${Math.min(70,h*.3)} V 22 L 22 3 H ${Math.min(120,w*.18)} M ${w-3} ${h-Math.min(70,h*.3)} V ${h-22} L ${w-22} ${h-3} H ${w-Math.min(120,w*.18)}`;
      markup+=`<g class="cc-edge-corner">${path(cg,'#ffb04a',5,`opacity=".55" filter="url(#${id}g)"`)}${path(cg,'#ffe2a8',1.2)}</g>`;
      let ticks='';for(let i=0;i<9;i++){const x=w*.22+i*7;ticks+=`M ${x} 6 V ${i%4?9:11} `;const x2=w*.78-i*7;ticks+=`M ${x2} ${h-6} V ${h-(i%4?9:11)} `}
      for(let i=0;i<6;i++){const y=h*.64+i*6;ticks+=`M 7 ${y} H ${i%3?10:13} `;const y2=h*.36-i*6;ticks+=`M ${w-7} ${y2} H ${w-(i%3?10:13)} `}
      markup+=path(ticks,'#c99a5c',.7,'opacity=".7"');
      markup+=`<circle cx="4" cy="${h*.6}" r="2" fill="#ffd2b0" filter="url(#${id}g)"/><circle cx="${w-4}" cy="${h*.4}" r="2" fill="#ffd2b0" filter="url(#${id}g)"/>`;
      for(const x of [15,w-15])for(const y of [30,h-30])markup+=`<circle cx="${x}" cy="${y}" r="1.25" fill="#c49c64" opacity=".55"/>`;
      // Small circuitry marks carry depth without competing with the content.
      markup+=path(`M 17 ${h-15} H 48 L 54 ${h-21} M ${w-54} 20 L ${w-48} 14 H ${w-18}`,'#785b38',.6);
    }else{
      markup+=path(`M ${w*.20} 3 H ${w*.43}`,gold?'#f6c875':'#ff352c',1.4);
      markup+=path(`M 3 ${h-17} L 10 ${h-10} M ${w-3} 17 L ${w-10} 10`,'#927656',.8);
    }
    svg.innerHTML=markup;
  }
  // Glasfelder: feiner, leuchtender Goldrand statt Metallrahmen; Kennzahlen laufen nach rechts aus.
  function glassFrame(el,w,h,id){
    const fade=el.classList.contains('v11-m'),c=9;
    const o=`M ${c} .75 H ${w-c} L ${w-.75} ${c} V ${h-c} L ${w-c} ${h-.75} H ${c} L .75 ${h-c} V ${c} Z`;
    let m=`<defs>
      <linearGradient id="${id}ge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe7b0"/><stop offset=".3" stop-color="#c8904a"/><stop offset=".65" stop-color="#7a5430"/><stop offset="1" stop-color="#e8b26a"/></linearGradient>
      <filter id="${id}gg" filterUnits="userSpaceOnUse" x="-20" y="-20" width="${w+40}" height="${h+40}"><feGaussianBlur stdDeviation="2.4"/></filter>`;
    if(fade)m+=`<linearGradient id="${id}fm" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff"/><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><mask id="${id}mk" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${w+40}" height="${h+40}"><rect x="-20" y="-20" width="${w+40}" height="${h+40}" fill="url(#${id}fm)"/></mask>`;
    m+=`</defs><g ${fade?`mask="url(#${id}mk)"`:''}>`;
    m+=`<path d="${o}" fill="none" stroke="#ffae4a" stroke-width="3.5" opacity=".28" filter="url(#${id}gg)"/>`;
    m+=`<path d="${o}" fill="none" stroke="url(#${id}ge)" stroke-width="1.1"/>`;
    m+=`<path d="M 3.5 ${c+3} V ${c} L ${c} 3.5" fill="none" stroke="#3a2a1a" stroke-width=".6"/>`;
    const tl=`M .75 ${Math.min(h*.6,34)} V ${c} L ${c} .75 H ${Math.min(w*.4,90)}`;
    m+=`<path d="${tl}" fill="none" stroke="#ffcf7a" stroke-width="3" opacity=".7" filter="url(#${id}gg)"/><path d="${tl}" fill="none" stroke="#fff3d2" stroke-width="1.1"/>`;
    const bt=`M ${w*.12} ${h-.75} H ${w*.55}`;
    m+=`<path d="${bt}" fill="none" stroke="#ffb04a" stroke-width="3" opacity=".55" filter="url(#${id}gg)"/><path d="${bt}" fill="none" stroke="#ffe0a0" stroke-width=".9" opacity=".9"/>`;
    if(!fade){const br=`M ${w-.75} ${h-Math.min(h*.5,30)} V ${h-c} L ${w-c} ${h-.75} H ${w-Math.min(w*.3,60)}`;m+=`<path d="${br}" fill="none" stroke="#ffcf7a" stroke-width="3" opacity=".5" filter="url(#${id}gg)"/><path d="${br}" fill="none" stroke="#ffe7b8" stroke-width=".9"/>`}
    return m+`</g>`;
  }
  const resize='ResizeObserver' in window?new ResizeObserver(entries=>entries.forEach(e=>draw(e.target))):null;
  function refresh(){
    for(const target of observed){if(!target.isConnected){if(resize)resize.unobserve(target);observed.delete(target)}}
    document.querySelectorAll('#v11Root .v11-hud,#bottomnav').forEach(el=>{
      draw(el);if(!observed.has(el)){observed.add(el);if(resize)resize.observe(el)}
    });
  }
  window.RVFrames={refresh};
  refresh();
  if(!resize)window.addEventListener('resize',refresh,{passive:true});
  // The label shows successful provider contact, not just a configured URL.
  function aiState(state,message){
    const status=document.getElementById('v16AiState');
    if(status){status.dataset.state=state;status.textContent={ready:'Online',busy:'Anfrage …',setup:'Einrichten',error:'Prüfen'}[state]||'Einrichten';status.title=message||''}
    const pill=document.querySelector('#v11AiPill > span');
    if(pill){pill.innerHTML=state==='ready'?'Dein KI-Assistent<br>ist bereit.':state==='busy'?'Dein KI-Assistent<br>analysiert …':state==='error'?'Dein KI-Assistent<br>Verbindung prüfen.':'Dein KI-Assistent<br>Verbindung einrichten.'}
  }
  aiState('setup','Verbinde deinen KI-Server und das RV-Studio-Kennwort in den Einstellungen.');
  document.addEventListener('rv:ai-state',e=>aiState(e.detail.state,e.detail.message));
})();

