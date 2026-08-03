const START_MARKER = "<!-- fireflydle:announcement:start -->";
const END_MARKER = "<!-- fireflydle:announcement:end -->";

const releaseBody = process.env.RELEASE_BODY ?? "";
const tagName = process.env.RELEASE_TAG?.trim() ?? "";
const releaseName = process.env.RELEASE_NAME?.trim() || tagName;
const outputPath = process.argv[2] ?? "release-announcement.json";
const start = releaseBody.indexOf(START_MARKER);
const end = releaseBody.indexOf(END_MARKER);

if (start < 0 || end < 0 || end <= start) {
  throw new Error(
    `Release 正文必须包含玩家公告区块：\n${START_MARKER}\n面向玩家的更新日志\n${END_MARKER}`,
  );
}
if (releaseBody.indexOf(START_MARKER, start + START_MARKER.length) >= 0) {
  throw new Error("Release 正文只能包含一个玩家公告区块");
}
if (!tagName || !releaseName) throw new Error("Release 标签或名称为空");

const body = releaseBody.slice(start + START_MARKER.length, end).trim();
if (!body) throw new Error("玩家公告区块不能为空");
if (/!\[[^\]]*\]\s*\([^)]*\)/u.test(body) || /<\s*img\b/iu.test(body)) {
  throw new Error("站内公告暂不支持图片，请从玩家公告区块中移除图片");
}

await Bun.write(outputPath, `${JSON.stringify({ tagName, name: releaseName, body }, null, 2)}\n`);
console.log(`已提取 ${tagName} 的玩家公告（${body.length} 字符）`);
