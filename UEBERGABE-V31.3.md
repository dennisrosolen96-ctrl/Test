# V31.3 — Fotostudio: internes RVO-Titelbild mit Poof.bg

**Nichts wurde auf Cloudflare veröffentlicht.** Deployment erst nach ausdrücklichem „ja“.

## 1. Was das Titelbild jetzt ist
- Das RVO-Titelbild ist **nur** das Bild der internen Bestandsliste. Es liegt in einem eigenen Feld `article.rvCover` und ist **kein Foto** mehr.
- Die transparente Freistellung liegt getrennt in `article.rvCutout` (PNG).
- `article.photos` enthält nur noch die Originalfotos. Sie werden nie überschrieben oder gelöscht. Plattform-Vorschau, ZIP-Export und KI-Texte nutzen nur diese Originale.
- Vorher war das Titelbild Foto Nr. 1 (`cover:true`) und landete dadurch auch im Plattform-Export und in der Plattform-Vorschau. Beim ersten Start werden alte Artikel einmalig umgezogen (`rv_cover_split_v313`). Beim Öffnen und beim Cloud-Download passiert dasselbe.
- Bestandsliste, Artikelakte, Startseite, Chat-Auswahl und Trends zeigen `rvCover`, sonst das erste Originalfoto (`rvThumb`).

## 2. Zwei Funktionen im Fotostudio
- **Nur freistellen:** erzeugt das transparente PNG. Es ist sichtbar unter „Freigestellt (transparent)“ und lässt sich als PNG speichern.
- **Titelbild erstellen:** nutzt die vorhandene Freistellung, sonst wird zuerst freigestellt. Danach wird das Motiv auf den vorhandenen RVO-Stil gesetzt (App-Look, Studio oder Sticker, Hintergründe unverändert), proportional skaliert, zentriert und mit dezentem Schatten versehen.
- **Wiederverwendung:** Die Freistellung wird pro Foto (SHA-256 des Fotos) am Artikel und im Gerätespeicher (`rv-cutouts`) abgelegt. Stil- oder Hintergrundwechsel kostet keinen Credit. Erneutes Freistellen fragt vorher nach („verbraucht 1 Credit“).
- Gespeicherte Artikel: Titelbild und Freistellung werden mitgespeichert und wie Fotos nach R2 synchronisiert. Eine Freistellung über 7,5 MB wird für R2 als WebP mit Transparenz abgelegt.
- Ein noch nicht gespeicherter Entwurf behält Titelbild und Freistellung im Arbeitsspeicher. Beim Speichern werden beide dem Artikel zugeordnet. Die Freistellung liegt zusätzlich im Gerätespeicher, also auch nach einem Neuladen ohne neuen Credit.

## 3. Poof.bg (Standard-Freisteller)
- **Endpunkt:** `POST /api/poof` (Cloudflare Pages Function). Er ist nur mit dem RV-Cloud-Kennwort erreichbar (`X-RV-Password`), wie alle Cloud-Routen, und damit kein offener Proxy.
- **Schlüssel:** `POOF_BG_API_KEY` wird nur serverseitig gelesen. Er steht nicht im Frontend, nicht in Antworten und nicht in Logs (per Test geprüft).
- **Prüfung:** Datentyp anhand der Datei-Signatur (JPEG, PNG oder WebP), maximal 20 MB, Zeitlimit 45 s.
- **Aufruf an Poof:** `https://api.poof.bg/v1/remove`, Multipart mit `image_file`, `format=png`, `size=full` (laut aktueller Doku, docs.poof.bg).
- **Keine Wiederholungen:** Fehlgeschlagene Anfragen kosten laut Poof keinen Credit.
- **Rate-Limit:** Standard 4 pro Minute (wie Poof Free) und 50 pro Tag, dauerhaft in D1 (Tabelle `poof_calls`, wird automatisch angelegt). Einstellbar über `POOF_MAX_PER_MINUTE` und `POOF_MAX_PER_DAY`.
- **Doppelte Anfragen:** Ein identisches Foto wird 7 Tage lang aus dem Cloudflare-Cache beantwortet, ohne neuen Credit. Im Browser verhindern Sperre und Laufmerker Doppelklicks.
- **Fehlerzuordnung:**

  | Poof-Fehler | Antwort der App |
  |---|---|
  | 402 `payment_required` | Credits aufgebraucht, Originale und Titelbilder bleiben erhalten |
  | 429 | Bitte in einer Minute erneut versuchen |
  | 401/403 | Schlüssel bzw. Tarif prüfen |
  | 413/422 | Foto ungültig oder zu groß |
  | 5xx und Timeout | Poof gerade nicht erreichbar |
