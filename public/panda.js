/* RV Studio – KI-Panda „Bao“ als Pixelfigur (V33). 32×32 Raster, gestochen scharf skaliert.
   Zustände: bereit (wippt, blinzelt, schaut deinem Finger pixelweise nach, winkt ab und zu), hört zu (beim Tippen, nickt),
   überlegt (Denkpunkte), spricht (Antwort erscheint Wort für Wort, Mund geht auf und zu, winkt), freut sich (Herz, Funkeln, Hüpfer).
   Antippen: Bao freut sich. Gekoppelt an Eingaben (#chatInput/#homeAiInput), rv:ai-state und neue Nachrichten in #homeAiFeed.
   Die Chat-Logik selbst bleibt unverändert. */
(function () {
  'use strict';
  var doc = document, NAME = 'Bao', pandas = [];
  var PX = {pal:{"o": "#3b4250", "k": "#171a20", "w": "#f5f7fa", "s": "#c9d0d9", "e": "#2a2f38", "W": "#ffffff", "p": "#0b0d11", "m": "#0b0d11", "t": "#f28b9a", "c": "#f28b9a", "h": "#c9d0d9", "H": "#8a929e", "g": "#22c55e", "d": "#e8edf3"},base:["................................", ".......oo..............oo.......", ".....ookkoohhhhhhhhhhookkoo.....", "....okkkkhhoooooooooohhkkkko....", "....okkkhkkowwwwwwwwokkhkkko....", "....okkeekwwwwwwwwwwwwkeekko....", "....okkekwwwwwwwwwwwwwwkekko....", "....okkkwwwwwwwwwwwwwwwwkkko....", ".....okwwwwwwwwwwwwwwwwwwko.....", ".....owwwwwwwwwwwwwwwwwwwwo.....", "....hhgwwkkkkwwwwwwkkkkwwwo.....", "....Hhhwwkkkkkwwwwkkkkkwwwo.....", "....Hhhwwkkkkkwwwwkkkkkwwwo.....", "....Hhhwwkkkkkwwwwkkkkkwwwo.....", "....hhhwwkkkkwwwwwwkkkkwwwo.....", ".....ohhwwwkwwwppwwwkwwwwwo.....", "......owhhhHwwwppwwwwwswwo......", ".......owsswwwwwwwwwwsswo.......", "........owwsswwwwwwsswwo........", "........oowwwwsssswwwwooo.......", "......ookkkkkwwwwwwkkkkkko......", ".....okkkkkkkkkkkkkkkkkkko......", "....okkkkkwwwwwwwwwwwwwoo.......", "....okkkkkwwwwwwwwwwwwwwo.......", "....okkkkkwwwwwwwwwwwwwwo.......", "....okkkkkwwwwwwwwwwwwwwo.......", "....okkkkkwwwwwwwwwwwwwwo.......", ".....okkkwwwwwwwwwwwwwwo........", "......oookkkkksssskkkkko........", ".......okkkkkkkwwkkkkkkko.......", ".......okkkkkkkwwkkkkkkko.......", "........okkkkkooookkkkko........"],layers:{"eyes": "11,12,W;12,12,W;11,13,W;12,13,W;20,12,W;21,12,W;20,13,W;21,13,W", "pupils": "12,13,p;21,13,p", "blink": "10,13,s;11,13,s;12,13,s;19,13,s;20,13,s;21,13,s", "happy": "10,13,W;11,12,W;12,12,W;13,13,W;19,13,W;20,12,W;21,12,W;22,13,W", "mouth": "14,17,m;15,18,m;16,18,m;17,17,m", "mouthOpen": "14,17,m;15,17,m;16,17,m;17,17,m;14,18,m;15,18,t;16,18,t;17,18,m;15,19,m;16,19,m", "cheeks": "8,16,c;9,16,c;22,16,c;23,16,c", "armDown": "23,22,k;23,23,k;23,24,k;23,25,k;23,26,k;23,27,k;24,22,k;24,23,k;24,24,k;24,25,k;24,26,k;24,27,k;25,22,k;25,23,k;25,24,k;25,25,k;25,26,k;25,27,k", "armUp": "23,16,k;23,17,k;23,18,k;23,19,k;24,14,k;24,15,k;24,16,k;24,17,k;24,18,k;24,19,k;24,20,k;24,21,k;25,14,k;25,15,k;25,16,k;25,17,k;25,18,k;25,19,k;25,20,k;25,21,k;26,14,k;26,15,k;26,16,k;26,17,k;26,18,k;26,19,k;26,20,k;26,21,k;27,16,k;27,17,k;27,18,k;27,19,k", "dots": "26,4,d;28,2,d;29,2,d;28,3,d;29,3,d;30,0,d;31,0,d;30,1,d;31,1,d", "heart": "26,3,t;28,3,t;25,4,t;26,4,t;27,4,t;28,4,t;29,4,t;26,5,t;27,5,t;28,5,t;27,6,t", "spark": "3,4,d;2,5,d;3,5,W;4,5,d;3,6,d;28,10,d;27,11,d;28,11,W;29,11,d;28,12,d"}};

  function rects(rows) { // Pixel zeilenweise zu Rechtecken zusammenfassen
    var out = '';
    rows.forEach(function (row, y) {
      var x = 0;
      while (x < row.length) {
        var c = row[x]; if (c === '.') { x++; continue; }
        var x0 = x; while (x < row.length && row[x] === c) x++;
        out += '<rect x="' + x0 + '" y="' + y + '" width="' + (x - x0) + '" height="1" fill="' + PX.pal[c] + '"/>';
      }
    });
    return out;
  }
  function layer(name) {
    return '<g class="px-' + name + '">' + PX.layers[name].split(';').map(function (q) { var p = q.split(','); return '<rect x="' + p[0] + '" y="' + p[1] + '" width="1" height="1" fill="' + PX.pal[p[2]] + '"/>'; }).join('') + '</g>';
  }
  var BODY = rects(PX.base);
  var LAYERS = ['eyes', 'pupils', 'blink', 'happy', 'mouth', 'mouthOpen', 'cheeks', 'armDown', 'armUp', 'dots', 'heart', 'spark'].map(layer).join('');
  function svgMarkup(head) {
    return '<svg class="px" viewBox="' + (head ? '3 0 26 21' : '-1 -2 34 35') + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><g class="px-all">' + BODY + LAYERS + '</g></svg>';
  }
  function anim() { var a = window.RVAnim || {}; return a.orb !== false && !doc.documentElement.classList.contains('rv-reduce'); }

  function Panda(host, opt) {
    opt = opt || {};
    host.insertAdjacentHTML('beforeend', svgMarkup(opt.head));
    var svg = host.lastElementChild, pupils = svg.querySelector('.px-pupils');
    var api = { svg: svg, st: '', host: host };
    api.state = function (s) {
      ['listen', 'think', 'talk', 'happy'].forEach(function (c) { svg.classList.toggle(c, c === s); });
      api.st = s || '';
      if (s === 'think') api.look(0, -1, true); else if (s === 'listen') api.look(-1, 0, true); else if (s) api.look(0, 0, true);
      if (s !== 'talk') api.mouth(false);
    };
    api.look = function (x, y, force) { if (!force && api.st) return; pupils.setAttribute('transform', 'translate(' + x + ' ' + y + ')'); };
    api.mouth = function (open) { svg.classList.toggle('mo', !!open); };
    api.nod = function () { svg.classList.remove('nod'); void svg.getBoundingClientRect(); svg.classList.add('nod'); };
    api.flash = function (cls, ms) { svg.classList.add(cls); setTimeout(function () { svg.classList.remove(cls); }, ms); };
    host.addEventListener('click', function (e) {
      if (opt.noTap) return; if (e.target.closest('button') && e.target.closest('button') !== host) return;
      if (!api.st) { api.flash('love', 1400); }
    });
    pandas.push(api);
    return api;
  }

  /* Lebenszeichen: blinzeln, umherschauen, ab und zu winken */
  function life() {
    (function blink() {
      setTimeout(function () { if (anim()) pandas.forEach(function (p) { if (!p.st || p.st === 'listen') p.flash('blink', 160); }); blink(); }, 2600 + Math.random() * 3000);
    })();
    (function wave() {
      setTimeout(function () { if (anim()) { var p = pandas[Math.floor(Math.random() * pandas.length)]; if (p && !p.st) p.flash('wave', 1300); } wave(); }, 9000 + Math.random() * 9000);
    })();
    var lastMove = 0;
    doc.addEventListener('pointermove', function (e) {
      lastMove = Date.now(); if (!anim()) return;
      pandas.forEach(function (p) {
        if (p.st) return; var r = p.svg.getBoundingClientRect(); if (!r.width) return;
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * .4);
        p.look(dx < -r.width * .25 ? -1 : 0, dy < -r.height * .2 ? -1 : 0);
      });
    }, { passive: true });
    setInterval(function () {
      if (!anim() || Date.now() - lastMove < 4000) return;
      pandas.forEach(function (p) { if (!p.st && Math.random() < .5) p.look(Math.random() < .5 ? -1 : 0, Math.random() < .3 ? -1 : 0); });
    }, 2400);
  }

  /* ---------- Zustände für alle Pandas ---------- */
  var mode = '', quietT = 0, talkRun = 0;
  var LABELS = { '': 'Wartet auf dich', listen: 'Hört zu …', think: 'Überlegt …', talk: 'Spricht …', happy: 'Fertig' };
  function setAll(s) {
    mode = s; pandas.forEach(function (p) { p.state(s); });
    Array.prototype.forEach.call(doc.querySelectorAll('.pd-state'), function (el) { el.dataset.s = s || 'idle'; var b = el.querySelector('b'); if (b) b.textContent = LABELS[s] || LABELS['']; });
  }
  function onType(e) {
    if (mode === 'think' || mode === 'talk') return;
    if (!String(e.target.value || '').trim()) { clearTimeout(quietT); setAll(''); return; }
    if (mode !== 'listen') setAll('listen');
    pandas.forEach(function (p) { p.nod(); });
    clearTimeout(quietT); quietT = setTimeout(function () { if (mode === 'listen') setAll(''); }, 1800);
  }

  /* Antwort Wort für Wort sichtbar machen, Mund dazu bewegen */
  function revealTarget() {
    var chat = doc.getElementById('aiChat');
    if (chat && !chat.classList.contains('hidden')) {
      var rows = doc.querySelectorAll('#chFeed .ch-msg.ai'); var row = rows[rows.length - 1];
      if (row && !row.querySelector('.ch-typing')) return row.querySelector('.ch-bubble');
    }
    var hm = doc.querySelectorAll('#homeAiFeed .home-msg:not(.user)'); var last = hm[hm.length - 1];
    return last ? (last.querySelector('div') || last) : null;
  }
  function wrapWords(root) {
    var words = [], list = [], n, walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (t) { return t.parentNode.closest('.ch-meta, .ch-tag, small') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(function (t) {
      var frag = doc.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) { frag.appendChild(doc.createTextNode(w)); return; } var s = doc.createElement('span'); s.className = 'pd-w'; s.textContent = w; frag.appendChild(s); words.push(s); });
      t.parentNode.replaceChild(frag, t);
    });
    return words;
  }
  function speak(text) {
    var run = ++talkRun, plain = String(text || '').split(/\s+/).filter(Boolean);
    setAll('talk');
    setTimeout(function () {
      if (run !== talkRun) return;
      var target = revealTarget(), words = target && anim() ? wrapWords(target) : [];
      var count = words.length || plain.length, i = 0, step = Math.max(45, Math.min(110, 5200 / Math.max(1, count)));
      (function tick() {
        if (run !== talkRun) return;
        if (i >= count) {
          pandas.forEach(function (p) { p.mouth(false); });
          setAll('happy');
          setTimeout(function () { if (run === talkRun && mode === 'happy') setAll(''); }, 1300);
          return;
        }
        var w = words[i] ? words[i].textContent : plain[i] || '';
        if (words[i]) words[i].classList.add('on');
        pandas.forEach(function (p) { p.mouth(/[aeiouäöü]/i.test(w)); });
        setTimeout(function () { pandas.forEach(function (p) { p.mouth(false); }); }, step * .55);
        i++; setTimeout(tick, step + (/[.!?:]$/.test(w) ? 160 : /,$/.test(w) ? 80 : 0));
      })();
    }, 60);
  }
  function hookMessages() {
    var feed = doc.getElementById('homeAiFeed'); if (!feed || !window.MutationObserver || feed._pd) return; feed._pd = true;
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) {
          if (!n.classList || !n.classList.contains('home-msg') || n.classList.contains('user')) return;
          var body = n.querySelector('div'), s = body ? body.textContent : n.textContent;
          if (/^Ich frage .+ an …$/.test(String(s).trim())) return;
          speak(s);
        });
      });
    }).observe(feed, { childList: true });
  }

  /* ---------- Einbau ---------- */
  function mount() {
    doc.documentElement.style.setProperty('--pd-head', 'url("data:image/svg+xml,' + encodeURIComponent(svgMarkup(true).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')) + '")');
    var frame = doc.querySelector('#hmOrb .v15-bot-frame') || doc.getElementById('hmOrb');
    if (frame && !frame.querySelector('.px')) {
      Array.prototype.slice.call(frame.children).forEach(function (c) { c.remove(); });
      frame.classList.add('pd-host', 'pd-home'); frame.setAttribute('title', 'Bao antippen');
      frame.insertAdjacentHTML('beforeend', '<span class="pd-floor" aria-hidden="true"></span>');
      Panda(frame, {});
    }
    var main = doc.querySelector('#aiChat .ch-main'), feed = doc.getElementById('chFeed');
    if (main && feed && !main.querySelector('.pd-stage')) {
      var st = doc.createElement('div'); st.className = 'pd-stage';
      st.innerHTML = '<span class="pd-state" data-s="idle"><i></i><b>' + LABELS[''] + '</b></span><span class="pd-plate"><b>' + NAME + '</b><small>Dein KI-Assistent · antippen</small></span><span class="pd-floor" aria-hidden="true"></span><span class="pd-hold"></span>';
      main.insertBefore(st, feed);
      Panda(st.querySelector('.pd-hold'), {});
    }
    [['#ccChatAvatar', 'pd-mini'], ['#v11AiPill .dot', 'pd-mini pd-dot'], ['#navChat', 'pd-mini pd-nav']].forEach(function (q) {
      var h = doc.querySelector(q[0]); if (!h || h.querySelector('.px')) return;
      h.replaceChildren(); q[1].split(' ').forEach(function (c) { h.classList.add(c); }); Panda(h, { head: true, noTap: true });
    });
    var navChat = doc.getElementById('navChat'); if (navChat && !navChat.getAttribute('aria-label')) navChat.setAttribute('aria-label', 'KI-Chat');
    var pill = doc.querySelector('#v11AiPill > span'); if (pill && /KI-Assistent/.test(pill.textContent)) pill.innerHTML = NAME + ', dein KI-Panda,<br>ist bereit.';
  }
  function init() {
    mount(); hookMessages();
    ['chatInput', 'homeAiInput'].forEach(function (id) { var el = doc.getElementById(id); if (el) el.addEventListener('input', onType); });
    doc.addEventListener('rv:ai-state', function (e) {
      var s = e && e.detail && e.detail.state;
      if (s === 'busy') { clearTimeout(quietT); talkRun++; setAll('think'); }
      else if (mode === 'think') setAll('');
    });
    if (window.MutationObserver) { var cm = doc.getElementById('aiChat'); if (cm) new MutationObserver(function () { if (!cm.querySelector('.pd-stage')) mount(); }).observe(cm, { childList: true }); }
    life();
    window.RVPanda = { name: NAME, state: setAll, speak: speak, list: pandas };
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
