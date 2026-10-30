import { expect, it } from "vitest";
import { navigation } from "./navigation.ts";
import { findRoute, routeTable, routes, visibleRoutes } from "./routes.ts";

it("keeps every sidebar destination represented by one dashboard route", () => {
  expect(new Set(navigation.map((item) => item.path))).toEqual(new Set(routes.map((route) => route.path)));
  expect(routes.every((route) => route.layout === "dashboard" && route.access === "member")).toBe(true);
});
it("keeps auth routes public and includes the member 404 fallback in the typed table", () => {
  expect(routeTable.filter((route) => route.layout === "auth").every((route) => route.access === "public")).toBe(true);
  expect(routeTable.find((route) => route.path === "*")?.access).toBe("member");
});
it("filters demo pages while retaining recruitment as the default route", () => {
  expect(visibleRoutes(false).map((route) => route.path)).toEqual(["/"]);
  expect(findRoute("/apps/chat", false)).toBeUndefined();
  expect(findRoute("/", false)?.path).toBe("/");
  expect(visibleRoutes(true).length).toBe(routes.length);
});
