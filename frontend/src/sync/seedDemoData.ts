import { db } from "@/sync/db";

export const DEMO_PATIENT_ID = "550e8400-e29b-41d4-a716-446655440001";
export const DEMO_EPISODE_ID = "550e8400-e29b-41d4-a716-446655440002";

export const DEMO_PATIENT_2_ID = "550e8400-e29b-41d4-a716-446655440003";
export const DEMO_EPISODE_2_ID = "550e8400-e29b-41d4-a716-446655440004";

export const DEMO_PATIENT_3_ID = "550e8400-e29b-41d4-a716-446655440005";
export const DEMO_EPISODE_3_ID = "550e8400-e29b-41d4-a716-446655440006";

export async function seedDemoData(): Promise<void> {
  const existingPatient = await db.patients.get(DEMO_PATIENT_ID);
  if (!existingPatient) {
    await db.patients.put({
      id: DEMO_PATIENT_ID,
      fullName: "Rahul Sharma",
      age: 42,
      sex: "male",
      villageOrWard: "Rampur Village",
      phone: "9876543210",
      chronicConditions: ["Type 2 Diabetes"],
      createdAt: new Date().toISOString(),
    });
  }

  const existingPatient2 = await db.patients.get(DEMO_PATIENT_2_ID);
  if (!existingPatient2) {
    await db.patients.put({
      id: DEMO_PATIENT_2_ID,
      fullName: "Sunita Mahato",
      age: 24,
      sex: "female",
      villageOrWard: "Rampur Village",
      phone: "9832144520",
      chronicConditions: ["High-Risk ANC (Third Trimester)"],
      createdAt: new Date().toISOString(),
    });
  }

  const existingPatient3 = await db.patients.get(DEMO_PATIENT_3_ID);
  if (!existingPatient3) {
    await db.patients.put({
      id: DEMO_PATIENT_3_ID,
      fullName: "Anita Sharma",
      age: 42,
      sex: "female",
      villageOrWard: "Sonapur",
      phone: "9876541234",
      chronicConditions: ["Hypertension", "Recurrent Fever"],
      createdAt: new Date().toISOString(),
    });
  }

  const existingEpisode = await db.careEpisodes.get(DEMO_EPISODE_ID);
  if (!existingEpisode) {
    await db.careEpisodes.put({
      id: DEMO_EPISODE_ID,
      patientId: DEMO_PATIENT_ID,
      status: "open",
      openedAt: new Date().toISOString(),
      followUps: [],
      syncStatus: "synced",
    });
  }

  const existingEpisode2 = await db.careEpisodes.get(DEMO_EPISODE_2_ID);
  if (!existingEpisode2) {
    await db.careEpisodes.put({
      id: DEMO_EPISODE_2_ID,
      patientId: DEMO_PATIENT_2_ID,
      status: "open",
      openedAt: new Date().toISOString(),
      followUps: [],
      syncStatus: "synced",
    });
  }

  const existingEpisode3 = await db.careEpisodes.get(DEMO_EPISODE_3_ID);
  if (!existingEpisode3) {
    await db.careEpisodes.put({
      id: DEMO_EPISODE_3_ID,
      patientId: DEMO_PATIENT_3_ID,
      status: "open",
      openedAt: new Date().toISOString(),
      followUps: [],
      syncStatus: "synced",
    });
  }

  // Seed an initial demo triage assessment for Rahul Sharma
  const demoTriageId = "550e8400-e29b-41d4-a716-446655440099";
  const existingTriage = await db.triageAssessments.get(demoTriageId);
  if (!existingTriage) {
    await db.triageAssessments.put({
      id: demoTriageId,
      careEpisodeId: DEMO_EPISODE_ID,
      performedBy: "ASHA-WB-401",
      performedAt: new Date().toISOString(),
      clinicalRiskLevel: "moderate",
      symptoms: ["Fatigue", "Elevated Blood Glucose", "Mild Dehydration"],
      vitals: {
        systolicBP: 138,
        diastolicBP: 88,
        pulse: 78,
        tempC: 37.1,
        spo2: 98,
      },
      notes: "Routine quarterly follow-up. Blood sugar remains slightly above target.",
      syncStatus: "synced",
    });
  }
}