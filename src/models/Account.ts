/**
 * A registered account (managed by the auth provider).
 * An account is not a health profile: registering never creates one (FR01).
 */
export type Account = {
  id: string;
  email: string;
};
