# Prüfbericht – Version 1.0.0

Stand: 06.11.2026. Diese Datei beschreibt tatsächlich ausgeführte Prüfungen; sie ersetzt keine klinische oder regulatorische Bewertung.

## Automatisiert ausgeführt

- **26 Tests bestanden**, Vitest 3.2.7 (`pnpm test`).
- TypeScript-Prüfung erfolgreich (`pnpm typecheck` bzw. als Teil des Builds).
- Produktionsbuild erfolgreich (`pnpm build`).
- PWA-Manifest: Deutsch, Standalone-Modus und lokale Icons geprüft.
- Service Worker und precache-Dateien im Produktionsbuild vorhanden.
- PNG-Abmessungen: 192, 512, 512 maskable und 180 Pixel geprüft.

Die Tests decken Halbwertszeiten, Akkumulation, zukünftige Gaben, gleichzeitige Dosen, relative Referenzwerte, Tageszählung, Sommer- und Winterzeit, mehrdeutige Uhrzeiten, verstrichene und übersprungene Termine, virtuelle Vorschaugaben, Zahlenvalidierung, JSON-Roundtrip, Struktur-/Versionsfehler, Episodenzuordnung, Duplikate, Importkonflikte, CSV-Escaping/Formelabsicherung und ICS-Struktur ab.

## Im Browser ausgeführt

In einer separaten lokalen Entwicklungs-Vorschau mit synthetischen Testdaten:

- Onboarding mit Startgewicht angelegt; dabei keine automatische Injektion.
- Injektion mit Dosis, Stelle und Testnotiz gespeichert.
- Modellwert, Termin sieben Tage später und Halbwertszeit-Informationen erschienen.
- Gewicht getrennt gespeichert; aktuelles Gewicht und Differenz wurden sofort aktualisiert.
- Seite neu geladen; beide Einträge blieben vorhanden.
- Verlauf geöffnet und eine Injektionsnotiz nachträglich bearbeitet; geänderter Inhalt sichtbar.
- Desktop-Ansicht visuell kontrolliert; keine App-eigenen Laufzeitfehler nach Korrektur des UUID-Fallbacks beobachtet.

Die synthetischen Testeinträge werden nicht in den Quellcode oder die ausgelieferte App übernommen. Jede neue Browser-Origin startet ohne Profil.

## Noch auf dem Zielgerät zu prüfen

- Tatsächliche Installation auf Android/iOS und kalter Offline-Neustart nach vollständigem Erstladen.
- Update-Verhalten bei einem späteren echten Versionswechsel.
- Bedienung auf realen kleinen Geräten, Screenreader und Textvergrößerung.
- Übernahme der ICS-Datei in die konkret verwendete Kalender-App.
- Browser-Speicherbeschränkungen im privaten Modus und Verhalten hinter vorgeschalteter privater Hosting-Anmeldung.

Die lokale Vorschau verwendet HTTP auf einer Vorschau-Domain. Dort ist Service-Worker-Registrierung browserseitig eingeschränkt. Das Vorhandensein der Build-Dateien ist geprüft; ein Offline-Neustart wurde in dieser Umgebung nicht als erfolgreich behauptet.

## Bekannte Grenzen

- Gewichts- und Dosisangaben sind manuell dokumentiert; keine Verifikation tatsächlicher Verabreichung.
- Die Modellrechnung ignoriert Resorption, Bioverfügbarkeit, Verteilung und individuelle Clearance. Keine Blutkonzentrations- oder Wirkungsprognose.
- Daten sind geräte-/browsergebunden und nicht zusätzlich verschlüsselt. Regelmäßige JSON-Backups sind erforderlich.
- Gleichzeitiges Bearbeiten in mehreren Tabs wird über Versionsprüfung und storage-Ereignisse abgefangen; bitte bei einer Änderungsmeldung den aktuellen Stand laden.
- Keine Therapievorschläge, automatische Titration oder Bewertung von Nebenwirkungen.

# Ergänzung – Version 1.1.0

- Insgesamt **39 automatisierte Tests bestanden**: 26 bestehende und 13 neue Tests für freie Bezeichnungen, Kompatibilität älterer Backups und Dateisicherung.
- Im Browser mit synthetischen Daten geprüft: bekannte Tirzepatid-Episode auf freie Präparatebezeichnung PetersPeptide geändert; Wirkstoffmodell blieb erhalten.
- Freien Wirkstoff ohne Halbwertszeit angelegt; keine Dosis vorausgefüllt, keine Restmenge oder Termine geraten. Tatsächlichen Testeintrag gespeichert und nach Reload wiedergefunden.
- Logo- und PNG-Größen durch reproduzierbare Erzeugung kontrolliert. Name und Version im Browser korrekt.
- Dateisicherung: Schreibablauf, Fremdänderungserkennung, kaputte Dateien, fehlende Berechtigungen und Schreibfehler automatisiert mit Dateihandle-Testobjekten geprüft.
- Der native Dateidialog, die dauerhafte Speicherung eines Dateihandles und die Freigabe nach Browserneustart müssen auf einem unterstützten realen HTTPS-Browser geprüft werden. In der lokalen HTTP-Vorschau ist die Dateiverknüpfung korrekt als nicht verfügbar gekennzeichnet.
- Dauerhafte Speicherfreigabe wurde nicht ungefragt angefordert.
