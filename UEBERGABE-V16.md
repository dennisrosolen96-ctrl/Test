# V16 — Änderungen, Testnachweis und Grenzen

## Durchgeführte Änderungen

- Die V11-/V15-Startseiten-Override-Kaskade ersetzt: gemeinsame Design-Tokens und eine eigenständige `public/dashboard.css`. Die übrigen App-Seiten behalten ihre vorhandene Gestaltung und Funktionen.
- Die kontaminierten V15-Rasterrahmen aus dem produktiven Pfad entfernt. Ihre eingebrannten Titel und Ausschnitte benachbarter Sektionen liegen nur noch in `reference-archive/v15/`.
- Größenabhängige mehrschichtige SVG-Rahmen mit festen Eckmaßen, Metallprofilen, getrennten Gold-/Rotkanten, Reflexen, Lichtsegmenten und technischen Details erstellt. Die Rahmen enthalten keine Texte oder Geschäftskennzahlen.
- Passende originale Globus-, Rundroboter-, Avatar- und Reaktor-Assets erhalten. Globus vergrößert, KI-Begrüßung und sechs Aktionen auf breiten Ansichten gemeinsam rechts neben dem Roboter angeordnet. Dezente Animationen und `prefers-reduced-motion` berücksichtigt.
- Sechs Hauptkacheln und sechs Schnellaktionen mit vorhandenen Funktionen verbunden; Einkaufsansicht, Verkaufsfilter und aktiver Bottomnav-Zustand präzisiert. Fotoknopf löst den vorhandenen Foto-Upload mit Kamera-Hinweis aus; Barcode-/Sprachfunktionen haben verständliche Browser-Fallbacks.
- Siebenteilige gemeinsame Bottomnav mit zentralem Original-Orb, Safe Areas und aktiven Zuständen umgesetzt.
- Lesbare Mobile-Umbrüche für Kacheln, Kennzahlen, KI-Aktionen und Einblicke. Lokale Command-Center-Schrift, lokale JSZip-Datei und kontrolliert aktualisierter Service Worker mit Cache `rv-studio-v16-reference-1`.
- Geschäftslogik aus dem duplizierten Inline-Script in die tatsächliche `public/app.js` ausgelagert. Autoritative Quelle ist die vorhandene Root-Datei `app.js`; `scripts/build.mjs` hält beide Dateien synchron.
- Dashboarddaten ausschließlich aus vorhandenen Artikeln: lokale Kalendertage, Gebühren/Versand im Gewinn, ehrliche Nullzustände, keine Trendlinie ohne zeitlichen Verlauf, keine Prozententwicklung ohne belastbaren Vergleich. Archivierte unverkaufte Artikel zählen nicht als aktiver Bestand.
- Lagerwert als Schätzung aus vorhandenen Angebotspreisen je Artikel gemittelt; ohne Angebotspreis gilt der gespeicherte Einkaufspreis. Diese Berechnung ist als Tooltip dokumentiert. Die vorhandene Finanzansicht verwendet weiterhin Einkaufskosten als Warenwert.
- Einblicke aus erfassten Daten statt erfundenen Markttrends. Die Bezeichnung „Aus deinen Daten berechnet“ vermeidet eine falsche Behauptung externer KI-/Marktdaten.
- KI-Aktionen verwenden echte `/api/ai-chat`-Anfragen und begrenzte eigene Produkt-/Verkaufsangaben. Kein statischer Demoersatz. Fehlendes RV-Kennwort, Providerfehler und Timeout sind sichtbar; Online-Status erscheint erst nach erfolgreicher Providerantwort. Providertext wird sicher als Text ausgegeben. Vollständige Foto-Listings über `/api/listing` bleiben im Studio erhalten.
- Zwei vorhandene Sync-Fehler behoben: falscher Auth-Header und `uploadModified` außerhalb seines gültigen Scopes. Während des Uploads entstandene Änderungen bleiben in der Queue. Die Glocke öffnet den Werkzeugbereich vor dem Scrollen.

## Tatsächlich ausgeführte Tests

**39 Testgruppen bestanden, 0 fehlgeschlagen.** Reproduzierbar mit `npm test`; die JSON-Ergebnisse liegen in `tests/`.

| Testdatei | Gruppen | Inhalt |
| --- | ---: | --- |
| `backend-contract.mjs` | 16 | Authentifizierung, fehlende Bindings, Artikel anlegen/listen/laden, Revisionen/Konflikte, Tombstones/Wiederherstellung, Einkaufschargen, Foto-Upload/Download/Validierung, OpenAI/Claude-Chat und Listing, fehlende Provider-Keys und Providerfehler. |
| `chat-and-sync.mjs` | 13 | Sechs echte KI-Aktionswege, fehlendes Kennwort, Textausgabe, HTTP-/Netzwerk-/Timeoutfehler, Pending-Bereinigung, lokale Befehle, Dokumentevent, aktive Cloud-Sitzung, parallele Klicks, Sync-Header, Queue und Änderungen während Uploads. |
| `dashboard.mjs` | 10 | Nullwerte, Umsatz/Verkäufe/Gewinn/Durchschnitt, Gebühren/Versand, lokale Datumsgrenzen, Verkäufe ohne Datum, 7/30-Tage-Abgrenzung, Prozentvergleich und echte zeitliche Buckets. |

