import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
import type { Locale } from "@fireflydle/contracts";
import { usePreferences } from "../state/preferences";

export const languageOptions: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: "zh-CN", label: "中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

/** 切换界面语言：同时写偏好、localStorage（首屏脚本读取）和 i18next。 */
export function useChangeLanguage() {
  const { i18n } = useTranslation();
  const setLanguage = usePreferences((state) => state.setLanguage);
  return (locale: Locale) => {
    setLanguage(locale);
    window.localStorage.setItem("fireflydle-language", locale);
    void i18n.changeLanguage(locale);
  };
}

/** 原型顶栏的地球按钮：点开是一个三语小菜单。 */
export function LanguageMenu({ className }: { className?: string }) {
  const language = usePreferences((state) => state.language);
  const changeLanguage = useChangeLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const label = language === "zh-CN" ? "语言" : language === "ja" ? "言語" : "Language";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={["lang-menu", className].filter(Boolean).join(" ")}>
      <button
        className="icon-btn"
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open && (
        <div id={menuId} className="lang-menu-list" role="menu" aria-label={label}>
          {languageOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={language === option.value}
              onClick={() => {
                changeLanguage(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {language === option.value && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
