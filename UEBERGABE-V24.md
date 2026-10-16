# V24 — Insights im Design der Startseite

Die frühere Seite „Statistiken“ (vier Zahlen und eine Textliste) ist jetzt eine vollständige **Insights-Seite** im Design von Startseite, Bestand, Studio und Einstellungen. Erreichbar wie bisher über „Alle anzeigen“ bei den Einblicken, „Statistiken anzeigen“ im Schnellzugriff und die Einblick-Karten.

## Inhalt

- **Zeitraum-Umschalter** (7 Tage · 30 Tage · 90 Tage · 12 Monate · Alle), wird gemerkt.
- **Überblick:** Umsatz, Gewinn, Verkäufe, Ø Marge, Ø Verkaufspreis, Ø Tage bis Verkauf, Gebühren & Versand, Abverkaufsquote – jeweils mit Vergleich zum gleich langen Zeitraum davor (grün besser, blau schlechter, wie auf der Startseite).
- **Umsatz & Gewinn:** interaktives Diagramm (Tage, Wochen oder Monate je nach Zeitraum). Antippen oder Darüberfahren zeigt einen Tooltip mit Umsatz, Gewinn und Anzahl. Ein Knopf schaltet auf eine **Tabelle** um. Beide Werte in Euro auf einer gemeinsamen Achse.
- **Plattformen:** Umsatzanteile als Balken, pro Plattform Verkäufe, Umsatz, Gewinn, Marge, Ø Tage bis Verkauf; Markierung „Beste Marge“.
- **Monatsziel:** Gewinn- oder Umsatzziel festlegen, Fortschrittsring, Restbetrag und **Prognose** bis Monatsende beim aktuellen Tempo.
- **Kategorien:** Gewinn pro Kategorie mit Anzahl und Ø Verkaufsdauer.
- **Top-Marken:** Gewinn und **Abverkaufsquote** (verkauft ÷ verkauft + im Lager).
- **Lager-Gesundheit:** gebundenes Kapital, Ø Lagerdauer, Ladenhüter (Grenze aus den Einstellungen), Altersstruktur des Bestands.
- **Empfehlungen** aus den eigenen Zahlen: beste Plattform nach Marge, schnellste Kategorie, Ladenhüter (Knopf „Älteste zuerst“ öffnet den Bestand sortiert), stärkster Verkaufstag, offene Entwürfe, hoher Gebührenanteil. Ein Tipp erscheint nur, wenn genug Daten da sind.
- **Verkäufe:** die letzten Verkäufe mit Foto, Plattform, Datum, Dauer und Gewinn; Antippen öffnet die Artikelakte. „Tabelle exportieren“ lädt die CSV.

## Farben

Diagrammfarben mit dem Paletten-Prüfer validiert (dunkler Hintergrund, alle Paare auch bei Rot-Grün- und Blau-Gelb-Schwäche unterscheidbar): eBay/Umsatz Blau `#3a8ef0`, Vinted/Gewinn Grün `#2aa57a`, Instagram Orange `#cf7f2a`. Die Plattform-Punkte im Studio nutzen jetzt dieselben Farben. Werte und Beschriftungen bleiben weiß bzw. grau, nie in Serienfarbe.

## Geänderte Dateien

`public/index.html` (Insights neu), `public/insights.css` (neu), `app.js`/`public/app.js` (Auswertung, Diagramm), `public/settings.css` (Kennzahl-Karten gemeinsam genutzt), `public/studio.css` (Plattformfarben), `public/pages.css` (alte Gold-Regeln entfernt), `public/sw.js` (Cache `rv-studio-v24-1`).

## Tests

- `npm test`: alle Gruppen bestanden.
- Browser (Chromium) 390, 720, 1440 px: kein Überlauf, keine Fehler; Zeitraumwechsel, Tooltip, Tabellenansicht, Monatsziel (55 % · Prognose), Empfehlungs-Knopf und Navigation von der Startseite geprüft.
- Mit den Beispieldaten steht beim Vergleich meist „Kein Vergleich“, weil im Zeitraum davor keine Verkäufe liegen.
