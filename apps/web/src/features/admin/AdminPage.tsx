import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  FileClock,
  FileUp,
  Layers3,
  Gauge,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  UsersRound,
  X,
} from "lucide-react";
import type {
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
import { usePreferences } from "../../state/preferences";
import { useSession } from "../account/useSession";
import { ApiClientError, apiRequest } from "../../api/client";
import { OperationsPanel } from "./OperationsPanel";
import "./admin.css";

type AdminTab = "overview" | "characters" | "taxonomy" | "announcements" | "users" | "moderation";

interface AdminAnnouncement {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  published: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

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

const emptyLocalized = (): LocalizedText => ({ "zh-CN": "", en: "", ja: "" });

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
          className="visually-hidden"
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
  const [published, setPublished] = useState(false);
  const [message, setMessage] = useState("");
  const list = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => apiRequest<AdminAnnouncement[]>("/admin/announcements"),
  });
  const create = useMutation({
    mutationFn: () =>
      apiRequest<AdminAnnouncement>("/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ title, body, published, startsAt: null, endsAt: null }),
      }),
    onSuccess: async () => {
      setTitle(emptyLocalized());
      setBody(emptyLocalized());
      setPublished(false);
      setMessage(locale === "zh-CN" ? "公告已创建。" : "Announcement created.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    },
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });
  const toggle = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      apiRequest<AdminAnnouncement>(`/admin/announcements/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: next }),
      }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] }),
    onError: (error) => setMessage(mutationMessage(error, locale)),
  });
  return (
    <div className="admin-stack">
      <section className="admin-card announcement-form">
        <header>
          <BellRing size={18} />
          <span>{locale === "zh-CN" ? "新建多语言公告" : "New localized announcement"}</span>
        </header>
        {(["zh-CN", "en", "ja"] as const).map((language) => (
          <div className="localized-row" key={language}>
            <b>{language}</b>
            <input
              value={title[language]}
              onChange={(event) =>
                setTitle((current) => ({ ...current, [language]: event.target.value }))
              }
              placeholder={locale === "zh-CN" ? "标题" : "Title"}
            />
            <textarea
              value={body[language]}
              onChange={(event) =>
                setBody((current) => ({ ...current, [language]: event.target.value }))
              }
              placeholder={locale === "zh-CN" ? "正文" : "Body"}
            />
          </div>
        ))}
        <footer>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            {locale === "zh-CN" ? "立即发布" : "Publish now"}
          </label>
          <button
            className="ticket-button"
            disabled={
              Object.values(title).some((value) => !value) ||
              Object.values(body).some((value) => !value)
            }
            onClick={() => create.mutate()}
          >
            <Plus size={15} /> {locale === "zh-CN" ? "创建公告" : "Create"}
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
            <div key={item.id}>
              <span>
                <strong>{item.title[locale]}</strong>
                <small>{item.body[locale]}</small>
              </span>
              <button
                className={`state-button ${item.published ? "enabled" : "disabled"}`}
                onClick={() => toggle.mutate({ id: item.id, next: !item.published })}
              >
                {item.published ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                {item.published ? "PUBLISHED" : "DRAFT"}
              </button>
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
