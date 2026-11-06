// Every realtime channel is private: Pusher only lets a socket join after
// /api/pusher/auth approves it. Call sites keep the logical name
// (`project-{id}`, `task-{id}`, `user-{id}`); this adds the wire prefix.
const PRIVATE_PREFIX = 'private-';

export type RealtimeChannelKind = 'project' | 'task' | 'user';

export const privateChannel = (logicalName: string) =>
  `${PRIVATE_PREFIX}${logicalName}`;

const CHANNEL_PATTERN =
  /^private-(project|task|user)-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** `private-project-<uuid>` → { kind, id }; null for anything we don't serve. */
export function parsePrivateChannel(
  channel: string,
): { kind: RealtimeChannelKind; id: string } | null {
  const match = CHANNEL_PATTERN.exec(channel);
  if (!match) return null;
  return { kind: match[1].toLowerCase() as RealtimeChannelKind, id: match[2] };
}
