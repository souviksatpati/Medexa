import type { UnifiedReferral } from "@/sync/referralStore";

export interface PatientTimelineEvent {
  id: string;
  date: string;
  stage: string;
  title: string;
  description: string;
  facility: string;
  doctor?: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    spo2?: string;
    temp?: string;
    weight?: string;
    bloodSugar?: string;
    hb?: string;
  };
  prescriptions?: string[];
  documents?: string[];
}

export interface PatientCase {
  id: string;
  referralId?: string;
  name: string;
  age: number;
  gender: "Female" | "Male" | "Other";
  village: string;
  block: string;
  district: string;
  state: string;
  phone: string;
  abhaId: string;
  condition: string;
  conditionCategory:
    | "Maternal Health"
    | "Hypertension"
    | "Diabetes"
    | "Pediatric"
    | "Infectious / Fever"
    | "Respiratory"
    | "Orthopedic / Trauma";
  riskLevel: "RED" | "YELLOW" | "GREEN";
  careStage:
    | "Identified"
    | "Triage / Referred"
    | "In Transit"
    | "Consultation"
    | "Treatment"
    | "Back-Referred / Follow-up"
    | "Completed";
  vitals: {
    bp: string;
    pulse: string;
    spo2: string;
    temp: string;
    weight: string;
    hb?: string;
    bloodSugar?: string;
  };
  lastUpdated: string;
  assignedAsha: string;
  referralFacility: string;
  doctorName?: string;
  notes: string;
  timeline: PatientTimelineEvent[];
}

