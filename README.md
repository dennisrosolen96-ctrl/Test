# RV Studio V27 — Command Center

Neu in V27 (Details: [UEBERGABE-V27.md](UEBERGABE-V27.md)): Startseite responsiv im gleichen Design mit Übersicht, neuesten Artikeln, Verkaufsverlauf, Kategorien, Performance-Diagramm, KI-Assistent, Aufgaben und Trends.

Neu in V26 (Details: [UEBERGABE-V26.md](UEBERGABE-V26.md)): Kopfmenü mit Begrüßung, KI-Leiste und sechs Kacheln auf allen Seiten; unteres Menü und KI-Ball entfernt.

Neu in V25 (Details: [UEBERGABE-V25.md](UEBERGABE-V25.md)): KI-Chat als eigene Seite mit gespeichertem Verlauf, formatierten Antworten, Folgefragen, Artikel-Kontext und Einrichtung direkt im Chat.

Neu in V24 (Details: [UEBERGABE-V24.md](UEBERGABE-V24.md)): Insights-Seite mit Zeitraumvergleich, interaktivem Umsatz-/Gewinn-Diagramm, Plattformvergleich, Monatsziel mit Prognose, Kategorien, Marken, Lager-Gesundheit und Empfehlungen.

Neu in V23 (Details: [UEBERGABE-V23.md](UEBERGABE-V23.md)): Einstellungen als Kontrollzentrum mit Systemstatus, Profil & Shop, Plattform-Steuerung, Preisrundung, Verbindungstest, CSV-Export, Backup-Erinnerung und Speicherschutz.

Neu in V22 (Details: [UEBERGABE-V22.md](UEBERGABE-V22.md)): Studio im Design der Startseite, automatisches Titelbild mit Freisteller, Texte ohne KI, Preisrechner für alle drei Plattformen, Veröffentlichen-Karten und Fertig-Check.

Neu in V21 (Details: [UEBERGABE-V21.md](UEBERGABE-V21.md)): Bestand komplett im Design der Startseite, Status-Ring, Analyse mit Ladenhütern, neue Artikelkarten und 30 Beispielartikel (Kleidung) mit Titelbild.

Neu in V17 (Details: [UEBERGABE-V17.md](UEBERGABE-V17.md)): Startseite auf allen Breiten im Referenz-Layout, drehende Erde, lebendiger KI-Roboter und Lichteffekte.

## Vorgängerversion V16

Vollständige Weiterentwicklung der gelieferten V15 mit vorhandener Artikelverwaltung, Bestandsverwaltung, Einkaufschargen, Verkäufen, Foto-Studio, Listings, KI-Chat, Cloud-Synchronisierung, Backup/Import und Einstellungen. Cloudflare Pages/Functions, D1, R2 und die bestehenden Datenstrukturen bleiben erhalten.

**Lieferstatus:** Quellprojekt und 39 isolierte Testgruppen sind geprüft. Die visuelle Endabnahme ist offen: Chromium konnte in der Arbeitsumgebung keine lokalen Sockets öffnen. Deshalb enthält diese Lieferung keine echten mobilen/Desktop-Screenshots und behauptet keine ausgeführten Browser- oder Viewporttests. Details und verbleibende Abweichungen: [UEBERGABE-V16.md](UEBERGABE-V16.md).

## Entpacken, bauen und testen

Node.js 20 oder neuer und npm werden benötigt. Die App benötigt keinen Framework-Build und keine installierten Laufzeitpakete.

```bash
unzip RV-Studio-V16-Ultimate-Reference.zip
cd RV-Studio-V16-Ultimate-Reference
npm run build
npm test
```

`app.js` im Projektverzeichnis ist die maßgebliche Geschäftslogik. `npm run build` kopiert sie nach `public/app.js`. Änderungen an der Kernlogik anschließend immer mit diesem Befehl übernehmen.

## Lokal mit Cloudflare Functions starten

```bash
cp .dev.vars.example .dev.vars
# .dev.vars mit deinem bestehenden RV-Kennwort und optionalen KI-Keys ergänzen.
npx wrangler@4 d1 execute rv-studio-db --local --file schema.sql
npx wrangler@4 pages dev public
```

