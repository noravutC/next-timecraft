import { create } from "zustand";
import { UserCache } from "@/types";
import { LoaderStatus } from "@/types/global/types";
import { userServices } from "@/services/user.service";
import { toRecord } from "@/helper/utils/object";

type UserStore = {
  status: LoaderStatus;
  users: Record<string, UserCache>;
  fetchUsers: (userIds: string[]) => Promise<void>;
};

export const useUserStore = create<UserStore>((set, get) => ({
  status: "none",
  users: {},
  fetchUsers: async (userIds) => {
    const cached = get().users;
    const toFetch = userIds.filter((id) => !cached[id]);
    if (toFetch.length === 0) return;

    set({ status: "fetching" });
    try {
      const response = await userServices.getUserByIds(toFetch);
      const usersWithTimestamp = (response.data as UserCache[]).map((u) => ({
        ...u,
        timestamp: Date.now(),
      }));
      const usersMap = toRecord(usersWithTimestamp, "id");
      set((state) => ({
        users: { ...state.users, ...usersMap },
        status: "none",
      }));
    } catch {
      set({ status: "error" });
    }
  },
}));
