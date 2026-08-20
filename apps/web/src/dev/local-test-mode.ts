const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

/** 仅用于本地开发验收，不会在生产构建或正式域名启用。 */
export const localTestMode =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  localHostnames.has(window.location.hostname.toLocaleLowerCase("en-US"));
