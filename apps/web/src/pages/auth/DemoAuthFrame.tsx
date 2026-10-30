import { Link } from "../../Link.tsx";
import type { ReactNode } from "react";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Button, Logo, TextField, Toaster, useToast } from "@talentstroom/ui";
import { AuthLayout } from "../../layouts/AuthLayout.tsx";
import { AuthHero } from "../../layouts/AuthHero.tsx";

export function DemoAuthFrame({
  locale,
  title,
  submitLabel,
  children,
}: {
  locale: Locale;
  title: string;
  submitLabel?: string;
  children: ReactNode;
}) {
  return (
    <Toaster label={t(locale, "demo.auth.notifications")} closeLabel={t(locale, "demo.auth.close")}>
      <DemoAuthContent locale={locale} title={title} {...(submitLabel ? { submitLabel } : {})}>
        {children}
      </DemoAuthContent>
    </Toaster>
  );
}

function DemoAuthContent({
  locale,
  title,
  submitLabel,
  children,
}: {
  locale: Locale;
  title: string;
  submitLabel?: string;
  children: ReactNode;
}) {
  const { toast: pushToast } = useToast();
  return (
    <AuthLayout
      controls={null}
      hero={
        <>
          <AuthHero />
          <Link to="/inloggen" className="auth-wordmark" aria-label={t(locale, "app.name")}>
            <Logo tone="dark" size="lg" />
          </Link>
          <div className="auth-brand-copy">
            <h2 className="auth-brand-title">{t(locale, "auth.brandLine")}</h2>
            <p>{t(locale, "auth.brandText")}</p>
          </div>
        </>
      }
    >
      <main className="auth-content">
        <section className="auth-card">
          <Logo className="auth-card-logo" size="md" />
          <h1>{title}</h1>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              pushToast({ tone: "info", message: t(locale, "demo.auth.toast") });
            }}
          >
            {children}
            <Button type="submit">{submitLabel ?? t(locale, "demo.auth.try")}</Button>
          </form>
        </section>
      </main>
    </AuthLayout>
  );
}

export function DemoPassword({ label }: { label: string }) {
  return <TextField label={label} name="password" type="password" autoComplete="current-password" />;
}
