import { Badge, Button, Card, Icon, StatusPill, Tabs, TextField } from "@talentstroom/ui";
import { DEFAULT_LOCALE, t } from "@talentstroom/i18n";
import type { MessageKey } from "@talentstroom/i18n";

const locale = DEFAULT_LOCALE;
const tr = (key: MessageKey) => t(locale, key);

const tones = ["neutral", "success", "warning", "danger", "info"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBlock: 32 }}>
      <h2 style={{ fontSize: "var(--ts-font-size-lg)" }}>{title}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>{children}</div>
    </section>
  );
}

/** Dev-only showcase of every core component and state. Open with `?gallery`. */
export function ComponentGallery() {
  return (
    <main style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: "var(--ts-font-size-2xl)" }}>{tr("gallery.title")}</h1>
      <p>{tr("gallery.intro")}</p>

      <Section title={tr("gallery.buttons")}>
        <Button>{tr("gallery.buttons.primary")}</Button>
        <Button variant="secondary">{tr("gallery.buttons.secondary")}</Button>
        <Button variant="ghost">{tr("gallery.buttons.ghost")}</Button>
        <Button variant="danger" icon="delete">
          {tr("gallery.buttons.danger")}
        </Button>
        <Button disabled>{tr("gallery.buttons.disabled")}</Button>
        <Button loading loadingLabel={tr("gallery.buttons.loadingLabel")}>
          {tr("gallery.buttons.loading")}
        </Button>
        <Button icon="add">{tr("gallery.buttons.withIcon")}</Button>
        <Button size="sm">{tr("gallery.buttons.small")}</Button>
        <Button size="lg" iconPosition="end" icon="arrow_forward">
          {tr("gallery.buttons.large")}
        </Button>
      </Section>

      <Section title={tr("gallery.fields")}>
        <TextField label={tr("gallery.fields.name")} hint={tr("gallery.fields.nameHint")} />
        <TextField
          label={tr("gallery.fields.email")}
          type="email"
          defaultValue="x@"
          error={tr("gallery.fields.emailError")}
        />
        <TextField label={tr("gallery.fields.required")} required />
        <TextField label={tr("gallery.fields.disabled")} disabled />
      </Section>

      <Section title={tr("gallery.badges")}>
        {tones.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tr(`gallery.badges.${tone}`)}
          </Badge>
        ))}
        {tones.map((tone) => (
          <StatusPill key={tone} tone={tone}>
            {tr(`gallery.badges.${tone}`)}
          </StatusPill>
        ))}
      </Section>

      <Section title={tr("gallery.cards")}>
        <Card
          as="section"
          title={tr("gallery.cards.title")}
          actions={
            <Button variant="ghost" size="sm">
              {tr("gallery.cards.action")}
            </Button>
          }
        >
          {tr("gallery.cards.body")}
        </Card>
        <Card>{tr("gallery.cards.plain")}</Card>
      </Section>

      <Section title={tr("gallery.tabs")}>
        <div style={{ width: "100%" }}>
          <Tabs
            label={tr("gallery.tabs.label")}
            tabs={[
              {
                id: "overview",
                label: tr("gallery.tabs.overview"),
                icon: "person",
                panel: tr("gallery.tabs.overviewPanel"),
              },
              { id: "notes", label: tr("gallery.tabs.notes"), panel: tr("gallery.tabs.notesPanel") },
              { id: "documents", label: tr("gallery.tabs.documents"), panel: tr("gallery.tabs.documentsPanel") },
              {
                id: "archived",
                label: tr("gallery.tabs.archived"),
                panel: tr("gallery.tabs.archivedPanel"),
                disabled: true,
              },
            ]}
          />
        </div>
      </Section>

      <Section title={tr("gallery.icons")}>
        <span>
          <Icon name="search" /> {tr("gallery.icons.decorative")}
        </span>
        <span>
          <Icon name="warning" label={tr("gallery.icons.label")} /> {tr("gallery.icons.labelled")}
        </span>
      </Section>
    </main>
  );
}