Die Schema-Anweisung initialisiert nur die lokale Testdatenbank. Für die vorhandene Produktionsdatenbank ist keine Migration erforderlich. Lokale Wrangler-Daten liegen in `.wrangler/`; vorhandene Browserdaten liegen weiterhin in IndexedDB unter `RVStudioDB`.

## Browser- und Screenshotprüfung nachholen

Der vorbereitete Testlauf startet seinen eigenen lokalen statischen Server, erstellt echte Screenshots und prüft Navigation, Nullwerte, KI-Setup, Benachrichtigung und horizontalen Überlauf. Cloudflare- und Providerzugriffe sind darin bewusst nicht live.

```bash
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
npm run test:browser
```

Ausgabe in `test-results/`: vollständige Seiten und Viewportaufnahmen bei **390 × 844, 430 × 932, 768 × 1024, 1440 × 900** sowie zusätzlich **720 × 1280** für den Referenzvergleich. Auf Linux kann alternativ ein vorhandener Chromium-Browser verwendet werden:

```bash
RV_BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

Diese Befehle wurden vorbereitet und syntaktisch geprüft, der Browserlauf wurde hier **nicht erfolgreich ausgeführt**.

## Deployen

Aus dem vollständigen Projektverzeichnis; Wrangler muss für dein vorhandenes Cloudflare-Konto authentifiziert sein:

```bash
npm run build
npm test
npx wrangler@4 pages deploy public --project-name rv-studio-cloud
```

`functions/` muss neben `public/` liegen, damit Wrangler die vorhandenen Functions mitnimmt. Bestehende D1-/R2-Bindings und Projektidentität in `wrangler.toml` beibehalten. Falls dein Pages-Projekt einen anderen Namen hat, nur `--project-name` entsprechend anpassen. Es wurde aus dieser Arbeitsumgebung kein Live-Deployment durchgeführt.

## Umgebungsvariablen und Bindings

| Name | Erforderlich / Verwendung |
| --- | --- |
| `RV_SYNC_PASSWORD` | Erforderliches serverseitiges Schutzkennwort für Sync, Fotos und KI. Auf bestehenden Geräten das bisherige Kennwort verwenden. |
| `RV_DB` | D1-Binding; bestehende Tabellen aus `schema.sql`. |
| `RV_PHOTOS` | R2-Binding für Artikelfotos. |
| `OPENAI_API_KEY` | Für echte OpenAI-Chat-/Listinganfragen. |
| `ANTHROPIC_API_KEY` | Alternativ für Claude-Chat-/Listinganfragen. |
| `AI_PROVIDER` | Optional: `openai` oder `claude`; die Auswahl in der App kann dies pro Anfrage übersteuern. |
| `OPENAI_MODEL` | Optional; vorhandener Backend-Standard `gpt-4.1-mini`. |
| `PHOTOROOM_API_KEY` | Optional: Profi-Freisteller fürs Titelbild (Photoroom). |
| `REMOVE_BG_API_KEY` | Optional: alternativ remove.bg. Ohne beide stellt die App direkt auf dem Gerät frei. |
| `ANTHROPIC_MODEL` | Optional; vorhandener Backend-Standard `claude-3-5-sonnet-latest`. Ein für dein Konto verfügbares Modell verwenden. |

Secrets im Cloudflare-Dashboard für die gewünschte Umgebung setzen. Alternativ interaktiv mit Wrangler, zum Beispiel:

```bash
npx wrangler@4 pages secret put RV_SYNC_PASSWORD --project-name rv-studio-cloud
npx wrangler@4 pages secret put OPENAI_API_KEY --project-name rv-studio-cloud
# Bei Claude stattdessen ANTHROPIC_API_KEY setzen.
```

API-Schlüssel gehören ausschließlich auf den Server. Im Frontend wird nur das bestehende RV-Kennwort für den geschützten API-Zugriff verwendet. `.dev.vars` ist von Git ausgeschlossen und nicht Bestandteil der ZIP.
