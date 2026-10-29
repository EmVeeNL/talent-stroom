import { useId } from "react";
import type { HTMLAttributes } from "react";
import { cx } from "../classnames.ts";

export type LogoVariant = "mark" | "full";
/** `auto` follows the active theme; `light` is for light surfaces; `dark` is for dark (navy) surfaces. */
export type LogoTone = "auto" | "light" | "dark";
export type LogoSize = "sm" | "md" | "lg" | "xl";

export interface LogoProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  variant?: LogoVariant;
  tone?: LogoTone;
  size?: LogoSize;
  /** Accessible name; defaults to the brand name. */
  label?: string;
  /** Hide from assistive technology, for use next to visible text. */
  decorative?: boolean;
}

/**
 * Path data mirrors `brand/talentstroom-mark.svg`, the single source of the mark
 * (logo.test.tsx fails when they drift).
 */
export const MARK_VIEWBOX = "0 0 151 126";
export const MARK_PATHS = {
  small: "M0.4 111.2C2 90 14 70 34 60c8-4 18-4 26-2l25 5C68 66 52 68 42 78C32 88 10 100 0.4 111.2Z",
  big: "M3.5 125.2C7 112 17 96 36 86s30-12 48-14c26-3 46-13 66.8-36C150 60 140 90 122 104c-12 8-24 10-37 9-15-1-30-4-45-4s-28 8-36.5 16.2Z",
} as const;

function Mark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox={MARK_VIEWBOX} fill="none" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#2f5bff" />
          <stop offset=".55" stopColor="#1744ff" />
          <stop offset="1" stopColor="#0a2aae" />
        </linearGradient>
        <linearGradient id={`${id}b`} gradientUnits="userSpaceOnUse" x1="10" y1="124" x2="140" y2="40">
          <stop stopColor="#0a3cff" />
          <stop offset=".4" stopColor="#0899dc" />
          <stop offset=".65" stopColor="#05c4b4" />
          <stop offset="1" stopColor="#22f08b" />
        </linearGradient>
        <linearGradient id={`${id}s`} gradientUnits="userSpaceOnUse" x1="2" y1="110" x2="80" y2="58">
          <stop stopColor="#0fb0e8" />
          <stop offset="1" stopColor="#34f6b0" />
        </linearGradient>
      </defs>
      <circle cx="76.8" cy="26.1" r="26.9" fill={`url(#${id}h)`} />
      <path d={MARK_PATHS.small} fill={`url(#${id}s)`} />
      <path d={MARK_PATHS.big} fill={`url(#${id}b)`} />
    </svg>
  );
}

/** TalentStroom person/wave mark, optionally with the "Talent" + "Stroom" wordmark set in Asap Sharp. */
export function Logo({
  variant = "full",
  tone = "auto",
  size = "md",
  label = "TalentStroom",
  decorative = false,
  className,
  ...rest
}: LogoProps) {
  const a11y = decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label };
  return (
    <span
      {...rest}
      {...a11y}
      data-tone={tone}
      data-variant={variant}
      className={cx("ts-logo", `ts-logo--${size}`, className)}
    >
      <Mark className="ts-logo__mark" />
      {variant === "full" ? (
        <span className="ts-logo__word" aria-hidden="true">
          <span className="ts-logo__talent">Talent</span>
          <span className="ts-logo__stroom">Stroom</span>
        </span>
      ) : null}
    </span>
  );
}
