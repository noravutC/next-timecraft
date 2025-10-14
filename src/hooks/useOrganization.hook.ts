// src/hooks/useOrganization.hook.ts
import { create } from "zustand";
import { Organizations } from "@/types";
import { organizationServices } from "@/lib/services/organization.service";
import { LoaderStatus } from "./hook.type";
import { toast } from "sonner";

interface OrganizationStore {
  organizations: Record<string, Organizations>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setOrganization: (orgId: string, orgData: Organizations) => void;
  setOrganizations: (organizations: Organizations[]) => void;
  clearOrganizations: () => void;

  // get
  getOrganizationById: (
    orgId: string | null | undefined
  ) => Organizations | undefined;

  // fetch
  fetchOrganizations: () => Promise<Organizations[]>;

  //action
  createOrganizationWithUserId: (
    data: Partial<Organizations>,
  ) => Promise<Organizations | null>;
}

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  organizations: {},
  status: "none",

  setStatus: (status) => set({ status }),

  setOrganization: (orgId, orgData) => {
    if (orgId !== orgData._id) {
      console.log(`Organizations ID mismatch: ${orgId} !== ${orgData._id}`);
    }
    set((state) => ({
      organizations: {
        ...state.organizations,
        [orgId]: orgData,
      },
    }));
  },

  setOrganizations: (organizations) => {
    const mapped = organizations.reduce((acc, column) => {
      acc[column._id] = column;
      return acc;
    }, {} as Record<string, Organizations>);
    set((state) => ({
      organizations: {
        ...state.organizations,
        ...mapped,
      },
    }));
  },

  clearOrganizations: () => set({ organizations: {} }),

  getOrganizationById: (orgId: string | null | undefined) => {
    return get().organizations[orgId ?? ""];
  },

  fetchOrganizations: async () => {
    try {
      set({ status: "fetching" });
      const response = await organizationServices.getOrganizations();
      const organizations = response?.data || [];

      if (organizations.length > 0) {
        get().setOrganizations(organizations);
      }

      return organizations;
    } catch (error) {
      console.log("Failed to fetch organizations:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
  createOrganizationWithUserId: async (data: Partial<Organizations>) => {
    try {
        set({ status: "creating" });
        if (!data.createdBy) {
            toast.error('Your are not sign up!')
            return null;
        }
        const response = await organizationServices.createOrganization(data);
        toast.success(`Success created organization name is ${response.created?.name}`)
        return response.created;
    } catch (error) {
      console.log("Failed to created organizations with user Id:", error);
      toast.error('Something wrong cannot create organization.')
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));
