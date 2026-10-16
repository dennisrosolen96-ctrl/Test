# V30 — Snipes (Vinted-Einkauf)

Neue Seite **Snipes** (siebte Kachel im Kopfmenü).

## Ablauf
1. **Suchaufträge** anlegen (Suchbegriff, Höchstpreis, optional Größe und eigener Wiederverkaufspreis).
2. Ein **Userscript** (Tampermonkey) auf dem eigenen Gerät fragt die Vinted-Suche ab und gibt die Antwort an die App. Die App lädt das Skript selbst herunter („Userscript herunterladen“ / „Code kopieren“), `@match` ist automatisch die Adresse der App.
3. Jeder Treffer wird bewertet: Einkaufskosten = Preis + Käuferschutz (0,70 € + 5 %) + Eingangsversand; Verkaufspreis = dein Wert › Median deiner eigenen Verkäufe (≥ 2 passende) › 85 % des Marktmedians der Treffer (≥ 8). Danach Gebühr beim Wiederverkauf, Gewinn und Marge.
4. **Snipe** = Gewinn ≥ Mindestgewinn **und** Marge ≥ Mindestmarge (Standard 15 € / 40 %). Alarm per Toast, Vibration und Benachrichtigung (Service Worker, öffnet den Vinted-Link).
5. **Gekauft** legt den Artikel mit Einkaufspreis, Marke, Größe, Quelle „Vinted“ und Link im Bestand an.

## Grenzen (bewusst)
- Abgefragt wird nur im eigenen Browser mit der eigenen Sitzung, nur lesend, mit zufälligem Intervall (Standard ca. 75 s, mindestens 45 s) und Pausen zwischen den Suchen.
- Bei **403/429/401** pausiert die App 5 Min., danach verdoppelt sich die Pause (bis 30 Min.). Es gibt **keine** Tarnung, keinen Server-Proxy und keine Umgehung von Sperren.
- Abfrage läuft nur, solange die App im Vordergrund offen ist (Browser drosseln Hintergrund-Tabs). Bei geschlossener App gibt es keine Alarme – dafür zusätzlich „Suche speichern“ in der Vinted-App nutzen.
- Automatisches Abfragen widerspricht den Vinted-AGB; Risiko für den Account liegt beim Nutzer. Nicht eingeloggt abfragen reduziert es.
- Die echte Vinted-Antwort konnte in der Entwicklungsumgebung nicht geprüft werden (Zugriff dort gesperrt). Getestet mit einem Mock des Userscripts: Erst-Abfrage still, neue Snipes alarmieren, 403 pausiert. Feldnamen sind tolerant ausgelesen (`price` als Zahl/Text/Objekt, `photo.url`, `brand_title`, `size_title`, `url`).

## Technisch
`public/snipe.css`, Block „Snipes V30“ in `app.js` (Speicher `rv_snipe_v1`), Section `#sniper` in `index.html`, Kachel `data-nav="snipe"`, `topnav.css` auf 7 Kacheln, `sw.js` mit `notificationclick`, Cache `rv-studio-v30-1`.
