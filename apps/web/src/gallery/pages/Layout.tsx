import { useState } from "react";
import {
  AppShell,
  Breadcrumb,
  Button,
  CommandPalette,
  Icon,
  ICON_NAMES,
  Kbd,
  LanguageMenu,
  Logo,
  NavbarIconButton,
  NavbarSearch,
  OrganizationSwitcher,
  PageHeader,
  SidebarAssistant,
  StatCard,
  Tabs,
  ThemeButton,
  UserMenu,
} from "@talentstroom/ui";
import { Section } from "../Section.tsx";
import { useGallery } from "../context.ts";
import { shellLabels, shellSections } from "../../Workspace.tsx";

const ORGANIZATIONS = [
  { id: "demo", name: "TalentStroom Demo" },
  { id: "innovatech", name: "Innovatech Recruitment" },
  { id: "scaleup", name: "ScaleUp BV" },
  { id: "creative", name: "Creative Minds" },
  { id: "dataworks", name: "DataWorks" },
  { id: "cloudworks", name: "CloudWorks" },
];

/** Dev-only `&shell=collapsed` and `&open=org|user|language` render fixed states for screenshots. */
function ShellPreview() {
  const { tr, locale } = useGallery();
  const params = new URLSearchParams(window.location.search);
  const open = params.get("open");
  const [active, setActive] = useState("dashboard");
  const [org, setOrg] = useState("demo");
  const [language, setLanguage] = useState<string>(locale);
  const sections = shellSections(tr, () => "#layout");
  for (const item of sections.flatMap((section) => section.items)) {
    item.onClick = (event) => {
      event.preventDefault();
      setActive(item.id);
    };
    if (item.id === "tasks") {
      item.count = 3;
      item.countLabel = tr("shell.count").replace("{count}", "3");
    }
  }
  const label = (id: string) =>
    sections.flatMap((section) => section.items).find((item) => item.id === id)?.label ?? id;
  const languages = [
    { value: "nl-NL", label: tr("auth.dutch"), short: "NL" },
    { value: "en-GB", label: tr("auth.english"), short: "EN" },
  ];
  return (
    <AppShell
      className="gallery-shell__app"
      defaultCollapsed={params.get("shell") === "collapsed"}
      labels={shellLabels(tr)}
      sidebar={{
        label: tr("shell.navigation"),
        soonLabel: tr("shell.soon"),
        home: { href: "#layout", label: tr("shell.home") },
        activeId: active,
        sections,
        footer: (
          <SidebarAssistant
            title={tr("shell.assistant.title")}
            description={tr("shell.assistant.description")}
            soonLabel={tr("shell.soon")}
            onClick={() => setActive("dashboard")}
          />
        ),
      }}
      header={{
        search: (
          <CommandPalette
            label={tr("shell.searchTitle")}
            triggerLabel={tr("shell.searchTitle")}
            closeLabel={tr("shell.close")}
            emptyLabel={tr("shell.noResults")}
            actions={sections
              .flatMap((section) => section.items)
              .map((item) => ({
                id: item.id,
                label: item.label,
                group: tr("shell.pages"),
                onSelect: () => setActive(item.id),
              }))}
            renderTrigger={(props) => <NavbarSearch {...props} placeholder={tr("shell.search")} />}
          />
        ),
        children: (
          <>
            <OrganizationSwitcher
              organizations={ORGANIZATIONS}
              currentId={org}
              labels={{
                title: tr("shell.org.title"),
                search: tr("shell.org.search"),
                current: tr("shell.org.current"),
                create: tr("shell.org.create"),
                empty: tr("shell.org.empty"),
                busy: tr("shell.org.busy"),
              }}
              onSelect={setOrg}
              createHref="#layout"
              defaultOpen={open === "org"}
            />
            <LanguageMenu label={tr("shell.language")} value={language} options={languages} onChange={setLanguage} />
            <ThemeButton label={tr("shell.darkMode")} />
          </>
        ),
        notifications: (
          <>
            <NavbarIconButton
              icon="notifications"
              label={tr("shell.notificationsUnread").replace("{count}", "2")}
              dot
              className="ts-navbar-button--optional"
            />
            <NavbarIconButton icon="help" label={tr("shell.help")} className="ts-navbar-button--optional" />
          </>
        ),
        userMenu: (
          <UserMenu
            name="Robin Voorbeeld"
            email="robin@example.test"
            organization={ORGANIZATIONS.find((item) => item.id === org)?.name ?? ""}
            labels={{
              menu: tr("shell.user.menu"),
              profile: tr("shell.user.profile"),
              settings: tr("shell.user.settings"),
              darkMode: tr("shell.darkMode"),
              language: tr("shell.language"),
              shortcuts: tr("shell.user.shortcuts"),
              help: tr("shell.user.help"),
              signOut: tr("auth.signOut"),
              soon: tr("shell.soon"),
            }}
            languageName={languages.find((item) => item.value === language)?.label ?? ""}
            onLanguageChange={() => setLanguage(language === "nl-NL" ? "en-GB" : "nl-NL")}
            onSignOut={() => setActive("dashboard")}
            onProfile={() => setActive("users")}
            onSettings={() => setActive("settings")}
            defaultOpen={open === "user"}
          />
        ),
      }}
    >
      <PageHeader
        title={active === "dashboard" ? tr("gallery.shell.greeting") : label(active)}
        subtitle={tr("gallery.shell.subtitle")}
        actions={
          <Button icon="add" onClick={() => setActive("candidates")}>
            {tr("gallery.shell.newCandidate")}
          </Button>
        }
      />
      <div className="gallery-shell__stats">
        <StatCard label={tr("shell.nav.candidates")} value={1248} icon="group" />
        <StatCard label={tr("shell.nav.vacancies")} value={86} icon="work" />
        <StatCard label={tr("shell.nav.placements")} value={34} icon="work_history" />
        <StatCard label={tr("shell.nav.clients")} value={48} icon="handshake" />
      </div>
    </AppShell>
  );
}

export function Layout() {
  const { tr } = useGallery();
  return (
    <>
      <Section title={tr("gallery.shell")}>
        <p className="gallery-icons-intro">{tr("gallery.shell.intro")}</p>
        <div className="gallery-shell">
          <ShellPreview />
        </div>
      </Section>
      <Section title={tr("gallery.icons")}>
        <p className="gallery-icons-intro">{tr("gallery.icons.intro")}</p>
        <div className="gallery-icons-examples">
          <span>
            <Icon name="search" /> {tr("gallery.icons.decorative")}
          </span>
          <span>
            <Icon name="warning" label={tr("gallery.icons.label")} /> {tr("gallery.icons.labelled")}
          </span>
          <span>
            <Icon name="star" filled /> {tr("gallery.icons.filled")}
          </span>
        </div>
        <ul className="gallery-icons-grid">
          {ICON_NAMES.map((name) => (
            <li key={name}>
              <code>{name}</code>
              <div className="gallery-icons-sizes">
                {([16, 20, 24, 32] as const).map((size) => (
                  <span key={size}>
                    <Icon name={name} size={size} />
                    <small>{size}px</small>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={tr("gallery.breadcrumb")}>
        <Breadcrumb
          label={tr("gallery.breadcrumb")}
          items={[{ label: tr("gallery.workspace"), href: "#layout" }, { label: tr("gallery.nav.candidates") }]}
        />
        <p>
          <Kbd>⌘</Kbd> / <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
        </p>
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
    </>
  );
}
