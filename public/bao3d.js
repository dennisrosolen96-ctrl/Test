/* RVO V36 – Bao als echte 3D-Figur (WebGL, three.js r160 aus /vendor, offline verfügbar).
   Prozedurales Modell nach dem Referenzbild: Plüsch-Material mit Sheen und Fellstruktur, glänzende braune Augen mit Lichtpunkten,
   Lider, Nase, offener Mund mit Zunge, Wangen, Ohren mit braunem Inneren, Arme mit Schultergelenk, Füße mit Ballen und Zehen.
   bao.js steuert die Bewegung (gleiche Zustände und Abläufe wie bisher) und ruft pro Bild apply(P, C) auf.
   Ohne WebGL bleibt automatisch die Vektor-Figur. */
(function () {
  'use strict';
  var T = null, shared = null;
  var D = Math.PI / 180;

  function canvasTex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
  function furBump() { // feine Fellstruktur als Bump-Map
    var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d');
    x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 5200; i++) { var px = Math.random() * 256, py = Math.random() * 256, l = 3 + Math.random() * 7, a = Math.random() * Math.PI, g = 90 + Math.random() * 120 | 0;
      x.strokeStyle = 'rgba(' + g + ',' + g + ',' + g + ',.55)'; x.lineWidth = .8 + Math.random(); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(5, 5); return t;
  }
  function eyeTex() { // Iris liegt bei u = 0.25 (Blickrichtung +z einer Kugel)
    return canvasTex(1024, 512, function (x, w, h) {
      x.fillStyle = '#f4f1ec'; x.fillRect(0, 0, w, h);
      var cx = w * .25, cy = h * .5, rx = w * .13, ry = h * .26;
      x.save(); x.translate(cx, cy); x.scale(rx / ry, 1);
      var g = x.createRadialGradient(-ry * .2, -ry * .25, ry * .1, 0, 0, ry);
      g.addColorStop(0, '#b07a4c'); g.addColorStop(.55, '#6a3f22'); g.addColorStop(.9, '#2e170a'); g.addColorStop(1, '#1a0c05');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, ry, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(255,220,180,.18)'; x.lineWidth = 3;
      for (var i = 0; i < 48; i++) { var a = i / 48 * Math.PI * 2; x.beginPath(); x.moveTo(Math.cos(a) * ry * .55, Math.sin(a) * ry * .55); x.lineTo(Math.cos(a) * ry * .9, Math.sin(a) * ry * .9); x.stroke(); }
      x.fillStyle = '#0d0604'; x.beginPath(); x.arc(0, ry * .04, ry * .52, 0, Math.PI * 2); x.fill();
      x.restore();
    });
  }
  function softDisc(rgb, a) { return canvasTex(128, 128, function (x) { var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }); }

  function materials() {
    if (shared) return shared;
    var bump = furBump();
    shared = {
      white: new T.MeshPhysicalMaterial({ color: 0xf6f4f1, roughness: .92, sheen: 1, sheenRoughness: .45, sheenColor: new T.Color(0xffffff), bumpMap: bump, bumpScale: .9 }),
      black: new T.MeshPhysicalMaterial({ color: 0x24262c, roughness: .8, sheen: 1, sheenRoughness: .35, sheenColor: new T.Color(0x9aa2ae), bumpMap: bump, bumpScale: 1.1 }),
      patch: new T.MeshPhysicalMaterial({ color: 0x1b1d22, roughness: .7, sheen: .8, sheenRoughness: .4, sheenColor: new T.Color(0x7d8591), bumpMap: bump, bumpScale: .6 }),
      earIn: new T.MeshStandardMaterial({ color: 0x8e5d4b, roughness: .85 }),
      pad: new T.MeshPhysicalMaterial({ color: 0xa86e50, roughness: .55, clearcoat: .3 }),
      bean: new T.MeshPhysicalMaterial({ color: 0xc58d6e, roughness: .5, clearcoat: .3 }),
      eye: new T.MeshPhysicalMaterial({ map: eyeTex(), roughness: .12, clearcoat: 1, clearcoatRoughness: .05 }),
      glint: new T.MeshBasicMaterial({ color: 0xffffff }),
      nose: new T.MeshPhysicalMaterial({ color: 0x111215, roughness: .25, clearcoat: 1, clearcoatRoughness: .1 }),
      mouth: new T.MeshStandardMaterial({ color: 0x3a1317, roughness: .7 }),
      tongue: new T.MeshPhysicalMaterial({ color: 0xe8848f, roughness: .45, clearcoat: .4 }),
      teeth: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .4 }),
      line: new T.MeshStandardMaterial({ color: 0x2a2c31, roughness: .6 }),
      blush: new T.MeshBasicMaterial({ map: softDisc('240,130,145', .9), transparent: true, depthWrite: false }),
      shadow: new T.MeshBasicMaterial({ map: softDisc('0,0,0', .6), transparent: true, depthWrite: false }),
      mint: new T.MeshPhysicalMaterial({ color: 0x6fd6a0, roughness: .35, clearcoat: .8 }),
      mintHi: new T.MeshPhysicalMaterial({ color: 0xf2fff7, roughness: .4 }),
      pink: new T.MeshPhysicalMaterial({ color: 0xff8fa3, roughness: .4, clearcoat: .6 })
    };
    return shared;
  }
  function S(r, m, sx, sy, sz, ws, hs) { var o = new T.Mesh(new T.SphereGeometry(r, ws || 48, hs || 32), m); o.scale.set(sx || 1, sy || 1, sz || 1); return o; }
  function at(o, x, y, z) { o.position.set(x, y, z); return o; }

  function build() {
    var M = materials(), g = {};
    var root = new T.Group(); g.root = root;
    var shadow = new T.Mesh(new T.PlaneGeometry(2.6, 2.6), M.shadow); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .005; g.shadow = shadow;
    var body = new T.Group(); root.add(body); g.body = body;
    // Rumpf, Bauch
    body.add(at(S(.66, M.black, 1, .98, .86), 0, .66, 0));
    body.add(at(S(.5, M.white, .96, 1, .62), 0, .66, .3));
    // Füße mit Ballen und Zehen
    [-1, 1].forEach(function (s) {
      var f = new T.Group(); f.position.set(s * .38, .17, .34); f.rotation.y = s * -.25; body.add(f);
      f.add(S(.27, M.black, 1, .78, 1.15));
      f.add(at(S(.15, M.pad, 1, .9, .32), 0, -.02, .29));
      [[-.11, .1], [-.04, .145], [.04, .145], [.11, .1]].forEach(function (p) { f.add(at(S(.045, M.bean, 1, 1, .5, 16, 12), p[0], p[1], .27)); });
    });
    // Arme (Schultergelenk)
    function arm(s) {
      var a = new T.Group(); a.position.set(s * .5, 1.02, .12); body.add(a);
      var cap = new T.Mesh(new T.CapsuleGeometry(.165, .42, 8, 24), M.black); cap.position.y = -.3; a.add(cap);
      var paw = at(S(.15, M.patch, 1, .8, .6, 24, 16), 0, -.56, .06); a.add(paw);
      return a;
    }
    g.armL = arm(-1); g.armR = arm(1);
    // Requisite: Spielzeug-Geldschein-Blaster in Mint (rechte Pfote)
    var prop = new T.Group(); prop.position.set(0, -.62, .08); g.armR.add(prop); g.prop = prop;
    var barrel = new T.Mesh(new T.CylinderGeometry(.11, .11, .36, 24), M.mint); barrel.position.y = -.12; prop.add(barrel);
    [-.02, -.16].forEach(function (y) { var r = new T.Mesh(new T.CylinderGeometry(.114, .114, .05, 24), M.mintHi); r.position.y = y; prop.add(r); });
    var bell = new T.Mesh(new T.CylinderGeometry(.21, .12, .2, 24, 1, true), M.mint); bell.position.y = -.38; bell.material.side = T.DoubleSide; prop.add(bell);
    prop.add(at(S(.05, M.pink, 1, 1, 1, 12, 8), 0, .08, 0));
    prop.scale.setScalar(0.001);
    // Kopf
    var head = new T.Group(); head.position.set(0, 1.2, .02); body.add(head); g.head = head;
    head.add(at(S(.8, M.white, 1.08, .94, .96, 64, 48), 0, .6, 0));
    head.add(at(S(.36, M.white, 1.25, .82, .78), 0, .36, .55));
    [-1, 1].forEach(function (s) {
      var e = new T.Group(); e.position.set(s * .64, 1.18, -.08); head.add(e); g[s < 0 ? 'earL' : 'earR'] = e;
      e.add(S(.28, M.black, 1, 1, .62));
      e.add(at(S(.16, M.earIn, 1, 1, .3), s * -.02, -.02, .13));
      // Augenfleck (schräg, nach außen hängend)
      var p = at(S(.2, M.patch, .9, 1.25, .42), s * .345, .575, .74); p.rotation.z = s * -.6; p.rotation.y = s * .36; head.add(p);
    });
    g.eyes = []; g.lids = []; g.lows = [];
    [-1, 1].forEach(function (s) {
      var pivot = new T.Group(); pivot.position.set(s * .315, .63, .8); pivot.rotation.y = s * .1; head.add(pivot);
      var ball = new T.Group(); pivot.add(ball); g.eyes.push(ball);
      var eye = S(.152, M.eye); ball.add(eye); // Iris liegt bei u = 0.25, das ist die +z-Seite (vorne)
      var lid = new T.Mesh(new T.SphereGeometry(.16, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.patch); pivot.add(lid); g.lids.push(lid);
      var low = new T.Mesh(new T.SphereGeometry(.159, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.patch); pivot.add(low); g.lows.push(low);
      pivot.add(at(S(.038, M.glint, 1, 1, 1, 16, 12), -.045, .05, .135));
      var arc = new T.Mesh(new T.TorusGeometry(.085, .022, 10, 28, Math.PI), M.glint); arc.position.set(0, -.02, .16); arc.visible = false; pivot.add(arc); g.arcs = (g.arcs || []).concat(arc);
      pivot.add(at(S(.018, M.glint, 1, 1, 1, 12, 8), .045, -.045, .14));
    });
    head.add(at(S(.1, M.nose, 1.35, .8, .8), 0, .5, .9));
    var mouth = new T.Group(); mouth.position.set(0, .31, .86); head.add(mouth); g.mouth = mouth;
    var cav = S(.14, M.mouth, 1.25, 1, .45); cav.position.y = -.05; mouth.add(cav);
    var tongue = S(.085, M.tongue, 1.2, .8, .6); tongue.position.set(0, -.12, .05); mouth.add(tongue);
    var teeth = S(.09, M.teeth, 1.4, .25, .4); teeth.position.set(0, .03, .05); mouth.add(teeth);
    var smile = new T.Group(); smile.position.set(0, .34, .88); head.add(smile); g.smile = smile;
    [-1, 1].forEach(function (s) { var t = new T.Mesh(new T.TorusGeometry(.075, .014, 8, 24, Math.PI * .8), M.line); t.rotation.z = Math.PI + (s < 0 ? 0 : Math.PI * .2); t.position.x = s * .07; smile.add(t); });
    var philtrum = new T.Mesh(new T.CylinderGeometry(.012, .012, .08, 8), M.line); philtrum.position.set(0, .41, .9); head.add(philtrum);
    g.cheeks = [-1, 1].map(function (s) { var c = new T.Mesh(new T.CircleGeometry(.13, 24), M.blush.clone()); c.position.set(s * .55, .38, .74); c.lookAt(s * 1.6, .38, 2.4); head.add(c); return c; });
    return g;
  }

  function Scene(canvas, opts) {
    opts = opts || {};
    var renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: !!opts.snapshot });
    renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(opts.head ? 20 : 24, 1, .1, 50);
    if (opts.head) { cam.position.set(0, 1.95, 6.2); cam.lookAt(0, 1.9, 0); } else { cam.position.set(0, 1.35, 7.4); cam.lookAt(0, 1.22, 0); }
    scene.add(new T.HemisphereLight(0xffffff, 0x3a3f48, 1.5));
    var key = new T.DirectionalLight(0xfff4ea, 2.4); key.position.set(-2.5, 4.5, 5); scene.add(key);
    var rim = new T.DirectionalLight(0xdfe8ff, 2.2); rim.position.set(3, 3, -4); scene.add(rim);
    var rim2 = new T.DirectionalLight(0xdfe8ff, 1.2); rim2.position.set(-3.5, 2, -3); scene.add(rim2);
    var fill = new T.DirectionalLight(0xffffff, .55); fill.position.set(3, 1, 4); scene.add(fill);
    var g = build(); scene.add(g.root); if (!opts.head) scene.add(g.shadow);
    var api = {
      g: g, renderer: renderer,
      resize: function () { var w = canvas.clientWidth || 200, h = canvas.clientHeight || 212; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); },
      apply: function (P, C) {
        var r = g.root;
        r.position.y = Math.max(0, -P.y) * .011; r.rotation.y = (P.spin || 0) + C.turn * .25; r.rotation.z = -P.rot * D;
        r.scale.set(P.sx, P.sy, P.sx);
        g.shadow.scale.setScalar(Math.max(.4, 1 - Math.max(0, -P.y) / 90)); g.shadow.material.opacity = Math.max(.25, 1 - Math.max(0, -P.y) / 70);
        g.head.rotation.set(C.lookY * .14 + P.hy * .012, C.turn * .5, -C.head * D * 1.1);
        g.earL.rotation.z = P.earL * D * 1.4; g.earR.rotation.z = -P.earR * D * 1.4;
        g.eyes.forEach(function (e) { e.rotation.set(C.lookY * .38, C.lookX * .5, 0); });
        var hap = C.happy > .45, up = hap ? 1 : Math.min(1, Math.max(P.blink, C.think * .15)), low = 0;
        g.arcs.forEach(function (a) { a.visible = hap; });
        g.lids.forEach(function (l) { l.rotation.x = -.55 + up * 2.05; });
        g.lows.forEach(function (l) { l.rotation.x = .55 - low * 1.6; });
        var mo = Math.max(0, Math.min(1, C.mouth));
        g.mouth.visible = mo > .04; g.mouth.scale.set(.75 + .25 * mo, .1 + mo * 1.05, 1); g.smile.visible = mo < .2;
        g.cheeks.forEach(function (c) { c.material.opacity = Math.min(.9, C.blush * 1.2); });
        var zl = -C.armL * D, zr = -C.armR * D; // erhobene Arme nach vorne, nicht hinter den Kopf
        g.armL.rotation.set(-.42 * Math.cos(zl), 0, zl); g.armR.rotation.set(-.42 * Math.cos(zr), 0, zr);
        var pr = Math.max(.001, C.prop); g.prop.scale.setScalar(pr);
      },
      draw: function () { renderer.render(scene, cam); },
      dispose: function () { renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {} }
    };
    api.resize();
    return api;
  }

  var state = { ready: false, failed: false, waiters: [] };
  function supported() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } }
  function load(cb) {
    if (state.ready) return cb(true); if (state.failed) return cb(false);
    state.waiters.push(cb); if (state.waiters.length > 1) return;
    var done = function (ok) { state.ready = ok; state.failed = !ok; var w = state.waiters; state.waiters = []; w.forEach(function (f) { f(ok); }); };
    var off = false; try { off = (window.RVAnim || JSON.parse(localStorage.getItem('rv_anim_v1') || '{}') || {}).bao3d === false; } catch (e) {}
    if (off || !supported()) return done(false); // Schalter „Bao in 3D“ oder kein WebGL → Vektor-Figur
    if (window.THREE) { T = window.THREE; return done(true); }
    var s = document.createElement('script'); s.src = '/vendor/three-r160.min.js?v=36'; s.async = true;
    s.onload = function () { T = window.THREE; done(!!T); }; s.onerror = function () { done(false); };
    document.head.appendChild(s);
  }
  // Standbild des Kopfes (für Avatar, Menü, Chat-Symbole)
  function headImage(size) {
    var c = document.createElement('canvas'); c.width = c.height = size; c.style.cssText = 'width:' + size + 'px;height:' + size + 'px;position:fixed;left:-9999px';
    document.body.appendChild(c);
    var sc = Scene(c, { head: true, snapshot: true }); sc.renderer.setPixelRatio(1); sc.renderer.setSize(size, size, false);
    sc.apply({ y: 0, rot: 0, sx: 1, sy: 1, hy: 0, earL: 0, earR: 0, blink: 0, spin: 0 }, { turn: 0, head: 0, lookX: 0, lookY: .05, think: 0, happy: 0, mouth: .32, blush: .35, armL: -16, armR: 16, prop: 0 });
    sc.draw(); var url = c.toDataURL('image/png'); sc.dispose(); c.remove(); return url;
  }
  window.RVBao3D = { load: load, Scene: function (c, o) { return Scene(c, o); }, headImage: headImage, get ready() { return state.ready; } };
})();
