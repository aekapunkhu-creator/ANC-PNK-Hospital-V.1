import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Eye, 
  FileText, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar,
  X,
  Stethoscope,
  FileSpreadsheet,
  Edit3,
  Trash2,
  UserCheck,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Patient } from '../types';
import { calculateGA, formatThaiDate, maskCID, maskPhone } from '../utils/ancCalculations';
import { VILLAGES, PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';
import { exportAncRegisterToExcel } from '../utils/exportExcel';

export const PatientRegistryView: React.FC = () => {
  const { 
    patients, 
    referrals,
    selectedPatient,
    setSelectedPatient, 
    setActiveTab, 
    currentRole,
    recordAuditLog,
    exportExcel,
    openEditPatientModal,
    deletePatient,
    isAdmin
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [subdistrictFilter, setSubdistrictFilter] = useState('ALL');
  const [villageFilter, setVillageFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [inspectPatient, setInspectPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteConfirmHn, setDeleteConfirmHn] = useState('');

  const isExecutive = currentRole === 'executive_pcu';

  // Filtered List
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        patient.fullName.toLowerCase().includes(term) ||
        patient.hn.toLowerCase().includes(term) ||
        patient.cid.includes(term.replace(/\D/g, '')) ||
        patient.village.toLowerCase().includes(term) ||
        patient.subdistrict.toLowerCase().includes(term);

      const matchSubdistrict = subdistrictFilter === 'ALL' || patient.subdistrict === subdistrictFilter;
      const matchVillage = villageFilter === 'ALL' || patient.village === villageFilter || patient.village.includes(villageFilter);
      const matchRisk = riskFilter === 'ALL' || patient.riskLevel === riskFilter;
      const matchStatus = statusFilter === 'ALL' || patient.status === statusFilter;

      return matchSearch && matchSubdistrict && matchVillage && matchRisk && matchStatus;
    });
  }, [patients, searchTerm, subdistrictFilter, villageFilter, riskFilter, statusFilter]);

  const handleSelectAndNavigate = (patient: Patient, targetTab: string) => {
    setSelectedPatient(patient);
    recordAuditLog('VIEW', `เปิดดูแฟ้มข้อมูลหญิงตั้งครรภ์ HN ${patient.hn} (${patient.fullName})`, patient.hn);
    setActiveTab(targetTab);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            ทะเบียนหญิงตั้งครรภ์ PCU รพ.โพนนาแก้ว
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            สืบค้นข้อมูลด้วย HN, เลขบัตรประชาชน (CID) หรือชื่อ-สกุล เพื่อลดการลงทะเบียนซ้ำซ้อน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Excel Export Button */}
          <button
            onClick={() => {
              if (filteredPatients.length < patients.length) {
                exportAncRegisterToExcel(filteredPatients, referrals, {
                  fileName: `ANC_Registry_Filtered_${new Date().toISOString().slice(0, 10)}.xlsx`,
                  sheetTitle: `ทะเบียน ANC (กรอง ${filteredPatients.length} ราย)`
                });
              } else {
                exportExcel();
              }
            }}
            title="ส่งออกทะเบียนหญิงตั้งครรภ์เป็นไฟล์ Excel (.xlsx) ครบทุกคอลัมน์และสรุปสถิติตำบล"
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {filteredPatients.length < patients.length 
                ? `ส่งออก Excel (${filteredPatients.length} รายที่กรอง)` 
                : `ส่งออก Excel (${patients.length} ราย)`}
            </span>
          </button>

          {currentRole !== 'executive_pcu' && currentRole !== 'anc_sakonnakhon' && (
            <button
              onClick={() => setActiveTab('first_anc')}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>ลงทะเบียนฝากครรภ์ใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหา HN, CID, ชื่อ-สกุล, หรือหมู่บ้าน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
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

          {/* Subdistrict Filter */}
          <div>
            <select
              value={subdistrictFilter}
              onChange={(e) => {
                setSubdistrictFilter(e.target.value);
                setVillageFilter('ALL');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">ทุกตำบล (5 ตำบล)</option>
              {PHON_NA_KAEO_SUBDISTRICTS.map(sub => (
                <option key={sub.name} value={sub.name}>
                  {sub.name} ({sub.totalVillages} หมู่บ้าน)
                </option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">
                {subdistrictFilter === 'ALL' ? 'ทุกหมู่บ้าน (53 หมู่บ้าน)' : `ทุกหมู่บ้านใน ${subdistrictFilter}`}
              </option>
              {PHON_NA_KAEO_SUBDISTRICTS
                .filter(sub => subdistrictFilter === 'ALL' || sub.name === subdistrictFilter)
                .map(sub => (
                  <optgroup key={sub.name} label={`${sub.name} (${sub.totalVillages} หมู่บ้าน)`}>
                    {sub.villages.map(v => {
                      const fullVillageTag = `${v.fullName} (${v.subdistrict.replace('ตำบล', 'ต.')})`;
                      return (
                        <option key={fullVillageTag} value={fullVillageTag}>
                          {v.fullName}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">ระดับความเสี่ยงทั้งหมด</option>
              <option value="RED">🔴 สีแดง (เสี่ยงสูงมาก/ส่งต่อด่วน)</option>
              <option value="YELLOW">🟡 สีเหลือง (เสี่ยงปานกลาง/เฝ้าระวัง)</option>
              <option value="GREEN">🟢 สีเขียว (ครรภ์ปกติ)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Counts */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            พบข้อมูลทั้งหมด <strong className="text-slate-900">{filteredPatients.length}</strong> จาก {patients.length} ราย
          </div>
          <div className="flex items-center gap-2">
            <span>สถานะ:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${statusFilter === 'ACTIVE' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              กำลังดูแล (Active)
            </button>
            <button
              onClick={() => setStatusFilter('REFERRED')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${statusFilter === 'REFERRED' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ส่งต่อ รพ.สกลนคร
            </button>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-3xs sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">ผู้รับบริการ / ข้อมูลระบุตัวตน</th>
                <th className="py-3 px-3">ข้อมูลครรภ์ / GA</th>
                <th className="py-3 px-3">ที่อยู่ / สิทธิ</th>
                <th className="py-3 px-3 text-center">ระดับความเสี่ยง</th>
                <th className="py-3 px-3 text-center">ตรวจ ANC</th>
                <th className="py-3 px-4 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Search className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">ไม่พบข้อมูลหญิงตั้งครรภ์ตามเงื่อนไข</p>
                      <p className="text-3xs text-slate-400">ลองตรวจสอบคำค้นหา หรือรีเซ็ตตัวกรอง</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const gaInfo = calculateGA(patient.lmp);

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Name & HN */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{patient.fullName}</span>
                          {patient.isMissedAppointment && (
                            <span className="text-3xs px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-bold">
                              ขาดนัด
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-3xs font-semibold text-slate-700">
                            HN: {patient.hn}
                          </span>
                          <span className="font-mono text-3xs">
                            CID: {isExecutive ? maskCID(patient.cid) : patient.cid}
                          </span>
                          <span>อายุ {patient.age} ปี</span>
                        </div>
                      </td>

                      {/* Pregnancy & GA */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">
                          G{patient.gravida} P{patient.para} A{patient.abortion} L{patient.living}
                        </div>
                        <div className="text-xs text-teal-700 font-medium">
                          GA: {gaInfo.text}
                        </div>
                        <div className="text-3xs text-slate-400">
                          EDC: {formatThaiDate(patient.edc)}
                        </div>
                      </td>

                      {/* Address & Rights */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-800 font-medium truncate max-w-[160px]">
                          {patient.village}
                        </div>
                        <div className="text-3xs text-slate-500">
                          โทร: {isExecutive ? maskPhone(patient.phone) : patient.phone}
                        </div>
                        <span className="inline-block mt-0.5 text-3xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                          {patient.rights}
                        </span>
                      </td>

                      {/* Risk Flag */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            patient.riskLevel === 'RED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : patient.riskLevel === 'YELLOW'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              patient.riskLevel === 'RED'
                                ? 'bg-rose-600'
                                : patient.riskLevel === 'YELLOW'
                                ? 'bg-amber-600'
                                : 'bg-emerald-600'
                            }`}
                          />
                          <span>
                            {patient.riskLevel === 'RED'
                              ? 'แดง (เสี่ยงสูงมาก)'
                              : patient.riskLevel === 'YELLOW'
                              ? 'เหลือง (เฝ้าระวัง)'
                              : 'เขียว (ปกติ)'}
                          </span>
                        </span>

                        {patient.riskReasons.length > 0 && (
                          <div className="text-3xs text-slate-500 mt-1 max-w-[150px] truncate mx-auto" title={patient.riskReasons.join(', ')}>
                            {patient.riskReasons[0]}
                          </div>
                        )}
                      </td>

                      {/* Visits Count */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="font-bold text-slate-800">
                          {patient.totalVisits} / 8 ครั้ง
                        </div>
                        <div className="text-3xs text-slate-400">
                          นัด: {formatThaiDate(patient.nextAppointmentDate)}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Select Patient */}
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              recordAuditLog('VIEW', `เลือกผู้ป่วย HN ${patient.hn} (${patient.fullName})`, patient.hn);
                            }}
                            title={selectedPatient?.id === patient.id ? 'ผู้ป่วยที่เลือกปฏิบัติงานอยู่' : 'เลือกผู้ป่วยรายนี้'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              selectedPatient?.id === patient.id
                                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50 border-slate-200'
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* Quick Summary Modal Button */}
                          <button
                            onClick={() => {
                              setInspectPatient(patient);
                              recordAuditLog('VIEW', `เปิดดูสมุดสีชมพูสรุปของ HN ${patient.hn}`, patient.hn);
                            }}
                            title="ดูสรุปสมุดแม่และเด็ก (Pink Book Summary)"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Universal Edit Pregnancy Record Button */}
                          <button
                            onClick={() => openEditPatientModal(patient)}
                            title="แก้ไขข้อมูลการฝากครรภ์"
                            className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100/70 border border-amber-200 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Record Visit Button */}
                          {currentRole !== 'executive_pcu' && (
                            <button
                              onClick={() => handleSelectAndNavigate(patient, 'visits')}
                              title="บันทึกการตรวจ ANC"
                              className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-100/70 border border-teal-200 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Referral Button */}
                          {currentRole !== 'executive_pcu' && (
                            <button
                              onClick={() => handleSelectAndNavigate(patient, 'referral_center')}
                              title="ส่งต่อ ANC รพ.สกลนคร"
                              className="p-1.5 rounded-lg text-sky-700 hover:bg-sky-100/70 border border-sky-200 transition-colors"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Button (Admin Only) */}
                          {isAdmin ? (
                            <button
                              onClick={() => {
                                setPatientToDelete(patient);
                                setDeleteConfirmHn('');
                              }}
                              title="ลบเคสผู้ป่วย (เฉพาะแอดมิน)"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title="เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบเคสได้"
                              className="p-1.5 rounded-lg text-slate-300 border border-slate-200 cursor-not-allowed"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Patient Pink Book Inspector Modal */}
      {inspectPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 bg-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-200" />
                <div>
                  <h3 className="text-base font-bold">
                    สมุดบันทึกสุขภาพแม่และเด็ก (ฉบับย่อ) - {inspectPatient.fullName}
                  </h3>
                  <p className="text-xs text-teal-100">
                    HN: {inspectPatient.hn} | คลินิก ANC PCU รพ.โพนนาแก้ว
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectPatient(null)}
                className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-600/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Pregnancy Summary */}
              <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 text-3xs">ประวัติครรภ์:</span>
                  <div className="font-bold text-slate-800 text-sm">G{inspectPatient.gravida} P{inspectPatient.para} A{inspectPatient.abortion} L{inspectPatient.living}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-3xs">ประจำเดือนครั้งสุดท้าย (LMP):</span>
                  <div className="font-bold text-slate-800">{formatThaiDate(inspectPatient.lmp)}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-3xs">กำหนดคลอด (EDC):</span>
                  <div className="font-bold text-slate-800">{formatThaiDate(inspectPatient.edc)}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-3xs">อายุครรภ์ปัจจุบัน:</span>
                  <div className="font-bold text-teal-800">{calculateGA(inspectPatient.lmp).text}</div>
                </div>
              </div>

              {/* Baseline Vitals & Labs */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>ผลตรวจพื้นฐานและผลตรวจทางห้องปฏิบัติการ (ครั้งแรก)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                  <div>น้ำหนักเริ่มต้น: <strong>{inspectPatient.baselineVitals.weight} กก.</strong></div>
                  <div>ส่วนสูง: <strong>{inspectPatient.baselineVitals.height} ซม.</strong></div>
                  <div>BMI: <strong>{inspectPatient.baselineVitals.bmi}</strong></div>
                  <div>ความดันเริ่มต้น: <strong>{inspectPatient.baselineVitals.bpSystolic}/{inspectPatient.baselineVitals.bpDiastolic}</strong></div>
                  <div>หมู่เลือด: <strong>{inspectPatient.baselineLab.bloodGroup} Rh {inspectPatient.baselineLab.rh}</strong></div>
                  <div>Hb / Hct: <strong>{inspectPatient.baselineLab.hb} g/dL ({inspectPatient.baselineLab.hct}%)</strong></div>
                  <div>VDRL / Syphilis: <strong>{inspectPatient.baselineLab.vdrl}</strong></div>
                  <div>HIV / HBsAg: <strong>{inspectPatient.baselineLab.hiv} / {inspectPatient.baselineLab.hbsag}</strong></div>
                </div>
              </div>

              {/* Risk Assessment & Decision */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>การประเมินความเสี่ยงและการตัดสินใจทางคลินิก</span>
                </h4>
                <div className="p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ระดับความเสี่ยง:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                      inspectPatient.riskLevel === 'RED'
                        ? 'bg-rose-100 text-rose-800'
                        : inspectPatient.riskLevel === 'YELLOW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {inspectPatient.riskLevel === 'RED' ? 'สีแดง (เสี่ยงสูงมาก)' : inspectPatient.riskLevel === 'YELLOW' ? 'สีเหลือง (เฝ้าระวัง)' : 'สีเขียว (ปกติ)'}
                    </span>
                  </div>

                  {inspectPatient.riskReasons.length > 0 && (
                    <div>
                      <span className="text-slate-500">ข้อบ่งชี้ความเสี่ยง:</span>
                      <ul className="list-disc list-inside text-rose-700 font-medium pl-1 mt-0.5">
                        {inspectPatient.riskReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {inspectPatient.clinicalRiskNotes && (
                    <div className="text-slate-600 bg-slate-50 p-2 rounded-lg text-3xs">
                      <strong>ความเห็นทางคลินิก:</strong> {inspectPatient.clinicalRiskNotes}
                      {inspectPatient.riskConfirmedBy && (
                        <div className="text-slate-400 mt-1">โดย: {inspectPatient.riskConfirmedBy} ({inspectPatient.riskConfirmedDate})</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Medication & Care */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1">ยาที่ได้รับในปัจจุบัน</h4>
                <div className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {inspectPatient.currentMedications.length > 0 
                    ? inspectPatient.currentMedications.join(', ')
                    : 'ยังไม่มีประวัติการจ่ายยา'}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectPatient(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  ปิดหน้าต่าง
                </button>

                {/* Admin Delete inside Inspector */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      const p = inspectPatient;
                      setInspectPatient(null);
                      setPatientToDelete(p);
                      setDeleteConfirmHn('');
                    }}
                    className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบเคสนี้ (Admin)</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Edit Button */}
                <button
                  onClick={() => {
                    const p = inspectPatient;
                    setInspectPatient(null);
                    openEditPatientModal(p);
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลฝากครรภ์</span>
                </button>

                <button
                  onClick={() => {
                    const p = inspectPatient;
                    setInspectPatient(null);
                    handleSelectAndNavigate(p, 'visits');
                  }}
                  className="px-3.5 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>บันทึกตรวจ ANC</span>
                </button>
                <button
                  onClick={() => {
                    const p = inspectPatient;
                    setInspectPatient(null);
                    handleSelectAndNavigate(p, 'referral_center');
                  }}
                  className="px-3.5 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>ส่งต่อไป รพ.สกลนคร</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ยืนยันการลบเคสผู้ป่วย (เฉพาะแอดมินเท่านั้น)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  คุณกำลังจะลบเคส <span className="font-bold text-slate-900">{patientToDelete.fullName}</span> (HN: {patientToDelete.hn}) ออกจากระบบอย่างถาวร
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              ⚠️ การลบเคสจะลบประวัติการตรวจ ANC ทั้งหมดและใบส่งต่อไปยัง รพ.สกลนคร ออกจากฐานข้อมูล ไม่สามารถกู้คืนได้
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                พิมพ์รหัส HN <span className="font-mono text-rose-600 font-bold">{patientToDelete.hn}</span> เพื่อยืนยัน:
              </label>
              <input
                type="text"
                value={deleteConfirmHn}
                onChange={(e) => setDeleteConfirmHn(e.target.value)}
                placeholder={patientToDelete.hn}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPatientToDelete(null);
                  setDeleteConfirmHn('');
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deleteConfirmHn.trim() !== patientToDelete.hn}
                onClick={() => {
                  const res = deletePatient(patientToDelete.id);
                  alert(res.message);
                  setPatientToDelete(null);
                  setDeleteConfirmHn('');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ยืนยันลบเคสผู้ป่วย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
