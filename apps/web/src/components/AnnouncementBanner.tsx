import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BellRing, X } from "lucide-react";
import type { Announcement } from "@fireflydle/contracts";
import { apiRequest } from "../api/client";
import { usePreferences } from "../state/preferences";

export function AnnouncementBanner() {
  const locale = usePreferences((state) => state.language);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  const announcements = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiRequest<Announcement[]>("/announcements"),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const announcement = announcements.data?.find((item) => !dismissed.has(item.id));
  if (!announcement) return null;

  return (
    <aside className="announcement-banner" aria-label={announcement.title[locale]}>
      <BellRing size={16} aria-hidden="true" />
      <strong>{announcement.title[locale]}</strong>
      <span>{announcement.body[locale]}</span>
      <button
        className="icon-button"
        type="button"
        aria-label={
          locale === "zh-CN"
            ? "关闭公告"
            : locale === "ja"
              ? "お知らせを閉じる"
              : "Dismiss announcement"
        }
        onClick={() => setDismissed((current) => new Set([...current, announcement.id]))}
      >
        <X size={16} />
      </button>
    </aside>
  );
}
