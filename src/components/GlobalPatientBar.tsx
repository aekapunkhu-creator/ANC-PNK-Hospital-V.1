import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  User, 
  Edit3, 
  Trash2, 
  FileText, 
  Share2, 
  ShieldAlert, 
  X, 
  ChevronDown, 
  Users, 
  Check, 
  AlertTriangle,
  Lock,
  Heart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Patient } from '../types';
import { calculateGA } from '../utils/ancCalculations';

export const GlobalPatientBar: React.FC = () => {
  const { 
    patients, 
    selectedPatient, 
    setSelectedPatient, 
    openEditPatientModal, 
    deletePatient, 
    isAdmin, 
    setActiveTab,
    recordAuditLog,
    currentRole
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteHnInput, setDeleteHnInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered patients for search
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return patients.slice(0, 8);
    const term = searchTerm.toLowerCase().trim();
    return patients.filter(p => 
      p.fullName.toLowerCase().includes(term) ||
      p.hn.toLowerCase().includes(term) ||
      p.cid.includes(term.replace(/\D/g, '')) ||
      p.village.toLowerCase().includes(term) ||
      p.subdistrict.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDropdownOpen(false);
    setSearchTerm('');
    recordAuditLog('VIEW', `เลือกผู้ป่วยปฏิบัติงาน: ${patient.fullName} (HN: ${patient.hn})`, patient.hn);
  };

  const handleDeleteCase = () => {
    if (!selectedPatient) return;
    if (!isAdmin) {
      alert('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ได้รับอนุญาตให้ลบเคสผู้ป่วย');
      return;
    }

    if (deleteHnInput.trim() !== selectedPatient.hn) {
      alert(`กรุณาพิมพ์รหัส HN "${selectedPatient.hn}" ให้ถูกต้องเพื่อยืนยันการลบเคส`);
      return;
    }

    const res = deletePatient(selectedPatient.id);
    if (res.success) {
      alert(res.message);
      setShowDeleteConfirm(false);
      setDeleteHnInput('');
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left Side: Active Patient Info OR Search Box */}
        {selectedPatient ? (
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                ผู้ป่วยที่กำลังปฏิบัติงาน:
              </span>
            </div>

            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl">
              <span className="text-sm font-bold text-teal-900">
                {selectedPatient.fullName}
              </span>
              <span className="font-mono text-xs font-semibold bg-white text-teal-800 px-1.5 py-0.5 rounded border border-teal-200">
                HN: {selectedPatient.hn}
              </span>
              <span className="text-xs text-teal-700 font-medium hidden sm:inline">
                อายุ {selectedPatient.age} ปี • GA: {calculateGA(selectedPatient.lmp).text}
              </span>
              <span className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                selectedPatient.riskLevel === 'RED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : selectedPatient.riskLevel === 'YELLOW'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {selectedPatient.riskLevel === 'RED' ? '🔴 เสี่ยงสูง' : selectedPatient.riskLevel === 'YELLOW' ? '🟡 เฝ้าระวัง' : '🟢 ปกติ'}
              </span>
            </div>

            {/* Quick Actions on Selected Patient */}
            <div className="flex items-center gap-1.5">
              {/* Edit Patient Record Button (Accessible Everywhere) */}
              <button
                type="button"
                onClick={() => openEditPatientModal(selectedPatient)}
                title="แก้ไขข้อมูลการฝากครรภ์ของผู้ป่วยรายนี้"
                className="px-2.5 py-1.5 bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                <span>แก้ไขข้อมูลฝากครรภ์</span>
              </button>

              {/* Record Visit */}
              {currentRole !== 'executive_pcu' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('visits')}
                  title="ไปหน้าบันทึกการตรวจ ANC"
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden lg:inline">บันทึก ANC</span>
                </button>
              )}

              {/* Risk Triage */}
              <button
                type="button"
                onClick={() => setActiveTab('risk_triage')}
                title="ไปหน้าประเมินความเสี่ยง"
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline">ประเมินความเสี่ยง</span>
              </button>

              {/* Refer */}
              {currentRole !== 'executive_pcu' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('referral_center')}
                  title="ส่งต่อ ANC รพ.สกลนคร"
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden lg:inline">ส่งต่อ</span>
                </button>
              )}

              {/* Delete Case (Admin Only) */}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setDeleteHnInput('');
                  }}
                  title="ลบเคสผู้ป่วยนี้ออกจากระบบ (เฉพาะแอดมิน)"
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบเคส (Admin)</span>
                </button>
              ) : (
                <div
                  title="เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบเคสได้"
                  className="px-2 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg text-xs font-normal flex items-center gap-1 cursor-not-allowed hidden xl:flex"
                >
                  <Lock className="w-3 h-3" />
                  <span>ลบเคส (Admin)</span>
                </div>
              )}

              {/* Deselect / Switch */}
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                title="ยกเลิกการเลือกผู้ป่วยนี้"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-700">เลือกผู้ป่วยเพื่อดูข้อมูลและปฏิบัติงาน:</span>
            <span>มีหญิงตั้งครรภ์ในระบบทั้งหมด {patients.length} ราย</span>
          </div>
        )}

        {/* Right Side: Quick Search & Select Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <div className="relative w-64 sm:w-80">
              <input
                type="text"
                value={searchTerm}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="ค้นหาคนไข้ (ชื่อ, HN, CID, หมู่บ้าน)..."
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>รายชื่อ</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Autocomplete / Patient List Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-3xs font-bold text-slate-400 uppercase">
                <span>ผลการค้นหา ({searchResults.length} ราย)</span>
                <span className="text-teal-600">คลิกเพื่อเลือก</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  ไม่พบผู้ป่วยที่ตรงกับคำค้นหา "{searchTerm}"
                </div>
              ) : (
                searchResults.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  const ga = calculateGA(p.lmp);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className={`px-3 py-2 text-xs flex items-center justify-between hover:bg-teal-50/70 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${
                        isSelected ? 'bg-teal-50/90 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{p.fullName}</span>
                          <span className="font-mono text-3xs bg-slate-100 px-1 py-0.2 rounded text-slate-600">
                            {p.hn}
                          </span>
                        </div>
                        <div className="text-3xs text-slate-500 mt-0.5">
                          อายุ {p.age} ปี • {p.village} • GA: {ga.text}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${
                          p.riskLevel === 'RED' ? 'bg-rose-500' : p.riskLevel === 'YELLOW' ? 'bg-amber-400' : 'bg-emerald-500'
                        }`} />
                        {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                      </div>
                    </div>
                  );
                })
              )}

              <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setActiveTab('registry');
                  }}
                  className="text-xs text-teal-700 hover:text-teal-800 font-bold"
                >
                  เปิดดูทะเบียนผู้ป่วยทั้งหมดในระบบ ({patients.length} ราย) →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog when triggered from the bar */}
      {showDeleteConfirm && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ยืนยันการลบเคสผู้ป่วย (Admin Only)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  คุณกำลังจะลบเคส <span className="font-bold text-slate-900">{selectedPatient.fullName}</span> (HN: {selectedPatient.hn}) ออกจากระบบ ข้อมูลการตรวจและการส่งต่อทั้งหมดจะถูกลบถาวร
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                พิมพ์รหัส HN <span className="font-mono text-rose-600 font-bold">{selectedPatient.hn}</span> เพื่อยืนยัน:
              </label>
              <input
                type="text"
                value={deleteHnInput}
                onChange={(e) => setDeleteHnInput(e.target.value)}
                placeholder={selectedPatient.hn}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteHnInput('');
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deleteHnInput.trim() !== selectedPatient.hn}
                onClick={handleDeleteCase}
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
