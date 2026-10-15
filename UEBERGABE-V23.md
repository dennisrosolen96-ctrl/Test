# V23 — Einstellungen als Kontrollzentrum

Die Einstellungen sind neu gedacht: nicht mehr vier lose Karten, sondern ein **Kontrollzentrum** im Design der Startseite.

## Aufbau

1. **Systemstatus** (oben, live): Cloud-Sync · KI-Bereitschaft · letztes Backup · belegter Speicher. Warnungen (z. B. „Jetzt sichern empfohlen“) in Orange.
2. **Acht Bereichs-Kacheln** wie auf der Startseite: Antippen springt zum Bereich, der sichtbare Bereich leuchtet orange.
3. Die Bereiche:

| Bereich | Einstellungen | Wirkt sich aus auf |
| --- | --- | --- |
| **Profil & Shop** | Vorname, Shopname, Abschlusstext, eigene Hashtags, KI-Beschreibungsvorlage | Begrüßung „Guten Morgen/Tag/Abend, Name!“, Texte „Ohne KI“ (Abschlusstext + Signatur), Instagram-Hashtags, KI-Texte |
| **Verkauf & Plattformen** | Aktive Plattformen, Preisrundung (Endung 5/9 · ,90 · ganze Euro), Gebühren & Puffer pro Plattform, eigene Versandkosten, Ladenhüter-Grenze | Studio blendet abgeschaltete Plattformen aus (Tabs, Preise, Veröffentlichen); Preisrechner; Versandkosten-Vorschlag beim Verkauf erfassen; Hinweis in der Bestands-Übersicht |
| **Studio & Titelbild** | Titelbild-Automatik, Standard-Hintergrund, Freisteller, Präfix der Artikelnummer, Status neuer Artikel | Studio und Auto-Nummer (z. B. DR-0001) |
| **KI & Server** | Anbieter, Server, RV-Passwort (nur Sitzung), **Verbindungstest** | Prüft: Server erreichbar, Passwort korrekt, ob ein Freisteller-Dienst (Photoroom/remove.bg) eingerichtet ist |
| **Cloud & Geräte** | Sync-Kennwort, verbinden, synchronisieren, trennen, Konflikte | unverändert, nur neu gestaltet |
| **Daten & Backup** | JSON-Backup, Import, **CSV-Tabelle** (Excel/Numbers/Steuer, deutsches Format), **Speicher schützen**, Backup-Erinnerung, Beispielartikel laden/entfernen, lokale Sicherheitskopie | Erinnerung erscheint beim Start, wenn das letzte Backup älter als eingestellt ist |
| **Darstellung** | Startansicht Bestand (Raster/Liste), alle Animations-Schalter | — |
| **Über die App** | Version, Artikel, Speicher, Modus; **App installieren** (wenn der Browser es anbietet), **Neueste Version laden** (leert den App-Cache) | — |

Alle neuen Einstellungen werden auf dem Gerät gespeichert (`rv_settings_v1`), nicht in der Cloud.

„Speicher schützen“ bittet den Browser, die App-Daten nicht bei Platzmangel zu löschen. Ob er zustimmt, entscheidet der Browser (bei installierter App meist ja).

## Geänderte Dateien

`public/index.html` (Einstellungen neu), `public/settings.css` (neu), `app.js`/`public/app.js` (Einstellungs-Logik und Verdrahtung), `public/dashboard.js` (Begrüßung), `public/demo.js` (Knopf an mehreren Stellen), `public/anim.js` (Animationskarte im Bereich Darstellung), `public/pages.css` (alte Gold-Regeln entfernt), `public/sw.js` (Cache `rv-studio-v23-1`).

## Tests

- `npm test`: alle Gruppen bestanden.
- Browser (Chromium) 390, 720, 1440 px ohne Fehler und ohne horizontalen Überlauf. Geprüft: Name → Begrüßung, Präfix → DR-0001, Rundung ,90 → 49,90 €, Instagram ausgeschaltet → im Studio ausgeblendet, CSV-Export mit allen 30 Artikeln, Verbindungstest mit simuliertem Server (Server, Passwort, Photoroom erkannt).
