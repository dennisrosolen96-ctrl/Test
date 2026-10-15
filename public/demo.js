/* RV Studio – 20 Beispielartikel. Werden nur angelegt, wenn der Bestand leer ist,
   und sind über „Beispielartikel entfernen“ im Bestand wieder löschbar (sku beginnt mit DEMO-). */
(function () {
  'use strict';
  var ICON = {
    shoe: '<path d="M14 62c0-8 4-14 10-16l10-3 6-12 8 2 4 10c6 4 14 6 22 6 8 0 12 4 12 10v5H14z" fill="none" stroke="#ffd585" stroke-width="2.6" stroke-linejoin="round"/><path d="M14 67h72" stroke="#ffd585" stroke-width="2.6"/><path d="M40 44l6 4m-2-9l6 4" stroke="#ffd585" stroke-width="2"/>',
    shirt: '<path d="M34 22l-14 8 6 12 6-3v35h36V39l6 3 6-12-14-8c-2 6-6 9-16 9s-14-3-16-9z" fill="none" stroke="#ffd585" stroke-width="2.6" stroke-linejoin="round"/>',
    jacket: '<path d="M36 20l-16 9v47h22V40l8 8 8-8v36h22V29l-16-9-14 14z" fill="none" stroke="#ffd585" stroke-width="2.6" stroke-linejoin="round"/><path d="M50 48v28" stroke="#ffd585" stroke-width="2"/>',
    phone: '<rect x="34" y="16" width="32" height="64" rx="6" fill="none" stroke="#ffd585" stroke-width="2.6"/><path d="M46 22h8M48 72h4" stroke="#ffd585" stroke-width="2.4" stroke-linecap="round"/>',
    card: '<rect x="30" y="18" width="40" height="58" rx="4" fill="none" stroke="#ffd585" stroke-width="2.6"/><circle cx="50" cy="42" r="10" fill="none" stroke="#ffd585" stroke-width="2"/><path d="M36 64h28" stroke="#ffd585" stroke-width="2"/>',
    bag: '<path d="M26 36h48l-4 40H30z" fill="none" stroke="#ffd585" stroke-width="2.6" stroke-linejoin="round"/><path d="M38 40V30a12 12 0 0 1 24 0v10" fill="none" stroke="#ffd585" stroke-width="2.6"/>',
    watch: '<circle cx="50" cy="48" r="16" fill="none" stroke="#ffd585" stroke-width="2.6"/><path d="M42 34l2-14h12l2 14M42 62l2 14h12l2-14M50 40v8l6 4" fill="none" stroke="#ffd585" stroke-width="2.4" stroke-linejoin="round"/>',
    cap: '<path d="M20 58c0-18 13-30 30-30s30 12 30 30z" fill="none" stroke="#ffd585" stroke-width="2.6"/><path d="M20 58h62c6 0 8 4 8 6H20z" fill="none" stroke="#ffd585" stroke-width="2.4"/>',
    console: '<rect x="18" y="34" width="64" height="30" rx="14" fill="none" stroke="#ffd585" stroke-width="2.6"/><path d="M32 44v10M27 49h10" stroke="#ffd585" stroke-width="2.4"/><circle cx="64" cy="46" r="2.6" fill="#ffd585"/><circle cx="70" cy="52" r="2.6" fill="#ffd585"/>'
  };
  function photo(icon, hue) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="hsl(' + hue + ',45%,30%)"/><stop offset=".6" stop-color="#121a28"/><stop offset="1" stop-color="#070a11"/></radialGradient><radialGradient id="h" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#ffb060" stop-opacity=".28"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="50" r="40" fill="url(#h)"/>' + ICON[icon] + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function day(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
  var L = [
    ['Nike', 'Air Jordan 1 Mid', 'Sneaker', '43', 9, 85, 149, 'Online', 'shoe', 30, 'A1'],
    ['Adidas', 'Samba OG', 'Sneaker', '42', 10, 62, 109, 'Online', 'shoe', 205, 'A1'],
    ['New Balance', '550 White Green', 'Sneaker', '44', 8, 58, 99, 'Verkauft', 'shoe', 120, 'A2'],
    ['Nike', 'Dunk Low Panda', 'Sneaker', '41', 9, 70, 119, 'Bereit', 'shoe', 12, 'A2'],
    ['Asics', 'Gel-1130 Silver', 'Sneaker', '45', 10, 54, 95, 'Online', 'shoe', 64, 'A3'],
    ['Stüssy', 'Basic Logo Tee', 'Streetwear', 'L', 8, 18, 45, 'Online', 'shirt', 18, 'B1'],
    ['Carhartt WIP', 'Detroit Jacket', 'Streetwear', 'M', 9, 65, 139, 'Verkauft', 'jacket', 75, 'B1'],
    ['The North Face', 'Nuptse 1996', 'Streetwear', 'L', 8, 120, 219, 'Online', 'jacket', 9, 'B2'],
    ['Supreme', 'Box Logo Cap', 'Streetwear', 'One Size', 10, 35, 79, 'Entwurf', 'cap', 3, 'B2'],
    ['Ralph Lauren', 'Cable Knit Pullover', 'Streetwear', 'M', 9, 22, 59, 'Bereit', 'shirt', 41, 'B3'],
    ['Apple', 'iPhone 13 128 GB', 'Elektronik', '', 8, 340, 459, 'Online', 'phone', 22, 'C1'],
    ['Nintendo', 'Switch OLED', 'Elektronik', '', 9, 210, 279, 'Verkauft', 'console', 90, 'C1'],
    ['Sony', 'PlayStation Portal', 'Elektronik', '', 10, 150, 199, 'Online', 'console', 15, 'C2'],
    ['Apple', 'Watch Series 8', 'Elektronik', '45 mm', 8, 190, 259, 'Entwurf', 'watch', 6, 'C2'],
    ['Pokémon', 'Glurak ex 199/165', 'Sammelkarten', '', 10, 95, 179, 'Online', 'card', 70, 'D1'],
    ['Pokémon', 'Display 151 (versiegelt)', 'Sammelkarten', '', 10, 140, 219, 'Bereit', 'card', 25, 'D1'],
    ['Yu-Gi-Oh!', 'Blauäugiger w. Drache LOB', 'Sammelkarten', '', 7, 60, 129, 'Verkauft', 'card', 150, 'D2'],
    ['Louis Vuitton', 'Pochette Accessoires', 'Sonstiges', '', 8, 310, 489, 'Online', 'bag', 48, 'E1'],
    ['Casio', 'G-Shock GA-2100', 'Sonstiges', '', 9, 55, 89, 'Bereit', 'watch', 11, 'E1'],
    ['Lego', 'Star Wars 75192 (OVP)', 'Sonstiges', '', 10, 520, 749, 'Entwurf', 'card', 1, 'E2']
  ];
  var HUE = { Sneaker: 215, Streetwear: 28, Elektronik: 200, Sammelkarten: 40, Sonstiges: 260 };
  function build() {
    return L.map(function (r, i) {
      var price = r[6], sold = r[7] === 'Verkauft';
      return {
        id: 'demo-' + (i + 1), sku: 'DEMO-' + String(i + 1).padStart(3, '0'), brand: r[0], model: r[1], category: r[2], size: r[3],
        condition: String(r[4]), cost: String(r[5]), notes: 'Beispielartikel', measurements: '', material: '', color: '', country: '',
        location: 'Regal ' + r[10], chest: '', length: '', purchaseDate: day(r[9]), source: 'Beispiel',
        sale: sold ? { price: price - 6, date: day(Math.max(0, Math.floor(i / 3))), fees: Math.round(price * 0.06), shipping: 5.49, platform: 'Vinted' } : null,
        articleStatus: r[7], shippedAt: sold && i % 2 ? Date.now() : null,
        prices: { ebay: String(price + 10), vinted: String(price), instagram: String(price + 5) },
        listings: { ebay: { title: r[0] + ' ' + r[1], description: '' }, vinted: { title: r[0] + ' ' + r[1], description: '' }, instagram: { title: '', description: '' } },
        photos: [{ src: photo(r[8], HUE[r[2]]), edit: {} }], createdAt: day(r[9]), updatedAt: new Date().toISOString()
      };
    });
  }
  function open(cb) {
    var q = indexedDB.open('RVStudioDB', 1);
    q.onupgradeneeded = function () { if (!q.result.objectStoreNames.contains('articles')) q.result.createObjectStore('articles', { keyPath: 'id' }); };
    q.onsuccess = function () { cb(q.result); }; q.onerror = function () {};
  }
  function refresh() {
    try { if (typeof renderHome === 'function') renderHome(); } catch (e) {}
    try { if (typeof renderLibrary === 'function') renderLibrary(); } catch (e) {}
    var n = document.getElementById('navHome'); if (n && !document.getElementById('home').classList.contains('hidden')) n.click();
  }
  function seed() {
    try { if (localStorage.getItem('rv_demo_done') === '1') return; } catch (e) {}
    if (!window.indexedDB) return;
    open(function (db) {
      var c = db.transaction('articles', 'readonly').objectStore('articles').count();
      c.onsuccess = function () {
        if (c.result > 0) { try { localStorage.setItem('rv_demo_done', '1'); } catch (e) {} db.close(); return; }
        var tx = db.transaction('articles', 'readwrite'), st = tx.objectStore('articles');
        build().forEach(function (a) { st.put(a); });
        tx.oncomplete = function () { db.close(); try { localStorage.setItem('rv_demo_done', '1'); } catch (e) {} var b = document.getElementById('rvDemoRemove'); if (b) b.hidden = false; refresh(); };
      };
    });
  }
  window.RVDemo = {
    remove: function () {
      open(function (db) {
        var tx = db.transaction('articles', 'readwrite'), st = tx.objectStore('articles');
        for (var i = 1; i <= L.length; i++) st.delete('demo-' + i);
        tx.oncomplete = function () { db.close(); refresh(); var b = document.getElementById('rvDemoRemove'); if (b) b.hidden = true; };
      });
    }
  };
  function button() {
    var row = document.querySelector('.lux-stock-action-row'); if (!row || document.getElementById('rvDemoRemove')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'rvDemoRemove'; b.className = 'v6-small-btn'; b.textContent = 'Beispielartikel entfernen';
    b.addEventListener('click', function () { if (confirm('Die 20 Beispielartikel löschen? Deine eigenen Artikel bleiben erhalten.')) window.RVDemo.remove(); });
    row.appendChild(b);
    open(function (db) { var g = db.transaction('articles', 'readonly').objectStore('articles').get('demo-1'); g.onsuccess = function () { b.hidden = !g.result; db.close(); }; });
  }
  function start() { button(); setTimeout(seed, 300); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
