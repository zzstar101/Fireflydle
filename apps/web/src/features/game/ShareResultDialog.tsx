import { useEffect, useRef } from "react";
import { Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ShareResultDialog({
  imageUrl,
  fileName,
  onClose,
}: {
  imageUrl: string;
  fileName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="share-image-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="share-image-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-image-title"
      >
        <header>
          <div>
            <p className="eyebrow">PNG · 1080 × 1350</p>
            <h2 id="share-image-title">{t("game.sharePreviewTitle")}</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="share-dialog-close"
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>
        <div className="share-image-preview">
          <img src={imageUrl} alt={t("game.sharePreviewAlt")} />
        </div>
        <footer>
          <p>{t("game.shareImageHint")}</p>
          <a className="ticket-button" href={imageUrl} download={fileName}>
            <Download size={17} /> {t("game.saveImage")}
          </a>
        </footer>
      </section>
    </div>
  );
}
