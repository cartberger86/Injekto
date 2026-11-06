Baue eine vollständig deutschsprachige, mobile-first Single-Page-Webapp zum persönlichen Dokumentieren von verordneten Injektionen und Körpergewicht. Implementiere die App vollständig und lauffähig; liefere keine bloßen Mockups oder Platzhalterfunktionen.

## 1. Technik und Betrieb

- React, TypeScript im Strict-Modus, Vite und Tailwind CSS.
- Installierbare Progressive Web App mit vite-plugin-pwa.
- Ausschließlich lokale Datenspeicherung in localStorage; kein erforderliches Backend, keine Accounts, keine Cloud-Synchronisierung, keine Werbung und keine Analyse- oder Trackingdienste.
- Alle für die App erforderlichen Schriften, Icons und Bibliotheken lokal bündeln; keine CDN-Abhängigkeiten zur Laufzeit.
- Verwende aktuelle, miteinander kompatible Paketversionen. Konfiguriere Tailwind passend zur tatsächlich verwendeten Hauptversion.
- Manifest mit deutschem Namen und Kurznamen, lang de-DE, start_url, scope, display standalone, theme_color und background_color.
- Liefere echte PNG-App-Icons mit 192 × 192 und 512 × 512 Pixeln sowie ein geeignetes Maskable-Icon und Apple-Touch-Icon.
- Service Worker für Offline-Nutzung nach dem ersten erfolgreichen Laden. Alle wesentlichen Funktionen einschließlich Erfassung, Berechnung und Export funktionieren offline.
- Updates über registerType prompt anbieten. Kein automatisches Neuladen während ungespeicherter Eingaben.
- Installationshinweis nur zeigen, wenn passend; für iOS einen kurzen Hinweis auf „Zum Home-Bildschirm“ anbieten.
- README: HTTPS für den Produktivbetrieb und localhost für die lokale Entwicklung erklären. Keine garantierte Installation auf jedem Browser behaupten.

## 2. Zweck, Sprache und Grenzen

Die App ist ein persönliches Tagebuch für dokumentierte Injektionen und Gewicht. Zusätzlich visualisiert sie ein ausdrücklich vereinfachtes mathematisches Abbaumodell.

Keine Dosierungsempfehlungen, keine automatische Titration, keine Therapieentscheidung, keine Diagnose, keine Nebenwirkungs-Triage und keine Anleitung zur Beschaffung oder Zubereitung nicht zugelassener Präparate.

Verwende diese Begriffe:

- „Injektion dokumentieren“ statt „Heute spritzen“.
- „Modellierte Restmenge (mg)“ statt „Blutspiegel“ oder „tatsächlicher Wirkstoffspiegel“.
- „Relativer Modellverlauf (%)“ statt „verbleibende Wirkung“.
- „Nächster Termin laut eingetragenem Intervall“ statt „Nächste empfohlene Gabe“.

Behaupte keine gesicherte regulatorische Einstufung als „kein Medizinprodukt“. Beschreibe stattdessen die begrenzte Funktion und Zweckbestimmung. Erwähne in der README, dass vor einer öffentlichen Veröffentlichung die konkrete regulatorische Einordnung anhand der tatsächlichen Funktionen und Zweckbestimmung zu prüfen ist.

Pflichttext auf jeder Hauptansicht sichtbar:
„Nur ein persönliches Protokoll. Spritzintervall, Dosis und Änderungen legt ausschließlich die verschreibende Ärztin oder der Arzt fest. Die Halbwertszeit beschreibt, wann etwa die Hälfte des Wirkstoffs abgebaut ist — sie ist nicht der nächste Spritztermin. Bei Übelkeit, starken Nebenwirkungen oder Unsicherheit ärztlich abklären.“

Platziere den vollständigen Hinweis direkt unter dem Kopfbereich und vor den Dashboard-Karten. Nicht einklappen und nicht mit einer festen Überlagerung über Bedienelemente legen. Bei kleinen Displays oder vergrößerter Schrift muss die Seite regulär scrollbar bleiben; niemals Schrift verkleinern, um alles in eine Bildschirmhöhe zu pressen.

