/* RV Studio V17 — Bewegung und Effekte der Startseite.
   Reine Darstellung: liest keine Daten, verändert keine Daten. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var reduce = !!mq.matches;
  function homeVisible() { var h = doc.getElementById('home'); return !!h && !h.classList.contains('hidden'); }

  /* ---------- 1) Referenz-Layout auf Handybreite skalieren ---------- */
  function fit() {
    var w = window.innerWidth || root.clientWidth || 720;
    var z = w < 720 ? Math.max(0.4, w / 720) : 1;
    root.style.setProperty('--cc-zoom', String(Math.round(z * 10000) / 10000));
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  /* ---------- 2) Weltkarte (vereinfachte Umrisse, Längengrad/Breitengrad) ---------- */
  var LAND = [
    [[-168,66],[-162,70],[-156,71],[-140,70],[-128,70],[-115,68],[-100,68],[-95,72],[-85,70],[-80,63],[-90,58],[-95,57],[-82,52],[-78,58],[-70,60],[-64,60],[-60,55],[-56,52],[-60,47],[-66,45],[-70,42],[-74,40],[-76,35],[-81,31],[-80,26],[-82,27],[-84,30],[-90,29],[-97,27],[-97,22],[-92,18],[-87,21],[-88,16],[-83,14],[-83,10],[-79,9],[-77,8],[-80,7],[-86,11],[-92,14],[-96,16],[-105,20],[-110,24],[-112,30],[-117,32],[-120,35],[-124,40],[-124,46],[-125,50],[-132,55],[-140,59],[-150,60],[-158,58],[-165,60],[-166,64]],
    [[-73,78],[-60,82],[-40,83],[-22,80],[-20,72],[-25,68],[-35,65],[-43,60],[-50,62],[-53,67],[-58,72],[-68,76]],
    [[-80,9],[-75,11],[-70,12],[-62,11],[-55,6],[-50,2],[-48,-1],[-40,-3],[-35,-7],[-35,-10],[-39,-15],[-40,-22],[-48,-26],[-53,-34],[-58,-38],[-62,-40],[-65,-45],[-67,-50],[-69,-55],[-73,-53],[-75,-46],[-74,-38],[-72,-30],[-71,-20],[-76,-14],[-80,-6],[-81,-3],[-78,1],[-77,4]],
    [[-10,36],[-9,43],[-2,44],[-5,48],[-1,49],[2,51],[5,53],[8,54],[9,57],[11,58],[5,58],[5,62],[10,64],[15,68],[20,70],[28,71],[40,68],[44,68],[55,70],[68,72],[75,73],[85,76],[100,78],[112,76],[125,73],[140,72],[150,71],[160,70],[170,69],[180,68],[180,62],[170,60],[163,58],[160,54],[156,51],[150,59],[142,59],[136,54],[141,49],[140,43],[135,43],[130,42],[128,38],[126,35],[122,37],[119,40],[122,31],[120,26],[116,23],[110,21],[108,17],[109,12],[105,9],[103,11],[100,13],[98,9],[100,4],[103,1],[101,3],[98,8],[98,16],[94,17],[92,22],[88,22],[86,20],[80,15],[78,8],[76,11],[73,19],[70,22],[67,25],[62,25],[57,26],[57,23],[60,22],[55,17],[52,16],[45,13],[43,13],[39,20],[35,28],[34,32],[36,36],[30,36],[27,37],[26,40],[23,40],[22,37],[20,40],[19,42],[16,43],[13,45],[12,44],[16,40],[18,40],[16,38],[12,38],[10,44],[7,44],[3,43],[3,42],[0,40],[0,38],[-2,37],[-6,36]],
    [[-17,21],[-16,28],[-10,30],[-6,35],[0,36],[10,37],[11,33],[20,31],[25,32],[32,31],[35,28],[37,22],[39,16],[43,12],[51,12],[51,10],[48,5],[45,2],[41,-2],[40,-10],[40,-16],[35,-24],[33,-28],[28,-33],[20,-35],[18,-33],[15,-27],[13,-20],[12,-12],[13,-6],[9,-1],[9,4],[5,6],[-3,5],[-8,4],[-13,7],[-17,13],[-17,17]],
    [[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]],
    [[-5,50],[1,51],[2,53],[0,54],[-2,56],[-2,58],[-5,58],[-6,56],[-5,54],[-4,52]],
    [[-10,52],[-6,52],[-6,55],[-8,55],[-10,54]],
    [[-24,64],[-14,64],[-13,66],[-22,66]],
    [[130,31],[132,34],[136,34],[140,36],[141,40],[142,45],[145,44],[141,41],[140,38],[136,36],[132,35]],
    [[95,5],[98,4],[104,-2],[106,-6],[102,-4],[96,2]],
    [[109,1],[111,-3],[116,-4],[119,1],[117,6],[113,4]],
    [[105,-6],[114,-7],[114,-8],[106,-7]],
    [[131,-1],[141,-3],[150,-10],[146,-8],[138,-8],[132,-4]],
    [[114,-22],[114,-34],[118,-35],[123,-34],[129,-31],[135,-35],[138,-34],[140,-38],[146,-39],[150,-37],[153,-30],[153,-25],[146,-19],[145,-15],[142,-11],[136,-12],[135,-15],[130,-12],[127,-14],[122,-17]],
    [[172,-34],[175,-37],[178,-38],[174,-41],[171,-44],[167,-46],[170,-43]]
  ];
  var BOX = LAND.map(function (p) {
    var b = [999, 999, -999, -999];
    p.forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); });
    return b;
  });
  function inPoly(lon, lat, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  var landCache = {};
  function landPoints(step) {
    if (landCache[step]) return landCache[step];
    var pts = [], R = Math.PI / 180;
    for (var lat = -56; lat <= 82; lat += step) {
      var ls = step / Math.max(0.22, Math.cos(lat * R));
      for (var lon = -180; lon < 180; lon += ls) {
        for (var k = 0; k < LAND.length; k++) {
          var b = BOX[k];
          if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
          if (inPoly(lon, lat, LAND[k])) { pts.push([lon * R, lat * R]); break; }
        }
      }
    }
    landCache[step] = pts;
    return pts;
  }

  /* Leuchtpunkt-Sprite für Städte-Lichter */
  function glowSprite(rgb) {
    var c = doc.createElement('canvas'); c.width = c.height = 32;
    var g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.18, 'rgba(' + rgb + ',0.95)');
    gr.addColorStop(0.5, 'rgba(' + rgb + ',0.28)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    return c;
  }
  var SPRITE_RED = null, SPRITE_GOLD = null;

  /* ---------- 3) Drehende Erde (Orthografische Projektion) ---------- */
  function Earth(canvas, opt) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.step = opt.step || 1.9;
    this.pts = landPoints(this.step);
    this.lon0 = (opt.lon0 == null ? 12 : opt.lon0) * Math.PI / 180;
    this.tilt = (opt.tilt == null ? 26 : opt.tilt) * Math.PI / 180;
    this.speed = opt.speed == null ? 0.11 : opt.speed;           // Bogenmaß pro Sekunde
    this.dot = opt.dot || 1;
    this.lights = opt.lights !== false;
    this.size = 0;
    if (opt.ocean) {
      var oc = [], RR = Math.PI / 180, landSet = {};
      for (var la0 = -80; la0 <= 80; la0 += 6) {
        var ls0 = 6 / Math.max(0.25, Math.cos(la0 * RR));
        for (var lo0 = -180; lo0 < 180; lo0 += ls0) {
          var onLand = false;
          for (var k0 = 0; k0 < LAND.length && !onLand; k0++) { var b0 = BOX[k0]; if (lo0 >= b0[0] && lo0 <= b0[2] && la0 >= b0[1] && la0 <= b0[3] && inPoly(lo0, la0, LAND[k0])) onLand = true; }
          if (!onLand) oc.push([lo0 * RR, la0 * RR]);
        }
      }
      this.ocean = oc;
    }
    var hot = [];
    for (var i = 0; i < this.pts.length; i += Math.max(1, Math.round(this.pts.length / 52))) {
      hot.push({ p: this.pts[i], ph: Math.random() * 6.28, f: 0.8 + Math.random() * 1.8, red: Math.random() < 0.55 });
    }
    this.hot = hot;
  }
  Earth.prototype.resize = function () {
    var r = this.c.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var s = Math.max(24, Math.round(Math.max(r.width, r.height) * dpr));
    if (s !== this.size) { this.size = s; this.c.width = s; this.c.height = s; }
    return s > 0;
  };
  Earth.prototype.draw = function (t) {
    var ctx = this.ctx, s = this.size; if (!s) return;
    var cx = s / 2, cy = s / 2, R = s / 2 * 0.985;
    ctx.clearRect(0, 0, s, s);
    // Kugel
    var g = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.38, R * 0.05, cx, cy, R);
    g.addColorStop(0, 'rgba(34,14,6,0.98)'); g.addColorStop(0.5, 'rgba(12,5,3,0.99)'); g.addColorStop(1, 'rgba(6,3,2,1)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
    var lc = this.lon0 + t * this.speed, ct = Math.cos(this.tilt), st = Math.sin(this.tilt);
    // Gradnetz
    // Ozean als feines Punktraster wie in der Referenz
    if (this.ocean) {
      var oc = this.ocean, od = Math.max(0.8, s / 420);
      ctx.fillStyle = 'rgba(255,150,70,0.11)';
      for (var oi = 0; oi < oc.length; oi++) {
        var op = oc[oi], ocl = Math.cos(op[1]), odl = op[0] - (this.lon0 + t * this.speed);
        var ox = ocl * Math.sin(odl), oy = Math.sin(op[1]), oz = ocl * Math.cos(odl);
        var oy2 = oy * Math.cos(this.tilt) - oz * Math.sin(this.tilt), oz2 = oy * Math.sin(this.tilt) + oz * Math.cos(this.tilt);
        if (oz2 <= 0.05) continue;
        ctx.fillRect(cx + ox * R - od / 2, cy - oy2 * R - od / 2, od, od);
      }
    }
    ctx.lineWidth = Math.max(0.6, s / 520); ctx.strokeStyle = 'rgba(255,140,60,0.17)';
    var la, lo, x, y, z, y2, z2, first;
    for (la = -60; la <= 60; la += 30) {
      ctx.beginPath(); first = true;
      for (lo = 0; lo <= 360; lo += 6) {
        var L = la * Math.PI / 180, dl = lo * Math.PI / 180 - lc;
        x = Math.cos(L) * Math.sin(dl); y = Math.sin(L); z = Math.cos(L) * Math.cos(dl);
        y2 = y * ct - z * st; z2 = y * st + z * ct;
        if (z2 < 0) { first = true; continue; }
        if (first) { ctx.moveTo(cx + x * R, cy - y2 * R); first = false; } else ctx.lineTo(cx + x * R, cy - y2 * R);
      }
      ctx.stroke();
    }
    for (lo = 0; lo < 360; lo += 30) {
      ctx.beginPath(); first = true;
      for (la = -88; la <= 88; la += 4) {
        var L2 = la * Math.PI / 180, dl2 = lo * Math.PI / 180 - lc;
        x = Math.cos(L2) * Math.sin(dl2); y = Math.sin(L2); z = Math.cos(L2) * Math.cos(dl2);
        y2 = y * ct - z * st; z2 = y * st + z * ct;
        if (z2 < 0) { first = true; continue; }
        if (first) { ctx.moveTo(cx + x * R, cy - y2 * R); first = false; } else ctx.lineTo(cx + x * R, cy - y2 * R);
      }
      ctx.stroke();
    }
    // Landpunkte, in Helligkeitsstufen gebündelt
    var buckets = [[], [], [], [], []], pts = this.pts, n = pts.length, i;
    for (i = 0; i < n; i++) {
      var p = pts[i], cl = Math.cos(p[1]), d = p[0] - lc;
      x = cl * Math.sin(d); y = Math.sin(p[1]); z = cl * Math.cos(d);
      y2 = y * ct - z * st; z2 = y * st + z * ct;
      if (z2 <= 0.02) continue;
      var light = z2 * 0.62 + Math.max(0, -x * 0.25 + y2 * 0.35) + 0.45;
      var bi = Math.min(4, Math.max(0, Math.floor(light * 5)));
      buckets[bi].push(cx + x * R, cy - y2 * R);
    }
    var cols = ['rgba(205,112,44,0.55)', 'rgba(236,146,60,0.74)', 'rgba(255,182,92,0.88)', 'rgba(255,212,134,0.96)', 'rgba(255,238,184,1)'];
    var dsz = Math.max(1.2, s / 250) * this.dot, gsz = dsz * 2.6;
    ctx.globalCompositeOperation = 'lighter';
    for (var b = 2; b < 5; b++) {
      var ga = buckets[b]; if (!ga.length) continue;
      ctx.fillStyle = 'rgba(255,120,40,' + (0.02 + b * 0.015) + ')';
      for (i = 0; i < ga.length; i += 2) ctx.fillRect(ga[i] - gsz / 2, ga[i + 1] - gsz / 2, gsz, gsz);
    }
    for (var b2 = 0; b2 < 5; b2++) {
      var arr = buckets[b2]; if (!arr.length) continue;
      ctx.fillStyle = cols[b2];
      for (i = 0; i < arr.length; i += 2) ctx.fillRect(arr[i] - dsz / 2, arr[i + 1] - dsz / 2, dsz, dsz);
    }
    ctx.globalCompositeOperation = 'source-over';
    // Städte-Lichter
    if (this.lights) {
      if (!SPRITE_RED) { SPRITE_RED = glowSprite('255,70,40'); SPRITE_GOLD = glowSprite('255,190,90'); }
      for (i = 0; i < this.hot.length; i++) {
        var h = this.hot[i], hp = h.p, hc = Math.cos(hp[1]), hd = hp[0] - lc;
        x = hc * Math.sin(hd); y = Math.sin(hp[1]); z = hc * Math.cos(hd);
        y2 = y * ct - z * st; z2 = y * st + z * ct;
        if (z2 <= 0.1) continue;
        var tw = 0.35 + 0.65 * Math.max(0, Math.sin(t * h.f + h.ph));
        var sz = s * 0.045 * (0.6 + tw * 0.6);
        ctx.globalAlpha = Math.min(1, tw * z2 * 1.1);
        ctx.drawImage(h.red ? SPRITE_RED : SPRITE_GOLD, cx + x * R - sz / 2, cy - y2 * R - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    }
    // Lichtrand und Glanz
    var rim = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
    rim.addColorStop(0, 'rgba(255,110,30,0)'); rim.addColorStop(0.75, 'rgba(255,110,30,0.06)'); rim.addColorStop(0.93, 'rgba(255,140,50,0.38)'); rim.addColorStop(1, 'rgba(255,225,160,0.9)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = rim; ctx.fill();
    var sh = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.48, 0, cx - R * 0.42, cy - R * 0.48, R * 0.75);
    sh.addColorStop(0, 'rgba(255,220,170,0.16)'); sh.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
  };

  /* ---------- 4) Bühne: Globus, Avatar, Roboter, Lichtkanten, Glut ---------- */
  var earths = [];
  function svgEl(tag, attrs) { var e = doc.createElementNS('http://www.w3.org/2000/svg', tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function setupGlobe() {
    var wrap = doc.querySelector('.v15-globe-wrap'); if (!wrap || wrap.querySelector('.cc-earth')) return;
    var c = doc.createElement('canvas'); c.className = 'cc-earth'; c.setAttribute('aria-hidden', 'true');
    wrap.appendChild(c);
    var e = new Earth(c, { step: 1.9, lon0: 14, tilt: 38, speed: 0.11, ocean: true });
    // Hintergrund nach Referenz: Halo, Ringe, Fadenkreuz und Funken, die ins Panel auslaufen
    var bg = svgEl('svg', { viewBox: '-50 -50 200 200', class: 'cc-globe-bg', 'aria-hidden': 'true' });
    var bd = svgEl('defs', {});
    var rg = svgEl('radialGradient', { id: 'ccHalo', cx: '43', cy: '50', r: '62', gradientUnits: 'userSpaceOnUse' });
    [['0', '#ff4a20', '.30'], ['.42', '#c8250f', '.20'], ['.7', '#5a0c05', '.10'], ['1', '#000', '0']].forEach(function (q) { rg.appendChild(svgEl('stop', { offset: q[0], 'stop-color': q[1], 'stop-opacity': q[2] })); });
    bd.appendChild(rg); bg.appendChild(bd);
    bg.appendChild(svgEl('circle', { cx: '43', cy: '50', r: '62', fill: 'url(#ccHalo)' }));
    [[50, '.22', '.25', ''], [56, '.16', '.2', '.6 1.8'], [63, '.12', '.18', ''], [71, '.08', '.15', '2 3']].forEach(function (q) {
      bg.appendChild(svgEl('circle', { cx: '43', cy: '50', r: String(q[0]), fill: 'none', stroke: '#ff9a50', 'stroke-opacity': q[1], 'stroke-width': q[2], 'stroke-dasharray': q[3] }));
    });
    bg.appendChild(svgEl('path', { d: 'M-40 50 H134 M43 -36 V136 M-19 -12 L105 112 M105 -12 L-19 112', stroke: '#ff7a3a', 'stroke-opacity': '.10', 'stroke-width': '.25', fill: 'none' }));
    var ticks = '';
    for (var a = 0; a < 360; a += 6) { var rad = a * Math.PI / 180, r1 = a % 30 ? 52 : 50.5; ticks += 'M' + (43 + Math.cos(rad) * r1).toFixed(2) + ' ' + (50 + Math.sin(rad) * r1).toFixed(2) + ' L' + (43 + Math.cos(rad) * 53.5).toFixed(2) + ' ' + (50 + Math.sin(rad) * 53.5).toFixed(2) + ' '; }
    bg.appendChild(svgEl('path', { d: ticks, stroke: '#ffb070', 'stroke-opacity': '.28', 'stroke-width': '.3', fill: 'none' }));
    bg.appendChild(svgEl('path', { d: 'M43 -6 A56 56 0 0 1 91.5 22', fill: 'none', stroke: '#ff3a25', 'stroke-width': '.8', 'stroke-linecap': 'round', class: 'cc-glowline', opacity: '.75' }));
    bg.appendChild(svgEl('path', { d: 'M-5.5 78 A56 56 0 0 1 -12.6 42.3', fill: 'none', stroke: '#ff3a25', 'stroke-width': '.6', 'stroke-linecap': 'round', class: 'cc-glowline', opacity: '.6' }));
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var sp = 0; sp < 70; sp++) {
      var ang = rnd() * 6.2832, dist = 36 + rnd() * 50;
      var sx = 43 + Math.cos(ang) * dist * 1.25, sy = 50 + Math.sin(ang) * dist * 0.95;
      bg.appendChild(svgEl('circle', { cx: sx.toFixed(2), cy: sy.toFixed(2), r: (0.35 + rnd() * 0.7).toFixed(2), fill: rnd() < 0.7 ? '#ff4a30' : '#ffc27a', class: 'cc-spark cc-spark-' + (sp % 4) }));
    }
    wrap.insertBefore(bg, wrap.firstChild);
    earths.push(e);
    wrap.classList.add('cc-live');
    // HUD-Ringe, Radar-Sweep und Umlaufbahn mit wanderndem Licht
    var svg = svgEl('svg', { viewBox: '0 0 100 100', class: 'cc-globe-hud', 'aria-hidden': 'true' });
    var defs = svgEl('defs', {});
    var lg = svgEl('linearGradient', { id: 'ccSweepG', x1: '0', y1: '0', x2: '1', y2: '0' });
    lg.appendChild(svgEl('stop', { offset: '0', 'stop-color': '#ff5a30', 'stop-opacity': '0' }));
    lg.appendChild(svgEl('stop', { offset: '1', 'stop-color': '#ffb070', 'stop-opacity': '.55' }));
    defs.appendChild(lg); svg.appendChild(defs);
    var g1 = svgEl('g', { class: 'cc-spin-a' });
    g1.appendChild(svgEl('circle', { cx: '43', cy: '50', r: '38.5', fill: 'none', stroke: '#ffb070', 'stroke-opacity': '.45', 'stroke-width': '.35', 'stroke-dasharray': '1.2 2.4' }));
    g1.appendChild(svgEl('path', { d: 'M43 8.5 A41.5 41.5 0 0 1 78.9 29.2', fill: 'none', stroke: '#ff4a2c', 'stroke-width': '.9', 'stroke-linecap': 'round', class: 'cc-glowline' }));
    g1.appendChild(svgEl('path', { d: 'M7.1 70.8 A41.5 41.5 0 0 1 2.2 44.7', fill: 'none', stroke: '#ffb070', 'stroke-width': '.6', 'stroke-linecap': 'round' }));
    var g2 = svgEl('g', { class: 'cc-spin-b' });
    g2.appendChild(svgEl('path', { d: 'M82.5 50 A39.5 39.5 0 0 1 57 86.9', fill: 'none', stroke: '#ff6a3a', 'stroke-width': '.7', 'stroke-linecap': 'round', 'stroke-dasharray': '6 2 1 2' }));
    g2.appendChild(svgEl('path', { d: 'M16 21.3 A39.5 39.5 0 0 1 31 12.3', fill: 'none', stroke: '#ffd08a', 'stroke-width': '.5' }));
    var sweep = svgEl('g', { class: 'cc-sweep' });
    sweep.appendChild(svgEl('path', { d: 'M43 50 L43 16.5 A33.5 33.5 0 0 1 66.7 26.3 Z', fill: 'url(#ccSweepG)', opacity: '.33' }));
    var orbitPath = 'M-2 53 A45 10.5 0 1 0 88 53 A45 10.5 0 1 0 -2 53';
    var orbit = svgEl('g', { transform: 'rotate(-14 43 53)' });
    orbit.appendChild(svgEl('path', { d: 'M-2 53 A45 10.5 0 0 1 88 53', fill: 'none', stroke: '#ff3a25', 'stroke-opacity': '.35', 'stroke-width': '.4' }));
    orbit.appendChild(svgEl('path', { d: 'M88 53 A45 10.5 0 0 1 -2 53', fill: 'none', stroke: '#ff5a30', 'stroke-width': '.95', 'stroke-linecap': 'round', class: 'cc-glowline' }));
    orbit.appendChild(svgEl('path', { d: 'M76 59.5 A45 10.5 0 0 1 26 63', fill: 'none', stroke: '#ffd9a0', 'stroke-width': '.35', 'stroke-linecap': 'round', opacity: '.85' }));
    var dot = svgEl('circle', { r: '1.15', fill: '#fff0c8', class: 'cc-orbit-dot' });
    if (!reduce) {
      var am = svgEl('animateMotion', { dur: '7.5s', repeatCount: 'indefinite', path: orbitPath });
      dot.appendChild(am);
    } else { dot.setAttribute('cx', '88'); dot.setAttribute('cy', '53'); }
    orbit.appendChild(dot);
    svg.appendChild(sweep); svg.appendChild(g1); svg.appendChild(g2); svg.appendChild(orbit);
    wrap.appendChild(svg);
  }

  function setupAvatar() {
    var av = doc.querySelector('.v11-avatar'); if (!av || av.parentNode.querySelector('.cc-avatar-earth')) return;
    var box = doc.createElement('span'); box.className = 'cc-avatar'; box.setAttribute('aria-hidden', 'true');
    var c = doc.createElement('canvas'); c.className = 'cc-avatar-earth';
    av.parentNode.insertBefore(box, av); box.appendChild(av); box.appendChild(c);
    earths.push(new Earth(c, { step: 4, lon0: 10, tilt: 22, speed: 0.16, dot: 1.25, lights: true }));
  }

  function setupRobot() {
    var f = doc.querySelector('.v15-bot-frame'); if (!f || f.querySelector('.cc-bot-ring')) return;
    var img = f.querySelector('img'); if (!img) return;
    f.classList.add('cc-bot');
    var ring = img.cloneNode(false); ring.className = 'cc-bot-ring'; ring.removeAttribute('id'); ring.alt = ''; ring.setAttribute('aria-hidden', 'true');
    f.insertBefore(ring, img);
    img.classList.add('cc-bot-head');
    ['l', 'r'].forEach(function (k) { var e = doc.createElement('span'); e.className = 'cc-eye cc-eye-' + k; e.setAttribute('aria-hidden', 'true'); f.appendChild(e); });
    var m = doc.createElement('span'); m.className = 'cc-mouth'; m.setAttribute('aria-hidden', 'true'); f.appendChild(m);
    var svg = svgEl('svg', { viewBox: '0 0 100 100', class: 'cc-bot-hud', 'aria-hidden': 'true' });
    var a = svgEl('g', { class: 'cc-spin-b' });
    a.appendChild(svgEl('path', { d: 'M50 4 A47 47 0 0 1 93.5 33', fill: 'none', stroke: '#ff4a2c', 'stroke-width': '1.1', 'stroke-linecap': 'round', class: 'cc-glowline' }));
    a.appendChild(svgEl('path', { d: 'M7 68 A47 47 0 0 1 4 46', fill: 'none', stroke: '#ffc070', 'stroke-width': '.7', 'stroke-linecap': 'round' }));
    var b = svgEl('g', { class: 'cc-spin-a' });
    b.appendChild(svgEl('circle', { cx: '50', cy: '51', r: '36', fill: 'none', stroke: '#ffb070', 'stroke-opacity': '.35', 'stroke-width': '.4', 'stroke-dasharray': '1 3' }));
    svg.appendChild(a); svg.appendChild(b); f.appendChild(svg);
    doc.addEventListener('rv:ai-state', function (e) {
      var st = e && e.detail && e.detail.state;
      f.classList.toggle('cc-busy', st === 'busy');
      f.classList.toggle('cc-ok', st === 'ready');
    });
  }

  function setupFills() {
    var els = doc.querySelectorAll('#v11Root .v11-tile, #v11Root .v11-q, #v11Root .v11-card');
    Array.prototype.forEach.call(els, function (el) {
      if (el.querySelector(':scope > .cc-fill')) return;
      var f = doc.createElement('i'); f.className = 'cc-fill'; f.setAttribute('aria-hidden', 'true');
      el.insertBefore(f, el.firstChild);
    });
  }
  function setupGlints() {
    var els = doc.querySelectorAll('#v11Root .v11-panel, #v11Root .v11-tile, #v11Root .v11-q, #v11Root .v11-card, #v11Root .v11-pill');
    Array.prototype.forEach.call(els, function (el, i) {
      if (el.querySelector(':scope > .cc-glint')) return;
      var g = doc.createElement('i'); g.className = 'cc-glint'; g.setAttribute('aria-hidden', 'true');
      g.style.setProperty('--d', (-(i * 1.37) % 9).toFixed(2) + 's');
      el.appendChild(g);
    });
  }

  /* Glutpartikel im Hintergrund */
  var embers = null;
  function setupEmbers() {
    if (reduce || doc.querySelector('.cc-embers')) return;
    var c = doc.createElement('canvas'); c.className = 'cc-embers'; c.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(c);
    var ctx = c.getContext('2d'), list = [];
    function size() { var dpr = Math.min(window.devicePixelRatio || 1, 1.5); c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr); c.dataset.dpr = dpr; }
    size(); window.addEventListener('resize', size);
    for (var i = 0; i < 34; i++) list.push({ x: Math.random(), y: Math.random(), v: 0.015 + Math.random() * 0.04, r: 0.6 + Math.random() * 1.6, ph: Math.random() * 6.28, red: Math.random() < 0.6 });
    embers = function (t, dt) {
      var w = c.width, h = c.height, dpr = +c.dataset.dpr || 1;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        p.y -= p.v * dt; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        var x = (p.x + Math.sin(t * 0.6 + p.ph) * 0.01) * w, y = p.y * h;
        var a = (0.25 + 0.5 * Math.max(0, Math.sin(t * 1.7 + p.ph))) * Math.min(1, p.y * 1.4);
        ctx.fillStyle = p.red ? 'rgba(255,80,40,' + a + ')' : 'rgba(255,190,110,' + a + ')';
        ctx.beginPath(); ctx.arc(x, y, p.r * dpr, 0, 6.2832); ctx.fill();
      }
    };
  }

  /* ---------- 5) Zahlen hochzählen, wenn sich ein Wert ändert ---------- */
  var nf = function (d) { return new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  function parseVal(t) {
    var m = /^(-?[\d.]+(?:,(\d+))?)(\s*€)?$/.exec(String(t || '').trim());
    if (!m) return null;
    return { n: parseFloat(m[1].replace(/\./g, '').replace(',', '.')), dec: m[2] ? m[2].length : 0, eur: !!m[3] };
  }
  function setupCounters() {
    if (reduce || !window.MutationObserver) return;
    var els = doc.querySelectorAll('#v11Root .val');
    Array.prototype.forEach.call(els, function (el) {
      if (el.dataset.ccCount) return; el.dataset.ccCount = '1';
      var mine = null, last = parseVal(el.textContent), run = 0;
      new MutationObserver(function () {
        if (el.textContent === mine) return;            // eigene Zwischenwerte ignorieren
        var target = parseVal(el.textContent); if (!target) { last = null; return; }
        var from = last ? last.n : 0; last = target;
        if (Math.abs(target.n - from) < 0.005) return;
        var t0 = performance.now(), fmt = nf(target.dec), suffix = target.eur ? ' €' : '', id = ++run;
        var finalText = el.textContent;
        (function step(now) {
          if (id !== run) return;
          var k = Math.min(1, (now - t0) / 650), e = 1 - Math.pow(1 - k, 3);
          mine = k < 1 ? fmt.format(from + (target.n - from) * e) + suffix : finalText;
          el.textContent = mine;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ---------- 6) Gemeinsame Animationsschleife (30 fps, pausiert wenn unsichtbar) ---------- */
  var start = performance.now(), lastFrame = 0, lastT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (doc.hidden || !homeVisible()) return;
    if (now - lastFrame < 33) return;
    lastFrame = now;
    var t = (now - start) / 1000, dt = Math.min(0.1, t - lastT); lastT = t;
    for (var i = 0; i < earths.length; i++) { if (earths[i].resize()) earths[i].draw(t); }
    if (embers) embers(t, dt);
  }
  function drawStatic() { for (var i = 0; i < earths.length; i++) { if (earths[i].resize()) earths[i].draw(0); } }

  function init() {
    setupGlobe(); setupAvatar(); setupRobot(); setupFills(); setupGlints(); setupEmbers(); setupCounters();
    doc.documentElement.classList.add('cc-fx');
    if (reduce) { drawStatic(); window.addEventListener('resize', drawStatic); var nh = doc.getElementById('navHome'); if (nh) nh.addEventListener('click', function () { setTimeout(drawStatic, 60); }); }
    else requestAnimationFrame(frame);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
