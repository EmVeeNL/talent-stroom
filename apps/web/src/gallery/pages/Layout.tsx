import { useState } from "react";
import { Sidebar, Header, Breadcrumb, CommandPalette, Kbd, Button, Card, Icon, Logo, Tabs } from "@talentstroom/ui";
import { Section } from "../Section.tsx";
import { useGallery } from "../context.ts";
export function Layout() {
  const { tr } = useGallery();
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("dashboard");
  const nav = (
    [
      ["dashboard", "dashboard"],
      ["vacancies", "work"],
      ["candidates", "group"],
      ["clients", "business"],
      ["tasks", "checklist"],
    ] as const
  ).map(([id, icon]) => ({
    id,
    icon,
    label: tr(`gallery.nav.${id}`),
    href: "#layout",
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setActive(id);
    },
  }));
  const actions = nav.map((item) => ({
    id: item.id,
    label: item.label,
    group: tr("gallery.pages"),
    onSelect: () => setActive(item.id),
  }));

  return (
    <>
      <Section title={tr("gallery.frame")}>
        <div className="gallery-frame">
          <Sidebar
            label={tr("gallery.navigation")}
            collapsed={collapsed}
            workspace={
              <span className="gallery-workspace">
                <Logo variant={collapsed ? "mark" : "full"} tone="dark" size="sm" decorative />
                {collapsed ? (
                  <span className="ts-visually-hidden">{tr("gallery.workspace")}</span>
                ) : (
                  tr("gallery.workspace")
                )}
              </span>
            }
            items={[
              ...nav.slice(0, 1),
              { id: "recruitment", label: tr("gallery.recruitment"), icon: "work", children: nav.slice(1) },
            ]}
            activeId={active}
          />
          <div className="gallery-frame__body">
            <Header
              search={
                <CommandPalette
                  label={tr("gallery.search")}
                  triggerLabel={tr("gallery.search")}
                  closeLabel={tr("gallery.close")}
                  emptyLabel={tr("gallery.noResults")}
                  actions={[
                    ...actions,
                    {
                      id: "new-candidate",
                      label: tr("gallery.buttons.withIcon"),
                      group: tr("gallery.actions"),
                      onSelect: () => setActive("candidates"),
                    },
                  ]}
                />
              }
              notifications={
                <Button
                  variant="ghost"
                  aria-label={tr("gallery.notifications")}
                  icon="notifications"
                  onClick={() => setActive("tasks")}
                />
              }
              userMenu={
                <details className="gallery-user">
                  <summary>{tr("gallery.user")}</summary>
                  <p>{tr("gallery.userRole")}</p>
                </details>
              }
            />
            <div className="gallery-frame__content">
              <Breadcrumb
                label={tr("gallery.breadcrumb")}
                items={[
                  { label: tr("gallery.workspace"), href: "#layout" },
                  { label: nav.find((item) => item.id === active)?.label ?? tr("gallery.nav.dashboard") },
                ]}
              />
              <h2>{nav.find((item) => item.id === active)?.label}</h2>
              <p>{tr("gallery.sample")}</p>
              <Card title={tr("gallery.vacancy")}>
                <p>{tr("gallery.client")}</p>
                <p>{tr("gallery.candidate")}</p>
              </Card>
              <p>
                <Kbd>⌘</Kbd> / <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
              </p>
              <Button variant="secondary" aria-pressed={collapsed} onClick={() => setCollapsed(!collapsed)}>
                {tr(collapsed ? "gallery.expand" : "gallery.collapse")}
              </Button>
            </div>
          </div>
        </div>
      </Section>{" "}
      <Section title={tr("gallery.brand")}>
        <div className="gallery-brand">
          {(
            [
              ["light", "gallery.brand.light"],
              ["dark", "gallery.brand.dark"],
              ["sidebar", "gallery.brand.sidebar"],
            ] as const
          ).map(([surface, title]) => (
            <figure key={surface} className={`gallery-brand__panel gallery-brand__panel--${surface}`}>
              <figcaption>{tr(title)}</figcaption>
              <p>{tr("gallery.brand.mark")}</p>
              <div className="gallery-brand__row">
                {(["sm", "md", "lg", "xl"] as const).map((size) => (
                  <Logo key={size} variant="mark" size={size} tone={surface === "light" ? "light" : "dark"} />
                ))}
              </div>
              <p>{tr("gallery.brand.full")}</p>
              <div className="gallery-brand__row">
                {(["sm", "md", "lg", "xl"] as const).map((size) => (
                  <Logo key={size} variant="full" size={size} tone={surface === "light" ? "light" : "dark"} />
                ))}
              </div>
            </figure>
          ))}
        </div>
      </Section>{" "}
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
      </Section>{" "}
      <Section title={tr("gallery.icons")}>
        <span>
          <Icon name="search" /> {tr("gallery.icons.decorative")}
        </span>
        <span>
          <Icon name="warning" label={tr("gallery.icons.label")} /> {tr("gallery.icons.labelled")}
        </span>
      </Section>
    </>
  );
}
