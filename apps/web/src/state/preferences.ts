import type { Locale } from "@fireflydle/contracts";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "system" | "dark" | "light";

interface PreferencesState {
  theme: ThemePreference;
  language: Locale;
  collectionRewardId: string | null;
  collectionRewardImage: string | null;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: Locale) => void;
  setCollectionReward: (id: string, imagePath: string) => void;
}

function initialLanguage(): Locale {
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith("ja")) return "ja";
  if (browserLanguage.startsWith("en")) return "en";
  return "zh-CN";
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      language: initialLanguage(),
      collectionRewardId: null,
      collectionRewardImage: null,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCollectionReward: (collectionRewardId, collectionRewardImage) =>
        set({ collectionRewardId, collectionRewardImage }),
    }),
    { name: "fireflydle-preferences" },
  ),
);
