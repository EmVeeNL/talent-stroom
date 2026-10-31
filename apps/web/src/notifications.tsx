import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, Dialog, NavbarIconButton, Select, Sheet } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { Link } from "./Link.tsx";
import "./notifications.css";

const TYPES = ["appointment", "message", "task", "mention", "status"] as const;
type NotificationType = (typeof TYPES)[number];
const TYPE_KEYS = {
  appointment: "notifications.type.appointment",
  message: "notifications.type.message",
  task: "notifications.type.task",
  mention: "notifications.type.mention",
  status: "notifications.type.status",
} as const;
const CONTENT = {
  appointment: { key: "notifications.demo.appointment", to: "/apps/agenda" },
  message: { key: "notifications.demo.message", to: "/apps/chat" },
  task: { key: "notifications.demo.task", to: "/apps/kanban" },
  mention: { key: "notifications.demo.mention", to: "/apps/notities" },
  status: { key: "notifications.demo.status", to: "/apps/kanban" },
} as const;
interface DemoNotification {
  id: string;
  type: NotificationType;
  availableAt: number;
  startsAt?: number;
}
/** Fixed synthetic content, independent of session identity and all other demo stores. */
function demoItems(now: number): DemoNotification[] {
  return [
    ...TYPES.map((type) => ({
      id: `demo-${type}`,
      type,
      availableAt: now,
      ...(type === "appointment" ? { startsAt: now + 10 * 60_000 } : {}),
    })),
    { id: "demo-next-message", type: "message", availableAt: now + 60_000 },
  ];
}

/** Tab-local state: remount on organization/session changes; never persist notification content. */
export function NotificationCentre({
  locale,
  demo,
  settingsOpen = false,
  onSettingsClose,
}: {
  locale: Locale;
  demo: boolean;
  settingsOpen?: boolean;
  onSettingsClose?: () => void;
}) {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  const [items] = useState(() => (demo ? demoItems(Date.now()) : []));
  const [now, setNow] = useState(Date.now);
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set());
  const [enabled, setEnabled] = useState<Record<NotificationType, boolean>>({
    appointment: true,
    message: true,
    task: true,
    mention: true,
    status: true,
  });
  const [lead, setLead] = useState(15);
  const [panelOpen, setPanelOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const bell = useRef<HTMLButtonElement>(null);
  const visible = items.filter(
    (item) =>
      enabled[item.type] &&
      item.availableAt <= now &&
      (item.startsAt === undefined || (item.startsAt > now && item.startsAt - now <= lead * 60_000)),
  );
  const unread = visible.filter((item) => !read.has(item.id)).length;
  const seen = useRef(new Set(visible.map((item) => item.id)));
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (!demo) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [demo]);
  useEffect(() => {
    const added = visible.filter((item) => !seen.current.has(item.id));
    for (const item of added) seen.current.add(item.id);
    if (added.length) setAnnouncement(t(locale, "notifications.new", { count: added.length }));
  }, [visible, locale, seen]);
  const markRead = (id: string) => setRead((previous) => new Set([...previous, id]));
  const closePanel = () => {
    setPanelOpen(false);
    bell.current?.focus();
  };
  const closePreferences = () => {
    // Escape and the native close event both report closing; handle it once.
    if (!preferencesOpen && !settingsOpen) return;
    setPreferencesOpen(false);
    if (settingsOpen) onSettingsClose?.();
    else bell.current?.focus();
  };
  return (
    <>
      <span className="notification-centre__bell">
        <NavbarIconButton
          ref={bell}
          icon="notifications"
          label={tr("notifications.bell", { count: unread })}
          aria-haspopup="dialog"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen(true)}
        />
        {unread ? (
          <span className="notification-centre__count" aria-hidden="true">
            {unread}
          </span>
        ) : null}
      </span>
      <output
        className="ts-visually-hidden"
        aria-hidden={panelOpen || preferencesOpen || settingsOpen}
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </output>
      <Sheet
        title={tr("shell.notifications")}
        triggerLabel={tr("shell.notifications")}
        closeLabel={tr("notifications.close")}
        hideTrigger
        open={panelOpen}
        onOpenChange={(open) => {
          if (!open) closePanel();
        }}
      >
        <div className="notification-centre">
          <output className="ts-visually-hidden" aria-live="polite" aria-atomic="true">
            {announcement}
          </output>
          <p>{tr(demo ? "notifications.demo.notice" : "notifications.production.notice")}</p>
          <div className="notification-centre__actions">
            <Button
              variant="secondary"
              disabled={unread === 0}
              onClick={() => setRead(new Set([...read, ...visible.map((item) => item.id)]))}
            >
              {tr("notifications.readAll")}
            </Button>
            <Button
              variant="ghost"
              icon="settings"
              onClick={() => {
                setPanelOpen(false);
                setPreferencesOpen(true);
              }}
            >
              {tr("notifications.preferences")}
            </Button>
          </div>
          {visible.length ? (
            <ul className="notification-centre__list" aria-label={tr("shell.notifications")}>
              {visible.map((item) => (
                <li key={item.id} className="notification-centre__item">
                  <div className="notification-centre__meta">
                    <span>{tr(TYPE_KEYS[item.type])}</span>
                    <span>{tr(read.has(item.id) ? "notifications.read" : "notifications.unread")}</span>
                  </div>
                  <Link
                    to={CONTENT[item.type].to}
                    onClick={() => {
                      markRead(item.id);
                      closePanel();
                    }}
                  >
                    {tr(CONTENT[item.type].key)}
                  </Link>
                  {item.startsAt ? (
                    <p>{tr("notifications.startsIn", { minutes: Math.ceil((item.startsAt - now) / 60_000) })}</p>
                  ) : null}
                  {!read.has(item.id) ? (
                    <Button
                      variant="ghost"
                      onClick={() => markRead(item.id)}
                      aria-label={tr("notifications.readItem", { item: tr(CONTENT[item.type].key) })}
                    >
                      {tr("notifications.markRead")}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>{tr("notifications.empty")}</p>
          )}
        </div>
      </Sheet>
      <Dialog
        title={tr("notifications.preferences")}
        triggerLabel={tr("notifications.preferences")}
        closeLabel={tr("notifications.close")}
        hideTrigger
        open={preferencesOpen || settingsOpen}
        onOpenChange={(open) => {
          if (!open) closePreferences();
        }}
      >
        <div className="notification-centre">
          <p>{tr("notifications.preferences.notice")}</p>
          <fieldset className="notification-centre__preferences">
            <legend>{tr("notifications.types")}</legend>
            {TYPES.map((type) => (
              <Checkbox
                key={type}
                label={tr(TYPE_KEYS[type])}
                checked={enabled[type]}
                onChange={(event) => setEnabled({ ...enabled, [type]: event.target.checked })}
              />
            ))}
          </fieldset>
          <Select
            label={tr("notifications.lead")}
            value={lead}
            disabled={!enabled.appointment}
            onChange={(event) => setLead(Number(event.target.value))}
          >
            {[5, 15, 30, 60].map((minutes) => (
              <option key={minutes} value={minutes}>
                {tr("notifications.minutes", { minutes })}
              </option>
            ))}
          </Select>
        </div>
      </Dialog>
    </>
  );
}
