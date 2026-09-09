export type UserRole = 
  | 'nurse_pcu'       // พยาบาล/จนท. ANC PCU
  | 'doctor_pcu'      // แพทย์/ผู้รับผิดชอบ PCU
  | 'referral_coord'  // ผู้ประสานงานส่งต่อ
  | 'executive_pcu'   // ผู้บริหารกลุ่มงาน PCU
  | 'anc_sakonnakhon';// ANC รพ.สกลนคร

export type RiskLevel = 'GREEN' | 'YELLOW' | 'RED';

export type ReferralUrgency = 'EMERGENCY' | 'URGENT' | 'ROUTINE';

export type ReferralStatus = 
  | 'SENT'               // ส่งแล้ว
  | 'APPOINTED'          // นัดแล้ว
  | 'ATTENDED'           // ไปตามนัด
  | 'NO_SHOW'            // ขาดนัด
  | 'FEEDBACK_RECEIVED'  // ได้รับผลตอบกลับ
  | 'CLOSED';            // ปิดเคส

export interface BaselineLab {
  bloodGroup: string;       // A, B, AB, O
  rh: string;               // Positive, Negative
  hb: number;               // g/dL (normal >= 11)
  hct: number;              // % (normal >= 33)
  vdrl: 'Non-reactive' | 'Reactive';
  hiv: 'Negative' | 'Positive';
  hbsag: 'Negative' | 'Positive';
  thalassemia: 'Normal' | 'Trait/Carrier' | 'Disease' | 'Pending';
  urineAlbumin: 'Negative' | 'Trace' | '1+' | '2+' | '3+';
  urineSugar: 'Negative' | 'Trace' | '1+' | '2+' | '3+';
  bloodSugar?: number;      // mg/dL
  oralHealthExam?: 'Normal' | 'Needs dental care';
}

export interface BaselineVitals {
  weight: number;           // kg
  height: number;           // cm
  bmi: number;              // kg/m2
  bpSystolic: number;       // mmHg
  bpDiastolic: number;      // mmHg
  pulseRate?: number;       // bpm
}

export interface Patient {
  id: string;
  hn: string;
  cid: string;
  fullName: string;
  birthDate: string;
  age: number;
  phone: string;
  emergencyContact: string;
  address: string;
  village: string;          // e.g. "ม.1 บ้านโพนนาแก้ว"
  subdistrict: string;      // e.g. "ตำบลโพนนาแก้ว"
  district: string;         // "อำเภอโพนนาแก้ว"
  province: string;         // "จังหวัดสกลนคร"
  rights: string;           // "บัตรทอง (UCS)", "ประกันสังคม", "จ่ายตรงข้าราชการ", "ชำระเงินเอง"
  
  // Pregnancy data
  gravida: number;
  para: number;
  abortion: number;
  living: number;
  pregnancyNumber: number;
  lmp: string;              // YYYY-MM-DD
  edc: string;              // YYYY-MM-DD
  gaWeeksAtFirstVisit: number;
  calculationMethod: 'LMP' | 'USG';
  firstVisitDate: string;
  isFirstVisitEarly: boolean; // <= 12 weeks
  
  // Risk & Flags
  riskLevel: RiskLevel;
  riskReasons: string[];
  clinicalRiskConfirmed: boolean;
  clinicalRiskNotes?: string;
  riskConfirmedBy?: string;
  riskConfirmedDate?: string;
  
  // Clinical baseline
  baselineVitals: BaselineVitals;
  baselineLab: BaselineLab;
  medicalHistory: string[];  // e.g. ["เบาหวาน", "ผ่าตัดคลอดครรภ์ก่อน"]
  drugAllergies: string;
  currentMedications: string[]; // e.g. ["Triferdine 1x1", "Calcium carbonate 1x1"]
  
  // Follow-up status
  totalVisits: number;
  isCompleted8Visits: boolean;
  status: 'ACTIVE' | 'REFERRED' | 'DELIVERED' | 'CLOSED';
  lastVisitDate?: string;
  nextAppointmentDate?: string;
  isMissedAppointment?: boolean;
  missedAppointmentDays?: number;
}