Beim Modell zusätzlich:
„Vereinfachte Modellrechnung. Keine Messung des Blutspiegels und keine Aussage über Wirkung, Sicherheit oder den richtigen Injektionszeitpunkt.“

## 3. Wirkstoffe und Präparate

Hinterlege Wirkstoffdaten zentral als typisierte Konstanten. Standardauswahl: Tirzepatid / Mounjaro.

Trenne Wirkstoff, Präparat und Dokumentationswerte. Dosis-Chips sind Eingabehilfen für bereits verordnete und tatsächlich dokumentierte Gaben, keine Vorschläge für die nächste Dosis.

Initiale Datengrundlage:

- Tirzepatid: Halbwertszeit etwa 120 Stunden, Standardintervall 7 Tage. Präparatebezeichnungen Mounjaro und Zepbound mit regionaler Kennzeichnung. Dokumentationswerte 2,5 / 5 / 7,5 / 10 / 12,5 / 15 mg.
- Semaglutid, ausschließlich subkutane Injektionen: Halbwertszeit etwa 168 Stunden, Standardintervall 7 Tage.
  - Wegovy: Dokumentationswerte 0,25 / 0,5 / 1 / 1,7 / 2,4 / 7,2 mg.
  - Ozempic: Dokumentationswerte 0,25 / 0,5 / 1 / 2 mg.
- Liraglutid / Saxenda: Halbwertszeit etwa 13 Stunden, Standardintervall 1 Tag. Dokumentationswerte 0,6 / 1,2 / 1,8 / 2,4 / 3 mg.
- Dulaglutid / Trulicity: Halbwertszeit etwa 120 Stunden, Standardintervall 7 Tage. Dokumentationswerte 0,75 / 1,5 / 3 / 4,5 mg.
- Retatrutid: gesonderte, standardmäßig ausgeblendete Studienoption. Kennzeichnung „In klinischer Prüfung; nicht zugelassen“, soweit dies dem beim Implementieren geprüften Quellenstand entspricht. Näherungsweise Halbwertszeit 144 Stunden; 7 Tage ausschließlich als beschriebenes Studienintervall. Keine vorkonfigurierten „üblichen Dosierungsstufen“, keine Dosissteigerungslogik und keine Rezept- oder Beschaffungshinweise. Freie Eingabe zur Dokumentation einer tatsächlich im Studienkontext erhaltenen Gabe.

Für alle Wirkstoffe ist zusätzlich eine freie positive mg-Eingabe möglich. Keine Umrechnung in ml, Spritzeneinheiten, Pen-Klicks oder Mischungsverhältnisse.

Überprüfe die Angaben beim Implementieren anhand aktueller offizieller Fachinformationen bzw. Primärquellen. Dokumentiere URL, Abschnitt, Quellenstand, tatsächliches Prüfdatum und Näherungscharakter im Code und in „Quellen und Modellgrenzen“. Erfinde keine Quellenprüfung. Wenn eine Prüfung nicht möglich ist, kennzeichne die Angaben als ungeprüft.

Ausgangsquellen:

- https://www.ema.europa.eu/en/medicines/human/EPAR/mounjaro
- https://www.ema.europa.eu/en/medicines/human/EPAR/wegovy
- https://www.ema.europa.eu/en/medicines/human/EPAR/ozempic
- https://www.ema.europa.eu/en/medicines/human/EPAR/saxenda
- https://www.ema.europa.eu/en/medicines/human/EPAR/trulicity
- https://www.lilly.com/news/stories/what-to-know-about-retatrutide

Handelsnamen bedeuten keine gleiche Zulassung, Indikation oder Verfügbarkeit. Keine Tabletten mit Injektionen vermischen.

## 4. Datenmodell

Gewicht und Injektionen sind unabhängig. Verwende ein versioniertes Schema mit stabilen IDs und klaren TypeScript-Typen.

