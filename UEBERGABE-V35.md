# V35: Navigation 2.0 · Bao der Panda · RVO Intelligence

**Nichts wurde auf Cloudflare veröffentlicht.** Deployment erst nach ausdrücklichem „ja“.
Grundlage: deine Projekt-ZIP **RVOX V34**. Die Einstellungen zeigen **V35 · 16.10.2026** (`RV_VERSION` in `app.js`, Cache `rv-studio-v35`, `package.json` 35.0.0).

Unverändert geblieben: Poof.bg-Freistellung und Bildverarbeitung (`cutout.js`, `/api/poof`), Originalfotos, `rvCutout`, `rvCover`, Plattform-Zuschnitt, Cloud-Anmeldung und Synchronisierung, D1-Tabellen `articles` und `app_meta`, R2-Fotos, Einkaufschargen, Glanz, Randlicht, Seitenwechsel und alle bisherigen Animationen.

---

## 1. Navigation 2.0

**Hauptmenü mit fünf Bereichen statt sieben Kacheln:** Home · Bestand · Studio · Bao · Einstellungen.

**Bereichsmenü darunter** (Segmente mit gleitender, leuchtender Markierung, per Pfeiltasten bedienbar):
- **Bestand:** Bestand | Einkäufe | Verkäufe. Ein Tipp wechselt sofort, die Kachel „Bestand“ bleibt aktiv. Unter „Einkäufe“ liegen die bisherigen Einkaufschargen (ohne die Bestands-Tabs darüber). „Verkäufe“ ist die bisherige Insights-Seite mit Umsatz, Gewinn, Plattformen und Verlauf, nur umbenannt. Das grüne Versand-Abzeichen sitzt jetzt auf „Bestand“.
- **Bao:** Gespräch | Aufgaben | Eingang | Freigaben, mit Zählern (rot = überfällig).

**Snipes:** Die Kachel ist entfernt. `SN_ENABLED = false` in `app.js` verhindert automatische Vinted-Abfragen und den Verbindungsversuch zum Userscript. Daten (`rv_snipe_v1`), Code, Stylesheet und HTML bleiben erhalten. Zum Reaktivieren `SN_ENABLED` auf `true` setzen und die Kachel wieder einfügen.

## 2. Home: Baos Briefing

Ganz oben steht jetzt **„Bao · Dein Briefing“**:
- Gewinn im laufenden Monat mit Vormonat, Bestandswert (Einkaufspreise) und offene Aufgaben.
- **„Das ist heute wichtig“** mit bis zu vier Punkten, z. B. überfällige Aufgaben, Verkäufe ohne Versand, Listings zum Entfernen, Freigaben, Ladenhüter und Entwürfe. Jeder Punkt öffnet direkt die passende Ansicht.
- Darunter Bao, der Chat und Schnellfragen zu den fünf Beispielfragen aus deinem Auftrag.

Alle bisherigen Bereiche (Verkaufs-Übersicht, Schnellzugriff, Neueste Artikel, Verlauf, Kategorien, Performance, Aufgaben, Trends) sind unverändert vorhanden.

## 3. Bao – Technik und Animationssystem

**Gewählte Technik: Vektor-Rig in SVG mit eigener Animationssteuerung** (`public/bao.js`, `public/bao.css`). Es gibt kein Einzelbild, keine Bilddatei und keine externe Bibliothek.

Warum nicht die anderen Techniken:
- **Rive und Lottie** brauchen eine fertig animierte Datei aus einem Editor. Die gibt es noch nicht, und ich erfinde keine. Dazu käme eine Laufzeit von 70 bis 200 kB.
- **Sprites** wären für jede Pose ein eigenes Bild und unabhängige Bewegungen von Mund, Augen und Pfoten kaum möglich.
- **Canvas** ist schlechter für Barrierefreiheit und scharfe Darstellung.

**Aufbau des Rigs:** Bao ist nach deinem Referenzbild in einzelne Teile zerlegt. Jedes Teil ist eine eigene Gruppe mit Gelenkpunkt:
- Wurzel → Körper (Atmen, Stauchen, Strecken)
- Kopf (Neigen, Drehen mit Parallaxe), Ohren
- Gesicht: Augenflecken, Augen mit Iris und Glanzpunkten, Pupillen (Blick), Lider (Blinzeln), fröhliche Augen, Augenbrauen-Fell, Nase, Lächeln, Mund mit Zunge, Wangen
- Arme mit Schultergelenk, Füße mit braunen Ballen
- Requisite (Geldschein-Blaster) und Effekte (Denkblasen, Funkeln, Herz)

