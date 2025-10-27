// types/user.type.ts
export interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCache extends User {
  timestamp: number;
}

export interface CurrentUserContextProps {
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
}
