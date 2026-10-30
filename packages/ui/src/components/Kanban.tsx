import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { cx } from "../classnames.ts";
import type { RecruitmentStageTone } from "../recruitment-stages.ts";
import { useIsMobile } from "./AppShell.tsx";
import { Avatar } from "./Avatar.tsx";
import { Button } from "./Button.tsx";
import { Badge, StatusPill } from "./Badge.tsx";
import type { BadgeTone } from "./Badge.tsx";
import { ContextMenu } from "./ContextMenu.tsx";
import type { ContextMenuItem } from "./ContextMenu.tsx";
import { EmptyState } from "./EmptyState.tsx";
import { Icon } from "./Icon.tsx";

export interface KanbanCardData {
  id: string;
  name: string;
  /** Role or vacancy line. */
  role?: string | undefined;
  /** Pre-formatted meta line, for example "2 d in fase · LinkedIn". */
  meta?: string | undefined;
  /** Compact right-aligned age at the top right of the card, for example "2d". */
  age?: string | undefined;
  /** Full text for screen readers, for example "2 dagen in fase". */
  ageLabel?: string | undefined;
  /** Small neutral chips under the meta line, for example skills. */
  tags?: readonly string[] | undefined;
  /** Optional status label; tone is paired with an icon, never colour alone. */
  status?: { label: string; tone?: BadgeTone | undefined } | undefined;
  avatarSrc?: string | undefined;
  /** Renders the name as a link. Never put personal data in the URL. */
  href?: string | undefined;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  /** Stage tint; maps to the recruitment stage tones. */
  tone?: RecruitmentStageTone | undefined;
  cards: readonly KanbanCardData[];
}

export interface KanbanMove {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  /** Final index of the card inside the destination column once it has been moved. */
  toIndex: number;
}

export interface KanbanAnnouncement {
  name: string;
  column: string;
  /** 1-based position inside the column. */
  position: number;
  total: number;
}

/** Caller-localized copy (nl-NL is the source language); see the `kanban.*` i18n keys. */
export interface KanbanLabels {
  /** Accessible name of the scrolling board region. */
  board: string;
  /** Keyboard instructions, referenced by every card with aria-describedby. */
  instructions: string;
  /** aria-roledescription of a card, for example "verplaatsbare kaart". */
  cardRole: string;
  count: (count: number) => string;
  /** Visible text of the column footer button, for example "Kandidaat toevoegen". */
  addCardShort: string;
  /** Accessible name of that button; must contain the visible text. */
  addCard: (column: string) => string;
  collapse: (column: string) => string;
  expand: (column: string) => string;
  columnMenu: (column: string) => string;
  cardMenu: (name: string) => string;
  /** Label of the generated move action, for example "Verplaatsen naar Gesprek". */
  moveTo: (column: string) => string;
  emptyTitle: string;
  emptyBody: string;
  pickedUp: (announcement: KanbanAnnouncement) => string;
  moving: (announcement: KanbanAnnouncement) => string;
  moved: (announcement: KanbanAnnouncement) => string;
  cancelled: (name: string) => string;
}

