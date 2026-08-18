import { useEffect, useState } from "react";

export type OfflineAwareActivity = "practice" | "daily" | "endless" | "duel";

export function browserIsOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function isOnlineActivityAllowed(online: boolean, activity: OfflineAwareActivity): boolean {
  return online || activity === "practice";
}

export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState(browserIsOnline);

  useEffect(() => {
    const update = () => setOnline(browserIsOnline());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
