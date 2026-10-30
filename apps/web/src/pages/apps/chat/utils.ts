import type { ChatConversation, ChatMessage } from "../../../demo/apps.ts";

export interface DayGroup {
  /** ISO date, yyyy-mm-dd. */
  day: string;
  messages: readonly ChatMessage[];
}

/** Groups messages by calendar day, keeping chronological order. */
export function groupByDay(messages: readonly ChatMessage[]): DayGroup[] {
  const groups: { day: string; messages: ChatMessage[] }[] = [];
  for (const message of messages.toSorted((a, b) => a.at.localeCompare(b.at))) {
    const day = message.at.slice(0, 10);
    const last = groups.at(-1);
    if (last?.day === day) last.messages.push(message);
    else groups.push({ day, messages: [message] });
  }
  return groups;
}

export function lastMessage(conversation: ChatConversation): ChatMessage | undefined {
  return conversation.messages.toSorted((a, b) => a.at.localeCompare(b.at)).at(-1);
}

/** Conversations with the most recent message first. */
export function sortConversations(conversations: readonly ChatConversation[]): ChatConversation[] {
  return conversations.toSorted((a, b) => (lastMessage(b)?.at ?? "").localeCompare(lastMessage(a)?.at ?? ""));
}

export function filterConversations(conversations: readonly ChatConversation[], query: string): ChatConversation[] {
  const needle = query.trim().toLocaleLowerCase("nl-NL");
  if (!needle) return [...conversations];
  return conversations.filter(
    (conversation) =>
      conversation.name.toLocaleLowerCase("nl-NL").includes(needle) ||
      conversation.messages.some((message) => message.text.toLocaleLowerCase("nl-NL").includes(needle)),
  );
}
