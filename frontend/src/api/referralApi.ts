import { apiClient } from "./client";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { db, writeAndQueue } from "@/sync/db";
import type {
  Referral,
  Patient,
  CareEpisode,
  ReferralStateT,
} from "@/models/careEpisode";
import type { UnifiedReferral } from "@/sync/referralStore";

export interface BackendStateTransition {
  id: string;
  referral_id: string;
  from_state: string | null;
  to_state: string;
  changed_by: string;
  changed_at: string;
  device_local_timestamp?: string | null;
  note?: string | null;
}

export interface BackendReferralSla {
  referral_id: string;
  acknowledgement_due_at?: string | null;
  appointment_due_at?: string | null;
  consultation_due_at?: string | null;
  back_referral_due_at?: string | null;
  follow_up_due_at?: string | null;
}

export interface BackendReferralRescueAction {
  id: string;
  referral_id: string;
  triggered_at: string;
  reason: string;
  action_taken: string;
  resolved_at?: string | null;
}

export interface BackendBackReferralOut {
  id: string;
  referral_id: string;
  outcome: string;
  treatment?: string | null;
  medication: string[];
  follow_up_date?: string | null;
  warning_signs: string[];
  instructions?: string | null;
  recorded_by: string;
  recorded_at: string;
}

export interface BackendReferralOut {
  id: string;
  care_episode_id: string;
  patient_id: string;
  from_facility_id: string;
  to_facility_id: string;
  current_state: string;
  reason: string;
  priority?: string | null;
  patient_name?: string | null;
  patient_village?: string | null;
  from_facility_name?: string | null;
  to_facility_name?: string | null;
  from_facility_district?: string | null;
  to_facility_district?: string | null;
  to_facility_subdistrict?: string | null;
  created_at: string;
  created_by: string;
  sync_status: string;
  failure_reason?: string | null;
  transitions?: BackendStateTransition[];
  history?: BackendStateTransition[];
  sla?: BackendReferralSla | null;
  rescue_actions?: BackendReferralRescueAction[];
  back_referral?: BackendBackReferralOut | null;
}

export interface BackendReferralCreate {
  id: string;
  care_episode_id: string;
  patient_id: string;
  from_facility_id: string;
  to_facility_id: string;
  current_state?: string;
  reason: string;
  priority?: string | null;
  created_at: string;
  created_by: string;
  sync_status?: string;
}

export interface BackendTransitionRequest {
  id: string;
  to_state: string;
  device_local_timestamp?: string;
  note?: string;
}

export interface BackendBackReferralCreate {
  id: string;
  referral_id: string;
  outcome: string;
  treatment?: string;
  medication?: string[];
  follow_up_date?: string;
  warning_signs?: string[];
  instructions?: string;
  recorded_by: string;
  recorded_at: string;
}

export interface FacilityContinuityMetrics {
  facility_id: string;
  facility_name: string;
  total_referrals: number;
  completion_rate_percent: number;
  avg_referral_delay_hours: number;
  follow_up_compliance_percent: number;
}

export interface DashboardResponse {
  total_referrals: number;
  accepted: number;
  completed: number;
  follow_up_completed: number;
  overdue: number;
  no_show: number;
  total_eligible_for_completion: number;
  follow_ups_due: number;
  data_freshness_minutes_ago: number;
  facilities: FacilityContinuityMetrics[];
}


export interface FacilityOut {
  id: string;
  name: string;
  facility_type: string | null;
  district: string | null;
  village_or_ward: string | null;
  latitude: number | null;
  longitude: number | null;
  service_availability: string;
  diagnostic_availability: string;
  medicine_availability: string;
}

export interface FollowUpTaskOut {
  id: string;
  care_episode_id: string;
  referral_id?: string | null;
  due_at: string;
  reason: string;
  assigned_to: string;
  status: "pending" | "completed" | "overdue";
  completed_at?: string | null;
}

/**
 * State mapping: Backend ReferralState -> Frontend UnifiedReferral display status
 */
export function mapBackendStateToDisplayStatus(state: string): UnifiedReferral["status"] {
  switch (state) {
    case "DRAFT":
    case "SENT":
      return "Referred to Block";
    case "RECEIVED":
    case "ACCEPTED":
    case "APPOINTMENT_QUEUED":
      return "At Block Office";
    case "EMERGENCY_ESCALATED":
      return "Escalated to District";
    case "CONSULTED":
      return "In Consultation";
    case "REFERRED_BACK":
    case "FOLLOW_UP_DUE":
      return "Back-Referred";
    case "FOLLOW_UP_COMPLETED":
    case "CLOSED":
    case "REJECTED":
    case "CANCELLED":
    case "EXPIRED":
    case "PATIENT_NO_SHOW":
      return "Completed";
    default:
      return "At Block Office";
  }
}

