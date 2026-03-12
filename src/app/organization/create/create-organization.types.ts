export type OrganizationInvitation = {
  email: string;
  role: "member";
};

export type PreparedOrganizationData = {
  organization: {
    name: string;
    logoFileName: string | null;
  };
  invitations: OrganizationInvitation[];
  meta: {
    preparedAt: string;
  };
};
