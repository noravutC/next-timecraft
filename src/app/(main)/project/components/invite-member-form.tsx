import { Combobox } from "@/components/selector/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Mail, X } from "lucide-react";
import React, { useState } from "react";


export const MultiEmailInput = () => {
    const [emails, setEmails] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
    const [role, setRole] = useState<string | null>(null);

    const addEmail = (value: string) => {
        const email = value.trim();
        if (/\S+@\S+\.\S+/.test(email) && !emails.includes(email)) {
            setEmails([...emails, email]);
        }
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === "Tab" || e.key === ",") && input) {
            e.preventDefault();
            addEmail(input);
        }
    };

    const removeEmail = (email: string) => {
        setEmails(emails.filter((e) => e !== email));
    };

    const sendInvites = () => {
        console.log("Inviting: ", invites);
        // 🔹 call API here
    };

    const exampleOption = [
        { id: '1', name: 'Admin', description: 'Manager all accesses in project' },
        { id: '2', name: 'Member', description: 'Manager task in project' },
        { id: '3', name: 'View', description: 'View data in project' },
    ];

    return (
        <div className="max-w-[600px] w-full max-h-[50vh] h-[50vh] rounded shadow-sm border p-4 flex flex-col gap-4">
            <span className="px-2 text-lg font-semibold mb-2">Invite people to your project</span>
            {/* <div className="h-max flex flex-col gap-4">
                </div> */}
            <div className="flex gap-2 items-end justify-start">
                <div className="flex flex-col gap-2 w-full px-2">
                    <div className="text-sm font-semibold text-gray-600">Email address</div>
                    <div
                        className={cn("flex items-center border rounded p-2 cursor-text",
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
                                    className={cn("focus-visible:border-none focus-visible:ring-0 border-none ",
                                        "focus-visible:shadow-none",
                                        "h-fit p-0 shadow-none rounded-none w-[150px]"
                                    )}
                                    autoFocus
                                    type="email"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
            <div className="min-h-max border rounded mx-2 flex items-center justify-between">
                <span className="text-sm text-gray-500 mx-4">www.timeCraft.co.th</span>
                <Button variant={'ghost'} className="rounded text-xs bg-gray-200 cursor-pointer">Copy link</Button>
            </div>
            <div className="flex-1 flex justify-end items-end gap-4">
                <Button variant={'outline'} className="text-xs cursor-pointer rounded">Skip</Button>
                <Button className="text-xs cursor-pointer rounded">Invite</Button>
            </div>

        </div>
    )
}
