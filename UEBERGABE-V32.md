# V32 „Noir“: neues Design, Unternehmer-Zitate und KI-Panda

**Nichts wurde auf Cloudflare veröffentlicht.** Deployment erst nach ausdrücklichem „ja“.

## 1. Farben und Schrift
- Durchgehend Anthrazit bis Schwarz, Weiß bis Cremeweiß und Silber. Blau, Orange und Gold sind entfernt.
- Grün und Rot gibt es nur noch für Zahlen: Umsatz und Anstiege grün, Rückgänge und Verluste rot.
- Umgestellt wurden alle Stylesheets sowie die Farbwerte in `fx.js`, `dashboard.js` und `app.js` (Diagramme, Sparklines, Status). Alle Effekte bleiben erhalten, nur ihre Farbe ist neu.
- Nicht umgefärbt: Foto-Bearbeitung (Wärme-Regler), Titelbild-Stile in `cutout.js`, Beispielartikel in `demo.js`.
- Hintergrundbild, Rahmen und RV-Zeichen sind silbern statt farbig. Oben links steht das RV-Monogramm (`rv-monogram.png`) statt der Erdkugel.
- Schrift: Figtree (Google Fonts) statt Rajdhani bzw. Segoe UI.
- Sparklines: grün bei Anstieg, rot bei Rückgang, silbern ohne Veränderung.

## 2. Zitate statt Globus (`quotes.js`)
- 113 Zitate bekannter Unternehmer, ins Deutsche übertragen. Aufgenommen wurden nur Zitate mit belegter Herkunft.
- Zufällige Reihenfolge, keine Wiederholung, bis alle einmal dran waren. Wechsel alle 8 Sekunden mit weicher Überblendung, Lichtstreif und Funken. Antippen zeigt sofort das nächste Zitat.
- Eigene Zitate: `localStorage` → `rv_quotes_own` als Liste `[Text, Name, Rolle]`.
- Animations-Einstellungen: „Zitate wechseln“ und „Zitat-Effekte“ (die bisherigen Schalter für den Globus).

## 3. KI-Panda „Bao“ (`panda.js`)
- Ersetzt die Energiekugel, den Roboter und die blaue Kugel oben rechts. Er erscheint auf der Startseite, im KI-Chat, oben rechts und in der unteren Leiste. Die kleinen Avatare der KI-Antworten zeigen seinen Kopf.
- **Bereit:** atmet, blinzelt, zuckt mit den Ohren und folgt Finger oder Maus mit den Augen.
- **Hört zu:** beim Tippen in `#chatInput` oder `#homeAiInput`. Er beugt sich vor und nickt bei jedem Tastendruck.
- **Überlegt:** solange `rv:ai-state` „busy“ meldet. Kopf schief, Pfote am Kinn, Denkblasen.
- **Spricht:** bei jeder neuen KI-Nachricht in `#homeAiFeed`. Die Antwort erscheint Wort für Wort, und der Mund bewegt sich passend.
- **Freut sich:** kurzer Hüpfer, wenn die Antwort fertig ist.
- Der Panda liest nur die Oberfläche mit. Chat-Logik, Anbieter, Verlauf und Kopierfunktion sind unverändert.
- Der Schalter „Panda bewegt sich“ in den Animations-Einstellungen hält ihn still.

## 4. Abgeschaltet, nicht gelöscht
- Globus, Erd-Avatar, Energiekugeln und Goldfelder in `fx.js`. Sie laufen nur noch mit `window.RV_LEGACY_FX = true`.

## 5. Tests
- `npm test`: Backend 18/18, Chat & Sync 13/13, Dashboard 10/10.
- `npm run test:fotostudio` (Chromium, Poof gemockt): 14/14.
- Zusätzlich im Browser geprüft: Ein simulierter Chat durchläuft „Hört zu“, „Überlegt“, „Spricht“ und „Bereit“. Alle Wörter werden sichtbar, und es gibt keine Skriptfehler. Alle sieben Seiten wurden per Screenshot geprüft.
- `npm run test:browser` schlägt bei „0 €“ fehl, weil die Beispielartikel 134 € Umsatz erzeugen. Der Fehler tritt unverändert schon in v31.3 auf.
