// src/hooks/useUsers.hook.ts
import { create } from "zustand";
import { User, UserCache } from "@/types";
import { userServices } from "@/lib/services/user.service";
import { LoaderStatus } from "./hook.type";
import { toast } from "sonner";

interface UserStore {
  users: Record<string, UserCache>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setUser: (userId: string, userData: UserCache) => void;
  setUsers: (users: Record<string, UserCache>) => void;
  clearUsers: () => void;

  // get
  getUserById: (userId: string) => User | undefined;
  getUsersByIds: (userIds: string[]) => User[];

  // fetch
  fetchUsersById: (userId: string | null | undefined) => Promise<void>;
  fetchUsersByIds: (userIds: string[]) => Promise<void>;
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
    set((state) => ({
      users: {
        ...state.users,
        ...users,
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
        // get().setUsers(users);
      }

      // return users;
    } catch (error) {
      console.log("Failed to fetch users:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  fetchUsersByIds: async (userIds: string[]) => {
    const { users, setUsers } = get();
    const now = Date.now();
    const cacheDuration = 5 * 60 * 1000; // 5 minute
    const needFetchUserIds: string[] = [];
    userIds.forEach((id) => {
      const currentUserValue = users[id];

      if (currentUserValue && currentUserValue.timestamp - now > cacheDuration) {
        needFetchUserIds.push(id);
      }

      if(!currentUserValue) needFetchUserIds.push(id);
    })

    // No actions because have user in cache or userIds is empty
    if(needFetchUserIds.length === 0) return;

    try {
      set({ status: "fetching" });
      const response = await userServices.getUserByIds(userIds ?? "");
      const users = response?.data || [];
      // Not found users
      if (users.length === 0) return;

      const usersCache: Record<string, UserCache> = {};
      users.forEach((u) => {
        if(u._id) {
          usersCache[u._id] = {
            ...u,
            timestamp: now,
          } as UserCache;
        }
      })
      setUsers(usersCache);
      // return users;
    } catch (error) {
      console.log("Failed to fetch users:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));
