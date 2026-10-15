/* RV Studio – Animations-Einstellungen und zufälliger Glanz.
   Einstellungen liegen in localStorage (rv_anim_v1). „Anwenden“ wirkt sofort, „Speichern“ behält sie dauerhaft. */
(function () {
  'use strict';
  var KEY = 'rv_anim_v1', root = document.documentElement;
  var DEF = { gleam: true, gleamRate: 'selten', glint: false, globeSpin: true, globeFx: true, orb: true, shimmer: true, pulse: true, autoLite: true };
  var OPTS = [
    ['gleam', 'Glanz', 'Ab und zu gleitet zufällig ein Glanz über ein Element'],
    ['glint', 'Randlicht', 'Lichtpunkt, der dauerhaft um die Kacheln läuft (rechenintensiv)'],
    ['globeSpin', 'Globus dreht sich', 'Erde, Stadtlichter und Routen bewegen sich'],
    ['globeFx', 'Globus-Effekte', 'Goldstrahlen, Ringe, Lichtbögen und Funken um den Globus'],
    ['orb', 'Energieball', 'Lichtbänder des KI-Balls bewegen sich'],
    ['shimmer', 'Gold-Schimmer', 'Goldene Symbole und Texte schimmern langsam'],
    ['pulse', 'Sanftes Pulsieren', 'KI-Leiste, „Heute“, Abzeichen und Hauptknöpfe pulsieren leicht'],
    ['autoLite', 'Automatischer Sparmodus', 'Schaltet bei sehr langsamen Geräten teure Effekte selbst ab']
  ];
  var RATES = { selten: [9000, 16000], mittel: [5000, 9000], oft: [2500, 5000] };
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return Object.assign({}, DEF, v || {}); } catch (e) { return Object.assign({}, DEF); } }
  var cfg = load();
  window.RVAnim = cfg;

  function apply(c) {
    cfg = c; window.RVAnim = c;
    root.classList.toggle('cc-no-glint', !c.glint);
    root.classList.toggle('cc-no-globefx', !c.globeFx);
    root.classList.toggle('cc-no-shimmer', !c.shimmer);
    root.classList.toggle('cc-no-pulse', !c.pulse);
    root.classList.toggle('cc-no-orbanim', !c.orb);
    Array.prototype.forEach.call(document.querySelectorAll('.v15-globe-wrap svg'), function (v) { if (v.pauseAnimations) { if (c.globeFx) v.unpauseAnimations(); else v.pauseAnimations(); } });
    if (window.RVFx) setTimeout(window.RVFx.redraw, 30);
    schedule();
  }

  /* Zufälliger Glanz: ein Element zur Zeit, nur wenn sichtbar */
  var SEL = '#v11Root .v11-tile, #v11Root .v11-q, #v11Root .v11-card, #v11Root .v11-m, #v11Root .v11-s2, #s4 .stock-card, #s4 .v5-kpi, #s4 .v6-tile, #ccChat .cc-q, #finance .stat, #finance .insight';
  var timer = null;
  function gleamOnce() {
    var list = Array.prototype.filter.call(document.querySelectorAll(SEL), function (e) {
      if (!e.offsetParent) return false; var r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 30;
    });
    if (!list.length || document.hidden) return;
    var el = list[Math.floor(Math.random() * list.length)];
    var g = document.createElement('i'); g.className = 'cc-gleam'; g.setAttribute('aria-hidden', 'true');
    el.appendChild(g);
    setTimeout(function () { g.remove(); }, 2300);
  }
  function schedule() {
    clearTimeout(timer);
    if (!cfg.gleam || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = RATES[cfg.gleamRate] || RATES.selten;
    timer = setTimeout(function () { gleamOnce(); schedule(); }, r[0] + Math.random() * (r[1] - r[0]));
  }

  /* Einstellungen-Karte */
  function card() {
    var grid = document.querySelector('#settingsPage .settings-grid'); if (!grid || document.getElementById('rvAnimCard')) return;
    var c = document.createElement('aside'); c.className = 'settings-card rv-anim-card'; c.id = 'rvAnimCard';
    var h = '<div class="eyebrow">DARSTELLUNG</div><h2>Animationen</h2><p class="rvcloud-small">Wähle selbst, welche Effekte laufen. „Anwenden“ zeigt die Auswahl sofort, „Speichern“ behält sie auf diesem Gerät.</p><div class="rv-anim-list">';
    OPTS.forEach(function (o) {
      h += '<label class="rv-anim-row"><span><b>' + o[1] + '</b><small>' + o[2] + '</small></span><input type="checkbox" data-anim="' + o[0] + '"><i class="rv-switch" aria-hidden="true"></i></label>';
      if (o[0] === 'gleam') h += '<label class="rv-anim-row rv-anim-sub"><span><b>Häufigkeit des Glanzes</b></span><select data-anim="gleamRate"><option value="selten">Selten</option><option value="mittel">Mittel</option><option value="oft">Oft</option></select></label>';
    });
    h += '</div><div class="settings-btns"><button type="button" id="rvAnimApply" class="secondary">Anwenden</button><button type="button" id="rvAnimSave">Speichern</button><button type="button" id="rvAnimReset" class="secondary">Standard</button></div><p class="rvcloud-small" id="rvAnimStatus" role="status" aria-live="polite"></p>';
    c.innerHTML = h; grid.appendChild(c);
    function fill(v) { Array.prototype.forEach.call(c.querySelectorAll('[data-anim]'), function (i) { var k = i.dataset.anim; if (i.type === 'checkbox') i.checked = !!v[k]; else i.value = v[k]; }); }
    function read() { var v = Object.assign({}, cfg); Array.prototype.forEach.call(c.querySelectorAll('[data-anim]'), function (i) { var k = i.dataset.anim; v[k] = i.type === 'checkbox' ? i.checked : i.value; }); return v; }
    var st = c.querySelector('#rvAnimStatus');
    function say(t) { st.textContent = t; }
    fill(cfg);
    c.querySelector('#rvAnimApply').addEventListener('click', function () { apply(read()); say('Angewendet – noch nicht gespeichert.'); });
    c.querySelector('#rvAnimSave').addEventListener('click', function () { var v = read(); try { localStorage.setItem(KEY, JSON.stringify(v)); say('Gespeichert und angewendet.'); } catch (e) { say('Speichern nicht möglich, aber angewendet.'); } apply(v); });
    c.querySelector('#rvAnimReset').addEventListener('click', function () { fill(DEF); apply(Object.assign({}, DEF)); say('Standard angewendet – zum Behalten „Speichern“ tippen.'); });
  }
  function start() { apply(cfg); card(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
