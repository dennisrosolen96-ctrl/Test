/* RVO V35 – RVO Intelligence: Bao als Unternehmensassistent.
   - Fakten: Kennzahlen werden auf dem Gerät aus den echten RVO-Daten berechnet (Bestand, Verkäufe, Einkaufschargen, Aufgaben).
     Beispielartikel (id „demo-…“) werden ausgeschlossen. Fehlen Daten, sagt Bao das.
   - Schnelle Antworten ohne KI-Kosten für typische Fragen (längste Lagerdauer, Monatsgewinn, beste Marge, nächste Schritte, Einkauf).
   - Alles andere geht an /api/bao (Werkzeugaufrufe über die Datenübersicht, kein Freitext-Dump). Fällt auf /api/ai-chat zurück,
     wenn der Server den neuen Endpunkt noch nicht kennt.
   - Aufgaben, Eingang (Fotos, PDFs, Texte), Freigaben, Protokoll und Kostenübersicht.
   - Bao führt nichts ohne Freigabe aus: Vorschläge landen unter „Freigaben“. */
(function () {
  'use strict';
  var doc = document, R = window.RVO, DAY = 864e5, $ = function (id) { return doc.getElementById(id); };
  var esc = function (v) { return R ? R.esc(v) : String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var eur = function (v) { return (Number(v) || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }); };
  var ico = function (d) { return '<svg class="sx-ico" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; };
  var uid = function (p) { return (p || 'x') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  var today = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var fmtDate = function (iso) { var t = Date.parse(iso || ''); return Number.isFinite(t) ? new Date(t).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''; };
  function read(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function emit(kind) { try { doc.dispatchEvent(new CustomEvent('rvo:success', { detail: { kind: kind } })); } catch (e) {} }

  /* =============== Protokoll und Kosten =============== */
  var LOG = 'rvo_log_v1', COST = 'rvo_costs_v1';
  function log(kind, text) { var l = read(LOG, []); l.unshift({ t: Date.now(), kind: kind, text: String(text).slice(0, 300) }); write(LOG, l.slice(0, 300)); }
  function cost(route, u) { if (!u) return; var l = read(COST, []); l.unshift({ t: Date.now(), route: route, model: u.model || '', input: u.input || 0, output: u.output || 0, usd: typeof u.usd === 'number' ? u.usd : null }); write(COST, l.slice(0, 1000)); }
  function costMonth() { var s = new Date(); s.setDate(1); s.setHours(0, 0, 0, 0); var l = read(COST, []).filter(function (c) { return c.t >= s.getTime(); }); return { n: l.length, usd: l.reduce(function (n, c) { return n + (c.usd || 0); }, 0), unknown: l.filter(function (c) { return c.usd == null; }).length }; }

  /* =============== Fakten aus echten RVO-Daten =============== */
  function isDemo(a) { return String(a.id || '').indexOf('demo-') === 0; }
  function age(a) { try { return R.age(a); } catch (e) { var t = Date.parse(a.purchaseDate || a.createdAt || ''); return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / DAY)) : null; } }
  function startOf(a) { var t = Date.parse(a.purchaseDate || a.createdAt || ''); return Number.isFinite(t) ? t : null; }
  function saleT(a) { var t = Date.parse((a.sale && a.sale.date) || ''); return Number.isFinite(t) ? t : null; }
  function profitOf(a) { return a.sale ? (Number(a.sale.price) || 0) - (Number(a.cost) || 0) - (Number(a.sale.fees) || 0) - (Number(a.sale.shipping) || 0) : 0; }
  function priceOf(a) { return Math.max(0, Math.max.apply(null, [0].concat(Object.values(a.prices || {}).map(Number).filter(Number.isFinite)))); }
  function nameOf(a) { return [a.brand, a.model].filter(Boolean).join(' ') || [a.brand, a.category].filter(Boolean).join(' ') || a.sku || 'Artikel'; }
  function staleDays() { try { return Number(R.settings().staleDays) || 60; } catch (e) { return 60; } }
  function missingOf(a) { try { return R.missing(a).slice(0, 6).map(String); } catch (e) { return []; } }
  async function facts() {
    var all = await R.allArticles(), real = all.filter(function (a) { return !isDemo(a) && !a.archivedAt; }), demo = all.length - all.filter(function (a) { return !isDemo(a); }).length;
    var stock = real.filter(function (a) { return a.articleStatus !== 'Verkauft'; }), sold = real.filter(function (a) { return a.articleStatus === 'Verkauft' && a.sale && saleT(a) !== null; });
    var archivedSold = all.filter(function (a) { return !isDemo(a) && a.archivedAt && a.sale && saleT(a) !== null; });
    sold = sold.concat(archivedSold); // archivierte Verkäufe zählen weiter zum Umsatz
    return { all: all, real: real, stock: stock, sold: sold, demo: demo };
  }
  function monthKey(t) { var d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function months(F, n) {
    var out = [], d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0);
    for (var i = n - 1; i >= 0; i--) { var m = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push({ month: monthKey(m.getTime()), revenue: 0, profit: 0, sales: 0, bought: 0, spent: 0 }); }
    var idx = {}; out.forEach(function (m, i) { idx[m.month] = i; });
    F.sold.forEach(function (a) { var k = idx[monthKey(saleT(a))]; if (k == null) return; out[k].revenue += Number(a.sale.price) || 0; out[k].profit += profitOf(a); out[k].sales++; });
    F.real.concat(F.sold.filter(function (a) { return a.archivedAt; })).forEach(function (a) { var t = startOf(a); if (t === null) return; var k = idx[monthKey(t)]; if (k == null) return; out[k].bought++; out[k].spent += Number(a.cost) || 0; });
    out.forEach(function (m) { m.revenue = Math.round(m.revenue * 100) / 100; m.profit = Math.round(m.profit * 100) / 100; m.spent = Math.round(m.spent * 100) / 100; });
    return out;
  }
  function totals(F) {
    var now = Date.now(), s90 = F.sold.filter(function (a) { return saleT(a) >= now - 90 * DAY; }).length;
    var dts = F.sold.map(function (a) { var s = startOf(a); return s === null ? null : (saleT(a) - s) / DAY; }).filter(function (x) { return x !== null && x >= 0; });
    return {
      activeItems: F.stock.length, stockCost: F.stock.reduce(function (n, a) { return n + (Number(a.cost) || 0); }, 0),
      stockListed: F.stock.reduce(function (n, a) { return n + priceOf(a); }, 0), soldCount: F.sold.length,
      revenueAll: F.sold.reduce(function (n, a) { return n + (Number(a.sale.price) || 0); }, 0), profitAll: F.sold.reduce(function (n, a) { return n + profitOf(a); }, 0),
      drafts: F.stock.filter(function (a) { return a.articleStatus === 'Entwurf'; }).length, ready: F.stock.filter(function (a) { return a.articleStatus === 'Bereit'; }).length,
      online: F.stock.filter(function (a) { return a.articleStatus === 'Online'; }).length,
      avgDaysToSell: dts.length ? Math.round(dts.reduce(function (n, x) { return n + x; }, 0) / dts.length) : null,
      sellThrough90: s90 + F.stock.length ? Math.round(s90 / (s90 + F.stock.length) * 100) : null
    };
  }
  async function snapshot() {
    var F = await facts(), batches = [];
    try { batches = R.batches().map(function (b) { var l = F.all.filter(function (a) { return a.batchId === b.id; }); return { name: b.name, date: b.date, total: Number(b.total) || 0, linkedCost: l.reduce(function (n, a) { return n + (Number(a.cost) || 0); }, 0), count: l.length }; }); } catch (e) {}
    return {
      today: today(), staleDays: staleDays(), demoExcluded: F.demo, totals: totals(F), months: months(F, 6),
      items: F.stock.map(function (a) { return { id: a.id, sku: a.sku || '', name: nameOf(a), cat: a.category || '', brand: a.brand || '', size: a.size || '', status: a.articleStatus || 'Entwurf', cost: Number(a.cost) || 0, price: priceOf(a), days: age(a), missing: missingOf(a) }; }),
      sales: F.sold.map(function (a) { var s = startOf(a); return { sku: a.sku || '', name: nameOf(a), cat: a.category || '', brand: a.brand || '', platform: a.sale.platform || '', price: Number(a.sale.price) || 0, cost: Number(a.cost) || 0, fees: Number(a.sale.fees) || 0, ship: Number(a.sale.shipping) || 0, profit: Math.round(profitOf(a) * 100) / 100, date: new Date(saleT(a)).toISOString().slice(0, 10), days: s === null ? null : Math.max(0, Math.round((saleT(a) - s) / DAY)) }; }),
      tasks: Tasks.list().filter(function (t) { return !t.deleted; }).map(function (t) { return { id: t.id, title: t.title, due: t.due || '', priority: t.priority, done: !!t.done, source: t.source }; }),
      batches: batches
    };
  }

  /* =============== Aufgaben (geräteübergreifend über /api/meta/bao_tasks) =============== */
  var TK = 'rvo_tasks_v1';
  var Tasks = {
    raw: function () { var l = read(TK, []); return Array.isArray(l) ? l : []; },
    list: function () { return Tasks.raw().filter(function (t) { return !t.deleted; }); },
    save: function (l, remote) { write(TK, l); if (!remote) { write('rvo_tasks_dirty', 1); try { R.scheduleSync(); } catch (e) {} } paintCounts(); doc.dispatchEvent(new Event('rvo:tasks')); },
    add: function (t) {
      var l = Tasks.raw(), now = new Date().toISOString();
      var task = { id: uid('task'), title: String(t.title || '').trim().slice(0, 160), notes: String(t.notes || '').slice(0, 1000), due: /^\d{4}-\d{2}-\d{2}$/.test(t.due || '') ? t.due : '', priority: ['hoch', 'mittel', 'niedrig'].indexOf(t.priority) >= 0 ? t.priority : 'mittel', done: false, source: t.source || 'du', ref: t.ref || '', createdAt: now, updatedAt: now };
      if (!task.title) return null; l.unshift(task); Tasks.save(l); log('aufgabe', 'Aufgabe angelegt: ' + task.title + (task.source !== 'du' ? ' (Quelle: ' + task.source + ')' : '')); return task;
    },
    update: function (id, patch) { var l = Tasks.raw(), t = l.find(function (x) { return x.id === id; }); if (!t) return; Object.assign(t, patch, { updatedAt: new Date().toISOString() }); Tasks.save(l); return t; },
    toggle: function (id) { var t = Tasks.raw().find(function (x) { return x.id === id; }); if (!t) return; var done = !t.done; Tasks.update(id, { done: done, doneAt: done ? new Date().toISOString() : '' }); log('aufgabe', (done ? 'Erledigt: ' : 'Wieder offen: ') + t.title); if (done) emit('task'); },
    remove: function (id) { var t = Tasks.raw().find(function (x) { return x.id === id; }); if (!t) return; Tasks.update(id, { deleted: true }); log('aufgabe', 'Gelöscht: ' + t.title); },
    open: function () { return Tasks.list().filter(function (t) { return !t.done; }); },
    overdue: function () { var d = today(); return Tasks.open().filter(function (t) { return t.due && t.due < d; }); },
    dueToday: function () { var d = today(); return Tasks.open().filter(function (t) { return t.due === d; }); }
  };
  function mergeTasks(a, b) { var m = {}; a.concat(b).forEach(function (t) { if (!t || !t.id) return; var o = m[t.id]; if (!o || String(t.updatedAt || '') > String(o.updatedAt || '')) m[t.id] = t; }); return Object.values(m).sort(function (x, y) { return String(y.createdAt).localeCompare(String(x.createdAt)); }); }
  async function syncTasks() {
    if (!R.cloudConnected()) return;
    try {
      var remote = await R.api('meta/bao_tasks'), local = Tasks.raw(), merged = mergeTasks(local, remote.value || []);
      var cutoff = Date.now() - 60 * DAY; merged = merged.filter(function (t) { return !(t.deleted && Date.parse(t.updatedAt) < cutoff); });
      if (JSON.stringify(merged) !== JSON.stringify(remote.value || [])) {
        try { await R.api('meta/bao_tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: merged, revision: remote.revision || 0 }) }); }
        catch (e) { if (e.status === 409) { var again = await R.api('meta/bao_tasks'); merged = mergeTasks(merged, again.value || []); await R.api('meta/bao_tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: merged, revision: again.revision || 0 }) }); } else throw e; }
      }
      Tasks.save(merged, true); localStorage.removeItem('rvo_tasks_dirty'); render();
    } catch (e) { if (e && e.status !== 404) console.warn('Aufgaben-Sync', e); }
  }
  R.hooks.afterSync.push(syncTasks);

  /* =============== Freigaben =============== */
  var AK = 'rvo_approvals_v1';
  var Approvals = {
    list: function () { var l = read(AK, []); return Array.isArray(l) ? l : []; },
    pending: function () { return Approvals.list().filter(function (a) { return a.status === 'offen'; }); },
    add: function (a) {
      var l = Approvals.list(), item = { id: uid('ap'), type: a.type, title: String(a.title || '').slice(0, 200), detail: String(a.detail || '').slice(0, 2000), payload: a.payload || {}, source: a.source || 'bao', createdAt: new Date().toISOString(), status: 'offen' };
      l.unshift(item); write(AK, l.slice(0, 200)); log('vorschlag', 'Vorschlag von ' + item.source + ': ' + item.title); paintCounts(); return item;
    },
    decide: function (id, ok, edits) {
      var l = Approvals.list(), a = l.find(function (x) { return x.id === id; }); if (!a || a.status !== 'offen') return;
      if (edits) Object.assign(a.payload, edits);
      if (ok) { var res = execute(a); if (res === false) return; a.result = res || ''; }
      a.status = ok ? 'freigegeben' : 'abgelehnt'; a.decidedAt = new Date().toISOString(); write(AK, l);
      log(ok ? 'freigabe' : 'ablehnung', (ok ? 'Freigegeben: ' : 'Abgelehnt: ') + a.title + (a.result ? ' → ' + a.result : '')); paintCounts(); render();
    }
  };
  // Nur diese Aktionen kann Bao vorschlagen. Jede wird erst nach Freigabe ausgeführt und protokolliert.
  function execute(a) {
    var p = a.payload || {};
    if (a.type === 'create_task') { var t = Tasks.add({ title: p.title || a.title, due: p.due, priority: p.priority, notes: p.reason || p.notes || '', source: a.source === 'eingang' ? 'eingang' : 'bao', ref: p.ref }); return t ? 'Aufgabe angelegt' : false; }
    if (a.type === 'record_purchase') {
      var total = Number(String(p.amount).replace(',', '.'));
      if (!Number.isFinite(total) || total < 0) { alert('Bitte einen gültigen Betrag eintragen.'); return false; }
      if (!p.name || !String(p.name).trim()) { alert('Bitte eine Bezeichnung eintragen.'); return false; }
      var rows = R.batches(); rows.push({ id: 'batch_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6), name: String(p.name).trim().slice(0, 80), date: /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : today(), total: total, proof: String(p.proof || 'Beleg aus dem Bao-Eingang').slice(0, 120), createdAt: new Date().toISOString() });
      R.setBatches(rows); return 'Einkaufscharge ' + eur(total) + ' angelegt';
    }
    if (a.type === 'draft_reply') { try { navigator.clipboard.writeText(p.text || a.detail); } catch (e) {} return 'Antwortentwurf kopiert (nicht gesendet)'; }
    return 'Zur Kenntnis genommen';
  }

  /* =============== Schnelle Antworten aus RVO-Daten (ohne KI-Kosten) =============== */
  function row(a, extra) { return '<li><b>' + esc(nameOf(a)) + '</b>' + (a.sku ? ' <small>' + esc(a.sku) + '</small>' : '') + ' – ' + extra + '</li>'; }
  var SKILLS = [
    { re: /(am längsten|lange[n]? im (bestand|lager)|ladenhüter|älteste[n]? artikel|liegen.*(lange|längsten))/i, run: function (F) {
      var l = F.stock.filter(function (a) { return age(a) !== null; }).sort(function (a, b) { return age(b) - age(a); });
      if (!F.stock.length) return 'Du hast aktuell keine aktiven Artikel im Bestand.';
      if (!l.length) return 'Bei deinen Artikeln fehlt das Einkaufs- bzw. Anlagedatum. Ohne Datum kann ich die Lagerdauer nicht berechnen.';
      var sd = staleDays(), stale = l.filter(function (a) { return age(a) > sd; }), cap = stale.reduce(function (n, a) { return n + (Number(a.cost) || 0); }, 0);
      var noDate = F.stock.length - l.length;
      return '<p>Am längsten liegen bei dir:</p><ol>' + l.slice(0, 5).map(function (a) { return row(a, '<b>' + age(a) + ' Tage</b>, EK ' + eur(a.cost) + (priceOf(a) ? ', Preis ' + eur(priceOf(a)) : ', <span class="neg">kein Preis</span>') + ', ' + esc(a.articleStatus || 'Entwurf')); }).join('') + '</ol>' +
        '<p><b>' + stale.length + '</b> Artikel liegen länger als ' + sd + ' Tage und binden <b>' + eur(cap) + '</b> Einkaufskapital.' + (noDate ? ' Bei ' + noDate + ' Artikeln fehlt das Datum.' : '') + '</p>' +
        (stale.length ? '<p>Mein Rat: Erst prüfen, ob sie überhaupt online sind. Dann Preis senken oder bündeln – gebundenes Geld bringt dir nichts.</p>' : '');
    }, propose: function (F) { var sd = staleDays(), n = F.stock.filter(function (a) { return (age(a) || 0) > sd; }).length; return n ? [{ type: 'create_task', title: n + ' Ladenhüter prüfen: Preis, Fotos, online?', payload: { title: n + ' Ladenhüter prüfen: Preis, Fotos, online?', priority: 'mittel', due: '' }, detail: 'Artikel älter als ' + sd + ' Tage' }] : []; } },
    { re: /(gewinn|umsatz|verdient).*(monat)|(monat).*(gewinn|umsatz|verdient)|wie viel (gewinn|umsatz)/i, run: function (F) {
      var m = months(F, 2), cur = m[1], prev = m[0], d = new Date(), day = d.getDate(), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      if (!F.sold.length) return 'Du hast noch keine Verkäufe mit Datum erfasst. Sobald du Verkäufe speicherst, rechne ich Umsatz und Gewinn genau aus.';
      var name = d.toLocaleDateString('de-DE', { month: 'long' }), diff = cur.profit - prev.profit;
      return '<p>Im <b>' + name + '</b> bisher: <b>' + cur.sales + '</b> Verkäufe, Umsatz <b>' + eur(cur.revenue) + '</b>, Gewinn <b class="' + (cur.profit < 0 ? 'neg' : 'pos') + '">' + eur(cur.profit) + '</b>.</p>' +
        '<p>Vormonat gesamt: ' + prev.sales + ' Verkäufe, Gewinn ' + eur(prev.profit) + ' (' + (diff >= 0 ? '+' : '') + eur(diff) + ' bisher im Vergleich).' + (cur.sales ? ' Hochgerechnet auf den Monat wären das etwa ' + eur(cur.profit / day * dim) + ' – nur eine lineare Schätzung.' : '') + '</p>' +
        '<p><small>Gewinn = Verkaufspreis − Einkaufspreis − Gebühren − Versand, wie in RVO erfasst. Fixkosten sind nicht enthalten.</small></p>';
    } },
    { re: /(marge|margen|beste[nr]? (gewinn|produkt|kategorie|marke)|bringen.*meisten|lohnt sich am meisten|rentabel)/i, run: function (F) {
      if (F.sold.length < 3) return 'Für eine belastbare Margen-Auswertung brauche ich mehr Verkäufe – aktuell sind ' + F.sold.length + ' erfasst. Ab etwa 10 Verkäufen wird es aussagekräftig.';
      function grp(key) { var m = {}; F.sold.forEach(function (a) { var k = a[key] || 'ohne Angabe'; m[k] = m[k] || { k: k, n: 0, rev: 0, pro: 0, cost: 0 }; m[k].n++; m[k].rev += Number(a.sale.price) || 0; m[k].pro += profitOf(a); m[k].cost += Number(a.cost) || 0; }); return Object.values(m).filter(function (o) { return o.n >= 2; }).sort(function (a, b) { return b.pro / Math.max(1, b.n) - a.pro / Math.max(1, a.n); }); }
      function list(rows) { return rows.slice(0, 3).map(function (o) { return '<li><b>' + esc(o.k) + '</b> – Ø Gewinn ' + eur(o.pro / o.n) + ' je Verkauf, Marge ' + (o.rev ? Math.round(o.pro / o.rev * 100) : 0) + ' % (' + o.n + ' Verkäufe)</li>'; }).join(''); }
      var c = grp('category'), b = grp('brand');
      return (c.length ? '<p>Nach <b>Kategorie</b>:</p><ol>' + list(c) + '</ol>' : '') + (b.length ? '<p>Nach <b>Marke</b>:</p><ol>' + list(b) + '</ol>' : '') +
        (!c.length && !b.length ? '<p>Keine Kategorie oder Marke hat bisher mindestens 2 Verkäufe – zu wenig für einen fairen Vergleich.</p>' : '<p><small>Nur Gruppen mit mindestens 2 Verkäufen. Bei kleinen Zahlen ist der Zufall groß – nicht blind nachkaufen.</small></p>');
    } },
    { re: /(was (sollte|soll|muss) ich (als nächstes|heute|jetzt|zuerst)|nächste[nr]? schritt|was ist (heute )?wichtig|was steht an|to-?dos?\b|briefing)/i, run: function (F) {
      var b = briefing(F); return b.length ? '<p>Das ist heute wichtig:</p><ol>' + b.slice(0, 6).map(function (x) { return '<li><b>' + esc(x.t) + '</b> – ' + esc(x.s) + '</li>'; }).join('') + '</ol>' : 'Gerade ist nichts offen. Gute Zeit, um neue Ware zu fotografieren oder Preise zu prüfen.';
    } },
    { re: /(lohnt.*(einkauf|einzukaufen|nachkauf|neue ware)|neue ware|nachkaufen|(soll|sollte) ich .*einkaufen|ware einkaufen)/i, run: function (F) {
      var t = totals(F), sd = staleDays(), stale = F.stock.filter(function (a) { return (age(a) || 0) > sd; }), cap = stale.reduce(function (n, a) { return n + (Number(a.cost) || 0); }, 0), share = t.stockCost ? cap / t.stockCost : 0;
      if (!F.sold.length && !F.stock.length) return 'Ich habe noch keine Bestands- oder Verkaufsdaten. Ohne Zahlen kann ich das nicht seriös beurteilen.';
      var verdict, why = [];
      if (t.sellThrough90 !== null) why.push('Abverkaufsquote der letzten 90 Tage: ' + t.sellThrough90 + ' %');
      if (t.avgDaysToSell !== null) why.push('Ø ' + t.avgDaysToSell + ' Tage bis zum Verkauf');
      why.push(stale.length + ' Ladenhüter (> ' + sd + ' Tage) binden ' + eur(cap) + ' (' + Math.round(share * 100) + ' % des Lagerkapitals)');
      why.push(t.drafts + ' Entwürfe noch nicht fertig');
      if (share > .4 || t.drafts > 15) verdict = '<b>Eher bremsen.</b> Zu viel Kapital steckt in alter oder unfertiger Ware. Erst abverkaufen und Entwürfe online bringen.';
      else if ((t.sellThrough90 || 0) >= 50 && (t.avgDaysToSell || 99) <= 30) verdict = '<b>Ja, gezielt.</b> Deine Ware dreht schnell. Kauf bevorzugt, was sich bei dir bereits gut verkauft hat.';
      else verdict = '<b>Nur gezielt.</b> Kein Grund für Großeinkäufe – kauf nur Teile mit klarer Marge in deinen stärksten Kategorien.';
      return '<p>' + verdict + '</p><ul>' + why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul><p><small>Ich kenne nur deine RVO-Daten, keine aktuellen Marktpreise. Die Entscheidung liegt bei dir.</small></p>';
    } }
  ];
  function briefing(F) {
    var out = [], sd = staleDays(), od = Tasks.overdue(), td = Tasks.dueToday(), ap = Approvals.pending();
    od.slice(0, 2).forEach(function (t) { out.push({ t: t.title, s: 'überfällig seit ' + fmtDate(t.due), go: 'tasks', warn: true }); });
    td.slice(0, 2).forEach(function (t) { out.push({ t: t.title, s: 'heute fällig', go: 'tasks' }); });
    var ship = F.real.filter(function (a) { return a.sale && !a.shippedAt && a.articleStatus === 'Verkauft'; }).length;
    if (ship) out.push({ t: ship + (ship === 1 ? ' Verkauf versenden' : ' Verkäufe versenden'), s: 'verkauft, aber nicht als versendet markiert', go: 'ship', warn: true });
    if (ap.length) out.push({ t: ap.length + (ap.length === 1 ? ' Vorschlag prüfen' : ' Vorschläge prüfen'), s: 'Bao wartet auf deine Freigabe', go: 'approve' });
    var rem = F.real.filter(function (a) { try { return R.removeNeeded(a); } catch (e) { return false; } }).length;
    if (rem) out.push({ t: rem + ' Listings entfernen', s: 'verkaufte Artikel noch auf anderen Plattformen', go: 'remove', warn: true });
    var ready = F.stock.filter(function (a) { return a.articleStatus === 'Bereit'; }).length;
    if (ready) out.push({ t: ready + ' bereite Artikel online stellen', s: 'fertig, aber noch nicht online', go: 'stock' });
    var stale = F.stock.filter(function (a) { return (age(a) || 0) > sd; });
    if (stale.length) out.push({ t: stale.length + ' Ladenhüter prüfen', s: eur(stale.reduce(function (n, a) { return n + (Number(a.cost) || 0); }, 0)) + ' gebunden, älter als ' + sd + ' Tage', go: 'stale' });
    var drafts = F.stock.filter(function (a) { return a.articleStatus === 'Entwurf'; }).length;
    if (drafts) out.push({ t: drafts + ' Entwürfe fertigstellen', s: 'Fotos, Texte oder Preise fehlen', go: 'drafts' });
    var nOpen = Tasks.open().length - od.length - td.length;
    if (nOpen > 0) out.push({ t: nOpen + ' weitere offene Aufgaben', s: 'in deiner Aufgabenliste', go: 'tasks' });
    return out;
  }
  function briefingGo(k) {
    var stock = function () { try { $('searchArticles').value = ''; } catch (e) {} R.go('stock'); };
    if (k === 'tasks' || k === 'approve' || k === 'inbox') { R.showChat(); setTab(k); return; }
    if (k === 'ship') { stock(); setTimeout(function () { try { R.stockFilter('sale'); } catch (e) {} }, 60); return; }
    if (k === 'remove') { stock(); setTimeout(function () { var b = doc.querySelector('[data-stock-filter="remove"]'); b && b.click(); }, 60); return; }
    if (k === 'drafts') { stock(); setTimeout(function () { var b = doc.querySelector('[data-stock-filter="draft"]'); b && b.click(); }, 60); return; }
    if (k === 'stale') { stock(); setTimeout(function () { try { R.stockFilter(''); $('v5Sort').value = 'days'; R.renderLibrary(); } catch (e) {} }, 60); return; }
    stock();
  }

  /* =============== Chat-Anbindung =============== */
  var origRun = null, LOCAL_CMD = /^(öffne|zeig|zeige|starte|mach|erstelle\s+(ein\s+)?backup|backup|sync|synchronisier|neuen?\s+artikel|neues?\s+(produkt|listing))/i;
  function busy(on) { R.setBusy(on); }
  function isBusy() { return R.isBusy(); }
  async function localAnswer(text) {
    var sk = SKILLS.find(function (s) { return s.re.test(text); }); if (!sk) return false;
    var F = await facts(), html = sk.run(F);
    if (F.demo && F.real.length === 0) html += '<p><small>Hinweis: Nur Beispielartikel vorhanden – die ignoriere ich bewusst.</small></p>';
    else if (F.demo) html += '<p><small>' + F.demo + ' Beispielartikel sind nicht eingerechnet.</small></p>';
    var props = sk.propose ? sk.propose(F) : [];
    props.forEach(function (p) { Approvals.add(Object.assign({ source: 'bao' }, p)); });
    if (props.length) html += '<p class="rvo-note">' + props.length + ' Vorschlag wartet unter <button type="button" class="rvo-link" data-rvo-go="approve">Freigaben</button>.</p>';
    R.message('assistant', html, { label: 'Bao · aus deinen RVO-Daten' });
    log('antwort', 'Lokale Antwort ohne KI: ' + text.slice(0, 80));
    return true;
  }
  async function remote(text, opts) {
    opts = opts || {};
    var token = R.aiPassword(), endpoint = R.aiEndpoint(), provider = R.aiProvider();
    if (!token) return origRun(text, opts);
    if (isBusy()) { R.message('assistant', 'Eine KI-Anfrage läuft bereits. Warte bitte auf die Antwort.', { plain: true, label: 'RV lokal' }); return; }
    var hist = [];
    try { hist = R.chatHistory().filter(function (m) { return !m.local && !m.error; }).slice(-8).map(function (m) { return { role: m.role === 'user' ? 'user' : 'assistant', text: String(m.text).replace(/<[^>]+>/g, ' ').slice(0, 1200) }; }); } catch (e) {}
    R.message('user', opts.display || text);
    ['homeAiInput', 'chatInput'].forEach(function (id) { if ($(id)) $(id).value = ''; });
    var article = null;
    try { var cid = R.chatContextId(); if (cid) { var a = (await R.allArticles()).find(function (x) { return x.id === cid; }); if (a) article = { sku: a.sku, marke: a.brand, modell: a.model, kategorie: a.category, groesse: a.size, farbe: a.color, material: a.material, zustand: a.condition, maengel: String(a.notes || '').slice(0, 400), masse: a.measurements, ek: Number(a.cost) || 0, preise: a.prices || {}, status: a.articleStatus, tageImLager: age(a), verkauft: a.sale ? { preis: a.sale.price, plattform: a.sale.platform } : null }; } } catch (e) {}
    busy(true); R.aiState('busy', 'Bao denkt nach …');
    var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 75000);
    try {
      var snap = await snapshot();
      var res = await fetch(endpoint + '/api/bao', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-RV-Password': token, 'X-RV-Provider': provider }, body: JSON.stringify({ message: text, history: hist, snapshot: snap, article: article }), signal: ctl.signal });
      if (res.status === 404 || res.status === 405) { // älterer Server ohne /api/bao: bisheriger KI-Chat
        clearTimeout(to); busy(false); R.aiState('ready', '');
        try { R.chatDropLastUser(); } catch (e) {}
        return origRun(text, opts);
      }
      var data = await res.json().catch(function () { return null; });
      if (!res.ok) { var er = Error([data && data.error, data && data.detail].filter(Boolean).join(' ') || 'HTTP ' + res.status); er.status = res.status; throw er; }
      if (!data || typeof data.reply !== 'string') throw Error('Der Server hat keine Antwort geliefert.');
      cost('bao', data.usage);
      R.message('assistant', data.reply, { plain: true, label: 'Bao' });
      var acts = Array.isArray(data.actions) ? data.actions : [];
      acts.forEach(function (a) { if (a.type === 'create_task') Approvals.add({ type: 'create_task', title: a.title, detail: a.reason || '', payload: { title: a.title, due: a.due, priority: a.priority, reason: a.reason }, source: 'bao' }); });
      if (acts.length) R.message('assistant', '<p class="rvo-note">' + (acts.length === 1 ? 'Ich habe 1 Aufgabe vorgeschlagen' : 'Ich habe ' + acts.length + ' Aufgaben vorgeschlagen') + '. Sie werden erst angelegt, wenn du sie unter <button type="button" class="rvo-link" data-rvo-go="approve">Freigaben</button> bestätigst.</p>', { label: 'RV lokal' });
      log('ki', 'Bao-Antwort' + (data.tools && data.tools.length ? ' mit Werkzeugen: ' + data.tools.join(', ') : '') + (data.usage && data.usage.usd != null ? ' · ca. ' + (data.usage.usd * 100).toFixed(3) + ' US-Cent' : ''));
      R.aiState('ready', 'Bao ist verbunden.');
      if (data.budget) write('rvo_budget', Object.assign({ t: Date.now() }, data.budget));
    } catch (error) {
      var reason = error.name === 'AbortError' ? 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.' : error.message || 'Netzwerkfehler', msg = 'KI-Anfrage fehlgeschlagen: ' + reason;
      R.message('assistant', msg, { plain: true });
      R.aiState(error.status === 401 || /(?:API_KEY|RV_SYNC_PASSWORD).*fehlt/.test(reason) ? 'setup' : 'error', msg);
    } finally { clearTimeout(to); busy(false); }
  }
  async function hookedRun(raw, opts, orig) {
    origRun = orig; opts = opts || {};
    var input = raw !== undefined ? null : doc.activeElement === $('chatInput') ? $('chatInput') : $('homeAiInput');
    var text = String(raw !== undefined ? raw : (input && input.value) || ($('homeAiInput') && $('homeAiInput').value) || '').trim();
    if (!text || LOCAL_CMD.test(text)) return origRun(raw, opts);
    if (!opts.extra && await localAnswerGuard(text)) { if (input) input.value = ''; return; }
    return remote(text, opts);
  }
  async function localAnswerGuard(text) {
    if (!SKILLS.some(function (s) { return s.re.test(text); })) return false;
    R.message('user', text); ['homeAiInput', 'chatInput'].forEach(function (id) { if ($(id)) $(id).value = ''; });
    R.aiState('busy', 'Bao rechnet …');
    try { await localAnswer(text); } catch (e) { R.message('assistant', 'Ich konnte deine Daten nicht auswerten: ' + e.message, { plain: true, label: 'RV lokal' }); }
    R.aiState('ready', 'Bao hat aus deinen Daten geantwortet.');
    return true;
  }
  doc.addEventListener('click', function (e) { var b = e.target.closest('[data-rvo-go]'); if (!b) return; e.preventDefault(); briefingGo(b.dataset.rvoGo); });

  /* =============== Eingang: Dokumente, Fotos, Screenshots, Texte =============== */
  var IK = 'rvo_inbox_v1';
  var DOC_LABEL = { kassenbon: 'Kassenbon', rechnung: 'Rechnung', behoerdenbrief: 'Behördenbrief', brief: 'Brief', kundennachricht: 'Kundennachricht', screenshot: 'Screenshot', versand: 'Versand', sonstiges: 'Sonstiges' };
  function readFile(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; r.readAsDataURL(f); }); }
  function shrink(dataUrl, max, q) { return new Promise(function (ok) { var im = new Image(); im.onload = function () { var s = Math.min(1, max / Math.max(im.width, im.height)), c = doc.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', q)); }; im.onerror = function () { ok(''); }; im.src = dataUrl; }); }
  var inboxBusy = false;
  async function analyse(file, text, note) {
    if (inboxBusy) return; var token = R.aiPassword(); var msg = $('rvoInMsg');
    if (!token) { msg.textContent = 'Für den Eingang brauchst du dein RV-Kennwort (wie beim KI-Chat). Einstellungen → KI oder Cloud verbinden.'; return; }
    var body = { note: note || '' }, entry = { id: uid('in'), t: Date.now(), name: '', kind: 'text', thumb: '' };
    try {
      if (file) {
        entry.name = file.name || 'Datei';
        if (file.type === 'application/pdf') { if (file.size > 10e6) { msg.textContent = 'PDF ist zu groß (max. 10 MB).'; return; } body.file = await readFile(file); body.filename = file.name; entry.kind = 'pdf'; }
        else if (/^image\//.test(file.type)) { var raw = await readFile(file); body.file = await shrink(raw, 1800, .86); entry.thumb = await shrink(raw, 220, .7); entry.kind = 'bild'; if (!body.file) { msg.textContent = 'Das Bild konnte nicht gelesen werden.'; return; } }
        else { msg.textContent = 'Bitte ein Foto, einen Screenshot oder eine PDF wählen.'; return; }
      } else if (text) { body.text = text; entry.name = text.slice(0, 40); }
      else { msg.textContent = 'Wähle eine Datei oder füge einen Text ein.'; return; }
    } catch (e) { msg.textContent = 'Datei konnte nicht gelesen werden: ' + e.message; return; }
    inboxBusy = true; $('rvoInGo').disabled = true; msg.textContent = 'Bao schaut sich das an …';
    try { RVBao && RVBao.state('think'); } catch (e) {}
    try {
      var res = await fetch(R.aiEndpoint() + '/api/bao/doc', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-RV-Password': token }, body: JSON.stringify(body) });
      var data = await res.json().catch(function () { return null; });
      if (res.status === 404) throw Error('Der Server kennt den Eingang noch nicht. Bitte die neue Version veröffentlichen.');
      if (!res.ok) throw Error([data && data.error, data && data.detail].filter(Boolean).join(' ') || 'HTTP ' + res.status);
      entry.analysis = data.analysis; entry.usage = data.usage; cost('eingang', data.usage);
      var l = read(IK, []); l.unshift(entry); while (!write(IK, l.slice(0, 60)) && l.length > 1) { l.pop(); entry.thumb = ''; }
      (data.analysis.suggested_actions || []).forEach(function (s) { proposeFromDoc(s, data.analysis, entry); });
      log('eingang', DOC_LABEL[data.analysis.doc_type] + ' ausgewertet: ' + data.analysis.title);
      msg.textContent = '✓ Eingeordnet als ' + DOC_LABEL[data.analysis.doc_type] + '.'; $('rvoInText').value = ''; $('rvoInNote').value = ''; $('rvoInFile').value = ''; $('rvoInPick').textContent = 'Foto, Screenshot oder PDF wählen';
      try { RVBao && RVBao.state('happy'); setTimeout(function () { RVBao.state(''); }, 1300); } catch (e) {}
      render();
    } catch (e) { msg.textContent = 'Auswertung fehlgeschlagen: ' + e.message; try { RVBao && RVBao.state(''); } catch (er) {} }
    finally { inboxBusy = false; $('rvoInGo').disabled = false; }
  }
  function proposeFromDoc(s, A, entry) {
    var sure = function (x) { return x && x.certain; }, amt = (A.amounts || []).find(sure), dl = (A.dates || []).find(function (d) { return d.is_deadline; });
    if (s.type === 'record_purchase') Approvals.add({ type: 'record_purchase', title: s.title || 'Einkauf erfassen', detail: s.detail || A.summary, source: 'eingang', payload: { name: A.sender || A.title || 'Einkauf', date: (A.dates || []).map(function (d) { return d.date; }).find(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); }) || today(), amount: s.amount != null ? s.amount : amt ? amt.amount : '', proof: 'Bao-Eingang: ' + (entry.name || A.title), uncertain: !(amt && s.amount != null && amt.amount === s.amount) } });
    else if (s.type === 'create_task') Approvals.add({ type: 'create_task', title: s.title, detail: s.detail + (dl && !dl.certain ? ' · Frist unsicher – im Original prüfen.' : ''), source: 'eingang', payload: { title: s.title, due: /^\d{4}-\d{2}-\d{2}$/.test(s.due_date || '') ? s.due_date : '', priority: dl ? 'hoch' : 'mittel', reason: s.detail, ref: entry.id } });
    else if (s.type === 'draft_reply' && A.reply_draft) Approvals.add({ type: 'draft_reply', title: s.title || 'Antwort an Kunden', detail: A.reply_draft, source: 'eingang', payload: { text: A.reply_draft } });
  }

  /* =============== Oberfläche: Bao-Bereich =============== */
  var tab = 'talk';
  function setTab(t) {
    tab = t; try { R.setBaoTab(t); } catch (e) {}
    var hub = $('rvoHub'), grid = doc.querySelector('#aiChat .ch-grid');
    if (grid) grid.hidden = t !== 'talk'; if (hub) { hub.hidden = t === 'talk'; hub.dataset.tab = t; }
    render(); if (t !== 'talk') window.scrollTo(0, 0);
  }
  doc.addEventListener('rvo:bao-tab', function (e) { setTab(e.detail.tab); });
  R.hooks.afterShowChat.push(function () { setTab(tab); });

  function build() {
    var chat = $('aiChat'), top = chat && chat.querySelector('.sx-top'); if (!top || $('rvoHub')) return;
    var hub = doc.createElement('div'); hub.id = 'rvoHub'; hub.className = 'rvo-hub'; hub.hidden = true;
    hub.innerHTML =
      '<section class="sx-panel rvo-p" data-show="tasks" aria-label="Aufgaben">' +
        '<div class="sx-ph"><span class="sx-hx">' + ico('<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5 2.5-2.5"/>') + '</span><div class="sx-tt"><h2 class="sx-title">Aufgaben</h2><span class="sx-sub" id="rvoTaskSub">Deine To-dos und Baos Vorschläge</span></div><button type="button" class="sx-btn" id="rvoSuggest">Bao, schlag was vor</button></div>' +
        '<form class="rvo-add" id="rvoAdd"><input id="rvoAddTitle" placeholder="Neue Aufgabe …" maxlength="160" aria-label="Neue Aufgabe" autocomplete="off"><input type="date" id="rvoAddDue" aria-label="Fällig am"><select id="rvoAddPrio" aria-label="Priorität"><option value="hoch">Hoch</option><option value="mittel" selected>Mittel</option><option value="niedrig">Niedrig</option></select><button type="submit" class="sx-btn rvo-primary">Hinzufügen</button></form>' +
        '<div id="rvoTaskList" class="rvo-list"></div>' +
      '</section>' +
      '<section class="sx-panel rvo-p" data-show="inbox" aria-label="Eingang">' +
        '<div class="sx-ph"><span class="sx-hx">' + ico('<path d="M4 13h4l2 3h4l2-3h4"/><path d="M5 5h14l1 8v6H4v-6Z"/>') + '</span><div class="sx-tt"><h2 class="sx-title">Eingang</h2><span class="sx-sub">Schick Bao ein Foto, einen Beleg, einen Brief, eine PDF oder einen Text</span></div></div>' +
        '<div class="rvo-drop" id="rvoDrop"><input type="file" id="rvoInFile" accept="image/*,application/pdf" hidden><button type="button" class="rvo-pick" id="rvoInPick">Foto, Screenshot oder PDF wählen</button>' +
        '<textarea id="rvoInText" rows="3" placeholder="… oder Text einfügen, z. B. eine Kundennachricht" maxlength="20000"></textarea>' +
        '<input id="rvoInNote" placeholder="Hinweis für Bao (optional)" maxlength="500"><button type="button" class="sx-btn rvo-primary" id="rvoInGo">Bao, schau mal</button><p class="rvo-msg" id="rvoInMsg" role="status"></p>' +
        '<p class="sx-note">Bao liest nur. Beträge und Fristen übernimmt er nur, wenn sie eindeutig lesbar sind – sonst markiert er sie als unsicher. Keine Rechts- oder Steuerberatung. Jede Auswertung kostet wenige Cent KI-Budget.</p></div>' +
        '<div id="rvoInList" class="rvo-list"></div>' +
      '</section>' +
      '<section class="sx-panel rvo-p" data-show="approve" aria-label="Freigaben">' +
        '<div class="sx-ph"><span class="sx-hx">' + ico('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>') + '</span><div class="sx-tt"><h2 class="sx-title">Freigaben</h2><span class="sx-sub">Bao ändert nichts ohne dein OK</span></div></div>' +
        '<div id="rvoApList" class="rvo-list"></div>' +
      '</section>' +
      '<section class="sx-panel rvo-p" data-show="approve" aria-label="Kosten und Protokoll">' +
        '<div class="sx-ph"><span class="sx-hx">' + ico('<ellipse cx="12" cy="6" rx="6" ry="2.5"/><path d="M6 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6M6 10v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/>') + '</span><div class="sx-tt"><h2 class="sx-title">KI-Kosten & Protokoll</h2><span class="sx-sub">Transparenz über Anfragen und Aktionen</span></div><button type="button" class="sx-btn" id="rvoCostRefresh">Server prüfen</button></div>' +
        '<div id="rvoCost" class="rvo-cost"></div><details class="rvo-log"><summary>Protokoll anzeigen</summary><div id="rvoLog"></div></details>' +
      '</section>';
    top.after(hub);
    $('rvoAdd').onsubmit = function (e) { e.preventDefault(); var t = Tasks.add({ title: $('rvoAddTitle').value, due: $('rvoAddDue').value, priority: $('rvoAddPrio').value, source: 'du' }); if (t) { $('rvoAddTitle').value = ''; $('rvoAddDue').value = ''; render(); } };
    $('rvoSuggest').onclick = suggest;
    $('rvoInPick').onclick = function () { $('rvoInFile').click(); };
    $('rvoInFile').onchange = function () { var f = this.files && this.files[0]; $('rvoInPick').textContent = f ? '📎 ' + f.name : 'Foto, Screenshot oder PDF wählen'; };
    $('rvoInGo').onclick = function () { analyse($('rvoInFile').files && $('rvoInFile').files[0], $('rvoInText').value.trim(), $('rvoInNote').value.trim()); };
    var drop = $('rvoDrop');
    ['dragover', 'dragenter'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) analyse(f, '', $('rvoInNote').value.trim()); });
    $('rvoCostRefresh').onclick = serverUsage;
    hub.addEventListener('click', onHubClick);
  }
  async function suggest() {
    var F = await facts(), b = briefing(F).filter(function (x) { return x.go !== 'tasks' && x.go !== 'approve'; }), have = Approvals.pending().map(function (a) { return a.title; }).concat(Tasks.open().map(function (t) { return t.title; })), n = 0;
    b.slice(0, 4).forEach(function (x) { if (have.indexOf(x.t) >= 0) return; Approvals.add({ type: 'create_task', title: x.t, detail: x.s, source: 'bao', payload: { title: x.t, priority: x.warn ? 'hoch' : 'mittel', due: x.warn ? today() : '', reason: x.s } }); n++; });
    R.toast(n ? '✓ ' + n + ' Vorschläge unter Freigaben' : 'Keine neuen Vorschläge – alles im Blick.');
    if (n) setTab('approve');
  }
  function onHubClick(e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var id = b.dataset.id, act = b.dataset.act;
    if (act === 'toggle') Tasks.toggle(id);
    else if (act === 'del' && confirm('Aufgabe löschen?')) Tasks.remove(id);
    else if (act === 'ok' || act === 'no') {
      var card = b.closest('.rvo-ap'), edits = {};
      if (card) card.querySelectorAll('[data-edit]').forEach(function (i) { edits[i.dataset.edit] = i.value; });
      Approvals.decide(id, act === 'ok', edits);
    }
    else if (act === 'copy') { var en = read(IK, []).find(function (x) { return x.id === id; }); if (en) R.copy(en.analysis.reply_draft, b); return; }
    else if (act === 'indel') { write(IK, read(IK, []).filter(function (x) { return x.id !== id; })); }
    render();
  }
  function prioTag(p) { return '<i class="rvo-prio ' + esc(p) + '" title="Priorität ' + esc(p) + '"></i>'; }
  function renderTasks() {
    var root = $('rvoTaskList'); if (!root) return;
    var d = today(), open = Tasks.open().sort(function (a, b) { var pa = { hoch: 0, mittel: 1, niedrig: 2 }; return (a.due || '9999') .localeCompare(b.due || '9999') || pa[a.priority] - pa[b.priority]; }), done = Tasks.list().filter(function (t) { return t.done; }).sort(function (a, b) { return String(b.doneAt).localeCompare(String(a.doneAt)); });
    var item = function (t) {
      var od = t.due && t.due < d && !t.done, tod = t.due === d;
      return '<div class="rvo-task' + (t.done ? ' done' : '') + (od ? ' late' : '') + '"><button type="button" class="rvo-ck" data-act="toggle" data-id="' + esc(t.id) + '" aria-label="' + (t.done ? 'Wieder öffnen' : 'Erledigt') + '">' + (t.done ? '✓' : '') + '</button>' +
        '<span class="nm"><b>' + prioTag(t.priority) + esc(t.title) + '</b><small>' + [t.due ? (od ? 'überfällig · ' : tod ? 'heute · ' : '') + fmtDate(t.due) : '', t.source === 'bao' ? 'von Bao' : t.source === 'eingang' ? 'aus dem Eingang' : '', t.notes ? esc(t.notes).slice(0, 90) : ''].filter(Boolean).join(' · ') + '</small></span>' +
        '<button type="button" class="rvo-x" data-act="del" data-id="' + esc(t.id) + '" aria-label="Löschen">×</button></div>';
    };
    var ap = Approvals.pending().filter(function (a) { return a.type === 'create_task'; }).length;
    root.innerHTML = (ap ? '<button type="button" class="rvo-banner" data-rvo-go="approve">Bao hat ' + ap + (ap === 1 ? ' Vorschlag' : ' Vorschläge') + ' für dich – jetzt prüfen ›</button>' : '') +
      (open.length ? open.map(item).join('') : '<p class="hm-empty">Keine offenen Aufgaben. Leg oben eine an oder lass dir von Bao etwas vorschlagen.</p>') +
      (done.length ? '<details class="rvo-done"><summary>Erledigt (' + done.length + ')</summary>' + done.slice(0, 25).map(item).join('') + '</details>' : '');
    var s = $('rvoTaskSub'); if (s) s.textContent = open.length + ' offen' + (Tasks.overdue().length ? ' · ' + Tasks.overdue().length + ' überfällig' : '');
  }
  function renderInbox() {
    var root = $('rvoInList'); if (!root) return; var l = read(IK, []);
    root.innerHTML = l.length ? l.map(function (en) {
      var A = en.analysis || {}, legal = A.legal_or_tax;
      return '<article class="rvo-doc">' + (en.thumb ? '<img src="' + esc(en.thumb) + '" alt="">' : '<span class="rvo-doc-ic">' + (en.kind === 'pdf' ? 'PDF' : 'TXT') + '</span>') +
        '<div class="bd"><div class="hd"><span class="rvo-chip">' + esc(DOC_LABEL[A.doc_type] || 'Dokument') + '</span><b>' + esc(A.title || en.name) + '</b><small>' + new Date(en.t).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) + (A.sender ? ' · ' + esc(A.sender) : '') + '</small></div>' +
        (legal ? '<p class="rvo-warn">Rechtlicher oder steuerlicher Inhalt: Bao fasst nur zusammen. Fristen und Beträge bitte im Original prüfen und im Zweifel Fachleute fragen.</p>' : '') +
        '<p>' + esc(A.summary) + '</p>' +
        ((A.amounts || []).length ? '<ul class="rvo-facts">' + A.amounts.map(function (x) { return '<li><span>' + esc(x.label) + '</span><b>' + (x.amount != null ? eur(x.amount) : '—') + '</b>' + (x.certain ? '' : '<em>unsicher – prüfen</em>') + '</li>'; }).join('') + '</ul>' : '') +
        ((A.dates || []).length ? '<ul class="rvo-facts">' + A.dates.map(function (x) { return '<li' + (x.is_deadline ? ' class="dl"' : '') + '><span>' + esc(x.label) + (x.is_deadline ? ' (Frist)' : '') + '</span><b>' + (x.date ? fmtDate(x.date) || esc(x.date) : '—') + '</b>' + (x.certain ? '' : '<em>unsicher – prüfen</em>') + '</li>'; }).join('') + '</ul>' : '') +
        ((A.uncertainties || []).length ? '<p class="rvo-unsure"><b>Unklar:</b> ' + A.uncertainties.map(esc).join(' · ') + '</p>' : '') +
        (A.reply_draft ? '<div class="rvo-reply"><small>Antwortentwurf (wird nicht gesendet)</small><p>' + esc(A.reply_draft).replace(/\n/g, '<br>') + '</p><button type="button" class="sx-btn" data-act="copy" data-id="' + esc(en.id) + '">Kopieren</button></div>' : '') +
        '<div class="ft"><small>' + (en.usage && en.usage.usd != null ? 'ca. ' + (en.usage.usd * 100).toFixed(2) + ' US-Cent' : '') + '</small><button type="button" class="rvo-x" data-act="indel" data-id="' + esc(en.id) + '" aria-label="Aus dem Eingang entfernen">×</button></div></div></article>';
    }).join('') : '<p class="hm-empty">Noch nichts im Eingang.</p>';
  }
  var AP_LABEL = { create_task: 'Aufgabe anlegen', record_purchase: 'Einkauf erfassen', draft_reply: 'Antwortentwurf' };
  function renderApprovals() {
    var root = $('rvoApList'); if (!root) return;
    var l = Approvals.list(), open = l.filter(function (a) { return a.status === 'offen'; }), past = l.filter(function (a) { return a.status !== 'offen'; }).slice(0, 15);
    var card = function (a) {
      var p = a.payload || {}, ed = '';
      if (a.status === 'offen') {
        if (a.type === 'create_task') ed = '<div class="rvo-ed"><input data-edit="title" value="' + esc(p.title || a.title) + '" aria-label="Titel"><input type="date" data-edit="due" value="' + esc(p.due || '') + '" aria-label="Fällig"><select data-edit="priority" aria-label="Priorität">' + ['hoch', 'mittel', 'niedrig'].map(function (x) { return '<option' + (x === (p.priority || 'mittel') ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>';
        if (a.type === 'record_purchase') ed = '<div class="rvo-ed"><input data-edit="name" value="' + esc(p.name || '') + '" placeholder="Bezeichnung / Quelle" aria-label="Bezeichnung"><input type="date" data-edit="date" value="' + esc(p.date || '') + '" aria-label="Datum"><input data-edit="amount" inputmode="decimal" value="' + esc(p.amount == null ? '' : String(p.amount).replace('.', ',')) + '" placeholder="Betrag €" aria-label="Betrag"></div>' + (p.uncertain ? '<p class="rvo-warn">Betrag war nicht eindeutig lesbar – bitte mit dem Beleg vergleichen.</p>' : '');
      }
      return '<article class="rvo-ap ' + esc(a.status) + '"><div class="hd"><span class="rvo-chip">' + esc(AP_LABEL[a.type] || a.type) + '</span><b>' + esc(a.title) + '</b><small>' + (a.source === 'eingang' ? 'aus dem Eingang' : 'von Bao') + ' · ' + new Date(a.createdAt).toLocaleDateString('de-DE') + (a.status !== 'offen' ? ' · ' + esc(a.status) + (a.result ? ': ' + esc(a.result) : '') : '') + '</small></div>' +
        (a.detail ? '<p>' + esc(a.detail).replace(/\n/g, '<br>') + '</p>' : '') + ed +
        (a.status === 'offen' ? '<div class="rvo-acts"><button type="button" class="sx-btn rvo-primary" data-act="ok" data-id="' + esc(a.id) + '">' + (a.type === 'draft_reply' ? 'Kopieren & erledigt' : 'Freigeben') + '</button><button type="button" class="sx-btn" data-act="no" data-id="' + esc(a.id) + '">Ablehnen</button></div>' : '') + '</article>';
    };
    root.innerHTML = (open.length ? open.map(card).join('') : '<p class="hm-empty">Nichts wartet auf deine Freigabe.</p>') + (past.length ? '<details class="rvo-done"><summary>Entschieden (' + past.length + ')</summary>' + past.map(card).join('') + '</details>' : '');
  }
  async function serverUsage() {
    var token = R.aiPassword(), box = $('rvoCost'); if (!token) { renderCost(null, 'Ohne RV-Kennwort kann ich den Server nicht fragen.'); return; }
    try { var r = await fetch(R.aiEndpoint() + '/api/bao/usage', { headers: { 'X-RV-Password': token } }); if (r.status === 404) { renderCost(null, 'Der Server kennt die Kostenübersicht noch nicht (neue Version nicht veröffentlicht).'); return; } var j = await r.json(); if (!r.ok) throw Error(j.error || 'HTTP ' + r.status); write('rvo_server_usage', Object.assign({ t: Date.now() }, j)); renderCost(j); }
    catch (e) { renderCost(null, 'Serverabfrage fehlgeschlagen: ' + e.message); }
    void box;
  }
  function renderCost(server, err) {
    var box = $('rvoCost'); if (!box) return; server = server || read('rvo_server_usage', null); var m = costMonth();
    var srv = server ? (server.enforced ? '<li><span>Server (alle KI-Anfragen, ' + esc(server.month) + ')</span><b>' + Number(server.spent || 0).toFixed(2) + ' $ von ' + server.limit + ' $</b><em class="ok">Sperre aktiv</em></li>' : '<li><span>Server</span><b>' + (server.spent != null ? Number(server.spent).toFixed(2) + ' $' : 'keine Zählung') + '</b><em>keine Sperre aktiv</em></li>') + '<li><span>Modell</span><b>' + esc(server.model) + '</b></li>' : '';
    box.innerHTML = '<ul class="rvo-facts"><li><span>Dieses Gerät, dieser Monat</span><b>' + m.n + ' Anfragen · ca. ' + m.usd.toFixed(3) + ' $</b></li>' + srv + '</ul>' +
      (err ? '<p class="rvo-msg">' + esc(err) + '</p>' : '') +
      '<p class="sx-note">Kosten sind Schätzungen aus Tokenzahlen × Listenpreis (OpenAI, Stand 16.10.2026). ' + (server && server.enforced ? 'Der Server sperrt neue KI-Anfragen, sobald die geschätzte Monatssumme die Grenze erreicht (AI_MONTHLY_LIMIT_USD).' : 'Eine garantierte Ausgabensperre besteht nur, wenn der Server die Sperre meldet.') + ' Zusätzlich empfohlen: ein Budget-Limit im OpenAI-Projekt.</p>';
    var lg = $('rvoLog'); if (lg) lg.innerHTML = read(LOG, []).slice(0, 80).map(function (x) { return '<div><small>' + new Date(x.t).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) + '</small> ' + esc(x.text) + '</div>'; }).join('') || '<p class="hm-empty">Noch keine Einträge.</p>';
  }
  function paintCounts() {
    var set = function (id, n, warn) { var e = $(id); if (!e) return; e.textContent = n ? String(n) : ''; e.hidden = !n; if (e.classList) e.classList.toggle('warn', !!warn); };
    var ap = Approvals.pending().length, od = Tasks.overdue().length, op = Tasks.open().length;
    set('rvoBadgeBao', ap + od, od > 0); set('rvnTaskN', op, od > 0); set('rvnApproveN', ap, false); set('rvnInboxN', 0);
  }
  function render() { paintCounts(); if (!$('rvoHub')) return; if (tab === 'tasks') renderTasks(); if (tab === 'inbox') renderInbox(); if (tab === 'approve') { renderApprovals(); renderCost(); } }

  /* =============== Startseite: Baos Briefing =============== */
  async function renderBrief() {
    var root = $('hmBrief'); if (!root) return;
    var F; try { F = await facts(); } catch (e) { return; }
    var b = briefing(F), m = months(F, 2), cur = m[1], prev = m[0], t = totals(F);
    var hello = (function () { var h = new Date().getHours(); return h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend'; })();
    var name = ''; try { name = R.settings().name || ''; } catch (e) {}
    var kpi = '<div class="rvo-kpis"><div><small>Gewinn ' + new Date().toLocaleDateString('de-DE', { month: 'long' }) + '</small><b class="' + (cur.profit < 0 ? 'neg' : cur.profit > 0 ? 'pos' : '') + '">' + eur(cur.profit) + '</b><em>Vormonat ' + eur(prev.profit) + '</em></div>' +
      '<div><small>Bestandswert (EK)</small><b>' + eur(t.stockCost) + '</b><em>' + t.activeItems + ' Artikel</em></div>' +
      '<div><small>Offene Aufgaben</small><b class="' + (Tasks.overdue().length ? 'neg' : '') + '">' + Tasks.open().length + '</b><em>' + (Tasks.overdue().length ? Tasks.overdue().length + ' überfällig' : 'nichts überfällig') + '</em></div></div>';
    root.innerHTML = '<p class="rvo-hello"><b>' + esc(hello + (name ? ', ' + name : '')) + '!</b> ' + (b.length ? 'Das ist heute wichtig:' : 'Alles im Blick – heute ist nichts dringend.') + '</p>' + kpi +
      (b.length ? '<div class="rvo-brief">' + b.slice(0, 4).map(function (x) { return '<button type="button" class="rvo-bi' + (x.warn ? ' warn' : '') + '" data-rvo-go="' + x.go + '"><span class="nm"><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></span><span class="chev">›</span></button>'; }).join('') + '</div>' : '') +
      (F.demo ? '<p class="sx-note">' + (F.real.length ? F.demo + ' Beispielartikel sind in diesen Zahlen nicht enthalten.' : 'Es sind nur Beispielartikel vorhanden. Bao rechnet sie bewusst nicht mit.') + '</p>' : '');
  }

  /* =============== Erfolgsmomente aus echten Ereignissen =============== */
  var known = null;
  async function loadKnown() { try { known = {}; (await R.allArticles()).forEach(function (a) { known[a.id] = a.articleStatus || ''; }); } catch (e) { known = null; setTimeout(loadKnown, 1500); } }
  doc.addEventListener('rv:article-saved', function (e) {
    var d = e.detail || {}; if (!known || isDemo(d)) { if (known) known[d.id] = d.status; return; }
    var prev = known[d.id]; known[d.id] = d.status;
    if (d.status === 'Verkauft' && prev !== 'Verkauft' && d.sold) { emit('sale'); log('verkauf', 'Verkauf erfasst (' + d.id + ')'); }
    else if (prev === undefined) emit('saved');
  });

  /* =============== Start =============== */
  function init() {
    if (!R) { console.warn('RVO-Brücke fehlt – Bao-Funktionen deaktiviert.'); return; }
    R.hooks.runHomeAi = hookedRun;
    build(); render(); renderBrief(); loadKnown();
    R.hooks.afterRenderHome.push(renderBrief);
    doc.addEventListener('rvo:tasks', function () { renderBrief(); });
    window.addEventListener('rv:data-changed', function () { renderBrief(); });
    setInterval(function () { paintCounts(); }, 60000);
    window.RVOIntel = { facts: facts, snapshot: snapshot, tasks: Tasks, approvals: Approvals, briefing: function () { return facts().then(briefing); }, setTab: setTab, syncTasks: syncTasks, localAnswer: localAnswer, skills: SKILLS, log: log };
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
