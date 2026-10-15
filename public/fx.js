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
    gr.addColorStop(0, 'rgba(240,255,255,1)'); gr.addColorStop(0.18, 'rgba(' + rgb + ',0.95)');
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
    this.hd = !!opt.hd;
    if (opt.ocean) {
      var oc = [], RR = Math.PI / 180, landSet = {};
      var os = opt.hd ? 4 : 6;
      for (var la0 = -80; la0 <= 80; la0 += os) {
        var ls0 = os / Math.max(0.25, Math.cos(la0 * RR));
        for (var lo0 = -180; lo0 < 180; lo0 += ls0) {
          var onLand = false;
          for (var k0 = 0; k0 < LAND.length && !onLand; k0++) { var b0 = BOX[k0]; if (lo0 >= b0[0] && lo0 <= b0[2] && la0 >= b0[1] && la0 <= b0[3] && inPoly(lo0, la0, LAND[k0])) onLand = true; }
          if (!onLand) oc.push([lo0 * RR, la0 * RR]);
        }
      }
      this.ocean = oc;
    }
    var hot = [];
    for (var i = 0; i < this.pts.length; i += Math.max(1, Math.round(this.pts.length / (opt.hd ? 240 : 52)))) {
      hot.push({ p: this.pts[i], ph: Math.random() * 6.28, f: 0.8 + Math.random() * 1.8, red: Math.random() < 0.55 });
    }
    this.hot = hot;
    // Leuchtende Handelsrouten zwischen Städten (Längengrad, Breitengrad)
    var C = { ber: [13, 52], lon: [0, 51], par: [2, 49], mad: [-4, 40], rom: [12, 42], mos: [37, 56], ist: [29, 41], cai: [31, 30], lag: [3, 6], dub: [55, 25], del: [77, 28], nyc: [-74, 41], sao: [-46, -23], jnb: [28, -26], tok: [140, 36], sto: [18, 59] };
    var R2 = Math.PI / 180;
    this.routes = opt.hd ? [['ber', 'nyc'], ['lon', 'dub'], ['par', 'lag'], ['rom', 'cai'], ['mad', 'sao'], ['mos', 'del'], ['ist', 'jnb'], ['sto', 'tok'], ['ber', 'mos'], ['lon', 'mad']].map(function (r, k) {
      return { a: [C[r[0]][0] * R2, C[r[0]][1] * R2], b: [C[r[1]][0] * R2, C[r[1]][1] * R2], off: k * 0.37, sp: 0.18 + (k % 3) * 0.06, red: k % 3 !== 1 };
    }) : [];
  }
  Earth.prototype.resize = function () {
    var r = this.c.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
    g.addColorStop(0, 'rgba(6,18,34,0.98)'); g.addColorStop(0.5, 'rgba(3,6,12,0.99)'); g.addColorStop(1, 'rgba(2,3,6,1)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
    var lc = this.lon0 + t * this.speed, ct = Math.cos(this.tilt), st = Math.sin(this.tilt);
    // Gradnetz
    // Ozean als feines Punktraster wie in der Referenz
    if (this.ocean) {
      var oc = this.ocean, od = Math.max(0.8, s / 420);
      ctx.fillStyle = 'rgba(70,150,255,0.11)';
      for (var oi = 0; oi < oc.length; oi++) {
        var op = oc[oi], ocl = Math.cos(op[1]), odl = op[0] - (this.lon0 + t * this.speed);
        var ox = ocl * Math.sin(odl), oy = Math.sin(op[1]), oz = ocl * Math.cos(odl);
        var oy2 = oy * Math.cos(this.tilt) - oz * Math.sin(this.tilt), oz2 = oy * Math.sin(this.tilt) + oz * Math.cos(this.tilt);
        if (oz2 <= 0.05) continue;
        ctx.fillRect(cx + ox * R - od / 2, cy - oy2 * R - od / 2, od, od);
      }
    }
    ctx.lineWidth = Math.max(0.6, s / 520); ctx.strokeStyle = this.hd ? 'rgba(150,200,255,0.16)' : 'rgba(60,140,255,0.17)';
    var la, lo, x, y, z, y2, z2, first;
    var gstep = this.hd ? 15 : 30;
    for (la = this.hd ? -75 : -60; la <= (this.hd ? 75 : 60); la += gstep) {
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
    for (lo = 0; lo < 360; lo += gstep) {
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
      var light = this.hd ? Math.max(0, x * -0.15 + y2 * 0.35 + z2 * 0.8) * 1.05 + 0.32 : z2 * 0.62 + Math.max(0, -x * 0.25 + y2 * 0.35) + 0.45;
      var bi = Math.min(4, Math.max(0, Math.floor(light * 5)));
      buckets[bi].push(cx + x * R, cy - y2 * R);
    }
    var cols = ['rgba(120,150,190,0.5)', 'rgba(165,190,225,0.72)', 'rgba(205,220,242,0.88)', 'rgba(230,238,252,0.96)', 'rgba(252,253,255,1)'];
    var dsz = Math.max(1.2, s / (this.hd ? 260 : 250)) * this.dot, gsz = dsz * 2.6;
    ctx.globalCompositeOperation = 'lighter';
    for (var b = 2; b < 5; b++) {
      var ga = buckets[b]; if (!ga.length) continue;
      ctx.fillStyle = 'rgba(40,140,255,' + (0.02 + b * 0.015) + ')';
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
      if (!SPRITE_RED) { SPRITE_RED = glowSprite('255,150,60'); SPRITE_GOLD = glowSprite('255,215,150'); }
      for (i = 0; i < this.hot.length; i++) {
        var h = this.hot[i], hp = h.p, hc = Math.cos(hp[1]), hd = hp[0] - lc;
        x = hc * Math.sin(hd); y = Math.sin(hp[1]); z = hc * Math.cos(hd);
        y2 = y * ct - z * st; z2 = y * st + z * ct;
        if (z2 <= 0.1) continue;
        var tw = 0.35 + 0.65 * Math.max(0, Math.sin(t * h.f + h.ph));
        var sz = s * (this.hd ? 0.055 : 0.045) * (0.6 + tw * 0.6);
        ctx.globalAlpha = Math.min(1, tw * z2 * 1.1);
        ctx.drawImage(h.red ? SPRITE_RED : SPRITE_GOLD, cx + x * R - sz / 2, cy - y2 * R - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    }
    if (this.hd) this.drawHd(t, ctx, s, cx, cy, R, lc, ct, st);
    // Lichtrand und Glanz
    var rim = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
    rim.addColorStop(0, 'rgba(30,140,255,0)'); rim.addColorStop(0.75, 'rgba(30,140,255,0.06)'); rim.addColorStop(0.93, 'rgba(50,140,255,0.38)'); rim.addColorStop(1, 'rgba(160,225,255,0.9)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = rim; ctx.fill();
    var sh = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.48, 0, cx - R * 0.42, cy - R * 0.48, R * 0.75);
    sh.addColorStop(0, 'rgba(170,220,255,0.16)'); sh.addColorStop(1, 'rgba(170,220,255,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
  };

  // Zusatzdetails des großen Globus: Lichtquelle, Routen, Reflexe, Lichtkante
  Earth.prototype.drawHd = function (t, ctx, s, cx, cy, R, lc, ct, st) {
    function proj(lon, lat, alt) {
      var cl = Math.cos(lat), d = lon - lc, x = cl * Math.sin(d), y = Math.sin(lat), z = cl * Math.cos(d);
      return [x * alt, (y * ct - z * st) * alt, (y * st + z * ct) * alt];
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Warmer Lichtkern hinter Europa (oben Mitte)
    var hx = cx, hy = cy - R * 0.42, hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.75);
    hg.addColorStop(0, 'rgba(150,214,255,0.30)'); hg.addColorStop(0.35, 'rgba(60,150,255,0.12)'); hg.addColorStop(1, 'rgba(40,140,255,0)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = hg; ctx.fill();
    // Routen als leuchtende Bögen mit wanderndem Lichtpunkt
    ctx.lineCap = 'round';
    for (var r = 0; r < this.routes.length; r++) {
      var ro = this.routes[r], a = ro.a, b = ro.b;
      var va = [Math.cos(a[1]) * Math.cos(a[0]), Math.cos(a[1]) * Math.sin(a[0]), Math.sin(a[1])];
      var vb = [Math.cos(b[1]) * Math.cos(b[0]), Math.cos(b[1]) * Math.sin(b[0]), Math.sin(b[1])];
      var om = Math.acos(Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]))), so = Math.sin(om) || 1;
      var N = 28, pts = [];
      for (var k = 0; k <= N; k++) {
        var f = k / N, A = Math.sin((1 - f) * om) / so, B = Math.sin(f * om) / so;
        var vx = A * va[0] + B * vb[0], vy = A * va[1] + B * vb[1], vz = A * va[2] + B * vb[2];
        var lon = Math.atan2(vy, vx), lat = Math.asin(Math.max(-1, Math.min(1, vz)));
        pts.push(proj(lon, lat, 1 + 0.16 * om / 3 * Math.sin(Math.PI * f)));
      }
      var col = ro.red ? '255,150,60' : '255,215,150';
      ctx.lineWidth = Math.max(0.8, s / 340);
      ctx.strokeStyle = 'rgba(' + col + ',0.42)';
      ctx.beginPath(); var on = false;
      for (k = 0; k <= N; k++) {
        var q = pts[k];
        if (q[2] < 0 && q[0] * q[0] + q[1] * q[1] < 1) { on = false; continue; }
        if (!on) { ctx.moveTo(cx + q[0] * R, cy - q[1] * R); on = true; } else ctx.lineTo(cx + q[0] * R, cy - q[1] * R);
      }
      ctx.stroke();
      var ph = ((t * ro.sp + ro.off) % 1 + 1) % 1, idx = Math.floor(ph * N), pq = pts[idx];
      if (!(pq[2] < 0 && pq[0] * pq[0] + pq[1] * pq[1] < 1)) {
        var px = cx + pq[0] * R, py = cy - pq[1] * R, gs = s * 0.05;
        ctx.drawImage(ro.red ? SPRITE_RED : SPRITE_GOLD, px - gs / 2, py - gs / 2, gs, gs);
      }
    }
    // Reflexe/Sterne am Rand (wie die hellen Lichtpunkte im Referenzbild)
    var fl = [[-1.45, 0.9], [-0.5, 1.7], [0.55, 2.3], [2.2, 1.3], [3.4, 2.9]];
    for (var i = 0; i < fl.length; i++) {
      var ang = fl[i][0], tw = 0.4 + 0.6 * Math.max(0, Math.sin(t * fl[i][1] + i * 1.7));
      var fx = cx + Math.cos(ang) * R * 0.985, fy = cy + Math.sin(ang) * R * 0.985, L = s * 0.06 * tw;
      ctx.globalAlpha = tw;
      ctx.drawImage(i % 2 ? SPRITE_RED : SPRITE_GOLD, fx - L / 2, fy - L / 2, L, L);
      ctx.strokeStyle = 'rgba(190,230,255,0.75)'; ctx.lineWidth = Math.max(0.6, s / 700);
      ctx.beginPath(); ctx.moveTo(fx - L * 0.9, fy); ctx.lineTo(fx + L * 0.9, fy); ctx.moveTo(fx, fy - L * 0.6); ctx.lineTo(fx, fy + L * 0.6); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Scharfe, glühende Lichtkante
    ctx.shadowColor = 'rgba(50,140,255,0.9)'; ctx.shadowBlur = s / 40;
    ctx.strokeStyle = 'rgba(130,200,255,0.85)'; ctx.lineWidth = Math.max(1, s / 260);
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.992, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,140,255,0.6)';
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.992, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
    ctx.restore();
  };

  /* ---------- 4) Bühne: Globus, Avatar, Roboter, Lichtkanten, Glut ---------- */
  var earths = [];
  function svgEl(tag, attrs) { var e = doc.createElementNS('http://www.w3.org/2000/svg', tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function setupGlobe() {
    var wrap = doc.querySelector('.v15-globe-wrap'); if (!wrap || wrap.querySelector('.cc-earth')) return;
    var c = doc.createElement('canvas'); c.className = 'cc-earth'; c.setAttribute('aria-hidden', 'true');
    wrap.appendChild(c);
    var e = new Earth(c, { step: 1.35, lon0: 14, tilt: 38, speed: 0.11, ocean: true, hd: true });
    // Hintergrund nach Referenz: Halo, Ringe, Fadenkreuz und Funken, die ins Panel auslaufen
    var bg = svgEl('svg', { viewBox: '-50 -50 200 200', class: 'cc-globe-bg', 'aria-hidden': 'true' });
    var bd = svgEl('defs', {});
    var rg = svgEl('radialGradient', { id: 'ccHalo', cx: '43', cy: '50', r: '62', gradientUnits: 'userSpaceOnUse' });
    [['0', '#208cff', '.30'], ['.42', '#0f6ec8', '.20'], ['.7', '#05315a', '.10'], ['1', '#000', '0']].forEach(function (q) { rg.appendChild(svgEl('stop', { offset: q[0], 'stop-color': q[1], 'stop-opacity': q[2] })); });
    bd.appendChild(rg); bg.appendChild(bd);
    bg.appendChild(svgEl('circle', { cx: '43', cy: '50', r: '62', fill: 'url(#ccHalo)' }));
    [[50, '.22', '.25', ''], [56, '.16', '.2', '.6 1.8'], [63, '.12', '.18', ''], [71, '.08', '.15', '2 3']].forEach(function (q) {
      bg.appendChild(svgEl('circle', { cx: '43', cy: '50', r: String(q[0]), fill: 'none', stroke: '#509aff', 'stroke-opacity': q[1], 'stroke-width': q[2], 'stroke-dasharray': q[3] }));
    });
    bg.appendChild(svgEl('path', { d: 'M-40 50 H134 M43 -36 V136 M-19 -12 L105 112 M105 -12 L-19 112', stroke: '#3a8cff', 'stroke-opacity': '.10', 'stroke-width': '.25', fill: 'none' }));
    var ticks = '';
    for (var a = 0; a < 360; a += 6) { var rad = a * Math.PI / 180, r1 = a % 30 ? 52 : 50.5; ticks += 'M' + (43 + Math.cos(rad) * r1).toFixed(2) + ' ' + (50 + Math.sin(rad) * r1).toFixed(2) + ' L' + (43 + Math.cos(rad) * 53.5).toFixed(2) + ' ' + (50 + Math.sin(rad) * 53.5).toFixed(2) + ' '; }
    bg.appendChild(svgEl('path', { d: ticks, stroke: '#70b0ff', 'stroke-opacity': '.28', 'stroke-width': '.3', fill: 'none' }));
    // Rote Lichtbögen schwingen um die Erde (Drehung um die Globusmitte im SVG-Raum)
    function turn(g, values, dur, spline) {
      if (reduce) return g;
      var at = svgEl('animateTransform', { attributeName: 'transform', type: 'rotate', values: values, dur: dur, repeatCount: 'indefinite' });
      if (spline) { at.setAttribute('calcMode', 'spline'); at.setAttribute('keyTimes', '0;0.5;1'); at.setAttribute('keySplines', '.45 0 .55 1;.45 0 .55 1'); }
      g.appendChild(at); return g;
    }
    var swA = turn(svgEl('g', {}), '-35 43 50;55 43 50;-35 43 50', '7s', true);
    swA.appendChild(svgEl('path', { d: 'M43 -6 A56 56 0 0 1 91.5 22', fill: 'none', stroke: '#258cff', 'stroke-width': '.9', 'stroke-linecap': 'round', class: 'cc-glowline', opacity: '.85' }));
    swA.appendChild(svgEl('circle', { cx: '91.5', cy: '22', r: '1', fill: '#a0d9ff', class: 'cc-orbit-dot' }));
    var swB = turn(svgEl('g', {}), '30 43 50;-60 43 50;30 43 50', '9s', true);
    swB.appendChild(svgEl('path', { d: 'M-5.5 78 A56 56 0 0 1 -12.6 42.3', fill: 'none', stroke: '#258cff', 'stroke-width': '.7', 'stroke-linecap': 'round', class: 'cc-glowline', opacity: '.75' }));
    var swC = turn(svgEl('g', {}), '0 43 50;360 43 50', '14s', false);
    swC.appendChild(svgEl('path', { d: 'M90 70 A51 51 0 0 1 60 98', fill: 'none', stroke: '#308cff', 'stroke-width': '.7', 'stroke-linecap': 'round', class: 'cc-glowline', opacity: '.8' }));
    swC.appendChild(svgEl('circle', { cx: '60', cy: '98', r: '.9', fill: '#c8f0ff', class: 'cc-orbit-dot' }));
    var swD = turn(svgEl('g', {}), '360 43 50;0 43 50', '19s', false);
    swD.appendChild(svgEl('path', { d: 'M-3 22 A60 60 0 0 1 22 -6', fill: 'none', stroke: '#258cff', 'stroke-width': '.55', 'stroke-linecap': 'round', class: 'cc-glowline', opacity: '.65', 'stroke-dasharray': '5 1.5 1 1.5' }));
    // Weitere HUD-Details: Speichen, Datenbögen, Knoten, Lichtstreifen, drehender Segmentring
    var spokes = '';
    for (var sa = 0; sa < 360; sa += 15) { var sr = sa * Math.PI / 180; spokes += 'M' + (43 + Math.cos(sr) * 50).toFixed(2) + ' ' + (50 + Math.sin(sr) * 50).toFixed(2) + ' L' + (43 + Math.cos(sr) * 78).toFixed(2) + ' ' + (50 + Math.sin(sr) * 78).toFixed(2) + ' '; }
    bg.appendChild(svgEl('path', { d: spokes, stroke: '#4a8cff', 'stroke-opacity': '.09', 'stroke-width': '.22', fill: 'none' }));
    function arcD(r, a0, a1) { var p0 = a0 * Math.PI / 180, p1 = a1 * Math.PI / 180; return 'M' + (43 + Math.cos(p0) * r).toFixed(2) + ' ' + (50 + Math.sin(p0) * r).toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + (43 + Math.cos(p1) * r).toFixed(2) + ' ' + (50 + Math.sin(p1) * r).toFixed(2); }
    [[58, 200, 228, '#70c0ff', 1.4, '.55'], [58, 300, 312, '#70c0ff', 1.4, '.5'], [58, 20, 34, '#2c8cff', 1.4, '.6'], [58, 118, 150, '#70c0ff', 1.1, '.4'],
     [66, 250, 290, '#2c8cff', .5, '.55'], [66, 60, 95, '#70b0ff', .45, '.45'], [74, 160, 205, '#70b0ff', .35, '.35'], [74, 330, 352, '#2c8cff', .6, '.5'],
     [47.5, 95, 140, '#a0e0ff', .9, '.55'], [47.5, 250, 268, '#2c8cff', 1.1, '.7']].forEach(function (q) {
      bg.appendChild(svgEl('path', { d: arcD(q[0], q[1], q[2]), fill: 'none', stroke: q[3], 'stroke-width': String(q[4]), 'stroke-opacity': q[5], 'stroke-linecap': 'butt', class: q[3] === '#2c8cff' ? 'cc-glowline' : '' }));
    });
    [[50, 40], [50, 175], [50, 290], [58, 228], [66, 95], [74, 352], [56, 330]].forEach(function (q, k) {
      var na = q[1] * Math.PI / 180;
      bg.appendChild(svgEl('circle', { cx: (43 + Math.cos(na) * q[0]).toFixed(2), cy: (50 + Math.sin(na) * q[0]).toFixed(2), r: '.7', fill: k % 2 ? '#a0d9ff' : '#3a8cff', class: 'cc-orbit-dot cc-spark cc-spark-' + (k % 4) }));
    });
    var lgS = svgEl('linearGradient', { id: 'ccStreak', x1: '0', y1: '0', x2: '1', y2: '0' });
    [['0', '0'], ['.5', '.9'], ['1', '0']].forEach(function (q) { lgS.appendChild(svgEl('stop', { offset: q[0], 'stop-color': '#308cff', 'stop-opacity': q[1] })); });
    bd.appendChild(lgS);
    [['M-10 18 L60 -2', '.35'], ['M30 104 L104 74', '.3'], ['M-14 92 L36 112', '.25'], ['M70 -8 L118 30', '.3']].forEach(function (q) {
      bg.appendChild(svgEl('path', { d: q[0], stroke: 'url(#ccStreak)', 'stroke-width': q[1], fill: 'none', class: 'cc-glowline' }));
    });
    var segRing = turn(svgEl('g', {}), '0 43 50;360 43 50', '40s', false);
    segRing.appendChild(svgEl('circle', { cx: '43', cy: '50', r: '61', fill: 'none', stroke: '#70b0ff', 'stroke-opacity': '.3', 'stroke-width': '.7', 'stroke-dasharray': '4 1.4 .8 1.4' }));
    bg.appendChild(segRing);
    var segRing2 = turn(svgEl('g', {}), '360 43 50;0 43 50', '28s', false);
    segRing2.appendChild(svgEl('circle', { cx: '43', cy: '50', r: '69', fill: 'none', stroke: '#2c8cff', 'stroke-opacity': '.28', 'stroke-width': '.4', 'stroke-dasharray': '10 4 2 4' }));
    bg.appendChild(segRing2);
    bg.appendChild(swA); bg.appendChild(swB); bg.appendChild(swC); bg.appendChild(swD);
    var sparks = turn(svgEl('g', {}), '0 43 50;360 43 50', '60s', false);
    bg.appendChild(sparks);
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var sp = 0; sp < 70; sp++) {
      var ang = rnd() * 6.2832, dist = 36 + rnd() * 50;
      var sx = 43 + Math.cos(ang) * dist * 1.25, sy = 50 + Math.sin(ang) * dist * 0.95;
      sparks.appendChild(svgEl('circle', { cx: sx.toFixed(2), cy: sy.toFixed(2), r: (0.35 + rnd() * 0.7).toFixed(2), fill: rnd() < 0.7 ? '#308cff' : '#7ac2ff', class: 'cc-spark cc-spark-' + (sp % 4) }));
    }
    // Mehr Licht: Leuchthof, Lichtsäule, zusätzliche Orbitbahnen, Sternfunkeln
    var lgB = svgEl('linearGradient', { id: 'ccPillar', x1: '0', y1: '0', x2: '0', y2: '1' });
    [['0', '0'], ['.3', '.55'], ['.5', '1'], ['.7', '.55'], ['1', '0']].forEach(function (q) { lgB.appendChild(svgEl('stop', { offset: q[0], 'stop-color': '#bfe3ff', 'stop-opacity': q[1] })); });
    bd.appendChild(lgB);
    var rgG = svgEl('radialGradient', { id: 'ccGlowHalo', cx: '43', cy: '50', r: '48', gradientUnits: 'userSpaceOnUse' });
    [['0', '#5fb4ff', '.0'], ['.68', '#3d9bff', '.0'], ['.72', '#3d9bff', '.55'], ['.8', '#2a7ae0', '.22'], ['1', '#000', '0']].forEach(function (q) { rgG.appendChild(svgEl('stop', { offset: q[0], 'stop-color': q[1], 'stop-opacity': q[2] })); });
    bd.appendChild(rgG);
    bg.appendChild(svgEl('circle', { cx: '43', cy: '50', r: '48', fill: 'url(#ccGlowHalo)', class: 'cc-field-halo' }));
    bg.appendChild(svgEl('rect', { x: '42.4', y: '-45', width: '1.2', height: '190', fill: 'url(#ccPillar)', class: 'cc-glowline cc-beam' }));
    bg.appendChild(svgEl('rect', { x: '-30', y: '49.6', width: '146', height: '.8', fill: 'url(#ccStreak)', opacity: '.8' }));
    [[52, 12, -16, '.9', '#5fb4ff', '14s'], [58, 16, 12, '.6', '#9fd2ff', '20s'], [47, 7, -4, '.5', '#ffb066', '11s']].forEach(function (q, k) {
      var e = svgEl('ellipse', { cx: '43', cy: '50', rx: String(q[0]), ry: String(q[1]), fill: 'none', stroke: q[4], 'stroke-width': q[3], transform: 'rotate(' + q[2] + ' 43 50)', 'stroke-dasharray': k === 1 ? '6 3 1 3' : '30 8', class: 'cc-glowline cc-orbit-flow', style: 'animation-duration:' + q[5] });
      bg.appendChild(e);
    });
    [[8, 14, 2.4], [82, 24, 3], [92, 78, 2.2], [-4, 86, 2.6], [60, -2, 2], [20, 104, 1.8]].forEach(function (q, k) {
      var x = q[0], y = q[1], r = q[2];
      var st = svgEl('path', { d: 'M' + x + ' ' + (y - r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z', fill: k % 3 === 2 ? '#ffd2a0' : '#e6f4ff', class: 'cc-spark cc-spark-' + (k % 4) });
      bg.appendChild(st);
    });
    wrap.insertBefore(bg, wrap.firstChild);
    earths.push(e);
    wrap.classList.add('cc-live');
    // HUD-Ringe, Radar-Sweep und Umlaufbahn mit wanderndem Licht
    var svg = svgEl('svg', { viewBox: '0 0 100 100', class: 'cc-globe-hud', 'aria-hidden': 'true' });
    var defs = svgEl('defs', {});
    var lg = svgEl('linearGradient', { id: 'ccSweepG', x1: '0', y1: '0', x2: '1', y2: '0' });
    lg.appendChild(svgEl('stop', { offset: '0', 'stop-color': '#308cff', 'stop-opacity': '0' }));
    lg.appendChild(svgEl('stop', { offset: '1', 'stop-color': '#70b0ff', 'stop-opacity': '.55' }));
    defs.appendChild(lg); svg.appendChild(defs);
    var g1 = svgEl('g', { class: 'cc-spin-a' });
    g1.appendChild(svgEl('circle', { cx: '43', cy: '50', r: '38.5', fill: 'none', stroke: '#70b0ff', 'stroke-opacity': '.45', 'stroke-width': '.35', 'stroke-dasharray': '1.2 2.4' }));
    g1.appendChild(svgEl('path', { d: 'M43 8.5 A41.5 41.5 0 0 1 78.9 29.2', fill: 'none', stroke: '#2c8cff', 'stroke-width': '.9', 'stroke-linecap': 'round', class: 'cc-glowline' }));
    g1.appendChild(svgEl('path', { d: 'M7.1 70.8 A41.5 41.5 0 0 1 2.2 44.7', fill: 'none', stroke: '#70b0ff', 'stroke-width': '.6', 'stroke-linecap': 'round' }));
    var g2 = svgEl('g', { class: 'cc-spin-b' });
    g2.appendChild(svgEl('path', { d: 'M82.5 50 A39.5 39.5 0 0 1 57 86.9', fill: 'none', stroke: '#3a8cff', 'stroke-width': '.7', 'stroke-linecap': 'round', 'stroke-dasharray': '6 2 1 2' }));
    g2.appendChild(svgEl('path', { d: 'M16 21.3 A39.5 39.5 0 0 1 31 12.3', fill: 'none', stroke: '#8ad0ff', 'stroke-width': '.5' }));
    var sweep = svgEl('g', { class: 'cc-sweep' });
    sweep.appendChild(svgEl('path', { d: 'M43 50 L43 16.5 A33.5 33.5 0 0 1 66.7 26.3 Z', fill: 'url(#ccSweepG)', opacity: '.33' }));
    var orbitPath = 'M-2 53 A45 10.5 0 1 0 88 53 A45 10.5 0 1 0 -2 53';
    var orbit = svgEl('g', { transform: 'rotate(-14 43 53)' });
    orbit.appendChild(svgEl('path', { d: 'M-2 53 A45 10.5 0 0 1 88 53', fill: 'none', stroke: '#258cff', 'stroke-opacity': '.35', 'stroke-width': '.4' }));
    orbit.appendChild(svgEl('path', { d: 'M88 53 A45 10.5 0 0 1 -2 53', fill: 'none', stroke: '#308cff', 'stroke-width': '.95', 'stroke-linecap': 'round', class: 'cc-glowline' }));
    orbit.appendChild(svgEl('path', { d: 'M76 59.5 A45 10.5 0 0 1 26 63', fill: 'none', stroke: '#a0d9ff', 'stroke-width': '.35', 'stroke-linecap': 'round', opacity: '.85' }));
    var dot = svgEl('circle', { r: '1.15', fill: '#c8f0ff', class: 'cc-orbit-dot' });
    if (!reduce) {
      var am = svgEl('animateMotion', { dur: '7.5s', repeatCount: 'indefinite', path: orbitPath });
      dot.appendChild(am);
    } else { dot.setAttribute('cx', '88'); dot.setAttribute('cy', '53'); }
    orbit.appendChild(dot);
    svg.appendChild(sweep); svg.appendChild(g1); svg.appendChild(g2); svg.appendChild(orbit);
    [[36.5, '6s', false, '#2c8cff'], [44, '8.5s', true, '#258cff'], [40, '11s', false, '#408cff']].forEach(function (q, i) {
      var r = q[0], g = svgEl('g', {});
      var a0 = -Math.PI / 2, a1 = a0 + 0.9;
      g.appendChild(svgEl('path', { d: 'M' + (43 + Math.cos(a0) * r).toFixed(2) + ' ' + (50 + Math.sin(a0) * r).toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + (43 + Math.cos(a1) * r).toFixed(2) + ' ' + (50 + Math.sin(a1) * r).toFixed(2), fill: 'none', stroke: q[3], 'stroke-width': '.75', 'stroke-linecap': 'round', class: 'cc-glowline cc-comet-tail' }));
      g.appendChild(svgEl('circle', { cx: (43 + Math.cos(a1) * r).toFixed(2), cy: (50 + Math.sin(a1) * r).toFixed(2), r: '.95', fill: '#d0f0ff', class: 'cc-orbit-dot' }));
      if (!reduce) {
        var from = q[2] ? 360 : 0, to = q[2] ? 0 : 360, off = i * 120;
        g.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'rotate', values: (from + off) + ' 43 50;' + (to + off) + ' 43 50', dur: q[1], repeatCount: 'indefinite' }));
      } else g.setAttribute('transform', 'rotate(' + i * 120 + ' 43 50)');
      svg.appendChild(g);
    });
    wrap.appendChild(svg);
  }

  /* Goldenes Kraftfeld (gemeinsames Template für Globus, KI-Ball und Menümitte) */
  var goldSerial = 0;
  function goldField(host, o) {
    o = o || {}; var C = o.C == null ? 50 : o.C, Y = o.Y == null ? 50 : o.Y, R = o.R || 30;
    var id = 'gf' + (++goldSerial), N = o.rays || 44, L0 = o.len0 || 8, L1 = o.len1 || 16, W0 = o.w0 || .45, W1 = o.w1 || .7;
    var S = svgEl('svg', { viewBox: '0 0 100 100', class: 'cc-globe-gold ' + (o.cls || ''), 'aria-hidden': 'true' });
    var d = svgEl('defs', {}); S.appendChild(d);
    function A(tag, at, p) { var e = svgEl(tag, at); (p || S).appendChild(e); return e; }
    var rg = svgEl('linearGradient', { id: id + 'r', x1: '0', y1: '0', x2: '1', y2: '0' });
    [['0', '#fff6e0', '1'], ['.3', '#ffc070', '.8'], ['1', '#ff9a40', '0']].forEach(function (q) { rg.appendChild(svgEl('stop', { offset: q[0], 'stop-color': q[1], 'stop-opacity': q[2] })); });
    d.appendChild(rg);
    var bl = svgEl('filter', { id: id + 'b', x: '-50%', y: '-50%', width: '200%', height: '200%' }); bl.appendChild(svgEl('feGaussianBlur', { stdDeviation: '.6' })); d.appendChild(bl);
    var org = C + 'px ' + Y + 'px';
    if (o.rim) { A('circle', { cx: C, cy: Y, r: R + .3, fill: 'none', stroke: '#ffb060', 'stroke-width': '2.2', opacity: '.55', filter: 'url(#' + id + 'b)', class: 'cc-gold-rim' }); A('circle', { cx: C, cy: Y, r: R + .2, fill: 'none', stroke: '#ffe2b0', 'stroke-width': '.45', opacity: '.8', class: 'cc-gold-rim' }); }
    var rays = A('g', { class: 'cc-gold-rays', style: 'transform-origin:' + org });
    var seed = o.seed || 13; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < N; i++) {
      var a = i / N * 360 + rnd() * 6, len = L0 + rnd() * (L1 - L0), w = W0 + rnd() * (W1 - W0);
      var g = A('g', { transform: 'rotate(' + a.toFixed(1) + ' ' + C + ' ' + Y + ')' }, rays);
      A('rect', { x: C + R - .5, y: Y - w / 2, width: len, height: w, fill: 'url(#' + id + 'r)', class: 'cc-ray cc-ray-' + (i % 5) }, g);
    }
    function arc(r, a0, a1) { var p0 = a0 * Math.PI / 180, p1 = a1 * Math.PI / 180; return 'M' + (C + Math.cos(p0) * r).toFixed(2) + ' ' + (Y + Math.sin(p0) * r).toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + (C + Math.cos(p1) * r).toFixed(2) + ' ' + (Y + Math.sin(p1) * r).toFixed(2); }
    var f1 = A('g', { class: 'cc-gold-spin', style: 'transform-origin:' + org }), f2 = A('g', { class: 'cc-gold-spin cc-gold-rev', style: 'transform-origin:' + org });
    [[1.1, 200, 260, .7], [1.1, 20, 70, .55], [1.2, 110, 150, .5], [1.2, 290, 340, .6], [1.3, 230, 250, .4], [1.3, 60, 85, .35]].forEach(function (q, k) {
      var r = R * q[0], sw = q[3] * (o.arcW || 1);
      A('path', { d: arc(r, q[1], q[2]), fill: 'none', stroke: '#ffc070', 'stroke-width': sw, 'stroke-linecap': 'round', opacity: '.85', filter: 'url(#' + id + 'b)' }, k % 2 ? f2 : f1);
      A('path', { d: arc(r, q[1], q[2]), fill: 'none', stroke: '#fff0d0', 'stroke-width': sw * .35, 'stroke-linecap': 'round' }, k % 2 ? f2 : f1);
    });
    var sp = A('g', {}), NS = Math.round((o.sparks == null ? 36 : o.sparks) * .5);
    for (var j = 0; j < NS; j++) {
      var an = rnd() * 6.283, r0 = R + 1 + rnd() * 3, r1 = R + L0 + rnd() * (L1 - L0 + 4), dur = (3 + rnd() * 4).toFixed(1) + 's', del = (-rnd() * 6).toFixed(1) + 's';
      var c = A('circle', { r: ((.25 + rnd() * .45) * (o.sparkR || 1)).toFixed(2), fill: rnd() < .8 ? '#ffd08a' : '#ffffff', class: 'cc-gold-spark' }, sp);
      if (!reduce) {
        c.appendChild(svgEl('animate', { attributeName: 'cx', values: (C + Math.cos(an) * r0).toFixed(2) + ';' + (C + Math.cos(an) * r1).toFixed(2), dur: dur, begin: del, repeatCount: 'indefinite' }));
        c.appendChild(svgEl('animate', { attributeName: 'cy', values: (Y + Math.sin(an) * r0).toFixed(2) + ';' + (Y + Math.sin(an) * r1).toFixed(2), dur: dur, begin: del, repeatCount: 'indefinite' }));
        c.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;1;0', dur: dur, begin: del, repeatCount: 'indefinite' }));
      } else { c.setAttribute('cx', (C + Math.cos(an) * r1 * .8).toFixed(2)); c.setAttribute('cy', (Y + Math.sin(an) * r1 * .8).toFixed(2)); }
    }
    host.appendChild(S);
    return S;
  }
  function setupGlobeGold() {
    var wrap = doc.querySelector('.v15-globe-wrap'); if (!wrap || wrap.querySelector('.cc-globe-gold')) return;
    goldField(wrap, { C: 43, Y: 50, R: 33.7, sparks: 72, len0: 10, len1: 21, w0: .55, w1: .9 });
  }
  function setupGoldElsewhere() {
    var bot = doc.querySelector('.v15-bot-frame'); if (bot && !bot.querySelector('.cc-globe-gold')) goldField(bot, { R: 18.5, rays: 32, len0: 2.5, len1: 6, w0: .35, w1: .55, sparks: 14, sparkR: .8, arcW: .7, rim: true, cls: 'cc-gold-soft', seed: 21 });
    var chat = doc.getElementById('ccChatBot'); if (chat && !chat.querySelector('.cc-globe-gold')) goldField(chat, { R: 18.5, rays: 32, len0: 2.5, len1: 6, w0: .35, w1: .55, sparks: 14, sparkR: .8, arcW: .7, rim: true, cls: 'cc-gold-soft', seed: 27 });
    var nav = doc.querySelector('#bottomnav .orb'); if (nav && !nav.querySelector('.cc-globe-gold')) goldField(nav, { R: 18.5, rays: 28, len0: 2.5, len1: 6, w0: .45, w1: .7, sparks: 10, sparkR: 1.2, arcW: .9, rim: true, cls: 'cc-gold-nav', seed: 31 });
  }

  function setupAvatar() {
    var av = doc.querySelector('.v11-avatar'); if (!av || av.parentNode.querySelector('.cc-avatar-earth')) return;
    var box = doc.createElement('span'); box.className = 'cc-avatar'; box.setAttribute('aria-hidden', 'true');
    var c = doc.createElement('canvas'); c.className = 'cc-avatar-earth';
    av.parentNode.insertBefore(box, av); box.appendChild(av); box.appendChild(c);
    earths.push(new Earth(c, { step: 4, lon0: 10, tilt: 22, speed: 0.16, dot: 1.25, lights: true }));
  }

  /* KI-Roboter, gezeichnet im Stil des Globus: dunkle Glanzkugel mit Panellinien, glühende Augen,
     Orbitring, HUD-Ringe, Kometen, Funken und optional ein Hologramm-Sockel mit Lichtstrahl. */
  var botSerial = 0;
  function buildBot(host, opt) {
    opt = opt || {};
    var id = 'rb' + (++botSerial), C = 100, Y = 100, R = opt.R || 44, H = opt.pedestal ? 236 : 200;
    var S = svgEl('svg', { viewBox: '0 0 200 ' + H, class: 'cc-rbot', 'aria-hidden': 'true', focusable: 'false' });
    function A(tag, at, parent) { var e = svgEl(tag, at); (parent || S).appendChild(e); return e; }
    function grad(type, gid, at, stops) { var g = svgEl(type, Object.assign({ id: id + gid }, at || {})); stops.forEach(function (q) { g.appendChild(svgEl('stop', { offset: q[0], 'stop-color': q[1], 'stop-opacity': q[2] == null ? '1' : q[2] })); }); d.appendChild(g); }
    function rot(g, from, to, dur) { if (!reduce) g.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'rotate', values: from + ' ' + C + ' ' + Y + ';' + to + ' ' + C + ' ' + Y, dur: dur, repeatCount: 'indefinite' })); return g; }
    function arc(r, a0, a1) { var p0 = a0 * Math.PI / 180, p1 = a1 * Math.PI / 180; return 'M' + (C + Math.cos(p0) * r).toFixed(2) + ' ' + (Y + Math.sin(p0) * r).toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + (C + Math.cos(p1) * r).toFixed(2) + ' ' + (Y + Math.sin(p1) * r).toFixed(2); }
    var d = A('defs', {});
    grad('radialGradient', 'h', { cx: C, cy: Y, r: 98, gradientUnits: 'userSpaceOnUse' }, [['0', '#208cff', '.42'], ['.45', '#0f6ec8', '.2'], ['.75', '#05315a', '.08'], ['1', '#000', '0']]);
    grad('radialGradient', 's', { cx: '.36', cy: '.28', r: '.8' }, [['0', '#26335a'], ['.25', '#0e1324'], ['.6', '#05060b'], ['1', '#000']]);
    grad('linearGradient', 'r', { x1: '0', y1: '0', x2: '1', y2: '1' }, [['0', '#c8f0ff'], ['.3', '#50a0e0'], ['.6', '#1a437a'], ['1', '#3a8cff']]);
    grad('radialGradient', 'p', {}, [['0', '#ffffff'], ['.22', '#d6e6ff'], ['.5', '#2c8cff'], ['.8', '#0a6bc4'], ['1', '#02315a', '0']]);
    grad('linearGradient', 'b', { x1: '0', y1: '0', x2: '0', y2: '1' }, [['0', '#208cff', '0'], ['.5', '#208cff', '.25'], ['1', '#508cff', '.6']]);
    grad('radialGradient', 'f', {}, [['0', '#b0e2ff', '.95'], ['.35', '#208cff', '.7'], ['1', '#108cff', '0']]);
    var cp = svgEl('clipPath', { id: id + 'c' }); cp.appendChild(svgEl('circle', { cx: C, cy: Y, r: R })); d.appendChild(cp);
    var fl = svgEl('filter', { id: id + 'g', x: '-50%', y: '-50%', width: '200%', height: '200%' }); fl.appendChild(svgEl('feGaussianBlur', { stdDeviation: '2.2' })); d.appendChild(fl);
    // Kraftfeld wie beim Globus
    if (opt.field !== false) {
      A('circle', { cx: C, cy: Y, r: 98, fill: 'url(#' + id + 'h)', class: 'cc-field-halo' });
      var tk = ''; for (var a = 0; a < 360; a += 6) { var t = a * Math.PI / 180, r0 = a % 30 ? 86 : 83.5; tk += 'M' + (C + Math.cos(t) * r0).toFixed(1) + ' ' + (Y + Math.sin(t) * r0).toFixed(1) + ' L' + (C + Math.cos(t) * 88.5).toFixed(1) + ' ' + (Y + Math.sin(t) * 88.5).toFixed(1) + ' '; }
      A('path', { d: tk, stroke: '#70b0ff', 'stroke-opacity': '.35', 'stroke-width': '.5', fill: 'none' });
      A('circle', { cx: C, cy: Y, r: 93, fill: 'none', stroke: '#70b0ff', 'stroke-opacity': '.3', 'stroke-width': '1', 'stroke-dasharray': '8 3 1.6 3' }, rot(A('g', {}), 0, 360, '32s'));
      A('circle', { cx: C, cy: Y, r: 76, fill: 'none', stroke: '#2c8cff', 'stroke-opacity': '.35', 'stroke-width': '.8', 'stroke-dasharray': '18 7 4 7' }, rot(A('g', {}), 360, 0, '22s'));
      [[90, 250, 300, '7s', true], [90, 110, 150, '9s', false], [80, 330, 20, '5.5s', true]].forEach(function (q, k) {
        var g = rot(A('g', {}), q[4] ? 0 : 360, q[4] ? 360 : 0, q[3]);
        A('path', { d: arc(q[0], q[1], q[2]), fill: 'none', stroke: k === 1 ? '#70b0ff' : '#258cff', 'stroke-width': k === 1 ? '1.2' : '1.7', 'stroke-linecap': 'round', class: 'cc-glowline' }, g);
        var e = q[2] * Math.PI / 180; A('circle', { cx: (C + Math.cos(e) * q[0]).toFixed(1), cy: (Y + Math.sin(e) * q[0]).toFixed(1), r: '1.8', fill: '#d0f0ff', class: 'cc-orbit-dot' }, g);
      });
      var sp = rot(A('g', {}), 0, 360, '60s'), seed = 5;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      for (var i = 0; i < 24; i++) { var an = rnd() * 6.283, ds = 70 + rnd() * 26; A('circle', { cx: (C + Math.cos(an) * ds).toFixed(1), cy: (Y + Math.sin(an) * ds).toFixed(1), r: (0.6 + rnd() * 1).toFixed(2), fill: rnd() < 0.7 ? '#308cff' : '#7ac2ff', class: 'cc-spark cc-spark-' + (i % 4) }, sp); }
    }
    // Hologramm-Sockel mit Lichtstrahl
    if (opt.pedestal) {
      var py = 212;
      A('rect', { x: C - 16, y: Y + R - 8, width: 32, height: py - (Y + R - 8), fill: 'url(#' + id + 'b)', class: 'cc-beam' });
      A('path', { d: 'M' + C + ' ' + (Y + R) + ' V' + py, stroke: '#a0d0ff', 'stroke-width': '.8', opacity: '.8', class: 'cc-beam' });
      A('ellipse', { cx: C, cy: py + 6, rx: 82, ry: 15, fill: '#030306', stroke: '#16243a', 'stroke-width': '1' });
      A('ellipse', { cx: C, cy: py, rx: 82, ry: 15, fill: '#05060c', stroke: '#50a0e0', 'stroke-width': '1.2' });
      A('ellipse', { cx: C, cy: py, rx: 82, ry: 15, fill: 'none', stroke: '#308cff', 'stroke-width': '4', opacity: '.5', filter: 'url(#' + id + 'g)' });
      A('ellipse', { cx: C, cy: py, rx: 64, ry: 11.5, fill: 'none', stroke: '#258cff', 'stroke-width': '1.6', 'stroke-dasharray': '10 5 3 5', class: 'cc-ped-dash cc-glowline' });
      A('ellipse', { cx: C, cy: py, rx: 46, ry: 8.2, fill: 'none', stroke: '#70b0ff', 'stroke-width': '1', 'stroke-dasharray': '2 2', class: 'cc-ped-dash cc-ped-rev' });
      A('ellipse', { cx: C, cy: py, rx: 30, ry: 5.4, fill: 'url(#' + id + 'f)', class: 'cc-field-halo' });
      var ticks = ''; for (var tx = -70; tx <= 70; tx += 7) ticks += 'M' + (C + tx) + ' ' + (py + 14 + Math.abs(tx) * -0.04) + ' v4 ';
      A('path', { d: ticks, stroke: '#70b0ff', 'stroke-width': '1.2', opacity: '.6' });
      A('path', { d: 'M18 ' + (py - 18) + ' l-7 6 l7 6 M182 ' + (py - 18) + ' l7 6 l-7 6', stroke: '#258cff', 'stroke-width': '2', fill: 'none', class: 'cc-glowline' });
    }
    // Schwebender Kopf
    var fg = A('g', { class: 'cc-rbot-float' });
    var tilt = A('g', { class: 'cc-rbot-tilt', style: 'transform-origin:' + C + 'px ' + Y + 'px' }, fg);
    var orx = R * 1.5, ory = R * 0.3;
    A('path', { d: 'M' + (C - orx) + ' ' + Y + ' A' + orx + ' ' + ory + ' 0 0 1 ' + (C + orx) + ' ' + Y, fill: 'none', stroke: '#308cff', 'stroke-width': '1.6', opacity: '.55', transform: 'rotate(-8 ' + C + ' ' + Y + ')', class: 'cc-glowline' }, tilt);
    A('circle', { cx: C, cy: Y, r: R + 3, fill: '#208cff', opacity: '.35', filter: 'url(#' + id + 'g)' }, tilt);
    A('circle', { cx: C, cy: Y, r: R, fill: 'url(#' + id + 's)' }, tilt);
    var pl = A('g', { 'clip-path': 'url(#' + id + 'c)' }, tilt);
    [0.55, 0].forEach(function (k) { A('ellipse', { cx: C, cy: Y - R * 0.05, rx: R * (0.25 + k), ry: R * 1.02, fill: 'none', stroke: '#508cff', 'stroke-opacity': '.18', 'stroke-width': '.7' }, pl); });
    [-0.62, -0.3, 0.55].forEach(function (k) { A('ellipse', { cx: C, cy: Y + R * k, rx: R, ry: R * 0.22, fill: 'none', stroke: '#508cff', 'stroke-opacity': '.16', 'stroke-width': '.7' }, pl); });
    A('path', { d: 'M' + (C - R) + ' ' + (Y - R * 0.18) + ' Q' + C + ' ' + (Y - R * 0.5) + ' ' + (C + R) + ' ' + (Y - R * 0.18), fill: 'none', stroke: '#000', 'stroke-width': '2.4', opacity: '.8' }, pl);
    A('ellipse', { cx: C, cy: Y + R * 0.08, rx: R * 0.82, ry: R * 0.48, fill: '#010103', opacity: '.88', stroke: '#10284a', 'stroke-width': '1' }, pl);
    A('rect', { x: C - R * 0.16, y: Y - R + 3, width: R * 0.32, height: 3.4, rx: 1.5, fill: '#208cff', class: 'cc-rbot-cap' }, pl);
    A('ellipse', { cx: C - R * 0.36, cy: Y - R * 0.5, rx: R * 0.32, ry: R * 0.14, fill: '#fff', opacity: '.13', transform: 'rotate(-28 ' + (C - R * 0.36) + ' ' + (Y - R * 0.5) + ')' }, pl);
    var eyes = A('g', { class: 'cc-rbot-eyes', style: 'transform-origin:' + C + 'px ' + Y + 'px' }, tilt);
    [-1, 1].forEach(function (sd) {
      var ex = C + sd * R * 0.36;
      A('circle', { cx: ex, cy: Y, r: R * 0.25, fill: '#030b14', stroke: '#208cff', 'stroke-width': '1.3', class: 'cc-glowline' }, eyes);
      A('circle', { cx: ex, cy: Y, r: R * 0.185, fill: 'none', stroke: '#508cff', 'stroke-width': '.6', opacity: '.8' }, eyes);
      var pu = A('g', { class: 'cc-rbot-pupil' }, eyes);
      A('circle', { cx: ex, cy: Y, r: R * 0.2, fill: '#108cff', opacity: '.55', filter: 'url(#' + id + 'g)' }, pu);
      A('circle', { cx: ex, cy: Y, r: R * 0.16, fill: 'url(#' + id + 'p)' }, pu);
    });
    A('path', { d: 'M' + (C - R * 0.08) + ' ' + (Y + R * 0.02) + ' L' + C + ' ' + (Y + R * 0.16) + ' L' + (C + R * 0.08) + ' ' + (Y + R * 0.02), fill: 'none', stroke: '#70c0ff', 'stroke-width': '1.6', 'stroke-linejoin': 'round', class: 'cc-glowline' }, tilt);
    A('circle', { cx: C, cy: Y + R * 0.4, r: '1.8', fill: '#8ad0ff', class: 'cc-rbot-mouth' }, tilt);
    A('circle', { cx: C, cy: Y, r: R, fill: 'none', stroke: '#308cff', 'stroke-width': '4', opacity: '.45', filter: 'url(#' + id + 'g)' }, tilt);
    A('circle', { cx: C, cy: Y, r: R, fill: 'none', stroke: 'url(#' + id + 'r)', 'stroke-width': '1.6' }, tilt);
    A('path', { d: 'M' + (C + orx) + ' ' + Y + ' A' + orx + ' ' + ory + ' 0 0 1 ' + (C - orx) + ' ' + Y, fill: 'none', stroke: '#70b0ff', 'stroke-width': '2', transform: 'rotate(-8 ' + C + ' ' + Y + ')', class: 'cc-glowline' }, tilt);
    host.appendChild(S);
    host.classList.add('cc-rbot-host');
    botLife(host);
    return S;
  }
  // Blinzeln und Umherschauen, je Roboter unregelmäßig
  function botLife(host) {
    if (reduce) return;
    var looks = [[0, 0], [-1, 0], [1, 0], [-0.7, -0.6], [0.7, -0.6], [0.5, 0.5], [-0.5, 0.4], [0, -0.8]];
    (function look() {
      var tg = Math.random() < 0.35 ? looks[0] : looks[1 + Math.floor(Math.random() * 7)];
      host.style.setProperty('--gx', tg[0]); host.style.setProperty('--gy', tg[1]);
      setTimeout(look, 1300 + Math.random() * 2600);
    })();
    (function blink() {
      if (!doc.hidden) {
        host.classList.add('cc-blinking'); setTimeout(function () { host.classList.remove('cc-blinking'); }, 150);
        if (Math.random() < 0.25) setTimeout(function () { host.classList.add('cc-blinking'); setTimeout(function () { host.classList.remove('cc-blinking'); }, 140); }, 330);
      }
      setTimeout(blink, 2200 + Math.random() * 4200);
    })();
  }
  doc.addEventListener('rv:ai-state', function (e) {
    var st = e && e.detail && e.detail.state;
    Array.prototype.forEach.call(doc.querySelectorAll('.cc-rbot-host'), function (h) { h.classList.toggle('cc-busy', st === 'busy'); });
  });

  /* Angeklickte Knöpfe leuchten kurz orange (nicht im Menü unten) */
  function setupPress() {
    if (doc.documentElement.dataset.ccPress) return; doc.documentElement.dataset.ccPress = '1';
    doc.addEventListener('pointerdown', function (e) {
      var b = e.target.closest && e.target.closest('button, .v11-card, [role="button"]');
      if (!b || b.closest('#bottomnav')) return;
      if (!b.closest('#v11Root, #ccChat')) return;
      b.classList.remove('cc-pressed'); void b.offsetWidth; b.classList.add('cc-pressed');
      clearTimeout(b._ccp); b._ccp = setTimeout(function () { b.classList.remove('cc-pressed'); }, 900);
    }, true);
  }

  /* Menü: rotes Aufleuchten beim Antippen */
  function setupNavTap() {
    var nav = doc.getElementById('bottomnav'); if (!nav || nav.dataset.ccTap) return; nav.dataset.ccTap = '1';
    nav.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      b.classList.remove('cc-tap'); void b.offsetWidth; b.classList.add('cc-tap');
      setTimeout(function () { b.classList.remove('cc-tap'); }, 650);
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
    var els = doc.querySelectorAll('#ccChatIns .v11-card, #v11Root .v11-panel, #v11Root .v11-tile, #v11Root .v11-q, #v11Root .v11-card, #v11Root .v11-pill, #v11Root .v11-m, #v11Root .v11-s2, #v11Root .v11-cat, #v11Root .v11-prompts button, #v11Root .v11-bell, #ccChat .cc-q, #ccChat .chat-chip, #ccChat .cc-side');
    Array.prototype.forEach.call(els, function (el, i) {
      if (el.querySelector(':scope > .cc-glint')) return;
      var g = doc.createElement('i'); g.className = 'cc-glint'; g.setAttribute('aria-hidden', 'true');
      g.style.setProperty('--d', (-(i * 1.37) % 9).toFixed(2) + 's');
      el.appendChild(g);
      if (!el.classList.contains('v11-panel') && !el.classList.contains('v11-cat') && !el.classList.contains('cc-side')) { var sh = doc.createElement('i'); sh.className = 'cc-sheen'; sh.setAttribute('aria-hidden', 'true'); sh.style.setProperty('--d', g.style.getPropertyValue('--d')); el.appendChild(sh); }
    });
  }

  /* Energieball wie in der Vorlage: dunkler Kern, umkreist von leuchtenden Lichtbändern in Blau und Orange */
  var orbSerial = 0;
  function buildOrb(host, opt) {
    opt = opt || {};
    var id = 'eo' + (++orbSerial), C = 100, Y = 100, R = opt.R || 40, H = opt.pedestal ? 236 : 200;
    var S = svgEl('svg', { viewBox: '0 0 200 ' + H, class: 'cc-orb', 'aria-hidden': 'true', focusable: 'false' });
    var d = svgEl('defs', {}); S.appendChild(d);
    function A(tag, at, p) { var e = svgEl(tag, at); (p || S).appendChild(e); return e; }
    function grad(type, gid, at, stops) { var g = svgEl(type, Object.assign({ id: id + gid }, at || {})); stops.forEach(function (q) { g.appendChild(svgEl('stop', { offset: q[0], 'stop-color': q[1], 'stop-opacity': q[2] == null ? '1' : q[2] })); }); d.appendChild(g); }
    function blur(fid, sd) { var f = svgEl('filter', { id: id + fid, x: '-60%', y: '-60%', width: '220%', height: '220%' }); f.appendChild(svgEl('feGaussianBlur', { stdDeviation: sd })); d.appendChild(f); }
    grad('radialGradient', 'h', { cx: C, cy: Y, r: 98, gradientUnits: 'userSpaceOnUse' }, [['0', '#3d9bff', '.45'], ['.4', '#1f5fd0', '.18'], ['1', '#000', '0']]);
    grad('radialGradient', 'k', { cx: '.42', cy: '.36', r: '.75' }, [['0', '#1c2c52'], ['.55', '#070d1c'], ['1', '#010309']]);
    grad('linearGradient', 'wb', { x1: '0', y1: '0', x2: '1', y2: '0' }, [['0', '#3d9bff', '0'], ['.35', '#5fb4ff'], ['.55', '#ffffff'], ['.8', '#9fd2ff'], ['1', '#3d9bff', '0']]);
    grad('linearGradient', 'wo', { x1: '0', y1: '0', x2: '1', y2: '0' }, [['0', '#ff9a40', '0'], ['.35', '#ffb066'], ['.55', '#fff2dc'], ['.8', '#ffc58a'], ['1', '#ff9a40', '0']]);
    blur('g', '2.6'); blur('G', '7');
    A('circle', { cx: C, cy: Y, r: 98, fill: 'url(#' + id + 'h)', class: 'cc-field-halo' });
    if (opt.pedestal) {
      var py = 212;
      grad('linearGradient', 'b', { x1: '0', y1: '0', x2: '0', y2: '1' }, [['0', '#3d9bff', '0'], ['.6', '#3d9bff', '.25'], ['1', '#9fd2ff', '.65']]);
      A('rect', { x: C - 14, y: Y + R, width: 28, height: py - Y - R, fill: 'url(#' + id + 'b)', class: 'cc-beam' });
      A('ellipse', { cx: C, cy: py + 5, rx: 80, ry: 14, fill: '#030814', stroke: '#1d3460', 'stroke-width': '1' });
      A('ellipse', { cx: C, cy: py, rx: 80, ry: 14, fill: '#06122a', stroke: '#7cc4ff', 'stroke-width': '1.1' });
      A('ellipse', { cx: C, cy: py, rx: 80, ry: 14, fill: 'none', stroke: '#3d9bff', 'stroke-width': '4', opacity: '.6', filter: 'url(#' + id + 'g)' });
      A('ellipse', { cx: C, cy: py, rx: 62, ry: 10.8, fill: 'none', stroke: '#5fb4ff', 'stroke-width': '1.5', 'stroke-dasharray': '10 5 3 5', class: 'cc-ped-dash' });
      A('ellipse', { cx: C, cy: py, rx: 44, ry: 7.6, fill: 'none', stroke: '#ffb066', 'stroke-width': '1', 'stroke-dasharray': '2 2', class: 'cc-ped-dash cc-ped-rev' });
      A('ellipse', { cx: C, cy: py, rx: 28, ry: 5, fill: '#9fd2ff', opacity: '.55', filter: 'url(#' + id + 'g)', class: 'cc-field-halo' });
    }
    var body = A('g', { class: 'cc-orb-float' });
    A('circle', { cx: C, cy: Y, r: R * 1.25, fill: '#3d9bff', opacity: '.35', filter: 'url(#' + id + 'G)', class: 'cc-orb-pulse' }, body);
    A('circle', { cx: C, cy: Y, r: R, fill: 'url(#' + id + 'k)' }, body);
    A('circle', { cx: C, cy: Y, r: R, fill: 'none', stroke: '#7cc4ff', 'stroke-width': '1', opacity: '.6' }, body);
    // Lichtbänder: gekippte Ellipsen, die sich mit unterschiedlichem Tempo drehen
    var bands = [[1.36, .42, -18, '9s', 'wb', 1, 3.4], [1.24, .62, 34, '7s', 'wo', -1, 2.8], [1.46, .3, 70, '12s', 'wb', 1, 2.2],
                 [1.16, .8, -55, '6s', 'wb', -1, 2.4], [1.3, .5, 110, '10s', 'wo', 1, 2], [1.08, .95, 15, '14s', 'wb', -1, 1.6],
                 [1.5, .22, -40, '8s', 'wo', -1, 1.6], [1.2, .7, 150, '11s', 'wb', 1, 1.8], [1.1, .4, 85, '5.5s', 'wb', -1, 2.6]];
    bands.forEach(function (b, i) {
      var g = A('g', {}, body);
      if (!reduce) g.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'rotate', values: (b[5] > 0 ? '0 ' : '360 ') + C + ' ' + Y + ';' + (b[5] > 0 ? '360 ' : '0 ') + C + ' ' + Y, dur: b[3], repeatCount: 'indefinite' }));
      var tr = 'rotate(' + b[2] + ' ' + C + ' ' + Y + ')';
      A('ellipse', { cx: C, cy: Y, rx: R * b[0], ry: R * b[1], fill: 'none', stroke: b[4] === 'wo' ? '#ff9a40' : '#3d9bff', 'stroke-width': b[6] * 3, opacity: '.6', filter: 'url(#' + id + 'g)', transform: tr, pathLength: '100', 'stroke-dasharray': '58 42', 'stroke-linecap': 'round' }, g);
      A('ellipse', { cx: C, cy: Y, rx: R * b[0], ry: R * b[1], fill: 'none', stroke: 'url(#' + id + b[4] + ')', 'stroke-width': b[6], transform: tr, pathLength: '100', 'stroke-dasharray': '58 42', 'stroke-linecap': 'round' }, g);
      A('ellipse', { cx: C, cy: Y, rx: R * b[0], ry: R * b[1], fill: 'none', stroke: b[4] === 'wo' ? '#ffd2a0' : '#bfe3ff', 'stroke-width': '.4', opacity: '.35', transform: tr }, g);
    });
    var sp = A('g', {}, body), seed = 9;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    if (!reduce) sp.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'rotate', values: '0 ' + C + ' ' + Y + ';360 ' + C + ' ' + Y, dur: '40s', repeatCount: 'indefinite' }));
    for (var i = 0; i < 22; i++) { var an = rnd() * 6.283, ds = R * (1.1 + rnd() * 0.9); A('circle', { cx: (C + Math.cos(an) * ds).toFixed(1), cy: (Y + Math.sin(an) * ds * 0.8).toFixed(1), r: (0.5 + rnd() * 1.1).toFixed(2), fill: rnd() < 0.65 ? '#bfe3ff' : '#ffc58a', class: 'cc-spark cc-spark-' + (i % 4) }, sp); }
    A('ellipse', { cx: C - R * 0.32, cy: Y - R * 0.42, rx: R * 0.3, ry: R * 0.12, fill: '#fff', opacity: '.14', transform: 'rotate(-30 ' + (C - R * 0.32) + ' ' + (Y - R * 0.42) + ')' }, body);
    host.appendChild(S); host.classList.add('cc-orb-host');
    return S;
  }

  /* Menümitte wie in der Vorlage: Glaskugel, leuchtender Ring, Pfeil, Lichtstrahl */
  function buildNavOrb(host) {
    var id = 'no' + (++orbSerial), S = svgEl('svg', { viewBox: '0 0 100 100', class: 'cc-navorb', 'aria-hidden': 'true' });
    var d = svgEl('defs', {}); S.appendChild(d);
    function A(tag, at, p) { var e = svgEl(tag, at); (p || S).appendChild(e); return e; }
    function grad(type, gid, at, stops) { var g = svgEl(type, Object.assign({ id: id + gid }, at || {})); stops.forEach(function (q) { g.appendChild(svgEl('stop', { offset: q[0], 'stop-color': q[1], 'stop-opacity': q[2] == null ? '1' : q[2] })); }); d.appendChild(g); }
    function blur(fid, sd) { var f = svgEl('filter', { id: id + fid, x: '-80%', y: '-80%', width: '260%', height: '260%' }); f.appendChild(svgEl('feGaussianBlur', { stdDeviation: sd })); d.appendChild(f); }
    blur('g', '1.6'); blur('G', '4');
    grad('radialGradient', 'k', { cx: '.45', cy: '.42', r: '.6' }, [['0', '#1a2650'], ['.6', '#0a1030'], ['.92', '#141c4a'], ['1', '#2a3a90']]);
    grad('linearGradient', 'v', { x1: '0', y1: '0', x2: '0', y2: '1' }, [['0', '#9ab8ff', '0'], ['.5', '#e8f0ff', '1'], ['1', '#9ab8ff', '0']]);
    // Lichtstrahl senkrecht
    A('rect', { x: 49.4, y: -14, width: 1.2, height: 128, fill: 'url(#' + id + 'v)', opacity: '.85' });
    A('rect', { x: 48, y: -14, width: 4, height: 128, fill: 'url(#' + id + 'v)', opacity: '.35', filter: 'url(#' + id + 'g)' });
    // Kugel
    A('circle', { cx: 50, cy: 50, r: 33, fill: 'url(#' + id + 'k)' });
    A('path', { d: 'M26 40 A26 26 0 0 1 58 24', fill: 'none', stroke: '#ffffff', 'stroke-width': '2.2', 'stroke-linecap': 'round', opacity: '.55', filter: 'url(#' + id + 'g)' });
    A('path', { d: 'M28 38 A24 24 0 0 1 52 26', fill: 'none', stroke: '#ffffff', 'stroke-width': '.8', 'stroke-linecap': 'round', opacity: '.7' });
    [[73, 30, '#ffb070'], [76, 62, '#ffb070'], [30, 70, '#9ab8ff'], [68, 76, '#ffffff'], [22, 52, '#9ab8ff']].forEach(function (q) { A('circle', { cx: q[0], cy: q[1], r: '.9', fill: q[2], opacity: '.8' }); });
    // Leuchtring
    A('circle', { cx: 50, cy: 50, r: 34.5, fill: 'none', stroke: '#5a72ff', 'stroke-width': '6', opacity: '.75', filter: 'url(#' + id + 'G)', class: 'cc-orb-pulse' });
    A('circle', { cx: 50, cy: 50, r: 34.5, fill: 'none', stroke: '#8ea6ff', 'stroke-width': '2.4', filter: 'url(#' + id + 'g)' });
    A('circle', { cx: 50, cy: 50, r: 34.5, fill: 'none', stroke: '#eef3ff', 'stroke-width': '.9' });
    // Pfeil
    var arrow = 'M34 38 L50 45 L66 38 L50 66 Z';
    A('path', { d: arrow, fill: 'none', stroke: '#2fc8ff', 'stroke-width': '4', 'stroke-linejoin': 'round', opacity: '.8', filter: 'url(#' + id + 'g)' });
    A('path', { d: arrow, fill: 'rgba(40,190,255,.08)', stroke: '#7fe2ff', 'stroke-width': '1.8', 'stroke-linejoin': 'round' });
    // Funkeln oben/unten am Strahl
    [[50, 15.5], [50, 84.5]].forEach(function (q) { A('path', { d: 'M' + q[0] + ' ' + (q[1] - 3) + ' Q' + q[0] + ' ' + q[1] + ' ' + (q[0] + 3) + ' ' + q[1] + ' Q' + q[0] + ' ' + q[1] + ' ' + q[0] + ' ' + (q[1] + 3) + ' Q' + q[0] + ' ' + q[1] + ' ' + (q[0] - 3) + ' ' + q[1] + ' Q' + q[0] + ' ' + q[1] + ' ' + q[0] + ' ' + (q[1] - 3) + 'Z', fill: '#ffffff', class: 'cc-spark' }); });
    host.appendChild(S);
    return S;
  }

  /* Plasma-Energieball wie in der Vorlage: seidige, gewellte Lichtbänder aus vielen feinen
     Fäden um einen dunklen Kern, additiv leuchtend, mit Funken. Gezeichnet auf Canvas. */
  var plasmas = [];
  function Plasma(canvas, opt) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.size = 0; opt = opt || {};
    this.scale = opt.scale || 1;
    var seed = opt.seed || 3; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var bands = [];
    for (var i = 0; i < 6; i++) {
      bands.push({
        ax: (rnd() - .5) * 2.6, ay: (rnd() - .5) * 2.6, az: rnd() * 6.283,
        sx: 0.15 + rnd() * .25, sy: 0.15 + rnd() * .25, sz: (rnd() < .5 ? -1 : 1) * (0.12 + rnd() * .2),
        r: 0.27 + rnd() * 0.08, lobes: 2 + Math.floor(rnd() * 2), amp: 0.05 + rnd() * 0.06, ph: rnd() * 6.283,
        warm: i % 3 === 1, strands: 7, spread: 0.008 + rnd() * 0.007, tw: 0.4 + rnd() * 0.8
      });
    }
    this.bands = bands;
    var parts = [];
    for (var j = 0; j < 34; j++) parts.push({ a: rnd() * 6.283, b: rnd() * 6.283, r: 0.16 + rnd() * 0.32, sp: (rnd() - .5) * .6, s: 0.4 + rnd() * 1.2, ph: rnd() * 6.283 });
    this.parts = parts;
  }
  Plasma.prototype.resize = function () {
    if (!this.c.offsetParent) return false;
    var r = this.c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    if (r.bottom < 0 || r.top > window.innerHeight) return false;
    var s = Math.max(40, Math.round(Math.max(r.width, r.height) * dpr));
    if (s !== this.size) { this.size = s; this.c.width = s; this.c.height = s; }
    return true;
  };
  Plasma.prototype.draw = function (t) {
    var ctx = this.ctx, s = this.size, cx = s / 2, cy = s / 2, k = this.scale;
    ctx.clearRect(0, 0, s, s);
    // Schein hinter dem Ball
    var h = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * .5);
    h.addColorStop(0, 'rgba(50,110,230,.38)'); h.addColorStop(.42, 'rgba(40,90,210,.22)'); h.addColorStop(1, 'rgba(10,20,60,0)');
    ctx.fillStyle = h; ctx.fillRect(0, 0, s, s);
    var core = s * .18 * k;
    function rot(p, ax, ay, az) {
      var x = p[0], y = p[1], z = p[2], c, sn, t1;
      c = Math.cos(ax); sn = Math.sin(ax); t1 = y * c - z * sn; z = y * sn + z * c; y = t1;
      c = Math.cos(ay); sn = Math.sin(ay); t1 = x * c + z * sn; z = -x * sn + z * c; x = t1;
      c = Math.cos(az); sn = Math.sin(az); t1 = x * c - y * sn; y = x * sn + y * c; x = t1;
      return [x, y, z];
    }
    var N = 56, self = this;
    function pass(front) {
      ctx.globalCompositeOperation = 'lighter';
      for (var b = 0; b < self.bands.length; b++) {
        var B = self.bands[b], ax = B.ax + .35 * Math.sin(t * B.sx + B.ph), ay = B.ay + .35 * Math.cos(t * B.sy + B.ph), az = B.az + t * B.sz;
        for (var st = 0; st < B.strands; st++) {
          var off = (st - (B.strands - 1) / 2) * B.spread, edge = 1 - Math.abs(st - (B.strands - 1) / 2) / ((B.strands - 1) / 2 + .5);
          ctx.beginPath(); var on = false;
          for (var i = 0; i <= N; i++) {
            var th = i / N * 6.283;
            var twist = .25 + .75 * Math.abs(Math.sin(th * 1.5 + B.ph + t * .3));
            var rr = (B.r + off * twist + B.amp * Math.sin(B.lobes * th + B.ph + t * B.tw)) * k;
            var p = rot([Math.cos(th) * rr, Math.sin(th) * rr, Math.sin(2 * th + B.ph) * B.amp * .8 * k], ax, ay, az);
            var vis = front ? p[2] >= -0.02 : p[2] < 0.02;
            if (!vis) { on = false; continue; }
            var X = cx + p[0] * s, Y = cy + p[1] * s;
            if (!on) { ctx.moveTo(X, Y); on = true; } else ctx.lineTo(X, Y);
          }
          var mid = st === (B.strands - 1) / 2;
          if (mid) { ctx.lineWidth = s / 30; ctx.strokeStyle = B.warm ? 'rgba(255,170,110,' + (front ? .1 : .04) + ')' : 'rgba(70,140,255,' + (front ? .13 : .05) + ')'; ctx.stroke(); }
          var a = (front ? .75 : .22) * (.25 + .75 * edge * edge);
          ctx.lineWidth = Math.max(.5, s / 600) * (mid ? 1.8 : 1);
          ctx.strokeStyle = mid ? (B.warm ? 'rgba(255,240,220,' + a + ')' : 'rgba(235,245,255,' + a + ')') : B.warm ? 'rgba(255,180,120,' + a + ')' : (st % 3 === 0 ? 'rgba(190,220,255,' + a + ')' : 'rgba(90,160,255,' + a + ')');
          ctx.stroke();
        }
      }
      // weicher Schleier über die Bänder
      ctx.globalCompositeOperation = 'source-over';
    }
    pass(false);
    // Kern
    var g = ctx.createRadialGradient(cx - core * .3, cy - core * .35, core * .1, cx, cy, core);
    g.addColorStop(0, '#16223f'); g.addColorStop(.6, '#070c1c'); g.addColorStop(1, '#03060f');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, core, 0, 6.283); ctx.fill();
    ctx.save(); ctx.shadowColor = 'rgba(90,160,255,.9)'; ctx.shadowBlur = s / 25;
    ctx.strokeStyle = 'rgba(120,180,255,.45)'; ctx.lineWidth = Math.max(1, s / 300);
    ctx.beginPath(); ctx.arc(cx, cy, core, 0, 6.283); ctx.stroke(); ctx.restore();
    ctx.fillStyle = 'rgba(160,200,255,.07)'; ctx.beginPath(); ctx.ellipse(cx - core * .35, cy - core * .45, core * .45, core * .2, -.5, 0, 6.283); ctx.fill();
    pass(true);
    // Leuchtpunkte und Funken
    ctx.globalCompositeOperation = 'lighter';
    if (!SPRITE_RED) { SPRITE_RED = glowSprite('255,150,60'); SPRITE_GOLD = glowSprite('255,215,150'); }
    if (!this.blue) this.blue = glowSprite('110,180,255');
    for (var q = 0; q < this.parts.length; q++) {
      var P = this.parts[q], a2 = P.a + t * P.sp, rr2 = P.r * k;
      var px = cx + Math.cos(a2) * Math.cos(P.b) * rr2 * s, py = cy + Math.sin(a2) * rr2 * s * .95;
      var tw = .3 + .7 * Math.max(0, Math.sin(t * 2 * P.s + P.ph));
      ctx.globalAlpha = tw * .9; var sz = s * .025 * P.s;
      ctx.drawImage(q % 7 === 0 ? SPRITE_GOLD : this.blue, px - sz / 2, py - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    [[.27, -.2, 2.1], [-.3, .18, 1.6], [.05, .36, 2.6]].forEach(function (f, i) {
      var tw2 = .5 + .5 * Math.sin(t * f[2] + i), L = s * .09 * tw2;
      ctx.globalAlpha = tw2; ctx.drawImage(self.blue, cx + f[0] * s * k - L / 2, cy + f[1] * s * k - L / 2, L, L);
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };
  function plasmaInto(host, opt) {
    var c = doc.createElement('canvas'); c.className = 'cc-plasma'; c.setAttribute('aria-hidden', 'true');
    host.appendChild(c); host.classList.add('cc-orb-host');
    var p = new Plasma(c, opt); plasmas.push(p); return p;
  }

  function setupRobot() {
    var f = doc.querySelector('.v15-bot-frame'); if (!f || f.querySelector('.cc-orb')) return;
    Array.prototype.slice.call(f.children).forEach(function (c) { c.remove(); });
    plasmaInto(f, { seed: 3 });
    var chat = doc.getElementById('ccChatBot'); if (chat && !chat.querySelector('.cc-orb')) { chat.innerHTML = ''; buildOrb(chat, { R: 54, pedestal: true }); plasmaInto(chat, { seed: 7 }); }
    var av = doc.getElementById('ccChatAvatar'); if (av && !av.querySelector('.cc-plasma')) { av.innerHTML = ''; plasmaInto(av, { seed: 11 }); }
  }
  doc.addEventListener('rv:ai-state', function (e) {
    var st = e && e.detail && e.detail.state;
    Array.prototype.forEach.call(doc.querySelectorAll('.cc-orb-host'), function (h) { h.classList.toggle('cc-busy', st === 'busy'); });
  });

  function setupNavCore() {
    var btn = doc.querySelector('#bottomnav .orb'); if (!btn || btn.querySelector('.cc-navorb')) return;
    btn.innerHTML = ''; var pl = plasmaInto(btn, { seed: 19, scale: 1 }); pl.c.classList.add('cc-nav-plasma'); buildNavOrb(btn);
  }

  /* Farbige Lichter hinter dem Glas: weiche, langsam treibende Lichtflecken */
  var embers = null;
  function setupEmbers() {
    if (doc.querySelector('.cc-bokeh')) return;
    var c = doc.createElement('canvas'); c.className = 'cc-bokeh'; c.setAttribute('aria-hidden', 'true');
    doc.body.insertBefore(c, doc.body.firstChild);
    var ctx = c.getContext('2d'), list = [];
    function size() { c.width = Math.round(innerWidth * 0.5); c.height = Math.round(innerHeight * 0.5); }
    size(); window.addEventListener('resize', size);
    var cols = ['255,170,110', '255,200,150', '110,160,255', '255,150,90', '200,215,235', '255,185,130'];
    for (var i = 0; i < 18; i++) list.push({ x: Math.random() < .5 ? Math.random() * .16 : .84 + Math.random() * .16, y: Math.random(), r: 0.08 + Math.random() * 0.18, a: 0.16 + Math.random() * 0.2, vx: (Math.random() - .5) * 0.0015, vy: (Math.random() - .5) * 0.004, ph: Math.random() * 6.28, c: cols[i % cols.length] });
    for (var j = 0; j < 26; j++) list.push({ x: Math.random(), y: Math.random(), r: 0.006 + Math.random() * 0.012, a: 0.35 + Math.random() * 0.4, vx: (Math.random() - .5) * 0.01, vy: -0.004 - Math.random() * 0.01, ph: Math.random() * 6.28, c: Math.random() < .7 ? '150,205,255' : '255,190,120', dot: true });
    embers = function (t, dt) {
      var w = c.width, h = c.height, m = Math.max(w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < -0.2) p.x = 1.2; if (p.x > 1.2) p.x = -0.2; if (p.y < -0.2) p.y = 1.2; if (p.y > 1.2) p.y = -0.2;
        var a = p.a * (0.7 + 0.3 * Math.sin(t * 0.7 + p.ph)), x = p.x * w, y = p.y * h, r = p.r * m;
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(' + p.c + ',' + a + ')'); g.addColorStop(p.dot ? 0.35 : 0.5, 'rgba(' + p.c + ',' + (a * (p.dot ? 0.5 : 0.35)) + ')'); g.addColorStop(1, 'rgba(' + p.c + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    if (reduce) embers(0, 0);
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
  var start = performance.now(), lastFrame = 0, lastT = 0, frames = 0, lite = false, tick = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var hv = homeVisible(), ch = doc.getElementById('aiChat'), cv = !!ch && !ch.classList.contains('hidden');
    if (doc.hidden || !(hv || cv)) return;
    if (now - lastFrame < 33) return;
    lastFrame = now;
    var t = (now - start) / 1000, dt = Math.min(0.1, t - lastT); lastT = t;
    // Sparmodus: wenn das Gerät dauerhaft unter ~15 Bildern/s bleibt, teure Effekte abschalten
    if (!lite) { frames++; if (t > 3 && t < 9 && frames / t < 12) { lite = true; root.classList.add('cc-lite'); Array.prototype.forEach.call(doc.querySelectorAll('svg'), function (v) { if (v.pauseAnimations && !v.closest('#bottomnav, .v15-globe-wrap')) v.pauseAnimations(); }); } }
    if (lite && (frames++ % 2)) return;
    tick++;
    if (hv && tick % 2 === 0) for (var i = 0; i < earths.length; i++) { if (earths[i].resize()) earths[i].draw(t); }
    if (embers) embers(t, dt);
    if (tick % 2 === 1) for (var pi = 0; pi < plasmas.length; pi++) { if (plasmas[pi].resize()) plasmas[pi].draw(t); }
  }
  function drawStatic() { for (var i = 0; i < earths.length; i++) { if (earths[i].resize()) earths[i].draw(0); } for (var j = 0; j < plasmas.length; j++) { if (plasmas[j].resize()) plasmas[j].draw(2); } }

  function init() {
    setupGlobe(); setupGlobeGold(); setupAvatar(); setupRobot(); setupNavCore(); setupNavTap(); setupPress(); setupGoldElsewhere(); setupFills(); setupGlints(); if (window.MutationObserver) { var ins = doc.getElementById('v11-insights'); if (ins) new MutationObserver(setupGlints).observe(ins, { childList: true }); var ci = doc.getElementById('ccChatIns'); if (ci) new MutationObserver(setupGlints).observe(ci, { childList: true }); } setupEmbers(); setupCounters();
    doc.documentElement.classList.add('cc-fx');
    if (reduce) { drawStatic(); window.addEventListener('resize', drawStatic); var nh = doc.getElementById('navHome'); if (nh) nh.addEventListener('click', function () { setTimeout(drawStatic, 60); }); }
    else requestAnimationFrame(frame);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
