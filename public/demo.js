/* RV Studio – 30 Beispielartikel (Kleidung) mit gezeichnetem Titelbild.
   Werden angelegt, wenn der Bestand leer ist oder noch die alten Beispielartikel enthält.
   Über „Beispielartikel entfernen“ im Bestand wieder löschbar (id beginnt mit demo-). */
(function () {
  'use strict';
  var VERSION = 'rv_demo_v3';

  /* ---------- Farbhilfen ---------- */
  function hex(c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(c, t, p) { var a = hex(c), b = hex(t); return '#' + a.map(function (v, i) { return ('0' + Math.round(v + (b[i] - v) * p).toString(16)).slice(-2); }).join(''); }
  function lt(c, p) { return mix(c, '#ffffff', p); }
  function dk(c, p) { return mix(c, '#000000', p); }

  /* ---------- Bausteine ---------- */
  var uid = 0;
  function grad(c) {
    var id = 'g' + (++uid);
    return { id: id, def: '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + lt(c, .14) + '"/><stop offset=".55" stop-color="' + c + '"/><stop offset="1" stop-color="' + dk(c, .22) + '"/></linearGradient>' };
  }
  function P(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function line(d, c, w, o, dash) { return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + (o == null ? 1 : o) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
  function fold(d, c) { return line(d, dk(c, .35), 3, .28); }
  function stitch(d, c) { return line(d, c, 1.6, .75, '5 4'); }

  var LS = 'M170 75 Q200 92 230 75 L280 92 Q305 100 312 130 L340 365 L302 375 L285 210 L285 420 L115 420 L115 210 L98 375 L60 365 L88 130 Q95 100 120 92 Z';
  var TEE = 'M165 72 Q200 96 235 72 L282 88 L342 140 L312 188 L282 170 L282 412 Q200 422 118 412 L118 170 L88 188 L58 140 L118 88 Z';

  var G = {
    tee: function (o) {
      var g = grad(o.c), s = g.def;
      var b = P(TEE, 'url(#' + g.id + ')') + line('M165 72 Q200 104 235 72', dk(o.c, .25), 7, .9) + line('M165 72 Q200 98 235 72', lt(o.c, .25), 2, .7)
        + fold('M150 220 Q160 300 145 390', o.c) + fold('M250 230 Q238 320 255 395', o.c) + line('M118 170 L118 190 M282 170 L282 190', dk(o.c, .3), 2, .4)
        + stitch('M122 404 Q200 414 278 404', dk(o.c, .3));
      if (o.print) b += '<text x="200" y="175" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="30" fill="' + o.a + '">' + o.print + '</text>';
      if (o.stripe) b += P('M282 170 L312 188 L318 178 L286 160 Z', o.a) + P('M118 170 L88 188 L82 178 L114 160 Z', o.a);
      return [s, b];
    },
    polo: function (o) {
      var r = G.tee(o), g = grad(o.c);
      r[0] += g.def;
      r[1] += P('M165 72 L200 92 L180 120 L150 92 Z', 'url(#' + g.id + ')') + P('M235 72 L200 92 L220 120 L250 92 Z', 'url(#' + g.id + ')')
        + line('M152 95 L180 120 M248 95 L220 120', o.a, 3, .95) + P('M193 92 L207 92 L207 160 L193 160 Z', dk(o.c, .08))
        + '<circle cx="200" cy="112" r="3.6" fill="' + lt(o.c, .7) + '"/><circle cx="200" cy="138" r="3.6" fill="' + lt(o.c, .7) + '"/>'
        + line('M88 188 L58 140', o.a, 3, .9) + line('M312 188 L342 140', o.a, 3, .9)
        + (o.logo ? '<path d="M238 150 q8 -10 16 0 q-8 8 -16 0z" fill="' + o.a + '"/>' : '');
      return r;
    },
    crew: function (o) {
      var g = grad(o.c), b = P(LS, 'url(#' + g.id + ')')
        + P('M115 400 L285 400 L285 422 L115 422 Z', dk(o.c, .12)) + line('M125 404 V420 M140 404 V420 M155 404 V420 M170 404 V420 M185 404 V420 M200 404 V420 M215 404 V420 M230 404 V420 M245 404 V420 M260 404 V420 M275 404 V420', dk(o.c, .3), 1.4, .5)
        + P('M98 375 L60 365 L64 345 L101 355 Z', dk(o.c, .12)) + P('M302 375 L340 365 L336 345 L299 355 Z', dk(o.c, .12))
        + line('M170 75 Q200 102 230 75', dk(o.c, .25), 8, .95) + fold('M150 230 Q165 310 150 390', o.c) + fold('M250 225 Q236 315 252 392', o.c)
        + fold('M95 200 Q90 280 80 340', o.c) + fold('M305 200 Q312 280 320 340', o.c);
      if (o.knit) { for (var x = 135; x <= 265; x += 26) b += line('M' + x + ' 110 ' + Array.apply(null, Array(11)).map(function (_, i) { return 'L' + (x + (i % 2 ? 6 : -6)) + ' ' + (125 + i * 26); }).join(' '), dk(o.c, .3), 2.2, .45); }
      if (o.patch) b += '<circle cx="104" cy="190" r="13" fill="' + o.a + '"/><circle cx="104" cy="190" r="6" fill="none" stroke="' + lt(o.a, .6) + '" stroke-width="2"/>';
      if (o.print) b += '<text x="200" y="185" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="26" fill="' + o.a + '">' + o.print + '</text>';
      return [g.def, b];
    },
    hoodie: function (o) {
      var r = G.crew({ c: o.c, a: o.a, print: o.print }), h = dk(o.c, .2);
      r[1] = P('M155 85 Q140 25 200 18 Q260 25 245 85 Z', h) + r[1]
        + P('M165 80 Q200 140 235 80 Q228 62 200 58 Q172 62 165 80 Z', dk(o.c, .38)) + line('M165 80 Q200 136 235 80', lt(o.c, .1), 4, .8)
        + P('M140 300 L260 300 L278 378 L122 378 Z', dk(o.c, .05)) + line('M140 300 L122 378 M260 300 L278 378', dk(o.c, .35), 2.5, .6) + stitch('M146 306 L254 306', dk(o.c, .3))
        + line('M190 108 L186 180 M210 108 L214 180', o.s || lt(o.c, .75), 3, .95) + P('M183 178 h6 v12 h-6z', '#c9ccd2') + P('M211 178 h6 v12 h-6z', '#c9ccd2');
      return r;
    },
    cardigan: function (o) {
      var r = G.crew({ c: o.c, a: o.a, knit: true });
      r[1] += P('M170 75 L200 210 L230 75 L224 75 L200 190 L176 75 Z', dk(o.c, .3)) + line('M200 210 L200 420', dk(o.c, .4), 3, .8);
      for (var y = 230; y <= 400; y += 42) r[1] += '<circle cx="207" cy="' + y + '" r="5" fill="' + o.a + '"/>';
      return r;
    },
    shirt: function (o) {
      var g = grad(o.c), b = P(LS, 'url(#' + g.id + ')');
      if (o.check) for (var x = 70; x < 340; x += 22) b += line('M' + x + ' 80 V420', o.a, 6, .25);
      if (o.check) for (var y = 90; y < 420; y += 22) b += line('M60 ' + y + ' H340', o.a, 6, .22);
      b += P('M170 75 L200 100 L178 128 L150 92 Z', lt(o.c, .12)) + P('M230 75 L200 100 L222 128 L250 92 Z', lt(o.c, .08))
        + line('M170 75 L200 100 L230 75', dk(o.c, .3), 2, .7) + P('M193 100 L207 100 L207 420 L193 420 Z', dk(o.c, .06)) + line('M193 100 V420 M207 100 V420', dk(o.c, .25), 1.2, .6)
        + P('M225 160 L265 160 L265 205 Q245 212 225 205 Z', dk(o.c, .05)) + line('M225 160 L265 160 L265 205 Q245 212 225 205 Z', dk(o.c, .3), 1.5, .5)
        + P('M98 375 L60 365 L64 340 L101 350 Z', dk(o.c, .06)) + P('M302 375 L340 365 L336 340 L299 350 Z', dk(o.c, .06))
        + fold('M150 240 Q160 320 148 400', o.c) + fold('M255 240 Q244 320 256 400', o.c);
      for (var k = 125; k <= 400; k += 45) b += '<circle cx="200" cy="' + k + '" r="3.8" fill="' + lt(o.c, .55) + '" stroke="' + dk(o.c, .3) + '" stroke-width=".8"/>';
      if (o.logo) b += '<path d="M120 175 q6 -8 12 0 q-6 6 -12 0z" fill="' + o.logo + '"/>';
      return [g.def, b];
    },
    jacket: function (o) {
      var g = grad(o.c), b = P(LS, 'url(#' + g.id + ')')
        + P('M115 395 L285 395 L285 422 L115 422 Z', dk(o.c, .1)) + line('M115 395 H285', dk(o.c, .35), 2, .6)
        + P('M98 375 L60 365 L63 342 L101 352 Z', dk(o.c, .1)) + P('M302 375 L340 365 L337 342 L299 352 Z', dk(o.c, .1))
        + fold('M150 240 Q160 320 148 390', o.c) + fold('M255 240 Q244 320 256 390', o.c) + fold('M95 200 Q90 280 80 340', o.c) + fold('M305 200 Q312 280 320 340', o.c);
      if (o.collar) b += P('M160 78 Q200 98 240 78 L262 96 L232 132 L200 110 L168 132 L138 96 Z', o.collar) + line('M146 98 L168 128 M254 98 L232 128', dk(o.collar, .3), 1.2, .5, '2 3');
      else b += line('M170 75 Q200 100 230 75', dk(o.c, .3), 8, .9);
      if (o.zip !== false) b += line('M200 98 V422', o.zipc || '#c9ccd2', 3.5, .95) + line('M200 98 V422', dk(o.c, .4), 9, .25) + P('M196 130 h8 v18 h-8z', o.zipc || '#d7dade');
      if (o.buttons) for (var y = 140; y <= 380; y += 60) b += '<circle cx="200" cy="' + y + '" r="5.5" fill="' + o.buttons + '"/>';
      if (o.pocket) b += P('M218 160 L262 160 L262 210 L218 210 Z', dk(o.c, .06)) + stitch('M222 164 L258 164 L258 206 L222 206 Z', o.st || dk(o.c, .4)) + P('M216 156 L264 156 L264 172 L216 172 Z', dk(o.c, .1));
      if (o.flaps) b += P('M130 300 L180 300 L180 318 L130 318 Z', dk(o.c, .14)) + P('M220 300 L270 300 L270 318 L220 318 Z', dk(o.c, .14)) + line('M130 300 V350 H180 V300 M220 300 V350 H270 V300', dk(o.c, .3), 1.5, .5);
      if (o.denim) b += stitch('M118 240 H195 M205 240 H282 M120 395 H280', o.st) + stitch('M140 160 L180 160 L180 210 L140 210 Z', o.st) + stitch('M220 160 L260 160 L260 210 L220 210 Z', o.st) + stitch('M95 200 L80 340 M305 200 L320 340', o.st);
      if (o.stripes) { b += line('M118 98 L92 130 L64 352', o.stripes, 5, .95) + line('M126 100 L102 132 L76 354', o.stripes, 5, .95) + line('M282 98 L308 130 L336 352', o.stripes, 5, .95) + line('M274 100 L298 132 L324 354', o.stripes, 5, .95); }
      if (o.hood) b = P('M152 88 Q138 28 200 20 Q262 28 248 88 Z', dk(o.c, .15)) + b + P('M168 82 Q200 130 232 82 Q226 60 200 56 Q174 60 168 82 Z', dk(o.c, .35));
      if (o.pile) for (var i = 0; i < 160; i++) { var px = 70 + ((i * 53) % 260), py = 90 + ((i * 97) % 320); b += '<circle cx="' + px + '" cy="' + py + '" r="2.6" fill="' + lt(o.c, .18) + '" opacity=".5"/>'; }
      if (o.patch) b += P('M110 180 h22 v14 h-22z', o.patch) + P('M226 300 h40 v30 h-40z', o.patch, ' opacity=".95"');
      if (o.logo) b += '<circle cx="250" cy="150" r="7" fill="' + o.logo + '"/>';
      return [g.def, b];
    },
    puffer: function (o) {
      var g = grad(o.c), body = o.vest
        ? 'M168 70 Q200 90 232 70 L270 84 Q282 140 288 170 L290 420 L110 420 L112 170 Q118 140 130 84 Z'
        : 'M168 70 Q200 90 232 70 L282 88 Q318 100 326 140 L352 368 L306 382 L290 220 L290 425 L110 425 L110 220 L94 382 L48 368 L74 140 Q82 100 118 88 Z';
      var b = '<clipPath id="c' + g.id + '"><path d="' + body + '"/></clipPath>' + P(body, 'url(#' + g.id + ')') + '<g clip-path="url(#c' + g.id + ')">';
      for (var y = 120; y < 430; y += 46) b += '<path d="M40 ' + y + ' Q200 ' + (y + 16) + ' 360 ' + y + '" fill="none" stroke="' + dk(o.c, .38) + '" stroke-width="3.5" opacity=".75"/>' + '<path d="M40 ' + (y - 22) + ' Q200 ' + (y - 8) + ' 360 ' + (y - 22) + '" fill="none" stroke="' + lt(o.c, .22) + '" stroke-width="10" opacity=".22"/>';
      b += '</g>' + P('M160 70 Q200 40 240 70 L246 98 Q200 82 154 98 Z', dk(o.c, .12)) + line('M200 88 V425', '#c9ccd2', 3, .9) + line('M200 88 V425', dk(o.c, .5), 8, .25);
      if (o.logo) b += '<rect x="234" y="130" width="22" height="14" rx="3" fill="' + o.logo + '"/>';
      if (o.patch) b += '<circle cx="86" cy="160" r="10" fill="' + o.patch + '"/><path d="M80 160 l6 -6 l6 6 l-6 6z" fill="#fff" opacity=".85"/>';
      return [g.def, b];
    },
    coat: function (o) {
      var g = grad(o.c), body = 'M170 70 Q200 86 230 70 L282 88 Q306 98 314 130 L342 380 L304 390 L288 220 L296 470 L104 470 L112 220 L96 390 L58 380 L86 130 Q94 98 118 88 Z';
      var b = P(body, 'url(#' + g.id + ')') + P('M170 70 L200 200 L230 70 L250 82 L214 230 L200 238 L186 230 L150 82 Z', dk(o.c, .14))
        + P('M150 82 L134 120 L176 170 Z', dk(o.c, .06)) + P('M250 82 L266 120 L224 170 Z', dk(o.c, .06)) + line('M150 82 L134 120 L176 170 M250 82 L266 120 L224 170', dk(o.c, .35), 1.6, .6)
        + line('M200 238 V470', dk(o.c, .35), 2, .6) + fold('M150 260 Q160 360 146 460', o.c) + fold('M252 260 Q240 360 256 460', o.c);
      [270, 330, 390].forEach(function (y) { b += '<circle cx="178" cy="' + y + '" r="6" fill="' + dk(o.c, .45) + '"/><circle cx="222" cy="' + y + '" r="6" fill="' + dk(o.c, .45) + '"/>'; });
      if (o.belt) b += P('M110 300 L290 300 L290 318 L110 318 Z', dk(o.c, .1));
      return [g.def, b];
    },
    jeans: function (o) {
      var g = grad(o.c), short = o.shorts, bot = short ? 270 : 470;
      var body = short
        ? 'M128 70 L272 70 L292 270 L210 276 L200 175 L190 276 L108 270 Z'
        : 'M130 70 L270 70 L288 470 L214 470 L200 180 L186 470 L112 470 Z';
      var b = P(body, 'url(#' + g.id + ')') + P('M128 70 L272 70 L273 96 L127 96 Z', dk(o.c, .1))
        + line('M150 70 V98 M182 70 V98 M218 70 V98 M250 70 V98', dk(o.c, .35), 4, .7) + '<circle cx="200" cy="83" r="5" fill="' + (o.btn || '#c9a35a') + '"/>'
        + line('M200 96 L200 160 Q196 175 186 178', dk(o.c, .35), 2, .6) + fold('M160 200 Q170 ' + (bot - 60) + ' 156 ' + (bot - 10), o.c) + fold('M240 200 Q232 ' + (bot - 60) + ' 246 ' + (bot - 10), o.c)
        + line('M130 100 Q150 140 172 104 M270 100 Q250 140 228 104', dk(o.c, .35), 2, .55);
      if (o.st) b += stitch('M200 98 V162 Q196 172 188 174', o.st) + stitch('M132 104 Q150 142 170 108 M268 104 Q250 142 230 108', o.st) + stitch('M130 92 H270', o.st);
      if (o.cargo) b += P('M112 220 L150 220 L152 290 L114 290 Z', dk(o.c, .08)) + P('M288 220 L250 220 L248 290 L286 290 Z', dk(o.c, .08)) + line('M112 220 H150 M288 220 H250', dk(o.c, .35), 3, .6);
      if (o.patch) b += P('M244 110 h22 v12 h-22z', o.patch);
      if (o.drawcord) b += line('M196 84 L190 120 M204 84 L210 120', '#f2f2f2', 3, .95);
      return [g.def, b];
    },
    skirt: function (o) {
      var g = grad(o.c);
      return [g.def, P('M140 90 L260 90 L310 360 Q200 378 90 360 Z', 'url(#' + g.id + ')') + P('M138 90 L262 90 L264 116 L136 116 Z', dk(o.c, .12))
        + '<circle cx="200" cy="103" r="5" fill="#c9a35a"/>' + line('M200 116 V200', dk(o.c, .35), 2, .6) + fold('M160 140 Q150 260 126 350', o.c) + fold('M240 140 Q252 260 276 350', o.c)
        + (o.st ? stitch('M140 112 H260 M98 352 Q200 368 302 352 M200 118 V198', o.st) : '')];
    },
    dress: function (o) {
      var g = grad(o.c), b = P('M160 50 L172 50 L182 132 L218 132 L228 50 L240 50 L250 140 Q258 172 240 198 L312 452 Q200 478 88 452 L160 198 Q142 172 150 140 Z', 'url(#' + g.id + ')')
        + line('M160 198 Q200 212 240 198', dk(o.c, .3), 3, .6) + fold('M180 220 Q170 340 150 455', o.c) + fold('M220 220 Q234 340 252 458', o.c) + fold('M200 215 Q202 340 200 462', o.c)
        + line('M170 140 Q200 150 230 140', lt(o.c, .5), 10, .18) + line('M120 300 Q200 330 280 300', lt(o.c, .55), 18, .12);
      if (o.dots) for (var i = 0; i < 46; i++) { var x = 110 + ((i * 47) % 180), y = 150 + ((i * 71) % 290); b += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + o.a + '" opacity=".85"/>'; }
      return [g.def, b];
    },
    cap: function (o) {
      var g = grad(o.c);
      return [g.def, P('M95 300 Q95 150 200 140 Q305 150 305 300 Z', 'url(#' + g.id + ')') + P('M95 300 L305 300 Q350 300 362 330 Q300 350 200 340 Q120 336 95 300 Z', dk(o.c, .2))
        + line('M200 142 V300 M140 160 Q160 230 150 300 M260 160 Q240 230 250 300', dk(o.c, .35), 2, .55) + '<circle cx="200" cy="142" r="7" fill="' + dk(o.c, .1) + '"/>'
        + (o.print ? '<text x="200" y="250" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="54" fill="' + o.a + '">' + o.print + '</text>' : '')];
    },
    beanie: function (o) {
      var g = grad(o.c), b = P('M110 330 Q100 150 200 130 Q300 150 290 330 Z', 'url(#' + g.id + ')');
      for (var x = 120; x <= 280; x += 14) b += line('M' + x + ' 160 Q' + (x + (x < 200 ? 6 : -6)) + ' 250 ' + x + ' 330', dk(o.c, .3), 2.4, .45);
      b += P('M100 300 L300 300 L304 380 L96 380 Z', dk(o.c, .08));
      for (var k = 104; k <= 296; k += 12) b += line('M' + k + ' 304 V376', dk(o.c, .3), 2.4, .45);
      b += P('M180 322 h40 v24 h-40z', o.a) + line('M186 334 h28', '#fff', 2, .7);
      return [g.def, b];
    },
    sneaker: function (o) {
      var g = grad(o.c), sole = o.sole || '#f4f1ea';
      var b = P('M70 324 L68 266 Q70 238 98 232 L150 224 Q170 198 198 194 L214 196 Q228 214 242 236 Q292 246 332 266 Q358 282 360 324 Z', 'url(#' + g.id + ')')
        + P('M188 200 Q196 168 228 172 Q238 190 240 222 Z', dk(o.c, .12)) + line('M98 232 Q140 220 196 198', dk(o.c, .45), 6, .55)
        + P('M194 204 L248 240 L238 252 L184 214 Z', dk(o.c, .07));
      for (var t = 0; t < 5; t++) b += line('M' + (190 + t * 11) + ' ' + (214 + t * 8) + ' L' + (200 + t * 11) + ' ' + (202 + t * 8), o.lace || '#fafafa', 4, .95);
      if (o.toe) b += P('M296 258 Q348 268 360 300 L360 324 L300 324 Q292 290 296 258 Z', o.toe, ' opacity=".9"');
      if (o.heel) b += P('M68 266 Q70 238 98 232 L104 324 L70 324 Z', o.heel);
      if (o.a) b += P('M118 304 Q200 268 300 262 Q232 292 140 318 Z', o.a);
      b += fold('M120 250 Q170 244 210 252', o.c)
        + P('M58 322 L364 322 Q370 352 344 362 L80 362 Q54 356 58 322 Z', sole) + line('M62 342 H362', dk(sole, .22), 2, .8) + stitch('M70 330 H352', dk(sole, .3));
      return [g.def, b];
    },
    boot: function (o) {
      var g = grad(o.c), b = P('M120 100 L230 100 L238 255 Q300 262 340 290 Q356 304 352 340 L114 340 Q108 220 120 100 Z', 'url(#' + g.id + ')')
        + P('M106 340 L360 340 L360 376 L106 376 Z', '#1b1b1b') + stitch('M110 346 H356', o.a || '#e8c547')
        + P('M118 100 L232 100 L232 116 L118 116 Z', dk(o.c, .3)) + line('M232 118 L236 250', dk(o.c, .4), 3, .7);
      for (var y = 130; y <= 240; y += 22) b += '<circle cx="226" cy="' + y + '" r="3.4" fill="#c9a35a"/>' + line('M226 ' + y + ' L212 ' + (y + 12), '#222', 3, .9);
      b += P('M108 90 L128 90 L128 118 L108 118 Z', '#e8c547', ' opacity=".9"') + fold('M150 160 Q160 240 150 330', o.c);
      return [g.def, b];
    },
    bag: function (o) {
      var g = grad(o.c);
      return [g.def, P('M95 180 L305 180 L320 410 L80 410 Z', 'url(#' + g.id + ')') + line('M140 180 Q140 90 200 90 Q260 90 260 180', dk(o.c, .25), 12, 1)
        + P('M95 180 L305 180 L300 240 Q200 262 100 240 Z', dk(o.c, .1)) + '<rect x="186" y="236" width="28" height="20" rx="4" fill="#c9a35a"/>' + stitch('M100 196 H300 M86 396 H314', lt(o.c, .4))];
    }
  };

  var BG = [['#ece7df', '#d9d1c4'], ['#e6e9ee', '#cdd3dc'], ['#e9e3dc', '#d6cbbd'], ['#e3e8e4', '#c9d2cb'], ['#efe9e6', '#dacfca'], ['#e4e6ea', '#c6cbd3']];
  function photo(type, o, n) {
    uid = 0;
    var bg = BG[n % BG.length], r = G[type](o);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs>'
      + '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + bg[0] + '"/><stop offset="1" stop-color="' + bg[1] + '"/></linearGradient>'
      + '<radialGradient id="vg" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient>'
      + '<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#2a2016" flood-opacity=".28"/></filter>'
      + r[0] + '</defs><rect width="400" height="500" fill="url(#bg)"/>'
      + '<g filter="url(#sh)" transform="' + (type === 'sneaker' ? 'translate(-30 -15) scale(1.15)' : 'translate(0 ' + (type === 'boot' || type === 'cap' || type === 'beanie' || type === 'bag' ? 30 : 10) + ')') + '">' + r[1] + '</g>'
      + '<rect width="400" height="500" fill="url(#vg)"/></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function day(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

  /* Marke, Modell, Kategorie, Größe, Zustand, EK, VK, Status, Bildtyp, Bildoptionen, Tage im Bestand, Lagerplatz, Farbe, Material */
  var L = [
    ['Nike', 'Tech Fleece Hoodie', 'Hoodies & Pullover', 'L', 9, 45, 89, 'Online', 'hoodie', { c: '#2b2d31', a: '#e8e8e8' }, 14, 'A1', 'Schwarz', 'Baumwolle/Polyester'],
    ['Carhartt WIP', 'Detroit Jacket', 'Jacken', 'M', 9, 65, 139, 'Verkauft', 'jacket', { c: '#8a5a2b', collar: '#3b2a1e', pocket: true, st: '#e2c48f', logo: '#f0a830', zip: false, buttons: '#3a2a1c' }, 48, 'B1', 'Hamilton Brown', 'Baumwoll-Canvas'],
    ['The North Face', 'Nuptse 1996', 'Jacken', 'L', 8, 120, 219, 'Online', 'puffer', { c: '#1f2124', logo: '#e6e6e6' }, 9, 'B2', 'Schwarz', 'Nylon/Daune'],
    ["Levi's", '501 Original', 'Hosen', 'W32 L32', 8, 22, 55, 'Online', 'jeans', { c: '#3d5a86', st: '#d9a95b' }, 36, 'C1', 'Mittelblau', 'Denim'],
    ['Ralph Lauren', 'Cable Knit Pullover', 'Hoodies & Pullover', 'M', 9, 28, 69, 'Bereit', 'crew', { c: '#24324f', a: '#b8343c', knit: true, patch: '#b8343c' }, 21, 'A2', 'Navy', 'Baumwolle'],
    ['Stüssy', 'Basic Logo Tee', 'Shirts & Tops', 'L', 8, 18, 45, 'Online', 'tee', { c: '#f1efe9', a: '#1d1d1d', print: 'Stüssy' }, 52, 'A3', 'Weiß', 'Baumwolle'],
    ["Arc'teryx", 'Beta LT Jacket', 'Jacken', 'M', 9, 180, 299, 'Online', 'jacket', { c: '#3f5d4a', hood: true, logo: '#c9d1c9', zipc: '#2a2a2a' }, 5, 'B3', 'Grün', 'Gore-Tex'],
    ['Adidas', 'Samba OG', 'Sneaker & Schuhe', '42', 9, 62, 109, 'Verkauft', 'sneaker', { c: '#f5f3ee', a: '#1c1c1c', sole: '#9b6a43', toe: '#d8d2c6' }, 33, 'D1', 'Weiß/Schwarz', 'Leder'],
    ['Nike', 'Air Force 1 Low', 'Sneaker & Schuhe', '43', 8, 55, 99, 'Online', 'sneaker', { c: '#f7f7f5', a: '#e9e9e7', sole: '#fbfbfa' }, 61, 'D1', 'Weiß', 'Leder'],
    ['New Balance', '550 White Green', 'Sneaker & Schuhe', '44', 9, 58, 115, 'Bereit', 'sneaker', { c: '#f4f2ec', a: '#2f6b4a', heel: '#2f6b4a', sole: '#f1eee6' }, 12, 'D2', 'Weiß/Grün', 'Leder'],
    ['Patagonia', 'Retro-X Fleece', 'Jacken', 'L', 8, 70, 145, 'Online', 'jacket', { c: '#d9cdb6', pile: true, patch: '#7a4b2b', zipc: '#5b3b22' }, 44, 'B2', 'Natur', 'Fleece'],
    ['Tommy Hilfiger', 'Oxford Hemd', 'Shirts & Tops', 'L', 9, 15, 39, 'Online', 'shirt', { c: '#a9c4e2', logo: '#1f3a6b' }, 27, 'A3', 'Hellblau', 'Baumwolle'],
    ['Lacoste', 'Polo L.12.12', 'Shirts & Tops', 'M', 9, 22, 49, 'Verkauft', 'polo', { c: '#2f6b4a', a: '#2f6b4a', logo: true }, 19, 'A3', 'Grün', 'Baumwoll-Piqué'],
    ['Zara', 'Satin Midikleid', 'Kleider & Röcke', 'S', 10, 14, 35, 'Online', 'dress', { c: '#7a2e3b' }, 16, 'E1', 'Bordeaux', 'Satin'],
    ["Levi's", 'Trucker Jacket', 'Jacken', 'M', 8, 30, 69, 'Bereit', 'jacket', { c: '#5b7fae', collar: '#5b7fae', zip: false, buttons: '#b98a4a', denim: true, st: '#e0a858', pocket: true }, 70, 'B1', 'Hellblau', 'Denim'],
    ['Dickies', '874 Work Pant', 'Hosen', 'W34 L32', 9, 18, 42, 'Entwurf', 'jeans', { c: '#b8a582', btn: '#7d7d7d' }, 3, 'C2', 'Khaki', 'Polyester/Baumwolle'],
    ['Supreme', 'Box Logo Hoodie', 'Hoodies & Pullover', 'M', 9, 160, 289, 'Online', 'hoodie', { c: '#b3222c', a: '#ffffff', print: 'Supreme' }, 11, 'A1', 'Rot', 'Baumwolle'],
    ['Stone Island', 'Crewneck Sweatshirt', 'Hoodies & Pullover', 'XL', 8, 75, 149, 'Online', 'crew', { c: '#8d9096', a: '#2b2b2b', patch: '#2b2b2b' }, 39, 'A2', 'Grau', 'Baumwolle'],
    ['Moncler', 'Maya Daunenjacke', 'Jacken', 'L', 9, 380, 649, 'Bereit', 'puffer', { c: '#1d2a4a', patch: '#d23b3b' }, 8, 'B3', 'Navy', 'Nylon/Daune'],
    ['Barbour', 'Bedale Wachsjacke', 'Jacken', 'L', 7, 90, 179, 'Online', 'jacket', { c: '#4a4f36', collar: '#5b3a24', flaps: true, zipc: '#a28552' }, 95, 'B1', 'Oliv', 'Wachs-Baumwolle'],
    ['Carhartt WIP', 'Acrylic Watch Beanie', 'Accessoires', 'One Size', 10, 8, 25, 'Online', 'beanie', { c: '#e2742c', a: '#1d1d1d' }, 30, 'E2', 'Orange', 'Acryl'],
    ['New Era', '59FIFTY Cap NY', 'Accessoires', '7 3/8', 9, 12, 32, 'Entwurf', 'cap', { c: '#1c2a48', a: '#f4f4f4', print: 'NY' }, 2, 'E2', 'Navy', 'Wolle'],
    ['Dr. Martens', '1460 Boots', 'Sneaker & Schuhe', '41', 8, 60, 119, 'Online', 'boot', { c: '#1e1d1c', a: '#e8c547' }, 57, 'D2', 'Schwarz', 'Glattleder'],
    ['Champion', 'Reverse Weave Shorts', 'Hosen', 'M', 9, 12, 29, 'Verkauft', 'jeans', { c: '#9b9ea4', shorts: true, drawcord: true, patch: '#c6322f' }, 24, 'C2', 'Grau meliert', 'Baumwolle'],
    ['Mango', 'Wollmantel', 'Jacken', 'M', 9, 45, 99, 'Online', 'coat', { c: '#b98654', belt: false }, 82, 'B3', 'Camel', 'Wolle'],
    ['Tommy Jeans', 'Jeansrock', 'Kleider & Röcke', 'S', 9, 10, 29, 'Bereit', 'skirt', { c: '#6f8fbd', st: '#d9a95b' }, 15, 'E1', 'Hellblau', 'Denim'],
    ['Fred Perry', 'Twin Tipped Polo', 'Shirts & Tops', 'L', 8, 20, 45, 'Entwurf', 'polo', { c: '#1b2340', a: '#d9b84a', logo: true }, 4, 'A3', 'Navy', 'Baumwoll-Piqué'],
    ['Adidas', 'Firebird Trainingsjacke', 'Jacken', 'M', 8, 25, 59, 'Verkauft', 'jacket', { c: '#1d1d1f', stripes: '#f2f2f2', logo: '#f2f2f2' }, 41, 'B2', 'Schwarz/Weiß', 'Polyester'],
    ['Uniqlo', 'Ultra Light Down Weste', 'Jacken', 'M', 9, 15, 35, 'Online', 'puffer', { c: '#2f3d2e', vest: true }, 110, 'B2', 'Oliv', 'Nylon/Daune'],
    ['COS', 'Merino Cardigan', 'Hoodies & Pullover', 'M', 9, 25, 59, 'Online', 'cardigan', { c: '#cdbfa8', a: '#6b5a44' }, 34, 'A2', 'Beige', 'Merinowolle']
  ];

  function build() {
    var soldN = 0, SOLD_DAYS = [0, 1, 4, 9, 16];
    return L.map(function (r, i) {
      var cost = r[5], price = r[6], status = r[7], sold = status === 'Verkauft', draft = status === 'Entwurf';
      var plat = ['vinted', 'ebay', 'vinted', 'instagram'][i % 4];
      var title = r[0] + ' ' + r[1] + (r[3] ? ' Gr. ' + r[3] : '');
      var desc = draft ? '' : r[0] + ' ' + r[1] + ' in ' + r[12] + ', Größe ' + r[3] + '. Zustand ' + r[4] + '/10, ' + r[13] + '. Versand innerhalb von 24 h.';
      return {
        id: 'demo-' + String(i + 1).padStart(2, '0'), sku: 'DEMO-' + String(i + 1).padStart(3, '0'), brand: r[0], model: r[1], category: r[2], size: r[3],
        condition: String(r[4]), cost: String(cost), notes: draft ? '' : (r[4] >= 9 ? 'Keine Mängel' : 'Leichte Gebrauchsspuren'),
        measurements: draft ? '' : 'Siehe Fotos', material: r[13], color: r[12], country: '', location: 'Regal ' + r[11], chest: '', length: '',
        purchaseDate: day(r[10]), source: 'Beispiel',
        sale: sold ? { price: price - 5, date: new Date(Date.now() - SOLD_DAYS[soldN++ % SOLD_DAYS.length] * 86400000 - 3600000).toISOString(), fees: Math.round(price * 0.05), shipping: 4.99, platform: plat } : null,
        articleStatus: status, shippedAt: sold && i % 2 ? Date.now() : null,
        prices: draft ? { ebay: '', vinted: '', instagram: '' } : { ebay: String(price + 10), vinted: String(price), instagram: String(price + 5) },
        listings: {
          ebay: { title: draft ? '' : title, description: desc }, vinted: { title: draft ? '' : title, description: desc }, instagram: { title: '', description: '' }
        },
        photos: [{ src: photo(r[8], r[9], i), edit: {} }], createdAt: day(r[10]), updatedAt: new Date().toISOString()
      };
    });
  }

  function open(cb) {
    var q = indexedDB.open('RVStudioDB', 1);
    q.onupgradeneeded = function () { if (!q.result.objectStoreNames.contains('articles')) q.result.createObjectStore('articles', { keyPath: 'id' }); };
    q.onsuccess = function () { cb(q.result); }; q.onerror = function () {};
  }
  function refresh() {
    try { window.dispatchEvent(new Event('rv:data-changed')); } catch (e) {}
    syncButton();
  }
  function isDemo(id) { return String(id).indexOf('demo-') === 0; }
  function mark() { try { localStorage.setItem(VERSION, '1'); localStorage.setItem('rv_demo_done', '1'); } catch (e) {} }
  // Ersetzt alte Beispielartikel (falls vorhanden) durch die aktuellen 30.
  function install(db, done) {
    var tx = db.transaction('articles', 'readwrite'), st = tx.objectStore('articles');
    var cur = st.openCursor();
    cur.onsuccess = function () { var c = cur.result; if (c) { if (isDemo(c.key)) c.delete(); c.continue(); } else build().forEach(function (a) { st.put(a); }); };
    tx.oncomplete = function () { mark(); done && done(); };
  }
  function seed() {
    var done = false; try { done = localStorage.getItem(VERSION) === '1'; } catch (e) {}
    if (done || !window.indexedDB) return;
    open(function (db) {
      var k = db.transaction('articles', 'readonly').objectStore('articles').getAllKeys();
      k.onsuccess = function () {
        var keys = k.result || [], hasOldDemo = keys.some(isDemo);
        if (keys.length && !hasOldDemo) { mark(); db.close(); return; }
        install(db, function () { db.close(); refresh(); });
      };
    });
  }
  window.RVDemo = {
    count: L.length,
    load: function () { open(function (db) { install(db, function () { db.close(); refresh(); }); }); },
    remove: function () {
      open(function (db) {
        var tx = db.transaction('articles', 'readwrite'), cur = tx.objectStore('articles').openCursor();
        cur.onsuccess = function () { var c = cur.result; if (c) { if (isDemo(c.key)) c.delete(); c.continue(); } };
        tx.oncomplete = function () { db.close(); refresh(); };
      });
    }
  };
  function syncButton() {
    var b = document.getElementById('rvDemoRemove'); if (!b) return;
    open(function (db) {
      var k = db.transaction('articles', 'readonly').objectStore('articles').getAllKeys();
      k.onsuccess = function () { var has = (k.result || []).some(isDemo); b.dataset.mode = has ? 'remove' : 'load'; b.textContent = has ? 'Beispielartikel entfernen' : L.length + ' Beispielartikel laden'; b.hidden = false; db.close(); };
    });
  }
  function button() {
    var row = document.querySelector('.bx-demo-slot') || document.querySelector('.lux-stock-action-row');
    if (!row || document.getElementById('rvDemoRemove')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'rvDemoRemove'; b.className = 'v6-small-btn'; b.hidden = true;
    b.addEventListener('click', function () {
      if (b.dataset.mode === 'load') { window.RVDemo.load(); return; }
      if (confirm('Die Beispielartikel löschen? Deine eigenen Artikel bleiben erhalten.')) window.RVDemo.remove();
    });
    row.appendChild(b); syncButton();
  }
  function start() { button(); setTimeout(seed, 300); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
