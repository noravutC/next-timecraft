import { create } from "zustand";
import {
  CreateOrganizationPayload,
  InviteToWorkspacePayload,
  InviteToWorkspaceResult,
  OrganizationCache,
  UpdateOrganizationPayload,
} from "@/types";
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
  inviteToWorkspace: (
    organizationId: string,
    payload: InviteToWorkspacePayload,
  ) => Promise<InviteToWorkspaceResult>;
  /** optimistic: the header shows the new name and logo right away */
  updateOrganization: (
    organizationId: string,
    payload: UpdateOrganizationPayload,
  ) => Promise<void>;
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
  updateOrganization: async (organizationId, payload) => {
    const snapshot = get().organization;
    if (snapshot?.id === organizationId) {
      set({ organization: { ...snapshot, ...payload } });
    }
    try {
      const { updated } = await organizationServices.updateOrganization(
        organizationId,
        payload,
      );
      if (updated && get().organization?.id === organizationId) {
        set({ organization: { ...updated, timestamp: Date.now() } });
      }
    } catch (error) {
      if (snapshot?.id === organizationId) set({ organization: snapshot });
      throw error;
    }
  },
  // leaves `status` alone: it tracks loading the workspace, and an "error"
  // there would stop the header from ever loading its name
  inviteToWorkspace: async (organizationId, payload) => {
    const response = await organizationServices.inviteToWorkspace(
      organizationId,
      payload,
    );
    return response.created ?? { invited: [], skipped: [] };
  },
}));
