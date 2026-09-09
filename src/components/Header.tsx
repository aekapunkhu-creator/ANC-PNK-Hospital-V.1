import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  SendHorizontal, 
  RotateCcw,
  AlertTriangle,
  FileSpreadsheet,
  CloudCheck,
  CloudOff,
  RefreshCw,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    currentRole, 
    setCurrentRole, 
    currentUserLabel, 
    patients, 
    referrals, 
    resetToDefaultData,
    syncState,
    lastSyncedTime,
    syncNowToFirebase,
    exportExcel,
    logout,
    users
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const redRiskCount = patients.filter(p => p.riskLevel === 'RED').length;
  const pendingHospitalFeedbackCount = referrals.filter(r => r.status === 'SENT' || r.status === 'APPOINTED').length;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage('กำลังสำรองและเชื่อมต่อ Firebase...');
    const ok = await syncNowToFirebase();
    setIsSyncing(false);
    if (ok) {
      setSyncMessage('สำรองข้อมูลขึ้น Firebase สำเร็จ');
      setTimeout(() => setSyncMessage(null), 3000);
    } else {
      setSyncMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  const handleExportAll = () => {
    exportExcel();
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Facility Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-3xs sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  ระบบส่งต่อ ANC ไร้รอยต่อ
                </span>
                <span className="text-3xs text-slate-500 hidden md:inline">
                  สมุดแม่และเด็ก 2568
                </span>
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate leading-tight">
                ANC PCU รพ.โพนนาแก้ว ⇄ ANC รพ.สกลนคร
              </h1>
            </div>
          </div>

          {/* Right Controls: Cloud Sync, Excel Export, Alerts, User */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Firebase Cloud Sync Status */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              {syncState === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-medium text-slate-700">Firebase เชื่อมต่อแล้ว</span>
                  {lastSyncedTime && (
                    <span className="text-3xs text-slate-400">({lastSyncedTime})</span>
                  )}
                </>
              ) : syncState === 'syncing' || isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 text-teal-600 animate-spin" />
                  <span className="font-medium text-teal-700">กำลังซิงก์...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="font-medium text-amber-700">สำรองในเครื่อง (Offline)</span>
                </>
              )}

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="คลิกเพื่อสำรองข้อมูลขึ้น Firebase ทันที"
                className="ml-1 p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>

            {/* Excel Export Button */}
            <button
              onClick={handleExportAll}
              title="ส่งออกข้อมูลทะเบียนฝากครรภ์และสถิติตำบลเป็นไฟล์ Excel (.xlsx)"
              className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">ส่งออก Excel</span>
            </button>

            {/* Quick Alert Badges */}
            {redRiskCount > 0 && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
                title="หญิงตั้งครรภ์กลุ่มเสี่ยงสูงมาก (สีแดง)"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>เสี่ยงแดง {redRiskCount}</span>
              </div>
            )}

            {/* Current Logged In User Pill */}
            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 pl-2.5 rounded-xl border border-slate-200">
                <div className="flex flex-col text-left leading-tight pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[160px]">
                      {currentUser.name}
                    </span>
                    <span className="text-3xs px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded font-semibold hidden md:inline">
                      {currentUser.roleLabel.replace(/\(.*\)/, '').trim()}
                    </span>
                  </div>
                  <span className="text-3xs text-slate-500 hidden sm:inline truncate max-w-[140px]">
                    {currentUser.position}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    if (window.confirm(`ต้องการออกจากระบบสำหรับคุณ ${currentUser.name} หรือไม่?`)) {
                      logout();
                    }
                  }}
                  title="ออกจากระบบ"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Reset Data Button */}
            <button
              onClick={() => {
                if (window.confirm('ต้องการรีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้นหรือไม่? ข้อมูลใน Firestore จะถูกคืนค่าเป็นชุดเริ่มต้น')) {
                  resetToDefaultData();
                }
              }}
              title="รีเซ็ตข้อมูลตัวอย่าง"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Sync message alert banner */}
        {syncMessage && (
          <div className="py-1 px-3 bg-teal-50 border-t border-teal-100 text-xs text-teal-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CloudCheck className="w-3.5 h-3.5 text-teal-600" />
              {syncMessage}
            </span>
          </div>
        )}

        {/* User Info Bar */}
        <div className="py-1.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">{currentUserLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            {currentRole === 'executive_pcu' && (
              <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium text-3xs sm:text-xs">
                <ShieldCheck className="w-3 h-3" /> โหมดผู้บริหาร: ซ่อนข้อมูลระบุตัวตน (PII Masking)
              </span>
            )}
            {currentRole === 'anc_sakonnakhon' && (
              <span className="flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium text-3xs sm:text-xs">
                <Stethoscope className="w-3 h-3" /> จุดบริการปลายทาง: ANC รพ.สกลนคร
              </span>
            )}
            <span className="hidden md:inline text-3xs">เกณฑ์ฝากครรภ์คุณภาพ 8 ครั้ง (WHO / สธ. 2568) • 5 ตำบล 53 หมู่บ้าน</span>
          </div>
        </div>
      </div>
    </header>
  );
};
