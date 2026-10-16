# API-Vertragstests

Aus dem Projektverzeichnis mit Node.js 20 oder neuer ausführen:

```bash
node tests/backend-contract.mjs
node tests/chat-and-sync.mjs
```

Der Test lädt `functions/api/[[path]].js` relativ zur Testdatei und schreibt das Ergebnis nach `tests/backend-contract-results.json`. Er benötigt keine npm-Pakete, Zugangsdaten oder Netzwerkverbindung.

16 Testgruppen decken Authentifizierung, Cloud-Artikel mit Revisionen, Einkaufschargen, Foto-Uploads und -Downloads, KI-Chat sowie Listing-Erstellung über OpenAI und Claude ab. Fehlende Provider-Schlüssel und Providerfehler werden ebenfalls geprüft.

Grenzen: D1 und R2 werden im Arbeitsspeicher simuliert; Provider-`fetch` wird gemockt. Echte Cloudflare-Bindings, SQL-Ausführung, parallele Schreibzugriffe, externe Provider und die Browseroberfläche werden damit nicht getestet. Ungültiges vom Provider erzeugtes Listing-JSON liefert im bestehenden API-Vertrag HTTP 200 mit leeren Listings. Der Test dokumentiert diese Grenze, statt erfolgreiche Listing-Erstellung zu behaupten.

`chat-and-sync.mjs` prüft 13 Testgruppen mit den tatsächlich in `app.js` implementierten Chat-/Sync-Funktionen und isolierten DOM-/API-Doubles: sechs erzwungene KI-Anfragen, fehlendes Kennwort, API-/Netzwerk-/Timeoutfehler, reine Textausgabe, entfernte Wartemeldungen, lokale Navigation, Dokumentevent, aktive Cloud-Sitzung, parallele Klicks, korrekter Sync-Header, Queue-Bereinigung und Änderungen während eines Uploads. Ergebnisse: `tests/chat-and-sync-results.json`. Diese Tests ergänzen echte Browsertests; sie ersetzen diese nicht.

## Behobene V15-Defekte in V16

- Cloud-Sync sendete `X-RV-Sync-Password`, obwohl die API `X-RV-Password` akzeptiert. V16 verwendet den vorhandenen Serververtrag.
- `uploadModified` war im falschen Block deklariert; ein erfolgreicher PUT konnte danach einen Fehler auslösen und die Queue behalten. V16 erhält die Variable im Schleifenblock und schützt weiterhin Änderungen während des Uploads.
- Chat und Listing lasen `rvSync.password`, das nie gesetzt wurde. V16 nutzt die aktive Cloud-Sitzung oder das eingegebene RV-Kennwort.
- Chat verschluckte Providerfehler und zeigte lokale Summen als Ersatzantwort. V16 benennt fehlende Konfiguration und Fehler; lokale Befehle sind als „RV lokal“ erkennbar.
- KI-Aktionsbuttons konnten von lokalen Stichwort-Matchern abgefangen werden. `rv:ai-request` erzwingt die echte `/api/ai-chat`-Anfrage; `rv:ai-state` meldet `busy`, `setup`, `error` oder nach einer erfolgreichen Antwort `ready`.
- Externe Providerantworten wurden als HTML eingebunden. V16 rendert sie per `textContent`.
- Ein leeres Listing-Ergebnis meldete Erfolg. Das Frontend weist leere Listingtexte nun zurück; der Serververtrag bleibt erhalten.
- Die Benachrichtigung scrollte in einen geschlossenen Werkzeugbereich. V16 öffnet ihn vorher und respektiert reduzierte Bewegung.

## Dashboard und Browser

`node tests/dashboard.mjs` prüft 10 weitere Gruppen der tatsächlich verwendeten Dashboard-Berechnungen. Insgesamt wurden 39 isolierte Gruppen erfolgreich ausgeführt.

`npm run test:browser` ist ein vorbereiteter Playwright-Lauf für fünf Viewports und die Hauptnavigation. Er wurde in der eingeschränkten Arbeitsumgebung nicht erfolgreich ausgeführt, da Chromium keine lokalen Sockets öffnen konnte. Ersetzt daher keinen hier vorliegenden Screenshotnachweis. Installation und Befehle: Haupt-README.

## Fotostudio V31.3

- `node tests/backend-contract.mjs` enthält den Poof-Test (Schutz, Prüfungen, Fehler, Timeout, Rate-Limit, Cache, kein Schlüssel in Antworten).
- `npm run test:fotostudio` prüft den Ablauf im Browser mit gemockter Poof-API (Ergebnis: `tests/fotostudio-results.json`). Benötigt Playwright; ein echter Poof-Aufruf findet nicht statt.
