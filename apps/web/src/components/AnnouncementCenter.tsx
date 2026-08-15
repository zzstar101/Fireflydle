import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, ChevronLeft, ChevronRight, Megaphone, Wrench, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import type { Announcement, AnnouncementCategory, Locale } from "@fireflydle/contracts";
import { apiRequest } from "../api/client";
import { useSession } from "../features/account/useSession";
import { getDefaultModeNavigation } from "../features/modes/mode-registry";
import { usePreferences } from "../state/preferences";
import { MarkdownContent } from "./MarkdownContent";

const quietActivityPaths = (["daily", "practice"] as const).flatMap((navigationId) => {
  const activity = getDefaultModeNavigation(navigationId);
  return activity ? [activity.path, activity.legacyPath] : [];
});

const quietPaths = [
  ...quietActivityPaths,
  "/room/",
  "/account",
  "/recover",
  "/verify-email",
  "/admin",
];

function isQuietPath(pathname: string): boolean {
  return quietPaths.some((path) => pathname === path || pathname.startsWith(path));
}

function categoryLabel(category: AnnouncementCategory, locale: Locale): string {
  const labels = {
    update: { "zh-CN": "版本更新", en: "UPDATE", ja: "アップデート" },
    notice: { "zh-CN": "通知", en: "NOTICE", ja: "お知らせ" },
    maintenance: { "zh-CN": "维护", en: "MAINTENANCE", ja: "メンテナンス" },
  } as const;
  return labels[category][locale];
}

function CategoryIcon({ category }: { category: AnnouncementCategory }) {
  if (category === "maintenance") return <Wrench size={16} aria-hidden="true" />;
  if (category === "update") return <Megaphone size={16} aria-hidden="true" />;
  return <BellRing size={16} aria-hidden="true" />;
}

function formatDate(value: string | null, locale: Locale): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function AnnouncementBody({
  announcement,
  locale,
}: {
  announcement: Announcement;
  locale: Locale;
}) {
  return (
    <div className="announcement-copy">
      <div className={`announcement-category is-${announcement.category}`}>
        <CategoryIcon category={announcement.category} />
        {categoryLabel(announcement.category, locale)}
      </div>
      <h2>{announcement.title[locale]}</h2>
      <p className="announcement-date">
        {formatDate(announcement.publishedAt ?? announcement.startsAt, locale)}
      </p>
      <div className="announcement-markdown">
        <MarkdownContent>{announcement.body[locale]}</MarkdownContent>
      </div>
    </div>
  );
}

