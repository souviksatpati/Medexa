import { describe, it, expect, beforeEach } from "vitest";
import { HEALTH_REGISTRY_DATABASE, useAuthStore } from "../auth";

describe("Care Tier Dedicated Login & RBAC Validation", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("should have seeded demo accounts for each of the three care tiers", () => {
    expect(HEALTH_REGISTRY_DATABASE["ASHA-WB-401"]).toBeDefined();
    expect(HEALTH_REGISTRY_DATABASE["ASHA-WB-401"].role).toBe("ASHA");
    expect(HEALTH_REGISTRY_DATABASE["ASHA-WB-401"].pin).toBe("1234");

    expect(HEALTH_REGISTRY_DATABASE["BHO-WB-204"]).toBeDefined();
    expect(HEALTH_REGISTRY_DATABASE["BHO-WB-204"].role).toBe("BLOCK");
    expect(HEALTH_REGISTRY_DATABASE["BHO-WB-204"].pin).toBe("4321");

    expect(HEALTH_REGISTRY_DATABASE["CMOH-DIST-101"]).toBeDefined();
    expect(HEALTH_REGISTRY_DATABASE["CMOH-DIST-101"].role).toBe("DISTRICT");
    expect(HEALTH_REGISTRY_DATABASE["CMOH-DIST-101"].pin).toBe("5678");
  });

  it("should successfully authenticate an ASHA worker on the ASHA portal", async () => {
    const result = await useAuthStore.getState().login("ASHA-WB-401", "1234", "ASHA");
    expect(result.success).toBe(true);
    expect(result.user?.role).toBe("ASHA");
    expect(result.user?.name).toBe("Kavita Roy");
    expect(useAuthStore.getState().user?.id).toBe("ASHA-WB-401");
  });

  it("should successfully authenticate a Block officer on the Block portal", async () => {
    const result = await useAuthStore.getState().login("BHO-WB-204", "4321", "BLOCK");
    expect(result.success).toBe(true);
    expect(result.user?.role).toBe("BLOCK");
    expect(result.user?.name).toBe("Dr. Anirban Roy");
    expect(useAuthStore.getState().user?.id).toBe("BHO-WB-204");
  });

  it("should successfully authenticate a District officer on the District portal", async () => {
    const result = await useAuthStore.getState().login("CMOH-DIST-101", "5678", "DISTRICT");
    expect(result.success).toBe(true);
    expect(result.user?.role).toBe("DISTRICT");
    expect(result.user?.name).toBe("Dr. A. Sen");
    expect(useAuthStore.getState().user?.id).toBe("CMOH-DIST-101");
  });

  it("should REJECT cross-role login: Block credentials on ASHA portal", async () => {
    const result = await useAuthStore.getState().login("BHO-WB-204", "4321", "ASHA");
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should REJECT cross-role login: ASHA credentials on Block portal", async () => {
    const result = await useAuthStore.getState().login("ASHA-WB-401", "1234", "BLOCK");
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should REJECT cross-role login: District credentials on Block portal", async () => {
    const result = await useAuthStore.getState().login("CMOH-DIST-101", "5678", "BLOCK");
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should REJECT invalid PIN for an existing account", async () => {
    const result = await useAuthStore.getState().login("ASHA-WB-401", "9999", "ASHA");
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should REJECT non-existent Worker ID", async () => {
    const result = await useAuthStore.getState().login("UNKNOWN-ID-999", "1234", "ASHA");
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