Das Fell ist eine weich gezackte Kontur, das Volumen entsteht durch Verläufe. Die schwarzen Teile haben eine feine Lichtkante, damit Bao auf dem dunklen Hintergrund nicht verschwindet.

**Ehrlich:** Das ist eine handgebaute 2D-Vektorfigur *nach* dem Referenzbild. Sie ist keine pixelgenaue Kopie des 3D-Renderings. Merkmale, Proportionen und Farben folgen dem Bild (weißer runder Kopf, schräge Augenflecken, große braune Augen, offenes Lächeln, schwarze Arme, weißer Bauch, Pfotenballen). Vergleich: `docs/v35/bao-zustaende.jpg`. Für einen noch näheren, illustrierten Look ist der nächste Schritt eine **Rive-Datei**. Ein Illustrator zeichnet Bao dafür in Teilen nach, und die Zustände bleiben gleich. Die Schnittstelle `window.RVBao` (state, speak, cameo, success) ist dafür bereits getrennt.

**Verhalten:**
- **Idle:** atmet, blinzelt (manchmal doppelt), schaut sich um, legt den Kopf neugierig schief, wackelt mit den Ohren, wippt, grinst, verlagert die Haltung, winkt oder streckt sich ab und zu. Nie zweimal dieselbe Bewegung hintereinander.
- **Antippen/Klick:** jedes Mal eine andere Reaktion (Winken, Sprung, Drehung, Lachen, Klatschen, Herz, Jubel, neugierig) und Blick zu dir.
- **Maus:** Auf dem Desktop folgen Augen und Kopf dezent dem Mauszeiger.
- **Touch:** Auf dem Handy schaut Bao kurz dorthin, wo du tippst.
- **Hört zu:** Beim Tippen beugt er sich vor und nickt.
- **Denkt:** solange die KI-Anfrage läuft, gekoppelt an `rv:ai-state` „busy“. Pfote am Kinn, Kopf schief, Blick nach oben, Denkblasen. Ende mit der echten Antwort oder dem Fehler.
- **Spricht:** Die Antwort erscheint Wort für Wort. Der Mund öffnet sich je Wort nach Vokalen und schließt bei Pausen, dazu Gesten und Kopfbewegung. *Das ist eine an die Textausgabe gekoppelte, vereinfachte Mundbewegung, keine Lippensynchronität.* Für spätere Sprachausgabe ist `RVBao.attachAudio(audio)` vorbereitet. Es bewegt den Mund nach der Lautstärke (Amplitude, keine Phoneme) und ist noch **nicht mit echter Sprachausgabe getestet**.
- **Erfolg:** Jubel, Sprung, Drehung, Klatschen, Lachen. Ausgelöst nur durch echte Ereignisse:
  - neuer Artikel gespeichert
  - Status wechselt auf „Verkauft“
  - Aufgabe erledigt

  Dafür meldet `store()` in `app.js` jetzt `rv:article-saved`. Sync-Übernahmen und Beispielartikel zählen nicht.
- **Geldkanonen-Gag:** Ein runder Spielzeug-Blaster in Mint und Weiß mit Trichter (keine Waffenform). Bao holt ihn hervor, schießt dreimal Geldscheine in die Luft, lacht und steckt ihn weg. Die Scheine sind kleine Teilchen ohne Klickfläche. Er kommt höchstens alle 10 Minuten: beim Antippen mit 8 % Chance, bei Verkäufen mit 25 bis 30 % Chance.
- **Auftritte außerhalb des Chats:**
  - Arten: von unten hervorschauen und winken, unten vorbeilaufen, Hinweis mit Sprechblase, Jubel bei Verkauf oder erledigter Aufgabe.
  - Begrenzung:
    - spontan höchstens 4 pro Tag und mindestens 8 Minuten Abstand, Ereignisse höchstens 8 pro Tag
    - nicht in den ersten 2,5 s nach deiner letzten Eingabe
    - nicht im Studio, nicht bei offener Artikelakte oder offenem Dialog
    - nicht, wenn Bao ohnehin sichtbar ist
  - Feste Position am Rand, `pointer-events: none`, also verdeckt er nie einen Knopf. Abschaltbar unter Einstellungen → Animationen → „Bao-Auftritte“.