export const MOCK_PATIENT_CASES: PatientCase[] = [
  {
    id: "PAT-1082",
    referralId: "REF-101",
    name: "Sunita Mahato",
    age: 24,
    gender: "Female",
    village: "Rampur Village",
    block: "Joypur Block",
    district: "Bankura",
    state: "West Bengal",
    phone: "+91 98321 44510",
    abhaId: "91-2345-6789-0101",
    condition: "High-Risk ANC (Third Trimester) - Severe Preeclampsia",
    conditionCategory: "Maternal Health",
    riskLevel: "RED",
    careStage: "Triage / Referred",
    vitals: {
      bp: "162/102 mmHg",
      pulse: "94 bpm",
      spo2: "97%",
      temp: "98.8°F",
      weight: "58 kg",
      hb: "9.2 g/dL",
    },
    lastUpdated: "12 mins ago",
    assignedAsha: "Kavita Roy (Rampur Sub-Centre)",
    referralFacility: "Belur Block PHC",
    doctorName: "Dr. Anirban Roy (BMOH)",
    notes: "34 weeks gestation. Persistent frontal headache, visual blurring, pedal edema ++. Urgent magnesium sulfate protocol & obstetric triage required.",
    timeline: [
      {
        id: "EV-101-1",
        date: "Today, 08:30 AM",
        stage: "ASHA Identification & Escalation",
        title: "Preeclampsia Danger Signs Detected",
        description: "Routine home visit flagged BP 162/100, ankle swelling, and headache. Tele-alert triggered to Joypur Block Medical Officer.",
        facility: "Rampur Village Sub-Centre",
        doctor: "Kavita Roy (ASHA)",
        vitals: { bp: "162/102 mmHg", pulse: "94 bpm", temp: "98.8°F" },
      },
      {
        id: "EV-101-2",
        date: "2 weeks ago",
        stage: "Antenatal Checkup (ANC-3)",
        title: "ANC Checkup 3 - Mild Hypertension Noted",
        description: "BP 138/88 mmHg, mild swelling. Advised reduced salt intake, iron-folic acid compliance, and weekly tracking.",
        facility: "Joypur Block PHC",
        doctor: "Dr. Sudip Mukherjee",
        prescriptions: ["Tab IFA daily", "Tab Calcium 500mg bd"],
      },
      {
        id: "EV-101-3",
        date: "10 weeks ago",
        stage: "Antenatal Checkup (ANC-2)",
        title: "ANC Checkup 2 & Tetanus Toxoid",
        description: "TT-2 administered, ultrasound showed single live intrauterine fetus. Fundal height 22 weeks.",
        facility: "Belur BPHC",
        doctor: "Dr. Swati Sen",
      },
    ],
  },
  {
    id: "PAT-1084",
    referralId: "REF-102",
    name: "Manju Bauri",
    age: 31,
    gender: "Female",
    village: "Belur Village",
    block: "Joypur Block",
    district: "Bankura",
    state: "West Bengal",
    phone: "+91 97345 88201",
    abhaId: "91-4432-1098-0202",
    condition: "Child Nutrition Care (SAM) - Severe Wasting in 14m child",
    conditionCategory: "Pediatric",
    riskLevel: "YELLOW",
    careStage: "Consultation",
    vitals: {
      bp: "118/76 mmHg",
      pulse: "82 bpm",
      spo2: "99%",
      temp: "98.4°F",
      weight: "44 kg",
      hb: "10.1 g/dL",
    },
    lastUpdated: "45 mins ago",
    assignedAsha: "Belur Sub-Centre ASHA",
    referralFacility: "Belur Block PHC",
    doctorName: "Dr. Anirban Roy (BMOH)",
    notes: "Mother of 14-month-old showing severe acute malnutrition. Nutritional rehabilitation centre (NRC) referral initiated.",
    timeline: [
      {
        id: "EV-102-1",
        date: "Today, 09:15 AM",
        stage: "Block Nutrition Evaluation",
        title: "Enrolled in NRC Outpatient Monitoring",
        description: "Child MUAC 11.2 cm (Red zone), weight-for-height <-3SD. Started on starter therapeutic food and zinc supplementation.",
        facility: "Belur Block PHC",
        doctor: "Dr. Anirban Roy (BMOH)",
        prescriptions: ["Therapeutic Energy Density Spread (F-75 equivalent)", "Syrup Zinc 10mg"],
      },
      {
        id: "EV-102-2",
        date: "Yesterday",
        stage: "ASHA Growth Monitoring",
        title: "Village Anganwadi Triage",
        description: "Weight faltering flagged during monthly Poshan Pakhwada session. ASHA assisted family to reach PHC.",
        facility: "Belur Anganwadi Centre",
        doctor: "ASHA Worker",
      },
    ],
  },
  {
    id: "PAT-1088",
    referralId: "REF-103",
    name: "Rajesh Murmu",
    age: 49,
    gender: "Male",
    village: "Sonapur Village",
    block: "Joypur Block",
    district: "Bankura",
    state: "West Bengal",
    phone: "+91 94332 77123",
    abhaId: "91-8890-5431-0303",
    condition: "Acute Coronary Syndrome / Suspected STEMI",
    conditionCategory: "Hypertension",
    riskLevel: "RED",
    careStage: "In Transit",
    vitals: {
      bp: "86/54 mmHg",
      pulse: "116 bpm",
      spo2: "91%",
      temp: "97.9°F",
      weight: "62 kg",
      bloodSugar: "210 mg/dL",
    },
    lastUpdated: "8 mins ago",
    assignedAsha: "Sonapur ASHA",
    referralFacility: "Bankura Sammilani District Hospital",
    doctorName: "Dr. B. Sengupta (Cardiologist)",
    notes: "Crushing retrosternal chest pain > 2 hrs, cold clammy extremities, BP dropping. Ambulance 108 transit underway.",
    timeline: [
      {
        id: "EV-103-1",
        date: "Today, 10:10 AM",
        stage: "Ambulance 108 Dispatch",
        title: "High-Priority Transport En Route",
        description: "Joypur Block doctor stabilized patient with loading dose (Aspirin 300mg + Clopidogrel 300mg + Atorvastatin 80mg) and initiated 108 cardiac transport.",
        facility: "Transit to Bankura District Hospital",
        doctor: "Dr. K. Das",
        prescriptions: ["Tab Aspirin 300mg stat", "Tab Clopidogrel 300mg stat", "Tab Atorvastatin 80mg stat"],
      },
      {
        id: "EV-103-2",
        date: "Today, 09:30 AM",
        stage: "Sub-Centre ECG Upload",
        title: "Tele-ECG Lead II & V1-V4 ST-Elevation",
        description: "ASHA synchronized handheld ECG telemetry with Block portal. Urgent cardiologist consult activated.",
        facility: "Sonapur Sub-Centre",
      },
    ],
  },
  {
    id: "PAT-1091",
    referralId: "REF-104",
    name: "Ananya Ghosh",
    age: 19,
    gender: "Female",
    village: "Joypur Village",
    block: "Joypur Block",
    district: "Bankura",
    state: "West Bengal",
    phone: "+91 98319 66240",
    abhaId: "91-7654-3210-0404",
    condition: "Severe Anemia with Orthostatic Dizziness",
    conditionCategory: "Maternal Health",
    riskLevel: "RED",
    careStage: "Treatment",
    vitals: {
      bp: "96/60 mmHg",
      pulse: "108 bpm",
      spo2: "96%",
      temp: "98.6°F",
      weight: "39 kg",
      hb: "5.8 g/dL",
    },
    lastUpdated: "25 mins ago",
    assignedAsha: "Joypur Sector ASHA",
    referralFacility: "Bankura District Hospital",
    doctorName: "Dr. P. Chakraborty (Hematology)",
    notes: "Hb critically low at 5.8 g/dL. Intravenous Iron Sucrose infusion scheduled at District Day Care.",
    timeline: [
      {
        id: "EV-104-1",
        date: "Today, 09:40 AM",
        stage: "District Day Care Admission",
        title: "IV Iron Sucrose Infusion Initiated",
        description: "Cross-matching confirmed. Test dose completed without reaction. 200mg Iron sucrose started under cardiac monitoring.",
        facility: "Bankura District Hospital",
        doctor: "Dr. P. Chakraborty",
      },
      {
        id: "EV-104-2",
        date: "3 days ago",
        stage: "Community Screening",
        title: "Digital Hemoglobinometer Flagged < 6 g/dL",
        description: "Screened at Joypur Adolescent Clinic. Severe pallor (tongue, palms, conjunctiva) recorded by ASHA.",
        facility: "Joypur Health & Wellness Centre",
      },
    ],
  },
  {
    id: "PAT-1076",
    referralId: "REF-105",
    name: "Haradhan Soren",
    age: 58,
    gender: "Male",
    village: "Madhupur Village",
    block: "Joypur Block",
    district: "Bankura",
    state: "West Bengal",
    phone: "+91 94344 12890",
    abhaId: "91-1239-8765-0505",
    condition: "Post-Appendectomy Recovery & Diabetes Control",
    conditionCategory: "Diabetes",
    riskLevel: "GREEN",
    careStage: "Back-Referred / Follow-up",
    vitals: {
      bp: "124/82 mmHg",
      pulse: "74 bpm",
      spo2: "98%",
      temp: "98.2°F",
      weight: "66 kg",
      bloodSugar: "138 mg/dL",
    },
    lastUpdated: "2 hours ago",
    assignedAsha: "Madhupur ASHA",
    referralFacility: "Belur Block PHC",
    doctorName: "Dr. A. Roy",
    notes: "Successfully discharged post-op Day 5. Wound healing well, sutures removed. ASHA home visits for fasting blood sugar & wound inspection.",
    timeline: [
      {
        id: "EV-105-1",
        date: "Yesterday",
        stage: "Discharge & Counter-Referral",
        title: "Counter-Referral Care Plan to Village ASHA",
        description: "Discharged from District Surgical Ward with glycemic regimen. Counter-referral memo issued with dressing guidelines.",
        facility: "Bankura District Hospital",
        doctor: "Dr. S. Mukherjee (Surgeon)",
        prescriptions: ["Tab Metformin 500mg bd", "Tab Paracetamol 500mg prn", "Povidone Iodine ointment"],
      },
      {
        id: "EV-105-2",
        date: "6 days ago",
        stage: "Emergency Surgery",
        title: "Laparoscopic Appendectomy Completed",
        description: "Emergency surgery performed without intraoperative complications.",
        facility: "Bankura District Hospital",
      },
    ],
  },
  {
    id: "PAT-1065",
    referralId: "REF-106",
    name: "Bikas Mondal",
    age: 42,
    gender: "Male",
    village: "Bishnupur Rural",
    block: "Bishnupur Block",
    district: "Bankura",
    state: "West Bengal",
    phone: "+91 97321 00987",
    abhaId: "91-9988-7766-0606",
    condition: "Resolved Acute Bronchitis with Nebulization",
    conditionCategory: "Respiratory",
    riskLevel: "GREEN",
    careStage: "Completed",
    vitals: {
      bp: "120/78 mmHg",
      pulse: "76 bpm",
      spo2: "99%",
      temp: "98.1°F",
      weight: "70 kg",
    },
    lastUpdated: "1 day ago",
    assignedAsha: "Bishnupur Sub-Centre ASHA",
    referralFacility: "Bishnupur Rural Hospital",
    doctorName: "Dr. N. Banerjee",
    notes: "Course of antibiotics and nebulization completed. Lungs clear to auscultation. Episode closed.",
    timeline: [
      {
        id: "EV-106-1",
        date: "Yesterday",
        stage: "Clinical Exit & Discharge",
        title: "Discharged with Clear Auscultation",
        description: "Patient symptom-free. Respiratory rate 16/min, SpO2 99% on room air. Care episode concluded.",
        facility: "Bishnupur Rural Hospital",
        doctor: "Dr. N. Banerjee",
      },
      {
        id: "EV-106-2",
        date: "4 days ago",
        stage: "Nebulization & Inpatient Care",
        title: "Salbutamol Nebulization & Oxygen Support",
        description: "Received 3 cycles of nebulization. Wheeze subsided.",
        facility: "Bishnupur Rural Hospital",
      },
    ],
  },
  {
    id: "PAT-1095",
    referralId: "REF-107",
    name: "Meera Karmakar",
    age: 27,
    gender: "Female",
    village: "Rampur Village",
    block: "Joypur Block",
    district: "Bankura",
    state: "West Bengal",
    phone: "+91 98320 55189",
    abhaId: "91-6655-4433-0707",
    condition: "Gestational Diabetes (GDM) - 28 Weeks",
    conditionCategory: "Diabetes",
    riskLevel: "YELLOW",
    careStage: "Consultation",
    vitals: {
      bp: "126/82 mmHg",
      pulse: "80 bpm",
      spo2: "98%",
      temp: "98.4°F",
      weight: "63 kg",
      bloodSugar: "174 mg/dL",
    },
    lastUpdated: "3 hours ago",
    assignedAsha: "Kavita Roy (Rampur Sub-Centre)",
    referralFacility: "Belur Block PHC",
    doctorName: "Dr. Anirban Roy (BMOH)",
    notes: "OGTT 2-hour value 174 mg/dL. Medical nutrition therapy initiated. Fasting blood sugar target < 95 mg/dL.",
    timeline: [
      {
        id: "EV-107-1",
        date: "Today, 07:45 AM",
        stage: "Teleconsultation Review",
        title: "Dietary & Insulin Advisory Scheduled",
        description: "Teleconsult scheduled with Joypur Obstetrician to review glycemic chart and prescribe safe dietary modifications.",
        facility: "Rampur Health Sub-Centre",
        doctor: "Kavita Roy (ASHA)",
      },
      {
        id: "EV-107-2",
        date: "1 week ago",
        stage: "OGTT Screening",
        title: "Oral Glucose Tolerance Test Flagged",
        description: "Fasting 98 mg/dL, 2-hr 174 mg/dL. Enrolled in Gestational Diabetes Registry.",
        facility: "Belur Block PHC",
      },
    ],
  },
  {
    id: "PAT-1102",
    name: "Tapan Mallick",
    age: 64,
    gender: "Male",
    village: "Belur Village",
    block: "Joypur Block",
    district: "Bankura",
    state: "West Bengal",
    phone: "+91 94331 88902",
    abhaId: "91-5544-3322-0808",
    condition: "COPD Exacerbation with Low Oxygen Saturation",
    conditionCategory: "Respiratory",
    riskLevel: "RED",
    careStage: "Triage / Referred",
    vitals: {
      bp: "148/92 mmHg",
      pulse: "104 bpm",
      spo2: "87%",
      temp: "99.1°F",
      weight: "54 kg",
    },
    lastUpdated: "18 mins ago",
    assignedAsha: "Belur Sub-Centre ASHA",
    referralFacility: "Belur Block PHC",
    doctorName: "Dr. Anirban Roy (BMOH)",
    notes: "Chronic smoker with productive cough and breathlessness at rest. SpO2 87% requires emergency oxygen therapy.",
    timeline: [
      {
        id: "EV-108-1",
        date: "Today, 10:20 AM",
        stage: "Emergency Oxygen Triage",
        title: "ASHA Pulse Oximeter Alarmed at 87%",
        description: "Emergency referral created. Portable oxygen concentrator requested from Belur Block PHC.",
        facility: "Belur Village Sub-Centre",
        doctor: "ASHA Worker",
        vitals: { spo2: "87%", pulse: "104 bpm" },
      },
      {
        id: "EV-108-2",
        date: "3 weeks ago",
        stage: "NCD Clinic Screening",
        title: "NCD Clinic Follow-up - Inhaler Technique Refreshed",
        description: "Demonstrated correct rotahaler usage. Patient advised to avoid biomass smoke exposure.",
        facility: "Belur Block PHC",
      },
    ],
  },
  {
    id: "PAT-1110",
    name: "Lakshmi Murmu",
    age: 8,
    gender: "Female",
    village: "Sonapur Village",
    block: "Joypur Block",
    district: "Bankura",
    state: "West Bengal",
    phone: "+91 97322 33410",
    abhaId: "91-2233-4455-0909",
    condition: "High Fever with Chills & Rigors (Suspected Malaria)",
    conditionCategory: "Infectious / Fever",
    riskLevel: "YELLOW",
    careStage: "Triage / Referred",
    vitals: {
      bp: "100/68 mmHg",
      pulse: "112 bpm",
      spo2: "98%",
      temp: "102.6°F",
      weight: "22 kg",
      hb: "10.4 g/dL",
    },
    lastUpdated: "50 mins ago",
    assignedAsha: "Sonapur ASHA",
    referralFacility: "Joypur Block Hospital",
    doctorName: "Dr. K. Das",
    notes: "Fever spikes for 3 consecutive days. RDT (Rapid Diagnostic Kit) for Falciparum malaria positive. ASHA escorting for ACT therapy.",
    timeline: [
      {
        id: "EV-109-1",
        date: "Today, 09:00 AM",
        stage: "Village Rapid Diagnostic Test",
        title: "Plasmodium Falciparum Positive RDT",
        description: "RDT strip confirmed P. falciparum band. Paracetamol 250mg given immediately for pyrexia.",
        facility: "Sonapur Sub-Centre",
        doctor: "Sonapur ASHA",
        prescriptions: ["Tab Paracetamol 250mg stat", "ORS sachet in 1L water"],
      },
    ],
  },
  {
    id: "PAT-1115",
    name: "Gobindo Roy",
    age: 52,
    gender: "Male",
    village: "Kharagpur Rural",
    block: "Kharagpur Block",
    district: "Paschim Medinipur",
    state: "West Bengal",
    phone: "+91 94340 99881",
    abhaId: "91-1122-3344-1010",
    condition: "Closed Tibial Fracture post Tractor Incident",
    conditionCategory: "Orthopedic / Trauma",
    riskLevel: "RED",
    careStage: "Treatment",
    vitals: {
      bp: "136/88 mmHg",
      pulse: "92 bpm",
      spo2: "98%",
      temp: "98.4°F",
      weight: "68 kg",
    },
    lastUpdated: "1 hour ago",
    assignedAsha: "Kharagpur Rural Worker",
    referralFacility: "Midnapore Medical College & Hospital",
    doctorName: "Dr. S. Roy (Orthopedic Surgeon)",
    notes: "Lower leg splinted with bamboo traction splint by field team. Transferred to Medical College for open reduction & internal fixation (ORIF).",
    timeline: [
      {
        id: "EV-110-1",
        date: "Today, 08:00 AM",
        stage: "Orthopedic Inpatient Admission",
        title: "Pre-Operative Clearance & Slab Application",
        description: "Above-knee plaster slab applied. IV Ceftriaxone & Tramadol analgesia administered. Scheduled for surgery.",
        facility: "Midnapore Medical College & Hospital",
        doctor: "Dr. S. Roy",
        prescriptions: ["Inj Ceftriaxone 1g IV bd", "Inj Tramadol 50mg IV sos"],
      },
      {
        id: "EV-110-2",
        date: "Today, 06:15 AM",
        stage: "Field Immobilization",
        title: "ASHA / First Responder Splinting",
        description: "Distal pulses checked intact (dorsalis pedis palpable). Patient safely transferred.",
        facility: "Kharagpur Rural Sub-Centre",
      },
    ],
  },
];