Profil:

- Startdatum als lokales Kalenderdatum im Format YYYY-MM-DD.
- Startgewicht in kg.
- Optional Zielgewicht.
- Bevorzugte Injektionsuhrzeit.
- IANA-Zeitzone, initial aus dem Gerät übernommen.
- Aktive Behandlungsepisode.
- Darstellungs- und Anzeigeeinstellungen.

Behandlungsepisode:

- id, substanceId, productId.
- Beginn als absoluter Zeitpunkt, optional Ende.
- Individuell eingetragener Zeitplan.
- Erstellungs- und Änderungszeitpunkt.

Gewichtseintrag:

- id, Zeitpunkt, Gewicht in kg.
- Erstellungs- und Änderungszeitpunkt.

Injektion:

- id, treatmentEpisodeId, substanceId, productId.
- Zeitpunkt, Dosis in mg.
- Optional Injektionsstelle, Notiz und Nebenwirkungen als Freitext.
- Erstellungs- und Änderungszeitpunkt.

Zeitpunkte als UTC-ISO-Strings oder Unix-Millisekunden speichern. Lokale Datum-/Uhrzeit-Eingaben mit klar definierter Zeitzone umwandeln. Mehrdeutige bzw. nicht existierende Uhrzeiten bei Zeitumstellungen ausdrücklich behandeln.

Wirkstoff- oder Episodenwechsel:

- Bestehende Einträge behalten ihre ursprüngliche Zuordnung.
- Historische Einträge niemals mit der Halbwertszeit des neu gewählten Wirkstoffs umrechnen.
- Hinweis: „Restmengen verschiedener Wirkstoffe sind nicht direkt vergleichbar. Ein Wechsel setzt vorhandene Wirkstoffe im Körper nicht auf null.“
- Das aktive Modell umfasst ausschließlich die ausgewählte Episode. Historische Episoden bleiben separat einsehbar.
- Kein Summieren verschiedener Wirkstoffe und keine Äquivalenzumrechnung.
- Beim bloßen Wechsel zwischen Präparaten desselben Wirkstoffs keine künstliche Auswaschung oder automatische Rücksetzung der bestehenden Episode erzeugen.
- Vor Abschluss des Wechsels eine überprüfbare Zusammenfassung anzeigen.

## 5. Erfassung und Verlauf

Onboarding:

- Wirkstoff und Präparat, Startdatum, Startgewicht.
- Optional Zielgewicht, bevorzugte Uhrzeit und eingetragenes Intervall.
- Noch keine Injektion automatisch erzeugen.
- Ohne dokumentierte Injektion keinen bisherigen Wirkstoffbestand unterstellen.

„Injektion dokumentieren“:

- Datum/Uhrzeit standardmäßig jetzt.
- Letzte Dosis derselben Episode vorausfüllen; beim ersten Eintrag keine Dosis automatisch auswählen.
- Dosis-Chips und freie mg-Eingabe.
- Optionale Stelle, Notiz und Nebenwirkungen.
- Zuletzt dokumentierte Injektionsstelle mit Datum informativ anzeigen.
- Nur tatsächlich erfolgte Gaben speichern. Zukünftige Termine gehören in den Zeitplan.
- Mehrfaches Antippen darf keine doppelten Einträge erzeugen.

„Gewicht eintragen“:

- Separater Button und separates Formular.
- Datum/Uhrzeit sowie Gewicht.
- Auch ohne Injektion möglich.

Verlauf:

- Neueste Einträge zuerst.
- Gewicht und Injektionen klar unterscheiden und filterbar machen.
- Beide Eintragstypen bearbeiten und löschen.
- Änderungen über ein ausdrückliches „Änderungen speichern“ bestätigen; Löschen mit Sicherheitsabfrage.
- Änderungen wirken sofort auf Dashboard, Verlauf und Diagramme.
- Formulare bei Fehlern nicht leeren.

Validierung:

