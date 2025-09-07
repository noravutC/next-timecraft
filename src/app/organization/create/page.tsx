"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
// components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// validate
import { OrganizationSchema, OrganizationType } from "@/model/validate/organization";
// utils
import { cn } from "@/lib/utils";
import { useOrganizationStore } from "@/hooks/useOrganization.hook";

export default function CreateOrganizationPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { createOrganizationWithUserId } = useOrganizationStore();

    const [organizationName, setOrganizationName] = useState<string>("");

    const onCreateOrganization = async () => {
        const organization: OrganizationType = {
            name: organizationName,
            description: '',
            createdBy: session?.user.id ?? '',
        };
        const parsed = OrganizationSchema.parse(organization);
        await createOrganizationWithUserId(parsed);
        router.push('/project');
    }
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div
                className={cn("max-w-[500px] w-full rounded max-h-[60vh] h-fit",
                    "flex flex-col gap-8 p-8 items-center",
                    "shadow-sm border"
                )}
            >
                {/* Label */}
                <div className="flex flex-col gap-2">
                    <span className="flex justify-center text-xl font-[700] text-gray-700">
                        Create Your Organization
                    </span>
                    <span className="max-w-[450px] text-sm text-gray-500 flex justify-center">
                        Set up your organization to start collaborating with your team
                    </span>
                </div>
                <div className="flex flex-col gap-3 w-full items-start">
                    <span className="text-sm text-gray-500 font-semibold">Organization name</span>
                    <Input
                        placeholder="Enter organization name"
                        onChange={(e) => setOrganizationName(e.target.value)}
                    />
                    <span className="text-xs text-gray-500">This will be visible to all team members</span>
                </div>
                <Button className="w-full" onClick={onCreateOrganization}>Create organization</Button>
            </div>
        </div>
    )
}