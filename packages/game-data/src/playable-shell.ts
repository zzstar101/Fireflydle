import { ActivityDefinitionSchema, ContentModeDefinitionSchema } from "@fireflydle/contracts";
import shellData from "./data/playable-shell.json";

/** 首屏导航只需要模式壳，不应加载实体、搜索索引或离线题库。 */
export const playableShell = {
  manifestVersion: shellData.manifestVersion,
  modes: ContentModeDefinitionSchema.array().parse(shellData.modes),
  activities: ActivityDefinitionSchema.array().parse(shellData.activities),
} as const;
