import { RiskLevel } from '../types';

/**
 * Calculates Estimated Date of Confinement (EDC) from Last Menstrual Period (LMP)
 * Using Naegele's rule: +7 days, -3 months, +1 year
 */
export function calculateEDC(lmpDateString: string): string {
  if (!lmpDateString) return '';
  const lmp = new Date(lmpDateString);
  if (isNaN(lmp.getTime())) return '';

  const edc = new Date(lmp);
  edc.setDate(edc.getDate() + 7);
  edc.setMonth(edc.getMonth() - 3);
  edc.setFullYear(edc.getFullYear() + 1);

  return edc.toISOString().split('T')[0];
}

/**
 * Calculates Gestational Age (GA) in weeks and days from LMP
 */
export function calculateGA(lmpDateString: string, targetDate: Date = new Date()): { weeks: number; days: number; text: string } {
  if (!lmpDateString) return { weeks: 0, days: 0, text: '-' };
  const lmp = new Date(lmpDateString);
  if (isNaN(lmp.getTime())) return { weeks: 0, days: 0, text: '-' };

  const diffTime = targetDate.getTime() - lmp.getTime();
  if (diffTime < 0) return { weeks: 0, days: 0, text: '0 สัปดาห์' };

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;

  return {
    weeks,
    days,
    text: days > 0 ? `${weeks} สัปดาห์ ${days} วัน` : `${weeks} สัปดาห์`
  };
}

/**
 * Formats date into Thai format (พ.ศ.)
 */
export function formatThaiDate(dateString?: string, includeTime = false): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const monthsThai = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const day = d.getDate();
    const month = monthsThai[d.getMonth()];
    const yearBE = d.getFullYear() + 543;

    if (includeTime) {
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${yearBE} ${hours}:${mins} น.`;
    }

    return `${day} ${month} ${yearBE}`;
  } catch {
    return dateString;
  }
}

/**
 * Calculates BMI
 */
export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; interpretation: string } {
  if (!weightKg || !heightCm || heightCm <= 0) return { bmi: 0, interpretation: '-' };
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  let interpretation = 'น้ำหนักปกติ';
  if (bmi < 18.5) interpretation = 'น้ำหนักน้อยกว่าเกณฑ์';
  else if (bmi >= 23 && bmi < 25) interpretation = 'น้ำหนักเกิน (ท้วม)';
  else if (bmi >= 25 && bmi < 30) interpretation = 'อ้วนระดับ 1';
  else if (bmi >= 30) interpretation = 'อ้วนระดับ 2 (เสี่ยงสูง)';

  return { bmi, interpretation };
}

/**
 * Masks Sensitive Personal Identifiable Information (CID / Phone) for Executive view
 */
export function maskCID(cid: string): string {
  if (!cid) return '-';
  const clean = cid.replace(/\D/g, '');
  if (clean.length === 13) {
    // 1-4709-XXXXX-XX-X
    return `${clean[0]}-${clean.slice(1, 5)}-XXXXX-${clean.slice(10, 12)}-${clean[12]}`;
  }
  return cid.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
}

export function maskPhone(phone: string): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-XXX-${clean.slice(6)}`;
  }
  return phone;
}

/**
 * Automated Risk Evaluation according to Thai Pink Book 2568 & MOPH ANC standard
 */
export interface RiskCheckInput {
  age: number;
  bpSystolic: number;
  bpDiastolic: number;
  urineProtein?: string;
  hb?: number;
  medicalHistory?: string[];
  symptoms?: string[];
  gravida?: number;
  bmi?: number;
  rh?: string;
  gaWeeks?: number;
}

export function evaluateRisk(input: RiskCheckInput): { level: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  let level: RiskLevel = 'GREEN';

  // RED FLAGS (Emergency / Severe)
  const isSevereHT = input.bpSystolic >= 160 || input.bpDiastolic >= 110;
  const isPreEclampsia = (input.bpSystolic >= 140 || input.bpDiastolic >= 90) && 
    (input.urineProtein === '1+' || input.urineProtein === '2+' || input.urineProtein === '3+');
  const hasBleeding = input.symptoms?.some(s => s.includes('เลือดออก') || s.includes('bleeding'));
  const hasSevereHeadache = input.symptoms?.some(s => s.includes('ปวดศีรษะตาพร่ามัว') || s.includes('จุกแน่นลิ้นปี่'));
  const hasSevereAnemia = typeof input.hb === 'number' && input.hb > 0 && input.hb < 8;
  const isPostTerm = typeof input.gaWeeks === 'number' && input.gaWeeks >= 41;

  if (isSevereHT) reasons.push('ความดันโลหิตสูงรุนแรง (Severe HT ≥ 160/110 mmHg)');
  if (isPreEclampsia) reasons.push('สงสัยภาวะครรภ์เป็นพิษ (Preeclampsia: BP ≥ 140/90 + Proteinuria)');
  if (hasBleeding) reasons.push('มีเลือดออกทางช่องคลอดผิดปกติ');
  if (hasSevereHeadache) reasons.push('อาการนำครรภ์เป็นพิษ (ปวดศีรษะรุนแรง/ตาพร่ามัว/จุกแน่นลิ้นปี่)');
  if (hasSevereAnemia) reasons.push('โลหิตจางรุนแรง (Hb < 8 g/dL)');
  if (isPostTerm) reasons.push('ตั้งครรภ์เกินกำหนด (GA ≥ 41 สัปดาห์)');

  if (reasons.length > 0) {
    return { level: 'RED', reasons };
  }

  // YELLOW FLAGS (High Risk / Needs Close Monitoring & Specialist Consult)
  if (input.age < 20) reasons.push('มารดาวัยรุ่น (อายุ < 20 ปี)');
  if (input.age >= 35) reasons.push('มารดาตั้งครรภ์อายุมาก (Elderly Gravida ≥ 35 ปี)');
  if (input.bpSystolic >= 140 || input.bpDiastolic >= 90) reasons.push('ความดันโลหิตสูง (BP ≥ 140/90 mmHg)');
  if (input.bmi && input.bmi >= 30) reasons.push('ภาวะอ้วนระดับ 2 (BMI ≥ 30 kg/m²)');
  if (input.bmi && input.bmi < 18.5) reasons.push('ภาวะน้ำหนักน้อยกว่าเกณฑ์ (BMI < 18.5 kg/m²)');
  if (typeof input.hb === 'number' && input.hb >= 8 && input.hb < 11) reasons.push('ภาวะโลหิตจาง (Hb 8 - 10.9 g/dL)');
  if (input.rh && input.rh.toLowerCase().includes('neg')) reasons.push('หมู่เลือดพิเศษ Rh Negative');

  if (input.medicalHistory && input.medicalHistory.length > 0) {
    for (const h of input.medicalHistory) {
      if (h.includes('ผ่าตัดคลอด') || h.includes('C/S')) reasons.push('มีประวัติผ่าตัดคลอดครรภ์ก่อน (Previous C/S)');
      if (h.includes('เบาหวาน') || h.includes('DM')) reasons.push('โรคเบาหวาน / เบาหวานขณะตั้งครรภ์ (GDM)');
      if (h.includes('ไทรอยด์')) reasons.push('โรคต่อมไทรอยด์');
      if (h.includes('แท้ง') || h.includes('ตายคลอด')) reasons.push('มีประวัติแท้งซ้ำหรือทารกเสียชีวิตในครรภ์');
      if (h.includes('หัวใจ')) reasons.push('โรคหัวใจขณะตั้งครรภ์');
    }
  }

  if (reasons.length > 0) {
    level = 'YELLOW';
  }

  return { level, reasons };
}
