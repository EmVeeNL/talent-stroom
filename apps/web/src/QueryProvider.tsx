import { createContext, lazy, Suspense, useContext } from "react";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { DataLayer } from "./query.ts";
const DataContext = createContext<DataLayer | null>(null);
export const useDataLayer = () => useContext(DataContext);
const Devtools = import.meta.env.DEV
  ? lazy(() => import("@tanstack/react-query-devtools").then((module) => ({ default: module.ReactQueryDevtools })))
  : null;
export function QueryProvider({
  layer,
  synthetic,
  children,
}: {
  layer: DataLayer;
  synthetic: boolean;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={layer.client}>
      <DataContext value={layer}>{children}</DataContext>
      {Devtools && synthetic && !navigator.webdriver && !new URLSearchParams(window.location.search).has("preview") && (
        <Suspense fallback={null}>
          <Devtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
