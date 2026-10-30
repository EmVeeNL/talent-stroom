import { useEffect, useId, useRef } from "react";

export interface ErrorSummaryProps {
  title: string;
  errors: readonly { id: string; label: string; message: string }[];
  /** Increment on each invalid submit. Blur validation must not move focus. */
  focusRequest: number;
}

export function ErrorSummary({ title, errors, focusRequest }: ErrorSummaryProps) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (focusRequest > 0) ref.current?.focus();
  }, [focusRequest]);
  if (!errors.length) return null;
  return (
    <section ref={ref} tabIndex={-1} role="region" aria-labelledby={id} className="ts-error-summary">
      <h2 id={id}>{title}</h2>
      <ul>
        {errors.map((error) => (
          <li key={error.id}>
            <a
              href={`#${error.id}`}
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(error.id);
                const control = target?.matches("input, select, textarea")
                  ? target
                  : target?.querySelector<HTMLElement>("input, select, textarea");
                control?.focus();
              }}
            >
              {error.label}: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
