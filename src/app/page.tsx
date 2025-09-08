"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

  } , [session, status, router]);

  return <div className="w-full h-full flex items-center justify-center">Loading...</div>
}