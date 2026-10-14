# V17 — Animiertes Command Center nach Referenz

Aufbauend auf V16. Geänderte bzw. neue Dateien: `public/dashboard.css` (Handy-Umbau entfernt), `public/index.html` (Einbindung, leerer Antwortbereich ohne Leerraum), `public/fx.css`, `public/fx.js` (neu), `public/sw.js` (Cache `rv-studio-v17-animated-1`), `package.json`. Geschäftslogik (`app.js`, `public/dashboard.js`), Backend, Schema und Konfiguration sind unverändert.

## Änderungen

- **Layout wie Referenz auf allen Breiten:** Der bisherige Handy-Umbau (3 × 2 Kacheln, gestapelte Kennzahlen) ist entfernt. Unter 720 px Breite wird die Startseite (und die Leiste) per CSS `zoom` auf die Bildschirmbreite skaliert; dadurch entspricht der Aufbau auf dem Handy der Referenz (sechs Kacheln in einer Reihe, Globus in der Mitte, Kennzahlen links/rechts). Folge: kleinere Schrift auf schmalen Handys, genau wie in der Referenz.
- **Abschnittshöhen nach Referenz** (720 × 1280): Übersicht, Schnellzugriff, KI-Assistent und Einblicke passen über die Leiste.
- **Drehende Erde:** Canvas-Globus in orthografischer Projektion mit gepunkteten Kontinenten (vereinfachte Weltumrisse), Gradnetz, funkelnden Städte-Lichtern, Lichtrand und Glanz. Darum: rotierende HUD-Ringe, Radar-Sweep und eine Umlaufbahn mit wanderndem Licht. Auch der Avatar oben links ist eine kleine drehende Erde.
- **Lebendiger KI-Roboter:** äußere Ringe drehen sich, der Kopf schwebt, die Augen pulsieren, blinzeln und schauen umher; bei laufender KI-Anfrage (`rv:ai-state` = busy) drehen Ringe und Augen schneller.
- **Weitere Effekte:** über die Rahmen laufende Lichtkanten, leuchtende Füllungen der Kacheln und Schnellaktionen, glühende Symbole, pulsierendes Abzeichen, Statuspunkte, Zeitraum-Umschalter und Senden-Knopf, Flackern der Titel, sich aufbauende Trendlinien, hochzählende Kennzahlen, drehender Reaktor in der Leiste, aufsteigende Glutpartikel.
- **Leistung und Zugänglichkeit:** eine gemeinsame Animationsschleife mit 30 Bildern/s, pausiert bei verborgener Seite oder wenn die Startseite nicht sichtbar ist. Bei „Bewegung reduzieren" stehen Erde und Effekte still, Glutpartikel entfallen.

## Tests

- `npm test`: 39 Gruppen bestanden (16 Backend, 13 Chat/Sync, 10 Dashboard), 0 fehlgeschlagen.
- Browser (Chromium, Playwright): kein horizontaler Überlauf und sechs Kacheln in einer Reihe bei 390 × 844, 430 × 932, 768 × 1024 und 1440 × 900; Erde wird gezeichnet und ändert sich über die Zeit; Roboter-Animationen aktiv; Kacheln, Schnellaktionen und Leiste öffnen die richtigen Seiten; Zeitraum-Umschalter rechnet; bei reduzierter Bewegung steht die Erde still. Keine JavaScript-Fehler.
- Screenshots im Ordner `test-results/v17/`.

## Grenzen

- Die Weltumrisse sind vereinfacht (grobe Polygone); als Punktraster wirkt das stimmig, ist aber keine exakte Karte.
- Die Referenz-Demozahlen (z. B. 1.246 €, „Sneaker +32 % Nachfrage") werden nicht übernommen; alle Werte bleiben aus echten Artikeln berechnet, Trendlinien erscheinen nur mit zeitlichem Verlauf.
- „Dein KI-Assistent ist bereit." erscheint erst nach erfolgreicher KI-Verbindung (sonst „Verbindung einrichten").
- Der Bereich „Weitere Werkzeuge & Aufgaben" der V16 bleibt unter den Einblicken erhalten.
- Live-Cloudflare, KI-Provider und echte Handys wurden nicht getestet.
