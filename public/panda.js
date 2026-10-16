/* RV Studio – KI-Panda „Bao“ (ersetzt Energiekugel, Roboter und Globus-Avatar).
   Zustände: bereit (atmet, blinzelt, schaut deinem Finger nach), hört zu (beim Tippen), überlegt (KI arbeitet),
   spricht (Antwort erscheint Wort für Wort, Mund bewegt sich), freut sich (Antwort fertig).
   Gekoppelt an: Eingabe in #chatInput/#homeAiInput, Ereignis rv:ai-state und neue Nachrichten in #homeAiFeed.
   Die Chat-Logik selbst bleibt unverändert. */
(function () {
  'use strict';
  var doc = document, NAME = 'Bao', pandas = [], serial = 0;
  var K = '#1b1b1d', W = '#f7f5f0';

  function svgMarkup(vb) {
    return '<svg class="pd" viewBox="' + (vb || '0 0 200 222') + '" aria-hidden="true" focusable="false"><g class="pd-all">'
      + '<ellipse cx="74" cy="214" rx="17" ry="9" fill="' + K + '"/><ellipse cx="126" cy="214" rx="17" ry="9" fill="' + K + '"/>'
      + '<path d="M54 220C52 182 72 158 100 158C128 158 148 182 146 220Z" fill="#f4f2ed"/>'
      + '<ellipse cx="100" cy="202" rx="28" ry="20" fill="#e6e3dc"/>'
      + '<path d="M58 180C74 166 126 166 142 180L146 196C126 184 74 184 54 196Z" fill="' + K + '"/>'
      + '<ellipse cx="54" cy="202" rx="11" ry="16" fill="' + K + '"/>'
      + '<g class="pd-paw"><ellipse cx="146" cy="200" rx="11" ry="16" fill="' + K + '"/><ellipse cx="146" cy="190" rx="5" ry="3.5" fill="#3a3a3e"/></g>'
      + '<path d="M66 162C82 172 118 172 134 162L136 173C118 183 82 183 64 173Z" fill="#c9ccd1"/>'
      + '<path d="M111 174L120 199L106 201L102 177Z" fill="#a4a8ae"/><path d="M106 186l10-2" stroke="#eceef0" stroke-width="1.6" stroke-linecap="round"/>'
      + '<g class="pd-head">'
      + '<g class="pd-earL"><circle cx="54" cy="62" r="19" fill="' + K + '"/><circle cx="54" cy="62" r="9" fill="#3a3a3e"/></g>'
      + '<g class="pd-earR"><circle cx="146" cy="62" r="19" fill="' + K + '"/><circle cx="146" cy="62" r="9" fill="#3a3a3e"/></g>'
      + '<ellipse cx="100" cy="108" rx="64" ry="55" fill="' + W + '"/>'
      + '<ellipse cx="100" cy="132" rx="50" ry="28" fill="#ece9e2" opacity=".55"/>'
      + '<ellipse cx="74" cy="112" rx="15" ry="20" transform="rotate(-28 74 112)" fill="' + K + '"/>'
      + '<ellipse cx="126" cy="112" rx="15" ry="20" transform="rotate(28 126 112)" fill="' + K + '"/>'
      + '<g class="pd-eyesOpen">'
      + '<g class="pd-eye"><circle cx="77" cy="109" r="7.2" fill="#fff"/><g class="pd-pupil"><circle cx="77" cy="110" r="4.6" fill="#111"/><circle cx="79" cy="107.6" r="1.7" fill="#fff"/></g></g>'
      + '<g class="pd-eye"><circle cx="123" cy="109" r="7.2" fill="#fff"/><g class="pd-pupil"><circle cx="123" cy="110" r="4.6" fill="#111"/><circle cx="125" cy="107.6" r="1.7" fill="#fff"/></g></g>'
      + '</g>'
      + '<g class="pd-happy" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M69 112Q77 103 85 112"/><path d="M115 112Q123 103 131 112"/></g>'
      + '<g class="pd-brows" fill="none" stroke="#9a9da3" stroke-width="2.6" stroke-linecap="round"><path d="M63 85Q71 80 80 83"/><path d="M120 83Q129 80 137 85"/></g>'
      + '<ellipse cx="100" cy="138" rx="21" ry="14" fill="#ebe8e1"/>'
      + '<path d="M92 130Q100 125 108 130Q106 137 100 138Q94 137 92 130Z" fill="' + K + '"/><ellipse cx="98" cy="129.6" rx="2.6" ry="1.2" fill="#fff" opacity=".6"/>'
      + '<g class="pd-mouthO"><path d="M92 145Q100 144 108 145Q107 158 100 159Q93 158 92 145Z" fill="#2b1717"/><ellipse cx="100" cy="155" rx="5" ry="3" fill="#d98c8c"/></g>'
      + '<path d="M91 144Q95.5 149 100 144Q104.5 149 109 144" fill="none" stroke="' + K + '" stroke-width="2.2" stroke-linecap="round"/>'
      + '<ellipse cx="58" cy="134" rx="8" ry="4.5" fill="#f2a9a9" opacity=".3"/><ellipse cx="142" cy="134" rx="8" ry="4.5" fill="#f2a9a9" opacity=".3"/>'
      + '</g>'
      + '<g class="pd-dots" fill="#eceef0"><circle cx="154" cy="44" r="3"/><circle cx="166" cy="33" r="4"/><circle cx="181" cy="23" r="5"/></g>'
      + '</g></svg>';
  }
  var HEAD_VB = '30 40 140 128';

  function anim() { var a = window.RVAnim || {}; return a.orb !== false && !doc.documentElement.classList.contains('rv-reduce'); }

  function Panda(host, opt) {
    opt = opt || {};
    host.insertAdjacentHTML('beforeend', svgMarkup(opt.head ? HEAD_VB : null));
    var svg = host.lastElementChild, pupils = svg.querySelectorAll('.pd-pupil'), mouth = svg.querySelector('.pd-mouthO');
    var api = { svg: svg, st: '', host: host, big: !!opt.big };
    svg.classList.add('pd-' + (++serial));
    api.state = function (s) {
      ['listen', 'think', 'talk', 'happy'].forEach(function (c) { svg.classList.toggle(c, c === s); });
      api.st = s || '';
      if (s === 'think') api.look(3, -4, true); else if (s === 'listen') api.look(-1.5, 3.5, true); else if (s) api.look(0, 0, true);
      if (s !== 'talk') api.mouth(0);
    };
    api.look = function (x, y, force) { if (!force && api.st) return; Array.prototype.forEach.call(pupils, function (p) { p.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)'; }); };
    api.mouth = function (v) { mouth.style.transform = 'scaleY(' + Math.max(0.04, v) + ')'; };
    api.nod = function () { svg.classList.remove('nod'); void svg.getBoundingClientRect(); svg.classList.add('nod'); };
    api.mouth(0);
    pandas.push(api);
    return api;
  }

  /* Gemeinsame Lebenszeichen: blinzeln, Ohren zucken, umherschauen */
  function life() {
    (function blink() {
      setTimeout(function () {
        if (anim()) pandas.forEach(function (p) { if (Math.random() < .8) { p.svg.classList.add('blink'); setTimeout(function () { p.svg.classList.remove('blink'); }, 190); } });
        blink();
      }, 2400 + Math.random() * 3200);
    })();
    (function twitch() {
      setTimeout(function () {
        if (anim()) { var p = pandas[Math.floor(Math.random() * pandas.length)]; if (p && !p.st) { p.svg.classList.add(Math.random() < .5 ? 'twL' : 'twR'); setTimeout(function () { p.svg.classList.remove('twL', 'twR'); }, 280); } }
        twitch();
      }, 3500 + Math.random() * 4500);
    })();
    var lastMove = 0;
    doc.addEventListener('pointermove', function (e) {
      lastMove = Date.now(); if (!anim()) return;
      pandas.forEach(function (p) {
        if (p.st) return; var r = p.svg.getBoundingClientRect(); if (!r.width) return;
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * .45), d = Math.max(1, Math.hypot(dx, dy)), k = Math.min(1, d / 260);
        p.look(dx / d * 2.6 * k, dy / d * 2.4 * k);
      });
    }, { passive: true });
    setInterval(function () {
      if (!anim() || Date.now() - lastMove < 4000) return;
      pandas.forEach(function (p) { if (!p.st && Math.random() < .5) p.look((Math.random() - .5) * 5, (Math.random() - .5) * 3.5); });
    }, 2600);
  }

  /* ---------- Zustände für alle Pandas ---------- */
  var mode = '', quietT = 0, talkRun = 0;
  function setAll(s) { mode = s; pandas.forEach(function (p) { p.state(s); }); label(s); }
  var LABELS = { '': 'Wartet auf dich', listen: 'Hört zu …', think: 'Überlegt …', talk: 'Spricht …', happy: 'Fertig' };
  function label(s) { Array.prototype.forEach.call(doc.querySelectorAll('.pd-state b'), function (b) { b.textContent = LABELS[s] || LABELS['']; }); Array.prototype.forEach.call(doc.querySelectorAll('.pd-state'), function (el) { el.dataset.s = s || 'idle'; }); }

  function onType(e) {
    if (mode === 'think' || mode === 'talk') return;
    var v = e.target.value || '';
    if (!v.trim()) { clearTimeout(quietT); setAll(''); return; }
    if (mode !== 'listen') setAll('listen');
    pandas.forEach(function (p) { p.nod(); });
    clearTimeout(quietT); quietT = setTimeout(function () { if (mode === 'listen') setAll(''); }, 1800);
  }

  /* Text Wort für Wort sichtbar machen und den Mund dazu bewegen */
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
    var words = [], walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return n.parentNode.closest('.ch-meta, .ch-tag, small') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } }), list = [], n;
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(function (t) {
      var parts = t.nodeValue.split(/(\s+)/), frag = doc.createDocumentFragment();
      parts.forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) { frag.appendChild(doc.createTextNode(w)); return; } var s = doc.createElement('span'); s.className = 'pd-w'; s.textContent = w; frag.appendChild(s); words.push(s); });
      t.parentNode.replaceChild(frag, t);
    });
    return words;
  }
  function speak(text) {
    var run = ++talkRun, plain = String(text || '').replace(/<[^>]+>/g, ' ');
    setAll('talk');
    setTimeout(function () {
      if (run !== talkRun) return;
      var target = revealTarget(), words = target && anim() ? wrapWords(target) : [];
      var count = words.length || plain.split(/\s+/).filter(Boolean).length, i = 0;
      var step = Math.max(45, Math.min(110, 5200 / Math.max(1, count)));
      (function tick() {
        if (run !== talkRun) return;
        if (i >= count) {
          pandas.forEach(function (p) { p.mouth(0); });
          setAll('happy');
          setTimeout(function () { if (run === talkRun && mode === 'happy') setAll(''); }, 1100);
          return;
        }
        var w = words[i] ? words[i].textContent : (plain.split(/\s+/)[i] || '');
        if (words[i]) words[i].classList.add('on');
        var vowels = (w.match(/[aeiouäöüy]/gi) || []).length;
        pandas.forEach(function (p) { p.mouth(Math.min(1, .35 + vowels * .22)); });
        setTimeout(function () { pandas.forEach(function (p) { p.mouth(.12); }); }, step * .55);
        i++; setTimeout(tick, step + (/[.!?:]$/.test(w) ? 160 : /,$/.test(w) ? 80 : 0));
      })();
    }, 60);
  }

  // Neue KI-Antworten erkennen: homeMessage() in app.js hängt jede Nachricht an #homeAiFeed an.
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

  /* ---------- Einbau an allen Stellen ---------- */
  function mount() {
    var css = 'url("data:image/svg+xml,' + encodeURIComponent(svgMarkup(HEAD_VB).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')) + '")';
    doc.documentElement.style.setProperty('--pd-head', css);

    // Startseite: KI-Bereich
    var frame = doc.querySelector('#hmOrb .v15-bot-frame') || doc.getElementById('hmOrb');
    if (frame && !frame.querySelector('.pd')) {
      Array.prototype.slice.call(frame.children).forEach(function (c) { c.remove(); });
      frame.classList.add('pd-host', 'pd-home');
      frame.insertAdjacentHTML('beforeend', '<span class="pd-floor" aria-hidden="true"></span>');
      Panda(frame, {});
    }
    // KI-Chat: eigene kleine Bühne über dem Verlauf
    var main = doc.querySelector('#aiChat .ch-main'), feed = doc.getElementById('chFeed');
    if (main && feed && !main.querySelector('.pd-stage')) {
      var st = doc.createElement('div'); st.className = 'pd-stage';
      st.innerHTML = '<span class="pd-state" data-s="idle"><i></i><b>Wartet auf dich</b></span><span class="pd-plate"><b>' + NAME + '</b><small>Dein KI-Assistent</small></span><span class="pd-floor" aria-hidden="true"></span><span class="pd-hold"></span>';
      main.insertBefore(st, feed);
      Panda(st.querySelector('.pd-hold'), { big: true });
    }
    // Köpfe: Chat-Kopfzeile, KI-Pille oben, Menüknopf
    [['#ccChatAvatar', 'pd-mini'], ['#v11AiPill .dot', 'pd-mini pd-dot'], ['#navChat', 'pd-mini pd-nav']].forEach(function (q) {
      var h = doc.querySelector(q[0]); if (!h || h.querySelector('.pd')) return;
      h.replaceChildren(); q[1].split(' ').forEach(function (c) { h.classList.add(c); }); Panda(h, { head: true });
    });
    var navChat = doc.getElementById('navChat'); if (navChat && !navChat.getAttribute('aria-label')) navChat.setAttribute('aria-label', 'KI-Chat');
    // Kopfzeile links: RV-Monogramm statt Erdkugel
    var av = doc.querySelector('#rvTop .rvt-globe .v11-avatar'); if (av) { av.src = '/rv-monogram.png'; av.classList.add('rv-mono'); }
    var pill = doc.querySelector('#v11AiPill > span'); if (pill && /KI-Assistent/.test(pill.textContent)) pill.innerHTML = NAME + ', dein KI-Panda,<br>ist bereit.';
  }

  function init() {
    mount();
    hookMessages();
    ['chatInput', 'homeAiInput'].forEach(function (id) { var el = doc.getElementById(id); if (el) el.addEventListener('input', onType); });
    doc.addEventListener('rv:ai-state', function (e) {
      var s = e && e.detail && e.detail.state;
      if (s === 'busy') { clearTimeout(quietT); talkRun++; setAll('think'); }
      else if (mode === 'think') setAll('');
    });
    // Nachgerenderte Teile (Chat-Willkommen, Seitenwechsel) erneut prüfen
    if (window.MutationObserver) { var cm = doc.getElementById('aiChat'); if (cm) new MutationObserver(function () { if (!cm.querySelector('.pd-stage')) mount(); }).observe(cm, { childList: true, subtree: false }); }
    life();
    window.RVPanda = { name: NAME, state: setAll, speak: speak, list: pandas };
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
