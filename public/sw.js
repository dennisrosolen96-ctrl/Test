const CACHE='rv-studio-v19-blueglass-10';
const FILES=['/','/index.html','/app.css','/dashboard.css','/fx.css','/ref.css','/theme.css','/app.js','/dashboard.js','/fx.js',
  '/vendor/jszip.min.js','/fonts/command-sans-regular.otf','/fonts/command-sans-bold.otf',
  '/rv-logo.jpg','/rv-ai-mascot.png','/rv-robot-premium.png','/rv-white.png',
  '/rv-mark-cropped.png','/rv-studio-script.png','/icons/icon-192.png','/icons/icon-512.png',
  '/manifest.webmanifest','/v11-globe.webp','/v11-robot.webp','/v11-navorb.webp',
  '/v11-avatar.webp','/v15-frame-left.png','/v15-frame-right.png','/rv-frame.webp'];
self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('rv-studio-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}
    return response;
  }).catch(async()=>{
    const cached=await caches.match(event.request);
    return cached||new Response('Offline: Diese Datei ist noch nicht auf diesem Gerät verfügbar.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
  }));
});
