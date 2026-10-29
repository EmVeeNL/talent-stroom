import { useState } from "react";
import { cx } from "../classnames.ts";
export interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}
export function Avatar({ name, src, size = "md" }: AvatarProps) {
  const [failed, setFailed] = useState<string>();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toLocaleUpperCase("nl-NL");
  return src && failed !== src ? (
    <img className={cx("ts-avatar", `ts-avatar--${size}`)} src={src} alt={name} onError={() => setFailed(src)} />
  ) : (
    <span className={cx("ts-avatar", `ts-avatar--${size}`)} role="img" aria-label={name}>
      {initials}
    </span>
  );
}
