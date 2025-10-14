'use client';

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoaderPage } from "@/components/Loader-page";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
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
  } else if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
      </div>
    );
  } else {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoaderPage ballSize={4} />
      </div>
    )
  }
}