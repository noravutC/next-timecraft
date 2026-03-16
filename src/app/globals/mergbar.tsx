"use client";
import React from "react";

import { Sidebar } from "./side-bar";
import { Header } from "./sidebar-components/header";
import { useSession } from "next-auth/react";

// Don't used yet
export const MergBar = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  return (
    <>
      {session && (
        <div className="h-full w-full flex flex-col overflow-hidden">
          {/* <div className="h-14 bg-white border-b-3 border-[#eeeff2] w-full flex items-center justify-center shrink-0 z-10">
                        <Topbar />
                    </div> */}

          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              childrenHeader={
                <>
                  <Header />
                </>
              }
            />
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white p-4">
              {children}
            </main>
          </div>
        </div>
      )}
    </>
  );
};
