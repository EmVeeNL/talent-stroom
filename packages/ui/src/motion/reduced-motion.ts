import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  const observer = new MutationObserver(notify);
  media.addEventListener("change", notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    media.removeEventListener("change", notify);
    observer.disconnect();
  };
};
const snapshot = () =>
  window.matchMedia(query).matches || document.documentElement.getAttribute("data-motion") === "reduce";

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
