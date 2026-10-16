# V31 — Titelbild-Studio mit KI-Freisteller

## Vergleich an echten Fotos (Jacke, Hemd auf Bügel, Sneaker, Hose, Tasche)
- **Bisheriger Algorithmus:** zerfetzt Kleidung mit Struktur, gibt bei Holz/Treppe/Wand als Hintergrund auf und zeigt dann nur das Originalfoto.
- **BiRefNet_lite (neu):** sauberer Ausschnitt bei allen Testfotos, auch Kanten, Träger, Schnürsenkel und mehrere Schuhe im Bild.

## Neu
- **KI auf dem Gerät** (`public/ai-worker.js`, `public/ai-cutout.js`): Modell BiRefNet_lite (MIT-Lizenz, geschäftlich nutzbar) über transformers.js 4.3.1 von jsDelivr/Hugging Face. Kostenlos, kein Upload, kein eigenes Training nötig. Erstes Mal einmalig ca. 115 MB (ohne Half-Precision-Unterstützung 224 MB), danach im Browser gespeichert.
  - Läuft **nur mit WebGPU** (Chrome auf aktuellen Android-Handys wie dem S25 Ultra). Das Modell hat eine feste Eingabegröße von 1024 px; auf der CPU bricht es mit `std::bad_alloc` ab (getestet).
  - Ohne WebGPU oder bei Fehlern: automatisch Photoroom (falls eingerichtet), sonst der einfache Algorithmus. Die Meldung unter dem Titelbild nennt den Grund.
  - Der Ausschnitt wird pro Foto zwischengespeichert: Stil- und Hintergrundwechsel dauern nur Sekundenbruchteile.
- **Nachbearbeitung** (`refine` in `cutout.js`): Kante schärfen, kleine Fremdteile (< 6 % des Hauptmotivs) entfernen.
- **Drei Stile** (Standard App-Look):
  - **App-Look:** dunkles Blau mit Orangelicht, Ringe, Glasboden mit Orangerand, Spiegelung, Lichtkante am Artikel – passt zum App-Design.
  - **Studio:** ruhiger Verlauf (8 Farben), Kontaktschatten aus der Silhouette.
  - **Sticker:** weißer Rand wie ein Aufkleber, mit Schatten.
- **Engine-Auswahl** (Studio und Einstellungen): Automatisch · KI auf dem Gerät · Photoroom · Einfach · Original. Automatisch = KI auf dem Gerät, dann Photoroom, dann einfach.
- **Photoroom** (optional): `PHOTOROOM_API_KEY` als Secret in Cloudflare Pages. Der API-Zugang ist ein eigener Zugang (app.photoroom.com/api-dashboard), nicht automatisch Teil des App-Abos. Kostenlos testen mit Schlüssel-Präfix `sandbox_` (Wasserzeichen). Zusätzlich `format=png` und `despill=true`.

## Grenzen
- Der WebGPU-Pfad konnte in der Entwicklungsumgebung nur bis zur Modell-Ausführung getestet werden (Software-GPU hat nur 10 statt der benötigten 11 Speicherpuffer). Modell, Maske, Nachbearbeitung und alle Stile sind mit den echten Modell-Masken geprüft. Der erste Lauf auf dem Handy ist der Praxistest.
- Selbst hosten (offline): Modelldateien unter `/models/onnx-community/BiRefNet_lite-ONNX/` ablegen und `window.RV_AI_LOCAL=true` setzen.
- Bei Fotos mit Personen (Hand, Beine) schneidet die KI die Person mit aus. Am besten Artikel ohne Person fotografieren.

## V31.1 — Korrektur
- Wer früher „Auf dem Gerät“ gewählt hatte (intern `device`), bekam in V31 den einfachen Freisteller statt der KI, weil `device` jetzt „Einfach“ bedeutet. Alte Wahl wird einmalig auf „Automatisch“ umgestellt; eine danach bewusst gewählte Einstellung „Einfach“ bleibt erhalten.
- Läuft die KI nicht, erscheint jetzt sofort ein Hinweis „Ohne KI freigestellt: …“ mit Grund.
- Abzeichen am Titelbild: „KI freigestellt“, „Photoroom“, „Einfach freigestellt“ oder „Original“.
