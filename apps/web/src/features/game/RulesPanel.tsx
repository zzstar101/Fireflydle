import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, CircleDot, GraduationCap, X } from "lucide-react";
import type { FieldDefinition, Locale } from "@fireflydle/contracts";

export function RulesPanel({
  locale,
  title,
  intro,
  poolSize,
  maxAttempts,
  fields,
  labels,
  onReplayTutorial,
}: {
  locale: Locale;
  title: string;
  intro: string;
  poolSize: number;
  maxAttempts: number;
  fields: readonly FieldDefinition[];
  labels: {
    open: string;
    close: string;
    range: string;
    guesses: string;
    fields: string;
    colors: string;
    directions: string;
    example: string;
    exact: string;
    closeMatch: string;
    miss: string;
    higher: string;
    lower: string;
    replayTutorial?: string;
  };
  onReplayTutorial?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
      return;
    }
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className="rules-panel-trigger ticket-button-secondary"
        type="button"
        onClick={() => setOpen(true)}
      >
        <BookOpen size={17} aria-hidden="true" /> {labels.open}
      </button>
      {open && (
        <div
          className="rules-panel-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <div
            ref={dialogRef}
            className="rules-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-panel-title"
            tabIndex={-1}
          >
            <header>
              <div>
                <span className="eyebrow">{title}</span>
                <h2 id="rules-panel-title">{title}</h2>
              </div>
              <button
                className="share-dialog-close"
                type="button"
                aria-label={labels.close}
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="rules-panel-body">
              <p className="rules-panel-intro">{intro}</p>
              <dl className="rules-panel-stats">
                <div>
                  <dt>{labels.range}</dt>
                  <dd>{poolSize}</dd>
                </div>
                <div>
                  <dt>{labels.guesses}</dt>
                  <dd>{maxAttempts}</dd>
                </div>
              </dl>
              <section>
                <h3>{labels.fields}</h3>
                <ul className="rules-field-list">
                  {fields.map((field) => (
                    <li key={field.id}>
                      {field.label[locale]}
                      {field.directional ? <small>{labels.directions}</small> : null}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>{labels.colors}</h3>
                <ul className="rules-example-list">
                  <li>
                    <i className="key-exact">
                      <Check size={15} />
                    </i>
                    {labels.exact}
                  </li>
                  <li>
                    <i className="key-close">
                      <CircleDot size={15} />
                    </i>
                    {labels.closeMatch}
                  </li>
                  <li>
                    <i className="key-miss">
                      <X size={15} />
                    </i>
                    {labels.miss}
                  </li>
                </ul>
              </section>
              <section>
                <h3>{labels.example}</h3>
                <div className="rules-fixed-example">
                  <span className="state-exact">
                    <Check size={14} /> {labels.exact}
                  </span>
                  <span className="state-close">
                    <CircleDot size={14} /> {labels.closeMatch}
                  </span>
                  <span className="state-miss">
                    <X size={14} /> {labels.miss}
                  </span>
                  <span className="state-direction">
                    <ArrowUp size={14} /> {labels.higher}
                  </span>
                  <span className="state-direction">
                    <ArrowDown size={14} /> {labels.lower}
                  </span>
                </div>
              </section>
            </div>
            <footer>
              {onReplayTutorial && labels.replayTutorial ? (
                <button
                  className="ticket-button-secondary"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onReplayTutorial();
                  }}
                >
                  <GraduationCap size={17} aria-hidden="true" /> {labels.replayTutorial}
                </button>
              ) : null}
              <button className="ticket-button" type="button" onClick={() => setOpen(false)}>
                {labels.close}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
