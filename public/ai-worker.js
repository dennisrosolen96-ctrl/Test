/* RV Studio – KI-Freisteller (läuft im Hintergrund-Thread, kostenlos, ohne Upload).
   Modell: ISNet general-use (Apache-2.0), reines Faltungsnetz – läuft über WebGPU und notfalls auf der CPU.
   Gewichte 16 Bit gespeichert, Rechnung 32 Bit; in Teilen unter /ai-model/ (einmalig ~90 MB, danach im Gerät).
   Getestet: BiRefNet_lite schneidet minimal feiner, stürzt im Browser aber ab (zu viele GPU-Puffer bzw. Speicher)
   und ist deshalb nicht dabei. Reihenfolge: ISNet (GPU) → ISNet (CPU). Was scheitert, merkt sich die App. */
const ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.webgpu.min.mjs';
const BASE = '/ai-model/';
let ort = null, man = null, active = null;   // active = { key, ep, session, spec }

async function hasGpu() {
  try { return !!self.navigator.gpu && !!(await self.navigator.gpu.requestAdapter()); } catch (e) { return false; }
}
async function sha256(buf) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(h, b => b.toString(16).padStart(2, '0')).join('');
}
async function manifest() {
  if (!man) man = await (await fetch(BASE + 'manifest.json', { cache: 'no-cache' })).json();
  return man;
}

/* Modell aus dem Gerätespeicher holen oder einmalig in Teilen laden (mit Fortschritt und Prüfsumme). */
async function modelBytes(spec, report) {
  const key = BASE + spec.version + '.onnx', cache = await caches.open('rv-ai-model');
  const hit = await cache.match(key);
  if (hit) { const b = await hit.arrayBuffer(); if (b.byteLength === spec.size) return b; }
  const all = new Uint8Array(spec.size);
  let off = 0;
  for (const part of spec.parts) {
    const res = await fetch(BASE + part);
    if (!res.ok || !res.body) throw new Error('Modellteil ' + part + ' nicht ladbar (' + res.status + ')');
    const rd = res.body.getReader();
    for (;;) {
      const { done, value } = await rd.read();
      if (done) break;
      if (off + value.length > all.length) throw new Error('Modell größer als erwartet');
      all.set(value, off); off += value.length;
      report(off / spec.size, spec.size);
    }
  }
  if (off !== spec.size) throw new Error('Modell unvollständig geladen');
  if (spec.sha256 && (await sha256(all.buffer)) !== spec.sha256) throw new Error('Modell beschädigt – bitte erneut versuchen');
  try { await cache.put(key, new Response(all.buffer, { headers: { 'Content-Type': 'application/octet-stream' } })); } catch (e) {}
  return all.buffer;
}

async function open(key, ep, report) {
  if (active && active.key === key && active.ep === ep) return active;
  if (active) { try { await active.session.release(); } catch (e) {} active = null; }
  if (!ort) { ort = await import(ORT); ort.env.wasm.numThreads = 1; ort.env.logLevel = 'error'; }
  const spec = (await manifest()).models[key];
  const bytes = await modelBytes(spec, report);
  report(1, 0);
  const session = await ort.InferenceSession.create(new Uint8Array(bytes), { executionProviders: [ep], graphOptimizationLevel: 'all' });
  active = { key, ep, session, spec };
  return active;
}

async function infer(a, blob) {
  const S = (await manifest()).input || 1024, M = a.spec.mean, SD = a.spec.std;
  const bmp = await createImageBitmap(blob, { resizeWidth: S, resizeHeight: S, resizeQuality: 'high' });
  const c = new OffscreenCanvas(S, S), ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0); bmp.close && bmp.close();
  const px = ctx.getImageData(0, 0, S, S).data, n = S * S, data = new Float32Array(3 * n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    data[i] = (px[j] / 255 - M[0]) / SD[0];
    data[n + i] = (px[j + 1] / 255 - M[1]) / SD[1];
    data[2 * n + i] = (px[j + 2] / 255 - M[2]) / SD[2];
  }
  const out = await a.session.run({ [a.session.inputNames[0]]: new ort.Tensor('float32', data, [1, 3, S, S]) });
  const o = out[a.session.outputNames[0]].data, mask = new Uint8Array(n);
  if (a.spec.post === 'minmax') {
    let mi = Infinity, ma = -Infinity;
    for (let i = 0; i < n; i++) { const v = o[i]; if (v < mi) mi = v; if (v > ma) ma = v; }
    const r = ma - mi || 1;
    for (let i = 0; i < n; i++) mask[i] = Math.round((o[i] - mi) / r * 255);
  } else {
    for (let i = 0; i < n; i++) mask[i] = Math.round(255 / (1 + Math.exp(-o[i])));
  }
  return { mask, size: S };
}

self.onmessage = async function (e) {
  const d = e.data, id = d.id, bad = d.bad || {};
  const gpu = await hasGpu();
  const plan = (gpu ? [['isnet', 'webgpu'], ['isnet', 'wasm']] : [['isnet', 'wasm']])
    .filter(([k, ep]) => !bad[k + ':' + ep]);
  const failed = [];
  for (const [key, ep] of plan) {
    try {
      const a = await open(key, ep, (f, total) => self.postMessage({ id, progress: f, total, model: key }));
      const r = await infer(a, d.blob);
      self.postMessage({ id, ok: true, size: r.size, mask: r.mask, model: key, ep, failed }, [r.mask.buffer]);
      return;
    } catch (err) {
      failed.push({ step: key + ':' + ep, error: String(err && err.message || err).slice(0, 300) });
      if (active && active.key === key && active.ep === ep) { try { await active.session.release(); } catch (x) {} active = null; }
    }
  }
  self.postMessage({ id, ok: false, failed, error: failed.length ? failed[failed.length - 1].error : 'Kein KI-Modell verfügbar' });
};
