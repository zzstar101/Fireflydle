import type { ReactNode } from "react";
import type { Locale } from "@fireflydle/contracts";
import type { RegisteredContentMode } from "./mode-registry";
import "./mode-shell.css";

/*
 * 玩法页外壳（docs/design/redesign-v2/README.md）。
 *
 * v2 里玩法切换由总站的玩法卡承担，外壳不再渲染旧版的独立活动导航
 * （那套导航的金色下划线、等宽大写小标题属于 v1 装饰），所以这里只输出一个不参与
 * 布局的包裹层，把 mode / locale 暴露成 data 属性，供后续按模式或语言做表现层微调。
 */
export function ModeShell({
  mode,
  locale,
  children,
}: {
  mode: RegisteredContentMode;
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <div className="mode-shell" data-mode={mode.definition.id} data-locale={locale}>
      {children}
    </div>
  );
}
