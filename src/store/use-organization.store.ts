import { create } from "zustand";
import { CreateOrganizationPayload, OrganizationCache } from "@/types";
import { LoaderStatus } from "@/types/global/types";
import { organizationServices } from "@/services/organization.service";

type OrganizationStore = {
  status: LoaderStatus;
  organization: OrganizationCache | null;
  fetchUserOrganization: (orgId: string) => Promise<OrganizationCache | null>;
  /** the request itself; call fetchUserOrganization, which dedupes */
  loadOrganization: (orgId: string) => Promise<OrganizationCache | null>;
  createOrganization: (
    payload: CreateOrganizationPayload,
  ) => Promise<OrganizationCache | null>;
};

// one request at a time per org: header, switcher and first-board page all
// ask for the workspace on mount
let inflight: { orgId: string; promise: Promise<OrganizationCache | null> } | null =
  null;

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  status: "none",
  organization: null,
  fetchUserOrganization: (orgId) => {
    if (inflight?.orgId === orgId) return inflight.promise;
    const promise = get().loadOrganization(orgId).finally(() => {
      inflight = null;
    });
    inflight = { orgId, promise };
    return promise;
  },
  loadOrganization: async (orgId) => {
    set({ status: "fetching" });
    try {
      const response = await organizationServices.getOrganizations();
      const organizations = response.data ?? [];
      const organization =
        organizations.find(
          (currentOrganization) => currentOrganization.id === orgId,
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