**Leistung:**
- Ein gemeinsamer `requestAnimationFrame`-Takt nur für **sichtbare** Figuren (IntersectionObserver). Er pausiert bei verstecktem Tab.
- Im Ruhezustand werden 30 Bilder pro Sekunde gezeichnet, bei Bewegung 60.
- Pro Bild werden nur Transform-Attribute von etwa 15 Gruppen gesetzt, ohne Filter-Animation.
- Kleine Köpfe (Avatar, Menü, KI-Leiste) sind Standbilder.
- „Bewegung aus“ oder „Bao bewegt sich“ = aus: nur Standbilder je Zustand, kein Takt.

## 4. RVO Intelligence

**Daten:**
- Kennzahlen berechnet das Gerät aus deinen echten RVO-Daten: Bestand, Verkäufe mit Datum, Einkaufschargen, Aufgaben.
- **Beispielartikel (`demo-…`) werden ausgeschlossen**, und Bao sagt das dazu.
- Fehlen Daten (z. B. Einkaufsdatum), sagt Bao das, statt zu schätzen.

**Schnelle Antworten ohne KI-Kosten** (sofort, lokal berechnet):

| Frage | Antwort von Bao |
| --- | --- |
| „Welche Artikel liegen am längsten im Bestand?“ | Top 5 mit Tagen, Einkaufspreis und Preis, dazu gebundenes Kapital. Eine Aufgabe „Ladenhüter prüfen“ kommt als Vorschlag unter Freigaben. |
| „Wie viel Gewinn habe ich diesen Monat gemacht?“ | Monat und Vormonat, eine klar als Schätzung markierte Hochrechnung und die Gewinnformel. |
| „Welche Produkte bringen die beste Marge?“ | Kategorien und Marken mit mindestens 2 Verkäufen, mit Hinweis auf kleine Stichproben. |
| „Was sollte ich als Nächstes erledigen?“ | Das Briefing. |
| „Lohnt es sich, aktuell neue Ware einzukaufen?“ | Begründete Einschätzung aus Abverkaufsquote (90 Tage), Ø Tagen bis Verkauf, Kapital in Ladenhütern und Entwürfen. Ausdrücklich ohne Marktpreise. |

**Alle anderen Fragen gehen an `/api/bao`** (neu in `functions/api/[[path]].js`):
- **Werkzeuge** statt Datendump. Das Modell bekommt eine kurze Übersicht und ruft bei Bedarf Werkzeuge auf: `items_query`, `sales_report`, `stock_health`, `purchases_overview`, `list_tasks`. Die Werkzeuge rechnen **serverseitig** über die übermittelten Daten. Das spart Tokens, und Zahlen kommen aus dem Code, nicht aus dem Modell.
- **Kritische Haltung im Systemauftrag:** „Deine Aufgabe ist nicht, dem Nutzer recht zu geben …“, keine erfundenen Zahlen, Rückfragen, Widerspruch, keine Rechts- oder Steuerberatung.
- **Schutz gegen Prompt-Injection:**
  - Artikeltexte, Dokumente und Werkzeugergebnisse sind als Daten markiert.
  - Werkzeuge können nur lesen.
  - Das einzige „schreibende“ Werkzeug `propose_task` erzeugt nur einen **Vorschlag** (höchstens 3 pro Antwort).
  - Eingaben sind serverseitig gekürzt und typgeprüft.
  - Fotos und Kennwörter werden nie mitgeschickt.
- **Rückfall:** Kennt der Server `/api/bao` noch nicht (404), nutzt die App automatisch den bisherigen `/api/ai-chat`.

