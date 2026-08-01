import { useTranslation } from "react-i18next";

export function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="loading-screen" role="status">
      <span className="orbit-loader" aria-hidden="true">
        <i />
      </span>
      <span>{t("common.loading")}</span>
    </div>
  );
}
