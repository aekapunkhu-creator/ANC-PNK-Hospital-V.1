import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Stethoscope, 
  UserCheck, 
  FileText,
  PhoneCall,
  Clock,
  ArrowRight,
  Edit3,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Patient, RiskLevel } from '../types';
import { calculateGA, formatThaiDate } from '../utils/ancCalculations';

export const RiskTriageView: React.FC = () => {
  const { 
    patients, 
    confirmClinicalRisk, 
    setSelectedPatient, 
    setActiveTab, 
    currentRole,
    currentUserLabel,
    openEditPatientModal,
    deletePatient,
    isAdmin
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [reviewingPatient, setReviewingPatient] = useState<Patient | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel>('YELLOW');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const redPatients = patients.filter(p => p.riskLevel === 'RED');
  const yellowPatients = patients.filter(p => p.riskLevel === 'YELLOW');
  const greenPatients = patients.filter(p => p.riskLevel === 'GREEN');

  const filteredPatients = activeTabFilter === 'ALL'
    ? patients
    : patients.filter(p => p.riskLevel === activeTabFilter);

  const handleOpenReview = (patient: Patient) => {
    setReviewingPatient(patient);
    setSelectedRiskLevel(patient.riskLevel);
    setClinicalNotes(patient.clinicalRiskNotes || '');
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingPatient) return;

    confirmClinicalRisk(reviewingPatient.id, true, clinicalNotes);
    alert(`ยืนยันการตัดสินใจทางคลินิกเรียบร้อยแล้ว โดย ${currentUserLabel}`);
    setReviewingPatient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
              <span>ระบบคัดกรองและแจ้งเตือนความเสี่ยง (ANC Risk Triage System)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              สร้าง “ธงเตือน” อัตโนมัติตามเกณฑ์สมุดแม่และเด็ก 2568 พร้อมกระบวนการยืนยันการตัดสินใจทางคลินิกโดยแพทย์/พยาบาล
            </p>
          </div>

          {/* Traffic Light Summary Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTabFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTabFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({patients.length})
            </button>
            <button
              onClick={() => setActiveTabFilter('RED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTabFilter === 'RED' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>สีแดง ({redPatients.length})</span>
            </button>
            <button
              onClick={() => setActiveTabFilter('YELLOW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTabFilter === 'YELLOW' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              <span>สีเหลือง ({yellowPatients.length})</span>
            </button>
            <button
              onClick={() => setActiveTabFilter('GREEN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTabFilter === 'GREEN' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>สีเขียว ({greenPatients.length})</span>
            </button>
          </div>
        </div>

        {/* 3 Protocols Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ระดับสีเขียว (ครรภ์ปกติ)</span>
            </div>
            <p className="text-emerald-700">ไม่มีปัจจัยเสี่ยง ดูแลตามมาตรฐานคุณภาพ 8 ครั้ง ณ PCU รพ.โพนนาแก้ว</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
            <div className="font-bold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>ระดับสีเหลือง (เสี่ยงปานกลาง/เฝ้าระวัง)</span>
            </div>
            <p className="text-amber-700">มีปัจจัยเสี่ยง ต้องติดตามใกล้ชิด ปรึกษาแพทย์ PCU หรือนัดตรวจพิเศษ รพ.สกลนคร</p>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-1">
            <div className="font-bold text-rose-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>ระดับสีแดง (เสี่ยงสูงมาก/ฉุกเฉิน)</span>
            </div>
            <p className="text-rose-700">สงสัยภาวะฉุกเฉิน/ครรภ์เป็นพิษ โทรประสานทันที และออกใบส่งต่อด่วนไปยัง ANC รพ.สกลนคร</p>
          </div>
        </div>
      </div>

      {/* Triage Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatients.map((patient) => {
          const ga = calculateGA(patient.lmp);
          const isRed = patient.riskLevel === 'RED';
          const isYellow = patient.riskLevel === 'YELLOW';

          return (
            <div
              key={patient.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between ${
                isRed
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : isYellow
                  ? 'border-amber-300 ring-1 ring-amber-100'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{patient.fullName}</span>
                      <span className="text-xs text-slate-500 font-mono">HN: {patient.hn}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      อายุ {patient.age} ปี | {patient.village} | GA: <strong className="text-teal-700">{ga.text}</strong>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${
                      isRed
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : isYellow
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isRed ? '🔴 เสี่ยงสูงมาก (แดง)' : isYellow ? '🟡 เฝ้าระวัง (เหลือง)' : '🟢 ปกติ (เขียว)'}
                  </span>
                </div>

                {/* Risk Reasons List */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-700">ข้อบ่งชี้ความเสี่ยงที่ระบบตรวจพบ:</div>
                  {patient.riskReasons.length === 0 ? (
                    <div className="text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                      ✓ สัญญาณชีพและผลตรวจทางห้องปฏิบัติการอยู่ในเกณฑ์ปกติ
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {patient.riskReasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className={`p-2 rounded-lg font-medium flex items-start gap-1.5 ${
                            isRed
                              ? 'bg-rose-50 text-rose-800 border border-rose-100'
                              : 'bg-amber-50 text-amber-800 border border-amber-100'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Clinical Confirmation Status */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">การยืนยันทางคลินิก:</span>
                    <span className="font-bold text-teal-800">
                      {patient.clinicalRiskConfirmed ? '✓ ยืนยันแล้ว' : 'รอยืนยัน'}
                    </span>
                  </div>
                  {patient.clinicalRiskNotes && (
                    <div className="text-slate-700 text-3xs mt-1 bg-white p-2 rounded border border-slate-200">
                      <strong>ความเห็นแพทย์/พยาบาล:</strong> {patient.clinicalRiskNotes}
                      {patient.riskConfirmedBy && (
                        <div className="text-slate-400 mt-0.5">โดย: {patient.riskConfirmedBy}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenReview(patient)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>ทบทวน/ยืนยันความเสี่ยง</span>
                </button>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Edit Patient Record */}
                  <button
                    type="button"
                    onClick={() => openEditPatientModal(patient)}
                    title="แก้ไขข้อมูลการฝากครรภ์"
                    className="px-2.5 py-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>

                  {/* Admin Delete */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`ยืนยันลบเคส ${patient.fullName} (HN: ${patient.hn})?`)) {
                          const res = deletePatient(patient.id);
                          alert(res.message);
                        }
                      }}
                      title="ลบเคสผู้ป่วย (Admin)"
                      className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setActiveTab('visits');
                    }}
                    className="px-2.5 py-1.5 text-xs text-teal-700 hover:bg-teal-50 rounded-lg font-medium"
                  >
                    ดูประวัติ ANC
                  </button>

                  {(isRed || isYellow) && (
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setActiveTab('referral_center');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-colors flex items-center gap-1 ${
                        isRed ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{isRed ? 'ส่งต่อด่วนฉุกเฉิน' : 'ส่งต่อ ANC รพ.สกลนคร'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clinician Review Modal */}
      {reviewingPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-200" />
                <div>
                  <h3 className="font-bold text-sm">ทบทวนและยืนยันการตัดสินใจทางคลินิก</h3>
                  <p className="text-3xs text-teal-100">{reviewingPatient.fullName} (HN: {reviewingPatient.hn})</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveReview} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ระดับความเสี่ยงทางคลินิกที่ยืนยัน:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRiskLevel('GREEN')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      selectedRiskLevel === 'GREEN' ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    🟢 สีเขียว (ปกติ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRiskLevel('YELLOW')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      selectedRiskLevel === 'YELLOW' ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    🟡 สีเหลือง (เฝ้าระวัง)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRiskLevel('RED')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      selectedRiskLevel === 'RED' ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    🔴 สีแดง (เสี่ยงสูงมาก)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ความเห็นทางคลินิก / แผนการดำเนินการ:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="เช่น ตรวจพบความดันโลหิตสูงต่อเนื่อง ส่งต่อ ANC รพ.สกลนคร เพื่อรับการตรวจเพิ่มเติมโดยสูติแพทย์"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-3xs text-slate-500">
                ผู้ลงนามยืนยัน: <strong className="text-slate-800">{currentUserLabel}</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingPatient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  บันทึกการยืนยัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