**Aufgaben** (Bao → Aufgaben):
- Anlegen mit Fälligkeit und Priorität, abhaken, löschen. Erledigte sind eingeklappt.
- Überfälliges ist rot und zählt im Menü.
- „Bao, schlag was vor“ macht aus dem Briefing Vorschläge (kostenlos).
- Geräteübergreifend: Die Aufgaben werden bei jeder Cloud-Synchronisierung über `/api/meta/bao_tasks` abgeglichen. Das ist eine **neue Zeile** in der bestehenden Tabelle `app_meta`, keine Schemaänderung. Abgleich je Aufgabe nach letzter Änderung, mit Konfliktschutz über die Revision.

**Eingang** (Bao → Eingang): Foto, Screenshot, PDF oder eingefügter Text an `/api/bao/doc`.
- Bilder werden vorher auf höchstens 1800 px verkleinert.
- Strukturierte Ausgabe per JSON-Schema:
  - Art: Kassenbon, Rechnung, Behördenbrief, Brief, Kundennachricht, Screenshot, Versand, Sonstiges
  - Zusammenfassung und Absender
  - Beträge und Daten jeweils mit „sicher/unsicher“ und wörtlicher Fundstelle
  - Fristen, Unklarheiten
  - bei Kundennachrichten ein Antwortentwurf
  - Vorschläge
- **Fristen und Beträge werden nie geraten.** Ist etwas unklar, steht dort „unsicher – prüfen“.
- Bei Steuer-, Rechts- und Behördeninhalten erscheint ein deutlicher Hinweis, im Original zu prüfen.

**Freigaben** (Bao → Freigaben): Nichts passiert ohne dein OK.
- „Aufgabe anlegen“: Titel, Datum und Priorität sind vorher änderbar.
- „Einkauf erfassen“ aus einem Kassenbon: Bezeichnung, Datum und Betrag sind änderbar. Erst nach „Freigeben“ entsteht eine Einkaufscharge.
- „Antwortentwurf“: wird nur kopiert, **nie gesendet**.

Jede Entscheidung landet im **Protokoll**.

**Kosten** (Bao → Freigaben, unten):
- KI-Anfragen dieses Geräts im laufenden Monat mit geschätzten Kosten.
- „Server prüfen“ zeigt die serverseitige Monatssumme, die Grenze und ob die Sperre aktiv ist.

## 5. KI-Architektur und Kosten

**Modelle** (Preise am 16.10.2026 auf developers.openai.com/api/docs/pricing geprüft, je 1 Mio. Tokens):

| Modell | Eingabe | Ausgabe |
| --- | --- | --- |
| gpt-4.1-mini (Standard, wie bisher) | 0,40 $ | 1,60 $ |
| gpt-4.1-nano | 0,10 $ | 0,40 $ |
| gpt-5-mini | 0,25 $ | 2,00 $ (Denk-Tokens zählen als Ausgabe) |
| gpt-5-nano | 0,05 $ | 0,40 $ |

**Standard bleibt `gpt-4.1-mini`:** bewährt, gut bei Werkzeugaufrufen, ohne versteckte Denk-Tokens.

| Anfrage | typische Tokens | Kosten |
| --- | --- | --- |
| Bao-Frage mit Werkzeugen | 2 bis 6 Tsd. Eingabe, 200 bis 500 Ausgabe | 0,1 bis 0,3 US-Cent |
| Dokument im Eingang | 1,5 bis 3 Tsd. | 0,1 bis 0,2 US-Cent |

**Mit 10 € sind damit grob 3.000 bis 5.000 Anfragen im Monat möglich.** Die lokalen Schnellantworten kosten nichts.

**Serverseitige Kostengrenze (neu):**
- Jede OpenAI-Anfrage über die App (Bao, Eingang, bisheriger KI-Chat, Listing-Texte) wird mit ihren Tokens in der neuen D1-Tabelle `ai_usage` erfasst.
- Ab der Monatsgrenze **`AI_MONTHLY_LIMIT_USD`** (Standard **11 $ ≈ 10 €**) lehnt der Server neue Anfragen ab (HTTP 429).
- Das ist eine echte Sperre im Server. Die Summe ist aber eine **Schätzung** aus Tokens × Listenpreis und keine OpenAI-Abrechnung.
- Ohne D1-Bindung meldet die App ausdrücklich „keine Sperre aktiv“.
- **Empfehlung:** zusätzlich im OpenAI-Projekt ein Budget-Limit setzen. Das ist die einzige wirklich garantierte Obergrenze.