- Nur endliche positive Zahlen für Gewicht, Dosis, Halbwertszeit-Konstanten und Intervalle.
- Deutsches Dezimalkomma und Dezimalpunkt zuverlässig unterstützen.
- Ungültige oder zukünftige Zeitpunkte für tatsächlich erfolgte Einträge ablehnen.
- Keine medizinischen Grenzwerte oder Titrationsregeln erfinden.
- Notizen ausschließlich als Text rendern, niemals als HTML.

## 6. Mathematisches Modell

Implementiere die Rechnung in reinen, unabhängig testbaren Funktionen.

Für eine dokumentierte Dosis d zum Zeitpunkt ti und einen Auswertungszeitpunkt t:

Wenn t < ti:
Beitrag_i(t) = 0

Sonst:
Beitrag_i(t) = d × 0,5 ^ ((t − ti in Stunden) / Halbwertszeit_in_Stunden)

Modellierte Restmenge M(t):
Summe aller zum Auswertungszeitpunkt bereits erfolgten Injektionen derselben Episode.

Für die erwartbar kleinen lokalen Datensätze alle relevanten Episodeneinträge berücksichtigen. Nicht pauschal nach acht Halbwertszeiten abschneiden und dadurch sichtbare Sprünge erzeugen.

Modellannahmen offen erklären:

- Exponentielle Elimination mit konstanter Halbwertszeit.
- Sofortige Aufnahme der gesamten dokumentierten Dosis als Vereinfachung.
- Keine Abbildung von Resorptionsverzögerung, Bioverfügbarkeit, Verteilungsvolumen oder individuellen Unterschieden.
- Keine gemessene Konzentration und keine Wirkungs- oder Sicherheitsprognose.
- Zeitliche Gleichzeitigkeit von Gewicht und Modellwert beweist keinen Zusammenhang.

Relativer Modellverlauf:

- Sei t_last der Zeitpunkt der letzten tatsächlich dokumentierten Injektion bis zum Auswertungszeitpunkt.
- Referenzwert ist M(t_last unmittelbar nach dieser Injektion), einschließlich modellierter Beiträge früherer Injektionen derselben Episode.
- Prozentwert = 100 × M(t) / Referenzwert.
- Beschriftung: „Bezogen auf den Modellwert direkt nach der letzten dokumentierten Injektion“.
- Keine Daten oder Referenzwert null: „Noch keine Berechnung möglich“.
- Gleichzeitige Injektionen gemeinsam berücksichtigen.
- Diesen Referenzpunkt nicht als physiologischen Konzentrationspeak bezeichnen.

Zusätzliche Informationen:

- „Seit letzter dokumentierter Injektion: X Tage Y Stunden“; hierfür verstrichene 24-Stunden-Einheiten nutzen.
- Zeitpunkt eine Halbwertszeit nach der letzten Injektion: „Im Modell verbleiben etwa 50 % des Beitrags dieser einzelnen Dosis.“
- Zeitpunkt fünf Halbwertszeiten danach: „Im Modell verbleiben etwa 3,125 % des Beitrags dieser einzelnen Dosis.“
- Bei beiden Angaben erklären: Frühere und spätere Injektionen beeinflussen die Gesamtsumme.
- Keine Aussage „vollständig abgebaut“, „sicherer Wechsel“ oder „jetzt wieder spritzen“ daraus ableiten.

## 7. Zeitplan und Termine

Intervall und Halbwertszeit strikt trennen.

Unterstütze zwei ausdrücklich unterscheidbare Zeitplanmodi:

1. Abstand seit letzter dokumentierter Injektion: positive Stundenanzahl; die Startvorgabe entspricht 24 bzw. 168 Stunden.
2. Feste lokale Kalenderzeit: täglich zur eingetragenen Uhrzeit bzw. wöchentlich am eingetragenen Wochentag zur Uhrzeit, mit gespeicherter IANA-Zeitzone.

