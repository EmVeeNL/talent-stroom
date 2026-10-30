import { useState } from "react";
import type { Locale } from "@talentstroom/i18n";
import { TextField } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import { DemoAuthFrame } from "./DemoAuthFrame.tsx";

export default function TwoStep({ locale }: { locale: Locale }) {
  const [code, setCode] = useState("");
  return (
    <DemoAuthFrame locale={locale} title={t(locale, "demo.auth.twoStep")} submitLabel={t(locale, "demo.auth.continue")}>
      <p>{t(locale, "demo.auth.twoStepHelp")}</p>
      <TextField
        label={t(locale, "demo.auth.codeLabel")}
        name="code"
        value={code}
        onChange={(event) => setCode(event.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        pattern="[0-9]{6}"
        placeholder="000000"
        required
      />
    </DemoAuthFrame>
  );
}
