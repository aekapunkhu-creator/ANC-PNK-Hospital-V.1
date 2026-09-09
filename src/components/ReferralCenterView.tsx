import React, { useState } from 'react';
import { 
  Share2, 
  Plus, 
  Eye, 
  Printer, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  ShieldCheck, 
  Building2, 
  FileText,
  UserCheck,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Referral, ReferralStatus, ReferralUrgency, Patient } from '../types';
import { calculateGA, formatThaiDate } from '../utils/ancCalculations';
import { REFERRAL_INDICATIONS } from '../data/mockData';
import { ReferralSlipModal } from './ReferralSlipModal';

export const ReferralCenterView: React.FC = () => {
  const { 
    referrals, 
    patients, 
    selectedPatient, 
    setSelectedPatient, 
    createReferral, 
    addReferralFeedback, 
    approveReferral, 
    currentRole,
    currentUserLabel 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSlip, setSelectedSlip] = useState<Referral | null>(null);

  // Feedback form state
  const [feedbackReferral, setFeedbackReferral] = useState<Referral | null>(null);
  const [feedbackDiagnosis, setFeedbackDiagnosis] = useState('');
  const [feedbackFindings, setFeedbackFindings] = useState('');
  const [feedbackPlan, setFeedbackPlan] = useState('');
  const [feedbackRecs, setFeedbackRecs] = useState('');
  const [feedbackDoctor, setFeedbackDoctor] = useState(
    currentRole === 'anc_sakonnakhon' ? 'พญ.นภาภรณ์ (สูติแพทย์ รพ.สกลนคร)' : 'สูติแพทย์ รพ.สกลนคร'
  );

  // Referral Creation Form State
  const defaultPatient = selectedPatient || patients[0];
  const [chosenPatientId, setChosenPatientId] = useState<string>(defaultPatient ? defaultPatient.id : '');

  const chosenPatient: Patient | undefined = patients.find(p => p.id === chosenPatientId) || defaultPatient;
  const patientGA = chosenPatient ? calculateGA(chosenPatient.lmp).weeks : 28;

  const [urgency, setUrgency] = useState<ReferralUrgency>(
    chosenPatient?.riskLevel === 'RED' ? 'EMERGENCY' : 'URGENT'
  );
  const [chiefComplaint, setChiefComplaint] = useState(
    chosenPatient?.riskReasons.join(', ') || 'ความดันโลหิตสูงขณะตั้งครรภ์ ขอส่งต่อเพื่อตรวจประเมินภาวะครรภ์เป็นพิษ'
  );
  const [selectedIndications, setSelectedIndications] = useState<string[]>([
    chosenPatient?.riskLevel === 'RED' ? 'ภาวะเสี่ยงสูงมาก (ครรภ์เป็นพิษ/ความดันโลหิตสูง)' : 'ขอคำปรึกษาและการตรวจพิเศษโดยสูติแพทย์'
  ]);
  const [otherIndication, setOtherIndication] = useState('');
  const [initialTreatment, setInitialTreatment] = useState('ให้พักผ่อน จัดท่าตะแคงซ้าย วัดความดันซ้ำ งดอาหารเค็ม และประสานรถพยาบาล');
  const [appointmentDate, setAppointmentDate] = useState('2026-09-09');
  const [appointmentTime, setAppointmentTime] = useState('09:30');
  const [coordinationChannel, setCoordinationChannel] = useState<'ONLINE_SYSTEM' | 'TELEPHONE' | 'BOTH'>('BOTH');
  const [transportType, setTransportType] = useState<'AMBULANCE' | 'SELF_TRAVEL'>('AMBULANCE');

  const handleToggleIndication = (ind: string) => {
    setSelectedIndications(prev => 
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    );
  };

  const handleCreateReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenPatient) return;

    const newRef = createReferral({
      patientId: chosenPatient.id,
      urgency,
      partA: {
        fullName: chosenPatient.fullName,
        hn: chosenPatient.hn,
        cid: chosenPatient.cid,
        age: chosenPatient.age,
        phone: chosenPatient.phone,
        rights: chosenPatient.rights,
        address: chosenPatient.address,
        village: chosenPatient.village
      },
      partB: {
        gpal: `G${chosenPatient.gravida} P${chosenPatient.para} A${chosenPatient.abortion} L${chosenPatient.living}`,
        lmp: chosenPatient.lmp,
        edc: chosenPatient.edc,
        gaAtReferralWeeks: patientGA,
        weight: chosenPatient.baselineVitals.weight + 3,
        bpSystolic: chosenPatient.baselineVitals.bpSystolic,
        bpDiastolic: chosenPatient.baselineVitals.bpDiastolic,
        chiefComplaint,
        currentMeds: chosenPatient.currentMedications.join(', ')
      },
      partC: {
        selectedIndicationsList: selectedIndications,
        otherDetail: otherIndication
      },
      partD: {
        drugAllergies: chosenPatient.drugAllergies,
        medicalHistory: chosenPatient.medicalHistory.join(', '),
        surgicalHistory: chosenPatient.medicalHistory.includes('Previous C/S') ? 'เคยผ่าตัดคลอด' : 'ปฏิเสธประวัติผ่าตัด',
        latestLabSummary: `Hb ${chosenPatient.baselineLab.hb} g/dL, Albumin ${chosenPatient.baselineLab.urineAlbumin}, Blood ${chosenPatient.baselineLab.bloodGroup} Rh ${chosenPatient.baselineLab.rh}`,
        initialTreatmentProvided: initialTreatment,
        doctorApproval: currentRole === 'doctor_pcu' ? {
          isApproved: true,
          doctorName: currentUserLabel,
          approvalDate: new Date().toISOString().replace('T', ' ').slice(0, 16)
        } : undefined
      },
      partE: {
        destinationHospital: 'ANC โรงพยาบาลสกลนคร',
        appointmentDate,
        appointmentTime,
        coordinationChannel: coordinationChannel === 'BOTH' ? 'โทรศัพท์ประสานงานพร้อมระบบ e-Referral' : coordinationChannel,
        senderStaffName: currentUserLabel,
        pcuContactTel: '042-761-123 ต่อ 104 (ANC PCU โพนนาแก้ว)',
        transportType
      }
    });

    alert(`สร้างใบส่งต่อไปยัง ANC รพ.สกลนคร สำเร็จ!\nเลขที่ใบส่งต่อ: ${newRef.refNumber}`);
    setActiveTab('LIST');
  };

  const handleSaveFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackReferral) return;

    addReferralFeedback(feedbackReferral.id, {
      receivedDate: new Date().toISOString().slice(0, 10),
      receiverName: currentUserLabel,
      diagnosis: feedbackDiagnosis,
      clinicalFindings: feedbackFindings,
      treatmentPlan: feedbackPlan,
      recommendationsForPCU: feedbackRecs,
      feedbackDoctor: feedbackDoctor,
      feedbackDate: new Date().toISOString().slice(0, 10)
    });

    alert('บันทึกผลการตอบกลับจาก รพ.สกลนคร เรียบร้อยแล้ว!');
    setFeedbackReferral(null);
  };

  const filteredReferrals = statusFilter === 'ALL'
    ? referrals
    : referrals.filter(r => r.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-700 font-bold shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                ศูนย์ส่งต่อและผลตอบกลับ (ANC Referral & Feedback Center)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เครือข่ายบริการปฐมภูมิ PCU รพ.โพนนาแก้ว ⇄ คลินิก ANC รพ.สกลนคร
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'LIST'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              รายการส่งต่อ ({referrals.length})
            </button>

            {currentRole !== 'executive_pcu' && currentRole !== 'anc_sakonnakhon' && (
              <button
                onClick={() => setActiveTab('CREATE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'CREATE'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ออกใบส่งต่อใหม่</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW: CREATE NEW REFERRAL (WIZARD) */}
      {activeTab === 'CREATE' && (
        <form onSubmit={handleCreateReferralSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                สร้างใบส่งต่อผู้ป่วยฝากครรภ์ (PCU โพนนาแก้ว → รพ.สกลนคร)
              </h3>
              <p className="text-xs text-slate-500">
                กรอกข้อมูลตามโครงสร้างมาตรฐานแบบฟอร์มส่งต่อ (ส่วน A ถึง ส่วน E)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              กลับหน้ารายการ
            </button>
          </div>

          {/* Patient Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800">
                เลือกหญิงตั้งครรภ์ที่ต้องการส่งต่อ:
              </label>
              <select
                value={chosenPatientId}
                onChange={(e) => setChosenPatientId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (HN: {p.hn} | {p.riskLevel} | GA: {calculateGA(p.lmp).text})
                  </option>
                ))}
              </select>
            </div>

            {chosenPatient && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                <div>ชื่อ-สกุล: <strong>{chosenPatient.fullName}</strong></div>
                <div>HN: <strong className="font-mono">{chosenPatient.hn}</strong></div>
                <div>อายุ: <strong>{chosenPatient.age} ปี</strong></div>
                <div>สิทธิ: <strong>{chosenPatient.rights}</strong></div>
                <div>ครรภ์ที่: <strong>G{chosenPatient.gravida} P{chosenPatient.para}</strong></div>
                <div>GA: <strong className="text-teal-700">{patientGA} สัปดาห์</strong></div>
                <div>ระดับความเสี่ยง: <strong className={chosenPatient.riskLevel === 'RED' ? 'text-rose-700' : 'text-amber-700'}>{chosenPatient.riskLevel}</strong></div>
                <div>หมู่บ้าน: <strong>{chosenPatient.village}</strong></div>
              </div>
            )}
          </div>

          {/* Urgency selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              ระดับความเร่งด่วนของการส่งต่อ (Urgency):
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setUrgency('EMERGENCY')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  urgency === 'EMERGENCY'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold ring-2 ring-rose-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm">🔴 ฉุกเฉิน (Emergency)</div>
                <div className="text-3xs text-rose-600 mt-0.5">สงสัยครรภ์เป็นพิษรุนแรง/เลือดออก/น้ำเดิน</div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('URGENT')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  urgency === 'URGENT'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm">🟡 เร่งด่วน (Urgent)</div>
                <div className="text-3xs text-amber-700 mt-0.5">พบความดันสูง/โลหิตจางรุนแรง/ตรวจภายใน 24-48 ชม.</div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('NORMAL')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  urgency === 'NORMAL'
                    ? 'bg-teal-50 border-teal-400 text-teal-800 font-bold ring-2 ring-teal-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm">🟢 นัดหมายทั่วไป (Elective)</div>
                <div className="text-3xs text-teal-700 mt-0.5">นัดตรวจพิเศษ/อัลตราซาวด์ตามรอบ</div>
              </button>
            </div>
          </div>

          {/* Section B: Chief Complaint */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              ส่วน B: อาการสำคัญและเหตุผลที่ส่งต่อ (Chief Complaint & History) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="ระบุอาการสำคัญ เช่น หญิงตั้งครรภ์ GA 32 สัปดาห์ ตรวจพบความดัน 150/95 mmHg บวม 2+ ปวดศีรษะเล็กน้อย"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          {/* Section C: Indications Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              ส่วน C: ข้อบ่งชี้การส่งต่อ (เลือกได้หลายข้อ):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {REFERRAL_INDICATIONS.map(ind => (
                <label key={ind} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedIndications.includes(ind)}
                    onChange={() => handleToggleIndication(ind)}
                    className="rounded text-sky-600"
                  />
                  <span className="text-slate-800">{ind}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              placeholder="ข้อบ่งชี้หรือรายละเอียดอื่น ๆ เพิ่มเติม (ถ้ามี)..."
              value={otherIndication}
              onChange={(e) => setOtherIndication(e.target.value)}
              className="mt-2 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          {/* Section D: Initial Treatment */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              ส่วน D: การรักษาเบื้องต้นที่ให้แล้ว ณ PCU โพนนาแก้ว
            </label>
            <input
              type="text"
              value={initialTreatment}
              onChange={(e) => setInitialTreatment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          {/* Section E: Coordination details */}
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200 space-y-3">
            <div className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-700" />
              <span>ส่วน E: การประสานงานและการนัดหมายส่งตัว</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันที่นัดหมาย</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เวลานัดหมาย</label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ช่องทางส่งต่อ</label>
                <select
                  value={coordinationChannel}
                  onChange={(e) => setCoordinationChannel(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="BOTH">ระบบ e-Referral + โทรศัพท์</option>
                  <option value="TELEPHONE">โทรประสานห้องคลอด/ANC ด่วน</option>
                  <option value="ONLINE_SYSTEM">ส่งผ่านระบบออนไลน์</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">พาหนะเดินทาง</label>
                <select
                  value={transportType}
                  onChange={(e) => setTransportType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="AMBULANCE">รถพยาบาลฉุกเฉิน (Ambulance)</option>
                  <option value="SELF_TRAVEL">เดินทางไปเอง (มีญาติดูแล)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่งข้อมูลไปยัง ANC รพ.สกลนคร</span>
            </button>
          </div>
        </form>
      )}

      {/* VIEW: REFERRAL LIST */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700">กรองสถานะการส่งต่อ:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">ทุกสถานะ ({referrals.length})</option>
                <option value="PENDING_APPROVAL">รอแพทย์ PCU อนุมัติ</option>
                <option value="SENT">ส่งออกแล้ว (รอปลายทางรับตัว)</option>
                <option value="RECEIVED">รพ.สกลนคร รับตัวแล้ว</option>
                <option value="FEEDBACK_RECEIVED">ได้รับผลตอบกลับแล้ว</option>
                <option value="COMPLETED">เสร็จสิ้นกระบวนการ</option>
              </select>
            </div>

            <div className="text-slate-500">
              กำลังแสดง {filteredReferrals.length} จาก {referrals.length} รายการ
            </div>
          </div>

          {/* Referral Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredReferrals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                ไม่พบรายการส่งต่อตามเงื่อนไขที่เลือก
              </div>
            ) : (
              filteredReferrals.map((ref) => {
                const isEmergency = ref.urgency === 'EMERGENCY';
                const hasFeedback = !!ref.partF;

                return (
                  <div
                    key={ref.id}
                    className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all space-y-4 ${
                      isEmergency ? 'border-rose-200' : 'border-slate-200'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-800">
                          {ref.refNumber}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase ${
                            isEmergency
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : ref.urgency === 'URGENT'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {isEmergency ? '🔴 ฉุกเฉิน (Emergency)' : ref.urgency === 'URGENT' ? '🟡 เร่งด่วน' : '🟢 ทั่วไป'}
                        </span>

                        <span className="text-3xs text-slate-400">
                          ส่งเมื่อ: {formatThaiDate(ref.createdAt)}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                            hasFeedback
                              ? 'bg-emerald-100 text-emerald-800'
                              : ref.status === 'RECEIVED'
                              ? 'bg-sky-100 text-sky-800'
                              : ref.status === 'SENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${hasFeedback ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                          <span>
                            {hasFeedback
                              ? '✓ ได้รับผลตอบกลับจาก รพ.สกลนคร'
                              : ref.status === 'RECEIVED'
                              ? 'รพ.สกลนคร รับตัวแล้ว'
                              : ref.status === 'SENT'
                              ? 'ส่งข้อมูลแล้ว (รอรับตัว)'
                              : ref.status}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Patient & Referral Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{ref.partA.fullName}</div>
                        <div className="text-slate-500 mt-0.5">
                          HN: <strong className="font-mono text-slate-700">{ref.partA.hn}</strong> | อายุ {ref.partA.age} ปี
                        </div>
                        <div className="text-teal-700 font-medium mt-1">
                          {ref.partB.gpal} | GA {ref.partB.gaAtReferralWeeks} สัปดาห์
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-slate-500 text-3xs">ข้อบ่งชี้การส่งต่อ:</div>
                        <div className="font-bold text-slate-800">
                          {ref.partC.selectedIndicationsList.join(', ')}
                        </div>
                        <div className="text-3xs text-rose-700 font-medium">
                          {ref.partB.chiefComplaint}
                        </div>
                      </div>

                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="text-slate-500 text-3xs">ปลายทาง & วันนัด:</div>
                        <div className="font-bold text-sky-900">{ref.partE.destinationHospital}</div>
                        <div className="text-3xs text-slate-600">
                          นัด: {formatThaiDate(ref.partE.appointmentDate)} ({ref.partE.appointmentTime} น.)
                        </div>
                        <div className="text-3xs text-slate-500">
                          ผู้ประสาน: {ref.partE.senderStaffName}
                        </div>
                      </div>
                    </div>

                    {/* Feedback Preview if Available */}
                    {hasFeedback && ref.partF && (
                      <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-sky-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-sky-700" />
                            <span>ผลตอบกลับจาก ANC รพ.สกลนคร (วินิจฉัย: {ref.partF.diagnosis})</span>
                          </span>
                          <span className="text-3xs text-slate-500 font-normal">
                            โดย: {ref.partF.feedbackDoctor} ({formatThaiDate(ref.partF.feedbackDate)})
                          </span>
                        </div>
                        <p className="text-slate-700">
                          <strong>แผนการรักษา:</strong> {ref.partF.treatmentPlan}
                        </p>
                        <p className="text-teal-800 font-semibold bg-white p-2 rounded border border-sky-100">
                          <strong>คำแนะนำให้ PCU โพนนาแก้ว ดูแลต่อ:</strong> {ref.partF.recommendationsForPCU}
                        </p>
                      </div>
                    )}

                    {/* Bottom Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {/* Doctor Approval Action */}
                        {currentRole === 'doctor_pcu' && !ref.partD.doctorApproval?.isApproved && (
                          <button
                            onClick={() => approveReferral(ref.id)}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>แพทย์ PCU ลงนามอนุมัติส่งต่อ</span>
                          </button>
                        )}

                        {ref.partD.doctorApproval?.isApproved && (
                          <span className="text-3xs text-teal-700 font-semibold flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>อนุมัติโดย: {ref.partD.doctorApproval.doctorName}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Feedback Button (Accessible by Sakon Nakhon role or staff) */}
                        {!hasFeedback && (currentRole === 'anc_sakonnakhon' || currentRole === 'doctor_pcu' || currentRole === 'referral_coordinator') && (
                          <button
                            onClick={() => {
                              setFeedbackReferral(ref);
                              setFeedbackDiagnosis(ref.partC.selectedIndicationsList[0] || '');
                              setFeedbackFindings('ตรวจประเมินทางสูติกรรมและอัลตราซาวด์');
                              setFeedbackPlan('ให้ยาควบคุมอาการและนัดติดตามผล');
                              setFeedbackRecs('ส่งกลับ PCU โพนนาแก้ว เพื่อวัดความดันโลหิตสัปดาห์ละครั้ง');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>บันทึกผลตอบกลับจาก รพ.สกลนคร</span>
                          </button>
                        )}

                        {/* Open Official Printable Slip */}
                        <button
                          onClick={() => setSelectedSlip(ref)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>ดู / พิมพ์ใบส่งต่อทางการ</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* FEEDBACK ENTRY MODAL (From ANC Sakon Nakhon) */}
      {feedbackReferral && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-sky-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-200" />
                <div>
                  <h3 className="font-bold text-sm">บันทึกผลตอบกลับจาก ANC โรงพยาบาลสกลนคร</h3>
                  <p className="text-3xs text-sky-100">
                    ใบส่งต่อเลขที่: {feedbackReferral.refNumber} | ผู้รับบริการ: {feedbackReferral.partA.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackReferral(null)}
                className="text-sky-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeedbackSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  การวินิจฉัยโรค (Diagnosis) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={feedbackDiagnosis}
                  onChange={(e) => setFeedbackDiagnosis(e.target.value)}
                  placeholder="เช่น Gestational Hypertension, Severe Anemia, GDM on diet control"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ผลการตรวจทางคลินิกและผลแล็บเพิ่มเติม (Clinical & Lab Findings)
                </label>
                <textarea
                  rows={2}
                  value={feedbackFindings}
                  onChange={(e) => setFeedbackFindings(e.target.value)}
                  placeholder="เช่น ผลอัลตราซาวด์ EFW 1,800 g AFI 12 cm ปกติ, ค่า LFT/Creatinine ปกติ"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  แผนการรักษาที่ได้ให้ ณ รพ.สกลนคร (Treatment Plan)
                </label>
                <textarea
                  rows={2}
                  value={feedbackPlan}
                  onChange={(e) => setFeedbackPlan(e.target.value)}
                  placeholder="เช่น เริ่มยา Methyldopa 250 mg 1x2, ให้คำแนะนำอาการเตือนครรภ์เป็นพิษ"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-teal-800 mb-1">
                  คำแนะนำ/ข้อเสนอแนะให้ PCU โพนนาแก้ว ดูแลต่อเนื่อง (Recommendations for PCU) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedbackRecs}
                  onChange={(e) => setFeedbackRecs(e.target.value)}
                  placeholder="เช่น วัดความดันสัปดาห์ละ 1 ครั้ง หาก BP ≥ 140/90 mmHg ให้ส่งตรวจซ้ำ, ส่งมาตรวจ ANC รพ.สกลนคร อีกครั้งเมื่อ GA 36 สัปดาห์"
                  className="w-full p-2.5 bg-teal-50/50 border border-teal-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อสูติแพทย์/ผู้ให้ผลตอบกลับ</label>
                  <input
                    type="text"
                    value={feedbackDoctor}
                    onChange={(e) => setFeedbackDoctor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <span className="text-3xs text-slate-500">
                    ข้อมูลจะถูกส่งย้อนกลับไปยังแฟ้มประวัติ PCU โพนนาแก้ว ทันที
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFeedbackReferral(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  บันทึกและส่งผลตอบกลับ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE SLIP MODAL */}
      {selectedSlip && (
        <ReferralSlipModal
          referral={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}
    </div>
  );
};
