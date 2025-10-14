// src/hooks/useUsers.hook.ts
import { create } from "zustand";
import { User } from "@/types";
import { userServices } from "@/lib/services/user.service";
import { LoaderStatus } from "./hook.type";

interface UserStore {
  users: Record<string, User>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setUser: (userId: string, userData: User) => void;
  setUsers: (users: User[]) => void;
  clearUsers: () => void;

  // get
  getUserById: (userId: string) => User | undefined;
  getUsersByIds: (userIds: string[]) => User[];

  // fetch
  fetchUsersById: (userId: string | null | undefined) => Promise<User[]>;
  fetchUsersByIds: (userIds: string[]) => Promise<User[]>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: {},
  status: "none",

  setStatus: (status) => set({ status }),

  setUser: (userId, userData) => {
    if (userId !== userData._id) {
      console.warn(`User ID mismatch: ${userId} !== ${userData._id}`);
    }
    set((state) => ({
      users: {
        ...state.users,
        [userId]: userData,
      },
    }));
  },

  setUsers: (users) => {
    const mapped = users.reduce((acc, column) => {
      acc[column._id] = column;
      return acc;
    }, {} as Record<string, User>);
    set((state) => ({
      users: {
        ...state.users,
        ...mapped,
      },
    }));
  },

  clearUsers: () => set({ users: {} }),

  getUserById: (userId: string) => {
    return get().users[userId];
  },

  getUsersByIds: (userIds: string[]) => {
    const allStateUsers = get().users;
    const filteredUsers = Object.values(allStateUsers).filter(
      (user) => userIds.includes(user._id)
    );
    return filteredUsers;
  },

  fetchUsersById: async (userId: string | null | undefined) => {
    try {
      set({ status: "fetching" });
      const response = await userServices.getUserById(userId ?? "");
      const users = response?.data || [];

      if (users.length > 0) {
        get().setUsers(users);
      }

      return users;
    } catch (error) {
      console.log("Failed to fetch users:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  fetchUsersByIds: async (userIds: string[]) => {
    try {
      set({ status: "fetching" });
      const response = await userServices.getUserByIds(userIds ?? "");
      const users = response?.data || [];
      console.log('FETCHED USERS BY IDS:', users);
      if (users.length > 0) {
        get().setUsers(users);
      }

      return users;
    } catch (error) {
      console.log("Failed to fetch users:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));
