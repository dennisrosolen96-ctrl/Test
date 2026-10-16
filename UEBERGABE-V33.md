# V33: RVO-Farbpalette, Statusfarben, Original-Logo, Pixel-Panda

**Nichts wurde auf Cloudflare veröffentlicht.** Deployment erst nach ausdrücklichem „ja“.

## Version
- Die Einstellungen zeigen unter „Über die App“ jetzt **V33 · 16.10.2026**. Vorher stand dort fest „V23“.
- Die Version steht zentral in `app.js` (`RV_VERSION`, `RV_VERSION_DATE`). Sie wird bei jeder Auslieferung erhöht, zusammen mit `CACHE` in `public/sw.js` (`rv-studio-v33`) und `package.json` (33.0.0).

## Farbpalette (exakt nach Vorgabe)
- Flächen: #050608 (Haupt), #0B0D11 (sekundär), #12151A (Karten), #181C22 (Panels/aktiv), #252A32 (Linien).
- Text: #F5F7FA (Überschriften), #D9DEE5 (normal), #9EA6B2 (sekundär), #6F7782 (schwach). Weiß wird nur für Text verwendet.
- Glanz und Glas: rgba(255,255,255,0.08) bzw. 0.14. Helle Leuchteffekte in Hintergründen, Schatten und Rändern sind halbiert, damit weniger Silber und mehr Schwarz bleibt. Das Hintergrundbild und die schwebenden Lichter sind deutlich dunkler.
- Neue Variablen in `noir.css`: `--rv-*`.

## Statusregeln
- **Rot** (#E53935 / #FF5A5F / #2A1113): Erinnerungen (Tab-Symbol), Aufgaben-Zähler in der Arbeitszentrale und auf der Startseite, Wiedervorlagen, Benachrichtigungspunkt, Warnungen (`.warn`, z. B. „5 Artikel über 60 Tage“), Minuszahlen und Verluste (`.neg`, `.bad`), fallende Sparklines.
- **Grün** (#22C55E / #4ADE80 / #102117): Gewinne, Pluszahlen, Wachstum, steigende Sparklines, Umsatz-Linie, „bereit/verbunden“, neue Verkäufe am Verkauf-Symbol.
- Neutrale Infos bleiben weiß bzw. grau.

## Logo
- `rv-monogram.png` wird jetzt 1:1 aus dem Original `rv-logo.jpg` erzeugt: gleiche Form, nur weiß auf Schwarz, ohne Nachzeichnen.
- Oben links ohne Kreis-Zuschnitt, ohne Leuchten und ohne Filter. Das Logo wird direkt im HTML gesetzt.
- `rv-mark-cropped.png` ist wieder im Originalzustand.

## Pixel-Panda „Bao“ (`panda.js`)
- Pixelfigur auf einem 32×32-Raster, gestochen scharf skaliert. Er trägt ein Headset mit grüner Status-LED als Zeichen für den digitalen Assistenten.
- **Bereit:** wippt pixelweise, blinzelt, folgt Finger oder Maus mit den Augen und winkt ab und zu.
- **Hört zu:** beim Tippen, nickt bei jedem Tastendruck.
- **Überlegt:** Denkpunkte erscheinen.
- **Spricht:** Mund auf und zu passend zur Antwort, die Wort für Wort erscheint, dazu winkt er.
- **Freut sich:** Herz, Funkeln und ein Hüpfer.
- **Antippen** (Startseite und Chat-Bühne): Bao freut sich.
- Die Kopplung an den Chat ist unverändert: Eingabefelder, `rv:ai-state` und neue Nachrichten in `#homeAiFeed`.

## Tests
- `npm test`: Backend 18/18, Chat & Sync 13/13, Dashboard 10/10.
- `npm run test:fotostudio`: 14/14.
- Im Browser geprüft: Der Chat-Ablauf durchläuft alle Zustände ohne Skriptfehler, und alle Wörter werden sichtbar. Die Version in den Einstellungen und die roten Zähler wurden per Screenshot geprüft.
- `npm run test:browser` schlägt weiterhin bei „0 €“ fehl, weil die Beispielartikel Umsatz erzeugen. Das ist schon seit v31.3 so.
