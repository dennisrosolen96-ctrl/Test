# V27 — Startseite neu im gleichen Design

Die Startseite war die letzte Seite im alten Aufbau: Auf dem Handy wurde das 720-px-Layout per Zoom verkleinert (sehr kleine Schrift). Jetzt ist sie echt responsiv und im selben Design wie Bestand, Studio, Insights, Chat und Einstellungen – orientiert an deinem Vorbild-Screenshot. Alle Zahlen kommen aus deinen echten Daten.

## Bereiche

1. **Verkaufs-Übersicht** mit dem drehenden Globus: Umsatz, Verkäufe, Gewinn, Ø Verkaufspreis mit Verlaufslinie und Vergleich zum Vorzeitraum (Heute · 7 Tage · 30 Tage · Alle), Top Kategorien, aktive Angebote, Lagerwert.
2. **Schnellzugriff:** Artikel fotografieren, Neuen Artikel anlegen, Einkauf erfassen, Artikel verkaufen, Barcode scannen, Statistiken.
3. **Neueste Artikel** und **Verkaufsverlauf** (mit Titelbild, Größe, Lagerplatz bzw. Plattform und „Heute, 16:42“ / „Gestern …“). Antippen öffnet die Artikelakte.
4. **Bestands-Übersicht:** Kategorien als Bildkacheln mit Anzahl; Antippen öffnet den Bestand gefiltert auf die Kategorie.
5. **Performance-Analyse:** Umsatz und Gewinn aufsummiert über 7, 30 oder 90 Tage, Linien einzeln ein-/ausblendbar, Tooltip beim Antippen, dazu Anzahl Verkäufe und neue Artikel.
6. **KI-Assistent:** Energie-Kugel, Begrüßung mit Namen, Schnellfragen, Eingabe mit Spracheingabe, „Chat öffnen“.
7. **Aktive Aufgaben** aus echten Daten (nur was offen ist): Entwürfe fertigstellen, bereite Artikel einstellen, Versand bestätigen, Listings entfernen, Ladenhüter prüfen, Angaben ergänzen, Backup fällig. Antippen springt direkt zur passenden gefilterten Ansicht.
8. **Deine Trends:** stärkste Marken der letzten 30 Tage mit Verlaufslinie und Veränderung zum Vorzeitraum („neu“, wenn es davor keine Verkäufe gab). Bewusst aus deinen eigenen Verkäufen – keine erfundenen Marktdaten.

Der frühere Bereich „Aktuelle Einblicke“ ist auf der Startseite durch Aufgaben und Trends ersetzt; er wird weiterhin in der Seitenleiste des KI-Chats angezeigt. „Weitere Werkzeuge & Aufgaben“ ist entfallen, die Inhalte stecken in Aufgaben und Kopfmenü.

## Technik

Globus, KI-Kugel und KI-Eingabe sind aus dem alten Aufbau umgezogen (gleiche Elemente, daher laufen Animationen, Spracheingabe und Verlauf unverändert). Der alte Aufbau bleibt unsichtbar im Code, weil einige Funktionen dessen Knöpfe intern auslösen.

## Geänderte Dateien

`public/index.html`, `public/home.css` (neu), `app.js`/`public/app.js`, `public/sw.js` (Cache `rv-studio-v27-1`).

## Tests

- `npm test`: alle Gruppen bestanden.
- Browser (Chromium) 390, 720, 1440 px: kein horizontaler Überlauf, keine Fehler, Globus und Kugel animiert. Geprüft: Schnellzugriff (Studio, Einkäufe, Verkaufen, Statistiken), Artikelakte aus „Neueste Artikel“, Kategorie-Kachel (8 Jacken), Aufgabe „Entwürfe“ (3 Treffer), Zeitraumwechsel, KI-Befehl und Schnellfrage.
