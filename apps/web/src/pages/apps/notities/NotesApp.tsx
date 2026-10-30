/* oxlint-disable react/no-unstable-nested-components -- render props of ui components (Dialog footer, DataTable cells) */
import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Badge,
  MotionCollection,
  MotionListItem,
  Button,
  Checkbox,
  Dialog,
  EmptyState,
  RadioGroup,
  SearchInput,
  Select,
  TextField,
  Textarea,
  ViewSwitcher,
} from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { DEMO_NOTES, DEMO_TODAY, NOTE_COLORS } from "../../../demo/apps.ts";
import type { DemoNote, NoteColor } from "../../../demo/apps.ts";
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
  const [error, setError] = useState(false);
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
    setError(false);
    setOpen(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return setError(true);
    const values = {
      title,
      body: draft.body.trim(),
      color: draft.color,
      pinned: draft.pinned,
      tags: parseTags(draft.tags),
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
          <h3 id={`${formId}-${note.id}`}>{note.title}</h3>
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

      <Dialog
        title={tr(draft.id ? "demo.apps.notes.form.edit" : "demo.apps.notes.form.new")}
        triggerLabel={tr("demo.apps.notes.new")}
        closeLabel={tr("demo.apps.notes.form.close")}
        hideTrigger
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) opener.current?.focus();
        }}
        footer={(close) => (
          <>
            <Button variant="outline" onClick={close}>
              {tr("demo.apps.notes.form.cancel")}
            </Button>
            <Button type="submit" form={formId}>
              {tr("demo.apps.notes.form.save")}
            </Button>
          </>
        )}
      >
        <form id={formId} className="notes-form" onSubmit={submit} noValidate>
          <TextField
            label={tr("demo.apps.notes.form.title")}
            required
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            {...(error ? { error: tr("demo.apps.notes.form.error") } : {})}
          />
          <Textarea
            label={tr("demo.apps.notes.form.body")}
            rows={4}
            value={draft.body}
            onChange={(event) => setDraft({ ...draft, body: event.target.value })}
          />
          <TextField
            label={tr("demo.apps.notes.form.tags")}
            hint={tr("demo.apps.notes.form.tags_hint")}
            value={draft.tags}
            onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
          />
          <RadioGroup
            label={tr("demo.apps.notes.form.color")}
            value={draft.color}
            onChange={(value) => setDraft({ ...draft, color: NOTE_COLORS.find((color) => color === value) ?? "geel" })}
            options={NOTE_COLORS.map((color) => ({ value: color, label: tr(COLOR_KEYS[color]) }))}
          />
          <Checkbox
            label={tr("demo.apps.notes.form.pinned")}
            checked={draft.pinned}
            onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })}
          />
        </form>
      </Dialog>
    </div>
  );
}
