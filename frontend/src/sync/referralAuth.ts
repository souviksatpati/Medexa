import { useAuthStore } from "@/auth/auth";
import type { Role } from "@/auth/authTypes";

export interface ReferralUser {
  id: string;
  name: string;
  role: "asha" | "block_officer" | "district_officer";
  designation: string;
  facilityOrVillage: string;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
}

function roleToLegacy(
  role: Role,
): "asha" | "block_officer" | "district_officer" {
  if (role === "ASHA") return "asha";
  if (role === "BLOCK") return "block_officer";
  return "district_officer";
}

function legacyToRole(
  role: "asha" | "block_officer" | "district_officer",
): Role {
  if (role === "asha") return "ASHA";
  if (role === "block_officer") return "BLOCK";
  return "DISTRICT";
}

interface AuthSnapshot {
  user: ReturnType<typeof useAuthStore.getState>["user"];
  login: ReturnType<typeof useAuthStore.getState>["login"];
  quickLogin: ReturnType<typeof useAuthStore.getState>["quickLogin"];
  logout: ReturnType<typeof useAuthStore.getState>["logout"];
}

function createReferralAuth(snapshot: AuthSnapshot) {
  const { user, login, quickLogin, logout } = snapshot;

  const ashaUser: ReferralUser | null =
    user?.role === "ASHA"
      ? {
          id: user.id,
          name: user.name,
          role: "asha",
          designation: user.designation || "ASHA Frontline Worker",
          facilityOrVillage: user.facilityOrVillage,
          state: user.state,
          district: user.district,
          block: user.block,
          village: user.village,
        }
      : null;

  const blockOfficerUser: ReferralUser | null =
    user?.role === "BLOCK"
      ? {
          id: user.id,
          name: user.name,
          role: "block_officer",
          designation: user.designation || "Block Health Officer",
          facilityOrVillage: user.facilityOrVillage,
          state: user.state,
          district: user.district,
          block: user.block,
          village: user.village,
        }
      : null;

  const districtOfficerUser: ReferralUser | null =
    user?.role === "DISTRICT"
      ? {
          id: user.id,
          name: user.name,
          role: "district_officer",
          designation: user.designation || "District Medical Officer",
          facilityOrVillage: user.facilityOrVillage,
          state: user.state,
          district: user.district,
          block: user.block,
          village: user.village,
        }
      : null;

  return {
    ashaUser,
    blockOfficerUser,
    districtOfficerUser,

    isAshaAuthenticated: () => user?.role === "ASHA",
    isBlockOfficerAuthenticated: () => user?.role === "BLOCK",
    isDistrictOfficerAuthenticated: () => user?.role === "DISTRICT",

    verifyAndLogin: async (
      identifier: string,
      pin: string,
      expectedRole: "asha" | "block_officer" | "district_officer",
    ) => {
      const result = await login(identifier, pin, legacyToRole(expectedRole));

      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        user: {
          id: result.user.id,
          name: result.user.name,
          role: roleToLegacy(result.user.role),
          designation: result.user.designation || "",
          facilityOrVillage: result.user.facilityOrVillage,
          state: result.user.state,
          district: result.user.district,
          block: result.user.block,
          village: result.user.village,
        },
      };
    },

    loginAsha: async (workerId = "ASHA-WB-401") => {
      return await quickLogin(workerId);
    },

    logoutAsha: () => {
      if (user?.role === "ASHA") logout();
    },

    loginBlockOfficer: async (officerId = "BHO-WB-204") => {
      return await quickLogin(officerId);
    },

    logoutBlockOfficer: () => {
      if (user?.role === "BLOCK") logout();
    },

    loginDistrictOfficer: async (officerId = "CMOH-DIST-101") => {
      return await quickLogin(officerId);
    },

    logoutDistrictOfficer: () => {
      if (user?.role === "DISTRICT") logout();
    },

    logoutAll: () => {
      logout();
    },
  };
}

export function useReferralAuth() {
  const snapshot = useAuthStore();

  return createReferralAuth(snapshot);
}

useReferralAuth.getState = () => createReferralAuth(useAuthStore.getState());
