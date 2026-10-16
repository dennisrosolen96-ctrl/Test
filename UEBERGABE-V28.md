# V28 — Animationen wieder vollständig an

## Warum auf dem S25 Ultra nichts mehr animiert war

1. **Systemvorgabe „Bewegung reduzieren“:** Samsung meldet bei *Energiesparmodus* oder *Einstellungen › Eingabehilfe › Sichtbarkeit › Animationen entfernen* an den Browser „bitte keine Bewegung“. Die App hat das an rund 20 Stellen strikt befolgt und dann **alle** Animationen abgeschaltet – unabhängig von den eigenen Animations-Einstellungen. Auch der Globus und die KI-Kugel blieben stehen.
2. **Automatischer Sparmodus:** Lief die Seite in den ersten Sekunden kurz unter ~12 Bildern/s (z. B. beim ersten Laden), wurden teure Effekte für die ganze Sitzung abgeschaltet – auch auf schnellen Geräten.
3. Die Animationsschleife (Globus, Kugel) lief nur auf Startseite und Chat.

## Was jetzt gilt

- Neuer Hauptschalter **Bewegung** in *Einstellungen › Darstellung & Animationen*:
  - **Immer an** (Standard) – alle Effekte laufen, auch bei Energiesparmodus oder „Animationen entfernen“.
  - **Wie das System** – folgt der Handy-Einstellung (altes Verhalten).
  - **Aus** – alles steht still.
  Beim Speichern einer Änderung lädt die App einmal neu, damit Globus und Kugel sofort passen.
- **Automatischer Sparmodus** ist standardmäßig **aus** (bleibt als Schalter für ältere Geräte).
- Bestehende Einstellungen werden einmalig übernommen und dabei Sparmodus und Systemvorgabe abgeschaltet.
- Alle Einzelschalter wirken jetzt auch auf den neuen Seiten:
  - **Glanz** gleitet auch über Kopfmenü, Startseiten-Kacheln, Listen, Insights, Chat, Einstellungen, Studio.
  - **Randlicht** (jetzt standardmäßig an) läuft als Lichtkante um alle Panels.
  - **Pulsieren** betrifft KI-Leiste, Hauptknöpfe, Abzeichen, Status-Punkte.
  - **Schimmer**, **Globus-Effekte** (inkl. Status-Ring im Bestand), **Seitenwechsel** (gestaffelter Auftritt auf allen Seiten), **Lichter im Hintergrund**.
- Globus im Kopfmenü und KI-Kugeln drehen auf jeder Seite, nicht nur auf der Startseite.

## Technik

Die Regeln für „reduzierte Bewegung“ in allen Stylesheets werden beim Start auf die Klasse `html.rv-reduce` umgeschrieben; die App setzt diese Klasse nach der Einstellung.

## Geänderte Dateien

`public/anim.js`, `public/fx.js`, `public/anim.css`, `public/settings.css`, `public/sw.js` (Cache `rv-studio-v28-1`).

## Tests

- `npm test`: alle Gruppen bestanden.
- Browser mit simuliertem „Bewegung reduzieren“ (wie Energiesparmodus): Standard → Globus dreht, Kugel, Status-Ring und Abzeichen animiert, kein Sparmodus; „Wie das System“ und „Aus“ → alles steht. Alte gespeicherte Einstellung mit Sparmodus wird korrekt umgestellt. Schalter Pulsieren und Randlicht wirken sofort, „Bewegung: Aus“ wird gespeichert und nach Neuladen angewendet. Startseite und Studio-Ablauf erneut ohne Fehler.
