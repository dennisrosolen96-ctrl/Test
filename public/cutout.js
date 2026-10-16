/* RV Studio – Freisteller und Titelbild.
   Auf dem Gerät: Hintergrund wird über die Bildränder gelernt (Farbgruppen im Lab-Raum),
   von außen nach innen geflutet, bereinigt und weich ausgeblendet. Kein Upload, kein Modell-Download.
   Optional liefert der KI-Server (/api/cutout) ein bereits freigestelltes PNG; dann wird nur noch komponiert. */
(function () {
  'use strict';
  var BACKDROPS = {
    sand: ['#ece7df', '#d9d1c4', 'Sand'], nebel: ['#e6e9ee', '#cdd3dc', 'Nebel'], leinen: ['#e9e3dc', '#d6cbbd', 'Leinen'],
    salbei: ['#e3e8e4', '#c9d2cb', 'Salbei'], rose: ['#efe9e6', '#dacfca', 'Rosé'], stein: ['#e4e6ea', '#c6cbd3', 'Stein'],
    weiss: ['#fbfbfa', '#ecebe8', 'Weiß'], nacht: ['#2b3446', '#141a26', 'Nacht']
  };

  var STYLES = { studio: 'Studio', app: 'App-Look', sticker: 'Sticker' };

  function loadImage(src) {
    return new Promise(function (ok, no) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = no; im.src = src; });
  }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* sRGB -> Lab */
  function lin(v) { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; }
  var LUT = new Float32Array(256); for (var i = 0; i < 256; i++) LUT[i] = lin(i);
  function f(t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; }
  function toLab(data, n) {
    var L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n);
    for (var i = 0, j = 0; i < n; i++, j += 4) {
      var r = LUT[data[j]], g = LUT[data[j + 1]], b = LUT[data[j + 2]];
      var x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047), y = f(r * 0.2126 + g * 0.7152 + b * 0.0722), z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
      L[i] = 116 * y - 16; A[i] = 500 * (x - y); B[i] = 200 * (y - z);
    }
    return [L, A, B];
  }
  // Helligkeit zählt weniger: Schatten und Lichtverlauf auf dem Untergrund sollen nicht als Motiv gelten.
  function dist(L1, a1, b1, L2, a2, b2) { var dl = (L1 - L2) * 0.55, da = a1 - a2, db = b1 - b2; return Math.sqrt(dl * dl + da * da + db * db); }

  function kmeans(pts, k) {
    var n = pts.length, cs = [], i, it;
    pts.sort(function (p, q) { return p[0] - q[0]; });
    for (i = 0; i < k; i++) cs.push(pts[Math.min(n - 1, Math.floor((i + 0.5) * n / k))].slice());
    var asg = new Int32Array(n);
    for (it = 0; it < 10; it++) {
      var sum = cs.map(function () { return [0, 0, 0, 0]; });
      for (i = 0; i < n; i++) {
        var p = pts[i], best = 0, bd = 1e9;
        for (var c = 0; c < k; c++) { var d = dist(p[0], p[1], p[2], cs[c][0], cs[c][1], cs[c][2]); if (d < bd) { bd = d; best = c; } }
        asg[i] = best; var s = sum[best]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
      }
      for (c = 0; c < k; c++) if (sum[c][3]) cs[c] = [sum[c][0] / sum[c][3], sum[c][1] / sum[c][3], sum[c][2] / sum[c][3]];
    }
    var counts = new Array(k).fill(0), spread = new Array(k).fill(0);
    for (i = 0; i < n; i++) { counts[asg[i]]++; var q = pts[i], cc = cs[asg[i]]; spread[asg[i]] += dist(q[0], q[1], q[2], cc[0], cc[1], cc[2]); }
    return cs.map(function (c, j) { return { c: c, share: counts[j] / n, spread: counts[j] ? spread[j] / counts[j] : 0 }; });
  }

  // Zusammenhängende Flächen markieren; liefert Label-Array und Flächengrößen.
  function components(mask, W, H, value) {
    var lab = new Int32Array(W * H).fill(-1), sizes = [], touches = [], stack = new Int32Array(W * H);
    for (var s = 0; s < W * H; s++) {
      if (mask[s] !== value || lab[s] !== -1) continue;
      var id = sizes.length, top = 0, size = 0, border = false; stack[top++] = s; lab[s] = id;
      while (top) {
        var p = stack[--top], x = p % W, y = (p - x) / W; size++;
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
        if (x > 0 && mask[p - 1] === value && lab[p - 1] === -1) { lab[p - 1] = id; stack[top++] = p - 1; }
        if (x < W - 1 && mask[p + 1] === value && lab[p + 1] === -1) { lab[p + 1] = id; stack[top++] = p + 1; }
        if (y > 0 && mask[p - W] === value && lab[p - W] === -1) { lab[p - W] = id; stack[top++] = p - W; }
        if (y < H - 1 && mask[p + W] === value && lab[p + W] === -1) { lab[p + W] = id; stack[top++] = p + W; }
      }
      sizes.push(size); touches.push(border);
    }
    return { lab: lab, sizes: sizes, touches: touches };
  }
  function morph(mask, W, H, grow) {
    var out = new Uint8Array(mask);
    for (var y = 1; y < H - 1; y++) for (var x = 1; x < W - 1; x++) {
      var p = y * W + x, v = mask[p - 1] + mask[p + 1] + mask[p - W] + mask[p + W];
      if (grow && !mask[p] && v >= 2) out[p] = 1;
      if (!grow && mask[p] && v <= 2) out[p] = 0;
    }
    return out;
  }

  /* Maske auf dem Gerät berechnen. tolerance 0 = automatisch. */
  function deviceMask(img, tolerance) {
    var scale = Math.min(1, 640 / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    var W = Math.max(8, Math.round((img.naturalWidth || img.width) * scale)), H = Math.max(8, Math.round((img.naturalHeight || img.height) * scale));
    var c = canvas(W, H), ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, W, H);
    var data = ctx.getImageData(0, 0, W, H).data, n = W * H, lab = toLab(data, n), L = lab[0], A = lab[1], B = lab[2];
    var band = Math.max(2, Math.round(Math.min(W, H) * 0.025)), pts = [], step = Math.max(1, Math.round((2 * (W + H) * band) / 5000));
    for (var y = 0, k = 0; y < H; y++) for (var x = 0; x < W; x++) {
      if (x >= band && y >= band && x < W - band && y < H - band) continue;
      if ((k++ % step) === 0) { var p = y * W + x; pts.push([L[p], A[p], B[p]]); }
    }
    var clusters = kmeans(pts, 4).filter(function (c) { return c.share >= 0.08; });
    if (!clusters.length) clusters = kmeans(pts, 1);
    var spread = clusters.reduce(function (s, c) { return s + c.spread * c.share; }, 0) / clusters.reduce(function (s, c) { return s + c.share; }, 0);
    var T = tolerance > 0 ? tolerance : Math.max(6, Math.min(30, spread * 1.9 + 5));
    var d = new Float32Array(n);
    for (var i = 0; i < n; i++) { var m = 1e9; for (var j = 0; j < clusters.length; j++) { var cc = clusters[j].c, v = dist(L[i], A[i], B[i], cc[0], cc[1], cc[2]); if (v < m) m = v; } d[i] = m; }
    // Kantenstärke (geglättete Helligkeit, Sobel): Fluten stoppt an klaren Konturen
    var sm = new Float32Array(n), edge = new Float32Array(n);
    for (y = 1; y < H - 1; y++) for (x = 1; x < W - 1; x++) { var o = y * W + x; sm[o] = (L[o] * 4 + L[o - 1] + L[o + 1] + L[o - W] + L[o + W]) / 8; }
    for (y = 2; y < H - 2; y++) for (x = 2; x < W - 2; x++) {
      var e = y * W + x, gx = sm[e - W + 1] + 2 * sm[e + 1] + sm[e + W + 1] - sm[e - W - 1] - 2 * sm[e - 1] - sm[e + W - 1],
        gy = sm[e + W - 1] + 2 * sm[e + W] + sm[e + W + 1] - sm[e - W - 1] - 2 * sm[e - W] - sm[e - W + 1];
      edge[e] = Math.sqrt(gx * gx + gy * gy) / 4;
    }
    var es = []; for (y = 2; y < H - 2; y += 3) for (x = 2; x < W - 2; x += 3) if (x < band + 2 || y < band + 2 || x > W - band - 3 || y > H - band - 3) es.push(edge[y * W + x]);
    es.sort(function (p, q) { return p - q; });
    var E = Math.max(4.5, (es[Math.floor(es.length * 0.9)] || 3) * 2.2);
    // Fluten vom Rand
    var bg = new Uint8Array(n), queue = new Int32Array(n), head = 0, tail = 0;
    function seed(p) { if (!bg[p] && d[p] < T * 1.3) { bg[p] = 1; queue[tail++] = p; } }
    for (x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
    for (y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    var T2 = T * 2.1, Tl = T * 0.32;
    while (head < tail) {
      var q = queue[head++], qx = q % W, nb = [qx > 0 ? q - 1 : -1, qx < W - 1 ? q + 1 : -1, q >= W ? q - W : -1, q < n - W ? q + W : -1];
      for (j = 0; j < 4; j++) {
        var r = nb[j]; if (r < 0 || bg[r]) continue;
        if (edge[r] > E && d[r] > T * 0.45) continue;
        if (d[r] < T || (d[r] < T2 && dist(L[r], A[r], B[r], L[q], A[q], B[q]) < Tl)) { bg[r] = 1; queue[tail++] = r; }
      }
    }
    // Eingeschlossene Hintergrundflächen (z. B. Henkel, Ärmel-Lücken)
    var near = new Uint8Array(n); for (i = 0; i < n; i++) near[i] = !bg[i] && d[i] < T * 0.55 ? 1 : 0;
    var cn = components(near, W, H, 1);
    for (i = 0; i < n; i++) if (cn.lab[i] >= 0 && cn.sizes[cn.lab[i]] > n * 0.004) bg[i] = 1;
    var fg = new Uint8Array(n); for (i = 0; i < n; i++) fg[i] = bg[i] ? 0 : 1;
    fg = morph(morph(fg, W, H, true), W, H, false); // schließen
    // Nur das Hauptmotiv (und große Teile) behalten
    var cf = components(fg, W, H, 1), biggest = 0; cf.sizes.forEach(function (s) { if (s > biggest) biggest = s; });
    for (i = 0; i < n; i++) if (fg[i] && cf.sizes[cf.lab[i]] < biggest * 0.12) fg[i] = 0;
    // Kleine Löcher im Motiv füllen
    var ch = components(fg, W, H, 0);
    for (i = 0; i < n; i++) if (!fg[i] && !ch.touches[ch.lab[i]] && ch.sizes[ch.lab[i]] < n * 0.002) fg[i] = 1;
    fg = morph(fg, W, H, false); // 1 px einziehen gegen Farbsäume
    var count = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (i = 0; i < n; i++) if (fg[i]) { count++; var px = i % W, py = (i - px) / W; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
    var fill = x1 < 0 ? 0 : count / ((x1 - x0 + 1) * (y1 - y0 + 1));
    return { mask: fg, W: W, H: H, coverage: count / n, fill: fill, tolerance: Math.round(T), touchesEdge: edgeShare(fg, W, H) };
  }
  function edgeShare(fg, W, H) {
    var t = 0, all = 2 * (W + H);
    for (var x = 0; x < W; x++) t += fg[x] + fg[(H - 1) * W + x];
    for (var y = 0; y < H; y++) t += fg[y * W] + fg[y * W + W - 1];
    return t / all;
  }

  /* Maske auf Originalgröße bringen und Motiv mit Alphakanal ausschneiden. */
  function applyMask(img, m) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var mc = canvas(m.W, m.H), mctx = mc.getContext('2d'), id = mctx.createImageData(m.W, m.H);
    for (var i = 0; i < m.mask.length; i++) { id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = m.mask[i] ? 255 : 0; }
    mctx.putImageData(id, 0, 0);
    var out = canvas(w, h), ctx = out.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'blur(' + Math.max(0.8, w / m.W * 0.7).toFixed(1) + 'px)';
    ctx.drawImage(mc, 0, 0, w, h);
    ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
    return out;
  }

  function alphaBox(c) {
    var s = Math.min(1, 400 / Math.max(c.width, c.height)), w = Math.max(1, Math.round(c.width * s)), h = Math.max(1, Math.round(c.height * s));
    var t = canvas(w, h), ctx = t.getContext('2d', { willReadFrequently: true }); ctx.drawImage(c, 0, 0, w, h);
    var d = ctx.getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = -1, y1 = -1, cnt = 0;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 60) { cnt++; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    return { x: x0 / s, y: y0 / s, w: (x1 - x0 + 1) / s, h: (y1 - y0 + 1) / s, coverage: cnt / (w * h) };
  }

  /* ---------- Nachbearbeitung der Maske: weiche Kante schärfen, Splitter und Fremdteile entfernen ---------- */
  function refine(cut) {
    var w = cut.width, h = cut.height, ctx = cut.getContext('2d', { willReadFrequently: true }), id = ctx.getImageData(0, 0, w, h), d = id.data, i, x, y;
    for (i = 3; i < d.length; i += 4) { var a = d[i] / 255; a = a <= 0.1 ? 0 : a >= 0.9 ? 1 : (a - 0.1) / 0.8; d[i] = Math.round(a * a * (3 - 2 * a) * 255); }
    var s = Math.min(1, 240 / Math.max(w, h)), gw = Math.max(2, Math.round(w * s)), gh = Math.max(2, Math.round(h * s)), g = new Uint8Array(gw * gh);
    for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) g[y * gw + x] = d[(Math.min(h - 1, Math.floor(y / s)) * w + Math.min(w - 1, Math.floor(x / s))) * 4 + 3] > 128 ? 1 : 0;
    var cc = components(g, gw, gh, 1);
    if (cc.sizes.length > 1) {
      var max = Math.max.apply(null, cc.sizes), drop = new Uint8Array(gw * gh), any = false;
      for (i = 0; i < g.length; i++) if (g[i] && cc.sizes[cc.lab[i]] < max * 0.06) { drop[i] = 1; any = true; }
      if (any) {
        var wide = new Uint8Array(drop);
        for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) if (drop[y * gw + x]) for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < gw && ny < gh && !(g[ny * gw + nx] && !drop[ny * gw + nx])) wide[ny * gw + nx] = 1; }
        for (y = 0; y < h; y++) { var gy = Math.min(gh - 1, Math.floor(y * s)); for (x = 0; x < w; x++) if (wide[gy * gw + Math.min(gw - 1, Math.floor(x * s))]) d[(y * w + x) * 4 + 3] = 0; }
      }
    }
    ctx.putImageData(id, 0, 0);
    return cut;
  }

  function silhouette(cut, box, dw, dh, color) {
    var c = canvas(Math.max(1, Math.ceil(dw)), Math.max(1, Math.ceil(dh))), x = c.getContext('2d');
    x.imageSmoothingQuality = 'high'; x.drawImage(cut, box.x, box.y, box.w, box.h, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function seeded(n) { var v = n * 9301 + 49297; return function () { v = (v * 9301 + 49297) % 233280; return v / 233280; }; }
  function setFilter(ctx, f) { try { ctx.filter = f; } catch (e) {} }

  /* Titelbild 4:5 – drei Stile: studio (ruhiger Verlauf mit Bodenschatten), app (App-Design mit Blau-/Orangelicht
     und Spiegelung), sticker (Motiv mit weißem Rand, wie ein Aufkleber). */
  function compose(cut, box, bgKey, style) {
    var bgc = BACKDROPS[bgKey] || BACKDROPS.sand, W = 1000, H = 1250, c = canvas(W, H), ctx = c.getContext('2d'), st = STYLES[style] ? style : 'studio';
    var fit = st === 'app' ? 0.66 : 0.74, s = Math.min(W * 0.78 / box.w, H * fit / box.h), dw = box.w * s, dh = box.h * s, dx = (W - dw) / 2;
    var dy = st === 'app' ? (H * 0.46 - dh / 2) : (H - dh) / 2 + H * 0.015, base = dy + dh, dark = bgKey === 'nacht', i;
    ctx.imageSmoothingQuality = 'high';
    if (st === 'app') {
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e2244'); g.addColorStop(0.55, '#08101f'); g.addColorStop(1, '#050912'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var r1 = ctx.createRadialGradient(W * 0.5, H * 0.44, 0, W * 0.5, H * 0.44, W * 0.75); r1.addColorStop(0, 'rgba(61,155,255,.42)'); r1.addColorStop(1, 'rgba(61,155,255,0)'); ctx.fillStyle = r1; ctx.fillRect(0, 0, W, H);
      var r2 = ctx.createRadialGradient(W * 0.86, H * 0.9, 0, W * 0.86, H * 0.9, W * 0.6); r2.addColorStop(0, 'rgba(255,150,60,.34)'); r2.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = r2; ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 2;
      [0.30, 0.43, 0.58].forEach(function (k, n) { ctx.strokeStyle = 'rgba(140,200,255,' + (0.20 - n * 0.045) + ')'; ctx.beginPath(); ctx.arc(W / 2, H * 0.44, W * k, 0, 7); ctx.stroke(); });
      ctx.setLineDash([6, 16]); ctx.strokeStyle = 'rgba(255,180,100,.28)'; ctx.beginPath(); ctx.arc(W / 2, H * 0.44, W * 0.50, 0.3, 4.2); ctx.stroke(); ctx.setLineDash([]);
      var rnd = seeded(7); for (i = 0; i < 34; i++) { var px = rnd() * W, py = rnd() * H, pr = 1 + rnd() * 2.4; ctx.fillStyle = 'rgba(' + (rnd() > 0.7 ? '255,190,120' : '170,215,255') + ',' + (0.25 + rnd() * 0.5) + ')'; ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.fill(); }
      // Glasboden mit Orangerand
      var ey = base + 10, erx = Math.max(dw * 0.6, W * 0.26), ery = 30;
      var fl = ctx.createRadialGradient(W / 2, ey, 0, W / 2, ey, erx); fl.addColorStop(0, 'rgba(90,170,255,.30)'); fl.addColorStop(1, 'rgba(90,170,255,0)');
      ctx.fillStyle = fl; ctx.beginPath(); ctx.ellipse(W / 2, ey, erx, ery * 1.6, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,120,.60)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(W / 2, ey, erx * 0.8, ery, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(140,200,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W / 2, ey, erx * 0.95, ery * 1.25, 0, 0, 7); ctx.stroke();
      // Spiegelung
      var rf = canvas(Math.ceil(dw), Math.ceil(dh * 0.5)), rx = rf.getContext('2d');
      rx.translate(0, dh); rx.scale(1, -1); rx.drawImage(cut, box.x, box.y, box.w, box.h, 0, 0, Math.ceil(dw), Math.ceil(dh));
      rx.setTransform(1, 0, 0, 1, 0, 0); rx.globalCompositeOperation = 'destination-out';
      var rg = rx.createLinearGradient(0, 0, 0, rf.height); rg.addColorStop(0, 'rgba(0,0,0,.72)'); rg.addColorStop(1, 'rgba(0,0,0,1)'); rx.fillStyle = rg; rx.fillRect(0, 0, rf.width, rf.height);
      ctx.save(); ctx.globalAlpha = 0.5; ctx.drawImage(rf, dx, base + 4); ctx.restore();
      ctx.save(); ctx.shadowColor = 'rgba(90,170,255,.55)'; ctx.shadowBlur = 40; setFilter(ctx, 'saturate(1.1) contrast(1.05) brightness(1.04)'); ctx.drawImage(cut, box.x, box.y, box.w, box.h, dx, dy, dw, dh); ctx.restore();
      var vv = ctx.createRadialGradient(W / 2, H * 0.44, W * 0.4, W / 2, H * 0.44, W * 1.0); vv.addColorStop(0, 'rgba(0,0,0,0)'); vv.addColorStop(1, 'rgba(0,0,0,.40)'); ctx.fillStyle = vv; ctx.fillRect(0, 0, W, H);
      return c.toDataURL('image/jpeg', 0.92);
    }
    var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, bgc[0]); bg.addColorStop(1, bgc[1]); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    var sh = silhouette(cut, box, dw, dh, dark ? '#000' : '#2a2016');
    if (st === 'sticker') {
      var rad = Math.max(10, dw * 0.016), ol = silhouette(cut, box, dw, dh, '#ffffff'), oc = canvas(W, H), ox = oc.getContext('2d');
      for (i = 0; i < 28; i++) { var an = i / 28 * Math.PI * 2; ox.drawImage(ol, dx + Math.cos(an) * rad, dy + Math.sin(an) * rad); }
      ox.drawImage(ol, dx, dy);
      ctx.save(); ctx.shadowColor = dark ? 'rgba(0,0,0,.6)' : 'rgba(42,32,22,.34)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 16; ctx.drawImage(oc, 0, 0); ctx.restore();
      ctx.save(); setFilter(ctx, 'saturate(1.06) contrast(1.04)'); ctx.drawImage(cut, box.x, box.y, box.w, box.h, dx, dy, dw, dh); ctx.restore();
    } else {
      // Kontaktschatten aus der Silhouette: schmal, weich, direkt unter dem Motiv
      ctx.save(); ctx.translate(W / 2, base - dh * 0.004); ctx.scale(1, 0.09); setFilter(ctx, 'blur(' + Math.round(10 + dw * 0.02) + 'px)'); ctx.globalAlpha = dark ? 0.7 : 0.42; ctx.drawImage(sh, -dw / 2, -dh); ctx.restore();
      ctx.save(); ctx.shadowColor = dark ? 'rgba(0,0,0,.5)' : 'rgba(42,32,22,.22)'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 16; setFilter(ctx, 'saturate(1.05) contrast(1.03)'); ctx.drawImage(cut, box.x, box.y, box.w, box.h, dx, dy, dw, dh); ctx.restore();
    }
    var v = ctx.createRadialGradient(W / 2, H * 0.42, W * 0.35, W / 2, H * 0.42, W * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, dark ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.12)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    return c.toDataURL('image/jpeg', 0.92);
  }
  /* Ohne Freistellen: Foto im 4:5-Format zuschneiden */
  function coverCrop(img) {
    var W = 1000, H = 1250, c = canvas(W, H), ctx = c.getContext('2d'), w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var s = Math.max(W / w, H / h), dw = w * s, dh = h * s; ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    return c.toDataURL('image/jpeg', 0.9);
  }

  async function makeCover(src, opts) {
    opts = opts || {};
    var img = await loadImage(src), result = { engine: 'original', warning: '' };
    if (opts.engine === 'original') { result.src = coverCrop(img); return result; }
    if (opts.cutCanvas) {
      var kc = refine(opts.cutCanvas), kb = alphaBox(kc);
      if (kb && kb.coverage > 0.02) { result.src = compose(kc, kb, opts.bg, opts.style); result.engine = 'ai'; return result; }
      result.warning = 'Die KI hat kein Motiv gefunden – einfacher Freisteller verwendet.';
    }
    if (opts.cutoutPng) {
      var cimg = await loadImage(opts.cutoutPng), cc = canvas(cimg.naturalWidth, cimg.naturalHeight); cc.getContext('2d').drawImage(cimg, 0, 0);
      var b = alphaBox(cc);
      if (b && b.coverage > 0.02) { result.src = compose(refine(cc), b, opts.bg, opts.style); result.engine = 'server'; return result; }
      result.warning = 'Der KI-Server hat kein Motiv gefunden – Freisteller auf dem Gerät verwendet.';
    }
    var m = deviceMask(img, opts.tolerance || 0);
    result.tolerance = m.tolerance; result.engine = 'device';
    result.fill = m.fill;
    if (m.coverage < 0.04 || m.coverage > 0.95 || m.fill < 0.32) {
      result.src = coverCrop(img); result.engine = 'original';
      result.warning = 'Motiv und Hintergrund ließen sich nicht sicher trennen. Tipp: auf ruhigem, einfarbigem Untergrund fotografieren oder die Feinheit anpassen.';
      return result;
    }
    if (m.touchesEdge > 0.18) result.warning = 'Das Motiv berührt den Bildrand – Titelbild bitte kurz prüfen.';
    var cut = applyMask(img, m), box = alphaBox(cut);
    result.src = compose(cut, box, opts.bg, opts.style);
    return result;
  }

  window.RVCutout = { BACKDROPS: BACKDROPS, STYLES: STYLES, makeCover: makeCover, deviceMask: deviceMask };
})();