**Erweiterbar für später** (E-Mail, eBay, Shopify, Instagram):
- Neue Datenquellen kommen als weitere **lesende Werkzeuge** in `BAO_TOOLS` dazu.
- Handlungen kommen als weitere **Vorschlagstypen** in `execute()` (`public/rvo-intel.js`) dazu und laufen damit automatisch über Freigabe und Protokoll.
- Zugangsdaten gehören dann als Secrets auf den Server, nie in die App.
- Bei Vinted nur offizielle bzw. zulässige Wege. Snipes bleibt dafür aus.

## 6. Neue und geänderte Dateien

| Datei | Inhalt |
| --- | --- |
| `public/bao.js`, `public/bao.css` | neues Bao-Rig und Animationssystem (ersetzt `panda.js`, das nicht mehr geladen wird, aber erhalten ist) |
| `public/rvo-intel.js`, `public/rvo.css` | RVO Intelligence, Bao-Bereich, Briefing, Navigation-Design |
| `app.js` | Navigation 2.0, Snipes-Schalter, Ereignis `rv:article-saved`, Schnellfragen, Version. Am Ende steht die **Brücke `window.RVO`**: `app.js` ist gekapselt, deshalb erhalten die neuen Module nur ausdrücklich freigegebene Funktionen. |
| `public/index.html` | neue Kacheln, Bereichsmenü, Briefing oben, neue Skripte |
| `public/anim.js` | Schalter „Bao-Auftritte“ |
| `public/sw.js` | Cache v35 mit neuen Dateien |
| `functions/api/[[path]].js` | `/api/bao`, `/api/bao/doc`, `/api/bao/usage`, `/api/meta/bao_tasks`, Kostenerfassung und -grenze |
| `schema.sql` | Tabelle `ai_usage` (nur für lokale Tests; in Produktion legt der Server sie selbst an) |
| `tests/bao-backend.mjs`, `tests/v35-browser.mjs` | neue Tests |
| `docs/v35/` | Screenshots |

## 7. Tests (tatsächlich ausgeführt)

- `npm test` (neu inkl. Bao-Backend): **Backend 18/18, Chat & Sync 13/13, Dashboard 10/10, Bao-Backend 6/6**.
  Die Bao-Backend-Tests prüfen:
  - Schutz durch das Kennwort
  - Werkzeuge rechnen auf den Daten
  - Vorschläge statt Aktionen
  - Kürzung zu großer Daten und höchstens 3 Vorschläge
  - letzte Runde ohne Werkzeuge
  - Budget-Sperre 429, auch für den alten Chat
  - Eingang für Bild, PDF und Text mit JSON-Schema, Typprüfung und kaputtem JSON
  - Aufgaben-Sync mit Revisionen, ohne die Einkaufschargen zu berühren
- `npm run test:v35` (Chromium, API gemockt, 412 × 915 Touch und 1440 × 900): **17/17**. Geprüft:
  - fünf Bereiche, kein Snipes, kein Userscript-Ping
  - Briefing mit richtigen Zahlen (Beispielartikel ausgeschlossen)
  - Wechsel Bestand / Einkäufe / Verkäufe
  - alle Bao-Unterseiten
  - lokale Antwort ohne API-Aufruf
  - Denkzustand genau während der laufenden Anfrage
  - Snapshot ohne Fotos und Beispielartikel
  - Freigabe → Aufgabe → Erledigt → Erfolgsmoment
  - Eingang verkleinert das Bild, Kassenbon → Einkaufscharge erst nach Freigabe
  - Verkaufsereignis
  - Rückfall auf den alten Chat ohne doppelte Nachricht
  - Antippen, Standbild bei „Bewegung aus“
  - Auftritt ohne Klickfläche, begrenzt
  - Blick folgt der Maus
  - keine Skriptfehler, kein horizontaler Überlauf
- `npm run test:fotostudio`: **14/14** (Poof gemockt), die Bildverarbeitung ist unverändert.
- `npm run test:browser` schlägt weiterhin nur bei „0 €“ fehl. Grund sind die Beispielartikel (134 € Umsatz), unverändert seit V31.3.

