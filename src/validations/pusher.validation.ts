import { z } from 'zod';

// pusher-js posts these as form fields (transport: 'ajax')
const socketId = z.string().regex(/^\d+\.\d+$/, 'Invalid socket id');

export const pusherChannelAuthSchema = z.object({
  socket_id: socketId,
  channel_name: z.string().min(1).max(200),
});

export const pusherUserAuthSchema = z.object({ socket_id: socketId });
