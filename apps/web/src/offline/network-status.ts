import { useEffect, useState } from "react";

export function browserIsOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
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
