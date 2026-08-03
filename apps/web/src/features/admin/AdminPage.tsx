import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Archive,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  FileClock,
  FileUp,
  Layers3,
  Gauge,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UsersRound,
  X,
} from "lucide-react";
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementCategory,
  Character,
  Faction,
  Locale,
  LocalizedText,
  UserRole,
  Version,
} from "@fireflydle/contracts";
import { characters, getFactionName, pathLabels } from "@fireflydle/game-data";
import { PageHeader } from "../../components/PageHeader";
import { CharacterAvatar } from "../../components/CharacterAvatar";
import { MarkdownContent } from "../../components/MarkdownContent";
import { usePreferences } from "../../state/preferences";
import { useSession } from "../account/useSession";
import { ApiClientError, apiRequest } from "../../api/client";
import { OperationsPanel } from "./OperationsPanel";
import "./admin.css";

type AdminTab = "overview" | "characters" | "taxonomy" | "announcements" | "users" | "moderation";

interface AdminUser {
  id: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
  elo: number;
  rankedMatches: number;
  leaderboardEligible: boolean;
  bannedUntil: string | null;
  banReason: string | null;
  createdAt: string;
}

interface AdminUserPage {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DailyTarget {
  dateKey: string;
  characterId: string;
  cycle: number;
  source: "auto" | "override";
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  requestId: string;
  metadata: unknown;
  createdAt: string;
}

interface OnlinePresence {
  generatedAt: string;
  windowMinutes: 5;
  total: number | null;
  registered: number | null;
  guests: number | null;
}

const emptyLocalized = (): LocalizedText => ({ "zh-CN": "", en: "", ja: "" });

function beijingInputValue(value: string | null): string {
  if (!value) return "";
  return new Date(Date.parse(value) + 8 * 60 * 60_000).toISOString().slice(0, 16);
}

function beijingInputIso(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}:00+08:00`).toISOString();
}

function mutationMessage(error: unknown, locale: Locale) {
  const code = error instanceof ApiClientError ? error.code : "INTERNAL_ERROR";
  return locale === "zh-CN" ? `操作失败：${code}` : `Operation failed: ${code}`;
}

function CharacterPanel({ locale }: { locale: Locale }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const remoteCharacters = useQuery({
    queryKey: ["admin", "characters"],
    queryFn: () => apiRequest<Character[]>("/admin/characters"),
    retry: false,
  });
  const roster = remoteCharacters.data ?? characters;
  const filtered = useMemo(
    () =>
      roster.filter(
        (character) =>
          character.names[locale].toLocaleLowerCase().includes(query.toLocaleLowerCase()) ||
          character.id.includes(query.toLocaleLowerCase()),
      ),
    [locale, query, roster],
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "characters"] });
  const stateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { enabled?: boolean; targetEligible?: boolean };
    }) =>
      apiRequest<Character>(`/admin/characters/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      setMessage(locale === "zh-CN" ? "角色状态已保存。" : "Character state saved.");
      await refresh();
    },
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });
  const saveMutation = useMutation({
    mutationFn: async (source: string) => {
      const character = JSON.parse(source) as Character;
      if (!character.id) throw new Error("missing-id");
      return apiRequest<Character>(`/admin/characters/${encodeURIComponent(character.id)}`, {
        method: "PUT",
        body: JSON.stringify(character),
      });
    },
    onSuccess: async () => {
      setEditor(null);
      setMessage(
        locale === "zh-CN" ? "角色资料已保存并记入审计。" : "Character saved and audited.",
      );
      await refresh();
    },
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });
  const importMutation = useMutation({
    mutationFn: (payload: Character[]) =>
      apiRequest<{ imported: number }>("/admin/characters/import", {
        method: "POST",
        body: JSON.stringify({ characters: payload }),
      }),
    onSuccess: async (result) => {
      setMessage(
        locale === "zh-CN"
          ? `已导入 ${result.imported} 个角色。`
          : `Imported ${result.imported} characters.`,
      );
      await refresh();
    },
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });
  const createTemplate = () => {
    const source = roster[0] ?? characters[0];
    if (!source) {
      setMessage(locale === "zh-CN" ? "角色模板不可用。" : "Character template unavailable.");
      return;
    }
    const template = structuredClone(source);
    template.id = "";
    template.officialId = "";
    template.names = emptyLocalized();
    template.aliases = { "zh-CN": [], en: [], ja: [] };
    setEditor(JSON.stringify(template, null, 2));
  };

  return (
    <>
      <header className="admin-toolbar">
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === "zh-CN" ? "搜索角色或 ID" : "Search character or ID"}
          />
        </label>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept="application/json,.json"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            try {
              const parsed = JSON.parse(await file.text()) as
                Character[] | { characters: Character[] };
              importMutation.mutate(Array.isArray(parsed) ? parsed : parsed.characters);
            } catch {
              setMessage(
                locale === "zh-CN" ? "无法解析导入文件。" : "Could not parse import file.",
              );
            }
            event.currentTarget.value = "";
          }}
        />
        <button className="ticket-button-secondary" onClick={() => fileInput.current?.click()}>
          <FileUp size={16} />
          {locale === "zh-CN" ? "批量导入" : "Import"}
        </button>
        <button className="ticket-button" onClick={createTemplate}>
          <Plus size={16} />
          {locale === "zh-CN" ? "新建角色" : "New character"}
        </button>
      </header>
      {message ? <p className="admin-message">{message}</p> : null}
      {editor !== null ? (
        <section className="admin-editor">
          <header>
            <span>
              <Pencil size={16} /> JSON
            </span>
            <button className="icon-button" onClick={() => setEditor(null)} aria-label="Close">
              <X size={16} />
            </button>
          </header>
          <textarea
            value={editor}
            onChange={(event) => setEditor(event.target.value)}
            spellCheck={false}
          />
          <button className="ticket-button" onClick={() => saveMutation.mutate(editor)}>
            <Save size={16} />
            {locale === "zh-CN" ? "验证并保存" : "Validate and save"}
          </button>
        </section>
      ) : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>CHARACTER</th>
              <th>PATH</th>
              <th>FACTION</th>
              <th>VERSION</th>
              <th>STATE</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((character) => (
              <tr key={character.id}>
                <td>
                  <CharacterAvatar character={character} size="small" />
                  <span>
                    <strong>{character.names[locale]}</strong>
                    <small>{character.id}</small>
                  </span>
                </td>
                <td>{pathLabels[character.path][locale]}</td>
                <td>{getFactionName(character.factionId, locale)}</td>
                <td className="mono">V{character.releaseVersionId}</td>
                <td>
                  <button
                    className={`state-button ${character.enabled ? "enabled" : "disabled"}`}
                    onClick={() =>
                      stateMutation.mutate({
                        id: character.id,
                        body: { enabled: !character.enabled },
                      })
                    }
                  >
                    {character.enabled ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                    {character.enabled ? "ENABLED" : "DISABLED"}
                  </button>
                  <button
                    className={`target-button ${character.targetEligible ? "enabled" : "disabled"}`}
                    onClick={() =>
                      stateMutation.mutate({
                        id: character.id,
                        body: { targetEligible: !character.targetEligible },
                      })
                    }
                  >
                    TARGET
                  </button>
                </td>
                <td>
                  <button
                    className="icon-button"
                    onClick={() => setEditor(JSON.stringify(character, null, 2))}
                    aria-label={locale === "zh-CN" ? "编辑角色" : "Edit character"}
                  >
                    <Pencil size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function JsonCatalogEditor({
  title,
  data,
  endpoint,
  locale,
}: {
  title: string;
  data: unknown[];
  endpoint: string;
  locale: Locale;
}) {
  const queryClient = useQueryClient();
  const [source, setSource] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => setSource(JSON.stringify(data, null, 2)), [data]);
  const save = useMutation({
    mutationFn: () =>
      apiRequest<{ updated: number }>(endpoint, {
        method: "PUT",
        body: JSON.stringify(JSON.parse(source) as unknown),
      }),
    onSuccess: async (result) => {
      setMessage(
        locale === "zh-CN" ? `已保存 ${result.updated} 条。` : `Saved ${result.updated} records.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });
  return (
    <details className="catalog-editor">
      <summary>
        <span>{title}</span>
        <small>{data.length} RECORDS</small>
      </summary>
      <textarea
        value={source}
        onChange={(event) => setSource(event.target.value)}
        spellCheck={false}
      />
      <footer>
        <span>{message}</span>
        <button className="ticket-button" onClick={() => save.mutate()}>
          <Save size={15} /> {locale === "zh-CN" ? "保存" : "Save"}
        </button>
      </footer>
    </details>
  );
}

function TaxonomyPanel({ locale }: { locale: Locale }) {
  const queryClient = useQueryClient();
  const [dateKey, setDateKey] = useState(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date()),
  );
  const [characterId, setCharacterId] = useState("");
  const [message, setMessage] = useState("");
  const factionsQuery = useQuery({
    queryKey: ["admin", "factions"],
    queryFn: () => apiRequest<Faction[]>("/admin/factions"),
  });
  const versionsQuery = useQuery({
    queryKey: ["admin", "versions"],
    queryFn: () => apiRequest<Array<Version & { enabled: boolean }>>("/admin/versions"),
  });
  const targetsQuery = useQuery({
    queryKey: ["admin", "daily-targets"],
    queryFn: () => apiRequest<DailyTarget[]>("/admin/daily-targets"),
  });
  const override = useMutation({
    mutationFn: () =>
      apiRequest<DailyTarget>(`/admin/daily-targets/${dateKey}`, {
        method: "PUT",
        body: JSON.stringify({ characterId }),
      }),
    onSuccess: async () => {
      setMessage(locale === "zh-CN" ? "每日分配种子已保存。" : "Daily assignment seed saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "daily-targets"] });
    },
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });
  return (
    <div className="admin-stack">
      <JsonCatalogEditor
        title={locale === "zh-CN" ? "阵营与层级" : "Factions and hierarchy"}
        data={factionsQuery.data ?? []}
        endpoint="/admin/factions"
        locale={locale}
      />
      <JsonCatalogEditor
        title={locale === "zh-CN" ? "版本顺序" : "Version order"}
        data={versionsQuery.data ?? []}
        endpoint="/admin/versions"
        locale={locale}
      />
      <section className="admin-card">
        <header>
          <CalendarDays size={18} />
          <span>{locale === "zh-CN" ? "每日分配种子" : "Daily assignment seed"}</span>
        </header>
        <div className="inline-admin-form">
          <input type="date" value={dateKey} onChange={(event) => setDateKey(event.target.value)} />
          <input
            value={characterId}
            onChange={(event) => setCharacterId(event.target.value)}
            placeholder={locale === "zh-CN" ? "种子角色 ID" : "seed character ID"}
          />
          <button
            className="ticket-button"
            disabled={!dateKey || !characterId}
            onClick={() => override.mutate()}
          >
            <Save size={15} /> {locale === "zh-CN" ? "设置种子" : "Set seed"}
          </button>
        </div>
        {message ? <p className="admin-message">{message}</p> : null}
        <div className="compact-records">
          {(targetsQuery.data ?? []).slice(0, 10).map((target) => (
            <div key={target.dateKey}>
              <span className="mono">{target.dateKey}</span>
              <strong>{target.characterId}</strong>
              <small>
                CYCLE {target.cycle} · {target.source.toUpperCase()}
              </small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AnnouncementsPanel({ locale }: { locale: Locale }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState<LocalizedText>(emptyLocalized);
  const [body, setBody] = useState<LocalizedText>(emptyLocalized);
  const [category, setCategory] = useState<AnnouncementCategory>("notice");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<Locale>("zh-CN");
  const [message, setMessage] = useState("");
  const list = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => apiRequest<Announcement[]>("/admin/announcements"),
  });

  const resetForm = () => {
    setTitle(emptyLocalized());
    setBody(emptyLocalized());
    setCategory("notice");
    setAudience("all");
    setStartsAt("");
    setEndsAt("");
    setEditingId(null);
  };

  const save = useMutation({
    mutationFn: ({ publish }: { publish?: boolean }) => {
      const payload = {
        title,
        body,
        category,
        audience,
        startsAt: beijingInputIso(startsAt),
        endsAt: beijingInputIso(endsAt),
        ...(publish === undefined ? {} : { published: publish }),
      };
      return apiRequest<Announcement>(
        editingId ? `/admin/announcements/${editingId}` : "/admin/announcements",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify({
            ...payload,
            ...(!editingId && publish === undefined ? { published: false } : {}),
          }),
        },
      );
    },
    onSuccess: async () => {
      resetForm();
      setMessage(locale === "zh-CN" ? "公告已保存。" : "Announcement saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    },
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });

  const archive = useMutation({
    mutationFn: (id: string) =>
      apiRequest<Announcement>(`/admin/announcements/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: false }),
      }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] }),
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ deleted: boolean }>(`/admin/announcements/${id}`, { method: "DELETE" }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] }),
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });

  const loadForm = (item: Announcement, duplicate = false) => {
    setTitle(item.title);
    setBody(item.body);
    setCategory(item.category);
    setAudience(item.audience);
    setStartsAt(duplicate ? "" : beijingInputValue(item.startsAt));
    setEndsAt(duplicate ? "" : beijingInputValue(item.endsAt));
    setEditingId(duplicate ? null : item.id);
    setMessage(duplicate && locale === "zh-CN" ? "已复制为新公告草稿。" : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryText = (value: AnnouncementCategory) =>
    value === "update" ? "更新" : value === "maintenance" ? "维护" : "通知";
  const audienceText = (value: AnnouncementAudience) =>
    value === "registered" ? "注册用户" : value === "guest" ? "访客" : "全部用户";
  const statusText = (item: Announcement) => {
    if (item.status === "draft") return "草稿";
    if (item.status === "scheduled") return "待发布";
    if (item.status === "active") return "已生效";
    if (item.status === "ended") return "已结束";
    return "已归档";
  };

  const canSubmit = title["zh-CN"].trim().length > 0 && body["zh-CN"].trim().length > 0;
  return (
    <div className="admin-stack">
      <section className="admin-card announcement-form">
        <header>
          <BellRing size={18} />
          <span>
            {locale === "zh-CN"
              ? editingId
                ? "编辑公告"
                : "新建公告"
              : editingId
                ? "Edit announcement"
                : "New announcement"}
          </span>
          {editingId ? (
            <button className="icon-button" type="button" onClick={resetForm} title="取消编辑">
              <X size={17} />
            </button>
          ) : null}
        </header>
        <div className="announcement-options">
          <label>
            <span>{locale === "zh-CN" ? "分类" : "Category"}</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as AnnouncementCategory)}
            >
              <option value="update">{locale === "zh-CN" ? "版本更新" : "Update"}</option>
              <option value="notice">{locale === "zh-CN" ? "通知" : "Notice"}</option>
              <option value="maintenance">{locale === "zh-CN" ? "维护" : "Maintenance"}</option>
            </select>
          </label>
          <label>
            <span>{locale === "zh-CN" ? "触达对象" : "Audience"}</span>
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as AnnouncementAudience)}
            >
              <option value="all">{locale === "zh-CN" ? "全部用户" : "Everyone"}</option>
              <option value="registered">
                {locale === "zh-CN" ? "仅注册用户" : "Registered only"}
              </option>
              <option value="guest">{locale === "zh-CN" ? "仅访客" : "Guests only"}</option>
            </select>
          </label>
          <label>
            <span>{locale === "zh-CN" ? "生效时间（北京时间）" : "Starts (Beijing)"}</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </label>
          <label>
            <span>{locale === "zh-CN" ? "结束时间（可选）" : "Ends (optional)"}</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </label>
        </div>
        {(["zh-CN", "en", "ja"] as const).map((language) => (
          <div className="localized-row" key={language}>
            <b>
              {language}
              {language === "zh-CN" ? " *" : ""}
            </b>
            <input
              value={title[language]}
              onChange={(event) =>
                setTitle((current) => ({ ...current, [language]: event.target.value }))
              }
              placeholder={language === "zh-CN" ? "标题（必填）" : "标题（留空时显示中文）"}
            />
            <textarea
              value={body[language]}
              onChange={(event) =>
                setBody((current) => ({ ...current, [language]: event.target.value }))
              }
              placeholder={
                language === "zh-CN" ? "Markdown 正文（必填，不支持图片）" : "留空时显示中文"
              }
            />
          </div>
        ))}
        <div className="announcement-preview">
          <header>
            <strong>{locale === "zh-CN" ? "实时预览" : "Preview"}</strong>
            <div className="segmented-control">
              {(["zh-CN", "en", "ja"] as const).map((language) => (
                <button
                  key={language}
                  type="button"
                  className={previewLanguage === language ? "active" : ""}
                  onClick={() => setPreviewLanguage(language)}
                >
                  {language}
                </button>
              ))}
            </div>
          </header>
          <h3>{title[previewLanguage] || title["zh-CN"] || "公告标题"}</h3>
          <MarkdownContent>
            {body[previewLanguage] || body["zh-CN"] || "公告正文将在这里预览。"}
          </MarkdownContent>
        </div>
        <footer>
          <span>
            {locale === "zh-CN"
              ? "留空生效时间将立即发布"
              : "Leave start time empty to publish now"}
          </span>
          <button
            className="ticket-button-secondary"
            disabled={!canSubmit || save.isPending}
            onClick={() => save.mutate({})}
          >
            <Save size={15} /> {locale === "zh-CN" ? (editingId ? "保存修改" : "保存草稿") : "Save"}
          </button>
          <button
            className="ticket-button"
            disabled={!canSubmit || save.isPending}
            onClick={() => save.mutate({ publish: true })}
          >
            <BellRing size={15} />{" "}
            {locale === "zh-CN" ? (startsAt ? "安排发布" : "立即发布") : "Publish"}
          </button>
        </footer>
        {message ? <p className="admin-message">{message}</p> : null}
      </section>
      <section className="admin-card">
        <header>
          <FileClock size={18} />
          <span>{locale === "zh-CN" ? "公告历史" : "Announcement history"}</span>
        </header>
        <div className="compact-records">
          {(list.data ?? []).map((item) => (
            <div className="announcement-record" key={item.id}>
              <span className="announcement-record-state" data-status={item.status}>
                {statusText(item)}
              </span>
              <span className="announcement-record-copy">
                <strong>{item.title[locale]}</strong>
                <small>
                  {categoryText(item.category)} · {audienceText(item.audience)} ·{" "}
                  {item.source === "release" ? "RELEASE" : "ADMIN"}
                </small>
              </span>
              <div className="announcement-record-actions">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => loadForm(item)}
                  title="编辑"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => loadForm(item, true)}
                  title="复制为新公告"
                >
                  <Copy size={16} />
                </button>
                {item.status === "draft" ? (
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => {
                      if (window.confirm("确定永久删除这条草稿吗？")) remove.mutate(item.id);
                    }}
                    title="删除草稿"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : item.status === "active" || item.status === "scheduled" ? (
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => archive.mutate(item.id)}
                    title="归档"
                  >
                    <Archive size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function UsersPanel({ locale, actorRole }: { locale: Locale; actorRole: UserRole }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "banned">("");
  const [emailFilter, setEmailFilter] = useState<"" | "verified" | "unverified">("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  useEffect(() => setPage(1), [deferredQuery, roleFilter, statusFilter, emailFilter]);
  const search = new URLSearchParams({
    q: deferredQuery,
    page: String(page),
    pageSize: "25",
  });
  if (roleFilter) search.set("role", roleFilter);
  if (statusFilter) search.set("status", statusFilter);
  if (emailFilter) search.set("email", emailFilter);
  const users = useQuery({
    queryKey: ["admin", "users", deferredQuery, roleFilter, statusFilter, emailFilter, page],
    queryFn: () => apiRequest<AdminUserPage>(`/admin/users?${search.toString()}`),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiRequest<{ updated: boolean }>(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      setMessage(locale === "zh-CN" ? "用户状态已更新。" : "User state updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });
  const canAssignRole = actorRole === "admin" || actorRole === "owner";
  return (
    <div className="admin-stack">
      <header className="admin-toolbar">
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === "zh-CN" ? "搜索显示名、登录名或邮箱" : "Search name or email"}
          />
        </label>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as UserRole | "")}
          aria-label={locale === "zh-CN" ? "按角色筛选" : "Filter by role"}
        >
          <option value="">{locale === "zh-CN" ? "全部角色" : "All roles"}</option>
          {(["player", "moderator", "data-editor", "admin", "owner"] as const).map((role) => (
            <option value={role} key={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          aria-label={locale === "zh-CN" ? "按状态筛选" : "Filter by status"}
        >
          <option value="">{locale === "zh-CN" ? "全部状态" : "All statuses"}</option>
          <option value="active">{locale === "zh-CN" ? "正常" : "Active"}</option>
          <option value="banned">{locale === "zh-CN" ? "已封禁" : "Banned"}</option>
        </select>
        <select
          value={emailFilter}
          onChange={(event) => setEmailFilter(event.target.value as typeof emailFilter)}
          aria-label={locale === "zh-CN" ? "按邮箱状态筛选" : "Filter by email status"}
        >
          <option value="">{locale === "zh-CN" ? "全部邮箱" : "All email states"}</option>
          <option value="verified">{locale === "zh-CN" ? "已验证" : "Verified"}</option>
          <option value="unverified">{locale === "zh-CN" ? "未验证" : "Unverified"}</option>
        </select>
        <button
          className="icon-button"
          onClick={() => users.refetch()}
          title={locale === "zh-CN" ? "刷新用户" : "Refresh users"}
          aria-label={locale === "zh-CN" ? "刷新用户" : "Refresh users"}
        >
          <RefreshCw size={15} />
        </button>
      </header>
      {message ? <p className="admin-message">{message}</p> : null}
      <div className="admin-table-wrap">
        <table className="admin-table users-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>EMAIL</th>
              <th>ELO</th>
              <th>ROLE</th>
              <th>RANK</th>
              <th>MODERATION</th>
            </tr>
          </thead>
          <tbody>
            {(users.data?.items ?? []).map((user) => {
              const banned = Boolean(user.bannedUntil && Date.parse(user.bannedUntil) > Date.now());
              return (
                <tr key={user.id}>
                  <td>
                    <span>
                      <strong>{user.displayName}</strong>
                      <small>{user.id}</small>
                    </span>
                  </td>
                  <td>
                    <span
                      className={`user-email-state ${user.emailVerified ? "verified" : "unverified"}`}
                    >
                      {user.emailVerified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                  </td>
                  <td>
                    {user.elo}
                    <small>{user.rankedMatches} MATCHES</small>
                  </td>
                  <td>
                    {canAssignRole ? (
                      <select
                        value={user.role}
                        onChange={(event) =>
                          update.mutate({ id: user.id, body: { role: event.target.value } })
                        }
                      >
                        {(["player", "moderator", "data-editor", "admin", "owner"] as const).map(
                          (role) => (
                            <option value={role} key={role}>
                              {role}
                            </option>
                          ),
                        )}
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td>
                    <button
                      className={`state-button ${user.leaderboardEligible ? "enabled" : "disabled"}`}
                      onClick={() =>
                        update.mutate({
                          id: user.id,
                          body: { leaderboardEligible: !user.leaderboardEligible },
                        })
                      }
                    >
                      {user.leaderboardEligible ? "PUBLIC" : "HIDDEN"}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`state-button ${banned ? "disabled" : "enabled"}`}
                      onClick={() =>
                        update.mutate({
                          id: user.id,
                          body: banned
                            ? { bannedUntil: null, banReason: null }
                            : {
                                bannedUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(),
                                banReason: "manual moderation",
                              },
                        })
                      }
                    >
                      <Ban size={14} /> {banned ? "UNBAN" : "BAN 7D"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="admin-pagination">
        <span>
          {locale === "zh-CN" ? "注册用户" : "Registered users"}{" "}
          {numberFormat(users.data?.total ?? 0, locale)}
        </span>
        <div>
          <button
            className="icon-button"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            aria-label={locale === "zh-CN" ? "上一页" : "Previous page"}
          >
            <ChevronLeft size={16} />
          </button>
          <b>
            {users.data?.page ?? page} / {users.data?.totalPages ?? 1}
          </b>
          <button
            className="icon-button"
            disabled={page >= (users.data?.totalPages ?? 1)}
            onClick={() => setPage((value) => value + 1)}
            aria-label={locale === "zh-CN" ? "下一页" : "Next page"}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function numberFormat(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value);
}

function ModerationPanel({ locale, actorRole }: { locale: Locale; actorRole: UserRole }) {
  const [resultId, setResultId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const audits = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => apiRequest<AuditLog[]>("/admin/audit-logs"),
    enabled: actorRole === "admin" || actorRole === "owner",
  });
  const hide = useMutation({
    mutationFn: () =>
      apiRequest<{ hidden: boolean }>(
        `/admin/leaderboards/daily/${encodeURIComponent(resultId)}?reason=${encodeURIComponent(reason || "moderated")}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      setResultId("");
      setReason("");
      setMessage(
        locale === "zh-CN" ? "该成绩已从公开榜隐藏。" : "Result hidden from the public board.",
      );
    },
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });
  return (
    <div className="admin-stack">
      <section className="admin-card">
        <header>
          <Ban size={18} />
          <span>{locale === "zh-CN" ? "隐藏每日榜成绩" : "Hide daily result"}</span>
        </header>
        <div className="inline-admin-form">
          <input
            value={resultId}
            onChange={(event) => setResultId(event.target.value)}
            placeholder="game / result id"
          />
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={locale === "zh-CN" ? "治理原因" : "Moderation reason"}
          />
          <button className="ticket-button" disabled={!resultId} onClick={() => hide.mutate()}>
            <Ban size={15} /> {locale === "zh-CN" ? "隐藏" : "Hide"}
          </button>
        </div>
        {message ? <p className="admin-message">{message}</p> : null}
      </section>
      {actorRole === "admin" || actorRole === "owner" ? (
        <section className="admin-card">
          <header>
            <FileClock size={18} />
            <span>{locale === "zh-CN" ? "不可变审计记录" : "Immutable audit log"}</span>
          </header>
          <div className="compact-records audit-records">
            {(audits.data ?? []).map((entry) => (
              <div key={entry.id}>
                <span className="mono">{new Date(entry.createdAt).toLocaleString(locale)}</span>
                <strong>{entry.action}</strong>
                <small>
                  {entry.targetType} · {entry.targetId ?? "batch"} · {entry.requestId}
                </small>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function AdminPage() {
  const locale = usePreferences((state) => state.language);
  const session = useSession();
  const [tab, setTab] = useState<AdminTab>("overview");
  const role = session.data?.user.role ?? "player";
  const dataRoles: UserRole[] = ["data-editor", "admin", "owner"];
  const moderationRoles: UserRole[] = ["moderator", "admin", "owner"];
  const canData = dataRoles.includes(role);
  const canModerate = moderationRoles.includes(role);
  const canOperate = role === "admin" || role === "owner";
  const presence = useQuery({
    queryKey: ["admin", "presence"],
    queryFn: () => apiRequest<OnlinePresence>("/admin/presence"),
    enabled: canOperate,
    retry: false,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const tabs = [
    ...(canOperate
      ? [{ id: "overview" as const, label: locale === "zh-CN" ? "概览" : "Overview", icon: Gauge }]
      : []),
    ...(canData
      ? [
          {
            id: "characters" as const,
            label: locale === "zh-CN" ? "角色" : "Characters",
            icon: Database,
          },
          {
            id: "taxonomy" as const,
            label: locale === "zh-CN" ? "分类与版本" : "Taxonomy",
            icon: Layers3,
          },
          {
            id: "announcements" as const,
            label: locale === "zh-CN" ? "公告" : "Announcements",
            icon: BellRing,
          },
        ]
      : []),
    ...(canModerate
      ? [
          { id: "users" as const, label: locale === "zh-CN" ? "用户" : "Users", icon: UsersRound },
          {
            id: "moderation" as const,
            label: locale === "zh-CN" ? "排行治理" : "Moderation",
            icon: Ban,
          },
        ]
      : []),
  ];
  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id;

  if (!canData && !canModerate && !canOperate)
    return (
      <main className="center-page admin-denied">
        <ShieldCheck size={42} />
        <p className="eyebrow">RESTRICTED SECTOR</p>
        <h1>{locale === "zh-CN" ? "管理权限是必需的" : "Administrative access required"}</h1>
        <p className="muted">
          {locale === "zh-CN"
            ? "此入口用于角色资料、公告、用户与排行榜维护。普通玩家无法访问。"
            : "This area manages character data, announcements, users, and leaderboards."}
        </p>
      </main>
    );

  return (
    <main className="page-shell admin-page">
      <PageHeader
        eyebrow="ADMIN"
        title={locale === "zh-CN" ? "萤一把管理台" : "Fireflydle operations"}
        intro={
          locale === "zh-CN"
            ? "运行状态、内容与用户管理。"
            : "Operations, content, and user administration."
        }
        aside={
          canOperate ? (
            <div className="admin-presence" aria-live="polite">
              <i className={presence.data?.total === null ? "unavailable" : undefined}>
                <Radio size={16} />
              </i>
              <span>{locale === "zh-CN" ? "近 5 分钟在线" : "ONLINE · 5 MIN"}</span>
              <strong>
                {presence.data?.total === null || presence.data?.total === undefined
                  ? "--"
                  : numberFormat(presence.data.total, locale)}
              </strong>
              <small>
                {presence.data?.registered === null || presence.data?.registered === undefined
                  ? locale === "zh-CN"
                    ? "等待实时数据"
                    : "Waiting for analytics"
                  : `${locale === "zh-CN" ? "注册" : "REG"} ${numberFormat(presence.data.registered, locale)} · ${locale === "zh-CN" ? "访客" : "GUEST"} ${numberFormat(presence.data.guests ?? 0, locale)}`}
              </small>
            </div>
          ) : undefined
        }
      />
      <div className="admin-layout">
        <nav className="admin-nav">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={activeTab === id ? "active" : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
        <section className="admin-content">
          {activeTab === "overview" ? <OperationsPanel locale={locale} /> : null}
          {activeTab === "characters" ? <CharacterPanel locale={locale} /> : null}
          {activeTab === "taxonomy" ? <TaxonomyPanel locale={locale} /> : null}
          {activeTab === "announcements" ? <AnnouncementsPanel locale={locale} /> : null}
          {activeTab === "users" ? <UsersPanel locale={locale} actorRole={role} /> : null}
          {activeTab === "moderation" ? <ModerationPanel locale={locale} actorRole={role} /> : null}
        </section>
      </div>
    </main>
  );
}