export interface KanbanBoardProps {
  columns: readonly KanbanColumnData[];
  labels: KanbanLabels;
  /** The board never mutates data; apply the move (see `moveKanbanCard`) and pass new columns. */
  onMove: (move: KanbanMove) => void;
  /** Shows the "+" button in each expanded column header. */
  onAddCard?: (columnId: string) => void;
  columnMenuItems?: (column: KanbanColumnData) => readonly ContextMenuItem[];
  /** Extra actions appended after the generated "Verplaatsen naar …" items. */
  cardMenuItems?: (card: KanbanCardData, column: KanbanColumnData) => readonly ContextMenuItem[];
  collapsedColumnIds?: readonly string[];
  defaultCollapsedColumnIds?: readonly string[];
  onCollapsedChange?: (ids: string[]) => void;
  /** Forces a layout; by default the list view is used below 768 px. */
  view?: "board" | "list";
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

/** Pure helper for callers: returns new columns with the card moved. Unknown ids leave the input unchanged. */
export function moveKanbanCard(columns: readonly KanbanColumnData[], move: KanbanMove): KanbanColumnData[] {
  const source = columns.find((column) => column.cards.some((card) => card.id === move.cardId));
  const card = source?.cards.find((candidate) => candidate.id === move.cardId);
  if (!source || !card || !columns.some((column) => column.id === move.toColumnId)) return [...columns];
  return columns.map((column) => {
    const rest = column.cards.filter((candidate) => candidate.id !== move.cardId);
    if (column.id !== move.toColumnId) return column.id === source.id ? { ...column, cards: rest } : column;
    const index = Math.min(Math.max(move.toIndex, 0), rest.length);
    return { ...column, cards: [...rest.slice(0, index), card, ...rest.slice(index)] };
  });
}

interface Pickup {
  cardId: string;
  columnId: string;
  index: number;
  fromColumnId: string;
  fromIndex: number;
}

const toneClass = (tone: RecruitmentStageTone | undefined) => tone ?? "neutral";

/** Insertion index among the column's cards, excluding the dragged card, from the pointer position. */
function dropIndexAt(list: HTMLElement | null, clientY: number, draggedId: string): number {
  const items = Array.from(list?.children ?? []).filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement && !!node.dataset["cardId"] && node.dataset["cardId"] !== draggedId,
  );
  const index = items.findIndex((node) => {
    const rect = node.getBoundingClientRect();
    return clientY < rect.top + rect.height / 2;
  });
  return index === -1 ? items.length : index;
}

