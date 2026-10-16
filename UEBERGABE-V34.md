# V34: Fotostudio – Plattform-Zuschnitt, App-Look im neuen Design, sauberes Layout

**Nichts wurde auf Cloudflare veröffentlicht.** Deployment erst nach ausdrücklichem „ja“.
Die Einstellungen zeigen **V34 · 16.10.2026** (`RV_VERSION` in `app.js`, Cache `rv-studio-v34`, `package.json` 34.0.0).

## 1. Titelbild „App-Look“ im RVO-Design (`cutout.js`)
- Tiefschwarz und Anthrazit (#181C22 → #0B0D11 → #050608) mit weichem Oberlicht, feinem Glanzstreif, Glasboden mit hellem Rand, Spiegelung und Kontaktschatten. Blau und Orange sind entfernt, die Farben des Artikels bleiben unverfälscht.
- Der dunkle Hintergrund „Nacht“ heißt jetzt „Anthrazit“ und hat die neuen Farben.
- App-Look ist wieder der Standardstil. Einmalig beim ersten Start von V34 wird `rv_cover_style` auf „app“ gesetzt.

## 2. Layout im Titelbild-Studio
- Ursache für das Verrutschen: Der Bedienbereich war breiter als der Bildschirm (412 px Ansicht: 421 px Inhalt). Jetzt sitzt alles exakt in der Breite.
- Stil- und Freisteller-Umschalter füllen die volle Breite mit gleich breiten Feldern. Der Freisteller ist auf dem Handy 2 × 2 angeordnet.
- „Titelbild erstellen“ geht über die volle Breite, darunter liegen „Nur freistellen“ und „Entfernen“ gleich breit nebeneinander.
- Hintergrund-Farben sind gleichmäßig verteilt. „+ Weitere Fotos“ geht über die volle Breite.
- Die untere Leiste „Zurück/Weiter“ hat gleiche Ränder links und rechts. Inhalt läuft weich dahinter aus.

## 3. „So sehen Käufer dein Foto“ – Ausschnitt je Plattform
- Jedes Format (eBay 1:1, Vinted 3:4, Instagram 4:5) zeigt den tatsächlichen Ausschnitt. Antippen öffnet den Editor.
- Im Editor kannst du das Bild ziehen, mit zwei Fingern, dem Regler oder dem Mausrad zoomen, das ganze Teil zeigen, das Bild füllen oder zentrieren. Freie Ränder lassen sich unscharf, weiß oder in Randfarbe füllen. Den Ausschnitt kannst du für alle Formate übernehmen oder zurücksetzen.
- Schnellknöpfe: „Überall ganzes Teil zeigen“ und „Ausschnitte zurücksetzen“.
- Jedes Foto ist wählbar, nicht nur das erste.
- Gespeichert wird in `photo.frames[ebay|vinted|instagram] = {z,x,y,bg}` am Foto, gesichert und synchronisiert wie die übrigen Fotodaten. Das Originalfoto bleibt unverändert.
- Der ZIP-Export („Artikel exportieren“) nutzt den Ausschnitt in 1200 px Höhe. Ohne eigenen Ausschnitt gilt der bisherige Zuschnitt.

## Tests
- `npm test`: 18/18, 13/13, 10/10.
- `npm run test:fotostudio`: 14/14.
- Im Browser (412 × 915, Touch) geprüft:
  - Kein horizontaler Überlauf mehr.
  - Im Editor funktionieren Ziehen, „Ganzes Teil zeigen“, „Weiß“ und „Fertig“.
  - Die Vorschau zeigt danach „Angepasst“.
  - Im exportierten ZIP ist das eBay-Bild 1200 × 1200 mit weißem Rand. Vinted und Instagram ohne eigenen Ausschnitt bleiben unverändert.
  - Den App-Look-Hintergrund habe ich mit einer Test-Freistellung gerendert.
