# Injekto-log

Deutschsprachige, lokal speichernde Webapp für dokumentierte Injektionen und Gewicht. React + TypeScript + Vite + Tailwind CSS; installierbare PWA mit vite-plugin-pwa. Version 1.1.1.

## Start

Voraussetzungen: Node.js 22.12+ oder 24 LTS; pnpm 11.25.0 (siehe packageManager). Ein aktueller Browser mit localStorage, Intl-Zeitzonenunterstützung und nativen Dialogen. Für iOS wird Safari empfohlen.

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Alternativ mit npm: `npm install`, `npm run dev` (pnpm-Lockfile ist maßgeblich; npm löst Abhängigkeiten neu auf). Alle benötigten Laufzeitpakete werden lokal gebündelt. Die App nutzt Systemschriften und lokale Icons, keine externen Fonts oder CDNs.

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm preview
```

Der Produktionsbuild liegt in `dist/`. Diesen Ordner bei einem statischen HTTPS-Host bereitstellen; für SPA-Routen ist index.html die Rückfallseite. Die App nutzt Hash-Navigation. Lokale Entwicklung auf localhost ist möglich. Ein direktes Öffnen als file:// wird nicht unterstützt.

## Benutzung

1. Wirkstoff, Präparat, Startdatum und Startgewicht eintragen. Optional Ziel und ärztlich festgelegten Zeitplan ergänzen.
2. Tatsächlich erfolgte Injektionen und Wiegemomente getrennt dokumentieren.
3. Im Verlauf bearbeiten oder nach Bestätigung löschen.
4. Unter Einstellungen regelmäßig JSON-Backups sichern. CSV exportiert Gewichte und Injektionen getrennt.
5. Import prüft Struktur, IDs, Zeitpunkte, Wirkstoffe und Episodenbezug vollständig. Bei widersprüchlichen IDs muss die Version ausdrücklich gewählt werden. Beim Zusammenführen bleibt das bestehende Profil erhalten. Beim Ersetzen werden alle App-Daten ausgetauscht.
6. Ein geänderter Wirkstoff erzeugt eine neue Episode ab dem bestätigten Wechselzeitpunkt. Bereits vorhandene Injektionen dürfen nicht außerhalb ihrer ursprünglichen Episode landen. Historische Episoden lassen sich in der Übersicht separat auswählen.

Bei einem Präparatewechsel mit identischem Wirkstoff bleibt die Episode erhalten; historische Injektionen behalten ihren ursprünglichen Präparatenamen. Für eine neue Episode wird die alte Dosis nicht automatisch übernommen.

## So wird gerechnet

Für eine Dosis d zum Zeitpunkt ti und einen Zeitpunkt t gilt:

```
t < ti: Beitrag = 0
t >= ti: Beitrag = d * 0.5 ** ((t - ti in Stunden) / Halbwertszeit)
M(t) = Summe aller Beiträge derselben Episode
```

Es werden alle vergangenen Einträge der Episode berücksichtigt. Kein Abschneiden bei acht Halbwertszeiten. Absolute UTC-Zeitstempel verhindern Verzerrungen durch Sommer-/Winterzeit in der Elimination.

Der relative Wert berechnet sich aus `100 * M(t) / M(t_last direkt nach der letzten tatsächlichen Injektion)`. Im Nenner sind auch die modellierten Beiträge früherer Injektionen enthalten. Gleichzeitige Dosen zählen gemeinsam. Ohne vergangene Injektion wird kein Wert angezeigt.

Diese Rechnung modelliert eine sofortige Aufnahme mit anschließender exponentieller Elimination. Resorptionsverzögerung, Bioverfügbarkeit, Verteilungsvolumen und individuelle Clearance fehlen. Der Wert in mg ist **keine gemessene Blutkonzentration**, keine Wirkungsprognose und kein Sicherheitsmaß. Das Referenzmaximum ist kein physiologischer Konzentrationspeak.

Nach einer Halbwertszeit verbleiben 50 % des Beitrags einer einzelnen Dosis; nach fünf 3,125 %. Weitere Dosen verändern die Gesamtsumme. Daraus darf kein sicherer Zeitpunkt für Wechsel, Wiederbeginn oder eine Injektion abgeleitet werden.

Die optionale Vorschau nimmt zwei Wochen lang die letzte dokumentierte Dosis und den eingetragenen Zeitplan an. Sie ist standardmäßig aus und speichert keine realen Gaben. Bei ungeklärtem überfälligem Termin ist sie ausgesetzt.

### Zeitpläne

- Stundenmodus: letzte dokumentierte Injektion plus verstrichene Stunden.
- Kalendermodus: täglich oder wöchentlich zur festen Uhrzeit in der gespeicherten IANA-Zeitzone. Deshalb können bei Zeitumstellung 23/25 bzw. 167/169 Stunden zwischen Terminen liegen.
- Ein verstrichener Termin bleibt sichtbar; kein automatisches Nachholen oder Anlegen einer Injektion.
- Im Kalendermodus schließt ein tatsächlicher Eintrag den entsprechenden lokalen Kalendertag ab. Überspringen ist eine gesonderte bewusste Bestätigung und erzeugt keine Gabe.
- Wiederkehrende nicht existente Uhrzeiten werden vorwärts verschoben; doppelte Uhrzeiten verwenden das erste Auftreten. Mehrdeutige oder nicht existente manuelle Zeitpunkte werden zurückgewiesen (Temporal disambiguation reject).
- Tageszählung seit Start verwendet lokale Kalenderdaten, „seit letzter Injektion“ zählt dagegen tatsächlich verstrichene 24-Stunden-Einheiten.

## Neu in Version 1.1.0

- Neuer Name **Injekto-log** mit einem gerundeten Vial-/Tropfen-Symbol und aktualisierten App-Icons.
- Bekannte Wirkstoffe können mit einer eigenen Präparatebezeichnung kombiniert werden. Diese Bezeichnung ist eine persönliche Angabe und bestätigt keine Produktqualität oder Zulassung. Freie Präparate haben keine voreingestellten Dosis-Chips.
- Eigene Wirkstoffe sind als Freitext möglich. Ohne ausdrücklich hinterlegte positive Halbwertszeit bleibt die Modellrechnung ausgeschaltet. Auch ein Name, der einem bekannten Wirkstoff ähnelt, löst keine automatische Zuordnung aus.
- Eine eigene Halbwertszeit und Quellenangabe können optional hinterlegt werden; sie sind als ungeprüfte Nutzereingabe gekennzeichnet. Geänderte eigene Namen oder Modellparameter beginnen eine neue Episode, damit historische Berechnungen erhalten bleiben.
- Ein Zeitplan kann ausdrücklich als „Kein Zeitplan eingetragen“ geführt werden. Für eigene Wirkstoffe wird kein Standardintervall geraten.
- Der bestehende localStorage-Schlüssel und die App-Adresse bleiben erhalten. Vorhandene Daten der Version 1.0.0 werden unverändert weitergelesen. Neue JSON-Dateien tragen den Formatnamen Injekto-log; alte Exporte mit Formatnamen InjektionsTagebuch bleiben lesbar.

### Zusätzliche automatische Dateisicherung

Die bestätigten Einträge werden weiterhin automatisch im Browser gespeichert. Zusätzlich lässt sich unter Einstellungen eine Sicherungsdatei koppeln. Nach Änderungen aktualisiert die geöffnete App dieselbe Datei, sofern Schreibzugriff gewährt wurde.

Die File System Access API ist browserabhängig und benötigt einen sicheren Kontext. Vor allem Desktop-Chrome und -Edge unterstützen den Dateidialog. Auf nicht unterstützten Geräten zeigt die App die Einschränkung an und bietet weiterhin manuelle Exporte. Die Datei enthält unverschlüsselte Gesundheitsdaten; ihren Speicherort wählt die nutzende Person selbst.

Der Dateizugriff kann nach einem Browserneustart erneut freigegeben werden müssen. Das Dateihandle wird lokal in IndexedDB gespeichert. Automatische Schreibvorgänge fragen keine neue Berechtigung im Hintergrund an. Eine außerhalb der App geänderte oder beschädigte Sicherungsdatei wird nicht automatisch überschrieben. Die App hält die Sicherung an; eine ausdrücklich bestätigte Ersetzung oder der kontrollierte Import der Datei ist möglich. Trennen oder Factory Reset löscht die physische Sicherungsdatei nicht.

Eine zusätzliche Schaltfläche kann dauerhaften Browserspeicher anfragen. Ob dies gewährt wird, entscheidet der Browser. Dies schützt vor automatischer Bereinigung, nicht vor bewusstem Löschen von Browserdaten. Keine Cloud-Synchronisierung und keine automatische Übertragung zwischen Geräten.

Technische Referenzen: [Chrome File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access), [MDN showSaveFilePicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker), [MDN persist](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist).

## PWA und Offline

Manifest, Standalone-Modus, vier PNG-Icons, Service Worker und Offline-App-Shell sind enthalten. Der Produktionsbuild speichert HTML, CSS, JavaScript und Icons im Cache; keine CDN- oder PayPal-Ressourcen werden im Hintergrund geladen. Der Service Worker ist während `pnpm dev` aus. Für einen lokalen PWA-Test zuerst `pnpm build` und `pnpm preview` auf localhost verwenden.

Erst nach vollständigem ersten Laden und erfolgreicher Service-Worker-Aktivierung ist Offline-Nutzung verfügbar. Ein UI-Hinweis zeigt die Vorbereitung an. Updates werden angeboten und niemals während einer Eingabe automatisch erzwungen; beim expliziten Neuladen wird vor möglichem Verlust von Formulareingaben gewarnt.

Installation abhängig vom Browser: Chrome/Edge können einen Installationsbutton anbieten; auf iOS „Teilen → Zum Home-Bildschirm“. Eine private vorgeschaltete Hosting-Anmeldung kann Installation oder kalten Offline-Neustart einschränken. Diese Hosting-Zugriffskontrolle gehört nicht zur Tagebuch-Datenhaltung.

## Datenschutz und Datensicherung

- Einträge stehen ausschließlich im Browser unter `injections-diary:v1`. Keine serverseitige Protokolldatenbank, keine Benutzerkonten innerhalb der App, keine Telemetrie, keine Cloud-Synchronisierung.
- localStorage ist nicht zusätzlich verschlüsselt. Andere Personen mit Zugriff auf den Browser können die Einträge sehen. Geräte und Browserprofile sind getrennte Datenbestände.
- Die Auslieferung der App-Dateien erfolgt über den jeweiligen Host; dessen technische Zugriffsverarbeitung ist von der lokalen Tagebuchfunktion zu unterscheiden.
- Speicherfehler werden angezeigt; es wird kein erfolgreicher Speichervorgang vorgetäuscht. Änderungen in anderen Tabs blockieren stilles Überschreiben und verlangen das Laden des aktuellen Stands.
- Beschädigte gespeicherte Daten werden nicht überschrieben. Rohdatenexport und ausdrücklich bestätigtes Zurücksetzen stehen zur Verfügung.
- JSON-/CSV-Exporte enthalten Gesundheitsdaten. Geschützt sichern. CSV-Freitext wird gegen Tabellenformel-Injektion abgesichert.
- Kalenderexport enthält standardmäßig keinen Wirkstoff und keine Dosis. Diese Angaben sind separat wählbar. Der Kalenderanbieter kann exportierte Informationen speichern.
- Factory Reset entfernt nur den eigenen App-Schlüssel. Bereits exportierte Dateien und Kalendertermine bleiben bestehen.

## Quellen und fachlicher Prüfstand

Prüfung der nachstehenden Konstanten am **06.11.2026** anhand offizieller Quellen; Näherungswerte. Quellen im Code: `src/data/substances.ts`. Keine medizinischen Dosierungsempfehlungen.

| Wirkstoff       | Halbwertszeit | Quelle / Abschnitt                                                                                                                                                                                                                                                                      |
| --------------- | ------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tirzepatid      |     ca. 120 h | [EMA Mounjaro](https://www.ema.europa.eu/en/documents/product-information/mounjaro-epar-product-information_en.pdf), 1, 4.2, 5.2                                                                                                                                                        |
| Semaglutid s.c. |     ca. 168 h | [EMA Wegovy](https://www.ema.europa.eu/en/documents/product-information/wegovy-epar-product-information_en.pdf) und [EMA Ozempic](https://www.ema.europa.eu/en/documents/product-information/ozempic-epar-product-information_en.pdf), 1, 4.2, 5.2; ausschließlich Injektionsabschnitte |
| Liraglutid      |      ca. 13 h | [EMA Saxenda](https://www.ema.europa.eu/en/documents/product-information/saxenda-epar-product-information_en.pdf), 4.2 Tabelle 3 und 5.2                                                                                                                                                |
| Dulaglutid      |     ca. 120 h | [EMA Trulicity](https://www.ema.europa.eu/en/documents/product-information/trulicity-epar-product-information_en.pdf), 1, 4.2 und 5.2; dort ca. 5 Tage                                                                                                                                  |
| Retatrutid      |     ca. 144 h | [Lilly TRANSCEND-T2D-1, EASD 2026](https://www.lilly.com/hcp/congresses/easd-2026/retatrutide-transcend-t2d-1), „Retatrutide: Novel Triple Receptor Agonist“                                                                                                                            |

Retatrutid: Prüfstatus weiterhin in klinischer Prüfung, nicht zugelassen; [Lilly-FAQ](https://www.lilly.com/news/stories/what-to-know-about-retatrutide), Stand Oktober 2026, Fragen 1–3. Die Option ist zunächst ausgeblendet und ausschließlich für tatsächlich erhaltene Studiengaben vorgesehen; keine Dosis-Chips.

Zusätzlich Zepbound, USA: [Lilly Prescribing Information](https://pi.lilly.com/us/zepbound-uspi.pdf), Stand August 2026, Abschnitte 3 und 12.3. Handelsnamen implizieren keine gleiche Indikation, Zulassung oder regionale Verfügbarkeit.

Die Einordnung anhand medizinprodukterechtlicher Vorgaben ist anhand der tatsächlichen Zweckbestimmung und Funktionen vor einer öffentlichen Veröffentlichung gesondert zu prüfen. Ein Disclaimer begründet keine gesicherte Einstufung.

## Architektur

```
src/
  App.tsx, main.tsx, styles.css
  components/   Dialog, Fields, ProgressChart, PwaStatus
  features/     Onboarding, Dashboard, History, EntryForm, Settings, ImportDialog, About
  config/       appInfo.ts (Projektangaben / PayPal)
  data/         substances.ts (Quellen / Konstanten)
  types/        index.ts (versioniertes Datenmodell)
  store/        useDiary.ts (Speicherung / Mehrtab-Erkennung)
  utils/        model, schedule, time, importExport, calendar, id
