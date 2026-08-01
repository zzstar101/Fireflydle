import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/AppShell";
import { LoadingScreen } from "../components/LoadingScreen";
import { usePreferences } from "../state/preferences";

const GamePage = lazy(() => import("../features/game/GamePage"));
const HubPage = lazy(() => import("../features/hub/HubPage"));
const DuelPage = lazy(() => import("../features/multiplayer/DuelPage"));
const RoomPage = lazy(() => import("../features/multiplayer/RoomPage"));
const LeaderboardPage = lazy(() => import("../features/leaderboard/LeaderboardPage"));
const StatsPage = lazy(() => import("../features/account/StatsPage"));
const AccountPage = lazy(() => import("../features/account/AccountPage"));
const RecoveryPage = lazy(() => import("../features/account/RecoveryPage"));
const AdminPage = lazy(() => import("../features/admin/AdminPage"));
const ReplayPage = lazy(() => import("../features/game/ReplayPage"));
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

export function App() {
  return (
    <BrowserRouter>
      <ThemeAndLocaleSync />
      <RouteScrollReset />
      <AppShell>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HubPage />} />
            <Route path="/daily" element={<GamePage key="daily" mode="daily" />} />
            <Route path="/random" element={<GamePage key="random" mode="random" />} />
            <Route path="/duel" element={<DuelPage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/recover" element={<RecoveryPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/replay/:replayId" element={<ReplayPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}