- **Credit-Stand:** `GET /api/poof` fragt kostenlos `https://api.poof.bg/v1/me` ab. Im Studio steht dann „Poof Free: 43 von 50 Credits übrig“.
- **Nur auf Klick:** Hochladen, automatische Titelbilder, Stil-, Hintergrund- und Freistellerwechsel lösen **nie** einen Poof-Aufruf aus. Es gibt keine Massenbearbeitung alter Bilder.
- **Kein Wechsel zu Photoroom:** Photoroom ist nur noch bei ausdrücklicher Wahl aktiv. Fällt Poof aus, gibt es keinen stillen Ersatz. Die Meldung nennt den Grund, und „KI auf dem Gerät“ kann bewusst gewählt werden.
- **Ehrliche Kennzeichnung:** Das Abzeichen am Titelbild nennt immer den tatsächlichen Freisteller (Poof.bg, KI auf dem Gerät, Photoroom oder Original).

## 4. Tatsächlich durchgeführte Tests
- **`npm test`** (Node, gemockte Dienste): Backend 18/18, Chat & Sync 13/13, Dashboard 10/10. Neuer Test zu Poof:
  - Ohne Secret gibt es 501.
  - Falsches Kennwort ergibt 401.
  - GIF, falsche Signatur und mehr als 20 MB ergeben 415/413, ohne Aufruf an Poof.
  - Bei Erfolg werden richtige Felder und richtiger Header gesendet, der Schlüssel fehlt in der Antwort.
  - Die Codes 402, 429, 401, 500, 503 und unbekannte Fehler werden richtig zugeordnet, mit je genau einem Aufruf.
  - Timeout ergibt 504.
  - Eine Antwort ohne PNG ergibt 502.
  - Ein doppeltes Bild kommt aus dem Cache.
  - Das eigene Rate-Limit blockt die 3. Anfrage.
  - Die Credit-Abfrage funktioniert.
- **`npm run test:fotostudio`** (Chromium headless, 412 × 915, Poof gemockt): 13/13.
  - Hochladen ohne Poof-Aufruf.
  - Hoch- und Querformat.
  - Dreifachklick ergibt genau einen Aufruf.
  - Titelbild in 1000 × 1250 mit „Poof.bg“-Abzeichen.
  - Originalfotos unverändert.
  - Stil- und Hintergrundwechsel ohne Aufruf.
  - Erneutes Freistellen nur nach Rückfrage.
  - Transparentes PNG sichtbar.
  - Credits aufgebraucht: Meldung erscheint, das alte Titelbild bleibt.
  - Speichern mit getrennten Feldern in IndexedDB.
  - Neuladen: Die Bestandsliste zeigt das Titelbild.
  - Umzug alter Artikel.
  - Keine Skriptfehler.
- **Sicherheit:** Suche nach `POOF_BG_API_KEY` bzw. `x-api-key` in `public/` ergab keinen Schlüssel im Frontend.

## 5. Ausstehend / bekannte Einschränkungen
- **Echter Poof-Test ausstehend:** In dieser Umgebung gibt es keinen Poof-Schlüssel. Kein echter Aufruf, keine echte Qualitätsprüfung (dunkle Kleidung auf dunklem Grund, Strick auf Teppich, Schuhe, Taschen, dünne Kanten). Die Testbilder im Browser-Test sind synthetisch.
- **Android-PWA nicht getestet:** Es lief nur Chromium headless in Handygröße, kein Android-Gerät.
- **Cloud-Sync mit Titelbild/Freistellung:** Nur der Code-Pfad ist umgesetzt, gegen echtes D1/R2 ist er nicht getestet.
- **Cache-Grenzen:** Der Cloudflare-Cache gilt je Rechenzentrum. Ein identisches Foto über ein anderes Rechenzentrum kann einen Credit kosten. Der Gerätespeicher verhindert das im Normalfall.
- **KI auf dem Gerät (ISNet):** Bleibt als bewusst wählbare Option erhalten. Gut bei einzelnen Teilen, schwächer bei mehreren Teilen in einem Bild.
- **Datenaufbewahrung bei Poof:** Dazu macht die Doku keine Angaben. Die App sendet nur das gewählte Foto (max. 1800 px) und speichert bei Poof nichts selbst.

## 6. Mac-Terminal: entpacken, bauen, testen
```bash
cd ~/Downloads && rm -rf RVOX-v31-3 && mkdir RVOX-v31-3 && unzip -q RVOX-v31-3.zip -d RVOX-v31-3 && cd RVOX-v31-3 \
 && node --version && npm run build && npm test \
 && npm install --no-save --package-lock=false playwright@1.62.1 && npx playwright install chromium \
 && npm run test:fotostudio
```

## 7. Veröffentlichen (erst nach deinem „ja“)
```bash
npx wrangler pages secret put POOF_BG_API_KEY --project-name rv-studio-cloud
npx wrangler pages deploy public --project-name rv-studio-cloud
```
Die Bindings bleiben unverändert: D1 `rv-studio-db` als `RV_DB`, R2 `rv-studio-photos` als `RV_PHOTOS`. Optional `POOF_MAX_PER_MINUTE` und `POOF_MAX_PER_DAY` setzen.
