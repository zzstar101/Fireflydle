import { ApiProblem } from "../lib/http";

interface FeedbackIssueInput {
  id: string;
  category: "bug" | "suggestion" | "data";
  title: string;
  description: string;
  reproduction: string;
  sourceUrl: string;
  submitterName: string;
  attachmentCount: number;
}

interface PublishedGitHubIssue {
  number: number;
  url: string;
}

const GITHUB_REPOSITORY = "zzstar101/Fireflydle";

const categoryDetails = {
  bug: { prefix: "Bug", label: "bug", name: "Bug" },
  suggestion: { prefix: "建议", label: "enhancement", name: "功能建议" },
  data: { prefix: "数据纠错", label: "data", name: "数据纠错" },
} as const;

function githubIssueToken(env: Env): string | null {
  if (!("GITHUB_ISSUE_TOKEN" in env)) return null;
  const value = env.GITHUB_ISSUE_TOKEN;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function renderGitHubIssue(input: FeedbackIssueInput) {
  const category = categoryDetails[input.category];
  const sections = [
    `## 反馈内容\n\n${input.description}`,
    input.reproduction ? `## 复现步骤 / 建议目标\n\n${input.reproduction}` : "",
    input.sourceUrl ? `## 资料来源\n\n${input.sourceUrl}` : "",
    [
      "## 站内记录",
      "",
      `- 反馈编号：\`${input.id}\``,
      `- 分类：${category.name}`,
      `- 提交者：${input.submitterName}`,
      `- 附件：${input.attachmentCount} 张（保留在站内审核记录中）`,
      "",
      "> 此 Issue 由管理员审核后从萤一把反馈中心发布。联系邮箱等非公开信息不会同步到 GitHub。",
    ].join("\n"),
  ].filter(Boolean);
  return {
    title: `[${category.prefix}] ${input.title}`,
    body: sections.join("\n\n"),
    labels: [category.label],
  };
}

export async function createGitHubIssue(
  env: Env,
  input: FeedbackIssueInput,
): Promise<PublishedGitHubIssue> {
  const token = githubIssueToken(env);
  if (!token) {
    throw new ApiProblem("INTERNAL_ERROR", 503, {
      reason: "github-issue-token-missing",
    });
  }
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/issues`, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "Fireflydle-Worker",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify(renderGitHubIssue(input)),
  });
  if (!response.ok) {
    throw new ApiProblem("INTERNAL_ERROR", 502, {
      reason: "github-issue-create-failed",
      upstreamStatus: response.status,
    });
  }
  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("number" in payload) ||
    typeof payload.number !== "number" ||
    !("html_url" in payload) ||
    typeof payload.html_url !== "string"
  ) {
    throw new ApiProblem("INTERNAL_ERROR", 502, {
      reason: "github-issue-response-invalid",
    });
  }
  return { number: payload.number, url: payload.html_url };
}
