import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getNpcCensusStatusCounts, validateNpcCensus } from "./npc-census";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const censusPath = resolve(scriptDirectory, "../packages/game-data/src/data/npc-census.json");
const census = validateNpcCensus(JSON.parse(await readFile(censusPath, "utf8")));
const counts = getNpcCensusStatusCounts(census);

console.log(
  `NPC census 校验通过：${census.entries.length} 条，target ${counts.target}，candidate-only ${counts.candidateOnly}，pending ${counts.pending}，excluded ${counts.excluded}`,
);
