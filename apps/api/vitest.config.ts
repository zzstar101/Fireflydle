import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations");
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            RESEND_API_KEY: "test-resend-key",
            RELEASE_ANNOUNCEMENT_TOKEN: "test-release-announcement-token-0001",
            GITHUB_ISSUE_TOKEN: "test-github-issue-token",
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
      testTimeout: 15_000,
    },
  };
});
