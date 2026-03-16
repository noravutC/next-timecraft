import React from "react";
import { User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { Skeleton } from "./skeleton";

interface AvatarTimeCraftProps {
  src?: string;
  name: string;
  email?: string;
  loader?: boolean;
}
export const AvatarTimeCraft = React.memo(
  ({ src, name, email, loader }: AvatarTimeCraftProps) => {
    if (loader !== undefined && loader === true) {
      return (
        <div className="flex items-center w-full gap-3">
          <Skeleton className="rounded-full size-8" />
          {/* <Avatar className="size-8 text-gray-500">
                    <AvatarImage src={src} />
                    <AvatarFallback className="bg-gray-200">
                        <User size={14} strokeWidth={3} />
                    </AvatarFallback>
                </Avatar> */}
          <div className="flex flex-col gap-2 text-gray-600">
            <p className="">
              <Skeleton className="w-[80px] h-[10px]" />
            </p>
            <p className="text-xs">
              <Skeleton className="w-[130px] h-[10px]" />
            </p>
          </div>
        </div>
      );
    }
    console.log("src: ", src);
    const partOfname = name.split(" ");
    const firstName = partOfname.length > 0 ? partOfname[0] : name;
    return (
      <div className="flex items-center max-w-[300px] w-full gap-3">
        <Avatar className="size-8 text-gray-500">
          <AvatarImage src={src} loading="lazy" />
          <AvatarFallback className="bg-gray-200">
            <User size={14} strokeWidth={3} />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-gray-600">
          <p className="flex flex-wrap">{firstName}</p>
          <p className="text-xs">{email}</p>
        </div>
      </div>
    );
  },
);
