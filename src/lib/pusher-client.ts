'use client';
// lib/pusher-client.ts
import Pusher from "pusher-js";
// Use for client side
export const pusherClient = new Pusher(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
);
