/* RVO – Bao, der KI-Panda (V35). Vektor-Rig mit Knochen-Gruppen statt Einzelbild.
   Aufbau: Wurzel → Körper (Atmen, Stauchen) → Kopf (Neigen, Drehen) → Gesicht (Augen, Pupillen, Lider, Mund, Wangen) → Ohren;
   Arme mit Schultergelenk, Beine, Requisite (Geldschein-Blaster) und Effekte. Jede Gruppe bekommt pro Bild eine eigene Transformation.
   Zustände: bereit (Idle-Verhalten), hört zu, überlegt (an rv:ai-state „busy“ gekoppelt), spricht (Mund folgt der Wort-für-Wort-Ausgabe),
   freut sich. Dazu Reaktionen auf Antippen, Blick zur Maus/zum Finger, Erfolgsmomente aus echten App-Ereignissen und seltene Auftritte.
   Leistung: ein gemeinsamer requestAnimationFrame-Takt nur für sichtbare Figuren, Pause bei verstecktem Tab, im Ruhezustand 30 Bilder/s,
   bei „Bewegung aus“ (html.rv-reduce) oder „Panda bewegt sich“ = aus nur Standbilder. Keine Bilddateien, keine externe Bibliothek. */
(function () {
  'use strict';
  var doc = document, NAME = 'Bao', NS = 'http://www.w3.org/2000/svg', all = [], uid = 0;

  /* ---------- Gestalt (nach dem Referenzbild: runder weißer Kopf, schwarze Ohren mit braunem Inneren,
     schräge Augenflecken, große braune Augen mit Glanzpunkten, offenes Lächeln, schwarze Arme, weißer Bauch,
     schwarze Füße mit braunen Ballen) ---------- */
  function fluff(cx, cy, rx, ry, n, amp, seed) { // Ellipse mit weichen Fellbüscheln
    var d = '', s = seed || 1;
    for (var i = 0; i <= n; i++) {
      var a0 = (i - .5) / n * Math.PI * 2, a1 = i / n * Math.PI * 2, j = 1 + amp / Math.max(rx, ry) * (Math.sin(i * 7.3 + s) * .5 + .8);
      var x0 = cx + Math.cos(a0) * rx, y0 = cy + Math.sin(a0) * ry, x1 = cx + Math.cos(a1) * rx * j, y1 = cy + Math.sin(a1) * ry * j;
      d += (i ? ' Q' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' ' : 'M') + x1.toFixed(1) + ' ' + y1.toFixed(1);
    }
    return d + 'Z';
  }
  function eye(id, cx, cy) {
    return '<g class="b-eye" data-cx="' + cx + '" data-cy="' + cy + '">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="11.6" fill="#f3f1ee"/>' +
      '<g class="b-pupil"><circle cx="' + cx + '" cy="' + cy + '" r="9.6" fill="url(#' + id + 'iris)"/>' +
      '<circle cx="' + cx + '" cy="' + (cy + .5) + '" r="5.6" fill="#120806"/>' +
      '<circle cx="' + (cx - 3.4) + '" cy="' + (cy - 3.6) + '" r="2.9" fill="#fff"/>' +
      '<circle cx="' + (cx + 3) + '" cy="' + (cy + 3.2) + '" r="1.3" fill="#fff" opacity=".85"/></g>' +
      '<clipPath id="' + id + 'c' + cx + '"><circle cx="' + cx + '" cy="' + cy + '" r="11.8"/></clipPath>' +
      '<g clip-path="url(#' + id + 'c' + cx + ')"><circle class="b-lid" cx="' + cx + '" cy="' + cy + '" r="12.4" fill="#16181c" transform="translate(0 -24)"/></g></g>';
  }
  function happyEye(cx, cy) { return '<path d="M' + (cx - 8) + ' ' + (cy + 3) + ' Q' + cx + ' ' + (cy - 8) + ' ' + (cx + 8) + ' ' + (cy + 3) + '" fill="none" stroke="#f3f1ee" stroke-width="3.6" stroke-linecap="round"/>'; }
  function arm(cls, x, y) {
    return '<g class="' + cls + '" data-x="' + x + '" data-y="' + y + '"><g transform="translate(' + x + ' ' + y + ')">' +
      '<rect x="-13" y="-10" width="26" height="54" rx="13" fill="url(#IDblack)" stroke="rgba(255,255,255,.16)" stroke-width="1"/>' +
      '<ellipse cx="0" cy="38" rx="9" ry="5.5" fill="#2a2d33" opacity=".7"/>' + (cls === 'b-arm-r' ? '<g class="b-prop" opacity="0">' + PROP + '</g>' : '') + '</g></g>';
  }
  function foot(cx) {
    return '<ellipse cx="' + cx + '" cy="193" rx="21" ry="16" fill="url(#IDblack)" stroke="rgba(255,255,255,.14)" stroke-width="1"/>' +
      '<ellipse cx="' + cx + '" cy="197" rx="11.5" ry="8.5" fill="url(#IDpad)"/>' +
      [[-10, -9], [-3.5, -12], [3.5, -12], [10, -9]].map(function (t) { return '<circle cx="' + (cx + t[0]) + '" cy="' + (197 + t[1]) + '" r="2.7" fill="#c08a6b"/>'; }).join('');
  }
  // Cartoon-Geldschein-Blaster: rundes Spielzeug in Mint und Weiß, Trichter nach oben – keine Waffenform.
  var PROP = '<g transform="translate(0 40)">' +
    '<rect x="-9" y="-6" width="18" height="30" rx="8" fill="#6fd6a0" stroke="#e8fff2" stroke-width="1.6"/>' +
    '<rect x="-9" y="4" width="18" height="5" fill="#f5f7fa" opacity=".9"/><rect x="-9" y="14" width="18" height="5" fill="#f5f7fa" opacity=".9"/>' +
    '<path d="M-11 22 L-17 40 Q0 46 17 40 L11 22 Z" fill="#9ae7bf" stroke="#e8fff2" stroke-width="1.6"/>' +
    '<ellipse cx="0" cy="40" rx="17" ry="4.5" fill="#2f8f63"/><circle cx="0" cy="-2" r="3" fill="#ff8fa3"/></g>';
  function svgMarkup(id, head) {
    var g = function (k) { return id + k; };
    var defs = '<defs>' +
      '<radialGradient id="' + g('white') + '" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#eef1f4"/><stop offset="1" stop-color="#c3cad3"/></radialGradient>' +
      '<radialGradient id="' + g('belly') + '" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="#fbfbfa"/><stop offset="1" stop-color="#cfd5dc"/></radialGradient>' +
      '<radialGradient id="' + g('black') + '" cx="40%" cy="25%" r="85%"><stop offset="0" stop-color="#4b5059"/><stop offset=".55" stop-color="#23262c"/><stop offset="1" stop-color="#121418"/></radialGradient>' +
      '<radialGradient id="' + g('patch') + '" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#2c3036"/><stop offset="1" stop-color="#0f1114"/></radialGradient>' +
      '<radialGradient id="' + g('iris') + '" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#9a6a45"/><stop offset=".6" stop-color="#5e3a22"/><stop offset="1" stop-color="#2c170b"/></radialGradient>' +
      '<radialGradient id="' + g('ear') + '" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="#a57560"/><stop offset="1" stop-color="#5c3b31"/></radialGradient>' +
      '<radialGradient id="' + g('pad') + '" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#c48d6c"/><stop offset="1" stop-color="#7b4c35"/></radialGradient>' +
      '<radialGradient id="' + g('shadow') + '"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '</defs>';
    var earL = '<g class="b-ear-l"><circle cx="48" cy="36" r="21" fill="url(#' + g('black') + ')" stroke="rgba(255,255,255,.16)" stroke-width="1"/><ellipse cx="51" cy="40" rx="11" ry="10" fill="url(#' + g('ear') + ')"/></g>';
    var earR = '<g class="b-ear-r"><circle cx="152" cy="36" r="21" fill="url(#' + g('black') + ')" stroke="rgba(255,255,255,.16)" stroke-width="1"/><ellipse cx="149" cy="40" rx="11" ry="10" fill="url(#' + g('ear') + ')"/></g>';
    var face = '<g class="b-face">' +
      '<ellipse cx="73" cy="82" rx="17" ry="23" transform="rotate(32 73 82)" fill="url(#' + g('patch') + ')"/>' +
      '<ellipse cx="127" cy="82" rx="17" ry="23" transform="rotate(-32 127 82)" fill="url(#' + g('patch') + ')"/>' +
      '<g class="b-eyes">' + eye(id, 76, 79) + eye(id, 124, 79) + '</g>' +
      '<g class="b-happy" opacity="0">' + happyEye(76, 80) + happyEye(124, 80) + '</g>' +
      '<g class="b-brows" stroke="#b9c1cb" stroke-width="2.4" stroke-linecap="round" fill="none"><path class="b-brow-l" d="M64 56 Q72 52 80 55"/><path class="b-brow-r" d="M120 55 Q128 52 136 56"/></g>' +
      '<ellipse class="b-cheek" cx="58" cy="104" rx="9" ry="5" fill="#f08b97" opacity=".3"/><ellipse class="b-cheek" cx="142" cy="104" rx="9" ry="5" fill="#f08b97" opacity=".3"/>' +
      '<path d="M91 95 Q100 91 109 95 Q108 103 100 105 Q92 103 91 95 Z" fill="#141518"/><ellipse cx="97" cy="95.5" rx="3.4" ry="1.6" fill="#fff" opacity=".55"/>' +
      '<path d="M100 105 V109" stroke="#3b3f46" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path class="b-smile" d="M88 108 Q94 115 100 109 Q106 115 112 108" fill="none" stroke="#2a2d33" stroke-width="2.4" stroke-linecap="round"/>' +
      '<g class="b-mouth" transform="translate(100 108) scale(1 0) translate(-100 -108)"><path d="M86 108 Q100 105 114 108 Q113 129 100 130 Q87 129 86 108 Z" fill="#3a1418"/>' +
      '<ellipse cx="100" cy="124" rx="9" ry="5.5" fill="#e98691"/><path d="M89 108.5 Q100 106.5 111 108.5 L110 111 Q100 109.5 90 111 Z" fill="#fff" opacity=".9"/></g>' +
      '</g>';
    var head2 = '<g class="b-head">' + earL + earR + '<path d="' + fluff(100, 80, 63, 55, 40, 3.2, 2) + '" fill="url(#' + g('white') + ')"/>' + face + '</g>';
    if (head) return '<svg class="bao bao-head" viewBox="30 10 140 128" aria-hidden="true" focusable="false">' + defs + head2 + '</svg>';
    var body = '<g class="b-body">' +
      '<path d="' + fluff(100, 160, 53, 45, 30, 2.4, 5) + '" fill="url(#' + g('black') + ')" stroke="rgba(255,255,255,.14)" stroke-width="1"/>' +
      '<path d="' + fluff(100, 164, 33, 32, 24, 1.8, 9) + '" fill="url(#' + g('belly') + ')"/>' +
      '<g class="b-feet">' + foot(64) + foot(136) + '</g>' +
      head2 +
      arm('b-arm-l', 58, 136).replace(/IDblack/g, g('black')) + arm('b-arm-r', 142, 136).replace(/IDblack/g, g('black')) +
      '</g>';
    var fx = '<g class="b-fx">' +
      '<g class="b-bubbles" opacity="0" fill="#e8edf3"><circle cx="160" cy="44" r="4"/><circle cx="172" cy="28" r="6"/><ellipse cx="186" cy="8" rx="12" ry="9"/></g>' +
      '<g class="b-spark" opacity="0" fill="#f5f7fa"><path d="M30 60 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3Z"/><path d="M172 70 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2Z"/><path d="M160 150 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z"/></g>' +
      '<path class="b-heart" opacity="0" d="M100 20 C94 10 80 14 84 26 C86 32 100 40 100 40 C100 40 114 32 116 26 C120 14 106 10 100 20Z" fill="#ff8fa3"/>' +
      '</g>';
    return ('<svg class="bao" viewBox="0 0 200 212" aria-hidden="true" focusable="false">' + defs +
      '<ellipse class="b-shadow" cx="100" cy="205" rx="64" ry="7" fill="url(#' + g('shadow') + ')"/>' +
      '<g class="b-root">' + body + '</g>' + fx + '</svg>').replace(/IDpad/g, g('pad')).replace(/IDblack/g, g('black'));
  }

  /* ---------- Bewegung ---------- */
  function reduce() { var a = window.RVAnim || {}; return a.orb === false || doc.documentElement.classList.contains('rv-reduce'); }
  var hoverDevice = window.matchMedia ? matchMedia('(hover: hover) and (pointer: fine)').matches : false;
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var bump = function (t) { return Math.sin(Math.PI * Math.max(0, Math.min(1, t))); };
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // Bewegungsabläufe: Dauer in ms, f(P, t, B) verändert die Pose. Ereignisse (ev) feuern einmal bei t.
  var CLIPS = {
    blink: { d: 170, f: function (P, t) { P.blink = Math.max(P.blink, bump(t)); } },
    doubleBlink: { d: 420, f: function (P, t) { P.blink = Math.max(P.blink, bump((t * 2) % 1)); } },
    nod: { d: 260, f: function (P, t) { P.hy += bump(t) * 3; P.head += bump(t) * 3; } },
    lookAround: { d: 2600, f: function (P, t) { var k = t < .33 ? -1 : t < .66 ? 1 : 0; P.tLookX = k * .9; P.tTurn = k * .5; P.tLookY = -.1; } },
    curious: { d: 1500, f: function (P, t) { P.tHead = -11 * bump(t); P.tLookY = -.4; P.brow = bump(t); } },
    ear: { d: 520, f: function (P, t) { P.earL += Math.sin(t * Math.PI * 4) * 12 * (1 - t); P.earR -= Math.sin(t * Math.PI * 4 + 1) * 10 * (1 - t); } },
    bounce: { d: 560, f: function (P, t) { P.y -= bump(t) * 7; P.sy += (t < .15 ? -.05 : 0) + bump(t) * .03; } },
    grin: { d: 1600, f: function (P, t) { P.mouth = Math.max(P.mouth, .55 * bump(t)); P.blush += .3 * bump(t); } },
    shift: { d: 1400, f: function (P, t) { var b = bump(t); P.rot += 3 * b; P.tHead = 6 * b; P.armL += 8 * b; } },
    stretch: { d: 1800, f: function (P, t) { var b = bump(t); P.armL = 8 + 150 * b; P.armR = -8 - 150 * b; P.sy += .05 * b; P.happy = b; P.mouth = Math.max(P.mouth, .7 * b); } },
    wave: { d: 1500, f: function (P, t) { var up = t < .15 ? ease(t / .15) : t > .85 ? ease((1 - t) / .15) : 1; P.armR = -8 - 148 * up + Math.sin(t * Math.PI * 7) * 18 * up; P.tHead = 7 * up; P.mouth = Math.max(P.mouth, .45 * up); P.tLookX = 0; P.tLookY = 0; } },
    jump: { d: 900, f: function (P, t) { var a = t < .2 ? t / .2 : 0, air = t >= .2 && t < .75 ? (t - .2) / .55 : 0, land = t >= .75 ? (t - .75) / .25 : 0;
      P.sy += -.12 * bump(a) - .1 * bump(land) + .06 * bump(air); P.sx -= -.08 * bump(a) - .07 * bump(land); P.y -= 34 * bump(air); P.armL = 8 + 120 * bump(air); P.armR = -8 - 120 * bump(air); P.happy = Math.max(P.happy, bump(air)); P.mouth = Math.max(P.mouth, .7 * bump(air)); } },
    spin: { d: 1100, f: function (P, t) { var e = ease(t); P.flip = Math.cos(e * Math.PI * 2); P.y -= 16 * bump(t); P.armL = 8 + 60 * bump(t); P.armR = -8 - 60 * bump(t); P.happy = Math.max(P.happy, bump(t)); } },
    clap: { d: 1500, f: function (P, t) { var up = bump(t), c = Math.abs(Math.sin(t * Math.PI * 6)); P.armL = 8 + (70 + 30 * c) * up * -1 + 0; P.armR = -8 + (70 + 30 * c) * up; P.happy = Math.max(P.happy, up); P.mouth = Math.max(P.mouth, .6 * up); P.spark = Math.max(P.spark, up); P.y -= 3 * c * up; } },
    laugh: { d: 1700, f: function (P, t) { var up = bump(t), s = Math.sin(t * Math.PI * 14); P.happy = Math.max(P.happy, up); P.mouth = Math.max(P.mouth, (.6 + .3 * s) * up); P.hy += 2 * s * up; P.rot += 2 * s * up; P.tHead = 8 * up; P.blush += .4 * up; } },
    cheer: { d: 2200, f: function (P, t) { var hop = Math.abs(Math.sin(t * Math.PI * 3)) * (1 - t * .3); P.y -= 26 * hop; P.armL = 8 + 140 * bump(t * 1.05); P.armR = -8 - 140 * bump(t * 1.05) + Math.sin(t * 30) * 10 * bump(t); P.happy = Math.max(P.happy, bump(t)); P.mouth = Math.max(P.mouth, .85 * bump(t)); P.spark = Math.max(P.spark, bump(t)); P.blush += .5 * bump(t); if (t > .3 && t < .7) P.flip = Math.cos((t - .3) / .4 * Math.PI * 2); } },
    love: { d: 1500, f: function (P, t) { P.heart = bump(t); P.happy = Math.max(P.happy, bump(t)); P.blush += .6 * bump(t); P.y -= 6 * bump(t * 2 % 1); } },
    cannon: { d: 4400, ev: [[.34, 'bills'], [.48, 'bills'], [.62, 'bills']], f: function (P, t, B) {
      var out = t < .14 ? ease(t / .14) : t > .86 ? ease((1 - t) / .14) : 1, aim = t < .14 ? 0 : t < .26 ? ease((t - .14) / .12) : t > .78 ? Math.max(0, 1 - (t - .78) / .08) : 1;
      P.prop = out; P.armR = -8 - 145 * aim - (t > .3 && t < .7 ? Math.abs(Math.sin((t - .3) * Math.PI / .14 * 1)) * 10 : 0);
      var fun = t > .3 && t < .9 ? bump((t - .3) / .6) : 0; P.happy = Math.max(P.happy, fun); P.mouth = Math.max(P.mouth, .8 * fun); P.hy += Math.sin(t * 60) * 1.5 * fun; P.blush += .5 * fun;
      P.tLookX = .3 * aim; P.tLookY = -.8 * aim; P.armL = 8 + 30 * fun; } }
  };

  function Bao(host, opt) {
    opt = opt || {};
    var id = 'bao' + (++uid);
    host.insertAdjacentHTML('beforeend', svgMarkup(id, opt.head));
    var svg = host.lastElementChild, q = function (s) { return svg.querySelector(s); }, qa = function (s) { return svg.querySelectorAll(s); };
    var B = {
      host: host, svg: svg, head: !!opt.head, mode: '', clips: [], visible: true, pinned: !!opt.head,
      el: { root: q('.b-root'), shadow: q('.b-shadow'), head: q('.b-head'), face: q('.b-face'), earL: q('.b-ear-l'), earR: q('.b-ear-r'), eyes: qa('.b-eye'), pupils: qa('.b-pupil'), lids: qa('.b-lid'),
        happy: q('.b-happy'), eyesG: q('.b-eyes'), mouth: q('.b-mouth'), smile: q('.b-smile'), cheeks: qa('.b-cheek'), armL: q('.b-arm-l'), armR: q('.b-arm-r'), prop: q('.b-prop'),
        bubbles: q('.b-bubbles'), spark: q('.b-spark'), heart: q('.b-heart'), browL: q('.b-brow-l'), browR: q('.b-brow-r') },
      cur: { head: 0, turn: 0, lookX: 0, lookY: 0, armL: -16, armR: 16, hy: 0, mouth: 0, happy: 0, blush: .3, prop: 0, think: 0, brow: 0 },
      tgt: { head: 0, turn: 0, lookX: 0, lookY: 0 }, idleHead: 0, talkMouth: 0, talkUntil: 0, lookUntil: 0, nextIdle: 0, nextBlink: 0, last: 0, lastTap: '', dirty: true
    };
    B.play = function (name, after) {
      var c = CLIPS[name]; if (!c) return;
      if (reduce() && !B.head) { B.flash(name); return; }
      B.clips = B.clips.filter(function (x) { return x.name !== name; });
      B.clips.push({ name: name, c: c, t0: performance.now(), fired: {}, after: after }); B.dirty = true; wake();
    };
    // Bei „Bewegung aus“: nur ein Standbild des Gefühls (z. B. fröhliche Augen) für kurze Zeit.
    B.flash = function (name) { if (!/cheer|laugh|clap|love|jump|spin|wave|grin|cannon/.test(name)) return; B.still = { happy: 1, mouth: .5, until: performance.now() + 1400 }; render(B, performance.now(), true); setTimeout(function () { B.still = null; render(B, performance.now(), true); }, 1450); };
    B.state = function (s) { B.mode = s || ''; B.dirty = true; if (s === 'listen') B.play('nod'); wake(); if (reduce()) render(B, performance.now(), true); };
    B.lookAt = function (x, y, ms) {
      var r = svg.getBoundingClientRect(); if (!r.width) return;
      var dx = (x - (r.left + r.width / 2)) / Math.max(120, r.width), dy = (y - (r.top + r.height * .38)) / Math.max(120, r.height);
      B.tgt.lookX = Math.max(-1, Math.min(1, dx * 1.6)); B.tgt.lookY = Math.max(-1, Math.min(1, dy * 1.6)); B.tgt.turn = Math.max(-.6, Math.min(.6, dx * .8)); B.tgt.head = Math.max(-6, Math.min(6, -dx * 4));
      B.lookUntil = performance.now() + (ms || 2500); wake();
    };
    if (!opt.noTap) {
      host.addEventListener('click', function (e) {
        var btn = e.target.closest('button,a,input,textarea'); if (btn && btn !== host) return;
        e.stopPropagation(); react(B);
      });
    }
    if (window.IntersectionObserver && !opt.head) {
      new IntersectionObserver(function (en) { B.visible = en[0].isIntersecting; if (B.visible) wake(); }, { rootMargin: '40px' }).observe(host);
    }
    all.push(B);
    render(B, performance.now(), true);
    wake();
    return B;
  }
  var REACT = ['wave', 'jump', 'spin', 'laugh', 'clap', 'love', 'cheer', 'curious'], lastCannon = 0;
  function react(B) {
    if (B.mode === 'think' || B.mode === 'talk') { B.play('grin'); return; }
    B.lookAt(innerWidth / 2, innerHeight, 1600);
    if (!reduce() && Date.now() - lastCannon > 10 * 60000 && Math.random() < .08) { cannon(B); return; }
    var opts = REACT.filter(function (n) { return n !== B.lastTap; }), n = opts[Math.floor(Math.random() * opts.length)];
    B.lastTap = n; B.play(n); if (n !== 'wave' && Math.random() < .4) setTimeout(function () { B.play('blink'); }, 300);
  }
  function cannon(B) { lastCannon = Date.now(); try { localStorage.setItem('rv_bao_cannon', String(lastCannon)); } catch (e) {} B.play('cannon'); }
  try { lastCannon = Number(localStorage.getItem('rv_bao_cannon')) || 0; } catch (e) {}

  /* Geldscheine: kleine DOM-Teilchen, blockieren nichts (pointer-events: none), räumen sich selbst weg. */
  function bills(B) {
    var r = B.svg.getBoundingClientRect(); if (!r.width) return;
    var layer = doc.getElementById('baoFxLayer');
    if (!layer) { layer = doc.createElement('div'); layer.id = 'baoFxLayer'; layer.setAttribute('aria-hidden', 'true'); doc.body.appendChild(layer); }
    var x = r.left + r.width * .75, y = r.top + r.height * .12;
    for (var i = 0; i < 7; i++) {
      var b = doc.createElement('i'); b.className = 'bao-bill';
      b.style.left = x + 'px'; b.style.top = y + 'px';
      b.style.setProperty('--dx', rnd(-90, 110).toFixed(0) + 'px'); b.style.setProperty('--up', rnd(70, 150).toFixed(0) + 'px');
      b.style.setProperty('--r', rnd(-260, 260).toFixed(0) + 'deg'); b.style.animationDelay = (i * 40) + 'ms';
      b.addEventListener('animationend', function () { this.remove(); });
      layer.appendChild(b);
    }
  }

  /* ---------- Pose berechnen und anwenden ---------- */
  function pose(B, now) {
    var P = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, flip: 1, hy: 0, tHead: B.idleHead, tTurn: 0, tLookX: 0, tLookY: 0, blink: 0, armL: -16, armR: 16, earL: 0, earR: 0, mouth: B.head ? 0 : .3, happy: 0, blush: .3, prop: 0, think: 0, spark: 0, heart: 0, brow: 0 };
    var t = now / 1000, br = Math.sin(t * Math.PI * 2 / 3.4);
    P.sy += .014 * br; P.sx -= .006 * br; P.hy += 1.1 * br; P.armL += 2 * br; P.armR -= 2 * br; P.earL += Math.sin(t * 1.3) * 1.5; P.earR -= Math.sin(t * 1.1 + 1) * 1.5;
    var m = B.mode;
    if (m === 'listen') { P.tLookY = .55; P.tHead = 4; P.hy += 2; P.tTurn = -.1; P.brow = .3; }
    else if (m === 'think') { var s = Math.sin(t * 1.6); P.armR = 128 + s * 4; P.tHead = -11 + s * 2; P.tLookX = .55 + .2 * Math.sin(t * .9); P.tLookY = -.85; P.tTurn = .2; P.think = .65 + .35 * Math.sin(t * 3); P.brow = .8; P.mouth = .08; P.rot = s * 1.5; }
    else if (m === 'talk') { P.mouth = B.talkMouth; P.armL = 18 + Math.sin(t * 3.8) * 18 + Math.max(0, Math.sin(t * 1.7)) * 30; P.armR = -16 - Math.max(0, Math.sin(t * 2.9 + 1)) * 34; P.tHead = Math.sin(t * 2.2) * 5; P.hy += Math.max(0, Math.sin(t * 7)) * 1.5 * B.talkMouth; P.blush = .45; P.tLookX = Math.sin(t * .8) * .15; P.brow = .2 + .3 * B.talkMouth; }
    else if (m === 'happy') { P.happy = .8; P.mouth = .45; P.blush = .55; }
    if (now < B.lookUntil && m !== 'think') { P.tLookX = B.tgt.lookX; P.tLookY = B.tgt.lookY; P.tTurn = B.tgt.turn; P.tHead += B.tgt.head; }
    // Abläufe
    B.clips = B.clips.filter(function (c) {
      var k = (now - c.t0) / c.c.d; if (k >= 1) { if (c.after) setTimeout(c.after, 0); return false; }
      (c.c.ev || []).forEach(function (e, i) { if (k >= e[0] && !c.fired[i]) { c.fired[i] = 1; if (e[1] === 'bills') bills(B); } });
      c.c.f(P, k, B); return true;
    });
    if (B.still && now < B.still.until) { P.happy = B.still.happy; P.mouth = B.still.mouth; }
    return P;
  }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function render(B, now, force) {
    var P = pose(B, now), C = B.cur, dt = Math.min(.1, (now - (B.last || now)) / 1000) || .016, k = force ? 1 : Math.min(1, dt * 10), kf = force ? 1 : Math.min(1, dt * 22);
    B.last = now;
    C.head = lerp(C.head, P.tHead, k); C.turn = lerp(C.turn, P.tTurn, k); C.lookX = lerp(C.lookX, P.tLookX, kf); C.lookY = lerp(C.lookY, P.tLookY, kf);
    C.armL = lerp(C.armL, P.armL, kf); C.armR = lerp(C.armR, P.armR, kf); C.mouth = lerp(C.mouth, P.mouth, Math.min(1, dt * 28) || 1);
    C.happy = lerp(C.happy, P.happy, kf); C.blush = lerp(C.blush, P.blush, k); C.prop = lerp(C.prop, P.prop, kf); C.think = lerp(C.think, P.think, k); C.brow = lerp(C.brow, P.brow, k);
    var E = B.el, f = function (n) { return n.toFixed(2); };
    if (E.root) E.root.setAttribute('transform', 'translate(' + f(P.x) + ' ' + f(P.y) + ') translate(100 205) scale(' + f(P.flip * P.sx) + ' ' + f(P.sy) + ') rotate(' + f(P.rot) + ') translate(-100 -205)');
    if (E.shadow) { var lift = Math.max(0, -P.y); E.shadow.setAttribute('transform', 'translate(100 205) scale(' + f(1 - lift / 90) + ' 1) translate(-100 -205)'); E.shadow.setAttribute('opacity', f(1 - lift / 70)); }
    E.head.setAttribute('transform', 'translate(' + f(C.turn * 3) + ' ' + f(P.hy) + ') rotate(' + f(C.head) + ' 100 128)');
    E.face.setAttribute('transform', 'translate(' + f(C.turn * 7) + ' ' + f(C.lookY * 1.3) + ')');
    E.earL.setAttribute('transform', 'translate(' + f(-C.turn * 2) + ' 0) rotate(' + f(P.earL) + ' 48 50)');
    E.earR.setAttribute('transform', 'translate(' + f(-C.turn * 2) + ' 0) rotate(' + f(P.earR) + ' 152 50)');
    var pl = 'translate(' + f(C.lookX * 3.4) + ' ' + f(C.lookY * 3) + ')';
    E.pupils.forEach(function (p) { p.setAttribute('transform', pl); });
    var lid = -24 + 24 * Math.min(1, P.blink + C.think * .12 + (C.happy > .5 ? 0 : 0));
    E.lids.forEach(function (l) { l.setAttribute('transform', 'translate(0 ' + f(lid) + ')'); });
    E.eyesG.setAttribute('opacity', f(1 - C.happy)); E.happy.setAttribute('opacity', f(C.happy));
    var mo = Math.max(0, Math.min(1, C.mouth));
    E.mouth.setAttribute('transform', 'translate(100 108) scale(' + f(.75 + .25 * mo) + ' ' + f(mo) + ') translate(-100 -108)');
    E.smile.setAttribute('opacity', f(Math.max(0, 1 - mo * 4)));
    E.cheeks.forEach(function (c) { c.setAttribute('opacity', f(Math.min(.85, C.blush))); });
    if (E.browL) { E.browL.setAttribute('transform', 'translate(0 ' + f(-C.brow * 3) + ')'); E.browR.setAttribute('transform', 'translate(0 ' + f(-C.brow * 1.2) + ') rotate(' + f(-C.brow * 6) + ' 128 55)'); }
    if (E.armL) {
      E.armL.setAttribute('transform', 'rotate(' + f(C.armL) + ' 58 136)'); E.armR.setAttribute('transform', 'rotate(' + f(C.armR) + ' 142 136)');
      E.prop.setAttribute('opacity', f(C.prop > .02 ? 1 : 0)); E.prop.setAttribute('transform', 'translate(0 40) scale(' + f(C.prop) + ') translate(0 -40)');
      E.bubbles.setAttribute('opacity', f(C.think)); E.spark.setAttribute('opacity', f(P.spark)); E.heart.setAttribute('opacity', f(P.heart));
      E.heart.setAttribute('transform', 'translate(0 ' + f(-P.heart * 14) + ')');
    }
  }

  /* ---------- Gemeinsamer Takt ---------- */
  var raf = 0, frame = 0;
  function active(B) { return B.visible && !B.head && B.svg.isConnected && B.svg.getClientRects().length; }
  function wake() { if (!raf && !doc.hidden) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0; if (doc.hidden) return;
    var red = reduce(), any = false; frame++;
    all = all.filter(function (B) { return B.svg.isConnected || B.keep; });
    all.forEach(function (B) {
      if (B.head) { if (B.dirty) { render(B, now, true); B.dirty = false; } return; }
      if (!active(B)) return;
      if (red) { if (B.dirty || B.clips.length) { B.clips = []; render(B, now, true); B.dirty = false; } return; }
      any = true;
      idle(B, now);
      var busy = B.clips.length || B.mode === 'talk' || B.mode === 'think' || now < B.lookUntil + 600;
      if (busy || frame % 2 === 0) render(B, now); // im Ruhezustand jedes zweite Bild (≈30/s)
    });
    if (any) raf = requestAnimationFrame(tick);
  }
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) wake(); });
  doc.addEventListener('rv:anim-change', function () { all.forEach(function (B) { B.dirty = true; }); wake(); });

  // Idle-Verhalten: Blinzeln und abwechslungsreiche kleine Bewegungen, nie zweimal dasselbe hintereinander.
  var IDLE = [['lookAround', 4], ['curious', 3], ['ear', 3], ['bounce', 2], ['grin', 3], ['shift', 3], ['wave', 1], ['stretch', 1]];
  function idle(B, now) {
    if (!B.nextBlink) B.nextBlink = now + rnd(1500, 4000);
    if (now > B.nextBlink) { B.play(Math.random() < .2 ? 'doubleBlink' : 'blink'); B.nextBlink = now + rnd(2600, 6200); }
    if (B.mode || B.clips.some(function (c) { return c.name !== 'blink' && c.name !== 'doubleBlink'; })) { B.nextIdle = Math.max(B.nextIdle, now + 2500); return; }
    if (!B.nextIdle) B.nextIdle = now + rnd(2500, 5000);
    if (now < B.nextIdle || now < B.lookUntil) return;
    var pool = IDLE.filter(function (x) { return x[0] !== B.lastIdle; }), sum = pool.reduce(function (n, x) { return n + x[1]; }, 0), r = Math.random() * sum, pick = pool[0][0];
    for (var i = 0; i < pool.length; i++) { r -= pool[i][1]; if (r <= 0) { pick = pool[i][0]; break; } }
    B.lastIdle = pick; B.play(pick); B.idleHead = rnd(-5, 5); B.nextIdle = now + rnd(3500, 8000);
  }
  // Maus (Desktop) bzw. Finger (Touch): Blick folgt dezent.
  doc.addEventListener('pointermove', function (e) {
    if (!hoverDevice || e.pointerType !== 'mouse' || reduce()) return;
    all.forEach(function (B) { if (!B.head && B.mode !== 'think' && B.visible) B.lookAt(e.clientX, e.clientY, 3500); });
  }, { passive: true });
  doc.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' || reduce()) return;
    all.forEach(function (B) { if (!B.head && B.mode !== 'think' && B.visible) B.lookAt(e.clientX, e.clientY, 1600); });
  }, { passive: true });

  /* ---------- Zustände für alle Figuren (Chat-Kopplung wie bisher) ---------- */
  var mode = '', quietT = 0, talkRun = 0;
  var LABELS = { '': 'Wartet auf dich', listen: 'Hört zu …', think: 'Überlegt …', talk: 'Spricht …', happy: 'Fertig' };
  function setAll(s) {
    mode = s; all.forEach(function (B) { B.state(s); });
    Array.prototype.forEach.call(doc.querySelectorAll('.pd-state'), function (el) { el.dataset.s = s || 'idle'; var b = el.querySelector('b'); if (b) b.textContent = LABELS[s] || LABELS['']; });
  }
  function onType(e) {
    if (mode === 'think' || mode === 'talk') return;
    if (!String(e.target.value || '').trim()) { clearTimeout(quietT); setAll(''); return; }
    if (mode !== 'listen') setAll('listen'); else all.forEach(function (B) { B.play('nod'); });
    clearTimeout(quietT); quietT = setTimeout(function () { if (mode === 'listen') setAll(''); }, 1800);
  }
  function revealTarget() {
    var chat = doc.getElementById('aiChat');
    if (chat && !chat.classList.contains('hidden')) {
      var rows = doc.querySelectorAll('#chFeed .ch-msg.ai'), row = rows[rows.length - 1];
      if (row && !row.querySelector('.ch-typing')) return row.querySelector('.ch-bubble');
    }
    var hm = doc.querySelectorAll('#homeAiFeed .home-msg:not(.user)'), last = hm[hm.length - 1];
    return last ? (last.querySelector('div') || last) : null;
  }
  function wrapWords(root) {
    var words = [], list = [], n, walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (t) { return t.parentNode.closest('.ch-meta, .ch-tag, small, .bx-actions') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(function (t) {
      var frag = doc.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) { frag.appendChild(doc.createTextNode(w)); return; } var s = doc.createElement('span'); s.className = 'pd-w'; s.textContent = w; frag.appendChild(s); words.push(s); });
      t.parentNode.replaceChild(frag, t);
    });
    return words;
  }
  // Sprechen: Die Antwort erscheint Wort für Wort; der Mund öffnet sich je Wort nach Vokalen und schließt in Pausen.
  // Das ist eine an die Textausgabe gekoppelte, vereinfachte Mundbewegung – keine Lippensynchronität zu Audio.
  function speak(text) {
    var run = ++talkRun, plain = String(text || '').split(/\s+/).filter(Boolean);
    setAll('talk');
    setTimeout(function () {
      if (run !== talkRun) return;
      var target = revealTarget(), words = target && !reduce() ? wrapWords(target) : [];
      var count = words.length || plain.length, i = 0, step = Math.max(45, Math.min(110, 5200 / Math.max(1, count)));
      if (reduce()) count = 0;
      (function next() {
        if (run !== talkRun) return;
        if (i >= count) {
          all.forEach(function (B) { B.talkMouth = 0; });
          setAll('happy'); all.forEach(function (B) { B.play('bounce'); });
          setTimeout(function () { if (run === talkRun && mode === 'happy') setAll(''); }, 1300);
          return;
        }
        var w = words[i] ? words[i].textContent : plain[i] || '', v = (w.match(/[aeiouäöüy]/gi) || []).length;
        if (words[i]) words[i].classList.add('on');
        var open = v ? Math.min(1, .35 + v * .18) : .15;
        all.forEach(function (B) { B.talkMouth = open; });
        setTimeout(function () { if (run === talkRun) all.forEach(function (B) { B.talkMouth = .05; }); }, step * .55);
        i++; setTimeout(next, step + (/[.!?:]$/.test(w) ? 170 : /,$/.test(w) ? 80 : 0));
      })();
    }, 60);
  }
  /* Vorbereitet für spätere Sprachausgabe: Mundöffnung aus der Lautstärke eines <audio>-Elements (WebAudio).
     Das ist Amplituden-Animation, keine Phonem-Lippensynchronität. Bisher nicht mit echter Sprachausgabe getestet. */
  function attachAudio(audio) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext, ctx = new AC(), src = ctx.createMediaElementSource(audio), an = ctx.createAnalyser(), buf = new Uint8Array(256);
      an.fftSize = 512; src.connect(an); an.connect(ctx.destination); setAll('talk');
      (function loop() { if (audio.paused || audio.ended) { all.forEach(function (B) { B.talkMouth = 0; }); setAll(''); return; }
        an.getByteTimeDomainData(buf); var s = 0; for (var i = 0; i < buf.length; i++) { var d = (buf[i] - 128) / 128; s += d * d; }
        var rms = Math.sqrt(s / buf.length); all.forEach(function (B) { B.talkMouth = Math.min(1, rms * 6); }); requestAnimationFrame(loop); })();
      return true;
    } catch (e) { return false; }
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

  /* ---------- Auftritte außerhalb des Chats: selten, begrenzt, blockieren nie ---------- */
  var CAMEO_KEY = 'rv_bao_cameo_v1', lastUserAction = Date.now(), cameoBusy = false;
  ['pointerdown', 'keydown', 'scroll', 'input'].forEach(function (t) { addEventListener(t, function () { lastUserAction = Date.now(); }, { passive: true, capture: true }); });
  function cameoLog() { try { var v = JSON.parse(localStorage.getItem(CAMEO_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function cameoAllowed(kind, event) {
    var a = window.RVAnim || {}; if (a.baoCameo === false || reduce() || doc.hidden || cameoBusy) return false;
    if (doc.querySelector('#stockSheet:not(.hidden), .ch-picker:not([hidden]), dialog[open], .sx-modal:not([hidden])')) return false;
    var studio = [0, 1, 2, 3].some(function (i) { var s = doc.getElementById('s' + i); return s && !s.classList.contains('hidden'); });
    if (studio) return false;
    var L = cameoLog(), today = new Date().toISOString().slice(0, 10), now = Date.now();
    if (L.day !== today) { L.day = today; L.n = 0; }
    if ((L.n || 0) >= (event ? 8 : 4)) return false;
    if (!event && now - (L.last || 0) < 8 * 60000) return false;
    if (event && now - (L.last || 0) < 45000) return false;
    if (!event && now - lastUserAction < 2500) return false;
    // Nicht, wenn ein Bao schon sichtbar ist (z. B. auf Startseite oder im Chat).
    if (all.some(function (B) { return !B.head && !B.cameo && B.visible && B.svg.getClientRects().length && isOnScreen(B.svg); })) return event === 'force';
    L.last = now; L.n = (L.n || 0) + 1; try { localStorage.setItem(CAMEO_KEY, JSON.stringify(L)); } catch (e) {}
    return true;
  }
  function isOnScreen(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }
  function cameo(kind, text, event) {
    if (!cameoAllowed(kind, event)) return false;
    cameoBusy = true;
    var box = doc.createElement('div'); box.className = 'bao-cameo bao-cameo-' + kind; box.setAttribute('aria-hidden', 'true');
    if (kind === 'run') box.style.setProperty('--y', Math.round(rnd(0, 6)) + 'px');
    if (text) { var t = doc.createElement('span'); t.className = 'bao-say'; t.textContent = text; box.appendChild(t); }
    var hold = doc.createElement('span'); hold.className = 'bao-cameo-hold'; box.appendChild(hold);
    doc.body.appendChild(box);
    var B = Bao(hold, { noTap: true }); B.cameo = true;
    var plan = { peek: [['wave', 700]], hint: [['curious', 500], ['wave', 1900]], cheer: [['cheer', 500]], sale: [['cheer', 500], ['laugh', 2700]], run: [['bounce', 0], ['bounce', 600], ['bounce', 1200], ['bounce', 1800], ['bounce', 2400]], cannon: [['cannon', 500]] }[kind] || [];
    plan.forEach(function (p) { setTimeout(function () { B.play(p[0]); }, p[1]); });
    var life = { peek: 3400, hint: 4600, cheer: 3400, sale: 5000, run: 3200, cannon: 5600 }[kind] || 3400;
    box.style.setProperty('--life', life + 'ms');
    setTimeout(function () { box.remove(); cameoBusy = false; }, life + 80);
    return true;
  }
  function spontaneous() {
    setTimeout(function () {
      var kinds = ['peek', 'peek', 'run', 'hint'];
      if (Math.random() < .35) cameo(kinds[Math.floor(Math.random() * kinds.length)], null, false);
      spontaneous();
    }, rnd(4, 9) * 60000);
  }
  // Erfolgsmomente aus echten Ereignissen: gespeicherter Artikel, erfasster Verkauf, erledigte Aufgabe.
  function success(kind) {
    var visible = all.filter(function (B) { return !B.head && !B.cameo && B.visible && B.svg.getClientRects().length && isOnScreen(B.svg); });
    var big = kind === 'sale';
    if (visible.length) {
      visible.forEach(function (B) { if (big && !reduce() && Date.now() - lastCannon > 10 * 60000 && Math.random() < .3) cannon(B); else B.play(big ? 'cheer' : kind === 'task' ? 'clap' : 'bounce'); });
      return;
    }
    if (big) cameo(Math.random() < .25 && Date.now() - lastCannon > 10 * 60000 ? (lastCannon = Date.now(), 'cannon') : 'sale', 'Verkauft! 🎉', true);
    else if (kind === 'task') cameo('cheer', 'Erledigt!', true);
    else if (Math.random() < .3) cameo('peek', 'Gespeichert!', true);
  }

  /* ---------- Einbau ---------- */
  function headDataUrl() { return 'url("data:image/svg+xml,' + encodeURIComponent(svgMarkup('baoh', true).replace('<svg ', '<svg xmlns="' + NS + '" ')) + '")'; }
  function mount() {
    doc.documentElement.style.setProperty('--pd-head', headDataUrl());
    var frame = doc.querySelector('#hmOrb .v15-bot-frame') || doc.getElementById('hmOrb');
    if (frame && !frame.querySelector('.bao')) {
      Array.prototype.slice.call(frame.children).forEach(function (c) { c.remove(); });
      frame.classList.add('pd-host', 'pd-home'); frame.setAttribute('title', NAME + ' antippen');
      frame.insertAdjacentHTML('beforeend', '<span class="pd-floor" aria-hidden="true"></span>');
      Bao(frame, {});
    }
    var main = doc.querySelector('#aiChat .ch-main'), feed = doc.getElementById('chFeed');
    if (main && feed && !main.querySelector('.pd-stage')) {
      var st = doc.createElement('div'); st.className = 'pd-stage';
      st.innerHTML = '<span class="pd-state" data-s="idle"><i></i><b>' + LABELS[''] + '</b></span><span class="pd-plate"><b>' + NAME + '</b><small>RVO Intelligence · antippen</small></span><span class="pd-floor" aria-hidden="true"></span><span class="pd-hold" role="button" tabindex="0" aria-label="' + NAME + ' antippen"></span>';
      main.insertBefore(st, feed);
      Bao(st.querySelector('.pd-hold'), {});
    }
    [['#ccChatAvatar', 'pd-mini'], ['#v11AiPill .dot', 'pd-mini pd-dot'], ['#navChat', 'pd-mini pd-nav'], ['.rvt-tile[data-nav="chat"] .ic', 'pd-mini pd-tile']].forEach(function (q) {
      var h = doc.querySelector(q[0]); if (!h || h.querySelector('.bao')) return;
      h.replaceChildren(); q[1].split(' ').forEach(function (c) { h.classList.add(c); }); Bao(h, { head: true, noTap: true });
    });
    var pill = doc.querySelector('#v11AiPill > span'); if (pill && /KI-Assistent|KI-Panda/.test(pill.textContent)) pill.innerHTML = NAME + ' ist bereit.<br><small>RVO Intelligence</small>';
  }
  function init() {
    mount(); hookMessages();
    ['chatInput', 'homeAiInput'].forEach(function (id) { var el = doc.getElementById(id); if (el) el.addEventListener('input', onType); });
    doc.addEventListener('rv:ai-state', function (e) {
      var s = e && e.detail && e.detail.state;
      if (s === 'busy') { clearTimeout(quietT); talkRun++; setAll('think'); }
      else if (mode === 'think') setAll('');
    });
    doc.addEventListener('keydown', function (e) { var h = e.target && e.target.classList && e.target.classList.contains('pd-hold'); if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.target.click(); } });
    if (window.MutationObserver) { var cm = doc.getElementById('aiChat'); if (cm) new MutationObserver(function () { if (!cm.querySelector('.pd-stage')) mount(); }).observe(cm, { childList: true }); }
    doc.addEventListener('rvo:success', function (e) { success(e.detail && e.detail.kind); });
    spontaneous();
    window.RVBao = window.RVPanda = { name: NAME, state: setAll, speak: speak, list: all, create: Bao, cameo: function (k, t) { return cameo(k, t, 'force'); }, success: success, attachAudio: attachAudio, clips: Object.keys(CLIPS), markup: svgMarkup };
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