/**
 * Reverse mapping: Frontend display status -> Backend ReferralState
 */
export function mapDisplayStatusToBackendState(status: UnifiedReferral["status"]): string {
  switch (status) {
    case "Referred to Block":
      return "SENT";
    case "At Block Office":
      return "RECEIVED";
    case "Escalated to District":
      return "EMERGENCY_ESCALATED";
    case "In Consultation":
      return "CONSULTED";
    case "Back-Referred":
      return "REFERRED_BACK";
    case "Completed":
      return "CLOSED";
    default:
      return "SENT";
  }
}

const KNOWN_FACILITIES: Record<string, string> = {
  "MED-WB-FAC-000372": "Maharajganj PHC (Rampur Sub-Centre)",
  "MED-WB-FAC-000349": "M. R. Bangur District Hospital",
  "MED-WB-FAC-000345": "Belur Block PHC (Diamond Harbour)",
  "FAC-WB-PHC-01": "Belur Block PHC",
  "FAC-WB-CHC-02": "Joypur Block CHC",
  "FAC-WB-RH-03": "Sonamukhi Rural Hospital",
  "FAC-WB-DH-04": "Bankura District General Hospital",
};

/**
 * Converts a backend ReferralOut object into a frontend UnifiedReferral object.
 */
export function mapBackendToUnified(r: BackendReferralOut): UnifiedReferral {
  const status = mapBackendStateToDisplayStatus(r.current_state);
  const isEmergency = r.current_state === "EMERGENCY_ESCALATED" || r.reason.toLowerCase().includes("emergency");
  const isHigh = r.reason.toLowerCase().includes("severe") || r.reason.toLowerCase().includes("high");

  const triageLevel: UnifiedReferral["triageLevel"] = isEmergency ? "RED" : isHigh ? "YELLOW" : "GREEN";

  const targetLevel: UnifiedReferral["targetLevel"] =
    r.current_state === "EMERGENCY_ESCALATED" || r.current_state === "CONSULTED" || status === "In Consultation"
      ? "DISTRICT_OFFICE"
      : "BLOCK_OFFICE";

  const fromFacilityName = KNOWN_FACILITIES[r.from_facility_id] || r.from_facility_id || "Sub-Centre";
  const toFacilityName = KNOWN_FACILITIES[r.to_facility_id] || r.to_facility_id || "Block PHC";

  const formattedDate = r.created_at
    ? new Date(r.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recent";

  const lastTransition = (r.transitions || r.history || [])[0];
  const lastAction = lastTransition?.note || `Status transitioned to ${r.current_state}`;

  return {
    id: r.id,
    patientName: r.patient_name || `Patient (${r.patient_id.slice(-6)})`,
    patientId: r.patient_id,
    ageGender: "Adult",
    state: "West Bengal",
    district: r.to_facility_district || r.from_facility_district || "Unknown District",
    block: r.to_facility_subdistrict || "Unknown Block",
    village: r.patient_village || "Local Ward",
    sourceLevel: "ASHA",
    targetLevel,
    fromFacilityOrWorker: r.from_facility_name || fromFacilityName,
    toFacility: r.to_facility_name || toFacilityName,
    category: r.reason || "General Referral",
    priority: r.priority === "CRITICAL" ? "Emergency" : r.priority === "HIGH" ? "High" : "Normal",
    triageLevel,
    status,
    assignedDoctor: "Medical Officer",
    referralDate: formattedDate,
    lastAction,
    clinicalNotes: r.reason,
    escortTransport: isEmergency ? "Emergency Ambulance" : "Accompanied by ASHA",
  };
}

export async function queueReferralTransitionOfflineFirst(referralId: string, toState: ReferralStateT, note?: string): Promise<void> {
  const existing = await db.referrals.get(referralId);
  if (!existing) throw new Error(`Referral ${referralId} is not available in local cache`);
  const transitionId = uuidv4();
  const transition = {
    id: transitionId, referralId, fromState: existing.currentState, toState,
    changedBy: existing.createdBy, changedAt: new Date().toISOString(), deviceLocalTimestamp: new Date().toISOString(), note,
  };
  await writeAndQueue(db.referralTransitions, "referralTransition", transition);
  await db.referrals.update(referralId, { currentState: toState, syncStatus: "pending" });
}

export async function queueBackReferralOfflineFirst(data: { referralId: string; careEpisodeId: string; instructions: string; recordedBy: string; }): Promise<void> {
  const now = new Date().toISOString();
  const backReferral = {
    id: uuidv4(), referralId: data.referralId, outcome: "Patient stabilized and discharged",
    treatment: "Specialist consultation and stabilization", medication: [], followUpDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    warningSigns: [], instructions: data.instructions, recordedBy: data.recordedBy, recordedAt: now,
  };
  await writeAndQueue(db.backReferrals, "backReferral", backReferral);
  await queueReferralTransitionOfflineFirst(data.referralId, "REFERRED_BACK", `Back-referred to ASHA for home monitoring`);
}

export async function ensurePatientAndEpisode(data: {
  patientId: string; patientName: string; age: number; sex: "male" | "female" | "other";
  villageOrWard: string; phone?: string; careEpisodeId: string; createdBy: string;
}): Promise<void> {
  await apiClient.post("/patients", {
    id: data.patientId, full_name: data.patientName, age: data.age, sex: data.sex,
    village_or_ward: data.villageOrWard, phone: data.phone ?? null,
    chronic_conditions: [], created_at: new Date().toISOString(),
  });
  await apiClient.post("/care-episodes", {
    id: data.careEpisodeId, patient_id: data.patientId, status: "open",
    opened_at: new Date().toISOString(),
  });
}

export async function queueReferralOfflineFirst(data: {
  patientId: string; patientName: string; age: number; sex: "male" | "female" | "other";
  villageOrWard: string; phone?: string; careEpisodeId: string; fromFacilityId: string;
  toFacilityId: string; reason: string; createdBy: string; priority?: NonNullable<Referral["priority"]>;
}): Promise<UnifiedReferral> {
  const now = new Date().toISOString();
  const patient: Patient = {
    id: data.patientId, fullName: data.patientName, age: data.age, sex: data.sex,
    villageOrWard: data.villageOrWard, phone: data.phone, chronicConditions: [], createdAt: now,
  };
  const episode: CareEpisode = {
    id: data.careEpisodeId, patientId: data.patientId, status: "open", openedAt: now,
    followUps: [], syncStatus: "pending",
  };
  const referral: Referral = {
    id: uuidv4(), careEpisodeId: data.careEpisodeId, patientId: data.patientId,
    fromFacilityId: data.fromFacilityId, toFacilityId: data.toFacilityId, currentState: "SENT",
    reason: data.reason, priority: data.priority, createdAt: now, createdBy: data.createdBy,
    history: [], rescueActions: [], syncStatus: "pending",
  };
  await writeAndQueue(db.patients, "patient", patient);
  await writeAndQueue(db.careEpisodes, "careEpisode", episode);
  await writeAndQueue(db.referrals, "referral", referral);
  return mapBackendToUnified({
    id: referral.id, care_episode_id: referral.careEpisodeId, patient_id: referral.patientId,
    from_facility_id: referral.fromFacilityId, to_facility_id: referral.toFacilityId,
    current_state: referral.currentState, reason: referral.reason, priority: referral.priority,
    created_at: referral.createdAt, created_by: referral.createdBy, sync_status: "pending",
    transitions: [], rescue_actions: [],
  });
}

export const referralApi = {
  /**
   * List referrals with optional server-side filters.
   */
  listReferrals: async (params?: {
    current_state?: string;
    to_facility_id?: string;
    from_facility_id?: string;
    created_by?: string;
    patient_id?: string;
    limit?: number;
  }): Promise<UnifiedReferral[]> => {
    const query = new URLSearchParams();
    if (params?.current_state) query.append("current_state", params.current_state);
    if (params?.to_facility_id) query.append("to_facility_id", params.to_facility_id);
    if (params?.from_facility_id) query.append("from_facility_id", params.from_facility_id);
    if (params?.created_by) query.append("created_by", params.created_by);
    if (params?.patient_id) query.append("patient_id", params.patient_id);
    if (params?.limit) query.append("limit", params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    const rawList = await apiClient.get<BackendReferralOut[]>(`/referrals${qs}`);
    if (!Array.isArray(rawList)) return [];
    return rawList.map(mapBackendToUnified);
  },

  /**
   * Get single referral with full audit trail and rescue resolution.
   */
  getReferral: async (id: string): Promise<UnifiedReferral> => {
    const raw = await apiClient.get<BackendReferralOut>(`/referrals/${id}`);
    return mapBackendToUnified(raw);
  },

  /**
   * Create a referral on the real backend.
   */
  createReferral: async (data: {
    id?: string;
    careEpisodeId?: string;
    patientId?: string;
    fromFacilityId?: string;
    toFacilityId?: string;
    currentState?: ReferralStateT;
    reason: string;
    priority?: NonNullable<Referral["priority"]>;
    createdBy?: string;
  }): Promise<UnifiedReferral> => {
    const nowIso = new Date().toISOString();
    const id = data.id && uuidValidate(data.id) ? data.id : uuidv4();
    const careEpisodeId = data.careEpisodeId && uuidValidate(data.careEpisodeId) ? data.careEpisodeId : uuidv4();
    const patientId = data.patientId && uuidValidate(data.patientId) ? data.patientId : uuidv4();
    const fromFacilityId = data.fromFacilityId || "MED-WB-FAC-000372";
    const toFacilityId = data.toFacilityId || "MED-WB-FAC-000345";
    const createdBy = data.createdBy || "demo-asha-001";
    const currentState = data.currentState || "SENT";

    const payload: BackendReferralCreate = {
      id,
      care_episode_id: careEpisodeId,
      patient_id: patientId,
      from_facility_id: fromFacilityId,
      to_facility_id: toFacilityId,
      current_state: currentState,
      reason: data.reason,
      priority: data.priority,
      created_at: nowIso,
      created_by: createdBy,
      sync_status: "synced",
    };

    const raw = await apiClient.post<BackendReferralOut>("/referrals", payload);
    return mapBackendToUnified(raw);
  },

  /**
   * Authoritatively transition a referral state via PATCH /referrals/{id}/transition
   */
  transitionReferral: async (
    referralId: string,
    toState: string,
    note?: string
  ): Promise<UnifiedReferral> => {
    const payload: BackendTransitionRequest = {
      id: `TRANS-${Math.floor(1000 + Math.random() * 9000)}`,
      to_state: toState,
      device_local_timestamp: new Date().toISOString(),
      note,
    };

    const raw = await apiClient.patch<BackendReferralOut>(
      `/referrals/${referralId}/transition`,
      payload
    );
    return mapBackendToUnified(raw);
  },

  /**
   * Create a back-referral post-treatment.
   */
  createBackReferral: async (data: {
    referralId: string;
    outcome?: string;
    treatment?: string;
    medication?: string[];
    followUpDate?: string;
    warningSigns?: string[];
    instructions?: string;
    recordedBy?: string;
  }): Promise<BackendBackReferralOut> => {
    const payload: BackendBackReferralCreate = {
      id: `BACK-${Math.floor(1000 + Math.random() * 9000)}`,
      referral_id: data.referralId,
      outcome: data.outcome || "Patient stabilized and discharged",
      treatment: data.treatment || "Specialist consultation and stabilization",
      medication: data.medication || ["Amoxicillin 500mg", "Paracetamol 650mg"],
      follow_up_date: data.followUpDate || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      warning_signs: data.warningSigns || ["Persistent fever", "Shortness of breath"],
      instructions: data.instructions || "Monitor vitals daily and verify medication compliance",
      recorded_by: data.recordedBy || "demo-doctor-001",
      recorded_at: new Date().toISOString(),
    };

    return await apiClient.post<BackendBackReferralOut>("/referrals/back-referral", payload);
  },

  /** List canonical facilities from the backend reference database. */
  listFacilities: async (district?: string): Promise<FacilityOut[]> => {
    const qs = district ? `?district=${encodeURIComponent(district)}` : "";
    return await apiClient.get<FacilityOut[]>(`/facilities${qs}`);
  },

  /**
   * Get facility dashboard aggregation (district officer & admin access).
   */
  getDashboard: async (params?: { district?: string; block?: string }): Promise<DashboardResponse> => {
    const query = new URLSearchParams();
    if (params?.district) query.append("district", params.district);
    if (params?.block && params.block !== "All Blocks") query.append("block", params.block);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return await apiClient.get<DashboardResponse>(`/dashboard/facility${qs}`);
  },

  /**
   * Get follow-up tasks from the continuity service.
   */
  getFollowUps: async (assignedTo?: string, statusFilter?: string): Promise<FollowUpTaskOut[]> => {
    const query = new URLSearchParams();
    if (assignedTo) query.append("assigned_to", assignedTo);
    if (statusFilter) query.append("status_filter", statusFilter);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return await apiClient.get<FollowUpTaskOut[]>(`/continuity/follow-ups${qs}`);
  },

  completeFollowUp: async (taskId: string): Promise<FollowUpTaskOut> => {
    return await apiClient.patch<FollowUpTaskOut>(`/continuity/follow-ups/${taskId}?status=completed`);
  },
};
