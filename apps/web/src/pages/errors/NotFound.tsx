import type { Locale } from "@talentstroom/i18n";
import { ErrorPage } from "../paginas/Foutpaginas.tsx";
export default function NotFound({ locale }: { locale: Locale }) {
  return <ErrorPage locale={locale} kind="404" standalone />;
}
