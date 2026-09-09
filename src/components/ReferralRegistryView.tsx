import React, { useState, useMemo } from 'react';
import { 
  Share2, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Printer, 
  Eye, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  SendHorizontal, 
  Building2, 
  Stethoscope, 
  MessageSquare, 
  X,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Calendar,
  Phone,
  Activity,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Referral, ReferralStatus, ReferralUrgency } from '../types';
import { formatThaiDate } from '../utils/ancCalculations';
import { exportReferralRegistryToExcel } from '../utils/exportExcel';
import { ReferralSlipModal } from './ReferralSlipModal';

export const ReferralRegistryView: React.FC = () => {
  const { 
    referrals, 
    patients, 
    setActiveTab, 
    currentRole, 
    currentUser,
    currentUserLabel,
    approveReferralByDoctor,
    submitHospitalFeedback,
    openEditPatientModal,
    selectedPatient,
    setSelectedPatient
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSlip, setSelectedSlip] = useState<Referral | null>(null);
  const [detailReferral, setDetailReferral] = useState<Referral | null>(null);

  // Doctor approval modal state
  const [approveModalRef, setApproveModalRef] = useState<Referral | null>(null);
  const [doctorComment, setDoctorComment] = useState('อนุมัติการส่งต่อตามข้อบ่งชี้ทางสูติกรรม');

  // Feedback modal state
  const [feedbackModalRef, setFeedbackModalRef] = useState<Referral | null>(null);
  const [feedbackDiagnosis, setFeedbackDiagnosis] = useState('');
  const [feedbackFindings, setFeedbackFindings] = useState('');
  const [feedbackPlan, setFeedbackPlan] = useState('');
  const [feedbackRecs, setFeedbackRecs] = useState('');
  const [feedbackDoctor, setFeedbackDoctor] = useState(
    currentRole === 'anc_sakonnakhon' ? 'พญ.นภาภรณ์ (สูติแพทย์ รพ.สกลนคร)' : 'สูติแพทย์ รพ.สกลนคร'
  );
  const [careStatus, setCareStatus] = useState<'ADMITTED' | 'OPD_FOLLOWUP' | 'RETURN_CARE_TO_PCU' | 'REFERRED_TERTIARY'>('RETURN_CARE_TO_PCU');
  const [nextApptDate, setNextApptDate] = useState('');

  // Statistics
  const totalCount = referrals.length;
  const emergencyCount = referrals.filter(r => r.urgency === 'EMERGENCY').length;
  const urgentCount = referrals.filter(r => r.urgency === 'URGENT').length;
  const pendingApprovalCount = referrals.filter(r => !r.partD?.doctorApproval?.approved).length;
  const pendingFeedbackCount = referrals.filter(r => r.status === 'SENT' || r.status === 'APPOINTED').length;
  const completedFeedbackCount = referrals.filter(r => r.status === 'FEEDBACK_RECEIVED').length;

  // Filtered List
  const filteredReferrals = useMemo(() => {
    return referrals.filter(ref => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        ref.refNumber.toLowerCase().includes(term) ||
        ref.patientHn.toLowerCase().includes(term) ||
        ref.patientFullName.toLowerCase().includes(term) ||
        ref.partA.cid.includes(term.replace(/\D/g, '')) ||
        ref.partB.chiefComplaint.toLowerCase().includes(term) ||
        (ref.partC?.selectedIndicationsList || []).some(ind => ind.toLowerCase().includes(term));

      const matchUrgency = urgencyFilter === 'ALL' || ref.urgency === urgencyFilter;
      const matchStatus = statusFilter === 'ALL' || ref.status === statusFilter;

      return matchSearch && matchUrgency && matchStatus;
    });
  }, [referrals, searchTerm, urgencyFilter, statusFilter]);

  const handleExportExcel = () => {
    exportReferralRegistryToExcel(
      filteredReferrals.length < referrals.length ? filteredReferrals : referrals,
      patients,
      filteredReferrals.length < referrals.length
        ? `ANC_Referral_Filtered_${new Date().toISOString().slice(0, 10)}.xlsx`
        : undefined
    );
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModalRef) return;
    const docName = currentUser?.name || currentUserLabel;
    approveReferralByDoctor(approveModalRef.id, docName, doctorComment);
    alert(`แพทย์ (${docName}) อนุมัติใบส่งต่อเลขที่ ${approveModalRef.refNumber} เรียบร้อยแล้ว`);
    setApproveModalRef(null);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackModalRef) return;

    submitHospitalFeedback(feedbackModalRef.id, {
      receivedDate: new Date().toISOString().slice(0, 10),
      receiverName: currentUser?.name || 'ANC รพ.สกลนคร',
      diagnosis: feedbackDiagnosis || 'การวินิจฉัยทางสูติกรรม',
      clinicalFindings: feedbackFindings || 'ตรวจร่างกายและคลื่นเสียงปกติ',
      treatmentPlan: feedbackPlan || 'ให้การรักษาและนัดติดตามต่อเนื่อง',
      recommendationsForPCU: feedbackRecs,
      nextHospitalAppointmentDate: nextApptDate || undefined,
      careStatus,
      feedbackDoctor,
      feedbackDate: new Date().toISOString().slice(0, 10)
    });

    alert(`บันทึกผลตอบกลับจาก รพ.สกลนคร สำหรับใบส่งต่อ ${feedbackModalRef.refNumber} เรียบร้อยแล้ว`);
    setFeedbackModalRef(null);
  };

  const openFeedbackModal = (ref: Referral) => {
    setFeedbackModalRef(ref);
    if (ref.partF) {
      setFeedbackDiagnosis(ref.partF.diagnosis || '');
      setFeedbackFindings(ref.partF.clinicalFindings || '');
      setFeedbackPlan(ref.partF.treatmentPlan || '');
      setFeedbackRecs(ref.partF.recommendationsForPCU || '');
      setFeedbackDoctor(ref.partF.feedbackDoctor || 'สูติแพทย์ รพ.สกลนคร');
      setCareStatus(ref.partF.careStatus || 'RETURN_CARE_TO_PCU');
      setNextApptDate(ref.partF.nextHospitalAppointmentDate || '');
    } else {
      setFeedbackDiagnosis('');
      setFeedbackFindings('');
      setFeedbackPlan('');
      setFeedbackRecs('');
      setNextApptDate('');
      setCareStatus('RETURN_CARE_TO_PCU');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
              ทะเบียนผู้ป่วยส่งต่อ (Referral Registry)
            </span>
            <span className="text-xs text-slate-500">
              PCU รพ.โพนนาแก้ว ⇄ ANC รพ.สกลนคร
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            ทะเบียนประวัติการส่งต่อและการรับผลตอบกลับ
          </h2>
          <p className="text-xs text-slate-500">
            ระบบติดตามสถานะส่งต่อ ไทม์ไลน์การประสานงาน ผลตรวจวิเคราะห์ และผลสะท้อนกลับจากโรงพยาบาลแม่ข่าย
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            title="ส่งออกข้อมูลทะเบียนส่งต่อทั้งหมดพร้อมรายงานสรุปเป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {filteredReferrals.length < referrals.length
                ? `ส่งออก Excel (${filteredReferrals.length} ราย)`
                : `ส่งออกทะเบียน Refer (${referrals.length} ราย)`}
            </span>
          </button>

          {/* Create New Referral Button */}
          {currentRole !== 'executive_pcu' && currentRole !== 'anc_sakonnakhon' && (
            <button
              onClick={() => setActiveTab('referral_center')}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ออกใบส่งต่อใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-3xs font-semibold text-slate-400 uppercase">ยอดส่งต่อทั้งหมด</div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount} ราย</div>
          <div className="text-3xs text-slate-500 mt-1">อ.โพนนาแก้ว → รพ.สกลนคร</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-100 bg-rose-50/30 shadow-2xs">
          <div className="text-3xs font-semibold text-rose-600 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> ฉุกเฉิน / เร่งด่วน
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-0.5">
            {emergencyCount + urgentCount} ราย
          </div>
          <div className="text-3xs text-rose-600 mt-1">
            ฉุกเฉิน {emergencyCount} • เร่งด่วน {urgentCount}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-100 bg-amber-50/30 shadow-2xs">
          <div className="text-3xs font-semibold text-amber-700 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> รอแพทย์ PCU อนุมัติ
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-0.5">{pendingApprovalCount} ราย</div>
          <div className="text-3xs text-amber-600 mt-1">เพื่อความปลอดภัยทางคลินิก</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-sky-100 bg-sky-50/30 shadow-2xs">
          <div className="text-3xs font-semibold text-sky-700 uppercase flex items-center gap-1">
            <SendHorizontal className="w-3 h-3" /> รอผลตรวจ รพ.สกลนคร
          </div>
          <div className="text-2xl font-bold text-sky-800 mt-0.5">{pendingFeedbackCount} ราย</div>
          <div className="text-3xs text-sky-600 mt-1">อยู่ระหว่างการประสานงาน</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-2xs">
          <div className="text-3xs font-semibold text-emerald-700 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> ได้รับผลตอบกลับแล้ว
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-0.5">{completedFeedbackCount} ราย</div>
          <div className="text-3xs text-emerald-600 mt-1">
            {totalCount > 0 ? `${((completedFeedbackCount / totalCount) * 100).toFixed(0)}% ของเคสส่งต่อ` : '0%'}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ส่งต่อ, HN, ชื่อ-สกุล หรือข้อบ่งชี้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">ทุกระดับความเร่งด่วน</option>
              <option value="EMERGENCY">🔴 ฉุกเฉิน (Emergency)</option>
              <option value="URGENT">🟡 เร่งด่วน (Urgent)</option>
              <option value="ROUTINE">🟢 ปกติ (Routine)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">ทุกสถานะการส่งต่อ</option>
              <option value="SENT">ส่งแล้ว / รอผลตรวจ</option>
              <option value="APPOINTED">รพ.สกลนคร นัดตรวจแล้ว</option>
              <option value="FEEDBACK_RECEIVED">ได้รับผลตอบกลับแล้ว</option>
              <option value="DRAFT">แบบร่าง (Draft)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Referral Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900">
              รายการในทะเบียนส่งต่อ ({filteredReferrals.length} รายการ)
            </h3>
            {filteredReferrals.length < referrals.length && (
              <span className="text-xs text-sky-600 font-medium">
                (กรองจากทั้งหมด {referrals.length} รายการ)
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400">
            เรียงตามวันที่ส่งต่อล่าสุด
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-3xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-3">เลขที่ส่งต่อ / วันที่</th>
                <th className="py-3 px-3">ข้อมูลหญิงตั้งครรภ์</th>
                <th className="py-3 px-3">ความเร่งด่วน</th>
                <th className="py-3 px-4">อาการสำคัญ & ข้อบ่งชี้</th>
                <th className="py-3 px-3">การอนุมัติแพทย์</th>
                <th className="py-3 px-3">สถานะการประสานงาน</th>
                <th className="py-3 px-3">ผลตอบกลับ รพ.สกลนคร</th>
                <th className="py-3 px-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Share2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    ไม่พบรายการส่งต่อที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((ref, idx) => {
                  const isApproved = ref.partD?.doctorApproval?.approved;
                  const hasFeedback = ref.status === 'FEEDBACK_RECEIVED';

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* No. */}
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Ref Number & Date */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-sky-700 font-mono text-xs">
                          {ref.refNumber}
                        </div>
                        <div className="text-3xs text-slate-500 mt-0.5">
                          {formatThaiDate(ref.createdDate)}
                        </div>
                      </td>

                      {/* Patient Info */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">
                          {ref.patientFullName}
                        </div>
                        <div className="text-3xs text-slate-500 mt-0.5">
                          HN: <span className="font-mono">{ref.patientHn}</span> • อายุ {ref.partA.age} ปี
                        </div>
                        <div className="text-3xs text-teal-700 font-medium">
                          {ref.partB.gpal} • GA {ref.partB.gaAtReferralWeeks} สัปดาห์
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-bold ${
                          ref.urgency === 'EMERGENCY'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : ref.urgency === 'URGENT'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {ref.urgency === 'EMERGENCY' && <AlertTriangle className="w-3 h-3" />}
                          {ref.urgency === 'EMERGENCY' ? 'ฉุกเฉิน' : ref.urgency === 'URGENT' ? 'เร่งด่วน' : 'ปกติ'}
                        </span>
                      </td>

                      {/* Chief Complaint & Indications */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={ref.partB.chiefComplaint}>
                          {ref.partB.chiefComplaint}
                        </div>
                        <div className="text-3xs text-slate-500 mt-0.5 line-clamp-1">
                          BP: {ref.partB.bpSystolic}/{ref.partB.bpDiastolic} mmHg
                        </div>
                        {ref.partC?.selectedIndicationsList && ref.partC.selectedIndicationsList.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {ref.partC.selectedIndicationsList.slice(0, 2).map((ind, i) => (
                              <span key={i} className="text-4xs px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {ind}
                              </span>
                            ))}
                            {ref.partC.selectedIndicationsList.length > 2 && (
                              <span className="text-4xs text-slate-400">+{ref.partC.selectedIndicationsList.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Doctor Approval */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isApproved ? (
                          <div className="text-emerald-700 flex items-center gap-1 font-semibold text-3xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div className="leading-tight">
                              <div>อนุมัติแล้ว</div>
                              <div className="text-4xs text-slate-500">{ref.partD.doctorApproval?.doctorName}</div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setApproveModalRef(ref)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-3xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="คลิกเพื่ออนุมัติการส่งต่อโดยแพทย์ PCU"
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>รอแพทย์อนุมัติ</span>
                          </button>
                        )}
                      </td>

                      {/* Coordination Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`inline-block text-3xs px-2 py-0.5 rounded-full font-semibold ${
                          ref.status === 'FEEDBACK_RECEIVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ref.status === 'APPOINTED'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {ref.status === 'FEEDBACK_RECEIVED' ? 'ได้รับผลตอบกลับ' :
                           ref.status === 'APPOINTED' ? 'นัดตรวจแล้ว' : 'ส่งแล้ว (รอผล)'}
                        </span>
                        <div className="text-3xs text-slate-500 mt-0.5">
                          {ref.partE.destinationHospital}
                        </div>
                      </td>

                      {/* Hospital Feedback */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        {hasFeedback ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 truncate" title={ref.partF?.diagnosis}>
                              {ref.partF?.diagnosis}
                            </div>
                            <div className="text-3xs text-emerald-700 font-medium">
                              {ref.partF?.careStatus === 'RETURN_CARE_TO_PCU' ? '✓ ส่งกลับดูแลที่ PCU' : '• ติดตามต่อที่ รพ.'}
                            </div>
                            {ref.partF?.feedbackDoctor && (
                              <div className="text-4xs text-slate-400 truncate">
                                โดย: {ref.partF.feedbackDoctor}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => openFeedbackModal(ref)}
                            className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded text-3xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>บันทึกผล รพ.</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Select Patient */}
                          {(() => {
                            const matchingPatient = patients.find(p => p.id === ref.patientId || p.hn === ref.patientHn);
                            return (
                              <>
                                {matchingPatient && (
                                  <>
                                    <button
                                      onClick={() => setSelectedPatient(matchingPatient)}
                                      title={selectedPatient?.id === matchingPatient.id ? 'ผู้ป่วยที่กำลังปฏิบัติงานอยู่' : `เลือก ${matchingPatient.fullName} เป็นผู้ป่วยปฏิบัติงาน`}
                                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                        selectedPatient?.id === matchingPatient.id
                                          ? 'bg-teal-600 text-white border-teal-600'
                                          : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50 border-slate-200'
                                      }`}
                                    >
                                      <UserCheck className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={() => openEditPatientModal(matchingPatient)}
                                      title="แก้ไขข้อมูลการฝากครรภ์ของผู้ป่วยรายนี้"
                                      className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </>
                            );
                          })()}

                          {/* Print Slip */}
                          <button
                            onClick={() => setSelectedSlip(ref)}
                            title="พิมพ์ใบส่งต่อทางการ (MOPH Form)"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* View Full Details */}
                          <button
                            onClick={() => setDetailReferral(ref)}
                            title="ดูรายละเอียดใบส่งต่อฉบับเต็มและไทม์ไลน์"
                            className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT SLIP MODAL */}
      {selectedSlip && (
        <ReferralSlipModal
          referral={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}

      {/* DETAIL MODAL (FULL REFERRAL RECORD) */}
      {detailReferral && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-4 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-500/30 text-sky-300 font-mono font-bold">
                    {detailReferral.refNumber}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    detailReferral.urgency === 'EMERGENCY' ? 'bg-rose-500 text-white' :
                    detailReferral.urgency === 'URGENT' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {detailReferral.urgency === 'EMERGENCY' ? 'ฉุกเฉิน' : detailReferral.urgency === 'URGENT' ? 'เร่งด่วน' : 'ปกติ'}
                  </span>
                </div>
                <h3 className="text-base font-bold mt-1">
                  รายละเอียดใบส่งต่อ: {detailReferral.patientFullName} (HN: {detailReferral.patientHn})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const ref = detailReferral;
                    setDetailReferral(null);
                    setSelectedSlip(ref);
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ใบ Refer</span>
                </button>
                <button
                  onClick={() => setDetailReferral(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-800">
              
              {/* Part A & B Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    <span>ส่วนที่ 1: ข้อมูลทั่วไปและประวัติครรภ์</span>
                  </div>
                  <div>ชื่อ-สกุล: <strong>{detailReferral.partA.fullName}</strong></div>
                  <div>เลขบัตรประชาชน: <span className="font-mono">{detailReferral.partA.cid}</span></div>
                  <div>อายุ: {detailReferral.partA.age} ปี • เบอร์โทร: {detailReferral.partA.phone}</div>
                  <div>ที่อยู่: {detailReferral.partA.address} ({detailReferral.partA.village})</div>
                  <div>สิทธิการรักษา: {detailReferral.partA.rights}</div>
                  <div className="pt-1 text-teal-700 font-semibold">
                    ประวัติการตั้งครรภ์: {detailReferral.partB.gpal} • GA {detailReferral.partB.gaAtReferralWeeks} สัปดาห์
                  </div>
                  <div>LMP: {detailReferral.partB.lmp} • EDC: {detailReferral.partB.edc}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-rose-600" />
                    <span>ส่วนที่ 2: อาการสำคัญและสัญญาณชีพ</span>
                  </div>
                  <div>
                    อาการสำคัญ (CC): <strong className="text-rose-700">{detailReferral.partB.chiefComplaint}</strong>
                  </div>
                  <div>
                    ความดันโลหิต: <strong>{detailReferral.partB.bpSystolic}/{detailReferral.partB.bpDiastolic} mmHg</strong> • น้ำหนัก: {detailReferral.partB.weight} กก.
                  </div>
                  <div>
                    ยาที่ได้รับปัจจุบัน: {detailReferral.partB.currentMeds || 'ยาบำรุงครรภ์มาตรฐาน (FBC, Calcium)'}
                  </div>
                  <div className="pt-1">
                    <span className="font-semibold text-slate-700">ข้อบ่งชี้การส่งต่อ:</span>
                    <ul className="list-disc list-inside mt-1 text-slate-600 space-y-0.5">
                      {detailReferral.partC?.selectedIndicationsList?.map((ind, i) => (
                        <li key={i}>{ind}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Part D & E Coordination */}
              <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-200 space-y-2">
                <div className="font-bold text-sky-900 border-b border-sky-200 pb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-700" />
                    การประสานงานและการอนุมัติ
                  </span>
                  <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    ปลายทาง: {detailReferral.partE.destinationHospital}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>ช่องทางประสานงาน: <strong>{detailReferral.partE.coordinationChannel}</strong></div>
                  <div>พาหนะส่งตัว: <strong>{detailReferral.partE.transportType}</strong></div>
                  <div>เจ้าหน้าที่ผู้ประสานงาน: {detailReferral.partE.senderStaffName}</div>
                  <div>เบอร์ติดต่อ PCU: {detailReferral.partE.pcuContactTel}</div>
                  <div className="sm:col-span-2 text-emerald-800 font-medium">
                    การอนุมัติของแพทย์: {detailReferral.partD?.doctorApproval?.approved
                      ? `✓ อนุมัติแล้ว โดย ${detailReferral.partD.doctorApproval.doctorName} (${detailReferral.partD.doctorApproval.comment})`
                      : 'รอการลงนามอนุมัติจากแพทย์ PCU'}
                  </div>
                </div>
              </div>

              {/* Part F Hospital Feedback (If Available) */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <div className="font-bold text-emerald-900 border-b border-emerald-200 pb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-700" />
                    ผลการตรวจและตอบกลับจาก ANC รพ.สกลนคร
                  </span>
                  <button
                    onClick={() => {
                      const ref = detailReferral;
                      setDetailReferral(null);
                      openFeedbackModal(ref);
                    }}
                    className="text-3xs text-emerald-700 underline font-semibold hover:text-emerald-900 cursor-pointer"
                  >
                    {detailReferral.partF ? 'แก้ไขผลตอบกลับ' : '+ บันทึกผลตอบกลับ'}
                  </button>
                </div>

                {detailReferral.partF ? (
                  <div className="space-y-1.5 pt-1">
                    <div>การวินิจฉัย (Diagnosis): <strong className="text-emerald-900">{detailReferral.partF.diagnosis}</strong></div>
                    <div>การตรวจพบทางคลินิก: {detailReferral.partF.clinicalFindings || '-'}</div>
                    <div>แผนการรักษา (Treatment Plan): {detailReferral.partF.treatmentPlan || '-'}</div>
                    <div>คำแนะนำสำหรับ PCU: <strong className="text-slate-800">{detailReferral.partF.recommendationsForPCU || '-'}</strong></div>
                    <div className="flex flex-wrap gap-4 pt-1 text-3xs text-slate-600">
                      <span>สถานะการดูแล: <strong>{detailReferral.partF.careStatus === 'RETURN_CARE_TO_PCU' ? 'ส่งกลับดูแลต่อเนื่องที่ PCU' : 'ติดตามรักษาต่อที่ รพ.'}</strong></span>
                      {detailReferral.partF.nextHospitalAppointmentDate && (
                        <span>วันนัด รพ.: <strong>{formatThaiDate(detailReferral.partF.nextHospitalAppointmentDate)}</strong></span>
                      )}
                      <span>แพทย์ผู้ตอบกลับ: <strong>{detailReferral.partF.feedbackDoctor}</strong> ({formatThaiDate(detailReferral.partF.feedbackDate || '')})</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-slate-500 text-3xs">
                    ยังไม่ได้รับผลตอบกลับจาก ANC รพ.สกลนคร (อยู่ระหว่างนัดตรวจและส่งผล)
                  </div>
                )}
              </div>

              {/* Tracking Logs */}
              {detailReferral.trackingLogs && detailReferral.trackingLogs.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs">ไทม์ไลน์บันทึกการส่งต่อและการประสานงาน:</div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {detailReferral.trackingLogs.map((log) => (
                      <div key={log.id} className="p-2.5 flex items-start gap-2.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800">{log.note}</div>
                          <div className="text-3xs text-slate-400 mt-0.5">
                            {formatThaiDate(log.timestamp)} • โดย: {log.recordedBy}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                มาตรฐานการส่งต่อสมุดสุขภาพแม่และเด็ก (2568)
              </span>
              <button
                onClick={() => setDetailReferral(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DOCTOR APPROVAL MODAL */}
      {approveModalRef && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>อนุมัติการส่งต่อผู้ป่วยโดยแพทย์ PCU</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ยืนยันการอนุมัติส่งต่อเคส <strong>{approveModalRef.patientFullName}</strong> (HN: {approveModalRef.patientHn}) 
              ไปยัง {approveModalRef.partE.destinationHospital} (เลขที่: {approveModalRef.refNumber})
            </p>

            <form onSubmit={handleApproveSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  ความเห็นทางคลินิก / คำสั่งการดูแลเพิ่มเติม:
                </label>
                <textarea
                  value={doctorComment}
                  onChange={(e) => setDoctorComment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModalRef(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันการอนุมัติ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOSPITAL FEEDBACK MODAL */}
      {feedbackModalRef && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden p-5 space-y-4 my-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span>บันทึกผลตอบกลับจาก ANC รพ.สกลนคร</span>
              </div>
              <button
                onClick={() => setFeedbackModalRef(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              เคส: <strong>{feedbackModalRef.patientFullName}</strong> (HN: {feedbackModalRef.patientHn} | {feedbackModalRef.refNumber})
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-3 overflow-y-auto pr-1 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">การวินิจฉัยของโรงพยาบาล (Diagnosis) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น GDM diet control, Mild Pre-eclampsia, Normal single pregnancy..."
                  value={feedbackDiagnosis}
                  onChange={(e) => setFeedbackDiagnosis(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">การตรวจพบทางคลินิก / ผล USG / Lab เพิ่มเติม</label>
                <textarea
                  placeholder="ผล Ultrasound, EFW, ผล OGTT 100g, ตรวจสุขภาพทารกในครรภ์..."
                  value={feedbackFindings}
                  onChange={(e) => setFeedbackFindings(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">แผนการรักษาและการดูแล (Treatment Plan)</label>
                <textarea
                  placeholder="ควบคุมอาหาร, จ่ายยา ASA 81 mg, ติดตาม BP วันละ 2 ครั้ง..."
                  value={feedbackPlan}
                  onChange={(e) => setFeedbackPlan(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">คำแนะนำสำหรับ PCU โพนนาแก้ว</label>
                <textarea
                  placeholder="สิ่งที่ฝาก PCU ช่วยติดตาม เช่น อาการปวดศีรษะ ตาพร่ามัว สัญญาณชีพ..."
                  value={feedbackRecs}
                  onChange={(e) => setFeedbackRecs(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">สถานะการดูแลต่อ</label>
                  <select
                    value={careStatus}
                    onChange={(e) => setCareStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="RETURN_CARE_TO_PCU">ส่งกลับดูแลต่อเนื่องที่ PCU</option>
                    <option value="OPD_FOLLOWUP">ติดตามรักษาต่อที่ OPD รพ.สกลนคร</option>
                    <option value="ADMITTED">รับไว้รักษาในโรงพยาบาล (Admit)</option>
                    <option value="REFERRED_TERTIARY">ส่งต่อศูนย์เชี่ยวชาญระดับสูง</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">วันนัดถัดไปที่ รพ.สกลนคร (ถ้ามี)</label>
                  <input
                    type="date"
                    value={nextApptDate}
                    onChange={(e) => setNextApptDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">แพทย์ / พยาบาล ผู้ให้ผลตอบกลับ</label>
                <input
                  type="text"
                  value={feedbackDoctor}
                  onChange={(e) => setFeedbackDoctor(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFeedbackModalRef(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกผลตอบกลับ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
