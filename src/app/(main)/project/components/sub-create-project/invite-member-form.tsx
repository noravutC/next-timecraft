import { Combobox } from "@/components/selector/combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Mail, X } from "lucide-react";
import React, { useState } from "react";
import { Selector } from "../role-selector";
import { useRouter } from "next/navigation";

interface MultiEmailInputProps {
  onCloseNewProject: (value: boolean) => void;
}
export const MultiEmailInput = ({
  onCloseNewProject,
}: MultiEmailInputProps) => {
  // const router = useRouter();
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);

  const addEmail = (value: string) => {
    const email = value.trim();
    if (/\S+@\S+\.\S+/.test(email) && !emails.includes(email)) {
      setEmails([...emails, email]);
      setInvites([...invites, { email, role: "2" }]); // default = Member
    }
    setInput("");
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
    setInvites(invites.filter((i) => i.email !== email));
  };

  const updateRole = (email: string, newRole: string) => {
    setInvites((prev) =>
      prev.map((i) =>
        i.email === email ? { ...i, role: newRole } : i
      )
    );
  };

  const sendInvites = () => {
    console.log("Inviting: ", invites);
    // 🔹 call API with invites
  };

  // const exampleOption = [
  //   { id: "1", name: "Admin", description: "Manage all accesses in project" },
  //   { id: "2", name: "Member", description: "Manage tasks in project" },
  //   { id: "3", name: "Viewer", description: "View project data only" },
  // ];

  return (
    <div 
    className={
      cn("max-w-[450px] duration-300 w-full max-h-[45vh] h-[45vh] rounded shadow-sm border flex justify-between",
        emails.length > 0 && "max-w-[850px]"
      )

    }
    >
      {/* LEFT SIDE */}
      <div className="max-w-[450px] max-h-[45vh] h-[45vh] w-full flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1 mb-2">
          <span className="px-2 text-lg font-semibold">Invite Team Members</span>
          <span className="px-2 text-sm text-gray-500">
            Invite team members to access and manage this project.
          </span>
        </div>

        <div className="flex gap-2 items-end justify-start">
          <div className="flex flex-col gap-2 w-full px-2">
            <div className="text-sm font-semibold text-gray-600">Email address</div>
            <div
              className={cn(
                "flex items-center border rounded p-2 cursor-text",
                "focus-within:ring-2 focus-within:ring-blue-500"
              )}
            >
              <ScrollArea className="min-h-fit h-[10vh] w-full">
                <div className="flex flex-wrap items-center gap-2">
                  {emails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      <Mail size={13} />
                      <span>{email}</span>
                      <X
                        size={14}
                        className="cursor-pointer"
                        onClick={() => removeEmail(email)}
                      />
                    </div>
                  ))}
                  <Input
                    placeholder="email@address.com"
                    className={cn(
                      "focus-visible:border-none focus-visible:ring-0 border-none",
                      "focus-visible:shadow-none",
                      "h-fit p-0 shadow-none rounded-none w-[150px]"
                    )}
                    autoFocus
                    type="email"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Enter" || e.key === "Tab" || e.key === ",") &&
                        input
                      ) {
                        e.preventDefault();
                        addEmail(input);
                      }
                    }}
                  />
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-end items-end gap-4 px-2">
          <Button 
          variant={"outline"} 
          className="text-xs cursor-pointer rounded"
          onClick={() => onCloseNewProject(false)}
          >
            Skip
          </Button>
          <Button
            className="text-xs cursor-pointer rounded"
            onClick={sendInvites}
          >
            Invite
          </Button>
        </div>
      </div>

      {/* RIGHT SIDE */}
      {emails.length > 0 && (
      <div className="max-w-[400px] max-h-[45vh] h-[45vh] w-full p-4">
        <ScrollArea className="h-[40vh] rounded p-2">
          {invites.map((invite, index) => (
            <div
              key={index}
              className={cn(
                "max-w-[350px] w-full h-[40px] rounded-md",
                "flex justify-between items-center",
                "border shadow p-2 mb-2"
              )}
            >
              <span className="max-w-[200px] text-sm font-semibold">
                {invite.email}
              </span>
              <Selector value={invite.role} onChange={(val) => updateRole(invite.email, val)} />
            </div>
          ))}
        </ScrollArea>
      </div>
      )}
    </div>
  );
};
