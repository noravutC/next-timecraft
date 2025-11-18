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
import { useEffect } from "react";
// components
import { Button } from "@/components/ui/button";
import { LoaderPage } from "@/components/Loader-page";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <Button onClick={() => signIn("google")}>
          Sign in with Google
        </Button>
      </div>
    );
  } else if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoaderPage ballSize={4} />
      </div>
    )
  } else {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoaderPage ballSize={4} />
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
