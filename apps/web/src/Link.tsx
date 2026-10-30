import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { navigate } from "./navigate.ts";
export function Link({
  to,
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; children: ReactNode }) {
  return (
    <a
      {...props}
      href={to}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) navigate(to, event);
      }}
    >
      {children}
    </a>
  );
}
