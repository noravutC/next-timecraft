"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    async function checkOrg() {
      try {
        const res = await fetch("/api/organization/check");
        const data = await res.json();

        if (!data.hasOrg) {
          router.push("/organization/create");
        } else {
          router.push("/project");
        }
      } catch (err) {
        console.error(err);
      }
    }

    checkOrg();
  }, [session, status, router]);

  return <div className="w-full h-full flex items-center justify-center">Loading...</div>
}