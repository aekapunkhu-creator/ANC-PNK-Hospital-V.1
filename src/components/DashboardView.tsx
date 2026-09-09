import React, { useState } from 'react';
import { 
  Users, 
  Baby, 
  AlertTriangle, 
  Share2, 
  CalendarClock, 
  UserX, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  MapPin,
  ChevronRight,
  Eye,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VILLAGES, PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';
import { formatThaiDate, calculateGA, maskCID, maskPhone } from '../utils/ancCalculations';

export const DashboardView: React.FC = () => {
  const { 
    patients, 
    referrals, 
    setSelectedPatient, 
    setActiveTab, 
    currentRole,
    logFollowUpAction 
  } = useApp();

  const [selectedDashboardSubdistrict, setSelectedDashboardSubdistrict] = useState<string>('ALL');
  const [showAllVillages, setShowAllVillages] = useState<boolean>(false);

  // KPI Calculations
  const totalPregnant = patients.length;
  const earlyVisitCount = patients.filter(p => p.isFirstVisitEarly).length;
  const earlyVisitPercent = totalPregnant > 0 ? Math.round((earlyVisitCount / totalPregnant) * 100) : 0;

  const completed8Count = patients.filter(p => p.isCompleted8Visits || p.totalVisits >= 8).length;
  const redRiskCount = patients.filter(p => p.riskLevel === 'RED').length;
  const yellowRiskCount = patients.filter(p => p.riskLevel === 'YELLOW').length;
  const greenRiskCount = patients.filter(p => p.riskLevel === 'GREEN').length;

  const totalReferrals = referrals.length;
  const pendingFeedbackCount = referrals.filter(r => r.status === 'SENT' || r.status === 'APPOINTED').length;
  const feedbackReceivedCount = referrals.filter(r => r.status === 'FEEDBACK_RECEIVED').length;

  // Subdistrict breakdown
  const subdistrictStats = PHON_NA_KAEO_SUBDISTRICTS.map(sub => {
    const subPatients = patients.filter(p => p.subdistrict === sub.name || p.village.includes(sub.name.replace('ตำบล', 'ต.')));
    const red = subPatients.filter(p => p.riskLevel === 'RED').length;
    const yellow = subPatients.filter(p => p.riskLevel === 'YELLOW').length;
    return {
      ...sub,
      count: subPatients.length,
      red,
      yellow
    };
  });

  // Village breakdown for active selection
  const displayedVillages = React.useMemo(() => {
    const relevantSubdistricts = selectedDashboardSubdistrict === 'ALL'
      ? PHON_NA_KAEO_SUBDISTRICTS
      : PHON_NA_KAEO_SUBDISTRICTS.filter(s => s.name === selectedDashboardSubdistrict);

    const list: { villageName: string; subdistrict: string; count: number; red: number; yellow: number }[] = [];

    relevantSubdistricts.forEach(sub => {
      sub.villages.forEach(v => {
        const fullTag = `${v.fullName} (${v.subdistrict.replace('ตำบล', 'ต.')})`;
        const count = patients.filter(p => p.village === fullTag || p.village.startsWith(v.fullName)).length;
        const red = patients.filter(p => (p.village === fullTag || p.village.startsWith(v.fullName)) && p.riskLevel === 'RED').length;
        const yellow = patients.filter(p => (p.village === fullTag || p.village.startsWith(v.fullName)) && p.riskLevel === 'YELLOW').length;

        if (showAllVillages || count > 0 || selectedDashboardSubdistrict !== 'ALL') {
          list.push({
            villageName: v.fullName,
            subdistrict: sub.name,
            count,
            red,
            yellow
          });
        }
      });
    });

    return list;
  }, [patients, selectedDashboardSubdistrict, showAllVillages]);

  // Upcoming appointments in next 7 days (simulate based on nextAppointmentDate)
  const today = new Date('2026-09-08'); // Current system context date
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const upcomingAppointments = patients.filter(p => {
    if (!p.nextAppointmentDate || p.isMissedAppointment) return false;
    const apptDate = new Date(p.nextAppointmentDate);
    return apptDate >= today && apptDate <= in7Days;
  });

  // Missed appointments
  const missedAppointments = patients.filter(p => p.isMissedAppointment);

  // Referrals pending feedback
  const pendingReferrals = referrals.filter(r => r.status === 'SENT' || r.status === 'APPOINTED');

  const isExecutive = currentRole === 'executive_pcu';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-100 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>ภาพรวมคลินิกฝากครรภ์คุณภาพและระบบส่งต่อ</span>
            <span className="inline-block w-1 h-1 rounded-full bg-teal-300"></span>
            <span>ประจำปีงบประมาณ 2569</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold">
            แดชบอร์ดติดตามหญิงตั้งครรภ์ PCU รพ.โพนนาแก้ว ⇄ รพ.สกลนคร
          </h2>
          <p className="text-teal-100/90 text-sm mt-1 max-w-2xl">
            ข้อมูลเชื่อมโยงสมุดสุขภาพแม่และเด็ก (สมุดสีชมพู 2568) ตรวจสอบความเสี่ยง ส่งต่อแบบไร้รอยต่อ และติดตามผลการดูแลอย่างต่อเนื่อง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('first_anc')}
            className="px-4 py-2 bg-white text-teal-800 hover:bg-teal-50 rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <Baby className="w-4 h-4 text-teal-600" />
            <span>ลงทะเบียนฝากครรภ์ใหม่</span>
          </button>
          <button
            onClick={() => setActiveTab('referral_center')}
            className="px-4 py-2 bg-teal-600/60 hover:bg-teal-600 border border-teal-400/30 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>ส่งต่อ ANC รพ.สกลนคร</span>
          </button>
        </div>
      </div>

      {/* Top 4 Primary Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">หญิงตั้งครรภ์ทั้งหมดในเขต</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalPregnant}</span>
            <span className="text-xs text-slate-500">คน</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
            <span className="text-emerald-700 font-medium">ดูแลต่อเนื่อง</span>
            <span>ใน 7 หมู่บ้านรับผิดชอบ</span>
          </div>
        </div>

        {/* First Visit <= 12 weeks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">ฝากครรภ์ครั้งแรก ≤ 12 สัปดาห์</span>
            <div className={`p-2.5 rounded-xl ${earlyVisitPercent >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{earlyVisitPercent}%</span>
            <span className="text-xs text-slate-500">({earlyVisitCount}/{totalPregnant} ราย)</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-slate-500">เป้าหมายกระทรวง สธ. ≥ 80%</span>
            <span className={`font-semibold px-2 py-0.5 rounded-md text-3xs ${earlyVisitPercent >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {earlyVisitPercent >= 80 ? 'ผ่านเกณฑ์' : 'เฝ้าระวัง'}
            </span>
          </div>
        </div>

        {/* Risk Breakdown (Traffic Light) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">ระดับความเสี่ยง (สัญญาณไฟจราจร)</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-rose-100 text-rose-800">
              แดง: {redRiskCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-800">
              เหลือง: {yellowRiskCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800">
              เขียว: {greenRiskCount}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            แดงต้องส่งต่อทันที / เหลืองตรวจใกล้ชิด
          </div>
        </div>

        {/* Referrals to Sakon Nakhon */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">ส่งต่อ ANC รพ.สกลนคร</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalReferrals}</span>
            <span className="text-xs text-slate-500">ราย</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-600">
            <span>รอผลตอบกลับ: <strong className="text-amber-700">{pendingFeedbackCount}</strong></span>
            <span>ตอบกลับแล้ว: <strong className="text-emerald-700">{feedbackReceivedCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Row 2: Village breakdown & 8-visits quality criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Village distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>การกระจายตัวของหญิงตั้งครรภ์ แยกตามพื้นที่</span>
              </h3>
              <p className="text-xs text-slate-500">เขตรับผิดชอบ PCU รพ.โพนนาแก้ว — ครอบคลุม 53 หมู่บ้าน 5 ตำบล</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                53 หมู่บ้าน / 5 ตำบล
              </span>
            </div>
          </div>

          {/* Subdistrict Tabs */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedDashboardSubdistrict('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDashboardSubdistrict === 'ALL'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({totalPregnant} คน)
            </button>
            {subdistrictStats.map(sub => (
              <button
                key={sub.name}
                onClick={() => setSelectedDashboardSubdistrict(sub.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedDashboardSubdistrict === sub.name
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{sub.name.replace('ตำบล', 'ต.')}</span>
                <span className={`text-3xs px-1 rounded-full ${
                  selectedDashboardSubdistrict === sub.name
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {sub.count}
                </span>
                {sub.red > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" title={`มีเคสสีแดง ${sub.red}`} />
                )}
              </button>
            ))}
          </div>

          {/* Controls: toggle empty villages */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              แสดง {displayedVillages.length} หมู่บ้าน {selectedDashboardSubdistrict !== 'ALL' && `(${selectedDashboardSubdistrict})`}
            </span>
            <button
              onClick={() => setShowAllVillages(!showAllVillages)}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline"
            >
              {showAllVillages ? 'แสดงเฉพาะหมู่บ้านที่มีหญิงตั้งครรภ์' : 'แสดงรายชื่อทุกหมู่บ้าน'}
            </button>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {displayedVillages.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                ไม่มีหญิงตั้งครรภ์ในหมู่บ้านที่เลือกขณะนี้
              </div>
            ) : (
              displayedVillages.map((item) => {
                const maxCount = Math.max(...displayedVillages.map(v => v.count), 1);
                const percent = Math.round((item.count / maxCount) * 100);

                return (
                  <div key={`${item.subdistrict}-${item.villageName}`} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{item.villageName}</span>
                        {selectedDashboardSubdistrict === 'ALL' && (
                          <span className="text-3xs text-slate-400">
                            ({item.subdistrict.replace('ตำบล', 'ต.')})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        {item.red > 0 && (
                          <span className="text-3xs font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            เสี่ยงแดง {item.red}
                          </span>
                        )}
                        {item.yellow > 0 && (
                          <span className="text-3xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            เสี่ยงเหลือง {item.yellow}
                          </span>
                        )}
                        <span className={`font-bold ${item.count > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                          {item.count} คน
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.red > 0 ? 'bg-rose-500' : item.yellow > 0 ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${item.count > 0 ? Math.max(percent, 12) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quality ANC Criteria Info Card */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-700 font-bold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>เกณฑ์คุณภาพ ANC 8 ครั้ง (สธ. 2568)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              แนวทางมาตรฐานการฝากครรภ์คุณภาพ โดยกรมอนามัย กระทรวงสาธารณสุข กำหนดให้ติดตามอย่างน้อย 8 ครั้งเพื่อลดภาวะแทรกซ้อน:
            </p>

            <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-teal-700">•</span>
                <span><strong>ครั้งที่ 1:</strong> ≤ 12 สัปดาห์ (คัดกรองเบื้องต้น/แล็บชุดที่ 1)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-teal-700">•</span>
                <span><strong>ครั้งที่ 2:</strong> 16-18 สัปดาห์ (ประเมินพัฒนาการ/วัคซีน)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-teal-700">•</span>
                <span><strong>ครั้งที่ 3:</strong> 20 สัปดาห์ (USG กายวิภาคทารก)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-teal-700">•</span>
                <span><strong>ครั้งที่ 4:</strong> 24-26 สัปดาห์ (คัดกรองเบาหวาน GDM)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-teal-700">•</span>
                <span><strong>ครั้งที่ 5:</strong> 28-30 สัปดาห์ (ตรวจแล็บชุดที่ 2/ซีด)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-teal-700">•</span>
                <span><strong>ครั้งที่ 6:</strong> 32 สัปดาห์ (เฝ้าระวังครรภ์เป็นพิษ)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-teal-700">•</span>
                <span><strong>ครั้งที่ 7:</strong> 36 สัปดาห์ (ประเมินท่าทารก/เตรียมคลอด)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-teal-700">•</span>
                <span><strong>ครั้งที่ 8:</strong> 38-40 สัปดาห์ (ประเมินก่อนคลอด)</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">ครบตามเกณฑ์ในระบบ:</span>
            <span className="font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
              {completed8Count} ราย
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Actionable Alert Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table 1: Upcoming Visits in 7 Days */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-teal-600" />
              <h4 className="text-sm font-bold text-slate-900">ใกล้นัดภายใน 7 วัน ({upcomingAppointments.length})</h4>
            </div>
            <button 
              onClick={() => setActiveTab('registry')}
              className="text-xs text-teal-700 hover:text-teal-800 font-medium"
            >
              ดูทั้งหมด
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 overflow-y-auto max-h-72">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                ไม่มีนัดตรวจใน 7 วันนี้
              </div>
            ) : (
              upcomingAppointments.map(patient => (
                <div key={patient.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {patient.fullName}
                    </div>
                    <div className="text-3xs text-slate-500">
                      HN: {patient.hn} | {patient.village}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-teal-800">
                      {formatThaiDate(patient.nextAppointmentDate)}
                    </div>
                    <span className="text-3xs text-slate-400">ครั้งที่ {patient.totalVisits + 1}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table 2: Missed Appointments (Defaulters) */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-600" />
              <h4 className="text-sm font-bold text-rose-900">รายชื่อขาดนัดติดตาม ({missedAppointments.length})</h4>
            </div>
            <button 
              onClick={() => setActiveTab('followup')}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline"
            >
              โทร/เยี่ยมบ้าน
            </button>
          </div>

          <div className="p-3 divide-y divide-rose-50 overflow-y-auto max-h-72">
            {missedAppointments.length === 0 ? (
              <div className="text-center py-6 text-xs text-emerald-600">
                ไม่มีหญิงตั้งครรภ์ขาดนัดในขณะนี้
              </div>
            ) : (
              missedAppointments.map(patient => (
                <div key={patient.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                      <span>{patient.fullName}</span>
                      <span className="text-3xs px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-semibold">
                        ขาด {patient.missedAppointmentDays || 5} วัน
                      </span>
                    </div>
                    <div className="text-3xs text-slate-500">
                      HN: {patient.hn} | โทร: {isExecutive ? maskPhone(patient.phone) : patient.phone}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setActiveTab('followup');
                    }}
                    className="p-1.5 text-xs rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium shrink-0 flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>ติดตาม</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table 3: Referrals pending response */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-sky-600" />
              <h4 className="text-sm font-bold text-slate-900">รอผลตอบกลับ ANC รพ.สกลนคร ({pendingReferrals.length})</h4>
            </div>
            <button 
              onClick={() => setActiveTab('referral_center')}
              className="text-xs text-sky-700 hover:text-sky-800 font-medium"
            >
              ดูรายละเอียด
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 overflow-y-auto max-h-72">
            {pendingReferrals.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                ไม่มีรายการส่งต่อค้างตอบกลับ
              </div>
            ) : (
              pendingReferrals.map(ref => (
                <div key={ref.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {ref.patientFullName}
                    </div>
                    <div className="text-3xs text-slate-500 truncate">
                      {ref.refNumber} | {ref.partB.chiefComplaint}
                    </div>
                  </div>
                  <span className={`text-3xs px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    ref.urgency === 'EMERGENCY'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ref.urgency === 'EMERGENCY' ? 'ฉุกเฉิน' : 'เร่งด่วน'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
