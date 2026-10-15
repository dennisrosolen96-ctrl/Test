# V29 — Kein Flackern mehr, Globus mittig

## Flackern
**Ursache:** Das Randlicht aus V28 lief als drehender Farbverlauf mit Maske um jedes Panel. Dafür musste der Browser das **komplette Panel in jedem Bild neu zeichnen** – bei der großen Verkaufs-Übersicht mit Globus kam das S25 nicht hinterher, Teile des Panels blieben kurz ungezeichnet (sichtbar als Flackern bzw. fehlender Hintergrund unter den Kennzahlen).

**Lösung (Animationen bleiben an):**
- Das Randlicht ist jetzt ein **Lichtpunkt, der über die Oberkante jedes Panels läuft** (weiß → blau → orange). Gezeichnet wird nur noch ein 2-px-Streifen auf eigener Ebene. Schalter *Randlicht* wirkt weiterhin.
- Globus-Effekte (Hintergrund, Ringe, Goldfeld, Erde) liegen auf eigenen Grafikebenen; ihr Neuzeichnen betrifft das Panel nicht mehr. Die Mischmodus-Überblendung des Radar-Strahls ist abgeschaltet (sah gleich aus, kostete aber Leistung).
- Hintergrundlichter laufen in einem abgeschlossenen Bereich (`contain:strict`) auf eigener Ebene.

## Globus nicht mittig
Die Globus-Grafik (Bild, Ringe, Erde, Lichtsäule) ist intern auf **43 %** statt 50 % ausgerichtet – im alten Layout passte das, im neuen Panel stand er dadurch ca. 16 px zu weit links. Der Globus wird jetzt als Ganzes um 7 % verschoben; der gestrichelte Orbit-Ring wurde mitgezogen. Erde, Ringe und Lichtsäule liegen jetzt exakt auf der Panel-Mitte (gemessen bei 412 px Breite: 205,5 px vs. 206 px).

## Technisch
- `public/anim.css`: Randlicht neu (`rv-edge` animiert nur `background-position` eines 2-px-Streifens), `@property --rv-a` entfernt; `.cc-ambient` mit `contain:strict`.
- `public/home.css`: `translateX(7%)` für `.v15-globe-wrap`, Orbit-Korrektur, eigene Ebenen für Globus-Effekte.
- Service-Worker-Cache `rv-studio-v29-1`, Version 29.0.0.
