"use client";

// components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Check, Mail, Plus, Search, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProjectStore, useUserStore } from "@/hooks"
import { useEffect } from "react"
import { AvatarTimeCraft } from "@/components/ui/avatar-timecraft"
import { Member } from "@/types"

export const InviteMembers = () => {
    const { fetchRelatedUser, users } = useUserStore();
    const { updateProject, getProjectById, projectIdActivate } = useProjectStore();
    // console.log('users: ', users);
    const project = getProjectById(projectIdActivate ?? '');
    const usersCanInvite = Object.values(users);

    useEffect(() => {
        fetchRelatedUser();
    }, [])

    if (!project) return null;
    const isMemberIds = project.members.map(m => m.userId);
    const handleToggleInviteMember = (userId: string) => {
        const isMember = isMemberIds.some(mId => mId === userId);
        let updatedMembers: Member[] = [];
        if (isMember) {
            // Remove member
            updatedMembers = project.members.filter(m => m.userId !== userId);
        } else {
            // Add member
            updatedMembers = [
                ...project.members,
                {
                    userId: userId,
                    role: 'viewer',
                    joinedAt: new Date(),
                }
            ];
        }
        updateProject(project._id, { members: updatedMembers });
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {/* Your existing trigger button */}
                <Button size={'sm'} className="gap-2">
                    <Plus className="size-4" />
                    Invite member
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-72" side="bottom" align="end">
                <div className="p-2">
                    {/* 1. Search Input Section */}
                    <DropdownMenuLabel className="text-sm font-semibold mb-2">
                        Invite to Project
                    </DropdownMenuLabel>
                    <div className="relative mb-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by name or email"
                            className="pl-8 h-9"
                        // onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <DropdownMenuSeparator />

                    {/* 2. Suggested/Search Results List */}
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground mt-2">
                        Suggested Members
                    </DropdownMenuLabel>

                    <div className="max-h-48 overflow-y-auto scrollbar-thin-y">
                        {usersCanInvite.map((member) => (
                            <DropdownMenuItem
                                key={member._id}
                                // Prevent the dropdown from closing when clicking on an item
                                onSelect={(e) => e.preventDefault()}
                                disabled={isMemberIds.some((mId) => mId === member._id)}
                                className="flex justify-between items-center py-2"
                                onClick={() => handleToggleInviteMember(member._id)}
                            >
                                <AvatarTimeCraft src={member.avatar} name={member.fullName} email={member.email} />
                            </DropdownMenuItem>
                        ))}
                    </div>

                    <DropdownMenuSeparator />

                    {/* Optional: Direct email invite link/option */}
                    <DropdownMenuItem className="py-2 cursor-pointer">
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Invite by Email Link</span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
