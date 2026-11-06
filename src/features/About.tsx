import {
  ExternalLink,
  Heart,
  ShieldCheck,
  BookOpen,
  Smartphone,
} from "lucide-react";
import { appInfo, MODEL_NOTICE } from "../config/appInfo";
import { SUBSTANCES } from "../data/substances";
import { fmtDate } from "../utils/time";
export function Donation() {
  return (
    <a
      className="donation-link"
      href={appInfo.donationUrl}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      title="Öffnet PayPal; Internetverbindung erforderlich"
    >
      <Heart size={16} /> Entwicklung unterstützen <ExternalLink size={13} />
    </a>
  );
}
export function About() {
  return (
    <div className="about-grid">
      <div>
        <section className="panel prose">
          <p className="eyebrow">DAS PRINZIP</p>
          <h2>Dein Protokoll. Dein Überblick.</h2>
          <p>
            Injekto-log hält tatsächlich dokumentierte Injektionen und
            Gewichtseinträge fest. Die App gibt keine Dosierungsempfehlungen,
            bewertet keine Nebenwirkungen und ersetzt weder ärztliche Beratung
            noch die Fach- oder Gebrauchsinformation.
          </p>
          <h3>So wird gerechnet</h3>
          <p>{MODEL_NOTICE}</p>
          <div className="formula">
            Beitrag = Dosis × 0,5<sup>Stunden / Halbwertszeit</sup>
          </div>
          <p>
            Die Beiträge vergangener Injektionen derselben Behandlungsepisode
            werden addiert. Zukünftige Gaben zählen erst ab ihrem angenommenen
            Zeitpunkt. Verschiedene Wirkstoffe werden nie zusammengezählt.
          </p>
          <p>
            Das Modell nimmt eine sofortige Aufnahme und eine konstante
            exponentielle Elimination an. Resorptionsverzögerung,
            Bioverfügbarkeit, Verteilungsvolumen und individuelle Unterschiede
            werden nicht abgebildet.
          </p>
          <h3>Freie Wirkstoff- und Präparatebezeichnungen</h3>
          <p>
            Eigene Namen sind persönliche Protokollangaben. Bei bekannten
            Wirkstoffen bleibt das Modell dem gewählten Wirkstoff zugeordnet.
            Eine freie Präparatebezeichnung bestätigt weder Inhalt noch Reinheit
            oder Zulassung eines Produkts. Bei einem eigenen Wirkstoff ist die
            Modellrechnung aus, solange keine Halbwertszeit ausdrücklich
            hinterlegt wurde. Eigene Modellparameter sind ungeprüft; Änderungen
            beginnen eine neue Episode.
          </p>
          <h3>Was bedeuten die Prozentwerte?</h3>
          <p>
            100 % entspricht der modellierten Gesamtsumme unmittelbar nach der
            letzten tatsächlich dokumentierten Injektion. Der aktuelle
            Modellwert wird durch diesen Referenzwert geteilt. Das ist kein
            gemessener Konzentrationspeak und kein Maß der Wirkung.
          </p>
          <p>
            Nach einer Halbwertszeit verbleiben im Modell 50 % des Beitrags
            einer einzelnen Dosis, nach fünf Halbwertszeiten 3,125 %. Andere
            Injektionen verändern die Gesamtsumme. Ein sicherer Wechsel- oder
            Wiederbeginntermin lässt sich daraus nicht ableiten.
          </p>
          <h3>Zwei Arten von Zeitplänen</h3>
          <p>
            Ein Stundenabstand zählt die verstrichene Dauer seit der letzten
            Injektion. Ein Kalenderzeitplan hält die gewählte lokale Uhrzeit in
            der gespeicherten Zeitzone ein. Bei Zeitumstellungen können diese
            Termine voneinander abweichen.
          </p>
          <p>
            Wiederkehrende Kalendertermine in einer übersprungenen Stunde werden
            entsprechend vorwärts verschoben. Bei einer doppelten Stunde wird
            das erste Auftreten verwendet. Mehrdeutige manuelle Einträge werden
            zurückgewiesen.
          </p>
          <h3>Eine Vorschau bleibt eine Annahme</h3>
          <p>
            Die optionale gestrichelte Vorschau verwendet die letzte
            dokumentierte Dosis und den eingetragenen Zeitplan. Sie speichert
            keine tatsächlichen Gaben und ist keine Empfehlung. Bei ungeklärtem,
            verstrichenem Termin wird sie pausiert.
          </p>
        </section>
        <section className="panel prose sources-panel">
          <div className="inline-items">
            <BookOpen size={21} />
            <h2>Quellen und Modellgrenzen</h2>
          </div>
          <p>
            Die Halbwertszeiten sind Näherungen aus offiziellen
            Produktinformationen bzw. Studienangaben. Dokumentationswerte sind
            Eingabehilfen und keine Empfehlungen. Quellen geprüft am 06.11.2026.
            Angaben können sich ändern.
          </p>
          {SUBSTANCES.map((s) => (
            <div className="source-group" key={s.id}>
              <h3>
                {s.name} · ca. {s.halfLife} h
              </h3>
              {s.study && (
                <p>
                  In klinischer Prüfung; nicht zugelassen. Prüfstatus: Lilly,
                  Oktober 2026.
                </p>
              )}
              {s.sources.map((source) => (
                <p key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                  >
                    {source.title} <ExternalLink size={13} />
                  </a>
                  <small>{source.section}</small>
                </p>
              ))}
            </div>
          ))}
          <p className="tiny">
            Handelsnamen bedeuten keine gleiche Indikation, Zulassung oder
            regionale Verfügbarkeit. Ausschließlich subkutane Injektionen werden
            erfasst. Bei Trulicity wird die Näherung aus Abschnitt 5.2
            verwendet.
          </p>
        </section>
      </div>
      <aside>
        <section className="panel prose">
          <ShieldCheck className="mint-text" size={26} />
          <h2>Lokal. Persönlich.</h2>
          <p>
            Die App überträgt deine Protokolle nicht an einen App-Server.
            localStorage bietet keine eigene Verschlüsselung oder
            Zugriffssperre. Browserdaten können verloren gehen; sichere
            regelmäßig ein JSON-Backup.
          </p>
          <p>
            Handy und PC haben getrennte Datenbestände. Ein Kalenderexport
            übergibt ausgewählte Daten an die verwendete Kalender-App.
          </p>
        </section>
        <section className="panel prose">
          <Smartphone size={25} />
          <h2>Als App verwenden</h2>
          <p>
            Öffne die bereitgestellte HTTPS-Adresse direkt im Browser. Wenn dein
            Browser es unterstützt, kannst du die App installieren.
          </p>
          <p>
            Auf iPhone und iPad: in Safari „Teilen“ und anschließend „Zum
            Home-Bildschirm“. Nach dem ersten vollständigen Laden ist die
            Tagebuchfunktion offline verfügbar.
          </p>
          <p className="tiny">
            Installation und Offline-Zugriff können je nach Browser und privater
            Hosting-Anmeldung eingeschränkt sein.
          </p>
        </section>
        <section className="panel prose">
          <Heart className="sand-text" size={25} />
          <h2>Ein kleines Dankeschön.</h2>
          <p>
            Die Nutzung ist kostenlos. Wenn dir die App hilft, kannst du ihre
            Weiterentwicklung freiwillig über PayPal unterstützen.
          </p>
          <Donation />
          <p className="tiny">
            Öffnet PayPal; Internetverbindung erforderlich. Du verlässt die App.
            Auf der PayPal-Seite gelten die Datenschutzbedingungen von PayPal.
          </p>
        </section>
        <section className="panel prose project-info">
          <p className="eyebrow">ÜBER DIESES PROJEKT</p>
          <h3>{appInfo.name}</h3>
          <dl>
            <dt>Konzept & Projektverantwortung</dt>
            <dd>{appInfo.owner}</dd>
            <dt>Technische Umsetzung</dt>
            <dd>{appInfo.developer}</dd>
            <dt>Version</dt>
            <dd>{appInfo.version}</dd>
            <dt>Build</dt>
            <dd>{fmtDate(appInfo.buildDate)}</dd>
            <dt>Quellenprüfung</dt>
            <dd>06.11.2026</dd>
          </dl>
        </section>
      </aside>
    </div>
  );
}