export interface ANCVisit {
  id: string;
  patientId: string;
  visitNumber: number;      // 1 to 8+
  date: string;
  gaWeeks: number;
  weight: number;
  bpSystolic: number;
  bpDiastolic: number;
  fundalHeightCm?: number;
  fetalHeartSoundBpm?: number;
  fetalMovement: 'NORMAL' | 'DECREASED' | 'NOT_APPLICABLE'; // Applicable after ~20-24 wks
  edema: 'NONE' | '1+' | '2+' | '3+';
  urineProtein: 'Negative' | 'Trace' | '1+' | '2+' | '3+';
  urineSugar: 'Negative' | 'Trace' | '1+' | '2+' | '3+';
  abnormalSymptoms: string[];
  treatmentAndAdvice: string;
  medicationsDispensed: string[];
  nextAppointmentDate?: string;
  recordedBy: string;
  recordedRole: string;
}

export interface AttachmentItem {
  id: string;
  title: string;
  type: 'LAB' | 'USG' | 'PINK_BOOK' | 'RIGHTS' | 'OTHER';
  filename: string;
  date: string;
  fileSize?: string;
}

export interface Referral {
  id: string;
  refNumber: string;         // e.g. "REF-PNK-2569-0012"
  patientId: string;
  patientHn: string;
  patientFullName: string;
  createdDate: string;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  
  // Section A: Patient Info
  partA: {
    fullName: string;
    hn: string;
    cid: string;
    age: number;
    phone: string;
    rights: string;
    address: string;
    village: string;
  };
  
  // Section B: Current Pregnancy
  partB: {
    gpal: string;           // "G2 P1 A0 L1"
    lmp: string;
    edc: string;
    gaAtReferralWeeks: number;
    weight: number;
    bpSystolic: number;
    bpDiastolic: number;
    chiefComplaint: string;
    currentMeds: string;
  };
  
  // Section C: Indications
  partC: {
    highRiskAnc: boolean;
    abnormalLab: boolean;
    underlyingDisease: boolean;
    complicationSuspected: boolean;
    obGynConsult: boolean;
    ultrasoundRequest: boolean;
    otherDetail?: string;
    selectedIndicationsList: string[];
  };
  
  // Section D: Clinical Treatment & Risk
  partD: {
    drugAllergies: string;
    medicalHistory: string;
    surgicalHistory: string;
    latestLabSummary: string;
    initialTreatmentProvided: string;
    doctorApproval?: {
      approved: boolean;
      doctorName: string;
      date: string;
      comment?: string;
    };
  };
  
  // Section E: Coordination
  partE: {
    destinationHospital: string; // "ANC รพ.สกลนคร"
    appointmentDate?: string;
    appointmentTime?: string;
    coordinationChannel: string; // e.g. "ระบบส่งต่อออนไลน์ + โทรประสาน"
    senderStaffName: string;
    pcuContactTel: string;
    transportType: 'AMBULANCE' | 'SELF_TRAVEL' | 'PCU_VEHICLE';
  };
  
  // Section F: Feedback from ANC Sakon Nakhon
  partF?: {
    receivedDate?: string;
    receiverName?: string;
    clinicalFindings?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    nextHospitalAppointmentDate?: string;
    recommendationsForPCU?: string;
    careStatus: 'ADMITTED' | 'OPD_FOLLOWUP' | 'RETURN_CARE_TO_PCU' | 'REFERRED_TERTIARY';
    feedbackDate?: string;
    feedbackDoctor?: string;
  };
  
  attachments: AttachmentItem[];
  trackingLogs: {
    id: string;
    timestamp: string;
    type: 'PHONE' | 'HOME_VISIT' | 'COORDINATION' | 'SYSTEM';
    note: string;
    recordedBy: string;
  }[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'REFER' | 'FEEDBACK' | 'LOGIN' | 'REFERRAL_SENT' | 'FEEDBACK_RECEIVED' | 'OVERRIDE_RISK';
  targetPatientHn?: string;
  details: string;
}

export type AuditLog = AuditLogItem;

export interface DefaulterRecord {
  patientId: string;
  patientName: string;
  hn: string;
  phone: string;
  village: string;
  missedDate: string;
  daysLate: number;
  riskLevel: RiskLevel;
  callAttempts: number;
  lastContactDate?: string;
  homeVisitStatus: 'NOT_SCHEDULED' | 'ASSIGNED_VHV' | 'COMPLETED' | 'UNABLE_TO_CONTACT';
  notes?: string;
}

export interface VillageInfo {
  subdistrict: string;
  moo: number;
  villageName: string;
  fullName: string;
}

export interface SubdistrictInfo {
  name: string;
  totalVillages: number;
  villages: VillageInfo[];
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'head' | 'officer' | 'hospital';
  systemRole: UserRole;
  roleLabel: string;
  position: string;
}

export type SyncState = 'connecting' | 'connected' | 'offline' | 'error' | 'syncing';
