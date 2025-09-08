// src/hooks/useMembership.hook.ts
import { create } from "zustand";
import { Membership } from "@/types";
import { membershipServices } from "@/lib/services/member-ship.service";
import { LoaderStatus } from "./hook.type";
import { toast } from "sonner";

interface MembershipStore {
  memberShips: Record<string, Membership>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setMemberShip: (orgId: string, orgData: Membership) => void;
  setMemberShips: (memberShips: Membership[]) => void;
  clearMemberShips: () => void;

  // get
  getMemberShipById: (
    orgId: string | null | undefined
  ) => Membership | undefined;

  // fetch
  fetchMembershipByUserId: (userId: string) => Promise<Membership[]>;

  //action
  createMemberShipWithUserId: (
    data: Partial<Membership>,
  ) => Promise<Membership | null>;
}

export const useMembershipStore = create<MembershipStore>((set, get) => ({
  memberShips: {},
  status: "none",

  setStatus: (status) => set({ status }),

  setMemberShip: (orgId, orgData) => {
    if (orgId !== orgData._id) {
      console.log(`Membership ID mismatch: ${orgId} !== ${orgData._id}`);
    }
    set((state) => ({
      memberShips: {
        ...state.memberShips,
        [orgId]: orgData,
      },
    }));
  },

  setMemberShips: (memberShips) => {
    const mapped = memberShips.reduce((acc, column) => {
      if (column._id) {
        acc[column._id] = column;
      }
      return acc;
    }, {} as Record<string, Membership>);
    set((state) => ({
      memberShips: {
        ...state.memberShips,
        ...mapped,
      },
    }));
  },

  clearMemberShips: () => set({ memberShips: {} }),


  getMemberShipById: (orgId: string | null | undefined) => {
    return get().memberShips[orgId ?? ""];
  },

  fetchMembershipByUserId: async (userId: string) => {
    try {
      set({ status: "fetching" });
      const response = await membershipServices.getMemberShipByUserId(userId);
      const memberShips = response?.data || [];

      if (memberShips.length > 0) {
        get().setMemberShips(memberShips);
      }

      return memberShips;
    } catch (error) {
      console.error("Failed to fetch memberShips:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
  createMemberShipWithUserId: async (data: Partial<Membership>) => {
    try {
        set({ status: "creating" });
        if (!data.userId || !data.organizationId || !data.role) {
            toast.error('Your missing fields!')
            return null;
        }
        const response = await membershipServices.createMemberShip(data);
        toast.success(`Success created membership success.`)
        return response.created;
    } catch (error) {
      console.error("Failed to created membership with user Id:", error);
      toast.error('Something wrong cannot create membership.')
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));
