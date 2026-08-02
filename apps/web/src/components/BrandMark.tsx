import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link className="brand-mark" to="/" aria-label={t("brand.name")}>
      <span className="brand-sigil" aria-hidden="true">
        <img className="brand-sigil-image" src="/favicon.png" alt="" width="38" height="38" />
      </span>
      <span className="brand-copy">
        <strong>{t("brand.name")}</strong>
        {!compact && <small>{t("brand.subtitle")}</small>}
      </span>
    </Link>
  );
}
