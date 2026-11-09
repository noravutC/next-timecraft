/**
 * Where a signed-in user belongs: their boards, or workspace setup when they
 * have no workspace yet and are allowed to create one. Someone who was
 * invited to a board already has somewhere to go, workspace or not.
 */
export const signInDestination = ({
  organizationId,
  canCreateOrg,
  hasBoards = false,
}: {
  organizationId: string;
  canCreateOrg: boolean;
  hasBoards?: boolean;
}): '/project' | '/organization/create' =>
  organizationId || hasBoards || !canCreateOrg
    ? '/project'
    : '/organization/create';
