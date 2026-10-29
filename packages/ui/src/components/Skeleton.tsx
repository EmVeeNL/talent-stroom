import { cx } from "../classnames.ts";
export interface SkeletonProps {
  shape?: "text" | "avatar" | "card" | "rows";
  lines?: number;
  className?: string;
}
/** Mark the containing content region aria-busy while these decorative shapes are present. */
export function Skeleton({ shape = "text", lines = 3, className }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cx("ts-skeleton", `ts-skeleton--${shape}`, className)}>
      {Array.from({ length: shape === "avatar" ? 1 : Math.max(1, lines) }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
