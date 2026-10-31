/* oxlint-disable react/no-unstable-nested-components -- render props of ui components (Dialog footer, DataTable cells) */
import { useId, useRef, useState } from "react";
import {
  Badge,
  DetailDrawer,
  MotionCollection,
  MotionListItem,
  Button,
  EmptyState,
  SearchInput,
  Select,
  ViewSwitcher,
} from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { DEMO_NOTES, DEMO_TODAY, NOTE_COLORS } from "../../../demo/apps.ts";
import type { DemoNote, NoteColor } from "../../../demo/apps.ts";
import { RecordFormDialog } from "../RecordFormDialog.tsx";
import { fromIso } from "../agenda/dates.ts";
import { allTags, filterNotes, parseTags, sortNotes } from "./notes.ts";
import "./notes.css";

const COLOR_KEYS: Record<NoteColor, MessageKey> = {
  geel: "demo.apps.notes.color.geel",
  blauw: "demo.apps.notes.color.blauw",
  groen: "demo.apps.notes.color.groen",
  roze: "demo.apps.notes.color.roze",
  paars: "demo.apps.notes.color.paars",
  neutraal: "demo.apps.notes.color.neutraal",
};

interface Draft {
  id: string | undefined;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
  tags: string;
}

const emptyDraft: Draft = { id: undefined, title: "", body: "", color: "geel", pinned: false, tags: "" };