export function AnnouncementCenter() {
  const locale = usePreferences((state) => state.language);
  const location = useLocation();
  const session = useSession();
  const queryClient = useQueryClient();
  const [centerOpen, setCenterOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const [popupIds, setPopupIds] = useState<ReadonlySet<string>>(new Set());
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const announcements = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiRequest<Announcement[]>("/announcements"),
    enabled: session.isSuccess,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const isAdministrator =
    session.data?.user.role === "admin" || session.data?.user.role === "owner";
  const unread = useMemo(
    () =>
      (announcements.data ?? []).filter(
        (item) => item.status === "active" && item.readAt === null && !popupIds.has(item.id),
      ),
    [announcements.data, popupIds],
  );
  const popupItems = useMemo(
    () => (announcements.data ?? []).filter((item) => popupIds.has(item.id)),
    [announcements.data, popupIds],
  );

  const markRead = useMutation({
    mutationFn: (ids: string[]) =>
      apiRequest<{ read: number }>("/announcements/read", {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    onError: async () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });

  useEffect(() => {
    if (!session.isSuccess || isQuietPath(location.pathname)) return;
    void announcements.refetch();
  }, [location.pathname, session.isSuccess]);

  useEffect(() => {
    const onFocus = () => {
      if (!isQuietPath(location.pathname)) void announcements.refetch();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [location.pathname]);

  useEffect(() => {
    if (
      isAdministrator ||
      isQuietPath(location.pathname) ||
      centerOpen ||
      popupOpen ||
      unread.length === 0
    ) {
      return;
    }
    setPopupIds(new Set(unread.map((item) => item.id)));
    setPopupIndex(0);
    setPopupOpen(true);
  }, [centerOpen, isAdministrator, location.pathname, popupOpen, unread]);

  useEffect(() => {
    if (!centerOpen && !popupOpen) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (popupOpen) closePopup();
        else setCenterOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const surface = document.querySelector<HTMLElement>(
        popupOpen ? ".announcement-popup" : ".announcement-center",
      );
      if (!surface) return;
      const focusable = Array.from(
        surface.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [centerOpen, popupOpen]);

  const closePopup = () => {
    const ids = [...popupIds];
    const readAt = new Date().toISOString();
    queryClient.setQueryData<Announcement[]>(["announcements"], (current) =>
      current?.map((item) => (popupIds.has(item.id) ? { ...item, readAt } : item)),
    );
    setPopupOpen(false);
    setPopupIds(new Set());
    if (ids.length > 0) markRead.mutate(ids);
  };

  const currentPopup = popupItems[popupIndex] ?? popupItems[0];
  const unreadCount = isAdministrator ? 0 : unread.length;
  const openLabel =
    locale === "zh-CN" ? "打开公告中心" : locale === "ja" ? "お知らせを開く" : "Open announcements";
  const closeLabel =
    locale === "zh-CN" ? "关闭公告" : locale === "ja" ? "お知らせを閉じる" : "Close announcement";

  return (
    <>
      <button
        className="icon-button announcement-trigger"
        type="button"
        aria-label={openLabel}
        title={openLabel}
        onClick={() => setCenterOpen(true)}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="announcement-count">{Math.min(99, unreadCount)}</span>
        ) : null}
      </button>

      {centerOpen
        ? createPortal(
            <div className="announcement-overlay" onMouseDown={() => setCenterOpen(false)}>
              <aside
                className="announcement-center"
                role="dialog"
                aria-modal="true"
                aria-label={openLabel}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <header>
                  <div>
                    <span>FIREFLYDLE</span>
                    <h2>
                      {locale === "zh-CN"
                        ? "公告中心"
                        : locale === "ja"
                          ? "お知らせ"
                          : "ANNOUNCEMENTS"}
                    </h2>
                  </div>
                  <button
                    ref={closeButtonRef}
                    className="icon-button"
                    type="button"
                    onClick={() => setCenterOpen(false)}
                    aria-label={closeLabel}
                  >
                    <X size={20} />
                  </button>
                </header>
                <div className="announcement-history">
                  {(announcements.data ?? []).length === 0 ? (
                    <p className="announcement-empty">
                      {locale === "zh-CN"
                        ? "暂时没有公告"
                        : locale === "ja"
                          ? "お知らせはありません"
                          : "No announcements yet"}
                    </p>
                  ) : (
                    (announcements.data ?? []).map((item) => (
                      <details key={item.id} className="announcement-history-item">
                        <summary>
                          <span className={`announcement-category is-${item.category}`}>
                            <CategoryIcon category={item.category} />
                            {categoryLabel(item.category, locale)}
                          </span>
                          <strong>{item.title[locale]}</strong>
                          <small>{formatDate(item.publishedAt ?? item.startsAt, locale)}</small>
                        </summary>
                        <div className="announcement-markdown">
                          <MarkdownContent>{item.body[locale]}</MarkdownContent>
                        </div>
                      </details>
                    ))
                  )}
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}

      {popupOpen && currentPopup
        ? createPortal(
            <div className="announcement-overlay is-popup" onMouseDown={closePopup}>
              <section
                className="announcement-popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="announcement-popup-title"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  ref={closeButtonRef}
                  className="icon-button announcement-popup-close"
                  type="button"
                  onClick={closePopup}
                  aria-label={closeLabel}
                >
                  <X size={20} />
                </button>
                <div id="announcement-popup-title">
                  <AnnouncementBody announcement={currentPopup} locale={locale} />
                </div>
                {popupItems.length > 1 ? (
                  <footer className="announcement-pager">
                    <button
                      type="button"
                      disabled={popupIndex === 0}
                      onClick={() => setPopupIndex((value) => Math.max(0, value - 1))}
                      aria-label="Previous"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span>
                      {popupIndex + 1} / {popupItems.length}
                    </span>
                    <button
                      type="button"
                      disabled={popupIndex >= popupItems.length - 1}
                      onClick={() =>
                        setPopupIndex((value) => Math.min(popupItems.length - 1, value + 1))
                      }
                      aria-label="Next"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </footer>
                ) : null}
                <button className="announcement-acknowledge" type="button" onClick={closePopup}>
                  {locale === "zh-CN" ? "关闭" : locale === "ja" ? "閉じる" : "CLOSE"}
                </button>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
