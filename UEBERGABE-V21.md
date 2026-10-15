# V21 — Bestand im Design der Startseite

Die Bestandsseite wurde komplett neu aufgebaut und basiert jetzt auf denselben Flächen, Farben und Effekten wie die Startseite. Geschäftslogik, Datenstruktur, Backend und Cloud-Sync bleiben unverändert.

## Was neu ist

- **Kopf wie „Guten Tag!“:** leuchtende Bestands-Kugel, „Dein Bestand“ mit Zusammenfassung, Knopf „Neuer Artikel“ im Stil der KI-Pille.
- **Sechs Bereichs-Kacheln** (Bestand, Arbeitsmodus, Analyse, Marken, Einkäufe, Erinnerungen) wie die sechs Kacheln oben auf der Startseite. Der aktive Bereich leuchtet orange wie „Heute“.
- **Bestands-Übersicht** im Aufbau der Verkaufs-Übersicht:
  - links Kennzahlen mit orangen Symbolkacheln: Warenwert (EK), Verkaufswert mit Spanne, Ø Lagerdauer (Hinweis bei Artikeln über 60 Tage), realisierter Gewinn mit Marge und Verlaufslinie der letzten 8 Wochen
  - Mitte: animierter **Status-Ring** (Online / Bereit / Entwurf / Verkauft) als Gegenstück zum Globus, mit drehenden HUD-Ringen und umlaufendem Licht
  - rechts: Top Kategorien (blaue Balken wie auf der Startseite), Online-Angebote, Verkaufsquote
- **Analyse-Bereich** zusätzlich mit Lager-Alter, Top Marken nach Verkaufswert und **Ladenhütern** (antippen öffnet die Artikelakte).
- **Arbeitszentrale** im Stil des Schnellzugriffs: Kacheln mit Symbol und blauem Zähler-Abzeichen (pulsiert wie auf der Startseite).
- **Artikelkarten neu:** großes Titelbild (4:5), Status-Chip mit Leuchtpunkt, Lagertage, Marke + Modell, Größe/Zustand/Farbe, Verkaufspreis in Weiß, EK, grüne Spanne in € und %, Hinweis auf fehlende Angaben. Raster ist jetzt Standard, Liste bleibt umschaltbar.
- **Suche** im Stil des KI-Eingabefelds, **Statusfilter** als Zeitraum-Umschalter.
- **Datensicherung** (Backup, Import, lokale Kopien) einklappbar am Seitenende — war vorher versteckt.
- **Artikelakte** an dieselben Farben angepasst.
- Alle Gold-/Braun-Töne, die es auf der Startseite nicht gibt (goldene Überschrift, goldene Preise, braune Knöpfe, goldene Artikelnummern), sind entfernt. Orange erscheint nur noch wie auf der Startseite: Symbolkacheln, aktive Auswahl, Warnhinweise.

## 30 Beispielartikel (Kleidung)

`public/demo.js` legt 30 Kleidungsstücke mit gezeichnetem Titelbild an (Hoodies, Jacken, Daunenjacken, Jeans, Hemden, Polos, Kleid, Rock, Sneaker, Boots, Cap, Mütze …), mit realistischen Marken, Größen, Preisen, Lagerplätzen und gemischtem Status. Fünf davon sind verkauft (einer heute), damit auch die Startseite Werte zeigt.

- Die Bilder sind SVG und funktionieren offline.
- Bestehende alte Beispielartikel werden automatisch durch die neuen ersetzt; eigene Artikel werden nie angefasst.
- Unter „Datensicherung & Beispiele“: „Beispielartikel entfernen“ bzw. „30 Beispielartikel laden“.

## Fehlerbehebungen

- Suche und Sortierung riefen noch den alten Listen-Renderer auf (Karten wechselten beim Tippen in das alte Aussehen). Behoben.
- Laden/Entfernen der Beispielartikel aktualisiert die Ansicht jetzt sofort (Ereignis `rv:data-changed`).
- Suche findet jetzt auch das Modell.

## Geänderte Dateien

`app.js` / `public/app.js` (Übersicht, Karten, Arbeitszentrale), `public/index.html` (Aufbau Bestand), `public/bestand.css` (neu, ersetzt `public/stock.css`), `public/demo.js`, `public/anim.js`, `public/sw.js` (Cache `rv-studio-v21-1`).

## Tests

- `npm test`: alle Gruppen bestanden.
- Browser (Chromium) bei 390, 720 und 1440 px: kein horizontaler Überlauf, keine JavaScript-Fehler; Suche, Statusfilter, Raster/Liste, Auswahl, Arbeitszentrale-Kacheln, alle sechs Bereiche, Artikelakte sowie Laden/Entfernen der Beispielartikel geprüft.
- Screenshots: `docs/v21/`.