export function NotesApp({ locale }: { locale: Locale }) {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  const [notes, setNotes] = useState<readonly DemoNote[]>(DEMO_NOTES);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [archived, setArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [selectedId, setSelectedId] = useState<string>();
  const selected = notes.find((note) => note.id === selectedId);
  const [status, setStatus] = useState("");
  const opener = useRef<HTMLElement | null>(null);
  const formId = useId();

  const visible = sortNotes(filterNotes(notes, { query, tag, archived }));
  const pinned = visible.filter((note) => note.pinned);
  const others = visible.filter((note) => !note.pinned);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  const update = (id: string, change: Partial<DemoNote>, message?: string) => {
    setNotes((current) => current.map((note) => (note.id === id ? { ...note, ...change } : note)));
    if (message) setStatus(message);
  };

  const edit = (note: DemoNote | undefined, element: HTMLElement | null) => {
    opener.current = element;
    setDraft(
      note
        ? {
            id: note.id,
            title: note.title,
            body: note.body,
            color: note.color,
            pinned: note.pinned,
            tags: note.tags.join(", "),
          }
        : emptyDraft,
    );
    setOpen(true);
  };

  const submit = (value: Record<string, string>) => {
    const title = value["title"]?.trim() ?? "";
    if (!title) return;
    const values = {
      title,
      body: value["body"]?.trim() ?? "",
      color: NOTE_COLORS.find((color) => color === value["color"]) ?? "geel",
      pinned: value["pinned"] === "true",
      tags: parseTags(value["tags"] ?? ""),
      updated: DEMO_TODAY,
    };
    if (draft.id) {
      update(draft.id, values, tr("demo.apps.notes.saved", { title }));
    } else {
      setNotes((current) => [...current, { id: `n-new-${current.length + 1}`, archived: false, ...values }]);
      setStatus(tr("demo.apps.notes.added", { title }));
    }
    setOpen(false);
  };

  const renderNote = (note: DemoNote) => (
    <MotionListItem key={note.id}>
      <article className="note" data-color={note.color} aria-labelledby={`${formId}-${note.id}`}>
        <header className="note__head">
          <h3 id={`${formId}-${note.id}`}>
            <button type="button" className="note__title" onClick={() => setSelectedId(note.id)}>
              {note.title}
            </button>
          </h3>
          <Button
            variant={note.pinned ? "secondary" : "ghost"}
            size="sm"
            icon="push_pin"
            aria-pressed={note.pinned}
            aria-label={tr(note.pinned ? "demo.apps.notes.unpin" : "demo.apps.notes.pin", { title: note.title })}
            onClick={() => update(note.id, { pinned: !note.pinned })}
          />
        </header>
        <p className="note__body">{note.body}</p>
        <ul className="note__tags" aria-label={tr("demo.apps.notes.tags")}>
          {note.tags.map((entry) => (
            <li key={entry}>
              <Badge tone="neutral">{entry}</Badge>
            </li>
          ))}
        </ul>
        <footer className="note__foot">
          <time dateTime={note.updated}>{date.format(fromIso(note.updated))}</time>
          <span className="note__actions">
            <Button
              variant="ghost"
              size="sm"
              icon="edit"
              aria-label={tr("demo.apps.notes.edit", { title: note.title })}
              onClick={(event) => edit(note, event.currentTarget)}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={note.archived ? "unarchive" : "archive"}
              aria-label={tr(note.archived ? "demo.apps.notes.restore" : "demo.apps.notes.archive", {
                title: note.title,
              })}
              onClick={() =>
                update(
                  note.id,
                  { archived: !note.archived },
                  tr(note.archived ? "demo.apps.notes.restored" : "demo.apps.notes.archived", { title: note.title }),
                )
              }
            />
          </span>
        </footer>
      </article>
    </MotionListItem>
  );

  return (
    <div className="notes">
      <div className="notes__bar">
        <div className="notes__filters">
          <SearchInput
            label={tr("demo.apps.notes.search")}
            clearLabel={tr("demo.apps.notes.search_clear")}
            placeholder={tr("demo.apps.notes.search_placeholder")}
            value={query}
            onChange={setQuery}
            searchLandmark
          />
          <Select
            label={tr("demo.apps.notes.tag")}
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            placeholder={tr("demo.apps.notes.all_tags")}
          >
            {allTags(notes).map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </Select>
        </div>
        <div className="notes__actions">
          <ViewSwitcher
            label={tr("demo.apps.notes.view")}
            value={archived ? "archived" : "active"}
            onChange={(value) => setArchived(value === "archived")}
            options={[
              { value: "active", label: tr("demo.apps.notes.active"), icon: "description" },
              { value: "archived", label: tr("demo.apps.notes.archive_view"), icon: "archive" },
            ]}
          />
          <Button icon="add" onClick={(event) => edit(undefined, event.currentTarget)}>
            {tr("demo.apps.notes.new")}
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          variant={query || tag ? "no-results" : "no-records"}
          icon="description"
          title={tr(archived ? "demo.apps.notes.empty_archive" : "demo.apps.notes.empty")}
          body={tr("demo.apps.notes.empty_body")}
        />
      ) : null}
      <>
        <section aria-labelledby={`${formId}-pinned`}>
          <h2 hidden={pinned.length === 0} id={`${formId}-pinned`} className="notes__heading">
            {tr("demo.apps.notes.pinned")}
          </h2>
          <ul className="notes__grid">
            <MotionCollection>{pinned.map(renderNote)}</MotionCollection>
          </ul>
        </section>
        <section aria-labelledby={`${formId}-others`}>
          <h2 hidden={others.length === 0} id={`${formId}-others`} className="notes__heading">
            {tr(pinned.length > 0 ? "demo.apps.notes.others" : "demo.apps.notes.all")}
          </h2>
          <ul className="notes__grid">
            <MotionCollection>{others.map(renderNote)}</MotionCollection>
          </ul>
        </section>
      </>

      <output className="ts-visually-hidden" aria-live="polite">
        {status}
      </output>

      <DetailDrawer
        title={selected?.title ?? tr("patterns.details")}
        triggerLabel={tr("patterns.details")}
        closeLabel={tr("patterns.close")}
        hideTrigger
        open={selectedId !== undefined}
        onOpenChange={(next) => {
          if (!next) setSelectedId(undefined);
        }}
        editLabel={tr("patterns.edit")}
        onEdit={() => {
          if (selected) edit(selected, document.activeElement instanceof HTMLElement ? document.activeElement : null);
        }}
      >
        {selected && (
          <>
            <p className="note__body">{selected.body}</p>
            <ul className="note__tags" aria-label={tr("demo.apps.notes.tags")}>
              {selected.tags.map((entry) => (
                <li key={entry}>
                  <Badge>{entry}</Badge>
                </li>
              ))}
            </ul>
            <time dateTime={selected.updated}>{date.format(fromIso(selected.updated))}</time>
          </>
        )}
      </DetailDrawer>
      {open && (
        <RecordFormDialog
          locale={locale}
          title={tr(draft.id ? "demo.apps.notes.form.edit" : "demo.apps.notes.form.new")}
          initial={{
            title: draft.title,
            body: draft.body,
            tags: draft.tags,
            color: draft.color,
            pinned: String(draft.pinned),
          }}
          fields={[
            { name: "title", label: "demo.apps.notes.form.title", required: true },
            { name: "body", label: "demo.apps.notes.form.body", area: true },
            { name: "tags", label: "demo.apps.notes.form.tags", hint: "demo.apps.notes.form.tags_hint" },
            {
              name: "color",
              label: "demo.apps.notes.form.color",
              options: NOTE_COLORS.map((color) => ({ value: color, label: tr(COLOR_KEYS[color]) })),
            },
            { name: "pinned", label: "demo.apps.notes.form.pinned", checkbox: true },
          ]}
          onSave={submit}
          onClose={() => {
            setOpen(false);
            opener.current?.focus();
          }}
        />
      )}
    </div>
  );
}
