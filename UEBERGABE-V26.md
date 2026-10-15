# V26 — Kopfmenü statt unterem Menü

Das untere Menü und der KI-Ball darin sind entfernt. Navigiert wird jetzt über den Kopf, der auf **jeder Seite** oben steht – im Aufbau deines Vorbilds:

- **Erste Zeile:** drehender Globus und Begrüßung („Guten Morgen/Tag/Abend, Name!“) – antippen führt zur Startseite (unter der Begrüßung steht auf allen anderen Seiten „‹ Zur Startseite“). Rechts die KI-Leiste mit Status (öffnet den KI-Chat) und die Glocke mit rotem Punkt bei offenen Aufgaben.
- **Zweite Zeile:** sechs Kacheln **Studio · Bestand · Einkäufe · Verkauf · KI-Chat · Einstellungen**. Die aktive Seite leuchtet blau wie im Vorbild, das Abzeichen bei „Verkauf“ bleibt.

## Verhalten der Kacheln

| Kachel | Öffnet |
| --- | --- |
| Studio | das Studio – ein angefangener Artikel bleibt erhalten (vorher startete die Kachel immer einen neuen Artikel) |
| Bestand | Bestand, Bereich „Bestand“ |
| Einkäufe | Bestand, Bereich „Einkäufe“ |
| Verkauf | **Insights** (Umsatz, Gewinn, Verkäufe) – passend zum Diagramm-Symbol. Vorher war Insights ohne unteres Menü nur noch über die Startseite erreichbar. |
| KI-Chat | KI-Chat |
| Einstellungen | Einstellungen |

Auf dem Handy bleibt der Aufbau gleich (sechs Kacheln in einer Reihe), nur kompakter; die KI-Leiste zeigt dort nur ihre Kugel. Lange Beschriftungen trennen sauber („Einstel-lungen“).

Weil unten nichts mehr liegt, enden alle Seiten normal; die fixierten Leisten (Weiter/Zurück im Studio, Eingabe im Chat, Sammelbearbeitung im Bestand, Meldungen) sitzen jetzt direkt am unteren Rand.

## Technik

Das alte untere Menü bleibt unsichtbar im Code, weil intern noch Funktionen dessen Knöpfe auslösen; es wird nirgends angezeigt. Der bisherige Kopf der Startseite ist in das neue Kopfmenü umgezogen (gleiche IDs, daher funktionieren Begrüßung, KI-Status, Glocke und Abzeichen unverändert).

## Geänderte Dateien

`public/index.html` (Kopfmenü), `public/topnav.css` (neu), `app.js`/`public/app.js` (Navigation und aktive Kachel), `public/sw.js` (Cache `rv-studio-v26-1`), `tests/browser.mjs` (Navigation über das Kopfmenü).

## Tests

- `npm test`: alle Gruppen bestanden.
- Browser (Chromium) 390, 720, 1440 px: jede Kachel öffnet die richtige Seite und leuchtet, Globus führt zur Startseite, unteres Menü nirgends sichtbar, kein horizontaler Überlauf. Studio-Ablauf bis zum Speichern, Bestand-Funktionen, KI-Chat und Einstellungen erneut durchgespielt – ohne Fehler.
