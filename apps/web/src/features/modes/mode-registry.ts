import type {
  ActivityDefinition,
  ActivityId,
  ContentModeDefinition,
  ContentModeId,
  LocalizedText,
} from "@fireflydle/contracts";
import { contentManifest } from "@fireflydle/game-data";

export type ModeNavigationId = "daily" | "practice" | "endless" | "duel";
export type ModeNavigationIcon = "calendar" | "shuffle" | "infinity" | "swords";

export interface ModeNavigationItem {
  id: ModeNavigationId;
  label: LocalizedText;
  segment: string;
  path: string;
  legacyPath: string;
  icon: ModeNavigationIcon;
  activityIds: readonly ActivityId[];
}

export interface RegisteredContentMode {
  definition: ContentModeDefinition;
  activities: readonly ActivityDefinition[];
  path: string;
  navigation: readonly ModeNavigationItem[];
}

const duelLabel = {
  "zh-CN": "对战",
  en: "Duel",
  ja: "対戦",
} satisfies LocalizedText;

function buildPlayableMode(): RegisteredContentMode {
  const definition = contentManifest.modes.find((mode) => mode.id === "playable");
  if (!definition) throw new Error("内容 manifest 未注册普通角色模式");

  const activities = contentManifest.activities.filter(
    (activity) =>
      activity.enabled &&
      activity.modeIds.includes(definition.id) &&
      definition.activities.includes(activity.id),
  );
  const enabledActivityIds = new Set(activities.map((activity) => activity.id));
  const modePath = `/${definition.id}`;
  const navigation: ModeNavigationItem[] = [];
  const daily = activities.find((activity) => activity.id === "daily");
  if (daily) {
    navigation.push({
      id: "daily",
      label: daily.label,
      segment: "daily",
      path: `${modePath}/daily`,
      legacyPath: "/daily",
      icon: "calendar",
      activityIds: [daily.id],
    });
  }

  const practice = activities.find((activity) => activity.id === "practice");
  if (practice) {
    navigation.push({
      id: "practice",
      label: practice.label,
      segment: "practice",
      path: `${modePath}/practice`,
      legacyPath: "/random",
      icon: "shuffle",
      activityIds: [practice.id],
    });
  }

  const endless = activities.find((activity) => activity.id === "endless");
  if (endless) {
    navigation.push({
      id: "endless",
      label: endless.label,
      segment: "endless",
      path: `${modePath}/endless`,
      legacyPath: "/endless",
      icon: "infinity",
      activityIds: [endless.id],
    });
  }

  const duelActivityIds = (["private-room", "ranked-match"] as const).filter((activityId) =>
    enabledActivityIds.has(activityId),
  );
  if (duelActivityIds.length > 0) {
    navigation.push({
      id: "duel",
      label: duelLabel,
      segment: "duel",
      path: `${modePath}/duel`,
      legacyPath: "/duel",
      icon: "swords",
      activityIds: duelActivityIds,
    });
  }

  return {
    definition,
    activities,
    path: modePath,
    navigation,
  };
}

const playableMode = buildPlayableMode();

export const contentModeRegistry = {
  manifestVersion: contentManifest.manifestVersion,
  defaultModeId: playableMode.definition.id,
  modes: [playableMode] as const,
};

export function getRegisteredMode(
  modeId: ContentModeId | string,
): RegisteredContentMode | undefined {
  return contentModeRegistry.modes.find((mode) => mode.definition.id === modeId);
}

export function getDefaultMode(): RegisteredContentMode {
  return playableMode;
}

export function getDefaultModeNavigation(
  navigationId: ModeNavigationId,
): ModeNavigationItem | undefined {
  return playableMode.navigation.find((item) => item.id === navigationId);
}
