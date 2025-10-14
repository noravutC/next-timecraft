// types/projects.type.ts

export interface Project {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: Member[];
  tags?: string[];
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  userId: string; // ObjectId
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: Date;
}
