export type Role = "ASHA" | "BLOCK" | "DISTRICT";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  state: string;
  district: string;
  block: string;
  village: string;
  facility?: string;
  facilityOrVillage: string;
  designation?: string;
  phone?: string;
}

export interface RegisteredCredential {
  id: string;
  name: string;
  role: Role;
  pin: string;
  state: string;
  district: string;
  block: string;
  village: string;
  facility?: string;
  facilityOrVillage: string;
  designation: string;
  phone?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (
    identifier: string,
    pin: string,
    expectedRole?: Role
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  quickLogin: (accountId: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
}
