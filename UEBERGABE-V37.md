# V37: Zurück zum 2D-Bao

**Nichts wurde auf Cloudflare veröffentlicht.** Deployment erst nach ausdrücklichem „ja“.
Die Einstellungen zeigen **V37 · 17.10.2026**, der Cache heißt `rv-studio-v37`.

## Was geändert wurde

- **3D-Bao vollständig entfernt.** Gelöscht sind:
  - `public/bao3d.js` und three.js (`public/vendor/three-r160.min.js` mit Lizenz)
  - der 3D-Anschluss in `bao.js`
  - die 3D-Stile in `bao.css`
  - der Schalter „Bao in 3D“
  - die 3D-Einträge im Service Worker
- **Es gilt wieder der 2D-Vektor-Bao aus V35** mit allen Bewegungen und Reaktionen (Idle, Antippen, Blick, Denken, Sprechen, Jubel, Geldkanone, Auftritte).
- **Das V36-Design bleibt erhalten:**
  - Menü mit fünf großen Kacheln
  - gestaltetes Bereichsmenü
  - Briefing im RV-Design
  - freistehende Bao-Bühne auf der KI-Seite
  - Statusfarben im Bestand
  - abgesichertes Laden der Stylesheets

## Tests

| Test | Ergebnis |
| --- | --- |
| Backend | 18/18 |
| Chat & Sync | 13/13 |
| Dashboard | 10/10 |
| Bao-Backend | 6/6 |
| Browser-Abläufe | 17/17 |
| Fotostudio | 14/14 |
