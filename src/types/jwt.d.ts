export interface TimeCraftJWT extends Record<string, unknown> {
  id?: string;
  systemRole?: string;
  email?: string;
  name?: string;
  picture?: string;
}