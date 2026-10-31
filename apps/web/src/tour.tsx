import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, m, useReducedMotion } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import "./tour.css";

export interface TourStep {
  target: string;
  title: MessageKey;
  text: MessageKey;
}

export const PRODUCT_TOUR: readonly TourStep[] = [
  { target: ".ts-sidebar__nav", title: "tour.sidebar.title", text: "tour.sidebar.text" },
  { target: "[data-tour='search']", title: "tour.search.title", text: "tour.search.text" },
  { target: "[data-tour='kpi']", title: "tour.kpi.title", text: "tour.kpi.text" },
  { target: "[data-tour='pipeline']", title: "tour.pipeline.title", text: "tour.pipeline.text" },
  { target: "[data-tour='new-candidate']", title: "tour.newCandidate.title", text: "tour.newCandidate.text" },
];

type Completion = "completed" | "skipped";

export function ProductTour({
  userId,
  steps,
  locale = "nl-NL",
  onComplete,
}: {
  userId: string;
  steps: readonly TourStep[];
  locale?: Locale;
  onComplete?: (result: Completion) => void;
}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const priorFocus = useRef<HTMLElement | null>(null);
  const key = `talentstroom:tour:v1:${encodeURIComponent(userId)}`;
  const tr = (message: MessageKey) => t(locale, message);
  const finish = useCallback(
    (result: Completion) => {
      try {
        localStorage.setItem(key, result);
      } catch {
        /* Completion still applies in memory. */
      }
      setIndex(null);
      onComplete?.(result);
      window.setTimeout(() => priorFocus.current?.focus(), reduced ? 0 : 200);
    },
    [key, onComplete, reduced],
  );

  useEffect(() => {
    if (!userId || !steps.length) return undefined;
    try {
      if (localStorage.getItem(key)) return undefined;
    } catch {
      /* Storage may be disabled; the tour remains usable for this visit. */
    }
    const timer = window.setTimeout(() => {
      priorFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setIndex(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [key, steps.length, userId]);

  useEffect(() => {
    if (index === null) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>("button:not([disabled])")];
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish("skipped");
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [finish, index]);

  if (index === null || !steps[index]) return null;
  const step = steps[index];
  const target = document.querySelector<HTMLElement>(step.target);
  const rect = target?.getBoundingClientRect();
  const style = rect
    ? { left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }
    : undefined;
  const pointer = rect ? { left: rect.left + rect.width / 2 - 12, top: rect.top + rect.height / 2 - 12 } : undefined;
  return createPortal(
    <div className="product-tour" data-reduced-motion={reduced || undefined}>
      <div className="product-tour__shade" aria-hidden="true" />
      {style && (
        <m.div
          className="product-tour__spotlight"
          aria-hidden="true"
          initial={false}
          animate={style}
          transition={{ duration: reduced ? 0 : 0.2 }}
        />
      )}
      {pointer && (
        <m.span
          className="product-tour__pointer"
          aria-hidden="true"
          initial={false}
          animate={pointer}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 2v17l5-5 3 7 3-1-3-7h7L4 2z" />
          </svg>
        </m.span>
      )}
      <dialog
        ref={dialogRef}
        className="product-tour__card"
        open
        aria-label={tr("tour.dialog")}
        aria-labelledby="product-tour-title"
        aria-describedby="product-tour-text"
        tabIndex={-1}
      >
        <div className="product-tour__progress" aria-label={tr("tour.progress")}>
          {steps.map((_, item) => (
            <span key={steps[item]?.target} className={item === index ? "is-current" : item < index ? "is-done" : ""} />
          ))}
        </div>
        <p className="product-tour__count" aria-live="polite">
          {t(locale, "tour.step", { current: index + 1, total: steps.length })}
        </p>
        <h2 id="product-tour-title">{tr(step.title)}</h2>
        <p id="product-tour-text">{tr(step.text)}</p>
        <div className="product-tour__actions">
          <Button variant="ghost" onClick={() => finish("skipped")}>
            {tr("tour.skip")}
          </Button>
          {index > 0 && (
            <Button variant="secondary" onClick={() => setIndex(index - 1)}>
              {tr("tour.back")}
            </Button>
          )}
          <Button onClick={() => (index === steps.length - 1 ? finish("completed") : setIndex(index + 1))}>
            {tr(index === steps.length - 1 ? "tour.finish" : "tour.next")}
          </Button>
        </div>
      </dialog>
    </div>,
    document.body,
  );
}
