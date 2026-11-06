import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function PwaStatus() {
  const {
    offlineReady: [offline, setOffline],
    needRefresh: [update, setUpdate],
    updateServiceWorker,
  } = useRegisterSW();
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const offer = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const status = () => setOnline(navigator.onLine);
    const installed = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("online", status);
    window.addEventListener("offline", status);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", offer);
      window.removeEventListener("online", status);
      window.removeEventListener("offline", status);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  return (
    <>
      {!online && (
        <div className="status-banner">
          <WifiOff size={17} />
          Offline · Deine Einträge werden weiterhin lokal gespeichert.
        </div>
      )}
      {offline && (
        <div className="status-banner" role="status">
          Für die Offline-Nutzung vorbereitet.
          <button
            className="icon-button"
            aria-label="Offline-Hinweis schließen"
            onClick={() => setOffline(false)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {update && (
        <div className="status-banner">
          <RefreshCw size={17} />
          <span>Eine neue Version ist verfügbar.</span>
          <button
            className="text-button"
            onClick={() => {
              if (
                document.querySelector("form") &&
                !confirm(
                  "Ein Update lädt die App neu. Ungespeicherte Formulareingaben können verloren gehen. Jetzt aktualisieren?",
                )
              )
                return;
              void updateServiceWorker(true);
            }}
          >
            Jetzt aktualisieren
          </button>
          <button
            className="icon-button"
            aria-label="Update später durchführen"
            onClick={() => setUpdate(false)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {install && (
        <button
          className="install-button"
          onClick={async () => {
            await install.prompt();
            await install.userChoice;
            setInstall(null);
          }}
        >
          <Download size={16} />
          App installieren
        </button>
      )}
    </>
  );
}