export function mapUnifiedToPatientCase(r: UnifiedReferral): PatientCase {
  const ageMatch = r.ageGender ? r.ageGender.match(/\d+/) : null;
  const age = ageMatch ? parseInt(ageMatch[0], 10) : 28;
  const gender: "Female" | "Male" | "Other" = /\bM\b/i.test(r.ageGender)
    ? "Male"
    : /\bF\b/i.test(r.ageGender)
    ? "Female"
    : "Other";

  const riskLevel: "RED" | "YELLOW" | "GREEN" =
    r.triageLevel === "RED" ? "RED" : r.triageLevel === "YELLOW" ? "YELLOW" : "GREEN";

  let careStage: PatientCase["careStage"] = "Triage / Referred";
  switch (r.status) {
    case "Referred to Block":
      careStage = "Triage / Referred";
      break;
    case "At Block Office":
      careStage = "Consultation";
      break;
    case "Escalated to District":
      careStage = "In Transit";
      break;
    case "In Consultation":
      careStage = "Treatment";
      break;
    case "Back-Referred":
      careStage = "Back-Referred / Follow-up";
      break;
    case "Completed":
      careStage = "Completed";
      break;
    default:
      careStage = "Triage / Referred";
  }

  const categoryLower = (r.category || "").toLowerCase();
  let conditionCategory: PatientCase["conditionCategory"] = "Maternal Health";
  if (categoryLower.includes("diabetes") || categoryLower.includes("gdm") || categoryLower.includes("blood sugar")) {
    conditionCategory = "Diabetes";
  } else if (categoryLower.includes("hypertension") || categoryLower.includes("cardiac") || categoryLower.includes("stemi") || categoryLower.includes("bp")) {
    conditionCategory = "Hypertension";
  } else if (categoryLower.includes("pediatric") || categoryLower.includes("child") || categoryLower.includes("sam") || categoryLower.includes("infant")) {
    conditionCategory = "Pediatric";
  } else if (categoryLower.includes("fever") || categoryLower.includes("malaria") || categoryLower.includes("infectious") || categoryLower.includes("tb")) {
    conditionCategory = "Infectious / Fever";
  } else if (categoryLower.includes("respiratory") || categoryLower.includes("copd") || categoryLower.includes("bronchitis") || categoryLower.includes("asthma")) {
    conditionCategory = "Respiratory";
  } else if (categoryLower.includes("trauma") || categoryLower.includes("fracture") || categoryLower.includes("orthopedic")) {
    conditionCategory = "Orthopedic / Trauma";
  }

  const cleanIdNum = (r.patientId || "").replace(/\D/g, "") || "0000";
  const abhaId = r.patientId ? `91-${cleanIdNum.padStart(4, "0")}-5678-${cleanIdNum.padStart(4, "0").slice(0, 4)}` : "91-0000-0000-0000";

  return {
    id: r.patientId || "PAT-UNKNOWN",
    referralId: r.id,
    name: r.patientName || "Patient Record",
    age,
    gender,
    village: r.village || "Rampur Village",
    block: r.block || "Joypur Block",
    district: r.district || "Bankura",
    state: r.state || "West Bengal",
    phone: "+91 98321 " + cleanIdNum.padStart(5, "0").slice(-5),
    abhaId,
    condition: r.category || "Clinical Evaluation",
    conditionCategory,
    riskLevel,
    careStage,
    vitals: {
      bp: riskLevel === "RED" ? "150/98 mmHg" : "120/80 mmHg",
      pulse: riskLevel === "RED" ? "98 bpm" : "76 bpm",
      spo2: riskLevel === "RED" ? "94%" : "98%",
      temp: "98.6°F",
      weight: "58 kg",
    },
    lastUpdated: r.referralDate || "Recently",
    assignedAsha: r.fromFacilityOrWorker || "ASHA Worker",
    referralFacility: r.toFacility || "Block PHC",
    doctorName: r.assignedDoctor || "On-duty Medical Officer",
    notes: r.clinicalNotes || "Clinical evaluation requested",
    timeline: [
      {
        id: `EV-${r.id}-1`,
        date: r.referralDate || "Today",
        stage: careStage,
        title: `Referral Logged: ${r.status}`,
        description: r.clinicalNotes || "Referral registered into system",
        facility: r.fromFacilityOrWorker || "Sub-Centre",
      },
    ],
  };
}
