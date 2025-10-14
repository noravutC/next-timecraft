// types/organization.type.ts

export interface Organizations {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}
