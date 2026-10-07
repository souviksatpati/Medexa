import { create } from "zustand";
import type { AuthUser, AuthState, RegisteredCredential, Role } from "./authTypes";

export const HEALTH_REGISTRY_DATABASE: Record<string, RegisteredCredential> = {
  "ASHA-WB-401": {
    id: "ASHA-WB-401",
    name: "Kavita Roy",
    role: "ASHA",
    pin: "1234",
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Rampur Village",
    facilityOrVillage: "Rampur Village / Belur Sector",
    designation: "Accredited Social Health Activist (ASHA)",
    phone: "+91 98321 44510",
  },
  "ASHA-WB-BNK-042": {
    id: "ASHA-WB-BNK-042",
    name: "Kavita Roy",
    role: "ASHA",
    pin: "1234",
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Rampur Village",
    facilityOrVillage: "Abhirampur / Rampur Sector",
    designation: "Accredited Social Health Activist (ASHA)",
    phone: "+91 98321 44510",
  },
  "ASHA-WB-402": {
    id: "ASHA-WB-402",
    name: "Radha Sen",
    role: "ASHA",
    pin: "1234",
    state: "West Bengal",
    district: "Bankura",
    block: "Sonamukhi Block",
    village: "Sonapur Village",
    facilityOrVillage: "Sonamukhi East Sector",
    designation: "Accredited Social Health Activist (ASHA)",
    phone: "+91 98321 44520",
  },
  "ASHA-WB-403": {
    id: "ASHA-WB-403",
    name: "Manju Das",
    role: "ASHA",
    pin: "1234",
    state: "West Bengal",
    district: "Bankura",
    block: "Kotulpur Block",
    village: "Shyampur Village",
    facilityOrVillage: "Shyampur Sector",
    designation: "Accredited Social Health Activist (ASHA)",
    phone: "+91 98321 44530",
  },
  "BHO-WB-204": {
    id: "BHO-WB-204",
    name: "Dr. Anirban Roy",
    role: "BLOCK",
    pin: "4321",
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Belur Village",
    facilityOrVillage: "Belur Block Primary Health Centre",
    designation: "Block Medical Officer of Health (BMOH / MOIC)",
    phone: "+91 94340 12345",
  },
  "BHO-WB-205": {
    id: "BHO-WB-205",
    name: "Dr. P. Mukherjee",
    role: "BLOCK",
    pin: "4321",
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Joypur Village",
    facilityOrVillage: "Joypur Block Community Health Centre",
    designation: "Block Medical Officer of Health (BMOH / MOIC)",
    phone: "+91 94340 12346",
  },
  "CMOH-DIST-101": {
    id: "CMOH-DIST-101",
    name: "Dr. A. Sen",
    role: "DISTRICT",
    pin: "5678",
    state: "West Bengal",
    district: "Bankura",
    block: "Bankura Sadar",
    village: "Bankura Town",
    facilityOrVillage: "Bankura District General Hospital",
    designation: "Chief Medical Officer of Health (CMOH) & Tertiary Specialist",
    phone: "+91 94341 98760",
  },
  "CMOH-DIST-102": {
    id: "CMOH-DIST-102",
    name: "Dr. S. Chatterjee",
    role: "DISTRICT",
    pin: "5678",
    state: "West Bengal",
    district: "Bankura",
    block: "Bankura Sadar",
    village: "Bankura Town",
    facilityOrVillage: "Bankura District Hospital",
    designation: "District Hospital Medical Superintendent & Chief Surgeon",
    phone: "+91 94341 98761",
  },
  "DHO-WB-101": {
    id: "DHO-WB-101",
    name: "Dr. Swapan Banerjee",
    role: "DISTRICT",
    pin: "9876",
    state: "West Bengal",
    district: "Bankura",
    block: "Bankura Sadar",
    village: "Bankura Town",
    facilityOrVillage: "Bankura District General Hospital",
    designation: "Chief Medical Officer of Health (CMOH) & Tertiary Specialist",
    phone: "+91 94341 98762",
  },
  "DHO-WB-102": {
    id: "DHO-WB-102",
    name: "Dr. Arundhati Ghosh",
    role: "DISTRICT",
    pin: "9876",
    state: "West Bengal",
    district: "Purulia",
    block: "Purulia Sadar",
    village: "Purulia Town",
    facilityOrVillage: "Purulia District Hospital",
    designation: "District Hospital Medical Superintendent",
    phone: "+91 94341 98763",
  },
};

const SESSION_STORAGE_KEY = "medexa_auth_session_v4";

/**
 * Role-to-backend-account mapping shim.
 *
 * ARCHITECTURAL DESIGN NOTE:
 * The frontend provides ~10 rich frontline worker personas (ASHA, Block MOIC, CMOH)
 * with local administrative context (village, block, facility, designation, phone) for realistic UI demonstration.
 * The FastAPI backend enforces RBAC using standard roles (UserRole: asha_worker, doctor, district_officer).
 *
 * In this architecture, all ASHA personas map to the backend's seeded ASHA account (asha.demo),
 * Block officers map to doctor.demo, and District officers map to officer.demo.
 * When a user logs in with their persona PIN, we authenticate locally and immediately
 * request a real JWT from POST /api/auth/login, saving it to localStorage ("auth_token").
 * This ensures every subsequent API request carries a valid backend bearer token with the correct RBAC role.
 */
