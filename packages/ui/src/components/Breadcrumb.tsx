import { cx } from "../classnames.ts";
export interface BreadcrumbProps {
  label: string;
  items: readonly { label: string; href?: string }[];
  className?: string;
}
export function Breadcrumb({ label, items, className }: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={cx("ts-breadcrumb", className)}>
      <ol>
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`}>
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {index === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <a href={item.href ?? "/"}>{item.label}</a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
