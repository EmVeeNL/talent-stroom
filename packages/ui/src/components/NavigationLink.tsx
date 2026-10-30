import { createContext, useContext } from "react";
import type { ComponentPropsWithRef, ElementType } from "react";

/** Host applications can supply their router link without coupling UI to a router. */
export const NavigationLinkContext = createContext<ElementType<ComponentPropsWithRef<"a">>>("a");
export function NavigationLink(props: ComponentPropsWithRef<"a">) {
  const Component = useContext(NavigationLinkContext);
  return <Component {...props} />;
}
