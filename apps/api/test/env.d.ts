declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
    EMAIL: SendEmail;
    RELEASE_ANNOUNCEMENT_TOKEN: string;
    GITHUB_ISSUE_TOKEN: string;
  }
}
