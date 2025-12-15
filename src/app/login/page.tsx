// 'use client';

// import { useEffect } from "react";
// import { signIn, useSession } from "next-auth/react";
// import { useRouter } from "next/navigation";
// // components
// import { Button } from "@/components/ui/button";

// export default function Login() {
//   const { data: session, status } = useSession();
//   const router = useRouter();

//   if (status === "loading") {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         Loading...
//       </div>
//     )
//   }

//   useEffect(() => {

//     async function checkOrg() {
//       try {
//         const res = await fetch("/api/organization/check");
//         const data = await res.json();

//         if (!data.hasOrg) {
//           router.push("/organization/create");
//         } else {
//           router.push("/project");
//         }
//       } catch (err) {
//         console.log(err);
//       }
//     }

//     checkOrg();
//   }, [session, status, router]);

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">Login</h1>
//       <Button onClick={() => signIn("google")} >
//         Sign in with Google
//       </Button>
//     </div>
//   );

// }

// 'use client';

// import { signIn, useSession } from "next-auth/react";
// import { useRouter } from "next/navigation";
// // components
// import { Button } from "@/components/ui/button";

// export default function Login() {
//   const { data: session, status } = useSession();
//   const router = useRouter();

//   if (status === "loading") {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         Loading...
//       </div>
//     )
//   }
//   if (session) {
//     router.push('/organization/create');
//   }
//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">Login</h1>
//       <Button onClick={() => signIn("google")} >
//         Sign in with Google
//       </Button>
//     </div>
//   );

// }

'use client';

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// components
import { Button } from "@/components/ui/button";
import { LoaderPage } from "@/components/Loader-page";
import LogoAnimationLoop from "@/components/logo-space/logo-animation-loop";
import { LogoAnimation } from "@/components/logo-space/logo-animation";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (session) {
      if (session?.user?.canCreateOrg) {
        router.push('/organization/create');
      } else {
        router.push('/project');
      }
    }
  }, [session, router]);

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-between gap-10 min-h-screen">
        {/* <h1 className="text-2xl font-bold mb-4">Login</h1> */}
        <div className="flex-1 flex items-center justify-center pt-30">
          <LogoAnimation />
        </div>
        <div
          className={`
    min-h-[100px] flex items-center justify-center
    transition-opacity duration-700
    ${showButton ? "opacity-100" : "opacity-0"}
  `}
        >
          <Button className="g_id_signin" onClick={() => signIn("google")}>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  } else if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* <LoaderPage ballSize={4} /> */}
        <LogoAnimationLoop />
      </div>
    )
  } else {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* <LoaderPage ballSize={4} /> */}
        <LogoAnimationLoop />
      </div>
    )
  }

  // return (
  // <div className="flex flex-col items-center justify-center min-h-screen">
  //   <h1 className="text-2xl font-bold mb-4">Login</h1>
  //   <Button onClick={() => signIn("google")}>
  //     Sign in with Google
  //   </Button>
  // </div>
  // );
}
