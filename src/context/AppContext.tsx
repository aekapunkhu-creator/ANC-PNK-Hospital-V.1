import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserRole, 
  Patient, 
  ANCVisit, 
  Referral, 
  AuditLogItem, 
  ReferralStatus,
  AppUser,
  SyncState
} from '../types';
import { 
  INITIAL_PATIENTS, 
  INITIAL_VISITS, 
  INITIAL_REFERRALS, 
  INITIAL_AUDIT_LOGS 
} from '../data/mockData';
import { INITIAL_USERS } from '../data/users';
import { 
  subscribeToPatients, 
  subscribeToReferrals, 
  subscribeToAuditLogs, 
  subscribeToUsers,
  savePatientToFirestore, 
  saveReferralToFirestore, 
  addAuditLogToFirestore, 
  seedInitialFirestoreData,
  deletePatientFromFirestore
} from '../firebase';
import { exportAncRegisterToExcel, ExportOptions } from '../utils/exportExcel';
import { calculateEDC, evaluateRisk } from '../utils/ancCalculations';

interface AppContextType {
  // Auth & User
  currentUser: AppUser | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUserLabel: string;
  users: AppUser[];
  login: (username: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // Firebase Sync
  syncState: SyncState;
  lastSyncedTime: string | null;
  syncNowToFirebase: () => Promise<boolean>;

  // Data collections
  patients: Patient[];
  visits: ANCVisit[];
  referrals: Referral[];
  auditLogs: AuditLogItem[];
  
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Modal for editing patient
  isEditPatientModalOpen: boolean;
  patientToEdit: Patient | null;
  openEditPatientModal: (patient: Patient) => void;
  closeEditPatientModal: () => void;
  
  // Actions
  registerFirstAnc: (patientData: Omit<Patient, 'id' | 'hn' | 'totalVisits' | 'isCompleted8Visits' | 'status'>, initialVisitNotes: string) => Patient;
  updatePatient: (patientId: string, updatedData: Partial<Patient>) => boolean;
  deletePatient: (patientId: string) => { success: boolean; message: string };
  addAncVisit: (visit: Omit<ANCVisit, 'id' | 'recordedBy' | 'recordedRole'>) => ANCVisit;
  updateAncVisit: (visitId: string, updatedData: Partial<ANCVisit>) => boolean;
  confirmClinicalRisk: (patientId: string, confirmed: boolean, notes?: string) => void;
  createReferral: (referralData: Omit<Referral, 'id' | 'refNumber' | 'createdDate' | 'status' | 'attachments' | 'trackingLogs'>) => Referral;
  approveReferralByDoctor: (referralId: string, doctorName: string, comment?: string) => void;
  submitHospitalFeedback: (referralId: string, feedbackData: NonNullable<Referral['partF']>) => void;
  updateReferralStatus: (referralId: string, newStatus: ReferralStatus, note?: string) => void;
  logFollowUpAction: (patientId: string, type: 'PHONE' | 'HOME_VISIT' | 'COORDINATION', note: string) => void;
  recordAuditLog: (action: AuditLogItem['action'], details: string, patientHn?: string) => void;
  resetToDefaultData: () => void;
  exportExcel: (options?: ExportOptions) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users list
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);