Im Kalendermodus bleibt die lokale Uhrzeit bei Sommer-/Winterzeitwechsel erhalten. Im Stundenmodus bleibt die verstrichene Dauer konstant. Die Modi niemals stillschweigend vermischen.

Der Nutzer trägt seinen verordneten Zeitplan ein. Änderungen am Zeitplan verändern keine historischen Injektionen.

- Ohne bisherige Injektion im Abstandsmodus: noch keinen Termin berechnen.
- Vor Erreichen: Countdown bis zum eingetragenen Termin.
- Bei Erreichen: „Intervall erreicht — nur spritzen, wenn das so verordnet ist.“
- Einen verstrichenen, nicht dokumentierten Termin als solchen sichtbar halten. Nicht automatisch zum nächsten zukünftigen Termin springen oder eine Gabe annehmen.
- Im Kalendermodus einen bewusst gewählten Startanker und nachvollziehbare Bestätigung eines übersprungenen Termins vorsehen. Überspringen erzeugt keine Injektion.
- Keine Nachhol-, Verdopplungs- oder Auslassregeln ausgeben.

Kalenderexport:

- Button „In Kalender eintragen“ für den angezeigten Termin.
- Standardkonforme .ics-Datei mit UID, DTSTAMP, DTSTART, passender Zeitzonenbehandlung, CRLF und korrekter Text-Escapierung.
- Ein einzelner Termin; keine automatische Wiederholungsserie und kein Alarm als Standard.
- Neutraler Titel „Persönlicher Protokolltermin“. Wirkstoff oder Dosis nur nach ausdrücklicher Auswahl in den Export aufnehmen.
- Kurz erklären, dass ein Kalenderimport keine verabreichte Injektion dokumentiert und beim verwendeten Kalenderanbieter gespeichert werden kann.

## 8. Dashboard und Diagramme

Dashboard-Karten:

- Startgewicht.
- Aktuelles Gewicht: jüngster Gewichtseintrag, ersatzweise Startgewicht mit entsprechender Kennzeichnung.
- Differenz zum Startgewicht: aktuelles Gewicht minus Startgewicht, in kg und Prozent.
- Tage seit Start als Differenz lokaler Kalenderdaten.
- Letzte dokumentierte Dosis mit Datum.
- Modellierte Restmenge in mg.
- Relativer Modellverlauf in Prozent.
- Nächster bzw. verstrichener Termin laut eingetragenem Zeitplan.

Diagramm:

- Gemeinsame Zeitachse für Gewicht und Modell.
- Zwei klar beschriftete Y-Achsen: kg und modellierte mg.
- Unterschiedliche Farben und Linienarten; Bedeutung nicht nur über Farbe vermitteln.
- Startgewicht als Referenzlinie.
- Historie standardmäßig letzte zwölf Wochen; optional anderer Zeitraum.
- Injektionen mit Markierungen und verständlichen Detailanzeigen.
- Gewichts-Messpunkte sichtbar machen. Verbundene Linien nicht als zusätzliche Messungen darstellen.
- Bei Episodenwechsel keine ununterbrochene Wirkstoffkurve über die Grenze ziehen.
- Bei Liraglutid zeitlich ausreichend fein auflösen; nicht nur einen Wert pro Tag berechnen.
- Textuelle Zusammenfassung bzw. Datentabelle als zugängliche Alternative.

Optionale Modellvorschau:

- Standardmäßig ausgeschaltet; ausdrücklich aktivierbar.
- Bis zwei Wochen ab jetzt bei unverändertem eingetragenem Zeitplan und letzter dokumentierter Dosis.
- Zukunft gestrichelt und zusätzlich als „Annahme, keine Empfehlung“ kennzeichnen.
- Keine Vorschau ohne dokumentierte Dosis und gültigen Zeitplan.
- Bei verstrichenem unbestätigtem Termin pausieren, bis der Nutzer seine Planung geklärt hat.
- Nie angenommene Gaben als reale Injektionen speichern.
- Historie und Vorschau visuell klar trennen.

Zusätzlich eine kompakte Tabelle der letzten Injektionen.

