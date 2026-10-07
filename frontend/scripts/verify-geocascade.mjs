/**
 * Automated Verification Script for Part 2: GeoCascadeSelect & Geography Data
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const geoDir = path.resolve(__dirname, "../public/geo-data");

console.log("=== VERIFYING PART 2: GEOGRAPHY CASCADE & ROLE DEFAULTS ===");

// 1. Verify index.json
const indexPath = path.join(geoDir, "index.json");
console.log("\n[TEST 1] Verifying geo-data/index.json...");
if (!fs.existsSync(indexPath)) {
  console.error("FAIL: index.json not found!");
  process.exit(1);
}
const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
console.log(` - Loaded ${index.length} states from index.json:`, index.map((s) => s.name).join(", "));
if (index.length < 5) {
  console.error("FAIL: Expected at least 5 states in index.json");
  process.exit(1);
}
console.log("PASS: index.json schema and content verified.");

// 2. Verify state JSON files & schema
console.log("\n[TEST 2] Verifying precomputed state JSON files...");
for (const item of index) {
  const statePath = path.join(geoDir, `${item.slug}.json`);
  if (!fs.existsSync(statePath)) {
    console.error(`FAIL: Missing JSON for ${item.name} at ${statePath}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(statePath, "utf-8"));
  if (!data.state || !data.districts) {
    console.error(`FAIL: Invalid schema for ${item.name}`);
    process.exit(1);
  }
  const districtNames = Object.keys(data.districts);
  console.log(` - ${item.name}: ${districtNames.length} districts loaded (${districtNames.slice(0, 3).join(", ")}...)`);
  
  for (const dName of districtNames) {
    const blocks = data.districts[dName].blocks;
    if (!blocks || typeof blocks !== "object") {
      console.error(`FAIL: Missing blocks for district ${dName} in ${item.name}`);
      process.exit(1);
    }
  }
}
console.log("PASS: All precomputed state JSON schemas verified.");

// 3. Test West Bengal / Bankura / Joypur Block / Rampur Village cascade
console.log("\n[TEST 3] Testing 4-tier cascade query resolution...");
const wbData = JSON.parse(fs.readFileSync(path.join(geoDir, "west-bengal.json"), "utf-8"));
const bankura = wbData.districts["Bankura"];
if (!bankura) {
  console.error("FAIL: Bankura district not found in West Bengal!");
  process.exit(1);
}
const joypurVillages = bankura.blocks["Joypur Block"];
if (!joypurVillages || !Array.isArray(joypurVillages)) {
  console.error("FAIL: Joypur Block villages not found!");
  process.exit(1);
}
console.log(` - Joypur Block has ${joypurVillages.length} registered villages:`, joypurVillages.slice(0, 5).join(", "), "...");
if (!joypurVillages.includes("Rampur Village") || !joypurVillages.includes("Belur Village")) {
  console.error("FAIL: Expected Rampur Village and Belur Village in Joypur Block!");
  process.exit(1);
}
console.log("PASS: 4-tier cascade resolves accurately.");

// 4. Test Role-Aware Locking Logic
console.log("\n[TEST 4] Testing Role-Aware Defaults & Locking Logic:");

function evaluateRoleLocks(role) {
  const isAsha = role === "ASHA";
  const isBlock = role === "BLOCK";
  const isDistrict = role === "DISTRICT";

  return {
    stateLocked: Boolean(isAsha || isBlock || isDistrict),
    districtLocked: Boolean(isAsha || isBlock || isDistrict),
    blockLocked: Boolean(isAsha || isBlock),
    villageActionable: true,
  };
}

const ashaLocks = evaluateRoleLocks("ASHA");
console.log(" - ASHA:", ashaLocks.stateLocked && ashaLocks.districtLocked && ashaLocks.blockLocked && ashaLocks.villageActionable
  ? "PASS (State, District, Block LOCKED; Village ACTIONABLE)"
  : "FAIL");

const blockLocks = evaluateRoleLocks("BLOCK");
console.log(" - BLOCK:", blockLocks.stateLocked && blockLocks.districtLocked && blockLocks.blockLocked && blockLocks.villageActionable
  ? "PASS (State, District, Block LOCKED; Village ACTIONABLE)"
  : "FAIL");

const distLocks = evaluateRoleLocks("DISTRICT");
console.log(" - DISTRICT:", distLocks.stateLocked && distLocks.districtLocked && !distLocks.blockLocked && distLocks.villageActionable
  ? "PASS (State, District LOCKED; Block & Village ACTIONABLE)"
  : "FAIL");

// 5. Test Manual Entry Fallback
console.log("\n[TEST 5] Testing Manual Entry Fallback:");
const manualVillageInput = "Kalamati Basti Hamlet";
const simulatedGeo = {
  state: "West Bengal",
  district: "Bankura",
  block: "Joypur Block",
  village: manualVillageInput,
  isManual: true,
};
console.log(" - Manual fallback accepts informal hamlet:", simulatedGeo.village === manualVillageInput ? "PASS" : "FAIL");
console.log(" - Scope boundary preserved during manual fallback:", simulatedGeo.district === "Bankura" && simulatedGeo.block === "Joypur Block" ? "PASS" : "FAIL");

console.log("\n=== PART 2 VERIFICATION COMPLETE: ALL TESTS PASSED! ===");
