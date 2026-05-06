// lib/pusher.ts
import Pusher from "pusher";
// Use for server side
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const socketIdFromRequest = (req: Request): string | undefined =>
  req.headers.get("x-socket-id") ?? undefined;

export const triggerExclusive = (
  req: Request,
  channel: string,
  event: string,
  data: unknown,
) =>
  pusherServer.trigger(channel, event, data, {
    socket_id: socketIdFromRequest(req),
  });
