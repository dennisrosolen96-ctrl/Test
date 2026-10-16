/* RV Studio – KI-Freisteller (läuft im Hintergrund-Thread, kostenlos, ohne Upload).
   Modell: BiRefNet_lite (MIT-Lizenz, auch geschäftlich nutzbar) über transformers.js.
   Läuft nur mit WebGPU (S25 Ultra & Co.). Wird beim ersten Mal einmalig geladen (~115 MB, ohne Half-Precision-Unterstützung ~224 MB) und danach vom Browser zwischengespeichert. */
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js';
const MODEL = 'onnx-community/BiRefNet_lite-ONNX';
let T = null, model = null, proc = null, device = '';

let f16 = false;
async function hasGpu() {
  try {
    if (!self.navigator.gpu) return false;
    const a = await self.navigator.gpu.requestAdapter();
    if (!a) return false;
    f16 = a.features.has('shader-f16');
    return true;
  } catch (e) { return false; }
}
async function load(report) {
  if (model) return;
  if (!T) T = await import(LIB);
  const local = /[?&]local=1/.test(self.location.search);   // Selbst gehostetes Modell unter /models/ (zum Testen oder Offline-Betrieb)
  T.env.allowLocalModels = local; T.env.allowRemoteModels = !local; if (local) T.env.localModelPath = '/models/';
  const files = {};
  const cb = function (p) {
    if (!p || p.status !== 'progress' || !p.total || p.total < 5e6) return;
    files[p.file] = { l: p.loaded, t: p.total };
    let l = 0, t = 0; for (const k in files) { l += files[k].l; t += files[k].t; }
    report(t ? l / t : 0, t);
  };
  // Das Modell hat eine feste Eingabegröße von 1024 px und braucht auf der CPU zu viel Speicher: nur mit WebGPU.
  if (!(await hasGpu())) throw new Error('Dieses Gerät bietet kein WebGPU');
  try { model = await T.AutoModel.from_pretrained(MODEL, { device: 'webgpu', dtype: f16 ? 'fp16' : 'fp32', progress_callback: cb }); device = 'webgpu'; }
  catch (e) { model = null; throw e; }
  proc = await T.AutoProcessor.from_pretrained(MODEL);
}
async function infer(blob) {
  const img = await T.RawImage.fromBlob(blob);
  const inp = await proc(img);
  const out = await model({ input_image: inp.pixel_values });
  const t = out.output_image || out[Object.keys(out)[0]];
  const m = await T.RawImage.fromTensor(t[0].sigmoid().mul(255).to('uint8')).resize(img.width, img.height);
  return { w: img.width, h: img.height, mask: m.data };
}
self.onmessage = async function (e) {
  const d = e.data, id = d.id;
  try {
    await load(function (f, total) { self.postMessage({ id: id, progress: f, total: total }); });
    const r = await infer(d.blob);
    self.postMessage({ id: id, ok: true, w: r.w, h: r.h, mask: r.mask, device: device }, [r.mask.buffer]);
  } catch (err) {
    self.postMessage({ id: id, ok: false, error: String(err && err.message || err) });
  }
};
