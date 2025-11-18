'use client';

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoaderPage } from "@/components/Loader-page";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push("/login");
      // return;
    }
    if (session) {
      router.push("/home");
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoaderPage ballSize={4} />
      </div>
    )
  } else {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoaderPage ballSize={4} />
      </div>
    )
  }
}