## 9. Speicherung, Import, Export und Löschen

- Versionierter localStorage-Key, beispielsweise injections-diary:v1.
- Zusätzlich schemaVersion im gespeicherten Objekt.
- Daten beim Laden validieren; beschädigte oder unbekannte Versionen nicht stillschweigend überschreiben.
- Speicherung nach bestätigten Änderungen. Speicherfehler verständlich anzeigen; bei Fehlschlag nicht „gespeichert“ melden.
- Nach Reload bleiben Daten erhalten.
- Gleichzeitig geöffnete Tabs berücksichtigen: Änderungen über storage-Ereignisse erkennen und veraltete Ansichten nicht still überschreiben.

JSON:

- Vollständiger Export einschließlich Profil, Episoden, Einstellungen, Einträgen, schemaVersion und Exportzeitpunkt.
- Vollständige Struktur vor dem Import prüfen, beispielsweise mit Zod.
- Importvorschau mit Anzahl der Einträge.
- „Zusammenführen“ oder „Ersetzen“ ausdrücklich wählen lassen.
- Beim Zusammenführen nach IDs deduplizieren und Konflikte sichtbar behandeln.
- Erst nach erfolgreicher Gesamtvalidierung und Bestätigung schreiben.
- Fehler dürfen vorhandene Daten nicht verändern.
- Vor ersetzendem Import ein Backup anbieten.

CSV:

- Getrennte Exporte für Gewichte und Injektionen.
- UTF-8 mit BOM, konsistentes deutsches Zahlenformat und Semikolon als Trennzeichen.
- Werte korrekt quoten; Freitext gegen Tabellenformel-Injektion absichern.
- Zeitstempel einschließlich eindeutiger Zeitzoneninformation exportieren.
- CSV-Import ist nicht erforderlich.

Datenschutztext:

- „Die App überträgt deine Protokolle nicht an einen App-Server.“
- Browserdaten können gelöscht werden oder verloren gehen.
- localStorage bietet keine eigene Verschlüsselung oder Zugriffssperre.
- JSON-/CSV-Dateien können sensible Gesundheitsdaten enthalten; regelmäßig und geschützt sichern.
- Kalenderexport übergibt ausgewählte Daten an die verwendete Kalender-App.

Factory Reset:

- Button „Alle Protokolldaten aus diesem Browser löschen“.
- Explizite Bestätigung und vorheriges Exportangebot.
- Nur eigene App-Daten entfernen; keine Daten anderer Anwendungen derselben Domain löschen.
- Bereits exportierte Dateien und Kalendertermine bleiben bestehen; dies im Bestätigungsdialog erklären.
- Anschließend Onboarding anzeigen.

## 10. Gestaltung und Barrierefreiheit

- Ruhiges dunkles UI mit gut lesbarer Typografie und wenigen klaren Akzentfarben.
- Keine Alarmfarben, Belohnungssysteme oder Formulierungen, die zu einer Injektion drängen.
- Mobile-first, funktional ab etwa 320 CSS-Pixeln; kein horizontaler Seiten-Scroll.
- Touch-Ziele mindestens 44 × 44 CSS-Pixel.
- Deutsche Beschriftungen, de-DE-Datums- und Zahlenformate.
- Sichtbare Labels, verständliche Fehlermeldungen und korrekte Verknüpfung mit Eingabefeldern.
- Vollständige Tastaturbedienung, sichtbarer Fokus, ausreichender Kontrast.
- Dialoge mit Fokusmanagement, Fokus-Rückgabe und Escape-Unterstützung.
- Statusmeldungen zurückhaltend über geeignete Live-Regionen ausgeben.
- Textvergrößerung und reduzierte Bewegung respektieren.
- Leere Zustände mit kurzen Anleitungen; Demo-Daten niemals als persönliche Daten einfügen.
- Navigation: Dashboard, Verlauf, Einstellungen, Über diese App.

## 11. Prüfung und Akzeptanz

