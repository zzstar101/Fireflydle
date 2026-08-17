import { describe, expect, it } from "vitest";
import { contentManifest } from "@fireflydle/game-data";
import { contentModeRegistry, getRegisteredMode } from "./mode-registry";

describe("内容模式注册表", () => {
  it("从版本化 manifest 只公开普通角色当前支持的活动", () => {
    const playableDefinition = contentManifest.modes.find((mode) => mode.id === "playable");

    expect({
      manifestVersion: contentModeRegistry.manifestVersion,
      defaultModeId: contentModeRegistry.defaultModeId,
      modes: contentModeRegistry.modes.map((mode) => ({
        definitionIsPublished: mode.definition === playableDefinition,
        activities: mode.activities.map((activity) => activity.id),
        navigation: mode.navigation.map(({ id, segment, path, activityIds }) => ({
          id,
          segment,
          path,
          activityIds,
        })),
      })),
      npc: getRegisteredMode("npc"),
    }).toEqual({
      manifestVersion: contentManifest.manifestVersion,
      defaultModeId: "playable",
      modes: [
        {
          definitionIsPublished: true,
          activities: ["daily", "practice", "weekly", "private-room"],
          navigation: [
            {
              id: "daily",
              segment: "daily",
              path: "/playable/daily",
              activityIds: ["daily"],
            },
            {
              id: "practice",
              segment: "practice",
              path: "/playable/practice",
              activityIds: ["practice"],
            },
            {
              id: "duel",
              segment: "duel",
              path: "/playable/duel",
              activityIds: ["private-room"],
            },
          ],
        },
      ],
      npc: undefined,
    });
  });
});