export function KanbanBoard({
  columns,
  labels,
  onMove,
  onAddCard,
  columnMenuItems,
  cardMenuItems,
  collapsedColumnIds,
  defaultCollapsedColumnIds = [],
  onCollapsedChange,
  view,
  headingLevel = 3,
  className,
}: KanbanBoardProps) {
  const uid = useId();
  const instructionsId = `${uid}-instructions`;
  const viewportMobile = useIsMobile();
  const list = (view ?? (viewportMobile ? "list" : "board")) === "list";
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState<readonly string[]>(defaultCollapsedColumnIds);
  const collapsedIds = collapsedColumnIds ?? uncontrolledCollapsed;
  const [announcement, setAnnouncement] = useState("");
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [dragging, setDragging] = useState<{ cardId: string; fromColumnId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ columnId: string; index: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scroller.current;
    if (!node) return undefined;
    const update = () => {
      const overflow = node.scrollWidth > node.clientWidth + 1;
      node.toggleAttribute("data-fade-start", overflow && node.scrollLeft > 1);
      node.toggleAttribute("data-fade-end", overflow && node.scrollLeft + node.clientWidth < node.scrollWidth - 1);
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    observer?.observe(node);
    if (node.firstElementChild) observer?.observe(node.firstElementChild);
    node.addEventListener("scroll", update, { passive: true });
    return () => {
      observer?.disconnect();
      node.removeEventListener("scroll", update);
    };
  }, [list, columns, collapsedIds]);
  const cardNodes = useRef(new Map<string, HTMLElement>());
  const pendingFocus = useRef<string | null>(null);
  const isCollapsed = (id: string) => collapsedIds.includes(id);

  // While a card is lifted with the keyboard, preview it in its target position.
  const shown = pickup
    ? moveKanbanCard(columns, {
        cardId: pickup.cardId,
        fromColumnId: pickup.fromColumnId,
        toColumnId: pickup.columnId,
        toIndex: pickup.index,
      })
    : columns;

  // Moving a card between lists remounts its element: hand keyboard focus back to it.
  useLayoutEffect(() => {
    const id = pickup?.cardId ?? pendingFocus.current;
    if (!id) return;
    const node = cardNodes.current.get(id);
    if (node && document.activeElement !== node) node.focus();
    if (!pickup) pendingFocus.current = null;
  });

  // A pointer press elsewhere abandons a keyboard pickup.
  useEffect(() => {
    if (!pickup) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const node = cardNodes.current.get(pickup.cardId);
      if (event.target instanceof Node && node?.contains(event.target)) return;
      setPickup(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [pickup]);

  const setCollapsed = (id: string, collapse: boolean) => {
    const next = collapse ? [...collapsedIds, id] : collapsedIds.filter((candidate) => candidate !== id);
    if (collapsedColumnIds === undefined) setUncontrolledCollapsed(next);
    onCollapsedChange?.(next);
  };

  const announce = (
    kind: "pickedUp" | "moving" | "moved",
    card: KanbanCardData,
    column: KanbanColumnData,
    position: number,
    total: number,
  ) => setAnnouncement(labels[kind]({ name: card.name, column: column.title, position, total }));

  const commit = (move: KanbanMove, card: KanbanCardData) => {
    const destination = columns.find((column) => column.id === move.toColumnId);
    if (!destination) return;
    const others = destination.cards.filter((candidate) => candidate.id !== card.id).length;
    const index = Math.min(Math.max(move.toIndex, 0), others);
    onMove({ ...move, toIndex: index });
    pendingFocus.current = card.id;
    announce("moved", card, destination, index + 1, others + 1);
  };

  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>, card: KanbanCardData, column: KanbanColumnData) => {
    if (event.target !== event.currentTarget) return;
    if (!pickup) {
      if (event.key !== " ") return;
      event.preventDefault();
      const index = column.cards.findIndex((candidate) => candidate.id === card.id);
      setPickup({ cardId: card.id, columnId: column.id, index, fromColumnId: column.id, fromIndex: index });
      announce("pickedUp", card, column, index + 1, column.cards.length);
      return;
    }
    if (pickup.cardId !== card.id) return;
    const current = shown.find((candidate) => candidate.id === pickup.columnId);
    if (!current) return;
    if (event.key === " ") {
      event.preventDefault();
      setPickup(null);
      if (pickup.columnId === pickup.fromColumnId && pickup.index === pickup.fromIndex) {
        setAnnouncement(labels.cancelled(card.name));
        return;
      }
      commit(
        { cardId: card.id, fromColumnId: pickup.fromColumnId, toColumnId: pickup.columnId, toIndex: pickup.index },
        card,
      );
    } else if (event.key === "Escape") {
      event.preventDefault();
      setPickup(null);
      setAnnouncement(labels.cancelled(card.name));
    } else if (event.key === "Tab") {
      setPickup(null);
      setAnnouncement(labels.cancelled(card.name));
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const index = Math.min(Math.max(pickup.index + (event.key === "ArrowUp" ? -1 : 1), 0), current.cards.length - 1);
      if (index === pickup.index) return;
      setPickup({ ...pickup, index });
      announce("moving", card, current, index + 1, current.cards.length);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const open = shown.filter((candidate) => !isCollapsed(candidate.id) || candidate.id === current.id);
      const target =
        open[open.findIndex((candidate) => candidate.id === current.id) + (event.key === "ArrowLeft" ? -1 : 1)];
      if (!target) return;
      const index = Math.min(pickup.index, target.cards.length);
      setPickup({ ...pickup, columnId: target.id, index });
      announce("moving", card, target, index + 1, target.cards.length + 1);
    }
  };

  const onColumnDragOver = (event: DragEvent<HTMLElement>, column: KanbanColumnData) => {
    if (!dragging) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const index = dropIndexAt(event.currentTarget.querySelector("ul"), event.clientY, dragging.cardId);
    if (dropTarget?.columnId !== column.id || dropTarget.index !== index) setDropTarget({ columnId: column.id, index });
  };

  const onColumnDrop = (event: DragEvent<HTMLElement>, column: KanbanColumnData) => {
    if (!dragging) return;
    event.preventDefault();
    const card = columns.flatMap((candidate) => candidate.cards).find((candidate) => candidate.id === dragging.cardId);
    const index = isCollapsed(column.id)
      ? column.cards.filter((candidate) => candidate.id !== dragging.cardId).length
      : dropIndexAt(event.currentTarget.querySelector("ul"), event.clientY, dragging.cardId);
    const from = columns.find((candidate) => candidate.id === dragging.fromColumnId);
    const fromIndex = from?.cards.findIndex((candidate) => candidate.id === dragging.cardId) ?? -1;
    setDragging(null);
    setDropTarget(null);
    if (!card || (column.id === dragging.fromColumnId && index === fromIndex)) return;
    commit({ cardId: card.id, fromColumnId: dragging.fromColumnId, toColumnId: column.id, toIndex: index }, card);
  };

  const Heading = headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "h4";
  const CardHeading = headingLevel === 2 ? "h3" : headingLevel === 3 ? "h4" : "h5";

  const renderCard = (card: KanbanCardData, column: KanbanColumnData) => {
    const nameId = `${uid}-card-${card.id}`;
    const moveItems: ContextMenuItem[] = shown
      .filter((candidate) => candidate.id !== column.id)
      .map((candidate) => ({
        id: `move-${candidate.id}`,
        label: labels.moveTo(candidate.title),
        icon: "arrow_forward",
        onSelect: () =>
          commit(
            { cardId: card.id, fromColumnId: column.id, toColumnId: candidate.id, toIndex: candidate.cards.length },
            card,
          ),
      }));
    const extra = cardMenuItems?.(card, column) ?? [];
    const items: ContextMenuItem[] = [
      ...moveItems,
      ...(moveItems.length && extra.length ? [{ id: "move-separator", separator: true as const }] : []),
      ...extra,
    ];
    const lifted = pickup?.cardId === card.id;
    return (
      <article
        ref={(node) => {
          if (node) cardNodes.current.set(card.id, node);
          else cardNodes.current.delete(card.id);
        }}
        className="ts-card ts-kanban-card"
        tabIndex={0}
        draggable={!list && !pickup}
        aria-roledescription={labels.cardRole}
        aria-labelledby={nameId}
        aria-describedby={instructionsId}
        data-lifted={lifted || undefined}
        data-dragging={dragging?.cardId === card.id || undefined}
        onKeyDown={(event) => onCardKeyDown(event, card, column)}
        onDragStart={(event) => {
          if (list || event.target !== event.currentTarget) return;
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            // Firefox only starts a drag when data is set; the id is not personal data.
            event.dataTransfer.setData("text/plain", card.id);
          }
          setDragging({ cardId: card.id, fromColumnId: column.id });
        }}
        onDragEnd={() => {
          setDragging(null);
          setDropTarget(null);
        }}
      >
        <span className="ts-kanban-card__avatar" aria-hidden="true">
          <Avatar name={card.name} {...(card.avatarSrc ? { src: card.avatarSrc } : {})} />
        </span>
        <div className="ts-kanban-card__main">
          <CardHeading id={nameId} className="ts-kanban-card__name">
            {card.href ? <a href={card.href}>{card.name}</a> : card.name}
          </CardHeading>
          {card.role && <p className="ts-kanban-card__role">{card.role}</p>}
          {card.meta && <p className="ts-kanban-card__meta">{card.meta}</p>}
          {card.tags && card.tags.length > 0 && (
            <ul className="ts-kanban-card__tags">
              {card.tags.map((tag) => (
                <li key={tag}>
                  <Badge tone="neutral">{tag}</Badge>
                </li>
              ))}
            </ul>
          )}
          {card.status && (
            <StatusPill tone={card.status.tone ?? "neutral"} className="ts-kanban-card__status">
              {card.status.label}
            </StatusPill>
          )}
        </div>
        {(card.age || items.length > 0) && (
          <div className="ts-kanban-card__aside">
            {card.age && (
              <span className="ts-kanban-card__age">
                <span aria-hidden="true">{card.age}</span>
                {card.ageLabel && <span className="ts-visually-hidden">{card.ageLabel}</span>}
              </span>
            )}
            {items.length > 0 && (
              <div className="ts-kanban-card__menu">
                <ContextMenu triggerLabel={labels.cardMenu(card.name)} items={items} />
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

  const renderColumn = (column: KanbanColumnData) => {
    const collapsed = isCollapsed(column.id);
    const headingId = `${uid}-column-${column.id}`;
    const bodyId = `${headingId}-body`;
    const menuItems = columnMenuItems?.(column) ?? [];
    const over = dropTarget?.columnId === column.id;
    let slot = 0;
    const rows: ReactNode[] = [];
    for (const card of column.cards) {
      const isDragged = dragging?.cardId === card.id;
      if (over && dropTarget.index === slot && !isDragged) {
        rows.push(<li key={`drop-${slot}`} aria-hidden="true" className="ts-kanban__drop-indicator" />);
      }
      if (!isDragged) slot += 1;
      rows.push(
        <li key={card.id} data-card-id={card.id} className="ts-kanban__item">
          {renderCard(card, column)}
        </li>,
      );
    }
    if (over && dropTarget.index >= slot) {
      rows.push(<li key="drop-end" aria-hidden="true" className="ts-kanban__drop-indicator" />);
    }
    return (
      <section
        key={column.id}
        className="ts-kanban__column"
        aria-labelledby={headingId}
        data-tone={toneClass(column.tone)}
        data-collapsed={collapsed || undefined}
        data-drop-target={over || undefined}
        onDragOver={(event) => onColumnDragOver(event, column)}
        onDragLeave={(event) => {
          if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
          setDropTarget((previous) => (previous?.columnId === column.id ? null : previous));
        }}
        onDrop={(event) => onColumnDrop(event, column)}
      >
        <header className="ts-kanban__header">
          <Heading id={headingId} className="ts-kanban__title">
            {column.title}
          </Heading>
          <Badge tone={column.tone ?? "neutral"} className="ts-kanban__count">
            <span aria-hidden="true">{column.cards.length}</span>
            <span className="ts-visually-hidden">{labels.count(column.cards.length)}</span>
          </Badge>
          {!collapsed && menuItems.length > 0 && (
            <ContextMenu triggerLabel={labels.columnMenu(column.title)} items={menuItems} />
          )}
          <button
            type="button"
            className="ts-kanban__icon-button ts-kanban__toggle"
            aria-expanded={!collapsed}
            aria-controls={collapsed ? undefined : bodyId}
            aria-label={collapsed ? labels.expand(column.title) : labels.collapse(column.title)}
            onClick={() => setCollapsed(column.id, !collapsed)}
          >
            <Icon name={collapsed ? "chevron_right" : "expand_more"} />
          </button>
        </header>
        {!collapsed && (
          <div id={bodyId} className="ts-kanban__body">
            <ul className="ts-kanban__cards">{rows}</ul>
            {column.cards.length === 0 && (
              <EmptyState
                compact
                variant="no-records"
                icon="group_add"
                title={labels.emptyTitle}
                body={labels.emptyBody}
              />
            )}
            {onAddCard && (
              <Button
                variant="ghost"
                className="ts-kanban__add"
                icon="add"
                aria-label={labels.addCard(column.title)}
                onClick={() => onAddCard(column.id)}
              >
                {labels.addCardShort}
              </Button>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className={cx("ts-kanban", list ? "ts-kanban--list" : "ts-kanban--board", className)}>
      <p id={instructionsId} className="ts-visually-hidden">
        {labels.instructions}
      </p>
      <div role="status" aria-live="polite" aria-atomic="true" className="ts-visually-hidden">
        {announcement}
      </div>
      {list ? (
        <div className="ts-kanban__columns">{shown.map(renderColumn)}</div>
      ) : (
        // A focusable scroll region keeps horizontal scrolling reachable by keyboard.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        <div ref={scroller} className="ts-kanban__scroller" role="region" aria-label={labels.board} tabIndex={0}>
          <div className="ts-kanban__columns">{shown.map(renderColumn)}</div>
        </div>
      )}
    </div>
  );
}