Diese Tests verwenden echte Implementierungsfunktionen mit isolierten DOM-/D1-/R2-/Provider-Doubles. Sie belegen **keine Live-Cloudflare-/Provider-Verbindung und keine getestete Browserbedienung**.

Zusätzlich ausgeführt: Node-Syntaxprüfung der Kern-, Dashboard-, Service-Worker- und Browser-Testdateien; Prüfung auf unausgeglichene HTML-Tags, doppelte IDs, fehlende HTML-/CSS-Assets und fehlende PWA-Cache-Dateien. Keine Fehler. Gegenüber dem Original bytegleich: `functions/api/[[path]].js`, `schema.sql`, `wrangler.toml`, `public/manifest.webmanifest`.

Die vorhandenen Bildassets wurden visuell untersucht. Einzelne neu erzeugte SVG-Rahmen wurden mit einem SVG-Rasterizer gerendert und korrigiert. **Das ist keine gerenderte App- oder Screenshotprüfung.**

## Fehlende visuelle Endprüfung und Screenshots

Chromium ist installiert, sein Start scheiterte jedoch an der lokalen Socket-Sperre: `setsockopt: Operation not permitted`. Freigabeversuche für den Browser-/Serverlauf wurden unterbrochen. Es wurden deshalb **keine echten V16-App-Screenshots erstellt**.

Die verlangten Endaufnahmen der mobilen Startseite und der Desktopansicht **fehlen in dieser Lieferung**. Ebenso fehlt die erfolgreiche iterative Browserprüfung bei 390 × 844, 430 × 932, 768 × 1024 und 1440 × 900. `tests/browser.mjs` erzeugt diese Aufnahmen und prüft Navigation, Nullwerte, Setup-Zustand, Glocke sowie horizontalen Überlauf auf einer normalen Arbeitsstation. Die Anwendung wird darin aus den tatsächlichen Produktionsdateien geladen; es ist kein isoliertes Mockup.

Eine pixelgenaue Übereinstimmung oder ein gemessener Prozentwert wird ausdrücklich nicht behauptet. Die visuelle Endabnahme bleibt offen.

## Verbleibende Abweichungen / Grenzen

- Auf 390/430 Pixeln stehen Navigation und Schnellzugriff in 3 × 2 Reihen; KPI-Panels und KI-Sektion sind umgeordnet, Einblicke vertikal gestapelt. Die Referenz ist 720 × 1280; eine reine Verkleinerung würde ihre Beschriftungen unleserlich machen. Dadurch ist die Smartphone-Seite länger als die Referenz.
- Metallrahmen und Lichtreflexe sind Vektorrekonstruktionen. Fotorealistische Mikrotexturen, individuelle Reflexe und einige asymmetrische Details der Referenz sind nicht identisch reproduziert; die gerenderte Gesamtwirkung ist noch nicht geprüft.
- Das Betriebssystem-Statusfeld mit Uhr/Batterie/WLAN aus der Referenz wird nicht als künstliche App-Statusleiste nachgebaut.
- Fehlende Geschäfts-, Vergleichs- und Marktverlaufsdaten erscheinen als Null-/Leerzustand. Referenz-Demozahlen und externe Nachfragebehauptungen werden nicht übernommen.
- Einblicke sind regelbasiert aus echten gespeicherten Artikeln berechnet. Sie sind ohne erfolgreiches KI-Backend keine KI-generierten Marktrecherchen.
- Kamera, BarcodeDetector und Spracheingabe hängen vom Browser und seinen Berechtigungen ab. Ihr tatsächliches Verhalten auf iOS/Android, Touch, Safe Areas und Offline-Navigation wurde nicht mit einem Browser bestätigt.
- Kein Zugriff auf produktive Secrets oder reale D1/R2-/KI-Providerkonten; keine Live-Synchronisierung, keine externe Modellanfrage und kein Live-Deployment getestet.
- Bestehende Backend-Grenze: ungültiges Provider-Listing-JSON kann HTTP 200 mit leeren Listings liefern. Das Frontend meldet dafür keinen Erfolg; der Serververtrag wurde beibehalten.

## Dateien und Deployment

Die ZIP enthält das vollständige Projekt mit `public/`, `functions/`, `schema.sql`, `wrangler.toml`, maßgeblicher `app.js`, Buildskript, Tests, Testresultaten, Referenzarchiv, lokaler Schrift/JSZip samt Lizenzen sowie Konfigurationsbeispiel. Keine Zugangsdaten, `.dev.vars`, privaten Nutzerdatensätze oder installierten `node_modules`.

Entpack-, Test-, Screenshot- und Deploymentbefehle sowie alle benötigten Variablen stehen in [README.md](README.md).
