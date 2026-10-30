import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Avatar, Badge, Button, EmptyState, SearchInput } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { CHAT_CONVERSATIONS, DEMO_TODAY } from "../../../demo/apps.ts";
import type { ChatConversation } from "../../../demo/apps.ts";
import { addDays, fromIso } from "../agenda/dates.ts";
import { filterConversations, groupByDay, lastMessage, sortConversations } from "./utils.ts";
import "./chat.css";

const timeOf = (at: string) => at.slice(11, 16);

export function ChatApp({ locale }: { locale: Locale }) {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  const [conversations, setConversations] = useState<readonly ChatConversation[]>(CHAT_CONVERSATIONS);
  const [activeId, setActiveId] = useState("c-ilse");
  const [view, setView] = useState<"list" | "thread">("list");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const uid = useId();

  const active = conversations.find((conversation) => conversation.id === activeId);
  const visible = sortConversations(filterConversations(conversations, query));
  const unreadTotal = conversations.reduce((sum, conversation) => sum + conversation.unread, 0);

  const shortDay = (day: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(fromIso(day));
  const dayLabel = (day: string) => {
    if (day === DEMO_TODAY) return tr("demo.apps.chat.today");
    if (day === addDays(DEMO_TODAY, -1)) return tr("demo.apps.chat.yesterday");
    return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(fromIso(day));
  };

  // Keep the newest message in view when the thread, its length or the visible pane changes.
  useEffect(() => {
    const node = log.current;
    if (node) node.scrollTop = node.scrollHeight;
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [activeId, active?.messages.length, view]);

  const open = (id: string) => {
    setActiveId(id);
    setView("thread");
    setConversations((current) =>
      current.map((conversation) => (conversation.id === id ? { ...conversation, unread: 0 } : conversation)),
    );
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !active) return;
    const now = new Date();
    const at = `${DEMO_TODAY}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === active.id
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                { id: `m-new-${conversation.messages.length + 1}`, from: "me", at, text },
              ],
            }
          : conversation,
      ),
    );
    setDraft("");
    composer.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
  };

  return (
    <div className="chat" data-view={view}>
      <section className="chat__list" aria-labelledby={`${uid}-list`}>
        <header className="chat__list-head">
          <h2 id={`${uid}-list`}>{tr("demo.apps.chat.conversations")}</h2>
          {unreadTotal > 0 && (
            <Badge tone="info" variant="solid">
              {tr("demo.apps.chat.unread_total", { count: unreadTotal })}
            </Badge>
          )}
        </header>
        <SearchInput
          label={tr("demo.apps.chat.search")}
          clearLabel={tr("demo.apps.chat.search_clear")}
          placeholder={tr("demo.apps.chat.search_placeholder")}
          value={query}
          onChange={setQuery}
          searchLandmark
        />
        {visible.length === 0 ? (
          <EmptyState
            compact
            variant="no-results"
            title={tr("demo.apps.chat.no_results")}
            body={tr("demo.apps.chat.no_results_body")}
          />
        ) : (
          <ul className="chat__conversations">
            {visible.map((conversation) => {
              const last = lastMessage(conversation);
              const selected = conversation.id === activeId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className="chat-row"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => open(conversation.id)}
                  >
                    <Avatar name={conversation.name} />
                    <span className="chat-row__main">
                      <span className="chat-row__top">
                        <span className="chat-row__name">{conversation.name}</span>
                        {last && (
                          <span className="chat-row__time">
                            {last.at.slice(0, 10) === DEMO_TODAY ? timeOf(last.at) : shortDay(last.at.slice(0, 10))}
                          </span>
                        )}
                      </span>
                      <span className="chat-row__preview">
                        {last?.from === "me" ? `${tr("demo.apps.chat.you")}: ` : ""}
                        {last?.text}
                      </span>
                    </span>
                    {conversation.unread > 0 && (
                      <Badge
                        tone="info"
                        variant="solid"
                        aria-label={tr("demo.apps.chat.unread", { count: conversation.unread })}
                      >
                        {conversation.unread}
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        className="chat__thread"
        aria-label={active ? tr("demo.apps.chat.thread", { name: active.name }) : undefined}
      >
        {active ? (
          <>
            <header className="chat__thread-head">
              <Button
                className="chat__back"
                variant="ghost"
                icon="arrow_back"
                aria-label={tr("demo.apps.chat.back")}
                onClick={() => setView("list")}
              />
              <Avatar name={active.name} />
              <div>
                <h2>{active.name}</h2>
                <p>{active.role}</p>
              </div>
            </header>
            <div
              ref={log}
              className="chat__log"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label={tr("demo.apps.chat.messages")}
              // Scrollable region: keyboard users need focus to scroll it.
              // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
            >
              {groupByDay(active.messages).map((group) => (
                <section key={group.day} className="chat-day">
                  <h3 className="chat-day__label">
                    <span>{dayLabel(group.day)}</span>
                  </h3>
                  <ul>
                    {group.messages.map((message) => (
                      <li key={message.id} className={`chat-msg chat-msg--${message.from}`}>
                        <span className="ts-visually-hidden">
                          {message.from === "me" ? tr("demo.apps.chat.you") : active.name},{" "}
                        </span>
                        <p>{message.text}</p>
                        <time dateTime={message.at}>{timeOf(message.at)}</time>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <form
              className="chat__composer"
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                send();
              }}
            >
              <textarea
                ref={composer}
                className="ts-field__input chat__input"
                rows={1}
                value={draft}
                aria-label={tr("demo.apps.chat.composer")}
                aria-describedby={`${uid}-hint`}
                placeholder={tr("demo.apps.chat.composer_placeholder")}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
              />
              <p id={`${uid}-hint`} className="ts-visually-hidden">
                {tr("demo.apps.chat.composer_hint")}
              </p>
              <Button type="submit" icon="send" aria-label={tr("demo.apps.chat.send")} disabled={!draft.trim()} />
            </form>
          </>
        ) : (
          <EmptyState icon="chat" title={tr("demo.apps.chat.empty")} body={tr("demo.apps.chat.empty_body")} />
        )}
      </section>
    </div>
  );
}
