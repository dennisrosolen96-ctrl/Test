# V25 — KI-Chat im Design der Startseite

Der KI-Chat war bisher eine vergrößerte Kopie des Startseiten-Kastens (max. 8 Nachrichten, nichts gespeichert). Jetzt ist er eine eigene, vollwertige Chat-Seite im gleichen Design wie alle anderen Seiten.

## Neu

- **Kopf** wie auf allen Seiten: Energie-Avatar, „KI-Assistent“, Anbieter und Anzahl Fragen, Status (Online · Anfrage … · Einrichten · Prüfen), „Neuer Chat“.
- **Echter Gesprächsverlauf:** eigene Nachrichten rechts (orange), Antworten links (Glas), Uhrzeit, **Kopieren**-Knopf, Tipp-Anzeige mit drei Punkten während die KI schreibt, „Erneut senden“ bei Fehlern. Der Verlauf bleibt gespeichert (letzte 60 Nachrichten, nur auf diesem Gerät), auch nach dem Neuladen.
- **Antworten formatiert:** fett, Aufzählungen und nummerierte Listen werden sauber dargestellt.
- **Gedächtnis im Gespräch:** Die letzten Nachrichten werden mitgeschickt, damit Folgefragen funktionieren. Nach jeder Antwort erscheinen Folgefragen („Konkreter, bitte“, „Als kurze Stichpunkte“, „Was mache ich als Erstes?“).
- **Artikel als Kontext anhängen** (Etikett-Symbol im Eingabefeld): Artikel aus dem Bestand suchen und auswählen. Die KI bekommt Marke, Modell, Größe, Zustand, Mängel, Maße, EK, Preise und Lagertage – keine Fotos. Passende Schnellfragen: „Was ist er wert?“, „Text für Vinted“, „Schneller verkaufen“. Auch direkt aus der **Artikelakte** über „✦ KI zu diesem Artikel fragen“.
- **Mehr Daten für bessere Antworten:** Freie Fragen im Chat schicken jetzt einen begrenzten Auszug deines Bestands und deiner Verkäufe mit (wie bisher die Schnellaktionen der Startseite).
- **App-Befehle bleiben sofort:** „Öffne den Bestand“, „Zeige meine Entwürfe“, „Backup erstellen“ usw. werden ohne KI direkt ausgeführt – im Chat werden sie nur noch erkannt, wenn die Nachricht mit einem Befehl beginnt. Vorher wurden z. B. Fragen mit „verkauf…“ fälschlich als Befehl „Finanzen öffnen“ behandelt.
- **Einrichten direkt im Chat:** Ohne RV-Passwort erscheint oben eine Karte zum Verbinden (nur für die Sitzung) oder ein Sprung zu Einstellungen › KI.
- **Seitenleiste:** 7 schnelle Anfragen (Bestand bewerten, Preise prüfen, Verkaufstext, Sortiment-Analyse, Lager optimieren, Woche planen, Ideen), App-Befehle als Chips, aktuelle Insights.
- Eingabe: Enter sendet, Shift + Enter neue Zeile, Feld wächst mit, Spracheingabe und „Neuer Artikel mit Foto“ wie bisher.

Die Unterhaltung im KI-Kasten der Startseite und die Chat-Seite sind ein gemeinsamer Verlauf.

## Grenzen

Der Server-Endpunkt ist unverändert: die KI kennt nur deine App-Daten, keine Live-Marktpreise. Das steht auch unter dem Eingabefeld.

## Geänderte Dateien

`public/index.html` (Chat neu), `public/chat.css` (neu), `app.js`/`public/app.js` (Chat-Logik, KI-Anfrage um Verlauf, Artikel-Kontext und Anzeige-Text erweitert), `public/sw.js` (Cache `rv-studio-v25-1`).

## Tests

- `npm test`: alle Gruppen bestanden.
- Browser (Chromium) 390, 720, 1440 px mit simuliertem KI-Server: Passwort im Chat setzen, Artikel anhängen, Kontext wird mitgeschickt, Tipp-Anzeige, formatierte Antwort, Folgefrage schickt den Verlauf mit, Befehl „Öffne den Bestand“ per Enter, Verlauf nach Neuladen vorhanden, „KI fragen“ aus der Artikelakte, gemeinsamer Verlauf mit der Startseite. Keine JavaScript-Fehler.