  // Authenticated user
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('anc_logged_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading logged in user:', e);
    }
    return null;
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    return currentUser?.systemRole || 'nurse_pcu';
  });

  // Data states with fallback to localStorage
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('anc_app_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [visits, setVisits] = useState<ANCVisit[]>(() => {
    const saved = localStorage.getItem('anc_app_visits');
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  const [referrals, setReferrals] = useState<Referral[]>(() => {
    const saved = localStorage.getItem('anc_app_referrals');
    return saved ? JSON.parse(saved) : INITIAL_REFERRALS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem('anc_app_audit');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Edit patient modal state
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const openEditPatientModal = useCallback((patient: Patient) => {
    setPatientToEdit(patient);
    setIsEditPatientModalOpen(true);
  }, []);

  const closeEditPatientModal = useCallback(() => {
    setIsEditPatientModalOpen(false);
    setPatientToEdit(null);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  // Firebase status
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    return localStorage.getItem('anc_last_synced') || null;
  });

  // Sync to local storage for fast offline resilience
  useEffect(() => {
    localStorage.setItem('anc_app_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('anc_app_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('anc_app_referrals', JSON.stringify(referrals));
  }, [referrals]);

  useEffect(() => {
    localStorage.setItem('anc_app_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Firebase Real-time Subscriptions
  useEffect(() => {
    let unsubscribePatients: (() => void) | null = null;
    let unsubscribeReferrals: (() => void) | null = null;
    let unsubscribeAuditLogs: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;

    setSyncState('connecting');

    // First attempt to seed if empty
    seedInitialFirestoreData(INITIAL_PATIENTS, INITIAL_REFERRALS, INITIAL_AUDIT_LOGS)
      .then(() => {
        console.log('Firebase ready.');
      })
      .catch((err) => {
        console.warn('Firebase initial seed check:', err);
      });

    try {
      unsubscribePatients = subscribeToPatients(
        (remotePatients) => {
          if (remotePatients && remotePatients.length > 0) {
            setPatients(remotePatients);
            const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastSyncedTime(nowTime);
            localStorage.setItem('anc_last_synced', nowTime);
          }
          setSyncState('connected');
        },
        () => {
          setSyncState('offline');
        }
      );

      unsubscribeReferrals = subscribeToReferrals(
        (remoteReferrals) => {
          if (remoteReferrals && remoteReferrals.length > 0) {
            setReferrals(remoteReferrals);
          }
        },
        () => setSyncState('offline')
      );

      unsubscribeAuditLogs = subscribeToAuditLogs(
        (remoteLogs) => {
          if (remoteLogs && remoteLogs.length > 0) {
            setAuditLogs(remoteLogs);
          }
        },
        () => setSyncState('offline')
      );

      unsubscribeUsers = subscribeToUsers(
        (remoteUsers) => {
          if (remoteUsers && remoteUsers.length > 0) {
            setUsers(remoteUsers);
          }
        },
        () => {}
      );
    } catch (err) {
      console.error('Error starting Firebase subscriptions:', err);
      setSyncState('offline');
    }

    return () => {
      if (unsubscribePatients) unsubscribePatients();
      if (unsubscribeReferrals) unsubscribeReferrals();
      if (unsubscribeAuditLogs) unsubscribeAuditLogs();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  // Update currentRole when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setCurrentRoleState(currentUser.systemRole);
    }
  }, [currentUser]);

  const currentUserLabel = currentUser
    ? `${currentUser.name} (${currentUser.position} • ${currentUser.roleLabel})`
    : 'ยังไม่ได้เข้าสู่ระบบ';

  // Record audit log helper
  const recordAuditLog = useCallback((action: AuditLogItem['action'], details: string, patientHn?: string) => {
    const userName = currentUser ? currentUser.name : 'ระบบ';
    const role = currentRole;
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userName,
      userRole: role,
      action,
      targetPatientHn: patientHn,
      details
    };

    setAuditLogs(prev => [newLog, ...prev]);

    // Save to Firestore
    addAuditLogToFirestore(newLog).catch(err => console.warn('Could not save audit log to Firestore:', err));
  }, [currentUser, currentRole]);

  // Login handler
  const login = (username: string, password?: string): { success: boolean; message?: string } => {
    const found = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) {
      return { success: false, message: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ' };
    }

    if (found.password && password && found.password !== password) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' };
    }

    setCurrentUser(found);
    setCurrentRoleState(found.systemRole);
    localStorage.setItem('anc_logged_user', JSON.stringify(found));
    
    // Log audit login
    recordAuditLog('LOGIN', `เข้าสู่ระบบสำเร็จ: ${found.name} (${found.roleLabel})`);

    return { success: true };
  };

  // Logout handler
  const logout = () => {
    if (currentUser) {
      recordAuditLog('LOGIN', `ออกจากระบบ: ${currentUser.name}`);
    }
    setCurrentUser(null);
    localStorage.removeItem('anc_logged_user');
  };

  // Switch role directly (for testing/preview)
  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    recordAuditLog('LOGIN', `สลับบทบาทการใช้งานเป็น: ${role}`);
  };

  // Manual trigger to sync/backup everything to Firebase
  const syncNowToFirebase = async (): Promise<boolean> => {
    setSyncState('syncing');
    try {
      // Push all patients
      for (const p of patients) {
        await savePatientToFirestore(p);
      }
      // Push all referrals
      for (const r of referrals) {
        await saveReferralToFirestore(r);
      }
      const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(nowTime);
      localStorage.setItem('anc_last_synced', nowTime);
      setSyncState('connected');
      recordAuditLog('UPDATE', `ซิงก์และสำรองข้อมูลทั้งหมดขึ้น Firestore สำเร็จ (${patients.length} รายการ)`);
      return true;
    } catch (err) {
      console.error('Error during manual sync:', err);
      setSyncState('error');
      return false;
    }
  };

  // Register First ANC
  const registerFirstAnc = (
    patientData: Omit<Patient, 'id' | 'hn' | 'totalVisits' | 'isCompleted8Visits' | 'status'>,
    initialVisitNotes: string
  ): Patient => {
    const newHn = `67-${String(Math.floor(10000 + Math.random() * 90000)).slice(0, 5)}`;
    const newId = `pt-${Date.now()}`;
    const newPatient: Patient = {
      ...patientData,
      id: newId,
      hn: newHn,
      totalVisits: 1,
      isCompleted8Visits: false,
      status: 'ACTIVE',
      lastVisitDate: patientData.firstVisitDate,
      nextAppointmentDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    // Auto-create Visit 1
    const newVisit: ANCVisit = {
      id: `v-${newId}-1`,
      patientId: newId,
      visitNumber: 1,
      date: patientData.firstVisitDate,
      gaWeeks: patientData.gaWeeksAtFirstVisit,
      weight: patientData.baselineVitals.weight,
      bpSystolic: patientData.baselineVitals.bpSystolic,
      bpDiastolic: patientData.baselineVitals.bpDiastolic,
      fundalHeightCm: patientData.gaWeeksAtFirstVisit > 12 ? Math.round(patientData.gaWeeksAtFirstVisit * 0.9) : 0,
      fetalHeartSoundBpm: patientData.gaWeeksAtFirstVisit >= 12 ? 140 : 0,
      fetalMovement: patientData.gaWeeksAtFirstVisit >= 20 ? 'NORMAL' : 'NOT_APPLICABLE',
      edema: 'NONE',
      urineProtein: patientData.baselineLab.urineAlbumin,
      urineSugar: patientData.baselineLab.urineSugar,
      abnormalSymptoms: [],
      treatmentAndAdvice: initialVisitNotes || 'บันทึกฝากครรภ์ครั้งแรก ให้สุขศึกษาและจ่ายยาบำรุงครรภ์',
      medicationsDispensed: patientData.currentMedications,
      nextAppointmentDate: newPatient.nextAppointmentDate,
      recordedBy: currentUser ? currentUser.name : 'เจ้าหน้าที่ PCU',
      recordedRole: currentUser ? currentUser.position : 'พยาบาลวิชาชีพ'
    };

    setPatients(prev => [newPatient, ...prev]);
    setVisits(prev => [newVisit, ...prev]);
    recordAuditLog('CREATE', `ลงทะเบียนฝากครรภ์ครั้งแรก HN ${newHn} (${newPatient.fullName})`, newHn);

    // Save to Firebase immediately
    savePatientToFirestore(newPatient).catch(e => console.warn('Firebase save patient error:', e));

    return newPatient;
  };

  // Update Patient Record (Editable from any page)
  const updatePatient = (patientId: string, updatedData: Partial<Patient>): boolean => {
    let updatedPt: Patient | null = null;

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        // Recalculate EDC if LMP changed
        const newLmp = updatedData.lmp || p.lmp;
        const newEdc = updatedData.lmp ? calculateEDC(updatedData.lmp) : (updatedData.edc || p.edc);

        // Recalculate Risk
        const age = updatedData.age !== undefined ? updatedData.age : p.age;
        const bpSys = updatedData.baselineVitals?.bpSystolic ?? p.baselineVitals.bpSystolic;
        const bpDia = updatedData.baselineVitals?.bpDiastolic ?? p.baselineVitals.bpDiastolic;
        const hb = updatedData.baselineLab?.hb ?? p.baselineLab.hb;
        const rh = updatedData.baselineLab?.rh ?? p.baselineLab.rh;
        const urineAlb = updatedData.baselineLab?.urineAlbumin ?? p.baselineLab.urineAlbumin;
        const medHistoryList: string[] = updatedData.medicalHistory ?? p.medicalHistory ?? [];

        const evaluated = evaluateRisk({
          age,
          bpSystolic: bpSys,
          bpDiastolic: bpDia,
          urineProtein: urineAlb,
          hb,
          rh,
          medicalHistory: medHistoryList,
          gravida: updatedData.gravida ?? p.gravida
        });

        updatedPt = {
          ...p,
          ...updatedData,
          lmp: newLmp,
          edc: newEdc,
          riskLevel: updatedData.riskLevel || evaluated.level,
          riskReasons: updatedData.riskReasons || evaluated.reasons
        };
        return updatedPt;
      }
      return p;
    }));

    if (updatedPt) {
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(updatedPt);
      }
      savePatientToFirestore(updatedPt).catch(e => console.warn('Firebase update patient error:', e));
      recordAuditLog('UPDATE', `แก้ไขข้อมูลการฝากครรภ์ผู้ป่วย HN ${(updatedPt as Patient).hn} (${(updatedPt as Patient).fullName})`, (updatedPt as Patient).hn);
      return true;
    }
    return false;
  };

  // Delete Patient Record (ADMIN ONLY)
  const deletePatient = (patientId: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ได้รับอนุญาตให้ลบเคสผู้ป่วยออกจากระบบ'
      };
    }

    const targetPatient = patients.find(p => p.id === patientId);
    if (!targetPatient) {
      return { success: false, message: 'ไม่พบข้อมูลผู้ป่วยที่ต้องการลบ' };
    }

    // Remove from local patients
    setPatients(prev => prev.filter(p => p.id !== patientId));

    // Remove associated visits
    setVisits(prev => prev.filter(v => v.patientId !== patientId));

    // Remove associated referrals
    setReferrals(prev => prev.filter(r => r.patientId !== patientId));

    // Clear selectedPatient if matched
    if (selectedPatient?.id === patientId) {
      setSelectedPatient(null);
    }

    // Delete from Firestore
    deletePatientFromFirestore(patientId).catch(e => console.warn('Firebase delete patient error:', e));

    // Audit log
    recordAuditLog(
      'DELETE',
      `ผู้ดูแลระบบ (${currentUser.name}) ทำการลบเคสผู้ป่วย ${targetPatient.fullName} (HN: ${targetPatient.hn}) ออกจากระบบ`,
      targetPatient.hn
    );

    return {
      success: true,
      message: `ลบเคสผู้ป่วย ${targetPatient.fullName} (HN: ${targetPatient.hn}) ออกจากระบบเรียบร้อยแล้ว`
    };
  };

  // Update ANC Visit
  const updateAncVisit = (visitId: string, updatedData: Partial<ANCVisit>): boolean => {
    let updated: ANCVisit | null = null;
    setVisits(prev => prev.map(v => {
      if (v.id === visitId) {
        updated = { ...v, ...updatedData };
        return updated;
      }
      return v;
    }));

    if (updated) {
      recordAuditLog('UPDATE', `แก้ไขบันทึกการตรวจ ANC ครั้งที่ ${(updated as ANCVisit).visitNumber}`);
      return true;
    }
    return false;
  };

  // Add ANC Visit
  const addAncVisit = (visitData: Omit<ANCVisit, 'id' | 'recordedBy' | 'recordedRole'>): ANCVisit => {
    const newVisitId = `v-${visitData.patientId}-${visitData.visitNumber}-${Date.now()}`;
    const newVisit: ANCVisit = {
      ...visitData,
      id: newVisitId,
      recordedBy: currentUser ? currentUser.name : 'เจ้าหน้าที่ PCU',
      recordedRole: currentUser ? currentUser.position : 'พยาบาลวิชาชีพ'
    };

    setVisits(prev => [newVisit, ...prev]);

    // Update patient record
    let updatedPatient: Patient | null = null;
    setPatients(prev => prev.map(p => {
      if (p.id === visitData.patientId) {
        const newCount = Math.max(p.totalVisits, visitData.visitNumber);
        updatedPatient = {
          ...p,
          totalVisits: newCount,
          isCompleted8Visits: newCount >= 8,
          lastVisitDate: visitData.date,
          nextAppointmentDate: visitData.nextAppointmentDate || p.nextAppointmentDate,
          isMissedAppointment: false,
          missedAppointmentDays: 0
        };
        return updatedPatient;
      }
      return p;
    }));

    if (updatedPatient) {
      savePatientToFirestore(updatedPatient).catch(e => console.warn('Firebase update patient error:', e));
    }

    const patient = patients.find(p => p.id === visitData.patientId);
    recordAuditLog(
      'CREATE', 
      `บันทึกการตรวจ ANC ครั้งที่ ${visitData.visitNumber} (GA ${visitData.gaWeeks} สัปดาห์, BP ${visitData.bpSystolic}/${visitData.bpDiastolic})`, 
      patient?.hn
    );

    return newVisit;
  };

  // Confirm Clinical Risk
  const confirmClinicalRisk = (patientId: string, confirmed: boolean, notes?: string) => {
    let updatedPatient: Patient | null = null;
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        updatedPatient = {
          ...p,
          clinicalRiskConfirmed: confirmed,
          clinicalRiskNotes: notes || p.clinicalRiskNotes,
          riskConfirmedBy: currentUser ? currentUser.name : 'แพทย์/จนท. PCU',
          riskConfirmedDate: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
        return updatedPatient;
      }
      return p;
    }));

    if (updatedPatient) {
      savePatientToFirestore(updatedPatient).catch(e => console.warn('Firebase update risk error:', e));
    }

    const pt = patients.find(p => p.id === patientId);
    recordAuditLog('UPDATE', `ทบทวนและยืนยันการคัดกรองความเสี่ยงทางคลินิก (${pt?.riskLevel})`, pt?.hn);
  };

  // Create Referral
  const createReferral = (
    referralData: Omit<Referral, 'id' | 'refNumber' | 'createdDate' | 'status' | 'attachments' | 'trackingLogs'>
  ): Referral => {
    const yearBE = new Date().getFullYear() + 543;
    const count = referrals.length + 1;
    const refNum = `REF-PNK-${yearBE}-${String(count).padStart(4, '0')}`;
    const newRefId = `ref-${Date.now()}`;

    const newReferral: Referral = {
      ...referralData,
      id: newRefId,
      refNumber: refNum,
      createdDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'SENT',
      attachments: [
        {
          id: `att-${Date.now()}-1`,
          title: 'ผลตรวจเลือดและปัสสาวะล่าสุด',
          type: 'LAB',
          filename: `Lab_${referralData.patientHn}.pdf`,
          date: new Date().toISOString().split('T')[0],
          fileSize: '350 KB'
        },
        {
          id: `att-${Date.now()}-2`,
          title: 'สำเนาบันทึกสมุดสุขภาพแม่และเด็ก',
          type: 'PINK_BOOK',
          filename: `PinkBook_${referralData.patientHn}.pdf`,
          date: new Date().toISOString().split('T')[0],
          fileSize: '1.5 MB'
        }
      ],
      trackingLogs: [
        {
          id: `trk-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'SYSTEM',
          note: `สร้างใบส่งต่อเลขที่ ${refNum} ไปยัง ${referralData.partE.destinationHospital}`,
          recordedBy: currentUser ? currentUser.name : 'เจ้าหน้าที่ส่งต่อ'
        }
      ]
    };

    setReferrals(prev => [newReferral, ...prev]);

    // Update patient status to REFERRED
    let updatedPt: Patient | null = null;
    setPatients(prev => prev.map(p => {
      if (p.id === referralData.patientId) {
        updatedPt = { ...p, status: 'REFERRED' };
        return updatedPt;
      }
      return p;
    }));

    // Save to Firestore
    saveReferralToFirestore(newReferral).catch(e => console.warn('Firebase save referral error:', e));
    if (updatedPt) {
      savePatientToFirestore(updatedPt).catch(e => console.warn('Firebase update patient status error:', e));
    }

    recordAuditLog(
      'REFER', 
      `ส่งต่อผู้ป่วยไปยัง ${referralData.partE.destinationHospital} (เลขที่: ${refNum}, ระดับ: ${referralData.urgency})`, 
      referralData.patientHn
    );

    return newReferral;
  };

  // Doctor Approval
  const approveReferralByDoctor = (referralId: string, doctorName: string, comment?: string) => {
    let updatedRef: Referral | null = null;
    setReferrals(prev => prev.map(ref => {
      if (ref.id === referralId) {
        updatedRef = {
          ...ref,
          partD: {
            ...ref.partD,
            doctorApproval: {
              approved: true,
              doctorName,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
              comment: comment || 'อนุมัติการส่งต่อตามข้อบ่งชี้ทางสูติกรรม'
            }
          },
          trackingLogs: [
            ...ref.trackingLogs,
            {
              id: `trk-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              type: 'COORDINATION',
              note: `แพทย์ PCU (${doctorName}) อนุมัติใบส่งต่อ: ${comment || 'อนุมัติ'}`,
              recordedBy: doctorName
            }
          ]
        };
        return updatedRef;
      }
      return ref;
    }));

    if (updatedRef) {
      saveReferralToFirestore(updatedRef).catch(e => console.warn('Firebase update referral approval error:', e));
    }

    const ref = referrals.find(r => r.id === referralId);
    recordAuditLog('UPDATE', `แพทย์อนุมัติการส่งต่อเลขที่ ${ref?.refNumber}`, ref?.patientHn);
  };

  // Submit Hospital Feedback
  const submitHospitalFeedback = (referralId: string, feedbackData: NonNullable<Referral['partF']>) => {
    let updatedRef: Referral | null = null;
    setReferrals(prev => prev.map(ref => {
      if (ref.id === referralId) {
        updatedRef = {
          ...ref,
          status: 'FEEDBACK_RECEIVED',
          partF: feedbackData,
          trackingLogs: [
            ...ref.trackingLogs,
            {
              id: `trk-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              type: 'COORDINATION',
              note: `ANC รพ.สกลนคร ส่งผลตอบกลับการดูแล: ${feedbackData.diagnosis || 'วินิจฉัยและวางแผนการรักษา'}`,
              recordedBy: feedbackData.feedbackDoctor || (currentUser ? currentUser.name : 'ANC รพ.สกลนคร')
            }
          ]
        };
        return updatedRef;
      }
      return ref;
    }));

    if (updatedRef) {
      saveReferralToFirestore(updatedRef).catch(e => console.warn('Firebase update feedback error:', e));
    }

    const ref = referrals.find(r => r.id === referralId);
    if (ref) {
      if (feedbackData.careStatus === 'RETURN_CARE_TO_PCU') {
        let updatedPt: Patient | null = null;
        setPatients(prev => prev.map(p => {
          if (p.id === ref.patientId) {
            updatedPt = {
              ...p,
              status: 'ACTIVE',
              clinicalRiskNotes: `[ผลจาก รพ.สกลนคร] ${feedbackData.recommendationsForPCU || ''}`
            };
            return updatedPt;
          }
          return p;
        }));

        if (updatedPt) {
          savePatientToFirestore(updatedPt).catch(e => console.warn('Firebase update patient after feedback:', e));
        }
      }

      recordAuditLog(
        'FEEDBACK', 
        `บันทึกผลตอบกลับจาก ANC รพ.สกลนคร (การวินิจฉัย: ${feedbackData.diagnosis})`, 
        ref.patientHn
      );
    }
  };

  // Update Referral Status
  const updateReferralStatus = (referralId: string, newStatus: ReferralStatus, note?: string) => {
    let updatedRef: Referral | null = null;
    setReferrals(prev => prev.map(ref => {
      if (ref.id === referralId) {
        updatedRef = {
          ...ref,
          status: newStatus,
          trackingLogs: [
            ...ref.trackingLogs,
            {
              id: `trk-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              type: 'COORDINATION',
              note: `ปรับสถานะเป็น [${newStatus}] ${note ? `: ${note}` : ''}`,
              recordedBy: currentUser ? currentUser.name : 'เจ้าหน้าที่'
            }
          ]
        };
        return updatedRef;
      }
      return ref;
    }));

    if (updatedRef) {
      saveReferralToFirestore(updatedRef).catch(e => console.warn('Firebase update referral status error:', e));
    }

    const ref = referrals.find(r => r.id === referralId);
    recordAuditLog('UPDATE', `ปรับสถานะการส่งต่อเป็น ${newStatus}`, ref?.patientHn);
  };

  // Log Follow-up
  const logFollowUpAction = (patientId: string, type: 'PHONE' | 'HOME_VISIT' | 'COORDINATION', note: string) => {
    const pt = patients.find(p => p.id === patientId);
    if (!pt) return;

    let updatedRef: Referral | null = null;
    setReferrals(prev => prev.map(ref => {
      if (ref.patientId === patientId) {
        updatedRef = {
          ...ref,
          trackingLogs: [
            ...ref.trackingLogs,
            {
              id: `trk-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              type,
              note,
              recordedBy: currentUser ? currentUser.name : 'เจ้าหน้าที่'
            }
          ]
        };
        return updatedRef;
      }
      return ref;
    }));

    if (updatedRef) {
      saveReferralToFirestore(updatedRef).catch(e => console.warn('Firebase follow-up referral update:', e));
    }

    let updatedPt: Patient | null = null;
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        updatedPt = {
          ...p,
          clinicalRiskNotes: `${p.clinicalRiskNotes || ''}\n[ติดตาม ${type}] ${note}`
        };
        return updatedPt;
      }
      return p;
    }));

    if (updatedPt) {
      savePatientToFirestore(updatedPt).catch(e => console.warn('Firebase follow-up patient update:', e));
    }

    recordAuditLog('UPDATE', `บันทึกการติดตามผู้รับบริการ (${type}): ${note}`, pt.hn);
  };

  // Reset Data to Default
  const resetToDefaultData = () => {
    localStorage.removeItem('anc_app_patients');
    localStorage.removeItem('anc_app_visits');
    localStorage.removeItem('anc_app_referrals');
    localStorage.removeItem('anc_app_audit');
    setPatients(INITIAL_PATIENTS);
    setVisits(INITIAL_VISITS);
    setReferrals(INITIAL_REFERRALS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSelectedPatient(null);
    recordAuditLog('UPDATE', 'รีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้น');
  };

  // Export to Excel helper
  const exportExcel = (options?: ExportOptions) => {
    exportAncRegisterToExcel(patients, referrals, options);
    recordAuditLog('PRINT', `ส่งออกทะเบียนฝากครรภ์เป็นไฟล์ Excel (.xlsx) จำนวน ${patients.length} ราย`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        currentUserLabel,
        users,
        login,
        logout,
        isAuthenticated: Boolean(currentUser),
        isAdmin,
        syncState,
        lastSyncedTime,
        syncNowToFirebase,
        patients,
        visits,
        referrals,
        auditLogs,
        selectedPatient,
        setSelectedPatient,
        activeTab,
        setActiveTab,
        isEditPatientModalOpen,
        patientToEdit,
        openEditPatientModal,
        closeEditPatientModal,
        registerFirstAnc,
        updatePatient,
        deletePatient,
        addAncVisit,
        updateAncVisit,
        confirmClinicalRisk,
        createReferral,
        approveReferralByDoctor,
        submitHospitalFeedback,
        updateReferralStatus,
        logFollowUpAction,
        recordAuditLog,
        resetToDefaultData,
        exportExcel
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
