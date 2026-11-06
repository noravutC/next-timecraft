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
        // all channels are private: our API decides who may join each one
        channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
        userAuthentication: {
          endpoint: "/api/pusher/user-auth",
          transport: "ajax",
        },
      })
    : ({} as Pusher);

// sign the socket in as the session user, so the server can cut it off
if (typeof window !== "undefined") pusherClient.signin();

export const getPusherSocketId = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  return pusherClient?.connection?.socket_id ?? undefined;
};
