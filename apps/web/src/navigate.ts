import { knownTitles } from "./routes.ts";
export function navigate(
  to: string,
  event?: Pick<MouseEvent, "button" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">,
) {
  const url = new URL(to, window.location.href);
  if (
    url.origin !== window.location.origin ||
    (event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey))
  )
    return false;
  if (!knownTitles[url.pathname]) return false;
  window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
  return true;
}
