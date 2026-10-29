/* Render props provide the dialog close action. */
/* eslint-disable react/no-unstable-nested-components */
import { useState } from "react";
import { AlertDialog, Button, Dialog, HoverCard, Icon, Popover, Sheet, TextField, Tooltip } from "@talentstroom/ui";
import { useGallery } from "../context.ts";
import { Section } from "../Section.tsx";
export function Overlays() {
  const { tr } = useGallery();
  const [result, setResult] = useState("");
  const profile = (
    <>
      <h3>{tr("gallery.overlays.profileName")}</h3>
      <p>{tr("gallery.overlays.profileSummary")}</p>
      <p>{tr("gallery.candidate")}</p>
    </>
  );
  return (
    <>
      <Section title={tr("gallery.overlays.previews")}>
        <p className="gallery-overlay-intro">{tr("gallery.overlays.previewHint")}</p>
        <Tooltip content={tr("gallery.overlays.helpText")}>
          <Button variant="ghost" aria-label={tr("gallery.overlays.help")}>
            <Icon name="help" />
          </Button>
        </Tooltip>
        <HoverCard content={profile}>
          <a href="#candidate-preview">{tr("gallery.overlays.profileLink")}</a>
        </HoverCard>
        <Popover
          label={tr("gallery.overlays.actions")}
          trigger={
            <Button variant="secondary" icon="more_horiz">
              {tr("gallery.overlays.actions")}
            </Button>
          }
        >
          <TextField label={tr("gallery.overlays.note")} />
          <Button onClick={() => setResult(tr("gallery.overlays.savedNote"))}>{tr("gallery.overlays.addNote")}</Button>
        </Popover>
      </Section>
      <Section title={tr("gallery.overlays.modals")}>
        <Sheet
          title={tr("gallery.overlays.profileName")}
          triggerLabel={tr("gallery.overlays.quickView")}
          closeLabel={tr("gallery.close")}
        >
          {profile}
        </Sheet>
        <Sheet
          side="left"
          title={tr("gallery.nav.candidates")}
          triggerLabel={tr("gallery.overlays.leftSheet")}
          closeLabel={tr("gallery.close")}
        >
          {profile}
        </Sheet>
        <Dialog
          title={tr("gallery.overlays.newClient")}
          triggerLabel={tr("gallery.overlays.newClient")}
          closeLabel={tr("gallery.close")}
        >
          {(close) => (
            <form
              className="gallery-overlay-form"
              onSubmit={(event) => {
                event.preventDefault();
                setResult(tr("gallery.overlays.clientSaved"));
                close();
              }}
            >
              <TextField label={tr("gallery.overlays.clientName")} required />
              <TextField label={tr("gallery.fields.email")} type="email" required />
              <div className="gallery-overlay-actions">
                <Button variant="secondary" onClick={close}>
                  {tr("gallery.overlays.cancel")}
                </Button>
                <Button type="submit">{tr("gallery.overlays.saveClient")}</Button>
              </div>
            </form>
          )}
        </Dialog>
        <AlertDialog
          title={tr("gallery.overlays.deleteTitle")}
          triggerLabel={tr("gallery.buttons.danger")}
          cancelLabel={tr("gallery.overlays.cancel")}
          confirmLabel={tr("gallery.buttons.danger")}
          onConfirm={() => setResult(tr("gallery.overlays.deleted"))}
        >
          <p>{tr("gallery.overlays.deleteBody")}</p>
        </AlertDialog>
      </Section>
      <Section title={tr("gallery.overlays.dialogSizes")}>
        <Dialog
          size="sm"
          title={tr("gallery.overlays.small")}
          triggerLabel={tr("gallery.overlays.small")}
          closeLabel={tr("gallery.close")}
          footer={(close) => <Button onClick={close}>{tr("gallery.close")}</Button>}
        >
          {profile}
        </Dialog>
        <Dialog
          size="lg"
          title={tr("gallery.overlays.large")}
          triggerLabel={tr("gallery.overlays.large")}
          closeLabel={tr("gallery.close")}
          footer={(close) => <Button onClick={close}>{tr("gallery.close")}</Button>}
        >
          {profile}
        </Dialog>
      </Section>
      <section id="candidate-preview" aria-label={tr("gallery.overlays.profileLink")}>
        {profile}
      </section>
      <output>{result}</output>
    </>
  );
}
