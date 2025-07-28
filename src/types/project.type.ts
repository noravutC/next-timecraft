// types/projects.type.ts
import { ObjectId } from "mongodb";
import { Member } from "@/src/types/member.type";
import { Columns } from "@/src/types/column.type";

export interface Projects {
    _id: string;
    project_name: string;
    project_url: string;
    project_type: {
        name: string;
        value: ObjectId;
    };
    columns: Columns[];
    members: Member[];
    // leader: {
    //     name: string;
    //     _id: ObjectId;
    // };
    org_id: string;
    // created_at: Date;
    // updated_at: Date;
}