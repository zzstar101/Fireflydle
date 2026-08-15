import { contentModeRegistry } from "./mode-registry";

export function getLegacyActivityRedirect(pathname: string, search: string): string | undefined {
  for (const mode of contentModeRegistry.modes) {
    const activity = mode.navigation.find((item) => item.legacyPath === pathname);
    if (activity) return `${activity.path}${search}`;
  }
  return undefined;
}
