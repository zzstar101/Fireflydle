import { useTranslation } from "react-i18next";
import { BarChart3, Download, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";
import { GitHubMark } from "../../components/GitHubMark";
import { languageOptions, useChangeLanguage } from "../../components/LanguageMenu";
import { requestInstallFromMenu } from "../../pwa";
import { usePreferences } from "../../state/preferences";

const sourceRepository = "https://github.com/zzstar101/fireflydle";

/**
 * 「我的」页底部的快捷入口。移动端顶栏按原型只剩铃铛和头像，
 * 语言、战绩、反馈、源码和安装应用都收在这里。
 */
export function AccountShortcuts() {
  const { t } = useTranslation();
  const language = usePreferences((state) => state.language);
  const changeLanguage = useChangeLanguage();
  const languageLabel = language === "zh-CN" ? "语言" : language === "ja" ? "言語" : "Language";

  return (
    <section className="account-shortcuts" aria-label={t("nav.me")}>
      <div className="account-shortcuts-lang" role="radiogroup" aria-label={languageLabel}>
        <span className="label">{languageLabel}</span>
        {languageOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={language === option.value}
            className={language === option.value ? "on" : undefined}
            onClick={() => changeLanguage(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="account-shortcuts-links">
        <Link className="btn sm" to="/stats">
          <BarChart3 size={16} aria-hidden="true" /> {t("nav.stats")}
        </Link>
        <Link className="btn sm" to="/feedback">
          <MessageSquareText size={16} aria-hidden="true" /> {t("nav.feedback")}
        </Link>
        <a className="btn sm" href={sourceRepository} target="_blank" rel="noreferrer">
          <GitHubMark /> {t("footer.source")}
        </a>
        <button className="btn sm" type="button" onClick={() => requestInstallFromMenu()}>
          <Download size={16} aria-hidden="true" /> {t("pwa.menu")}
        </button>
      </div>
    </section>
  );
}
