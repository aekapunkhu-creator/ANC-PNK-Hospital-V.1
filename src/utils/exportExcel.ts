import * as XLSX from 'xlsx';
import { Patient, Referral } from '../types';
import { formatThaiDate, calculateGA } from './ancCalculations';
import { PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';

export interface ExportOptions {
  fileName?: string;
  fileNamePrefix?: string;
  sheetTitle?: string;
  subdistrictFilter?: string;
  villageFilter?: string;
  riskFilter?: string;
}

export function exportAncRegisterToExcel(
  patients: Patient[],
  referrals: Referral[] = [],
  options: ExportOptions = {}
): void {
  const wb = XLSX.utils.book_new();

  // 1. Prepare data for Main ANC Register Sheet
  const header = [
    'ลำดับ',
    'HN',
    'เลขประจำตัวประชาชน (CID)',
    'ชื่อ - นามสกุล',
    'อายุ (ปี)',
    'เบอร์โทรศัพท์',
    'เบอร์ติดต่อฉุกเฉิน',
    'ตำบล',
    'หมู่บ้าน',
    'ที่อยู่เต็ม',
    'สิทธิการรักษา',
    'ครรภ์ที่ (G)',
    'คลอด (P)',
    'แท้ง (A)',
    'มีชีวิต (L)',
    'LMP (วันแรกประจำเดือนล่าสุด)',
    'EDC (กำหนดคลอด)',
    'GA แรกรับ (สัปดาห์)',
    'ฝากครรภ์ครั้งแรก <= 12 สัปดาห์',
    'ระดับความเสี่ยง',
    'รายละเอียดความเสี่ยง',
    'แพทย์/จนท. ยืนยันความเสี่ยง',
    'น้ำหนัก (กก.)',
    'ส่วนสูง (ซม.)',
    'BMI (กก./ตร.ม.)',
    'ความดันโลหิต (mmHg)',
    'หมู่เลือด (ABO)',
    'Rh',
    'Hb (g/dL)',
    'Hct (%)',
    'VDRL',
    'HIV',
    'HBsAg',
    'Thalassemia Screen',
    'Urine Albumin',
    'Urine Sugar',
    'ประวัติโรคประจำตัว',
    'ประวัติแพ้ยา',
    'ยาบำรุงที่ได้รับ',
    'จำนวนครั้งที่ตรวจ ANC',
    'ครบ 8 ครั้งตามเกณฑ์',
    'สถานะเคส',
    'วันนัดถัดไป',
    'สถานะขาดนัด',
    'การส่งต่อ รพ.สกลนคร'
  ];

  const rows: (string | number)[][] = [header];

  patients.forEach((p, idx) => {
    // Find referral if any
    const ref = referrals.find(r => r.patientId === p.id);
    let refStatusText = 'ยังไม่ได้ส่งต่อ';
    if (ref) {
      if (ref.status === 'FEEDBACK_RECEIVED') {
        refStatusText = `ได้รับผลตอบกลับแล้ว (${ref.partF?.careStatus === 'RETURN_CARE_TO_PCU' ? 'ส่งกลับดูแลที่ PCU' : 'นัดติดตามที่ รพ.สกลนคร'})`;
      } else if (ref.status === 'APPOINTED') {
        refStatusText = `รพ.สกลนคร นัดตรวจแล้ว (${formatThaiDate(ref.partE.appointmentDate || ref.partF?.nextHospitalAppointmentDate || '')})`;
      } else {
        refStatusText = `ส่งใบส่งต่อไป รพ.สกลนคร แล้ว (${formatThaiDate(ref.createdDate)})`;
      }
    }

    const riskText = 
      p.riskLevel === 'RED' ? '🔴 เสี่ยงสูง (สีแดง)' :
      p.riskLevel === 'YELLOW' ? '🟡 เสี่ยงปานกลาง (สีเหลือง)' : '🟢 ปกติ (สีเขียว)';

    rows.push([
      idx + 1,
      p.hn,
      p.cid,
      p.fullName,
      p.age,
      p.phone,
      p.emergencyContact || '-',
      p.subdistrict,
      p.village,
      p.address,
      p.rights,
      p.gravida,
      p.para,
      p.abortion,
      p.living,
      p.lmp ? formatThaiDate(p.lmp) : '-',
      p.edc ? formatThaiDate(p.edc) : '-',
      p.gaWeeksAtFirstVisit,
      p.isFirstVisitEarly ? 'ใช่ (คุณภาพ)' : 'ไม่ใช่ (>12 สัปดาห์)',
      riskText,
      p.riskReasons.length > 0 ? p.riskReasons.join('; ') : 'ไม่มีภาวะเสี่ยง',
      p.clinicalRiskConfirmed ? 'ยืนยันแล้ว' : 'รอการยืนยันทางคลินิก',
      p.baselineVitals.weight,
      p.baselineVitals.height,
      p.baselineVitals.bmi,
      `${p.baselineVitals.bpSystolic}/${p.baselineVitals.bpDiastolic}`,
      p.baselineLab.bloodGroup,
      p.baselineLab.rh,
      p.baselineLab.hb,
      p.baselineLab.hct,
      p.baselineLab.vdrl,
      p.baselineLab.hiv,
      p.baselineLab.hbsag,
      p.baselineLab.thalassemia,
      p.baselineLab.urineAlbumin,
      p.baselineLab.urineSugar,
      p.medicalHistory.length > 0 ? p.medicalHistory.join(', ') : 'ไม่มี',
      p.drugAllergies || 'ปฏิเสธประวัติแพ้ยา',
      p.currentMedications.join(', '),
      p.totalVisits,
      p.isCompleted8Visits || p.totalVisits >= 8 ? 'ครบ 8 ครั้ง' : 'ยังไม่ครบ',
      p.status === 'ACTIVE' ? 'กำลังติดตามฝากครรภ์' :
      p.status === 'REFERRED' ? 'ส่งต่อ รพ.สกลนคร' :
      p.status === 'DELIVERED' ? 'คลอดแล้ว' : 'ปิดเคส',
      p.nextAppointmentDate ? formatThaiDate(p.nextAppointmentDate) : 'ไม่ได้ระบุ',
      p.isMissedAppointment ? `ขาดนัด (${p.missedAppointmentDays || 0} วัน)` : 'มาตามนัดปกติ',
      refStatusText
    ]);
  });

  const wsRegister = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  wsRegister['!cols'] = [
    { wch: 6 },  // ลำดับ
    { wch: 12 }, // HN
    { wch: 18 }, // CID
    { wch: 22 }, // ชื่อ - นามสกุล
    { wch: 8 },  // อายุ
    { wch: 14 }, // เบอร์โทร
    { wch: 14 }, // เบอร์ฉุกเฉิน
    { wch: 16 }, // ตำบล
    { wch: 24 }, // หมู่บ้าน
    { wch: 30 }, // ที่อยู่
    { wch: 16 }, // สิทธิ์
    { wch: 6 },  // G
    { wch: 6 },  // P
    { wch: 6 },  // A
    { wch: 6 },  // L
    { wch: 14 }, // LMP
    { wch: 14 }, // EDC
    { wch: 10 }, // GA
    { wch: 18 }, // <= 12 wks
    { wch: 20 }, // Risk
    { wch: 35 }, // Risk reasons
    { wch: 16 }, // Clinical confirm
    { wch: 10 }, // Wt
    { wch: 10 }, // Ht
    { wch: 10 }, // BMI
    { wch: 14 }, // BP
    { wch: 10 }, // Blood
    { wch: 8 },  // Rh
    { wch: 8 },  // Hb
    { wch: 8 },  // Hct
    { wch: 12 }, // VDRL
    { wch: 10 }, // HIV
    { wch: 10 }, // HBsAg
    { wch: 16 }, // Thal
    { wch: 12 }, // Urine Alb
    { wch: 12 }, // Urine Sug
    { wch: 24 }, // Medical Hx
    { wch: 20 }, // Allergies
    { wch: 25 }, // Meds
    { wch: 10 }, // Visits
    { wch: 14 }, // 8 visits
    { wch: 18 }, // Status
    { wch: 14 }, // Next appt
    { wch: 16 }, // Missed
    { wch: 35 }, // Ref status
  ];

  XLSX.utils.book_append_sheet(wb, wsRegister, 'ทะเบียนฝากครรภ์ ANC');

  // 2. Prepare Summary Sheet by 5 Subdistricts & 53 Villages
  const summaryHeader = [
    'ตำบล',
    'จำนวนหมู่บ้าน',
    'หญิงตั้งครรภ์ทั้งหมด (คน)',
    'ฝากครรภ์ครั้งแรก <= 12 สัปดาห์ (คน)',
    'เสี่ยงสูง (สีแดง)',
    'เสี่ยงปานกลาง (สีเหลือง)',
    'ปกติ (สีเขียว)',
    'ส่งต่อ รพ.สกลนคร (คน)'
  ];

  const summaryRows: (string | number)[][] = [summaryHeader];

  PHON_NA_KAEO_SUBDISTRICTS.forEach((sub) => {
    const subPatients = patients.filter(p => p.subdistrict === sub.name || p.village.includes(sub.name.replace('ตำบล', 'ต.')));
    const early = subPatients.filter(p => p.isFirstVisitEarly).length;
    const red = subPatients.filter(p => p.riskLevel === 'RED').length;
    const yellow = subPatients.filter(p => p.riskLevel === 'YELLOW').length;
    const green = subPatients.filter(p => p.riskLevel === 'GREEN').length;
    const refCount = subPatients.filter(p => referrals.some(r => r.patientId === p.id)).length;

    summaryRows.push([
      sub.name,
      sub.totalVillages,
      subPatients.length,
      early,
      red,
      yellow,
      green,
      refCount
    ]);
  });

  // Total Row
  const totalPregnant = patients.length;
  const totalEarly = patients.filter(p => p.isFirstVisitEarly).length;
  const totalRed = patients.filter(p => p.riskLevel === 'RED').length;
  const totalYellow = patients.filter(p => p.riskLevel === 'YELLOW').length;
  const totalGreen = patients.filter(p => p.riskLevel === 'GREEN').length;
  const totalReferrals = referrals.length;

  summaryRows.push([
    'รวมทั้งสิ้น (อ.โพนนาแก้ว)',
    53,
    totalPregnant,
    totalEarly,
    totalRed,
    totalYellow,
    totalGreen,
    totalReferrals
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 22 },
    { wch: 26 },
    { wch: 16 },
    { wch: 20 },
    { wch: 14 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปสถิติตำบล 53 หมู่บ้าน');

  // File naming with timestamp
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = options.fileNamePrefix || 'ANC_PCU_PhonNaKaeo_Register';
  const fileName = options.fileName || `${prefix}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Export Dedicated Referral Registry to Excel (.xlsx)
 */
export function exportReferralRegistryToExcel(
  referrals: Referral[],
  patients: Patient[] = [],
  fileName?: string
): void {
  const wb = XLSX.utils.book_new();

  const header = [
    'ลำดับ',
    'เลขที่ใบส่งต่อ',
    'วันที่ส่งต่อ',
    'HN',
    'เลขประจำตัวประชาชน (CID)',
    'ชื่อ - นามสกุล',
    'อายุ (ปี)',
    'เบอร์โทรศัพท์',
    'ตำบล',
    'หมู่บ้าน',
    'สิทธิการรักษา',
    'ครรภ์ที่ (G-P-A-L)',
    'อายุครรภ์ (GA สัปดาห์)',
    'ความดันโลหิต (BP)',
    'อาการสำคัญที่ส่งต่อ (Chief Complaint)',
    'ข้อบ่งชี้การส่งต่อ (Indications)',
    'ระดับความเร่งด่วน',
    'โรงพยาบาลปลายทาง',
    'ช่องทางประสานงาน',
    'ประเภทพาหนะส่งตัว',
    'เจ้าหน้าที่ผู้ประสานงาน',
    'การอนุมัติของแพทย์ PCU',
    'แพทย์ PCU ผู้อนุมัติ',
    'สถานะการส่งต่อ',
    'วันที่ รพ.สกลนคร ตอบกลับ',
    'แพทย์ผู้ตอบกลับ (รพ.สกลนคร)',
    'การวินิจฉัยของ รพ. (Diagnosis)',
    'การตรวจพบทางคลินิก (Findings)',
    'แผนการรักษาของ รพ. (Treatment Plan)',
    'คำแนะนำสำหรับ PCU',
    'วันนัดถัดไปที่ รพ.',
    'สถานะการดูแลต่อ'
  ];

  const rows: (string | number)[][] = [header];

  referrals.forEach((ref, idx) => {
    const pt = patients.find(p => p.id === ref.patientId);
    const urgencyLabel = 
      ref.urgency === 'EMERGENCY' ? '🔴 ฉุกเฉิน' :
      ref.urgency === 'URGENT' ? '🟡 เร่งด่วน' : '🟢 ปกติ (ตามนัด)';

    const statusLabel = 
      ref.status === 'FEEDBACK_RECEIVED' ? 'ได้รับผลตอบกลับแล้ว' :
      ref.status === 'APPOINTED' ? 'นัดตรวจแล้ว' :
      ref.status === 'SENT' ? 'ส่งใบส่งต่อแล้ว (รอตรวจ/รอผล)' :
      ref.status === 'CLOSED' ? 'ปิดเคสเรียบร้อย' :
      ref.status === 'ATTENDED' ? 'ไปตามนัด' :
      ref.status === 'NO_SHOW' ? 'ขาดนัด' : 'ร่างแบบฟอร์ม';

    const doctorApproval = ref.partD?.doctorApproval?.approved
      ? `อนุมัติแล้ว (${ref.partD.doctorApproval.doctorName || ''})`
      : 'รอการอนุมัติ';

    const careStatusLabel = 
      ref.partF?.careStatus === 'RETURN_CARE_TO_PCU' ? 'ส่งกลับดูแลต่อเนื่องที่ PCU' :
      ref.partF?.careStatus === 'OPD_FOLLOWUP' ? 'ติดตามรักษาต่อที่ OPD รพ.สกลนคร' :
      ref.partF?.careStatus === 'ADMITTED' ? 'รับไว้รักษาในโรงพยาบาล (Admit)' :
      ref.partF?.careStatus === 'REFERRED_TERTIARY' ? 'ส่งต่อศูนย์เชี่ยวชาญระดับสูง' : 'ยังไม่มีผล';

    rows.push([
      idx + 1,
      ref.refNumber,
      formatThaiDate(ref.createdDate),
      ref.patientHn,
      ref.partA.cid,
      ref.patientFullName,
      ref.partA.age,
      ref.partA.phone,
      pt?.subdistrict || '',
      ref.partA.village,
      ref.partA.rights,
      ref.partB.gpal,
      ref.partB.gaAtReferralWeeks,
      `${ref.partB.bpSystolic}/${ref.partB.bpDiastolic} mmHg`,
      ref.partB.chiefComplaint,
      (ref.partC?.selectedIndicationsList || []).join('; '),
      urgencyLabel,
      ref.partE.destinationHospital,
      ref.partE.coordinationChannel,
      ref.partE.transportType === 'AMBULANCE' ? 'รถพยาบาล EMS/PCU' :
      ref.partE.transportType === 'PCU_VEHICLE' ? 'รถรับส่ง PCU' : 'เดินทางไปเอง',
      ref.partE.senderStaffName,
      doctorApproval,
      ref.partD?.doctorApproval?.doctorName || '-',
      statusLabel,
      ref.partF?.feedbackDate ? formatThaiDate(ref.partF.feedbackDate) : '-',
      ref.partF?.feedbackDoctor || '-',
      ref.partF?.diagnosis || '-',
      ref.partF?.clinicalFindings || '-',
      ref.partF?.treatmentPlan || '-',
      ref.partF?.recommendationsForPCU || '-',
      ref.partF?.nextHospitalAppointmentDate ? formatThaiDate(ref.partF.nextHospitalAppointmentDate) : '-',
      careStatusLabel
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 10 },
    { wch: 18 },
    { wch: 22 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 28 },
    { wch: 32 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'ทะเบียนส่งต่อ Refer');

  // Summary Sheet
  const summaryHeader = ['ตัวชี้วัด / หัวข้อการส่งต่อ', 'จำนวน (ราย)', 'ร้อยละ (%)'];
  const total = referrals.length || 1;
  const emergencyCount = referrals.filter(r => r.urgency === 'EMERGENCY').length;
  const urgentCount = referrals.filter(r => r.urgency === 'URGENT').length;
  const routineCount = referrals.filter(r => r.urgency === 'ROUTINE').length;
  const feedbackCount = referrals.filter(r => r.status === 'FEEDBACK_RECEIVED').length;
  const returnPcuCount = referrals.filter(r => r.partF?.careStatus === 'RETURN_CARE_TO_PCU').length;
  const continueHospCount = referrals.filter(r => r.partF?.careStatus === 'OPD_FOLLOWUP' || r.partF?.careStatus === 'ADMITTED').length;

  const summaryRows = [
    ['สรุปภาพรวมทะเบียนส่งต่อ ANC PCU รพ.โพนนาแก้ว ⇄ ANC รพ.สกลนคร'],
    [`ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')}`],
    [],
    summaryHeader,
    ['ยอดการส่งต่อทั้งหมด', referrals.length, '100.0%'],
    ['1. ระดับความเร่งด่วน: ฉุกเฉิน (Emergency)', emergencyCount, `${((emergencyCount / total) * 100).toFixed(1)}%`],
    ['2. ระดับความเร่งด่วน: เร่งด่วน (Urgent)', urgentCount, `${((urgentCount / total) * 100).toFixed(1)}%`],
    ['3. ระดับความเร่งด่วน: นัดปกติ (Routine)', routineCount, `${((routineCount / total) * 100).toFixed(1)}%`],
    ['4. ได้รับผลตอบกลับจาก รพ.สกลนคร แล้ว', feedbackCount, `${((feedbackCount / total) * 100).toFixed(1)}%`],
    ['  - ส่งกลับดูแลต่อเนื่องที่ PCU', returnPcuCount, `${((returnPcuCount / total) * 100).toFixed(1)}%`],
    ['  - ติดตามรักษาต่อที่ รพ.สกลนคร', continueHospCount, `${((continueHospCount / total) * 100).toFixed(1)}%`],
    ['5. รอผลการตรวจหรือตอบกลับจาก รพ.สกลนคร', referrals.length - feedbackCount, `${(((referrals.length - feedbackCount) / total) * 100).toFixed(1)}%`]
  ];

  const wsSum = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSum['!cols'] = [{ wch: 45 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsSum, 'สรุปผลการส่งต่อ');

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const outName = fileName || `ANC_Referral_Registry_PhonNaKaeo_${dateStr}.xlsx`;
  XLSX.writeFile(wb, outName);
}
