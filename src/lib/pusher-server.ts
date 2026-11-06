// lib/pusher.ts
import Pusher from "pusher";
import { privateChannel } from "@/helper/utils/realtime-channel";
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

// `channel` is the logical name (`project-{id}`); it is sent on the private
// channel, which only sockets approved by /api/pusher/auth can join.
export const triggerExclusive = (
  req: Request,
  channel: string,
  event: string,
  data: unknown,
) =>
  pusherServer.trigger(privateChannel(channel), event, data, {
    socket_id: socketIdFromRequest(req),
  });
