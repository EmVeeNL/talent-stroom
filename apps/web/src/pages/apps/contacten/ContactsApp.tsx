import { useId, useRef, useState } from "react";
import { Avatar, Button, EmptyState, FilterChip, Icon, SearchInput, DetailDrawer } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { DEMO_CONTACTS } from "../../../demo/apps.ts";
import type { DemoContact } from "../../../demo/apps.ts";
import { RecordFormDialog } from "../RecordFormDialog.tsx";
import { fromIso } from "../agenda/dates.ts";
import { filterContacts, groupContacts } from "./groups.ts";
import "./contacts.css";

export function ContactsApp({ locale }: { locale: Locale }) {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  const [contacts, setContacts] = useState<readonly DemoContact[]>(DEMO_CONTACTS);
  const [query, setQuery] = useState("");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [activeId, setActiveId] = useState("k08");
  const [view, setView] = useState<"list" | "detail">("list");
  const [editing, setEditing] = useState(false);
  const uid = useId();
  const list = useRef<HTMLDivElement>(null);

  const groups = groupContacts(filterContacts(contacts, query, favouritesOnly));
  const active = contacts.find((contact) => contact.id === activeId);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });

  const toggleFavourite = (id: string) =>
    setContacts((current) =>
      current.map((contact) => (contact.id === id ? { ...contact, favourite: !contact.favourite } : contact)),
    );

  return (
    <div className="contacts">
      <section className="contacts__list" aria-labelledby={`${uid}-list`}>
        <h2 id={`${uid}-list`} className="ts-visually-hidden">
          {tr("demo.apps.contacts.list")}
        </h2>
        <SearchInput
          label={tr("demo.apps.contacts.search")}
          clearLabel={tr("demo.apps.contacts.search_clear")}
          placeholder={tr("demo.apps.contacts.search_placeholder")}
          value={query}
          onChange={setQuery}
          searchLandmark
        />
        <div>
          <FilterChip kind="toggle" pressed={favouritesOnly} onPressedChange={setFavouritesOnly}>
            {tr("demo.apps.contacts.favourites")}
          </FilterChip>
        </div>
        <output className="ts-visually-hidden" aria-live="polite">
          {tr("demo.apps.contacts.count", { count: groups.reduce((sum, group) => sum + group.contacts.length, 0) })}
        </output>
        {groups.length === 0 ? (
          <EmptyState
            compact
            variant="no-results"
            title={tr("demo.apps.contacts.no_results")}
            body={tr("demo.apps.contacts.no_results_body")}
          />
        ) : (
          <div ref={list} className="contacts__groups">
            {groups.map((group) => (
              <section key={group.letter} aria-labelledby={`${uid}-letter-${group.letter}`}>
                <h3 id={`${uid}-letter-${group.letter}`} className="contacts__letter">
                  {group.letter}
                </h3>
                <ul>
                  {group.contacts.map((contact) => (
                    <li key={contact.id}>
                      <button
                        type="button"
                        className="contact-row"
                        data-contact-id={contact.id}
                        aria-current={contact.id === activeId ? "true" : undefined}
                        onClick={() => {
                          setActiveId(contact.id);
                          setView("detail");
                        }}
                      >
                        <Avatar name={contact.name} />
                        <span className="contact-row__main">
                          <span className="contact-row__name">{contact.name}</span>
                          <span className="contact-row__meta">
                            {contact.function} · {contact.company}
                          </span>
                        </span>
                        {contact.favourite && (
                          <Icon
                            name="star"
                            size={20}
                            aria-label={tr("demo.apps.contacts.favourite")}
                            className="contact-row__star"
                          />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      <DetailDrawer
        title={active?.name ?? tr("patterns.details")}
        triggerLabel={tr("patterns.details")}
        closeLabel={tr("patterns.close")}
        hideTrigger
        open={view === "detail"}
        onOpenChange={(next) => {
          setView(next ? "detail" : "list");
          if (next) return;
          // Renaming can move the row to another letter group, which remounts the opener.
          // Only recover focus that was lost; never steal it from where the user moved it.
          requestAnimationFrame(() => {
            const current = document.activeElement;
            const lost = !current || current === document.body || current.closest("dialog:not([open])");
            if (!lost) return;
            list.current?.querySelector<HTMLElement>(`[data-contact-id="${CSS.escape(activeId)}"]`)?.focus();
          });
        }}
        editLabel={tr("patterns.edit")}
        onEdit={() => setEditing(true)}
      >
        {active ? (
          <article className="contact-card">
            <header className="contact-card__head">
              <Avatar name={active.name} size="lg" />
              <div>
                <p>{active.name}</p>
                <p>
                  {active.function} · {active.company}
                </p>
              </div>
              <Button
                variant={active.favourite ? "secondary" : "outline"}
                icon="star"
                aria-pressed={active.favourite}
                onClick={() => toggleFavourite(active.id)}
              >
                {tr(active.favourite ? "demo.apps.contacts.unfavourite" : "demo.apps.contacts.favourite")}
              </Button>
            </header>
            <h3>{tr("demo.apps.contacts.info")}</h3>
            <dl className="contact-card__info">
              <div>
                <dt>
                  <Icon name="mail" size={20} />
                  {tr("demo.apps.contacts.email")}
                </dt>
                <dd>
                  <a href={`mailto:${active.email}`}>{active.email}</a>
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="call" size={20} />
                  {tr("demo.apps.contacts.phone")}
                </dt>
                <dd>
                  <a href={`tel:${active.phone.replaceAll("-", "")}`}>{active.phone}</a>
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="location_on" size={20} />
                  {tr("demo.apps.contacts.city")}
                </dt>
                <dd>{active.city}</dd>
              </div>
            </dl>
            <h3>{tr("demo.apps.contacts.activity")}</h3>
            <ul className="contact-card__activity">
              {active.activity.map((item) => (
                <li key={item.id}>
                  <span>{item.text}</span>
                  <time dateTime={item.date}>{date.format(fromIso(item.date))}</time>
                </li>
              ))}
            </ul>
          </article>
        ) : (
          <EmptyState
            icon="contacts"
            title={tr("demo.apps.contacts.empty")}
            body={tr("demo.apps.contacts.empty_body")}
          />
        )}
      </DetailDrawer>
      {editing && active && (
        <RecordFormDialog
          locale={locale}
          initial={{ name: active.name, function: active.function, company: active.company, city: active.city }}
          fields={[
            { name: "name", label: "patterns.name", required: true },
            { name: "function", label: "demo.apps.crm.col.function" },
            { name: "company", label: "demo.apps.crm.col.company" },
            { name: "city", label: "demo.apps.contacts.city" },
          ]}
          onClose={() => setEditing(false)}
          onSave={(value) => {
            setContacts((current) =>
              current.map((entry) =>
                entry.id === active.id
                  ? {
                      ...entry,
                      name: value["name"] ?? entry.name,
                      function: value["function"] ?? entry.function,
                      company: value["company"] ?? entry.company,
                      city: value["city"] ?? entry.city,
                    }
                  : entry,
              ),
            );
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
