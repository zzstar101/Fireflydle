import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  dismissInstallPrompt,
  isInstallCoolingDown,
  isInstallEligible,
  isInstallSupported,
  isIosDevice,
  onInstallEligible,
  onInstallRequested,
  promptInstall,
} from "../pwa";

export function PwaInstallPrompt() {
  const { t } = useTranslation();
  const [eligible, setEligible] = useState(isInstallEligible);
  const [visible, setVisible] = useState(false);
  const [instructions, setInstructions] = useState(false);

  const openInstall = async () => {
    if (isIosDevice()) {
      setInstructions(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome !== "unsupported") setVisible(false);
  };

  useEffect(() => {
    const stopEligible = onInstallEligible(() => setEligible(true));
    const stopRequested = onInstallRequested(() => void openInstall());
    return () => {
      stopEligible();
      stopRequested();
    };
  }, []);
  useEffect(() => {
    setVisible(eligible && isInstallSupported() && !isInstallCoolingDown());
  }, [eligible]);

  const close = () => {
    dismissInstallPrompt();
    setVisible(false);
  };

  return (
    <>
      {visible && (
        <aside className="pwa-install-prompt" role="dialog" aria-labelledby="pwa-install-title">
          <button
            className="pwa-install-close"
            type="button"
            onClick={close}
            aria-label={t("common.close")}
          >
            <X size={17} aria-hidden="true" />
          </button>
          <Download size={22} aria-hidden="true" />
          <div>
            <h2 id="pwa-install-title">{t("pwa.title")}</h2>
            <p>{t("pwa.body")}</p>
            <button className="ticket-button" type="button" onClick={() => void openInstall()}>
              <Download size={16} aria-hidden="true" /> {t("pwa.install")}
            </button>
          </div>
        </aside>
      )}
      {instructions && (
        <div
          className="pwa-install-modal-backdrop"
          role="presentation"
          onClick={() => setInstructions(false)}
        >
          <section
            className="pwa-install-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-ios-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="pwa-install-close"
              type="button"
              onClick={() => setInstructions(false)}
              aria-label={t("common.close")}
            >
              <X size={17} aria-hidden="true" />
            </button>
            <h2 id="pwa-ios-title">{t("pwa.iosTitle")}</h2>
            <p>{t("pwa.iosBody")}</p>
            <ol>
              <li>
                <Share size={16} aria-hidden="true" /> {t("pwa.iosStepOne")}
              </li>
              <li>
                <Download size={16} aria-hidden="true" /> {t("pwa.iosStepTwo")}
              </li>
            </ol>
          </section>
        </div>
      )}
    </>
  );
}
