/**
 * Where a signed-in user belongs: their boards, or workspace setup when they
 * have no workspace yet and are allowed to create one.
 */
export const signInDestination = ({
  organizationId,
  canCreateOrg,
}: {
  organizationId: string;
  canCreateOrg: boolean;
}): '/project' | '/organization/create' =>
  organizationId || !canCreateOrg ? '/project' : '/organization/create';