tests/core.test.ts
public/         lokale SVG-/PNG-Icons
scripts/generate_icons.py
docs/PROJEKTBRIEF.md
```

Icons reproduzieren: `python3 -m pip install Pillow` und `python3 scripts/generate_icons.py`. Die benötigten Icons liegen bereits bei.

## Freiwillige Unterstützung

Ein lokal gestalteter Link öffnet ausschließlich nach Antippen die feste PayPal-Spendenadresse mit ID `2DCUQFHPSFQT6`. Keine externen Button-Grafiken, Zählpixel, SDKs, Vorabverbindungen oder Gesundheitsdaten in der URL. Neues Browserfenster ohne Referrer. Keine Zahlungsverarbeitung innerhalb der App und keine Funktion an eine Spende gebunden.

## Entwickler- und Projektangaben

- Konzept und Projektverantwortung: **Carsten Schütte**
- Technische Umsetzung: Mit Unterstützung von OpenAI Codex entwickelt
- Version: aus package.json
- Build-Zeitpunkt: automatisch beim Build eingebettet
- Quellenprüfung: 06.11.2026
- Kontakt: nicht hinterlegt; wird nicht erfunden oder angezeigt

Diese Angaben stehen zentral in `src/config/appInfo.ts`. Keine behauptete Verbindung zu einer Klinik oder einem Arzneimittelhersteller. Diese Projektangaben sind kein vollständiges rechtliches Impressum.
