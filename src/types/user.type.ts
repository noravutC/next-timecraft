// types/user.type.ts
export interface User {
  _id: string;            // ObjectId
  fullName: string;
  email: string;
  avatar?: string;        // optional (บาง user อาจไม่มี avatar)
  createdAt: Date;
  updatedAt: Date;
}
