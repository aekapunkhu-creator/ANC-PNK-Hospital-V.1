import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Patient, Referral, AuditLogItem, AppUser } from './types';
import { INITIAL_USERS } from './data/users';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const PATIENTS_COLLECTION = 'anc_patients';
export const REFERRALS_COLLECTION = 'anc_referrals';
export const AUDIT_LOGS_COLLECTION = 'anc_audit_logs';
export const USERS_COLLECTION = 'anc_users';

/**
 * Real-time listener for patients
 */
export function subscribeToPatients(
  onData: (patients: Patient[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, PATIENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Patient[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Patient);
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore patients subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for referrals
 */
export function subscribeToReferrals(
  onData: (referrals: Referral[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, REFERRALS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Referral[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Referral);
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore referrals subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for audit logs
 */
export function subscribeToAuditLogs(
  onData: (logs: AuditLogItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, AUDIT_LOGS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: AuditLogItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AuditLogItem);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(items);
    },
    (error) => {
      console.warn('Firestore audit logs subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for users
 */
export function subscribeToUsers(
  onData: (users: AppUser[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AppUser);
      });
      if (items.length > 0) {
        onData(items);
      } else {
        onData(INITIAL_USERS);
      }
    },
    (error) => {
      console.warn('Firestore users subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update single patient
 */
export async function savePatientToFirestore(patient: Patient): Promise<void> {
  const docRef = doc(db, PATIENTS_COLLECTION, patient.id);
  await setDoc(docRef, patient, { merge: true });
}

/**
 * Delete patient
 */
export async function deletePatientFromFirestore(patientId: string): Promise<void> {
  const docRef = doc(db, PATIENTS_COLLECTION, patientId);
  await deleteDoc(docRef);
}

/**
 * Save or update single referral
 */
export async function saveReferralToFirestore(referral: Referral): Promise<void> {
  const docRef = doc(db, REFERRALS_COLLECTION, referral.id);
  await setDoc(docRef, referral, { merge: true });
}

/**
 * Add audit log
 */
export async function addAuditLogToFirestore(log: AuditLogItem): Promise<void> {
  const docRef = doc(db, AUDIT_LOGS_COLLECTION, log.id);
  await setDoc(docRef, log);
}

/**
 * Save or update user
 */
export async function saveUserToFirestore(user: AppUser): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, user.username);
  await setDoc(docRef, user, { merge: true });
}

/**
 * Initial Seeder: If Firestore is empty, seed initial patients, referrals, logs, and users
 */
export async function seedInitialFirestoreData(
  initialPatients: Patient[],
  initialReferrals: Referral[],
  initialAuditLogs: AuditLogItem[]
): Promise<boolean> {
  try {
    const patientsSnap = await getDocs(collection(db, PATIENTS_COLLECTION));
    if (patientsSnap.empty) {
      console.log('Seeding initial data to Firestore...');
      const batch = writeBatch(db);

      // Seed Users
      for (const user of INITIAL_USERS) {
        const userRef = doc(db, USERS_COLLECTION, user.username);
        batch.set(userRef, user);
      }

      // Seed Patients
      for (const p of initialPatients) {
        const pRef = doc(db, PATIENTS_COLLECTION, p.id);
        batch.set(pRef, p);
      }

      // Seed Referrals
      for (const r of initialReferrals) {
        const rRef = doc(db, REFERRALS_COLLECTION, r.id);
        batch.set(rRef, r);
      }

      // Seed Audit logs
      for (const log of initialAuditLogs) {
        const logRef = doc(db, AUDIT_LOGS_COLLECTION, log.id);
        batch.set(logRef, log);
      }

      await batch.commit();
      console.log('Firestore seeding completed successfully.');
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error seeding Firestore initial data:', err);
    return false;
  }
}
