import { describe, it, expect } from "vitest";
import { v4 as uuidv4 } from "uuid";
import {
  TriageAssessmentSchema,
  PatientSchema,
  CareEpisodeSchema,
  ReferralSchema,
} from "../careEpisode";

describe("Single Patient Identity & UUID Integrity Tests", () => {
  it("should accept valid UUIDs for careEpisodeId in TriageAssessmentSchema", () => {
    const episodeId = uuidv4();
    const triageId = uuidv4();
    const validAssessment = {
      id: triageId,
      careEpisodeId: episodeId,
      symptoms: ["Chest Pain", "Breathlessness"],
      vitals: {
        systolicBP: 135,
        diastolicBP: 88,
        pulse: 92,
        tempC: 37.2,
        spo2: 96,
      },
      clinicalRiskLevel: "high",
      performedBy: "ASHA-WB-401",
      performedAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    const parsed = TriageAssessmentSchema.parse(validAssessment);
    expect(parsed.careEpisodeId).toBe(episodeId);
    expect(parsed.id).toBe(triageId);
  });

  it("should REJECT invalid prefixed careEpisodeId strings like EP-PAT-1082", () => {
    const invalidAssessment = {
      id: uuidv4(),
      careEpisodeId: "EP-PAT-1082",
      symptoms: ["Fever"],
      clinicalRiskLevel: "low",
      performedBy: "ASHA-WB-401",
      performedAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    expect(() => TriageAssessmentSchema.parse(invalidAssessment)).toThrow();
  });

  it("should enforce UUID format across Patient, CareEpisode, and Referral schemas", () => {
    const patientId = uuidv4();
    const episodeId = uuidv4();
    const referralId = uuidv4();

    const patient = PatientSchema.parse({
      id: patientId,
      fullName: "Ananya Roy",
      age: 28,
      sex: "female",
      villageOrWard: "Rampur Village",
      phone: "+91 98321 11111",
      chronicConditions: [],
      createdAt: new Date().toISOString(),
    });

    const episode = CareEpisodeSchema.parse({
      id: episodeId,
      patientId: patient.id,
      status: "open",
      openedAt: new Date().toISOString(),
      followUps: [],
      syncStatus: "pending",
    });

    const referral = ReferralSchema.parse({
      id: referralId,
      careEpisodeId: episode.id,
      patientId: patient.id,
      fromFacilityId: "MED-WB-FAC-000372",
      toFacilityId: "MED-WB-FAC-000349",
      currentState: "SENT",
      reason: "High-Risk ANC evaluation",
      priority: "HIGH",
      createdAt: new Date().toISOString(),
      createdBy: "ASHA-WB-401",
      history: [],
      rescueActions: [],
      syncStatus: "pending",
    });

    expect(referral.patientId).toBe(patient.id);
    expect(referral.careEpisodeId).toBe(episode.id);
  });
});
