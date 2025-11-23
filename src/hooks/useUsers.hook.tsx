// src/hooks/useUsers.hook.ts
import { create } from "zustand";
import { User, UserCache } from "@/types";
import { userServices } from "@/lib/services/user.service";
import { LoaderStatus } from "./hook.type";
import { toast } from "sonner";

interface UserStore {
  users: Record<string, UserCache>;
  cache: Record<string, number>;

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
  fetchRelatedUser: () => Promise<void>;
  fetchUsersById: (userId: string | null | undefined) => Promise<void>;
  fetchUsersByIds: (userIds: string[]) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: {},
  cache:{},

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
      const response = await userServices.getUserByIds(needFetchUserIds ?? "");
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

  fetchRelatedUser: async () => {
    const CACHE_KEY = 'organizationUsers';
    const { users, cache, setUsers } = get();
    const now = Date.now();
    const cacheDuration = 60 * 1000; //duration time cache 1 minute
    const lastFetchTimestamp = cache[CACHE_KEY] || 0;
    const timeSinceLastFetch = now - lastFetchTimestamp;
    if (lastFetchTimestamp && timeSinceLastFetch < cacheDuration) {
        console.log(`Cache hit for ${CACHE_KEY}. Skipping fetch.`);
        return; // Exit early: data is fresh
    }

    try {
      set({ status: "fetching" });
      const response = await userServices.getUserOrganization();
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
      set((state: any) => ({
            users: usersCache,
            cache: {
                ...state.cache,
                [CACHE_KEY]: now,
            }
        }));
      // setUsers(usersCache);
      // return users;
    } catch (error) {
      console.log("Failed to fetch related users:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  }
}));
