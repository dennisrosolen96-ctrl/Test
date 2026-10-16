# V22 — Studio im Design der Startseite, automatisches Titelbild

Das Studio ist komplett neu aufgebaut: gleiche Glasflächen, Farben und Effekte wie Startseite und Bestand, vier Schritte als Kacheln (Fotos · Details & Texte · Bilder · Preis & Online). Erledigte Schritte bekommen einen grünen Haken, jede Kachel ist direkt anwählbar.

## Automatisches Titelbild (Freisteller)

Nach dem Hochladen der Fotos entsteht sofort ein **Titelbild im Bestands-Look**: Motiv freigestellt, auf einem ruhigen Studio-Hintergrund (4:5), mit weichem Schatten — genau wie die Beispielartikel im Bestand. Es wird als erstes Foto gespeichert und erscheint damit automatisch als Kartenbild im Bestand und als erstes Bild beim Export und Teilen. Die Originalfotos bleiben unverändert dahinter.

Freisteller-Varianten (Schritt „Bilder“ → Titelbild-Studio):

| Einstellung | Was passiert |
| --- | --- |
| **Automatisch** (Standard) | KI-Server, wenn eingerichtet – sonst direkt auf dem Gerät |
| **KI-Server** | Profi-Freisteller über deinen Cloudflare-Server: Photoroom oder remove.bg |
| **Auf dem Gerät** | Läuft im Browser, ohne Upload und ohne Kosten, in unter einer Sekunde |
| **Original** | Kein Freistellen, Foto nur ins Titelbild-Format zugeschnitten |

Außerdem: 8 Hintergründe (Sand, Nebel, Leinen, Salbei, Rosé, Stein, Weiß, Nacht), Ausgangsfoto wählbar, Regler „Feinheit“ für schwierige Fotos, Schalter für die Automatik.

**Grenzen des Freistellers auf dem Gerät:** Er lernt den Untergrund an den Bildrändern. Sehr gut auf Boden, Bett, Wand oder Tuch, wenn sich das Teil farblich abhebt. Bei gleichfarbigem Teil und Untergrund (z. B. weißes Shirt auf weißem Laken) fällt er automatisch auf „Original“ zurück und sagt das. Für solche Fälle oder generell beste Qualität den KI-Server einrichten:

```bash
npx wrangler@4 pages secret put PHOTOROOM_API_KEY --project-name rv-studio-cloud
# oder
npx wrangler@4 pages secret put REMOVE_BG_API_KEY --project-name rv-studio-cloud
```

Beide Dienste sind kostenpflichtig (pro Bild). Der Schlüssel bleibt auf dem Server; die App schickt nur das Foto über `/api/cutout` (mit RV-Passwort geschützt).

## Weitere Neuerungen

- **Fotos:** Ziehen & Ablegen, Kamera-Knopf fürs Handy, nummerierte Vorschau, Titelbild markiert.
- **Mängel-Schnellwahl:** Keine Mängel, Gebrauchsspuren, Pilling, Kleiner Fleck, Verwaschen, Kleines Loch.
- **Produktdaten jetzt editierbar** (vorher nur Anzeige): Marke (mit Vorschlägen aus deinem Bestand), Modell, Kategorie, Größe, Farbe, Material, Made in, Artikelnummer mit **Auto-Nummer** (RV-0001 …). Fortschrittsanzeige 7/7.
- **Texte ohne KI:** „Ohne KI erstellen“ schreibt Titel und Beschreibung für alle drei Plattformen aus deinen Angaben in deiner Abschnitts-Struktur. Funktioniert offline.
- **Titel-Check:** Zeichenzähler (eBay 80), Häkchen für Marke, Größe, Farbe, Länge. **Instagram-Hashtags** werden vorgeschlagen und per Tipp eingefügt.
- **Preisrechner:** Ein Wunschbetrag → drei Plattformpreise mit Gebühren und Verhandlungspuffer pro Plattform (einstellbar, Standard: eBay +10 %, Vinted +15 %, Instagram +5 %, Gebühren 0 %), gerundet auf …5/…9. Gewinn und Marge pro Plattform live. **Hinweis aus deiner Verkaufshistorie** (Ø Verkaufspreis und Verkaufsdauer derselben Marke bzw. Kategorie), mit einem Tipp übernehmbar.
- **Lager:** zuletzt genutzte Lagerplätze als Schnellwahl, Vorschläge für Bezugsquellen, Einkaufsdatum vorbelegt.
- **Veröffentlichen-Karten für eBay, Vinted, Instagram:** Text kopieren · Plattform öffnen (kopiert vorher automatisch) · **Teilen** (Fotos + Text direkt an die Vinted-/Instagram-App, auf dem Handy) · Listing-Link · Schalter „Online gestellt“ (setzt Status automatisch auf Online und wird in der Artikelakte gespeichert).
- **Fertig-Check:** Ring mit Prozent und fehlenden Angaben; Tipp auf eine Angabe springt zum passenden Schritt.
- **Speichern:** Fehlende Artikelnummer wird automatisch vergeben, danach öffnet sich der Bestand mit der neuen Karte, das Studio ist leer für den nächsten Artikel.
- „Automatisch optimieren“ hellt alle Fotos per Histogramm auf; Plattform-Vorschau zeigt das erste Foto in 1:1, 3:4, 4:5.

Ehrlich gesagt: Eine direkte Veröffentlichung per Schnittstelle bei Vinted und Instagram gibt es für Privatkonten nicht. Deshalb der Weg über Kopieren, Öffnen und Teilen.

## Geänderte Dateien

`public/index.html` (Studio-Aufbau), `public/studio.css` (neu), `public/cutout.js` (neu, Freisteller), `app.js`/`public/app.js` (Studio-Logik), `functions/api/[[path]].js` (`/api/cutout`), `public/pages.css` (alte Gold-Regeln fürs Studio entfernt), `public/sw.js` (Cache `rv-studio-v22-1`), `tests/backend-contract.mjs` (Freisteller-Vertrag).

## Tests

- `npm test`: alle Gruppen bestanden (Backend jetzt 17 inkl. Freisteller: ohne Dienst 501, Photoroom/remove.bg mit Schlüssel nur serverseitig, Fehler 502, Passwortschutz).
- Browser (Chromium) 390, 720, 1440 px: kompletter Ablauf Fotos hochladen → Titelbild → Texte ohne KI → Hintergrund wechseln → Preise berechnen → Vinted online → speichern → Karte mit Titelbild im Bestand. KI-Ablauf mit simuliertem Server: Titelbild wird nicht an die Text-KI geschickt, Freisteller fällt bei fehlendem Dienst aufs Gerät zurück. Keine JavaScript-Fehler, kein horizontaler Überlauf.
- Freisteller-Test mit 12 simulierten Handyfotos (Holzboden, Laken, Wand): `docs/v22/freisteller-test.png`. Mit echten Handyfotos und den echten Diensten Photoroom/remove.bg konnte hier nicht getestet werden.
