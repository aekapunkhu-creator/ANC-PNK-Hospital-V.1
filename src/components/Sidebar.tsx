import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ClipboardList, 
  ShieldAlert, 
  Share2, 
  ClockAlert, 
  History,
  X,
  HeartPulse,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateGA, maskCID } from '../utils/ancCalculations';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    patients, 
    referrals, 
    selectedPatient, 
    setSelectedPatient,
    currentRole 
  } = useApp();

  const redCount = patients.filter(p => p.riskLevel === 'RED').length;
  const yellowCount = patients.filter(p => p.riskLevel === 'YELLOW').length;
  const missedCount = patients.filter(p => p.isMissedAppointment).length;
  const pendingFeedbackCount = referrals.filter(r => r.status === 'SENT' || r.status === 'APPOINTED').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ด & รายงาน',
      icon: LayoutDashboard,
      badge: null,
      roles: ['nurse_pcu', 'doctor_pcu', 'referral_coord', 'executive_pcu', 'anc_sakonnakhon']
    },
    {
      id: 'registry',
      label: 'ทะเบียนหญิงตั้งครรภ์',
      icon: Users,
      badge: `${patients.length}`,
      roles: ['nurse_pcu', 'doctor_pcu', 'referral_coord', 'executive_pcu', 'anc_sakonnakhon']
    },
    {
      id: 'referral_registry',
      label: 'ทะเบียนส่งต่อ (Referral)',
      icon: FileSpreadsheet,
      badge: `${referrals.length}`,
      badgeColor: 'bg-sky-100 text-sky-700',
      roles: ['nurse_pcu', 'doctor_pcu', 'referral_coord', 'executive_pcu', 'anc_sakonnakhon']
    },
    {
      id: 'first_anc',
      label: 'บันทึกฝากครรภ์ครั้งแรก',
      icon: UserPlus,
      badge: null,
      roles: ['nurse_pcu', 'doctor_pcu']
    },
    {
      id: 'visits',
      label: 'บันทึกการตรวจ ANC',
      icon: ClipboardList,
      badge: null,
      roles: ['nurse_pcu', 'doctor_pcu']
    },
    {
      id: 'risk_triage',
      label: 'คัดกรอง & แจ้งเตือนความเสี่ยง',
      icon: ShieldAlert,
      badge: redCount + yellowCount > 0 ? `${redCount + yellowCount}` : null,
      badgeColor: redCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white',
      roles: ['nurse_pcu', 'doctor_pcu', 'referral_coord', 'executive_pcu']
    },
    {
      id: 'referral_center',
      label: 'ส่งต่อ ANC รพ.สกลนคร',
      icon: Share2,
      badge: `${referrals.length}`,
      roles: ['nurse_pcu', 'doctor_pcu', 'referral_coord', 'executive_pcu', 'anc_sakonnakhon']
    },
    {
      id: 'followup',
      label: 'ติดตามผล & ผลตอบกลับ',
      icon: ClockAlert,
      badge: pendingFeedbackCount + missedCount > 0 ? `${pendingFeedbackCount + missedCount}` : null,
      badgeColor: 'bg-indigo-600 text-white',
      roles: ['nurse_pcu', 'doctor_pcu', 'referral_coord', 'executive_pcu', 'anc_sakonnakhon']
    },
    {
      id: 'audit_log',
      label: 'บันทึกความปลอดภัย & สิทธิ์',
      icon: History,
      badge: null,
      roles: ['nurse_pcu', 'doctor_pcu', 'referral_coord', 'executive_pcu', 'anc_sakonnakhon']
    }
  ];

  return (
    <aside className="no-print w-full md:w-64 bg-white border-r border-slate-200 shrink-0 p-4 flex flex-col justify-between">
      <div>
        {/* Navigation List */}
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-3">
          เมนูระบบหลัก
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isAccessible = item.roles.includes(currentRole);
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                }}
                disabled={!isAccessible}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : isAccessible
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Selected Patient Mini Card */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        {selectedPatient ? (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 relative">
            <button
              onClick={() => setSelectedPatient(null)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              title="ยกเลิกการเลือกผู้ป่วย"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-teal-800 font-semibold mb-1">
              <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
              <span>ผู้ป่วยที่กำลังเลือกดู</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {selectedPatient.fullName}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              HN: <span className="font-mono">{selectedPatient.hn}</span> | GA: {calculateGA(selectedPatient.lmp).weeks} สัปดาห์
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-3xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  selectedPatient.riskLevel === 'RED'
                    ? 'bg-rose-100 text-rose-800'
                    : selectedPatient.riskLevel === 'YELLOW'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedPatient.riskLevel === 'RED' ? 'เสี่ยงสูงมาก (แดง)' : selectedPatient.riskLevel === 'YELLOW' ? 'เสี่ยงปานกลาง (เหลือง)' : 'ปกติ (เขียว)'}
              </span>
              <button
                onClick={() => setActiveTab('visits')}
                className="text-xs text-teal-700 underline hover:text-teal-900 ml-auto"
              >
                ดูประวัติ ANC
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 px-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
            ยังไม่ได้เลือกเคสผู้ป่วย <br />
            คลิกเลือกจากทะเบียนเพื่อดูประวัติ
          </div>
        )}

        <div className="text-3xs text-slate-400 text-center mt-3">
          เครือข่ายบริการสุขภาพปฐมภูมิ อ.โพนนาแก้ว<br />
          ส่งต่อไปยัง รพ.สกลนคร (ตติยภูมิ)
        </div>
      </div>
    </aside>
  );
};
