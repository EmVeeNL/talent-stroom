import { cx } from "../classnames.ts";
export interface SkeletonProps {
  variant?: "table" | "card" | "profile";
  shape?: "text" | "avatar" | "card" | "rows";
  lines?: number;
  className?: string;
}
/** Mark the containing content region aria-busy while these decorative shapes are present. */
export function Skeleton({ shape = "text", variant, lines = 3, className }: SkeletonProps) {
  if (variant === "table" || variant === "profile")
    return (
      <div aria-hidden="true" className={cx("ts-skeleton", `ts-skeleton--${variant}`, className)}>
        {Array.from({ length: variant === "profile" ? 1 : Math.max(1, lines) }, (_, index) => (
          <div className="ts-skeleton__row" key={index}>
            <span className="ts-skeleton__portrait" />
            <div className="ts-skeleton__details">
              <span />
              <span />
            </div>
          </div>
        ))}
      </div>
    );
  const preset = variant ?? shape;
  return (
    <div aria-hidden="true" className={cx("ts-skeleton", `ts-skeleton--${preset}`, className)}>
      {Array.from({ length: shape === "avatar" ? 1 : Math.max(1, lines) }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
