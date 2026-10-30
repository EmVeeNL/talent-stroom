import type { ReactNode } from "react";
/** Split auth frame with a replaceable hero slot. */
export function AuthLayout({
  hero,
  controls,
  children,
}: {
  hero: ReactNode;
  controls: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand">{hero}</aside>
      <div className="auth-panel">
        <div className="auth-controls">{controls}</div>
        {children}
      </div>
    </div>
  );
}
