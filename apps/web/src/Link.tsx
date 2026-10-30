import { Link as RouterLink, useRouter } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { routes, demoAuthRoutes, type authRouteTitles } from "./routes.ts";

const authPaths = [
  "/inloggen",
  "/registreren",
  "/e-mail-bevestigen",
  "/wachtwoord-vergeten",
  "/wachtwoord-herstellen",
  "/organisatie-kiezen",
] as const;
type Destination =
  | (typeof routes)[number]["path"]
  | (typeof demoAuthRoutes)[number]["path"]
  | keyof typeof authRouteTitles;
// The gallery also renders auth examples outside the application router.
export function Link({
  to,
  target,
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: Destination; hash?: string; children?: ReactNode }) {
  const router = useRouter({ warn: false });
  return router && (props.download === undefined || props.download === false) ? (
    <RouterLink to={to} target={target ?? "_self"} {...props}>
      {children}
    </RouterLink>
  ) : (
    <a href={to} target={target} {...props}>
      {children}
    </a>
  );
}
/** Adapter for router-independent UI anchors (sidebar, breadcrumb and organization picker). */
export function RouterAnchor({ href, target, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (props.download !== undefined && props.download !== false)
    return (
      <a href={href} target={target} {...props}>
        {children}
      </a>
    );
  const destination = [...routes, ...demoAuthRoutes].find((route) => route.path === href)?.path;
  if (destination)
    return (
      <RouterLink to={destination} target={target ?? "_self"} {...props}>
        {children}
      </RouterLink>
    );
  const authDestination = authPaths.find((path) => path === href);
  if (authDestination)
    return (
      <RouterLink to={authDestination} target={target ?? "_self"} {...props}>
        {children}
      </RouterLink>
    );
  return (
    <a href={href} target={target} {...props}>
      {children}
    </a>
  );
}
