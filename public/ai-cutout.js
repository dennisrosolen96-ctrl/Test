/* RV Studio – KI-Freisteller (Hauptthread): Foto verkleinern, an den Worker geben, Maske als Alphakanal anwenden. */
(function () {
  'use strict';
  var worker = null, pend = {}, seq = 0, lastDevice = '';
  function gpu() { return !!(navigator.gpu); }
  function supported() { return typeof Worker !== 'undefined' && gpu(); }
  function start() {
    if (worker) return worker;
    worker = new Worker('/ai-worker.js' + (window.RV_AI_LOCAL ? '?local=1' : ''), { type: 'module' });
    worker.onmessage = function (e) {
      var d = e.data, p = pend[d.id]; if (!p) return;
      if (d.progress != null) { p.onProgress && p.onProgress(d.progress, d.total); return; }
      delete pend[d.id];
      if (d.ok) p.ok(d); else p.no(new Error(d.error || 'KI-Freisteller fehlgeschlagen'));
    };
    worker.onerror = function (e) {
      var msg = (e && e.message) || 'Worker konnte nicht gestartet werden';
      for (var k in pend) { pend[k].no(new Error(msg)); delete pend[k]; }
      try { worker.terminate(); } catch (x) {} worker = null;
    };
    return worker;
  }
  function loadImage(src) { return new Promise(function (ok, no) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { no(new Error('Foto nicht lesbar')); }; im.src = src; }); }
  function toBlob(c, type, q) { return new Promise(function (ok) { c.toBlob(ok, type, q); }); }

  /* Liefert eine Canvas mit freigestelltem Motiv in voller (bis 1600 px) Auflösung. */
  async function cut(src, opts) {
    opts = opts || {};
    if (!supported()) throw new Error('Dieser Browser bietet kein WebGPU');
    var img = await loadImage(src), iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    var s = Math.min(1, 1600 / Math.max(iw, ih)), w = Math.max(1, Math.round(iw * s)), h = Math.max(1, Math.round(ih * s));
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var ctx = c.getContext('2d', { willReadFrequently: true }); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, w, h);
    var blob = await toBlob(c, 'image/jpeg', 0.95);
    var id = ++seq;
    var res = await new Promise(function (ok, no) {
      pend[id] = { ok: ok, no: no, onProgress: opts.onProgress };
      var timer = setTimeout(function () { if (pend[id]) { delete pend[id]; no(new Error('Zeitüberschreitung beim KI-Freisteller')); } }, opts.timeout || 240000);
      var wrap = pend[id], ok0 = wrap.ok, no0 = wrap.no;
      wrap.ok = function (v) { clearTimeout(timer); ok0(v); }; wrap.no = function (e) { clearTimeout(timer); no0(e); };
      start().postMessage({ id: id, blob: blob });
    });
    lastDevice = res.device || '';
    var px = ctx.getImageData(0, 0, w, h), d = px.data, m = res.mask;
    if (res.w !== w || res.h !== h) throw new Error('Maske passt nicht zum Foto');
    for (var i = 0, j = 3; i < m.length; i++, j += 4) d[j] = m[i];
    ctx.putImageData(px, 0, 0);
    return c;
  }
  window.RVAI = { cut: cut, supported: supported, gpu: gpu, device: function () { return lastDevice; } };
})();
