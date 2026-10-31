import { useState } from "react";
import { AlertBanner, EmptyState, Button, Skeleton, Switch, Toast, Toaster, useToast } from "@talentstroom/ui";
import type { FeedbackTone } from "@talentstroom/ui";
import { useGallery } from "../context.ts";
import { Section } from "../Section.tsx";
const tones = ["info", "success", "warning", "danger"] as const;
function FeedbackExamples() {
  const { tr } = useGallery();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState<FeedbackTone[]>([]);
  const [hidden, setHidden] = useState<FeedbackTone[]>([]);
  const [loading, setLoading] = useState(true);
  const notify = (tone: FeedbackTone) => toast({ tone, message: tr(`gallery.overlays.${tone}`) });
  return (
    <>
      <Section title={tr("gallery.overlays.notifications")}>
        <div className="gallery-feedback-board">
          {tones
            .filter((tone) => !dismissed.includes(tone))
            .map((tone) => (
              <Toast
                key={tone}
                tone={tone}
                title={tr(`gallery.overlays.${tone}`)}
                duration={0}
                closeLabel={tr("gallery.close")}
                onDismiss={() => setDismissed((items) => [...items, tone])}
                action={
                  tone === "danger" ? (
                    <Button variant="ghost" onClick={() => notify("success")}>
                      {tr("gallery.overlays.retry")}
                    </Button>
                  ) : undefined
                }
              >
                {tr("gallery.overlays.toastBody")}
              </Toast>
            ))}
          {dismissed.length > 0 && (
            <Button variant="ghost" onClick={() => setDismissed([])}>
              {tr("gallery.overlays.restore")}
            </Button>
          )}
        </div>
      </Section>
      <Section title={tr("gallery.toast.variants")}>
        <p>{tr("gallery.toast.variantsHint")}</p>
        <div className="gallery-feedback-board">
          <Toast
            tone="success"
            title={tr("gallery.toast.title")}
            duration={0}
            closeLabel={tr("gallery.close")}
            onDismiss={() => {}}
          >
            {tr("gallery.toast.titleAndMessage")}
          </Toast>
          <Toast tone="info" duration={0} closeLabel={tr("gallery.close")} onDismiss={() => {}}>
            {tr("gallery.toast.messageOnly")}
          </Toast>
          <Toast tone="warning" icon={false} duration={0} closeLabel={tr("gallery.close")} onDismiss={() => {}}>
            {tr("gallery.toast.noIcon")}
          </Toast>
          <Toast
            tone="danger"
            duration={0}
            closeLabel={tr("gallery.close")}
            onDismiss={() => {}}
            action={<Button variant="ghost">{tr("gallery.toast.undo")}</Button>}
          >
            {tr("gallery.toast.withAction")}
          </Toast>
          <Toast tone="info" persistent closeLabel={tr("gallery.close")} onDismiss={() => {}}>
            {tr("gallery.toast.persistent")}
          </Toast>
        </div>
        <div className="gallery-feedback-board">
          <Button onClick={() => toast({ tone: "info", message: tr("gallery.toast.timed"), duration: 8000 })}>
            {tr("gallery.toast.timed")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast({ tone: "warning", message: tr("gallery.toast.persistent"), persistent: true })}
          >
            {tr("gallery.toast.persistent")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              for (const tone of tones) toast({ tone, icon: tone !== "info", message: tr(`gallery.overlays.${tone}`) });
            }}
          >
            {tr("gallery.toast.stack")}
          </Button>
        </div>
      </Section>
      <Section title={tr("gallery.empty.title")}>
        {(["records", "results", "error"] as const).map((kind) => (
          <EmptyState
            key={kind}
            variant={kind === "records" ? "no-records" : kind === "results" ? "no-results" : "error"}
            title={tr(`gallery.empty.${kind}`)}
            body={tr(`gallery.empty.${kind}Body`)}
            action={
              <Button variant={kind === "records" ? "primary" : "secondary"} onClick={() => notify("success")}>
                {tr(
                  kind === "records"
                    ? "gallery.empty.add"
                    : kind === "results"
                      ? "gallery.empty.clear"
                      : "gallery.empty.retry",
                )}
              </Button>
            }
          />
        ))}
      </Section>
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
              <Skeleton variant="table" lines={3} />
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
          {(["table", "card", "profile"] as const).map((variant) => (
            <div key={variant}>
              <h3>
                {tr(
                  variant === "table"
                    ? "gallery.overlays.skeletonTable"
                    : variant === "card"
                      ? "gallery.overlays.skeletonCard"
                      : "gallery.overlays.skeletonProfile",
                )}
              </h3>
              <Skeleton variant={variant} lines={3} />
            </div>
          ))}
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
