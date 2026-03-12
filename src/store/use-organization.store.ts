import { create } from "zustand";
import { CreateOrganizationPayload, OrganizationCache } from "@/types";
import { LoaderStatus } from "@/hooks/hook.type";
import { organizationServices } from "@/services/organization.service";

type OrganizationStore = {
  status: LoaderStatus;
  organization: OrganizationCache | null;
  fetchUserOrganization: (orgId: string) => Promise<OrganizationCache | null>;
  createOrganization: (
    payload: CreateOrganizationPayload
  ) => Promise<OrganizationCache | null>;
};

export const useOrganizationStore = create<OrganizationStore>((set) => ({
  status: "none",
  organization: null,
  fetchUserOrganization: async (orgId) => {
    set({ status: "fetching" });
    try {
      const response = await organizationServices.getOrganizations();
      const organizations = response.data ?? [];
      const organization = organizations.find(
        (currentOrganization) => currentOrganization.id === orgId
      ) ?? null;
      set({ organization, status: "none" });
      return organization;
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
  createOrganization: async (payload) => {
    set({ status: "creating" });
    try {
      const response = await organizationServices.createOrganization(payload);
      const organization = response.created
        ? {
            ...response.created,
            timestamp: Date.now(),
          }
        : null;

      set({ organization, status: "none" });
      return organization;
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
}));
