import { create } from "zustand";
import { UserCache } from "@/types";
import { LoaderStatus } from "@/types/global/types";
import { userServices } from "@/services/user.service";
import { chunk, toRecord } from "@/helper/utils/object";

const USER_LOOKUP_LIMIT = 100;

type UserStore = {
  status: LoaderStatus;
  users: Record<string, UserCache>;
  fetchUsers: (userIds: string[]) => Promise<void>;
};

// ids already on their way: several components ask for the same members
const pendingIds = new Set<string>();

export const useUserStore = create<UserStore>((set, get) => ({
  status: "none",
  users: {},
  fetchUsers: async (userIds) => {
    const cached = get().users;
    const toFetch = [...new Set(userIds)].filter(
      (id) => !cached[id] && !pendingIds.has(id),
    );
    if (toFetch.length === 0) return;
    toFetch.forEach((id) => pendingIds.add(id));

    set({ status: "fetching" });
    try {
      // the look-up API takes at most USER_LOOKUP_LIMIT ids per call
      const responses = await Promise.all(
        chunk(toFetch, USER_LOOKUP_LIMIT).map((ids) =>
          userServices.getUserByIds(ids),
        ),
      );
      const usersWithTimestamp = responses
        .flatMap((response) => response.data as UserCache[])
        .map((u) => ({ ...u, timestamp: Date.now() }));
      const usersMap = toRecord(usersWithTimestamp, "id");
      set((state) => ({
        users: { ...state.users, ...usersMap },
        status: "none",
      }));
    } catch {
      set({ status: "error" });
    } finally {
      toFetch.forEach((id) => pendingIds.delete(id));
    }
  },
}));
