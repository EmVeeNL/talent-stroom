import { useId, useState } from "react";
import { Avatar, Button, EmptyState, FilterChip, Icon, SearchInput } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { DEMO_CONTACTS } from "../../../demo/apps.ts";
import type { DemoContact } from "../../../demo/apps.ts";
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
  const uid = useId();

  const groups = groupContacts(filterContacts(contacts, query, favouritesOnly));
  const active = contacts.find((contact) => contact.id === activeId);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });

  const toggleFavourite = (id: string) =>
    setContacts((current) =>
      current.map((contact) => (contact.id === id ? { ...contact, favourite: !contact.favourite } : contact)),
    );

  return (
    <div className="contacts" data-view={view}>
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
          <div className="contacts__groups">
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

      <section
        className="contacts__detail"
        aria-label={active ? tr("demo.apps.contacts.detail", { name: active.name }) : undefined}
      >
        {active ? (
          <div className="contact-card">
            <Button className="contacts__back" variant="ghost" leadingIcon="arrow_back" onClick={() => setView("list")}>
              {tr("demo.apps.contacts.back")}
            </Button>
            <header className="contact-card__head">
              <Avatar name={active.name} size="lg" />
              <div>
                <h2>{active.name}</h2>
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
          </div>
        ) : (
          <EmptyState
            icon="contacts"
            title={tr("demo.apps.contacts.empty")}
            body={tr("demo.apps.contacts.empty_body")}
          />
        )}
      </section>
    </div>
  );
}
