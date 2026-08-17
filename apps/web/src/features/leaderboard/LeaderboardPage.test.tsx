import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

const storage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
globalThis.window = { localStorage: storage, navigator: { language: "zh-CN" } } as never;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { language: "zh-CN" },
});
globalThis.localStorage = storage as never;

await import("../../i18n");
const { default: LeaderboardPage } = await import("./LeaderboardPage");

describe("排行榜页面", () => {
  it("只提供对战 Elo，不再呈现个性化每日题全球榜", () => {
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LeaderboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(markup).toContain("永久 Elo");
    expect(markup).toContain("个性化每日题不进行全球排名");
    expect(markup).not.toContain("每日排行榜");
    expect(markup).not.toContain('role="tab"');
  });
});
