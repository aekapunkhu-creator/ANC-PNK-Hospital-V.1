import React from 'react';
import { 
  Printer, 
  X, 
  Building2, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  FileText 
} from 'lucide-react';
import { Referral } from '../types';
import { formatThaiDate } from '../utils/ancCalculations';

interface ReferralSlipModalProps {
  referral: Referral;
  onClose: () => void;
}

export const ReferralSlipModal: React.FC<ReferralSlipModalProps> = ({ referral, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[95vh] flex flex-col">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm">
              ใบส่งต่อการดูแลฝากครรภ์ต่อเนื่อง (เลขที่: {referral.refNumber})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบส่งต่อ (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Slip Area */}
        <div className="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible text-slate-800 text-xs">
          <div className="border border-slate-300 print-shadow-none p-6 sm:p-8 rounded-xl space-y-5 bg-white">
            
            {/* Header / Logo */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-teal-700 flex flex-col items-center justify-center text-teal-800 font-bold leading-none p-1 text-center">
                  <Building2 className="w-6 h-6 mb-0.5" />
                  <span className="text-3xs font-extrabold">MOPH</span>
                </div>
                <div>
                  <div className="text-3xs text-slate-500 font-semibold uppercase">
                    แบบฟอร์มส่งต่อการดูแลสุขภาพแม่และเด็ก (ANC Referral Form)
                  </div>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    ใบส่งต่อผู้ป่วยฝากครรภ์: PCU รพ.โพนนาแก้ว ⇄ ANC รพ.สกลนคร
                  </h1>
                  <p className="text-3xs text-slate-600">
                    กลุ่มงานเวชปฏิบัติครอบครัวและบริการปฐมภูมิ โรงพยาบาลโพนนาแก้ว อำเภอโพนนาแก้ว จังหวัดสกลนคร
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="w-16 h-16 border border-slate-300 rounded p-1 flex items-center justify-center bg-slate-50">
                  <QrCode className="w-14 h-14 text-slate-800" />
                </div>
                <div className="font-mono text-3xs font-bold text-slate-900 mt-1">
                  {referral.refNumber}
                </div>
                <span className={`mt-1 text-3xs font-bold px-2 py-0.5 rounded-full uppercase ${
                  referral.urgency === 'EMERGENCY'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {referral.urgency === 'EMERGENCY' ? '🔴 ฉุกเฉิน (Emergency)' : referral.urgency === 'URGENT' ? '🟡 เร่งด่วน (Urgent)' : '🟢 นัดหมายทั่วไป'}
                </span>
              </div>
            </div>

            {/* Section A: Patient Info */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded text-xs uppercase tracking-wide border-l-4 border-teal-600">
                ส่วน A: ข้อมูลผู้รับบริการ (Patient Demographics)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>ชื่อ-สกุล: <strong>{referral.partA.fullName}</strong></div>
                <div>HN: <strong className="font-mono">{referral.partA.hn}</strong></div>
                <div>CID: <strong className="font-mono">{referral.partA.cid}</strong></div>
                <div>อายุ: <strong>{referral.partA.age} ปี</strong></div>
                <div>โทรศัพท์: <strong>{referral.partA.phone}</strong></div>
                <div>สิทธิการรักษา: <strong>{referral.partA.rights}</strong></div>
                <div className="col-span-2">ที่อยู่: <strong>{referral.partA.address} {referral.partA.village}</strong></div>
              </div>
            </div>

            {/* Section B: Current Pregnancy */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded text-xs uppercase tracking-wide border-l-4 border-teal-600">
                ส่วน B: ข้อมูลครรภ์ปัจจุบัน (Current Pregnancy Status)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>ครรภ์ที่: <strong>{referral.partB.gpal}</strong></div>
                <div>LMP: <strong>{formatThaiDate(referral.partB.lmp)}</strong></div>
                <div>EDC: <strong>{formatThaiDate(referral.partB.edc)}</strong></div>
                <div>GA ณ วันส่งต่อ: <strong className="text-teal-800">{referral.partB.gaAtReferralWeeks} สัปดาห์</strong></div>
                <div>น้ำหนัก: <strong>{referral.partB.weight} กก.</strong></div>
                <div>ความดันโลหิต (BP): <strong className={referral.partB.bpSystolic >= 140 ? 'text-rose-700 font-bold' : ''}>{referral.partB.bpSystolic}/{referral.partB.bpDiastolic} mmHg</strong></div>
                <div className="col-span-2">ยาที่ได้รับ: <strong>{referral.partB.currentMeds || 'ไม่มี'}</strong></div>
                <div className="col-span-2 sm:col-span-4 bg-teal-50/60 p-2 rounded border border-teal-200">
                  <span className="font-semibold text-slate-700">อาการสำคัญและเหตุผลที่มาตรวจ (Chief Complaint):</span>
                  <div className="font-bold text-slate-900 mt-0.5">{referral.partB.chiefComplaint}</div>
                </div>
              </div>
            </div>

            {/* Section C: Indications for Referral */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded text-xs uppercase tracking-wide border-l-4 border-teal-600">
                ส่วน C: ข้อบ่งชี้การส่งต่อไปยัง ANC รพ.สกลนคร
              </div>
              <div className="pt-1 flex flex-wrap gap-2">
                {referral.partC.selectedIndicationsList.map((ind, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-3xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-700" />
                    <span>{ind}</span>
                  </span>
                ))}
              </div>
              {referral.partC.otherDetail && (
                <div className="text-3xs text-slate-600 pt-1">
                  รายละเอียดเพิ่มเติม: <strong>{referral.partC.otherDetail}</strong>
                </div>
              )}
            </div>

            {/* Section D: Clinical Treatment & Latest Lab */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded text-xs uppercase tracking-wide border-l-4 border-teal-600">
                ส่วน D: ข้อมูลสำคัญเพื่อการรักษาและการดูแลเบื้องต้น
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>ประวัติแพ้ยา: <strong className="text-rose-700 font-bold">{referral.partD.drugAllergies}</strong></div>
                <div>โรคประจำตัวเดิม: <strong>{referral.partD.medicalHistory || 'ไม่มี'}</strong></div>
                <div>ประวัติการผ่าตัด/ผ่าคลอด: <strong>{referral.partD.surgicalHistory || 'ไม่มี'}</strong></div>
                <div>ผลแล็บล่าสุด: <strong>{referral.partD.latestLabSummary}</strong></div>
                <div className="col-span-1 sm:col-span-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">การรักษาเบื้องต้นที่ให้แล้ว ณ PCU:</span>
                  <div className="font-medium text-slate-900 mt-0.5">{referral.partD.initialTreatmentProvided}</div>
                </div>
              </div>
            </div>

            {/* Section E: Coordination & Approval */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded text-xs uppercase tracking-wide border-l-4 border-teal-600">
                ส่วน E: การประสานงานและการส่งตัว
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <div>หน่วยรับบริการ: <strong className="text-teal-800">{referral.partE.destinationHospital}</strong></div>
                <div>วัน-เวลานัดหมาย: <strong>{formatThaiDate(referral.partE.appointmentDate)} เวลา {referral.partE.appointmentTime || '09:00'} น.</strong></div>
                <div>ช่องทางส่งต่อ: <strong>{referral.partE.coordinationChannel}</strong></div>
                <div>พาหนะส่งต่อ: <strong>{referral.partE.transportType === 'AMBULANCE' ? 'รถพยาบาลฉุกเฉิน (EMS Ambulance)' : 'เดินทางไปเอง'}</strong></div>
                <div>เจ้าหน้าที่ผู้ประสานงาน: <strong>{referral.partE.senderStaffName}</strong></div>
                <div>โทรศัพท์ PCU โพนนาแก้ว: <strong>{referral.partE.pcuContactTel}</strong></div>
              </div>
            </div>

            {/* Signatures Row */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-300">
              <div className="text-center space-y-6">
                <div className="text-3xs text-slate-500">ลงชื่อเจ้าหน้าที่ผู้ส่งต่อ (พยาบาล/จนท. ANC PCU)</div>
                <div className="border-b border-dotted border-slate-400 w-48 mx-auto"></div>
                <div className="text-xs font-semibold text-slate-800">
                  ({referral.partE.senderStaffName})
                </div>
              </div>

              <div className="text-center space-y-6">
                <div className="text-3xs text-slate-500">ลงชื่อแพทย์/ผู้รับผิดชอบ PCU ผู้อนุมัติการส่งต่อ</div>
                <div className="border-b border-dotted border-slate-400 w-48 mx-auto"></div>
                <div className="text-xs font-semibold text-slate-800">
                  ({referral.partD.doctorApproval?.doctorName || '...................................................'})
                </div>
              </div>
            </div>

            {/* Section F: Feedback from Sakon Nakhon Hospital */}
            <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-300 space-y-2">
              <div className="font-bold text-slate-900 bg-sky-50 px-2.5 py-1 rounded text-xs uppercase tracking-wide border-l-4 border-sky-600">
                ส่วน F: ผลตอบกลับจาก ANC รพ.สกลนคร (Reply & Clinical Recommendations)
              </div>

              {referral.partF ? (
                <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-200 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>วันที่รับตัว: <strong>{formatThaiDate(referral.partF.receivedDate)}</strong></div>
                    <div>การวินิจฉัย (Diagnosis): <strong className="text-sky-900 font-bold">{referral.partF.diagnosis}</strong></div>
                  </div>
                  <div>
                    <span className="text-slate-600">ผลการตรวจทางคลินิก:</span>
                    <div className="font-medium text-slate-800 mt-0.5">{referral.partF.clinicalFindings}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">แผนการรักษา (Treatment Plan):</span>
                    <div className="font-medium text-slate-800 mt-0.5 whitespace-pre-line">{referral.partF.treatmentPlan}</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-sky-200">
                    <span className="font-bold text-teal-800">ข้อเสนอแนะให้ PCU โพนนาแก้ว ดูแลต่อเนื่อง:</span>
                    <div className="font-medium text-slate-900 mt-0.5">{referral.partF.recommendationsForPCU}</div>
                  </div>
                  <div className="text-right text-3xs text-slate-500 pt-1">
                    ผู้ให้ผลตอบกลับ: <strong>{referral.partF.feedbackDoctor || referral.partF.receiverName}</strong> ({formatThaiDate(referral.partF.feedbackDate)})
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-3xs">
                  [ อยู่ระหว่างรอรับการตรวจและบันทึกผลตอบกลับจากสูติแพทย์/ANC รพ.สกลนคร ]
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-3xs text-slate-500">
            ระบบส่งต่อไร้รอยต่อ PCU รพ.โพนนาแก้ว ⇄ รพ.สกลนคร | เอกสารนี้ใช้เฉพาะเพื่อการรักษาพยาบาล
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
