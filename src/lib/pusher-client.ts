// lib/pusher-client.ts
"use client";

import Pusher from "pusher-js";
// Use for client side only
if (typeof window !== "undefined") {
  console.log(
    "Pusher Key Check:",
    process.env.NEXT_PUBLIC_PUSHER_KEY ? "Found ✅" : "Missing ❌",
  );
}

export const pusherClient =
  typeof window !== "undefined"
    ? new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      })
    : ({} as any);