export const ROLE_TO_BACKEND_ACCOUNT: Record<Role, { username: string; password: string }> = {
  ASHA: { username: "asha.demo", password: "demo1234" },
  BLOCK: { username: "doctor.demo", password: "demo1234" },
  DISTRICT: { username: "officer.demo", password: "demo1234" },
};

export async function syncBackendJwt(role: Role): Promise<string | null> {
  const creds = ROLE_TO_BACKEND_ACCOUNT[role];
  if (!creds || typeof window === "undefined") return null;
  try {
    const formData = new URLSearchParams();
    formData.append("username", creds.username);
    formData.append("password", creds.password);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("auth_token", data.access_token);
        return data.access_token;
      }
    } else {
      console.warn("Backend auth failed:", res.status, res.statusText);
    }
  } catch (err) {
    console.warn("Backend auth unreachable (offline or standalone mode):", err);
  }
  return null;
}

/**
 * Validates stored session against the authoritative registry database.
 * Prevents localStorage manipulation (e.g. manually editing role to 'DISTRICT').
 */
function loadValidatedSession(): AuthUser | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed || !parsed.id) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    // Lookup authoritative database record
    const found = HEALTH_REGISTRY_DATABASE[parsed.id];
    if (!found) {
      // Unknown user id -> invalidate
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    // Enforce role integrity: stored role must match authoritative registry
    if (parsed.role !== found.role) {
      console.warn("Security Alert: Role manipulation detected in storage. Session invalidated.");
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return {
      id: found.id,
      name: found.name,
      role: found.role,
      state: found.state,
      district: found.district,
      block: found.block,
      village: found.village,
      facilityOrVillage: found.facilityOrVillage,
      designation: found.designation,
      phone: found.phone,
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialUser = loadValidatedSession();
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("auth_token"));

  if (initialUser && !hasToken && typeof window !== "undefined") {
    syncBackendJwt(initialUser.role).then((token) => {
      if (token) {
        set({ user: initialUser, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    });
  }

  return {
    user: hasToken ? initialUser : null,
    isLoading: initialUser && !hasToken ? true : false,

    login: async (identifier: string, pin: string, expectedRole?: Role) => {
      const trimmedId = (identifier || "").trim().toLowerCase();
      const trimmedPin = (pin || "").trim();

      // Look up in registry by ID or by Name
      const foundEntry = Object.values(HEALTH_REGISTRY_DATABASE).find((record) => {
        return (
          record.id.toLowerCase() === trimmedId ||
          record.name.toLowerCase() === trimmedId ||
          record.name.toLowerCase().includes(trimmedId)
        );
      });

      if (!foundEntry) {
        return {
          success: false,
          error: `User "${identifier}" was not found in the Government Health Worker Registry.`,
        };
      }

      // Role check if an expected role was targeted
      if (expectedRole && foundEntry.role !== expectedRole) {
        return {
          success: false,
          error: `Credential belongs to ${foundEntry.role} tier. Expected ${expectedRole} credential.`,
        };
      }

      // PIN check
      if (foundEntry.pin !== trimmedPin) {
        return {
          success: false,
          error: `Invalid Security PIN for ${foundEntry.name}. Database authentication failed.`,
        };
      }

      const authUser: AuthUser = {
        id: foundEntry.id,
        name: foundEntry.name,
        role: foundEntry.role,
        state: foundEntry.state,
        district: foundEntry.district,
        block: foundEntry.block,
        village: foundEntry.village,
        facilityOrVillage: foundEntry.facilityOrVillage,
        designation: foundEntry.designation,
        phone: foundEntry.phone,
      };

      set({ isLoading: true });

      // Synchronize real backend JWT BEFORE activating user session
      const token = await syncBackendJwt(authUser.role);

      if (token) {
        try {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
        } catch {
          // ignore
        }
        set({ user: authUser, isLoading: false });
        return { success: true, user: authUser };
      } else {
        set({ isLoading: false });
        return {
          success: false,
          error: "Backend authentication service is unreachable.",
        };
      }
    },

    quickLogin: async (accountId: string) => {
      const found = HEALTH_REGISTRY_DATABASE[accountId];
      if (!found) return false;

      const authUser: AuthUser = {
        id: found.id,
        name: found.name,
        role: found.role,
        state: found.state,
        district: found.district,
        block: found.block,
        village: found.village,
        facilityOrVillage: found.facilityOrVillage,
        designation: found.designation,
        phone: found.phone,
      };

      set({ isLoading: true });

      // Synchronize real backend JWT BEFORE activating user session
      const token = await syncBackendJwt(authUser.role);

      if (token) {
        try {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
        } catch {
          // ignore
        }
        set({ user: authUser, isLoading: false });
        return true;
      } else {
        set({ isLoading: false });
        return false;
      }
    },

    logout: () => {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem("auth_token");
      } catch {
        // ignore
      }
      set({ user: null });
    },

    hasRole: (roles: Role | Role[]) => {
      const currentUser = get().user;
      if (!currentUser) return false;
      const allowed = Array.isArray(roles) ? roles : [roles];
      return allowed.includes(currentUser.role);
    },
  };
});

export const useAuth = () => useAuthStore();

