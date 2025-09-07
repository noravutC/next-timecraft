'use client';
import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const { data: session } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (session) {
      router.push("/home");
    }
  }, [session, router]);

  return (
    <>
      {session ? (
        <div className="w-full h-full flex items-center justify-center">
          Loading...
        </div>
      ) : (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
      </div>  
      )}
    </>
  );
}