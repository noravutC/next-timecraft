'use client';

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
// import { LoaderPage } from "@/components/Loader-page";
import { LogoAnimation } from "@/components/logo-space/logo-animation";
import LogoAnimationLoop from "@/components/logo-space/logo-animation-loop";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'unauthenticated') {
      // console.log('unauthenticated');
      router.push("/login");
      // return;
    }
    if (session) {
      router.push("/project");
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LogoAnimationLoop />
      </div>
    )
  } else {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LogoAnimation />
      </div>
    )
  }
}
