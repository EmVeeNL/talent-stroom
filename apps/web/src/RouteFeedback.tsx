import { Button, Skeleton } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";

export default function RoutePending() {
  return <Skeleton variant="card" lines={3} />;
}
export function RouteError({ locale, onRetry }: { locale: Locale; onRetry: () => void }) {
  return (
    <>
      <p role="alert">{t(locale, "auth.error")}</p>
      <Button onClick={onRetry}>{t(locale, "auth.retry")}</Button>
    </>
  );
}
