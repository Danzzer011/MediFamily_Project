/**
 * A registered account (managed by the auth provider).
 * An account is not a health profile: registering never creates one (FR01).
 */
export interface Account {
  id: string;
  email: string;
}
