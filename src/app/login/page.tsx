'use client';

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function Login() {
    return (
    <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <Button onClick={() => signIn("google")} >
          Sign in with Google
        </Button>
      </div> 
    );
      
}