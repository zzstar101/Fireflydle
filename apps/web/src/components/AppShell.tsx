import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Download,
  Home,
  Languages,
  Menu,
  MoonStar,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import type { Locale } from "@fireflydle/contracts";
import { usePreferences } from "../state/preferences";
import { useSession } from "../features/account/useSession";
import { BrandMark } from "./BrandMark";
import { AnnouncementCenter } from "./AnnouncementCenter";
import { getDefaultMode } from "../features/modes/mode-registry";
import { motionModeFromPreference, motionPausedForPage } from "./motion";
import { PwaInstallPrompt } from "./PwaInstallPrompt";
import { requestInstallFromMenu } from "../pwa";

const mainNavigation = [
  { to: getDefaultMode().path, key: "nav.hub", icon: Home, end: true },
  { to: "/leaderboard", key: "nav.leaderboard", icon: BarChart3, end: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const { theme, language, setTheme, setLanguage } = usePreferences();
  const session = useSession();

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let hasFocus = document.hasFocus();
    const sync = () => {
      root.dataset.motion = motionModeFromPreference(media.matches);
      root.dataset.motionPaused = String(
        motionPausedForPage(document.visibilityState === "visible", hasFocus),
      );
    };
    const onVisibilityChange = () => sync();
    const onFocus = () => {
      hasFocus = true;
      sync();
    };
    const onBlur = () => {
      hasFocus = false;
      sync();
    };
    sync();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    media.addEventListener("change", sync);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      media.removeEventListener("change", sync);
      delete root.dataset.motion;
      delete root.dataset.motionPaused;
    };
  }, []);

  const toggleTheme = () =>
    setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");
  const nextThemeLabel =
    theme === "dark"
      ? language === "zh-CN"
        ? "浅色主题"
        : language === "ja"
          ? "ライトテーマ"
          : "Light theme"
      : theme === "light"
        ? language === "zh-CN"
          ? "跟随系统"
          : language === "ja"
            ? "システム設定"
            : "Use system theme"
        : language === "zh-CN"
          ? "深色主题"
          : language === "ja"
            ? "ダークテーマ"
            : "Dark theme";
  const navigationLabel =
    language === "zh-CN"
      ? "主导航"
      : language === "ja"
        ? "メインナビゲーション"
        : "Main navigation";
  const openMenuLabel =
    language === "zh-CN"
      ? "打开导航"
      : language === "ja"
        ? "ナビゲーションを開く"
        : "Open navigation";
  const closeMenuLabel =
    language === "zh-CN"
      ? "关闭导航"
      : language === "ja"
        ? "ナビゲーションを閉じる"
        : "Close navigation";

  const changeLanguage = (value: string) => {
    const locale = value as Locale;
    setLanguage(locale);
    window.localStorage.setItem("fireflydle-language", locale);
    void i18n.changeLanguage(locale);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [menuOpen]);

  return (
    <div className="app-frame" data-motion-scope="app">
      <a className="skip-link" href="#main-content">
        {language === "zh-CN"
          ? "跳到主要内容"
          : language === "ja"
            ? "本文へ移動"
            : "Skip to main content"}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <BrandMark />
          <nav className="desktop-nav" aria-label={navigationLabel}>
            {mainNavigation.map(({ to, key, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                {t(key)}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <label className="language-select" title="Language">
              <Languages size={17} aria-hidden="true" />
              <span className="sr-only">Language</span>
              <select value={language} onChange={(event) => changeLanguage(event.target.value)}>
                <option value="zh-CN">中</option>
                <option value="en">EN</option>
                <option value="ja">日</option>
              </select>
            </label>
            <AnnouncementCenter />
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              title={nextThemeLabel}
            >
              {theme === "light" ? <Sun size={18} /> : <MoonStar size={18} />}
              <span className="sr-only">{nextThemeLabel}</span>
            </button>
            <Link className="account-link" to="/account">
              <UserRound size={17} aria-hidden="true" />
              <span>
                {session.data?.user.isGuest
                  ? t("account.guest")
                  : (session.data?.user.displayName ?? t("account.guest"))}
              </span>
            </Link>
            <button
              className="mobile-menu-button"
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-label={openMenuLabel}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="mobile-drawer-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={navigationLabel}
          onClick={() => setMenuOpen(false)}
        >
          <nav
            ref={drawerRef}
            className="mobile-drawer"
            aria-label={navigationLabel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-head">
              <BrandMark compact />
              <button
                ref={drawerCloseRef}
                className="icon-button"
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={closeMenuLabel}
              >
                <X size={20} />
              </button>
            </div>
            {mainNavigation.map(({ to, key, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                <Icon size={18} aria-hidden="true" /> {t(key)}
              </NavLink>
            ))}
            <NavLink to="/stats" onClick={() => setMenuOpen(false)}>
              <BarChart3 size={18} /> {t("nav.stats")}
            </NavLink>
            <div className="drawer-controls">
              <button type="button" onClick={() => requestInstallFromMenu()}>
                <Download size={18} aria-hidden="true" />
                <span>{t("pwa.menu")}</span>
              </button>
              <label title="Language">
                <Languages size={17} aria-hidden="true" />
                <span className="sr-only">Language</span>
                <select value={language} onChange={(event) => changeLanguage(event.target.value)}>
                  <option value="zh-CN">中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </label>
              <button type="button" onClick={toggleTheme}>
                {theme === "light" ? <Sun size={18} /> : <MoonStar size={18} />}
                <span>{nextThemeLabel}</span>
              </button>
              <Link to="/account" onClick={() => setMenuOpen(false)}>
                <UserRound size={17} aria-hidden="true" />
                <span>
                  {session.data?.user.isGuest
                    ? t("account.guest")
                    : (session.data?.user.displayName ?? t("account.guest"))}
                </span>
              </Link>
            </div>
          </nav>
        </div>
      )}

      <div
        id="main-content"
        className="site-content"
        tabIndex={-1}
        inert={menuOpen ? true : undefined}
      >
        {children}
      </div>
      <footer className="site-footer" inert={menuOpen ? true : undefined}>
        <div className="footer-rail" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <div className="footer-content">
          <p>{t("footer.unofficial")}</p>
          <div>
            <a href="mailto:takedown@fireflydle.games">{t("footer.takedown")}</a>
            <a href="https://github.com/zzstar101/fireflydle" target="_blank" rel="noreferrer">
              {t("footer.source")}
            </a>
            <Link to="/legal">{t("footer.privacy")}</Link>
          </div>
        </div>
      </footer>
      <PwaInstallPrompt />
    </div>
  );
}
