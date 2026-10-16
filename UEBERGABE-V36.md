# V36: Bao in 3D · Design auf RV-Studio-Niveau

**Nichts wurde auf Cloudflare veröffentlicht.** Deployment erst nach ausdrücklichem „ja“.
Die Einstellungen zeigen **V36 · 17.10.2026**. Cache `rv-studio-v36`, `package.json` 36.0.0. Grundlage ist V35 (siehe `UEBERGABE-V35.md`).

## 0. Ursache der Darstellung auf deinem Handy

Auf deinen Screenshots wurden die neuen Stylesheets `rvo.css` und `bao.css` nicht angewendet. Deshalb sahst du:
- Kennzahlen als Fließtext
- Menü linksbündig
- graue Standard-Knöpfe
- alle Bao-Unterseiten gleichzeitig

Neu sind drei Schutzmaßnahmen:
1. Versions-Anhang an den Dateien (`?v=36`).
2. Ein Prüfwert in jeder Datei. Fehlt er, lädt die App die Datei nach. Klappt das nicht, bettet sie das Stylesheet direkt ein.
3. Service Worker v36. Offline wird auch ohne Versions-Anhang gefunden.

Falls es nach dem Veröffentlichen noch hakt, prüfe bitte, ob `https://<deine-domain>/rvo.css` im Browser Text anzeigt.

## 1. Menü
- Fünf gleich breite, größere Kacheln über die volle Bildschirmbreite (Handy 80 px hoch, Desktop 96 px).
- Bao-Kachel mit dem 3D-Kopf.
- „Einstellungen“ ohne Silbentrennung.

## 2. Bereichsmenü (Bestand | Einkäufe | Verkäufe und Gespräch | Aufgaben | Eingang | Freigaben)
- Glasleiste im Stil der Hauptkacheln, je Bereich mit Symbol.
- Leuchtende Markierung gleitet federnd zum aktiven Bereich. Zähler als Abzeichen, überfällig in Rot.
- Im Bestand sind die doppelten Kacheln „Bestand“ und „Einkäufe“ ausgeblendet. Übrig bleiben Arbeitsmodus, Analyse, Marken und Erinnerungen. Die Funktionen sind unverändert.

## 3. Bestands-Übersicht: Statusfarben
Online **Grün**, Bereit **Stahlblau**, Entwurf **Bernstein**, Verkauft **Violett**. Das gilt im Ring und in der Legende.

## 4. Baos Briefing auf der Startseite
- Kopfbereich: 3D-Bao auf einem Lichtsockel, daneben „Heute N Punkte für dich“ und ein Satz zur Dringlichkeit.
- Drei Kennzahl-Kacheln im gleichen Baustein wie die übrigen RV-Kennzahlen:
  - Gewinn im Monat mit Vergleich zum Vormonat
  - Bestand zum Einkaufspreis
  - Aufgaben
- „Heute wichtig“ im gleichen Baustein wie „Aktive Aufgaben“. Dringendes steht oben mit rotem Rand und rotem Zähler, alles andere mit dezentem Zähler.

## 5. Bao als 3D-Figur
- Echte 3D-Figur in WebGL (three.js r160, lokal unter `public/vendor/`, damit die PWA offline funktioniert). Das Modell ist in `public/bao3d.js` im Code aufgebaut:
  - Plüschmaterial mit Sheen und Fellstruktur
  - braune Glanzaugen mit Lichtpunkten, Lider zum Blinzeln, „^“-Augen beim Freuen
  - Nase, Mund mit Zunge und Zähnen, Wangen
  - Ohren mit braunem Inneren, Arme mit Schultergelenk, Füße mit Ballen und Zehen
  - Licht: Haupt-, Gegen- und Fülllicht
- Alle bisherigen Zustände und Abläufe steuern jetzt die 3D-Figur: Idle, Blick zu Maus oder Finger, Antippen-Reaktionen, Denken, Sprechen, Jubel, Drehung, Klatschen und Geldkanone (Mint-Blaster mit Geldscheinen). Avatar, Menü und Chat zeigen ein gerendertes 3D-Kopfbild.
- **Leistung:**
  - Gezeichnet wird nur, solange Bao sichtbar ist; bei verstecktem Tab pausiert er.
  - Im Ruhezustand 30 Bilder pro Sekunde, Pixeldichte höchstens 1,75.
  - three.js (≈ 650 kB) wird erst nach dem Seitenstart nachgeladen.
- **Rückfall:** Ohne WebGL, oder mit „Einstellungen → Animationen → Bao in 3D“ aus, erscheint die bisherige Vektor-Figur.
- **Ehrlich:** Das Modell ist prozedural aufgebaut. Es ist kein professionell modellierter und geriggter 3D-Charakter, und es hat keine echten Fellhaare. Der nächste Qualitätssprung wäre ein von einem 3D-Artist erstelltes GLB-Modell mit Skelett. Die Steuerung (`apply(P, C)`) ist dafür bereits getrennt.

## 6. KI-Seite
- Bao steht frei auf einer Bühne mit Lichtkegel, Halo und Bodenlicht, nicht mehr in einer Karte.
- Darunter stehen Name, Rolle und Status.
- Die doppelte Kopfzeile ist entfernt.
- Auf Aufgaben, Eingang und Freigaben bleibt Bao kompakt neben seinem Namen sichtbar.
- „Neuer Chat“ erscheint nur im Gespräch.

## 7. Tests (ausgeführt)
- `npm test`: Backend 18/18, Chat & Sync 13/13, Dashboard 10/10, Bao-Backend 6/6.
- `npm run test:v35`: **18/18** (Chromium mit Software-WebGL). Neu geprüft:
  - 3D-Bao auf der Startseite und 3D-Köpfe im Menü
  - Briefing-Hero mit drei Kennzahl-Kacheln
  - Bao-Bühne auf der KI-Seite
- `npm run test:fotostudio`: 14/14.
- Screenshots: `docs/v36/`.

**Nicht getestet:** echtes Gerät (Galaxy S25, echte GPU), echtes Cloudflare.

## 8. Hinweis zu deinem Chat
Deine Screenshots zeigen „OPENAI_API_KEY fehlt auf dem Server“. Das ist kein Fehler im Code: Im Pages-Projekt `rv-studio-cloud` ist dieses Secret nicht gesetzt. Vermutlich liegt der Schlüssel nur im Worker `rvstudio-ai`. Es gibt zwei Lösungen:
- das Secret auch im Pages-Projekt setzen (`npx wrangler@4 pages secret put OPENAI_API_KEY --project-name rv-studio-cloud`), oder
- in den Einstellungen unter KI den Endpunkt des Workers eintragen. Dann braucht der Worker aber die neuen `/api/bao`-Routen.