Erfülle und überprüfe mindestens:

- Neue Injektionen und Gewichte erscheinen sofort im Verlauf und Diagramm.
- Nach Bearbeiten oder Löschen werden alle abhängigen Werte neu berechnet.
- Reload stellt den gespeicherten Zustand wieder her.
- Ein Wirkstoffwechsel verändert keine historischen Wirkstoffzuordnungen.
- Semaglutid verwendet etwa 168 Stunden und Liraglutid etwa 13 Stunden Halbwertszeit.
- Zeitplan und Halbwertszeit werden unabhängig verwendet.
- Eine einzelne Modelldosis fällt nach einer Halbwertszeit auf 50 % und nach fünf auf 3,125 %.
- Mehrere Injektionen werden korrekt addiert; zukünftige Injektionen tragen vor ihrem Zeitpunkt null bei.
- Ohne Injektionen erscheinen keine erfundenen Restmengen, Dosierungen oder Termine.
- Sommer-/Winterzeit wird in beiden Terminmodi korrekt behandelt.
- Vorschauen erzeugen keine tatsächlichen Protokolleinträge.
- JSON-Export und anschließender Import erhalten alle relevanten Daten.
- Fehlerhafte Importe verändern keine vorhandenen Daten.
- Export von Sonderzeichen und deutschen Dezimalwerten funktioniert.
- Offline-Neustart nach erstem vollständigen Laden funktioniert.
- PWA-Update verwirft keine ungespeicherten Eingaben.
- Factory Reset entfernt die eigenen Protokolldaten und startet das Onboarding.
- Typecheck und Produktionsbuild sind erfolgreich.

Schreibe gezielte Tests für Modellrechnung, Referenz-Prozentwert, Zeitplan einschließlich Zeitumstellung und Importvalidierung. Führe Prüfungen aus, wenn eine Ausführungsumgebung verfügbar ist. Berichte präzise, was tatsächlich geprüft wurde; erfinde keine Testergebnisse.

## 12. Architektur und Ausgabe

Trenne UI, Datenhaltung, fachliche Konstanten und Berechnung sauber. Sinnvolle Struktur:

- src/components/
- src/features/onboarding/
- src/features/dashboard/
- src/features/injections/
- src/features/weights/
- src/features/settings/
- src/config/appInfo.ts
- src/data/substances.ts
- src/types/
- src/store/
- src/utils/model.ts
- src/utils/schedule.ts
- src/utils/importExport.ts
- src/utils/calendar.ts
- src/App.tsx
- src/main.tsx

Liefere:

1. Kurze Übersicht über Aufbau und wesentliche Entscheidungen.
2. Vollständigen Projektbaum.
3. Sämtliche erforderlichen Dateien einschließlich package.json, Vite-, TypeScript-, Tailwind- und PWA-Konfiguration.
4. Lauffähigen Code ohne TODO-Platzhalter für Pflichtfunktionen.
5. Icons als tatsächliche Dateien; bei rein textbasierter Ausgabe ein reproduzierbares Erzeugungsskript.
6. README mit Voraussetzungen sowie Befehlen für Installation, Entwicklung, Tests, Build und lokale Build-Vorschau.
7. README-Abschnitt „So wird gerechnet“ mit Formel, Referenzdefinition, Akkumulation, Modellannahmen und Grenzen.
8. Dokumentierte Quellen und tatsächlichen Prüfstand.
9. Kurzen Prüfbericht und klar benannte verbleibende Einschränkungen.

Wenn du Dateien im Projekt direkt erstellen kannst, erstelle sie dort vollständig und fasse die Ergebnisse zusammen. Bei reiner Chat-Ausgabe jede Datei in einem eigenen Codeblock mit vollständigem relativen Dateipfad ausgeben.

Wenn die Ausgabegrenze erreicht wird, ausschließlich nach einer vollständigen Datei stoppen, die nächste Datei benennen und auf mein „Weiter“ warten. Code niemals mitten in einer Datei oder Zeile abschneiden.

