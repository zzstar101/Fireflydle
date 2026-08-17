import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/AppShell";
import { LoadingScreen } from "../components/LoadingScreen";
import { ModeShell } from "../features/modes/ModeShell";
import { getDefaultMode, type ModeNavigationItem } from "../features/modes/mode-registry";
import { getLegacyActivityRedirect } from "../features/modes/mode-routing";
import { usePreferences } from "../state/preferences";

const GamePage = lazy(() => import("../features/game/GamePage"));
const EndlessPage = lazy(() => import("../features/game/EndlessPage"));
const HubPage = lazy(() => import("../features/hub/HubPage"));
const DuelPage = lazy(() => import("../features/multiplayer/DuelPage"));
const RoomPage = lazy(() => import("../features/multiplayer/RoomPage"));
const LeaderboardPage = lazy(() => import("../features/leaderboard/LeaderboardPage"));
const StatsPage = lazy(() => import("../features/account/StatsPage"));
const AccountPage = lazy(() => import("../features/account/AccountPage"));
const RecoveryPage = lazy(() => import("../features/account/RecoveryPage"));
const EmailVerificationPage = lazy(() => import("../features/account/EmailVerificationPage"));
const AdminPage = lazy(() => import("../features/admin/AdminPage"));
const ReplayPage = lazy(() => import("../features/game/ReplayPage"));
const FriendChallengePage = lazy(() => import("../features/game/FriendChallengePage"));
const LegalPage = lazy(() => import("../features/account/LegalPage"));
const NotFoundPage = lazy(() => import("./NotFoundPage"));

function ThemeAndLocaleSync() {
  const { i18n } = useTranslation();
  const { theme, language } = usePreferences();

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [i18n, language]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => {
      const resolved = theme === "system" ? (media.matches ? "light" : "dark") : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  return null;
}

function RouteScrollReset() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

const defaultMode = getDefaultMode();

function DefaultModeRedirect() {
  return <Navigate to={defaultMode.path} replace />;
}

function LegacyActivityRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={getLegacyActivityRedirect(pathname, search) ?? defaultMode.path} replace />;
}

function DefaultModeLayout() {
  const locale = usePreferences((state) => state.language);
  return (
    <ModeShell mode={defaultMode} locale={locale}>
      <Outlet />
    </ModeShell>
  );
}

function activityPage(activity: ModeNavigationItem) {
  if (activity.id === "daily") return <GamePage key="daily" mode="daily" />;
  if (activity.id === "practice") return <GamePage key="random" mode="random" />;
  if (activity.id === "endless") return <EndlessPage key="endless" />;
  return <DuelPage activityIds={activity.activityIds} />;
}

function RouteContent() {
  const { pathname } = useLocation();
  return (
    <div className="route-transition" key={pathname} data-route={pathname}>
      <Routes>
        <Route path="/" element={<DefaultModeRedirect />} />
        <Route path={defaultMode.path} element={<DefaultModeLayout />}>
          <Route index element={<HubPage />} />
          {defaultMode.navigation.map((activity) => (
            <Route key={activity.id} path={activity.segment} element={activityPage(activity)} />
          ))}
        </Route>
        {defaultMode.navigation.map((activity) => (
          <Route
            key={activity.legacyPath}
            path={activity.legacyPath}
            element={<LegacyActivityRedirect />}
          />
        ))}
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/recover" element={<RecoveryPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/replay/:replayId" element={<ReplayPage />} />
        <Route path="/challenge/:challengeId" element={<FriendChallengePage />} />
        <Route
          path="/npc/practice"
          element={<GamePage key="npc-practice" mode="random" contentModeId="npc" />}
        />
        <Route
          path="/currency-wars/practice"
          element={
            <GamePage key="currency-wars-practice" mode="random" contentModeId="currency-wars" />
          }
        />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeAndLocaleSync />
      <RouteScrollReset />
      <AppShell>
        <Suspense fallback={<LoadingScreen />}>
          <RouteContent />
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}
