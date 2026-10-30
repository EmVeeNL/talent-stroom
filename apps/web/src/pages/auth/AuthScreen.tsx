import type { Locale } from "@talentstroom/i18n";
import type { Transport } from "../../auth.ts";
import { AuthScreens } from "./AuthFlow.tsx";

export interface AuthScreenProps {
  locale: Locale;
  query: string;
  transport: Transport;
  onSignedIn: () => void;
  previewError?: boolean;
}

export function createAuthScreen(path: string) {
  return function AuthScreen(props: AuthScreenProps) {
    return <AuthScreens {...props} path={path} />;
  };
}
