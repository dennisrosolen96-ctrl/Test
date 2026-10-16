/* RV Studio – Zitat-Bühne in der Verkaufsübersicht (ersetzt den Globus).
   Zitate bekannter Unternehmer, ins Deutsche übertragen. Aufgenommen wurden nur Zitate mit belegter Herkunft
   (Reden, Bücher, Aktionärsbriefe, Interviews). Reihenfolge zufällig, keine Wiederholung, bis alle einmal dran waren.
   Eigene Zitate: localStorage „rv_quotes_own“ als Liste von [Text, Name, Rolle]. */
(function () {
  'use strict';
  var Q = [
    ['Bleib hungrig, bleib verrückt.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was man tut.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Deine Zeit ist begrenzt. Verschwende sie nicht damit, das Leben eines anderen zu leben.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Etwa die Hälfte dessen, was erfolgreiche von erfolglosen Unternehmern unterscheidet, ist reine Beharrlichkeit.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Einfach kann schwerer sein als kompliziert.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Wer Neues wagt, macht manchmal Fehler. Am besten gibt man sie schnell zu.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Qualität ist wichtiger als Menge. Ein Volltreffer ist viel mehr wert als zwei halbe.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Design ist nicht nur, wie etwas aussieht. Design ist, wie es funktioniert.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Die Punkte lassen sich nicht nach vorne verbinden, nur im Rückblick.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Fokus heißt, Nein zu sagen.', 'Steve Jobs', 'Mitgründer von Apple'],
    ['Deine unzufriedensten Kunden sind deine beste Quelle zum Lernen.', 'Bill Gates', 'Mitgründer von Microsoft'],
    ['Erfolg ist ein schlechter Lehrer. Er verführt kluge Leute zu glauben, sie könnten nicht verlieren.', 'Bill Gates', 'Mitgründer von Microsoft'],
    ['Es ist gut, Erfolge zu feiern. Wichtiger ist es, aus Fehlern zu lernen.', 'Bill Gates', 'Mitgründer von Microsoft'],
    ['Wir überschätzen immer, was sich in zwei Jahren ändert, und unterschätzen, was sich in zehn Jahren ändert.', 'Bill Gates', 'Mitgründer von Microsoft'],
    ['Preis ist, was du zahlst. Wert ist, was du bekommst.', 'Warren Buffett', 'Investor, Berkshire Hathaway'],
    ['Es dauert 20 Jahre, einen Ruf aufzubauen, und fünf Minuten, ihn zu ruinieren.', 'Warren Buffett', 'Investor, Berkshire Hathaway'],
    ['Regel Nr. 1: Verliere nie Geld. Regel Nr. 2: Vergiss nie Regel Nr. 1.', 'Warren Buffett', 'Investor, Berkshire Hathaway'],
    ['Heute sitzt jemand im Schatten, weil vor langer Zeit jemand einen Baum gepflanzt hat.', 'Warren Buffett', 'Investor, Berkshire Hathaway'],
    ['Sei ängstlich, wenn andere gierig sind, und gierig, wenn andere ängstlich sind.', 'Warren Buffett', 'Investor, Berkshire Hathaway'],
    ['Besser ein wunderbares Unternehmen zu einem fairen Preis als ein faires Unternehmen zu einem wunderbaren Preis.', 'Warren Buffett', 'Investor, Berkshire Hathaway'],
    ['Nimm eine einfache Idee und nimm sie ernst.', 'Charlie Munger', 'Investor, Berkshire Hathaway'],
    ['Ich will nur wissen, wo ich sterben werde, damit ich nie dorthin gehe.', 'Charlie Munger', 'Investor, Berkshire Hathaway'],
    ['Wir sind stur bei der Vision und flexibel bei den Details.', 'Jeff Bezos', 'Gründer von Amazon'],
    ['Ich wusste, dass ich ein Scheitern nicht bereuen würde. Bereuen würde ich nur, es nicht versucht zu haben.', 'Jeff Bezos', 'Gründer von Amazon'],
    ['Deine Marge ist meine Chance.', 'Jeff Bezos', 'Gründer von Amazon'],
    ['Fang beim Kunden an und arbeite dich von dort rückwärts.', 'Jeff Bezos', 'Gründer von Amazon'],
    ['Wer die Zahl seiner Experimente pro Jahr verdoppelt, verdoppelt seinen Erfindungsreichtum.', 'Jeff Bezos', 'Gründer von Amazon'],
    ['Ein Unternehmen sollte nicht süchtig danach sein zu glänzen, denn Glanz hält nicht.', 'Jeff Bezos', 'Gründer von Amazon'],
    ['Wer nie kritisiert werden will, darf nichts Neues tun.', 'Jeff Bezos', 'Gründer von Amazon'],
    ['Wir sehen unsere Kunden als Gäste einer Party, und wir sind die Gastgeber.', 'Jeff Bezos', 'Gründer von Amazon'],
    ['Geschäftschancen sind wie Busse. Es kommt immer noch einer.', 'Richard Branson', 'Gründer der Virgin Group'],
    ['Laufen lernt man nicht, indem man Regeln befolgt. Man lernt es, indem man es tut und hinfällt.', 'Richard Branson', 'Gründer der Virgin Group'],
    ['Ach was, machen wir es einfach.', 'Richard Branson', 'Gründer der Virgin Group'],
    ['Schäm dich nicht für deine Fehler. Lerne aus ihnen und fang neu an.', 'Richard Branson', 'Gründer der Virgin Group'],
    ['Kümmere dich um deine Mitarbeiter, dann kümmern sie sich um dein Geschäft.', 'Richard Branson', 'Gründer der Virgin Group'],
    ['Scheitern ist nur die Gelegenheit, noch einmal anzufangen, diesmal klüger.', 'Henry Ford', 'Gründer der Ford Motor Company'],
    ['Ein Geschäft, das nichts als Geld verdient, ist ein armseliges Geschäft.', 'Henry Ford', 'Gründer der Ford Motor Company'],
    ['Wenn alle gemeinsam vorankommen, stellt sich der Erfolg von selbst ein.', 'Henry Ford', 'Gründer der Ford Motor Company'],
    ['Es gibt nur einen Chef: den Kunden. Er kann jeden feuern, indem er sein Geld woanders ausgibt.', 'Sam Walton', 'Gründer von Walmart'],
    ['Hohe Erwartungen sind der Schlüssel zu allem.', 'Sam Walton', 'Gründer von Walmart'],
    ['Kapital ist nicht knapp. Vision ist es.', 'Sam Walton', 'Gründer von Walmart'],
    ['Feiere deine Erfolge und finde etwas Humor in deinen Fehlschlägen.', 'Sam Walton', 'Gründer von Walmart'],
    ['Übertriff die Erwartungen deiner Kunden.', 'Sam Walton', 'Gründer von Walmart'],
    ['Halte deine Kosten besser im Griff als deine Konkurrenz.', 'Sam Walton', 'Gründer von Walmart'],
    ['Schwimm gegen den Strom.', 'Sam Walton', 'Gründer von Walmart'],
    ['Wenn etwas wichtig genug ist, tust du es, auch wenn die Chancen gegen dich stehen.', 'Elon Musk', 'Gründer von SpaceX'],
    ['Beharrlichkeit ist sehr wichtig. Gib nicht auf, außer du wirst dazu gezwungen.', 'Elon Musk', 'Gründer von SpaceX'],
    ['Achte auf negatives Feedback und such danach, besonders bei Freunden.', 'Elon Musk', 'Gründer von SpaceX'],
    ['Wer sehr hoch zielt, kann kaum komplett scheitern.', 'Larry Page', 'Mitgründer von Google'],
    ['Jag der Vision hinterher, nicht dem Geld. Das Geld folgt dir dann.', 'Tony Hsieh', 'ehem. Chef von Zappos'],
    ['Kundenservice sollte keine Abteilung sein, sondern die ganze Firma.', 'Tony Hsieh', 'ehem. Chef von Zappos'],
    ['Das größte Risiko ist, kein Risiko einzugehen.', 'Mark Zuckerberg', 'Gründer von Facebook'],
    ['Was würdest du tun, wenn du keine Angst hättest?', 'Sheryl Sandberg', 'ehem. COO von Facebook'],
    ['Mach etwas, das Menschen wollen.', 'Paul Graham', 'Mitgründer von Y Combinator'],
    ['Tu Dinge, die nicht skalieren.', 'Paul Graham', 'Mitgründer von Y Combinator'],
    ['Konkurrenz ist etwas für Verlierer.', 'Peter Thiel', 'Mitgründer von PayPal'],
    ['Glück ist die Dividende von Schweiß. Je mehr du schwitzt, desto mehr Glück hast du.', 'Ray Kroc', 'Gründer der McDonald’s Corporation'],
    ['Wer kein Risiko eingehen will, sollte schleunigst aus dem Geschäft aussteigen.', 'Ray Kroc', 'Gründer der McDonald’s Corporation'],
    ['Mode vergeht, Stil bleibt.', 'Coco Chanel', 'Gründerin von Chanel'],
    ['Um unersetzlich zu sein, muss man immer anders sein.', 'Coco Chanel', 'Gründerin von Chanel'],
    ['Einfachheit ist der Schlüssel zu wahrer Eleganz.', 'Coco Chanel', 'Gründerin von Chanel'],
    ['Luxus muss bequem sein, sonst ist es kein Luxus.', 'Coco Chanel', 'Gründerin von Chanel'],
    ['Moden vergehen, Stil ist ewig.', 'Yves Saint Laurent', 'Mitgründer von Yves Saint Laurent'],
    ['Eleganz heißt nicht aufzufallen, sondern in Erinnerung zu bleiben.', 'Giorgio Armani', 'Gründer von Armani'],
    ['Das Wesen von Stil ist eine einfache Art, etwas Kompliziertes zu sagen.', 'Giorgio Armani', 'Gründer von Armani'],
    ['Ich entwerfe keine Kleider. Ich entwerfe Träume.', 'Ralph Lauren', 'Gründer von Ralph Lauren'],
    ['Kauf weniger, wähle gut, lass es lange halten.', 'Vivienne Westwood', 'Modedesignerin und Unternehmerin'],
    ['Nur das Beste für den Athleten.', 'Adi Dassler', 'Gründer von adidas'],
    ['Ich habe nie von Erfolg geträumt. Ich habe dafür gearbeitet.', 'Estée Lauder', 'Gründerin von Estée Lauder'],
    ['Wenn du nicht verkaufst, liegt es nicht am Produkt. Es liegt an dir.', 'Estée Lauder', 'Gründerin von Estée Lauder'],
    ['Stell dir vor, jeder Mensch trägt ein Schild um den Hals: Gib mir das Gefühl, wichtig zu sein.', 'Mary Kay Ash', 'Gründerin von Mary Kay'],
    ['Die Feiglinge haben nie angefangen, die Schwachen sind unterwegs gestorben. Übrig sind wir.', 'Phil Knight', 'Mitgründer von Nike'],
    ['Hör nicht auf. Denk nicht einmal ans Aufhören, bevor du angekommen bist.', 'Phil Knight', 'Mitgründer von Nike'],
    ['Lass dich nicht von dem einschüchtern, was du nicht weißt. Das kann deine größte Stärke sein.', 'Sara Blakely', 'Gründerin von Spanx'],
    ['Scheitern ist nicht das Ergebnis. Scheitern heißt, es nicht zu versuchen.', 'Sara Blakely', 'Gründerin von Spanx'],
    ['Heute ist hart, morgen wird es schlimmer, aber übermorgen scheint die Sonne.', 'Jack Ma', 'Gründer von Alibaba'],
    ['Wenn du nicht aufgibst, hast du immer noch eine Chance.', 'Jack Ma', 'Gründer von Alibaba'],
    ['Kunden zuerst, Mitarbeiter an zweiter Stelle, Aktionäre an dritter.', 'Jack Ma', 'Gründer von Alibaba'],
    ['Nur wer schläft, macht keine Fehler.', 'Ingvar Kamprad', 'Gründer von IKEA'],
    ['Ressourcen zu verschwenden ist eine Todsünde.', 'Ingvar Kamprad', 'Gründer von IKEA'],
    ['Einfachheit ist eine Tugend.', 'Ingvar Kamprad', 'Gründer von IKEA'],
    ['Die Angst, Fehler zu machen, ist die Wurzel der Bürokratie.', 'Ingvar Kamprad', 'Gründer von IKEA'],
    ['Das meiste liegt noch vor uns. Eine wunderbare Zukunft!', 'Ingvar Kamprad', 'Gründer von IKEA'],
    ['Versuch nie, der Klügste im Raum zu sein.', 'Michael Dell', 'Gründer von Dell'],
    ['Hab keine Angst, das Gute aufzugeben, um das Großartige zu erreichen.', 'John D. Rockefeller', 'Gründer von Standard Oil'],
    ['Früh aufstehen, hart arbeiten, Öl finden.', 'J. Paul Getty', 'Gründer der Getty Oil Company'],
    ['Ein Unternehmer springt von einer Klippe und baut sich auf dem Weg nach unten ein Flugzeug.', 'Reid Hoffman', 'Mitgründer von LinkedIn'],
    ['Wenn dir die erste Version deines Produkts nicht peinlich ist, bist du zu spät gestartet.', 'Reid Hoffman', 'Mitgründer von LinkedIn'],
    ['Es ist egal, wie oft du scheiterst. Du musst nur einmal richtig liegen.', 'Mark Cuban', 'Unternehmer und Investor'],
    ['Arbeite so, als würde jemand rund um die Uhr daran arbeiten, dir alles wegzunehmen.', 'Mark Cuban', 'Unternehmer und Investor'],
    ['Verkäufe heilen alles.', 'Mark Cuban', 'Unternehmer und Investor'],
    ['Je mehr du weißt, desto weniger brauchst du.', 'Yvon Chouinard', 'Gründer von Patagonia'],
    ['Wie du einen Berg besteigst, ist wichtiger, als den Gipfel zu erreichen.', 'Yvon Chouinard', 'Gründer von Patagonia'],
    ['Lieber Geld verlieren als Vertrauen.', 'Robert Bosch', 'Gründer der Robert Bosch GmbH'],
    ['Ich zahle nicht gute Löhne, weil ich viel Geld habe, sondern ich habe viel Geld, weil ich gute Löhne zahle.', 'Robert Bosch', 'Gründer der Robert Bosch GmbH'],
    ['Für augenblicklichen Gewinn verkaufe ich die Zukunft nicht.', 'Werner von Siemens', 'Gründer von Siemens'],
    ['Das Beste oder nichts.', 'Gottlieb Daimler', 'Gründer der Daimler-Motoren-Gesellschaft'],
    ['Die Liebe zum Erfinden höret nimmer auf.', 'Carl Benz', 'Gründer von Benz & Cie.'],
    ['Ich fand den Sportwagen meiner Träume nicht. Also habe ich beschlossen, ihn selbst zu bauen.', 'Ferry Porsche', 'Gründer von Porsche'],
    ['Der beste Ferrari ist immer der nächste.', 'Enzo Ferrari', 'Gründer von Ferrari'],
    ['Erfolg besteht zu 99 Prozent aus Misserfolg.', 'Soichiro Honda', 'Gründer von Honda'],
    ['Hab keine Angst vor Fehlern. Aber mach denselben Fehler nicht zweimal.', 'Akio Morita', 'Mitgründer von Sony'],
    ['Wer seine Erfolgsquote steigern will, muss seine Fehlerquote verdoppeln.', 'Thomas J. Watson', 'Gründer von IBM'],
    ['Erfolg scheint mit Handeln verbunden zu sein. Erfolgreiche Menschen bleiben in Bewegung.', 'Conrad Hilton', 'Gründer von Hilton Hotels'],
    ['Ideen sind leicht. Die Umsetzung ist schwer.', 'Guy Kawasaki', 'Unternehmer, ehem. Apple'],
    ['Such keine Kunden für deine Produkte, sondern Produkte für deine Kunden.', 'Seth Godin', 'Unternehmer und Autor'],
    ['Genie ist ein Prozent Inspiration und neunundneunzig Prozent Transpiration.', 'Thomas Edison', 'Erfinder und Unternehmer'],
    ['Fähigkeiten sind billig. Leidenschaft ist unbezahlbar.', 'Gary Vaynerchuk', 'Gründer von VaynerMedia'],
    ['Bau etwas, das 100 Menschen lieben, statt etwas, das eine Million Menschen nur ein bisschen mögen.', 'Brian Chesky', 'Mitgründer von Airbnb'],
    ['Furchtlosigkeit ist wie ein Muskel. Je mehr man sie trainiert, desto stärker wird sie.', 'Arianna Huffington', 'Gründerin der Huffington Post'],
    ['Scheitern ist nicht das Gegenteil von Erfolg. Es ist ein Teil davon.', 'Arianna Huffington', 'Gründerin der Huffington Post'],
    ['Wir gehen weiter, öffnen neue Türen und machen neue Dinge, weil wir neugierig sind.', 'Walt Disney', 'Gründer von Disney'],
    ['Disziplin ist die Brücke zwischen Zielen und Erfolg.', 'Jim Rohn', 'Unternehmer und Autor']
  ];
  window.RVQuotes = Q;

  var doc = document, HOLD = 8000, bag = [], timer = 0, t0 = 0, stage, txt, who, bar, sweep, raf = 0;
  function cfg() { return window.RVAnim || {}; }
  function own() { try { var v = JSON.parse(localStorage.getItem('rv_quotes_own') || '[]'); return Array.isArray(v) ? v.filter(function (q) { return q && q[0]; }) : []; } catch (e) { return []; } }
  function draw() {
    if (!bag.length) {
      var all = Q.concat(own());
      bag = all.map(function (q) { return q; });
      for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
    }
    return bag.pop();
  }
  function initials(n) { var w = String(n || '').split(' ').filter(Boolean); return w.length ? (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase() : 'RV'; }
  function reduced() { return doc.documentElement.classList.contains('rv-reduce'); }

  function build(host) {
    stage = doc.createElement('div'); stage.className = 'rq'; stage.setAttribute('role', 'button'); stage.tabIndex = 0;
    stage.setAttribute('aria-label', 'Unternehmer-Zitat, antippen für das nächste');
    stage.innerHTML = '<span class="rq-sparks" aria-hidden="true"></span><span class="rq-spot" aria-hidden="true"></span><span class="rq-mark" aria-hidden="true">„</span><span class="rq-sweep" aria-hidden="true"></span>'
      + '<span class="rq-eyebrow"><i></i>Unternehmer-Weisheit</span><blockquote class="rq-text" aria-live="polite"></blockquote>'
      + '<span class="rq-who"><span class="rq-av"></span><span class="rq-nm"><b></b><small></small></span></span><span class="rq-bar"><i></i></span>';
    host.appendChild(stage);
    txt = stage.querySelector('.rq-text'); who = stage.querySelector('.rq-who'); bar = stage.querySelector('.rq-bar i'); sweep = stage.querySelector('.rq-sweep');
    var sp = stage.querySelector('.rq-sparks');
    for (var s = 0; s < 10; s++) { var b = doc.createElement('b'); b.style.left = (6 + Math.random() * 88) + '%'; b.style.animationDelay = (-Math.random() * 7) + 's'; b.style.animationDuration = (5 + Math.random() * 3.5) + 's'; sp.appendChild(b); }
    stage.addEventListener('click', next);
    stage.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
  }
  function render(q) {
    var line = doc.createElement('span'); line.className = 'rq-line';
    String(q[0]).split(' ').forEach(function (w, k, arr) {
      var s = doc.createElement('span'); s.className = 'rq-w'; s.textContent = w + (k < arr.length - 1 ? ' ' : '');
      s.style.transitionDelay = (k * 45) + 'ms'; line.appendChild(s);
    });
    txt.replaceChildren(line);
    who.querySelector('b').textContent = q[1] || 'Unbekannt';
    who.querySelector('small').textContent = q[2] || '';
    who.querySelector('.rq-av').textContent = initials(q[1]);
    requestAnimationFrame(function () { requestAnimationFrame(function () { line.classList.add('in'); who.classList.remove('out'); }); });
    if (cfg().globeFx !== false && !reduced()) { sweep.classList.remove('go'); void sweep.offsetWidth; sweep.classList.add('go'); }
    t0 = performance.now();
  }
  function schedule() { clearTimeout(timer); if (cfg().globeSpin !== false) timer = setTimeout(next, HOLD); }
  function next() {
    clearTimeout(timer);
    var line = txt.firstChild;
    if (line) { line.classList.remove('in'); line.classList.add('out'); Array.prototype.forEach.call(line.children, function (s, k) { s.style.transitionDelay = (k * 18) + 'ms'; }); }
    who.classList.add('out');
    setTimeout(function () { render(draw()); schedule(); }, reduced() ? 0 : 600);
  }
  function progress(now) {
    raf = requestAnimationFrame(progress);
    if (!stage.offsetParent) return;
    bar.style.width = cfg().globeSpin === false ? '0%' : Math.min(100, (now - t0) / HOLD * 100) + '%';
  }
  function init() {
    var host = doc.getElementById('hmGlobe'); if (!host || host.querySelector('.rq')) return;
    host.classList.add('rq-host');
    build(host);
    who.classList.add('out'); render(draw()); schedule();
    raf = requestAnimationFrame(progress);
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) clearTimeout(timer); else schedule(); });
    doc.addEventListener('rv:anim-change', schedule);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
