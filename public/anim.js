/* RV Studio – Animations-Einstellungen und zufälliger Glanz.
   Einstellungen liegen in localStorage (rv_anim_v1). „Anwenden“ wirkt sofort, „Speichern“ behält sie dauerhaft. */
(function () {
  'use strict';
  var KEY = 'rv_anim_v1', root = document.documentElement;
  var DEF = { v: 2, motion: 'on', gleam: true, gleamRate: 'mittel', glint: true, globeSpin: true, globeFx: true, orb: true, shimmer: true, pulse: true, pageFx: true, ambient: true, autoLite: false };
  var OPTS = [
    ['gleam', 'Glanz', 'Ab und zu gleitet zufällig ein Glanz über ein Element'],
    ['glint', 'Randlicht', 'Lichtpunkt, der um Kacheln und Panels läuft'],
    ['globeSpin', 'Zitate wechseln', 'Alle 8 Sekunden erscheint ein neues Unternehmer-Zitat'],
    ['globeFx', 'Zitat-Effekte', 'Lichtstreif, wandernder Lichtschein und Funken auf der Zitat-Bühne'],
    ['orb', 'Panda bewegt sich', 'Der KI-Panda atmet, blinzelt, schaut sich um und reagiert auf dich'],
    ['shimmer', 'Schimmer', 'Silberne Symbole und Akzente leuchten langsam auf'],
    ['pulse', 'Sanftes Pulsieren', 'KI-Leiste, aktive Auswahl, Abzeichen und Hauptknöpfe pulsieren leicht'],
    ['pageFx', 'Seitenwechsel', 'Inhalte gleiten beim Öffnen einer Seite nacheinander herein'],
    ['ambient', 'Lichter im Hintergrund', 'Silberne Lichter wandern langsam durch den Hintergrund'],
    ['autoLite', 'Automatischer Sparmodus', 'Nur für ältere Geräte: schaltet Effekte ab, wenn die Seite ruckelt']
  ];
  var RATES = { selten: [9000, 16000], mittel: [5000, 9000], oft: [2500, 5000] };
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || 'null') || {};
      // Alte Einstellungen (vor V28): automatischer Sparmodus und Systemvorgabe waren still aktiv – jetzt standardmäßig aus.
      if (!v.v || v.v < 2) { v.autoLite = false; v.motion = 'on'; if (v.glint === false && !v.v) v.glint = true; v.v = 2; try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, DEF, v))); } catch (e) {} }
      return Object.assign({}, DEF, v); } catch (e) { return Object.assign({}, DEF); } }
  /* Bewegung: „Immer an“ (Standard), „Wie das System“ oder „Aus“. Systemregeln (prefers-reduced-motion) werden
     in den Stylesheets auf die Klasse html.rv-reduce umgeschrieben, damit die App-Einstellung entscheidet. */
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reduced(c) { c = c || cfg; return c.motion === 'off' || (c.motion === 'system' && !!mq.matches); }
  function splitSel(sel) { var out = [], d = 0, cur = ''; for (var i = 0; i < sel.length; i++) { var ch = sel[i]; if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && !d) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(function (x) { return x.trim(); }).filter(Boolean); }
  function scope(sel) { if (/^html(?=[.#:\[\s]|$)/.test(sel)) return sel.replace(/^html/, 'html.rv-reduce'); if (/^:root/.test(sel)) return sel.replace(/^:root/, ':root.rv-reduce'); return 'html.rv-reduce ' + sel; }
  function rewriteMotionRules() {
    var css = '';
    Array.prototype.forEach.call(document.styleSheets, function (sh) {
      var rules; try { rules = sh.cssRules; } catch (e) { return; } if (!rules) return;
      for (var i = rules.length - 1; i >= 0; i--) {
        var r = rules[i]; if (!r.media || !/prefers-reduced-motion/.test(r.media.mediaText)) continue;
        var rest = r.media.mediaText.replace(/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/, '').replace(/^\s*and\s*|\s*and\s*$/g, '').trim(), inner = '';
        Array.prototype.forEach.call(r.cssRules, function (x) { if (x.selectorText) inner += splitSel(x.selectorText).map(scope).join(', ') + ' { ' + x.style.cssText + ' }\n'; });
        css += rest ? '@media ' + rest + ' {\n' + inner + '}\n' : inner;
        try { sh.deleteRule(i); } catch (e) {}
      }
    });
    var st = document.createElement('style'); st.id = 'rvMotionRules'; st.textContent = css; document.head.appendChild(st);
  }
  rewriteMotionRules();
  if (mq.addEventListener) mq.addEventListener('change', function () { apply(cfg); });
  var cfg = load(), loadedMotion = cfg.motion;
  window.RVAnim = cfg;

  function apply(c) {
    cfg = c; window.RVAnim = c;
    root.classList.toggle('rv-reduce', reduced(c));
    root.classList.toggle('cc-no-glint', !c.glint);
    root.classList.toggle('cc-no-globefx', !c.globeFx);
    root.classList.toggle('cc-no-shimmer', !c.shimmer);
    root.classList.toggle('cc-no-pulse', !c.pulse);
    root.classList.toggle('cc-no-orbanim', !c.orb);
    root.classList.toggle('cc-no-pagefx', !c.pageFx);
    root.classList.toggle('cc-no-ambient', !c.ambient);
    Array.prototype.forEach.call(document.querySelectorAll('.v15-globe-wrap svg'), function (v) { if (v.pauseAnimations) { if (c.globeFx) v.unpauseAnimations(); else v.pauseAnimations(); } });
    if (window.RVFx) setTimeout(window.RVFx.redraw, 30);
    schedule();
    try { document.dispatchEvent(new CustomEvent('rv:anim-change', { detail: c })); } catch (e) {}
  }

  /* Zufälliger Glanz: ein Element zur Zeit, nur wenn sichtbar */
  var SEL = '#rvTop .rvt-tile, #hmRoot .st-m, #hmRoot .hm-q, #hmRoot .hm-row, #hmRoot .hm-cattile, #hmRoot .hm-s2, #hmRoot .hm-task, .sx-panel .st-m, .in-pf, .in-tipcard, .ch-q, .st-nav button, .st .st-action, #steps .step, .sx-pub, #s4 .bx-tab, #v11Root .v11-tile, #v11Root .v11-q, #v11Root .v11-card, #v11Root .v11-m, #v11Root .v11-s2, #s4 .bx-card, #s4 .bx-m, #s4 .bx-q, #s4 .bx-tab, #ccChat .cc-q, #finance .stat, #finance .insight';
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
    if (!cfg.gleam || reduced()) return;
    var r = RATES[cfg.gleamRate] || RATES.selten;
    timer = setTimeout(function () { gleamOnce(); schedule(); }, r[0] + Math.random() * (r[1] - r[0]));
  }

  /* Einstellungen-Karte */
  function card() {
    var grid = document.getElementById('stAnimSlot') || document.querySelector('#settingsPage .settings-grid'); if (!grid || document.getElementById('rvAnimCard')) return;
    var c = document.createElement('aside'); c.className = 'settings-card rv-anim-card'; c.id = 'rvAnimCard';
    var h = '<div class="eyebrow">DARSTELLUNG</div><h2>Animationen</h2><p class="rvcloud-small">Wähle selbst, welche Effekte laufen. „Anwenden“ zeigt die Auswahl sofort, „Speichern“ behält sie auf diesem Gerät.</p><div class="rv-anim-list"><label class="rv-anim-row rv-anim-main"><span><b>Bewegung</b><small>„Immer an“ zeigt alle Effekte – auch wenn Energiesparmodus oder „Animationen entfernen“ am Handy aktiv ist</small></span><select data-anim="motion"><option value="on">Immer an</option><option value="system">Wie das System</option><option value="off">Aus</option></select></label>';
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
    c.querySelector('#rvAnimSave').addEventListener('click', function () { var v = read(), reload = v.motion !== loadedMotion; try { localStorage.setItem(KEY, JSON.stringify(v)); say(reload ? 'Gespeichert – lädt neu, damit Globus und Kugel sich anpassen …' : 'Gespeichert und angewendet.'); } catch (e) { say('Speichern nicht möglich, aber angewendet.'); } apply(v); if (reload) setTimeout(function () { location.reload(); }, 700); });
    c.querySelector('#rvAnimReset').addEventListener('click', function () { fill(DEF); apply(Object.assign({}, DEF)); say('Standard angewendet – zum Behalten „Speichern“ tippen.'); });
  }
  /* Seitenwechsel: neu sichtbare Seite bekommt einen gestaffelten Auftritt */
  var PAGES = ['home', 's4', 'finance', 'settingsPage', 'aiChat', 's0', 's1', 's2', 's3'];
  function enter(el) {
    if (!cfg.pageFx || reduced()) return;
    el.classList.remove('cc-enter'); void el.offsetWidth; el.classList.add('cc-enter');
    clearTimeout(el._cce); el._cce = setTimeout(function () { el.classList.remove('cc-enter'); }, 1600);
  }
  function watchPages() {
    if (!window.MutationObserver) return;
    PAGES.forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      var was = !el.classList.contains('hidden');
      new MutationObserver(function () { var now = !el.classList.contains('hidden'); if (now && !was) enter(el); was = now; }).observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  }
  function ambient() {
    if (document.querySelector('.cc-ambient')) return;
    var a = document.createElement('div'); a.className = 'cc-ambient'; a.setAttribute('aria-hidden', 'true');
    a.innerHTML = '<i></i><i></i><i></i><i></i>'; document.body.insertBefore(a, document.body.firstChild);
  }
  function start() { apply(cfg); card(); watchPages(); ambient(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
