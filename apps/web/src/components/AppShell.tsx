import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { House, LayoutGrid, Trophy, UserRound } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { usePreferences } from "../state/preferences";
import { useSession } from "../features/account/useSession";
import { BrandMark } from "./BrandMark";
import { GitHubMark } from "./GitHubMark";
import { AnnouncementCenter } from "./AnnouncementCenter";
import { getDefaultMode } from "../features/modes/mode-registry";
import { motionModeFromPreference, motionPausedForPage } from "./motion";
import { qualityFlags } from "./quality-flags";
import { PwaInstallPrompt } from "./PwaInstallPrompt";
import { LanguageMenu } from "./LanguageMenu";
import { assetUrl } from "../lib/asset-url";
import { useCharacterHead } from "../lib/character-art";
import { StarField } from "../fx/StarField";
import { fx } from "../fx/fx";

const gameplayPathPattern = /^(\/playable|\/currency-wars|\/aeon|\/room|\/challenge|\/party)/;

const mainNavigation = [
  { to: getDefaultMode().path, key: "nav.hub", end: true },
  { to: "/leaderboard", key: "nav.leaderboard", end: false },
  { to: "/collection", key: "nav.collection", end: false },
  { to: "/feedback", key: "nav.feedback", end: false },
] as const;

/** 原型移动端底栏：总站 / 排行 / 图鉴 / 我的。 */
const tabNavigation = [
  { to: getDefaultMode().path, key: "nav.hub", icon: House, end: true },
  { to: "/leaderboard", key: "nav.leaderboardShort", icon: Trophy, end: false },
  { to: "/collection", key: "nav.collection", icon: LayoutGrid, end: false },
  { to: "/account", key: "nav.me", icon: UserRound, end: false },
] as const;

/** 顶栏头像：原型用流萤头像代表访客。 */
const meAvatarCharacter = "firefly";

const sourceRepository = "https://github.com/zzstar101/fireflydle";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { language, collectionRewardId } = usePreferences();
  const meAvatar = useCharacterHead(meAvatarCharacter);
  const collectionRewardImage = usePreferences((state) => state.collectionRewardImage);
  const session = useSession();
  const location = useLocation();
  const gameplay = gameplayPathPattern.test(location.pathname);

  // 原型 showGame / closeResult：除总站与结算外，背景都是压暗的"对局态"，形态不跟随滚动。
  // layout effect 先于所有被动 effect 执行，总站 hero 与结算页再各自覆盖成 hub / result。
  useLayoutEffect(() => {
    fx.setMode("game");
    fx.setScroller(null);
    fx.tween({ dim: 0.45, rail: 0.25 }, { duration: 1.2 });
  }, [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const factionTheme = collectionRewardId?.startsWith("faction:")
      ? collectionRewardId.slice(8)
      : "";
    const rewardImage = collectionRewardImage;
    if (rewardImage)
      root.style.setProperty("--collection-reward-image", `url("${assetUrl(rewardImage)}")`);
    else root.style.removeProperty("--collection-reward-image");
    root.dataset.rewardVisible = String(Boolean(collectionRewardId) && !gameplay);
    if (factionTheme) root.dataset.collectionFaction = factionTheme;
    else delete root.dataset.collectionFaction;
    const pathTheme = collectionRewardId?.startsWith("path:") ? collectionRewardId.slice(5) : "";
    if (pathTheme) root.dataset.collectionTheme = pathTheme;
    else delete root.dataset.collectionTheme;
    return () => {
      delete root.dataset.rewardVisible;
      delete root.dataset.collectionFaction;
      delete root.dataset.collectionTheme;
      root.style.removeProperty("--collection-reward-image");
    };
  }, [collectionRewardId, collectionRewardImage, gameplay]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let hasFocus = document.hasFocus();
    const sync = () => {
      // `?reduce` 用来在截图回归里强制降级，与系统偏好取并集
      root.dataset.motion = motionModeFromPreference(media.matches || qualityFlags().reduceMotion);
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

  const displayName = session.data?.user.isGuest
    ? t("account.guest")
    : (session.data?.user.displayName ?? t("account.guest"));
  const navigationLabel =
    language === "zh-CN"
      ? "主导航"
      : language === "ja"
        ? "メインナビゲーション"
        : "Main navigation";
  return (
    <div className="app-frame" data-motion-scope="app">
      <StarField intensity={gameplay ? "calm" : "full"} />
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
            <a
              className="icon-btn hide-m"
              href={sourceRepository}
              target="_blank"
              rel="noreferrer"
              aria-label={t("footer.source")}
              title={t("footer.source")}
            >
              <GitHubMark />
            </a>
            <LanguageMenu className="hide-m" />
            <AnnouncementCenter />
            <Link className="me" to="/account" aria-label={displayName}>
              {meAvatar ? (
                <img src={meAvatar} alt="" />
              ) : (
                <UserRound size={18} aria-hidden="true" />
              )}
              <span>{displayName}</span>
            </Link>
          </div>
        </div>
      </header>

      <div id="main-content" className="site-content" tabIndex={-1}>
        {children}
      </div>
      <footer className="site-footer">
        <div className="footer-rail" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <div className="footer-content">
          <p>{t("footer.unofficial")}</p>
          <div>
            <a href="mailto:takedown@fireflydle.games">{t("footer.takedown")}</a>
            <Link to="/legal">{t("footer.privacy")}</Link>
          </div>
        </div>
      </footer>
      <nav className="tabbar" aria-label={t("nav.bottom")}>
        {tabNavigation.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={key}
            to={to}
            end={end}
            className={({ isActive }) => (isActive ? "on" : undefined)}
          >
            <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
            {t(key)}
          </NavLink>
        ))}
      </nav>
      <PwaInstallPrompt />
    </div>
  );
}
