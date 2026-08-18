import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Download, Film, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ShareResultDialog({
  imageUrl,
  fileName,
  challengeUrl,
  challengeCopied = false,
  replayCopied = false,
  actionBusy = false,
  actionError = false,
  onCopyChallenge,
  onCopyReplay,
  onClose,
}: {
  imageUrl: string;
  fileName: string;
  challengeUrl?: string;
  challengeCopied?: boolean;
  replayCopied?: boolean;
  actionBusy?: boolean;
  actionError?: boolean;
  onCopyChallenge?: () => void;
  onCopyReplay?: () => void;
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

  return createPortal(
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
            <h2 id="share-image-title">
              {challengeUrl ? t("game.challengeShareTitle") : t("game.sharePreviewTitle")}
            </h2>
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
        {challengeUrl ? (
          <div className="share-challenge-link">
            <span>{t("game.challengeLinkLabel")}</span>
            <strong>{challengeUrl}</strong>
          </div>
        ) : null}
        <footer>
          <p>
            {challengeUrl ? t("game.challengeShareHint") : t("game.shareImageHint")}
            {challengeUrl && actionError ? (
              <span role="alert"> {t("game.challengeShareError")}</span>
            ) : null}
          </p>
          <div className="share-dialog-actions">
            {onCopyChallenge ? (
              <button
                className="ticket-button"
                type="button"
                disabled={actionBusy}
                onClick={onCopyChallenge}
              >
                {challengeCopied ? <Check size={17} /> : <Copy size={17} />}
                {challengeCopied ? t("game.linkCopied") : t("game.copyChallengeLink")}
              </button>
            ) : null}
            <a className="ticket-button-secondary" href={imageUrl} download={fileName}>
              <Download size={17} /> {t("game.saveImage")}
            </a>
            {onCopyReplay ? (
              <button
                className="share-replay-button"
                type="button"
                disabled={actionBusy}
                onClick={onCopyReplay}
              >
                {replayCopied ? <Check size={15} /> : <Film size={15} />}
                {replayCopied ? t("game.replayLinkCopied") : t("game.copyReplayLink")}
              </button>
            ) : null}
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