**Nicht getestet:**
- echte OpenAI-Aufrufe
- echtes Cloudflare (D1, R2, Secrets)
- echter Geräte-Test auf dem Galaxy S25
- echte Sprachausgabe

## 8. Offene Punkte und Grenzen

- **KI-Endpunkt / Worker `rvstudio-ai`:** Der Quellcode dieses Workers ist **nicht** in der ZIP. In diesem Projekt laufen KI und Poof über die Pages Functions (`functions/api`). Falls in den Einstellungen unter KI ein eigener Endpunkt auf den Worker `rvstudio-ai` zeigt, kennt dieser `/api/bao` noch nicht. Dann gilt:
  - Der Chat fällt automatisch auf `/api/ai-chat` zurück.
  - Eingang und Kostenübersicht melden „Server kennt … noch nicht“.

  Lösung: entweder den Endpunkt auf die Pages-Adresse stellen (Standard) oder dieselbe Datei auch im Worker ausrollen. Gib mir den Worker-Code, dann passe ich ihn an.
- **Beispielartikel:** Die bisherigen Startseiten-Kacheln (Verkaufs-Übersicht, Performance) rechnen Beispielartikel weiterhin mit, wie seit V21. Baos Briefing und alle Bao-Antworten schließen sie aus. Soll ich die Beispielartikel auch aus den übrigen Kacheln herausnehmen oder ganz abschaffen?
- **Bao-Optik:** Vektorfigur nach dem Referenzbild, keine 3D-Kopie (siehe Abschnitt 3).
- **Mundbewegung:** an die Textausgabe gekoppelt, keine Audio-Lippensynchronität.
- **PDFs:** gehen direkt an OpenAI (`input_file`). Gescannte PDFs ohne Text erkennt das Modell über die Seitenbilder. Sehr lange PDFs kosten mehr; das Limit liegt bei 10 MB.
- **Eingang:** Die Einträge liegen nur auf diesem Gerät (`localStorage`, mit kleinem Vorschaubild). Die Originaldatei wird nicht gespeichert.
- **Freigaben, Protokoll, Kostenliste:** liegen pro Gerät. Synchronisiert werden nur Aufgaben.
- **Konto-Integrationen** (Gmail, GMX, eBay, Shopify, Instagram): noch nicht umgesetzt, nur vorbereitet (Abschnitt 5).
- **Claude als Anbieter:** Bao funktioniert ohne Werkzeugaufrufe mit vorberechneten Auswertungen. Der Eingang nutzt nur OpenAI.

## 9. Cloudflare-Hinweise

| Name | Zweck |
| --- | --- |
| `OPENAI_API_KEY` | wie bisher, nötig für Bao und den Eingang |
| `AI_MONTHLY_LIMIT_USD` | optional: Monatsgrenze in US-Dollar (Standard 11; `0` = keine Sperre) |
| `BAO_MODEL` | optional: Modell für Bao (Standard `OPENAI_MODEL` bzw. `gpt-4.1-mini`) |
| `BAO_DOC_MODEL` | optional: Modell für den Eingang (Standard wie Bao) |

**Keine neuen Pflicht-Secrets.**

**Keine manuelle Datenbankmigration nötig.**
- `ai_usage` legt der Server beim ersten Aufruf mit `CREATE TABLE IF NOT EXISTS` an, wie bisher `poof_calls`.
- Aufgaben nutzen eine neue Zeile `bao_tasks` in `app_meta`.
- Bestehende Tabellen und Zeilen werden nicht verändert.
- Vorher sicherheitshalber ein Backup: Einstellungen → Daten → Backup, optional `wrangler d1 export`.

## 10. Android-PWA

- Nach dem Veröffentlichen lädt der Service Worker `rv-studio-v35` die neuen Dateien. Falls die alte Ansicht bleibt: App einmal schließen und neu öffnen.
- Die neuen Bedienelemente sind mindestens 36 px groß (Menü-Segmente 40 px). Bao reagiert auf Antippen. Auftritte nutzen den sicheren Bereich unten (`safe-area-inset-bottom`).
- Für den Eingang öffnet „Foto, Screenshot oder PDF wählen“ auf Android die übliche Auswahl (in der Regel Kamera, Galerie oder Dateien).
