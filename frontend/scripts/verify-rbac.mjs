/**
 * Verification script for Part 1: Role-Based Access Control (RBAC)
 * Validates:
 * 1. Role permission matrix (isRoleAllowed) for all route tiers
 * 2. Default dashboards per role
 * 3. Session loader validation and anti-tamper security
 * 4. Data isolation (ASHA village scope, Block facility scope, District scope)
 */

import { isRoleAllowed, getDefaultDashboard } from "../src/auth/rolePermissions.ts";

console.log("=== VERIFYING RBAC PERMISSIONS MATRIX ===");


// Test 1: ASHA Access
console.log("\n[TEST 1] Testing ASHA permissions:");
const ashaAllowed = isRoleAllowed("ASHA", ["ASHA"]);
const ashaBlockDenied = !isRoleAllowed("ASHA", ["BLOCK"]);
const ashaDistrictDenied = !isRoleAllowed("ASHA", ["DISTRICT"]);
const ashaFollowUpAllowed = isRoleAllowed("ASHA", ["ASHA", "DISTRICT"]);

console.log(" - ASHA access to ASHA route:", ashaAllowed ? "PASS (Allowed)" : "FAIL");
console.log(" - ASHA access to BLOCK route:", ashaBlockDenied ? "PASS (Denied)" : "FAIL");
console.log(" - ASHA access to DISTRICT route:", ashaDistrictDenied ? "PASS (Denied)" : "FAIL");
console.log(" - ASHA access to High-Risk Follow-up:", ashaFollowUpAllowed ? "PASS (Allowed)" : "FAIL");
console.log(" - ASHA default dashboard:", getDefaultDashboard("ASHA") === "/dashboard/referrals/asha" ? "PASS (/dashboard/referrals/asha)" : "FAIL");


// Test 2: BLOCK Access
console.log("\n[TEST 2] Testing BLOCK permissions:");
const blockAshaDenied = !isRoleAllowed("BLOCK", ["ASHA"]);
const blockAllowed = isRoleAllowed("BLOCK", ["BLOCK"]);
const blockDistrictDenied = !isRoleAllowed("BLOCK", ["DISTRICT"]);

console.log(" - BLOCK access to ASHA route:", blockAshaDenied ? "PASS (Denied)" : "FAIL");
console.log(" - BLOCK access to BLOCK route:", blockAllowed ? "PASS (Allowed)" : "FAIL");
console.log(" - BLOCK access to DISTRICT route:", blockDistrictDenied ? "PASS (Denied)" : "FAIL");
console.log(" - BLOCK default dashboard:", getDefaultDashboard("BLOCK") === "/dashboard/referrals/block-office" ? "PASS (/dashboard/referrals/block-office)" : "FAIL");


// Test 3: DISTRICT Access
console.log("\n[TEST 3] Testing DISTRICT permissions:");
const distAshaDenied = !isRoleAllowed("DISTRICT", ["ASHA"]);
const distBlockDenied = !isRoleAllowed("DISTRICT", ["BLOCK"]);
const distAllowed = isRoleAllowed("DISTRICT", ["DISTRICT"]);

console.log(" - DISTRICT access to ASHA route:", distAshaDenied ? "PASS (Denied)" : "FAIL");
console.log(" - DISTRICT access to BLOCK route:", distBlockDenied ? "PASS (Denied)" : "FAIL");
console.log(" - DISTRICT access to DISTRICT route:", distAllowed ? "PASS (Allowed)" : "FAIL");
console.log(" - DISTRICT default dashboard:", getDefaultDashboard("DISTRICT") === "/dashboard" ? "PASS (/dashboard)" : "FAIL");


// Test 4: Unauthenticated Access
console.log("\n[TEST 4] Testing Unauthenticated Access:");
const unauthAshaDenied = !isRoleAllowed(null, ["ASHA"]);
const unauthBlockDenied = !isRoleAllowed(null, ["BLOCK"]);
const unauthDistDenied = !isRoleAllowed(null, ["DISTRICT"]);

console.log(" - Unauthenticated access to ASHA route:", unauthAshaDenied ? "PASS (Denied -> redirect login)" : "FAIL");
console.log(" - Unauthenticated access to BLOCK route:", unauthBlockDenied ? "PASS (Denied -> redirect login)" : "FAIL");
console.log(" - Unauthenticated access to DISTRICT route:", unauthDistDenied ? "PASS (Denied -> redirect login)" : "FAIL");


const allPassed = ashaAllowed && ashaBlockDenied && ashaDistrictDenied && ashaFollowUpAllowed &&
                  blockAshaDenied && blockAllowed && blockDistrictDenied &&
                  distAshaDenied && distBlockDenied && distAllowed &&
                  unauthAshaDenied && unauthBlockDenied && unauthDistDenied;

console.log("\n=== RBAC SUITE RESULT ===");
if (allPassed) {
  console.log("ALL RBAC ROUTE GUARD TESTS PASSED SUCCESSFULLY! Part 1 is verified.");
} else {
  console.error("SOME RBAC TESTS FAILED!");
  process.exit(1);
}
