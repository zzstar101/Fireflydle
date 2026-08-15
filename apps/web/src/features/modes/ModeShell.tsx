import { CalendarDays, Shuffle, Swords, UserRound, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import type { Locale } from "@fireflydle/contracts";
import {
  contentModeRegistry,
  type ModeNavigationIcon,
  type RegisteredContentMode,
} from "./mode-registry";
import "./mode-shell.css";

const navigationIcons: Record<ModeNavigationIcon, LucideIcon> = {
  calendar: CalendarDays,
  shuffle: Shuffle,
  swords: Swords,
};

const navigationLabels: Record<Locale, { modes: string; activities: string }> = {
  "zh-CN": { modes: "内容模式", activities: "活动" },
  en: { modes: "Content modes", activities: "Activities" },
  ja: { modes: "コンテンツモード", activities: "アクティビティ" },
};

export function ModeShell({
  mode,
  locale,
  children,
}: {
  mode: RegisteredContentMode;
  locale: Locale;
  children: ReactNode;
}) {
  const labels = navigationLabels[locale];

  return (
    <>
      <section className="mode-shell-navigation">
        <div className="mode-shell-navigation-inner">
          <nav className="mode-switcher" aria-label={labels.modes}>
            {contentModeRegistry.modes.map((registeredMode) => (
              <NavLink key={registeredMode.definition.id} to={registeredMode.path} end={false}>
                <UserRound size={17} aria-hidden="true" />
                <span>{registeredMode.definition.label[locale]}</span>
              </NavLink>
            ))}
          </nav>
          <nav className="activity-switcher" aria-label={labels.activities}>
            {mode.navigation.map((activity) => {
              const Icon = navigationIcons[activity.icon];
              return (
                <NavLink key={activity.id} to={activity.path} end>
                  <Icon size={16} aria-hidden="true" />
                  <span>{activity.label[locale]}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </section>
      {children}
    </>
  );
}
