import { useEffect, useId, useRef, useState } from "react";
import { cx } from "../classnames.ts";
import { Button } from "./Button.tsx";
import { Kbd } from "./Kbd.tsx";
export interface CommandAction {
  id: string;
  label: string;
  group: string;
  onSelect: () => void;
}
export interface CommandPaletteProps {
  label: string;
  triggerLabel: string;
  closeLabel: string;
  emptyLabel: string;
  actions: readonly CommandAction[];
  className?: string;
}
export function CommandPalette({
  label,
  triggerLabel,
  closeLabel,
  emptyLabel,
  actions,
  className,
}: CommandPaletteProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const filtered = actions.filter((a) => a.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const groups = [...new Set(filtered.map((a) => a.group))];
  const ordered = groups.flatMap((group) => filtered.filter((a) => a.group === group));
  const selected = ordered[Math.min(active, ordered.length - 1)];
  const close = () => {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  };
  const show = () => {
    if (dialog.current?.open) return;
    setQuery("");
    setActive(0);
    setOpen(true);
  };
  useEffect(() => {
    const key = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && !e.repeat) {
        e.preventDefault();
        show();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      input.current?.focus();
    }
  }, [open]);
  useEffect(() => {
    if (open && selected)
      document.getElementById(`${id}-option-${selected.id}`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, selected, id]);
  const run = (action: CommandAction) => {
    close();
    action.onSelect();
  };
  return (
    <>
      <Button
        ref={trigger}
        variant="secondary"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-dialog`}
        onClick={show}
      >
        {triggerLabel} <Kbd>Ctrl / ⌘ K</Kbd>
      </Button>
      <dialog
        ref={dialog}
        id={`${id}-dialog`}
        className={cx("ts-command-palette", className)}
        aria-labelledby={`${id}-title`}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
      >
        <div className="ts-command-palette__header">
          <h2 id={`${id}-title`}>{label}</h2>
          <Button variant="ghost" onClick={close}>
            {closeLabel}
          </Button>
        </div>
        <input
          ref={input}
          className="ts-field__input"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={selected ? `${id}-option-${selected.id}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              if (!ordered.length) return;
              setActive(
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? ordered.length - 1
                    : (Math.min(active, ordered.length - 1) + (e.key === "ArrowDown" ? 1 : -1) + ordered.length) %
                      ordered.length,
              );
            } else if (e.key === "Enter" && selected) {
              e.preventDefault();
              run(selected);
            } else if (e.key === "Escape") {
              e.preventDefault();
              close();
            }
          }}
        />
        <div role="listbox" id={`${id}-list`} aria-label={label}>
          {groups.map((group, index) => (
            <div role="group" key={group} aria-labelledby={`${id}-group-${index}`}>
              <div id={`${id}-group-${index}`} className="ts-command-palette__group">
                {group}
              </div>
              {ordered
                .filter((a) => a.group === group)
                .map((action) => (
                  <div
                    role="option"
                    id={`${id}-option-${action.id}`}
                    key={action.id}
                    aria-selected={selected?.id === action.id}
                    className="ts-command-palette__option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => run(action)}
                  >
                    {action.label}
                  </div>
                ))}
            </div>
          ))}
        </div>
        {!ordered.length ? <p role="status">{emptyLabel}</p> : null}
      </dialog>
    </>
  );
}
