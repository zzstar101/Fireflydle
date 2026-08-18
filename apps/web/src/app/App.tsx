import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/AppShell";
import { LoadingScreen } from "../components/LoadingScreen";
import { ModeShell } from "../features/modes/ModeShell";
import { getDefaultMode, type ModeNavigationItem } from "../features/modes/mode-registry";
import { usePreferences } from "../state/preferences";
import { useNetworkStatus } from "../offline/network-status";

const PlayableGamePage = lazy(() => import("../features/game/PlayableModePages"));
const PlayableEndlessPage = lazy(() =>
  import("../features/game/PlayableModePages").then((module) => ({
    default: module.PlayableEndlessPage,
  })),
);
const CurrencyWarsGamePage = lazy(() => import("../features/game/CurrencyWarsModePages"));
const CurrencyWarsEndlessPage = lazy(() =>
  import("../features/game/CurrencyWarsModePages").then((module) => ({
    default: module.CurrencyWarsEndlessPage,
  })),
);
const AeonGamePage = lazy(() => import("../features/game/AeonModePages"));
const AeonEndlessPage = lazy(() =>
  import("../features/game/AeonModePages").then((module) => ({ default: module.AeonEndlessPage })),
);
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
const WeeklyPage = lazy(() => import("../features/weekly/WeeklyPage"));
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

function DefaultModeLayout() {
  const locale = usePreferences((state) => state.language);
  return (
    <ModeShell mode={defaultMode} locale={locale}>
      <Outlet />
    </ModeShell>
  );
}

function activityPage(activity: ModeNavigationItem) {
  if (activity.id === "daily")
    return (
      <OnlineActivity>
        <PlayableGamePage key="daily" activityId="daily" />
      </OnlineActivity>
    );
  if (activity.id === "practice") return <PlayableGamePage key="practice" activityId="practice" />;
  if (activity.id === "endless")
    return (
      <OnlineActivity>
        <PlayableEndlessPage key="endless" />
      </OnlineActivity>
    );
  return (
    <OnlineActivity>
      <DuelPage activityIds={activity.activityIds} />
    </OnlineActivity>
  );
}

function OnlineActivity({ children }: { children: ReactNode }) {
  const online = useNetworkStatus();
  return online ? children : <Navigate to="/playable/practice" replace />;
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
          path="/currency-wars/practice"
          element={<CurrencyWarsGamePage key="currency-wars-practice" />}
        />
        <Route
          path="/currency-wars/endless"
          element={
            <OnlineActivity>
              <CurrencyWarsEndlessPage key="currency-wars-endless" />
            </OnlineActivity>
          }
        />
        <Route path="/aeon/practice" element={<AeonGamePage key="aeon-practice" />} />
        <Route
          path="/aeon/endless"
          element={
            <OnlineActivity>
              <AeonEndlessPage key="aeon-endless" />
            </OnlineActivity>
          }
        />
        <Route path="/playable/weekly" element={<WeeklyPage routeModeId="playable" />} />
        <Route path="/currency-wars/weekly" element={<WeeklyPage routeModeId="currency-wars" />} />
        <Route path="/aeon/weekly" element={<WeeklyPage routeModeId="aeon" />} />
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
