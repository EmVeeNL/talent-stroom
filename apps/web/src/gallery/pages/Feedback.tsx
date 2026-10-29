import { useState } from "react";
import { AlertBanner, Button, Skeleton, Switch, Toaster, useToast } from "@talentstroom/ui";
import type { FeedbackTone } from "@talentstroom/ui";
import { useGallery } from "../context.ts";
import { Section } from "../Section.tsx";
const tones = ["info", "success", "warning", "danger"] as const;
function FeedbackExamples() {
  const { tr } = useGallery();
  const { toast } = useToast();
  const [hidden, setHidden] = useState<FeedbackTone[]>([]);
  const [loading, setLoading] = useState(true);
  const notify = (tone: FeedbackTone) => toast({ tone, message: tr(`gallery.overlays.${tone}`) });
  return (
    <>
      <Section title={tr("gallery.overlays.notifications")}>
        <p className="gallery-overlay-intro">{tr("gallery.overlays.noticeHint")}</p>
        {tones.map((tone) => (
          <Button key={tone} variant={tone === "danger" ? "danger" : "secondary"} onClick={() => notify(tone)}>
            {tr(`gallery.overlays.${tone}Label`)}
          </Button>
        ))}
      </Section>
      <Section title={tr("gallery.overlays.banners")}>
        {tones
          .filter((tone) => !hidden.includes(tone))
          .map((tone) => (
            <AlertBanner
              key={tone}
              tone={tone}
              dismissLabel={tr("gallery.close")}
              onDismiss={() => setHidden((previous) => [...previous, tone])}
              action={
                tone === "danger" ? (
                  <Button variant="secondary" onClick={() => notify("success")}>
                    {tr("gallery.overlays.retry")}
                  </Button>
                ) : undefined
              }
            >
              {tr(`gallery.overlays.${tone}`)}
            </AlertBanner>
          ))}
        {hidden.length > 0 && (
          <Button variant="ghost" onClick={() => setHidden([])}>
            {tr("gallery.overlays.restore")}
          </Button>
        )}
      </Section>
      <Section title={tr("gallery.overlays.loaders")}>
        <Switch label={tr("gallery.overlays.loadingToggle")} checked={loading} onChange={setLoading} />
        <p className="gallery-overlay-intro">{tr("gallery.overlays.loadingHint")}</p>
        <section className="gallery-loading-list" aria-busy={loading} aria-label={tr("gallery.nav.candidates")}>
          {loading ? (
            <>
              <output>{tr("gallery.overlays.loading")}</output>
              <Skeleton shape="rows" lines={3} />
            </>
          ) : (
            <>
              <h3>{tr("gallery.overlays.profileName")}</h3>
              <p>{tr("gallery.overlays.profileSummary")}</p>
              <p>{tr("gallery.candidate")}</p>
            </>
          )}
        </section>
      </Section>
      <Section title={tr("gallery.overlays.placeholderShapes")}>
        <div className="gallery-skeleton-examples" aria-busy="true">
          <Skeleton shape="avatar" />
          <Skeleton lines={3} />
          <Skeleton shape="card" />
          <Skeleton shape="rows" lines={2} />
        </div>
      </Section>
    </>
  );
}
export function Feedback() {
  const { tr } = useGallery();
  return (
    <Toaster label={tr("gallery.notifications")} closeLabel={tr("gallery.close")}>
      <FeedbackExamples />
    </Toaster>
  );
}