## 13. Freiwillige Unterstützung per PayPal

Ergänze einen dezenten, freiwilligen Spendenlink im Footer und im Bereich „Über diese App“.

- Beschriftung: „Entwicklung unterstützen“.
- Begleittext: „Die Nutzung ist kostenlos. Wenn dir die App hilft, kannst du ihre Weiterentwicklung freiwillig über PayPal unterstützen.“
- Zieladresse: https://www.paypal.com/donate?hosted_button_id=2DCUQFHPSFQT6
- Verwende die bereitgestellte hosted_button_id unverändert: 2DCUQFHPSFQT6.
- Setze den Link als mit Tailwind gestaltetes HTML-a-Element um, optional mit lokalem Icon.
- Öffne PayPal ausschließlich nach bewusstem Antippen in einem neuen Tab bzw. dem externen Browser, mit target="_blank" und rel="noopener noreferrer".
- Verständlich ankündigen: „Öffnet PayPal; Internetverbindung erforderlich.“
- Keine PayPal-Grafiken von paypalobjects.com, keinen Zählpixel von paypal.com und kein PayPal-SDK einbinden. Keine Vorabverbindungen oder Prefetches zu PayPal.
- Vor dem Antippen keine PayPal-Netzwerkanfragen durch die App.
- Keine Gesundheitsdaten, Notizen, Gewichte, Wirkstoffe, Dosierungen oder Nutzerkennungen an die URL anhängen oder an PayPal übertragen.
- Referrerübermittlung unterbinden; ausschließlich die feste Spenden-URL verwenden.
- Keine Zahlungsdaten in der App erfassen oder speichern. Keine automatische Zahlung und keinen vorgewählten Betrag oder wiederkehrende Zahlung durch die App auslösen.
- Alle Funktionen bleiben unabhängig von einer Spende verfügbar. Keine Spenden-Popups, wiederholten Aufforderungen oder Funktionssperren.
- Datenschutzhinweis ergänzen: „Wenn du den Spendenlink öffnest, verlässt du die App. Auf der PayPal-Seite gelten die Datenschutzbedingungen von PayPal.“
- Spendenlink und hosted_button_id zentral in src/config/appInfo.ts verwalten.

Akzeptanz:

- Der Link verwendet exakt die angegebene Zieladresse.
- Ohne Antippen werden keine PayPal-Ressourcen geladen.
- Das Öffnen des Links verändert oder löscht keine Protokolldaten.
- Die Tagebuchfunktionen bleiben offline nutzbar; nur die externe PayPal-Seite benötigt Internet.

## 14. Entwickler- und Projektangaben

Zeige im unteren Bereich der App einen dezenten Link „Über diese App“. Dort und am Ende der README:

- Konzept und Projektverantwortung: Carsten Schütte
- Technische Umsetzung: zentral konfigurierbare tatsächliche Entwicklerangabe; bei fehlender Angabe weglassen
- App-Version: aus package.json
- Build-Datum: automatisch aus dem tatsächlichen Build
- Quellenstand: Datum der letzten tatsächlich durchgeführten fachlichen Prüfung; andernfalls „Nicht abschließend geprüft“
- Kontakt: optional; nur bei einer tatsächlich hinterlegten Kontaktadresse anzeigen

Verwalte diese Angaben zentral in src/config/appInfo.ts.

Keine Anschrift, E-Mail-Adresse, Berufsqualifikation oder weiteren personenbezogenen Angaben erfinden oder automatisch ergänzen. Keine Verbindung zu einer Klinik oder einem Arzneimittelhersteller behaupten. Aus diesen Projektangaben kein vermeintlich vollständiges rechtliches Impressum erzeugen.

Unter „Quellen und Modellgrenzen“ die tatsächlich verwendeten Fachinformationen und Studien mit Titel, URL und Prüfdatum nennen. Keine Aussagen über Wirksamkeit, Verträglichkeit oder sichere Injektionszeitpunkte aus der Modellrechnung ableiten.
