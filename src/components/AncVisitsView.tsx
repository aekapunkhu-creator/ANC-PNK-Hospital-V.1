import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Heart, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Share2, 
  User, 
  ArrowRight,
  Pill,
  Clock,
  ChevronDown,
  Edit3,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Patient, ANCVisit } from '../types';
import { calculateGA, formatThaiDate } from '../utils/ancCalculations';

export const AncVisitsView: React.FC = () => {
  const { 
    patients, 
    visits, 
    selectedPatient, 
    setSelectedPatient, 
    addAncVisit, 
    setActiveTab, 
    recordAuditLog,
    openEditPatientModal,
    deletePatient,
    isAdmin
  } = useApp();

  // If no patient selected, pick the first one or allow selection
  const currentPatient: Patient | null = selectedPatient || patients[0] || null;

  // Patient's visits sorted by visitNumber
  const patientVisits = currentPatient 
    ? visits.filter(v => v.patientId === currentPatient.id).sort((a, b) => a.visitNumber - b.visitNumber)
    : [];

  const [isAddingNewVisit, setIsAddingNewVisit] = useState(false);

  // New Visit Form State
  const nextVisitNumber = (patientVisits.length > 0 ? Math.max(...patientVisits.map(v => v.visitNumber)) + 1 : 1);
  const [visitNumber, setVisitNumber] = useState(nextVisitNumber);
  const [visitDate, setVisitDate] = useState('2026-09-08');
  const [gaWeeks, setGaWeeks] = useState(currentPatient ? calculateGA(currentPatient.lmp).weeks : 24);
  const [weight, setWeight] = useState(currentPatient ? currentPatient.baselineVitals.weight + 4 : 60);
  const [bpSystolic, setBpSystolic] = useState(120);
  const [bpDiastolic, setBpDiastolic] = useState(78);
  const [fundalHeightCm, setFundalHeightCm] = useState(24);
  const [fetalHeartSoundBpm, setFetalHeartSoundBpm] = useState(144);
  const [fetalMovement, setFetalMovement] = useState<'NORMAL' | 'DECREASED' | 'NOT_APPLICABLE'>('NORMAL');
  const [edema, setEdema] = useState<'NONE' | '1+' | '2+' | '3+'>('NONE');
  const [urineProtein, setUrineProtein] = useState<'Negative' | 'Trace' | '1+' | '2+' | '3+'>('Negative');
  const [urineSugar, setUrineSugar] = useState<'Negative' | 'Trace' | '1+' | '2+' | '3+'>('Negative');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [treatmentAndAdvice, setTreatmentAndAdvice] = useState('ตรวจติดตามพัฒนาการทารกในครรภ์ จ่ายยาบำรุง นัดติดตามตามแผน');
  const [meds, setMeds] = useState('Triferdine 1x1');
  const [nextAppointmentDate, setNextAppointmentDate] = useState('2026-10-06');

  // Handle patient change
  const handleSelectPatient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pt = patients.find(p => p.id === e.target.value);
    if (pt) {
      setSelectedPatient(pt);
      setIsAddingNewVisit(false);
      setGaWeeks(calculateGA(pt.lmp).weeks);
      setWeight(pt.baselineVitals.weight + 3);
    }
  };

  const handleToggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    const newVisit = addAncVisit({
      patientId: currentPatient.id,
      visitNumber,
      date: visitDate,
      gaWeeks,
      weight,
      bpSystolic,
      bpDiastolic,
      fundalHeightCm,
      fetalHeartSoundBpm,
      fetalMovement,
      edema,
      urineProtein,
      urineSugar,
      abnormalSymptoms: selectedSymptoms,
      treatmentAndAdvice,
      medicationsDispensed: meds.split(',').map(m => m.trim()).filter(Boolean),
      nextAppointmentDate
    });

    setIsAddingNewVisit(false);
    alert(`บันทึกการตรวจ ANC ครั้งที่ ${visitNumber} เรียบร้อยแล้ว`);
  };

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700">ไม่พบข้อมูลหญิงตั้งครรภ์</h3>
        <p className="text-xs text-slate-400 mt-1">กรุณาลงทะเบียนฝากครรภ์รายใหม่ หรือเลือกผู้รับบริการจากทะเบียน</p>
      </div>
    );
  }

  const currentGA = calculateGA(currentPatient.lmp);

  return (
    <div className="space-y-6">
      {/* Top Patient Selector Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-50 text-teal-700 font-bold shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">เลือกเคสผู้รับบริการ:</span>
                <select
                  value={currentPatient.id}
                  onChange={handleSelectPatient}
                  className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-teal-500"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (HN: {p.hn} | {p.riskLevel})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                <span>HN: <strong className="font-mono text-slate-900">{currentPatient.hn}</strong></span>
                <span>อายุ: <strong>{currentPatient.age} ปี</strong></span>
                <span>ครรภ์ที่: <strong>G{currentPatient.gravida} P{currentPatient.para} A{currentPatient.abortion} L{currentPatient.living}</strong></span>
                <span>GA ปัจจุบัน: <strong className="text-teal-700">{currentGA.text}</strong></span>
                <span>EDC: <strong>{formatThaiDate(currentPatient.edc)}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Edit Patient Record Button */}
            <button
              type="button"
              onClick={() => openEditPatientModal(currentPatient)}
              className="px-3 py-2 text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>แก้ไขข้อมูลฝากครรภ์</span>
            </button>

            {/* Admin Delete Case Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`ยืนยันการลบเคส ${currentPatient.fullName} (HN: ${currentPatient.hn}) ออกจากระบบอย่างถาวร?`)) {
                    const res = deletePatient(currentPatient.id);
                    alert(res.message);
                  }
                }}
                className="px-3 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>ลบเคส (Admin)</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedPatient(currentPatient);
                setActiveTab('referral_center');
              }}
              className="px-3 py-2 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl border border-sky-200 transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>ส่งต่อ ANC รพ.สกลนคร</span>
            </button>
            <button
              onClick={() => {
                setVisitNumber(patientVisits.length + 1);
                setIsAddingNewVisit(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกการตรวจครั้งใหม่</span>
            </button>
          </div>
        </div>

        {/* 8-visits Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700">
              ความก้าวหน้าการตรวจตามเกณฑ์คุณภาพ 8 ครั้ง:
            </span>
            <span className="font-bold text-teal-800">
              {patientVisits.length} / 8 ครั้ง ({Math.min(Math.round((patientVisits.length / 8) * 100), 100)}%)
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(step => {
              const visitRecorded = patientVisits.find(v => v.visitNumber === step);
              return (
                <div
                  key={step}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    visitRecorded
                      ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-3xs font-semibold">ครั้งที่ {step}</div>
                  <div className="text-xs font-bold mt-0.5">
                    {visitRecorded ? '✓ ตรวจแล้ว' : `~${step * 4 + 4} wk`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* New Visit Record Form (Expandable) */}
      {isAddingNewVisit && (
        <form onSubmit={handleSaveVisit} className="bg-white rounded-2xl border-2 border-teal-400 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Plus className="w-4 h-4 text-teal-600" />
              <span>บันทึกการตรวจ ANC ครั้งที่ {visitNumber}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingNewVisit(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ปิดฟอร์ม
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">วันที่ตรวจ</label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">อายุครรภ์ (GA สัปดาห์)</label>
              <input
                type="number"
                required
                value={gaWeeks}
                onChange={(e) => setGaWeeks(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-teal-800"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">น้ำหนัก (กก.)</label>
              <input
                type="number"
                step="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">ความดันโลหิต (BP mmHg)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={bpSystolic}
                  onChange={(e) => setBpSystolic(Number(e.target.value))}
                  className={`w-1/2 px-2 py-1.5 border rounded-lg text-xs font-bold ${bpSystolic >= 140 ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-slate-50 border-slate-200'}`}
                />
                <span>/</span>
                <input
                  type="number"
                  value={bpDiastolic}
                  onChange={(e) => setBpDiastolic(Number(e.target.value))}
                  className={`w-1/2 px-2 py-1.5 border rounded-lg text-xs font-bold ${bpDiastolic >= 90 ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">ระดับยอดมดลูก (FH cm)</label>
              <input
                type="number"
                value={fundalHeightCm}
                onChange={(e) => setFundalHeightCm(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">เสียงหัวใจทารก (FHS bpm)</label>
              <input
                type="number"
                value={fetalHeartSoundBpm}
                onChange={(e) => setFetalHeartSoundBpm(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">การดิ้นของทารก</label>
              <select
                value={fetalMovement}
                onChange={(e) => setFetalMovement(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="NORMAL">ดิ้นปกติ (≥ 10 ครั้ง/วัน)</option>
                <option value="DECREASED">ดิ้นลดลง (เสี่ยง)</option>
                <option value="NOT_APPLICABLE">ยังไม่รู้สึกดิ้น (&lt; 20 wk)</option>
              </select>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">อาการบวม (Edema)</label>
              <select
                value={edema}
                onChange={(e) => setEdema(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="NONE">ไม่บวม (None)</option>
                <option value="1+">1+ (ข้อเท้าช่วงเย็น)</option>
                <option value="2+">2+ (หน้าแข้ง/หลังเท้า)</option>
                <option value="3+">3+ (ทั่วตัว/ใบหน้า)</option>
              </select>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">Urine Protein (Albumin)</label>
              <select
                value={urineProtein}
                onChange={(e) => setUrineProtein(e.target.value as any)}
                className={`w-full px-2.5 py-1.5 border rounded-lg text-xs ${urineProtein !== 'Negative' && urineProtein !== 'Trace' ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold' : 'bg-slate-50 border-slate-200'}`}
              >
                <option value="Negative">Negative</option>
                <option value="Trace">Trace</option>
                <option value="1+">1+</option>
                <option value="2+">2+</option>
                <option value="3+">3+</option>
              </select>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">Urine Sugar</label>
              <select
                value={urineSugar}
                onChange={(e) => setUrineSugar(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Negative">Negative</option>
                <option value="Trace">Trace</option>
                <option value="1+">1+</option>
                <option value="2+">2+</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-3xs font-semibold text-slate-700 mb-1">วันนัดตรวจครั้งถัดไป</label>
              <input
                type="date"
                value={nextAppointmentDate}
                onChange={(e) => setNextAppointmentDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Symptoms Checklist */}
          <div>
            <label className="block text-3xs font-semibold text-slate-700 mb-1">
              อาการสำคัญ / อาการผิดปกติที่ตรวจพบ (ติ๊กเลือกหากมี):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                'ปวดศีรษะตาพร่ามัว',
                'จุกแน่นลิ้นปี่',
                'เลือดออกทางช่องคลอด',
                'น้ำเดินก่อนกำหนด',
                'ลูกดิ้นน้อยลง',
                'เจ็บครรภ์สม่ำเสมอ',
                'ปัสสาวะแสบขัด',
                'ไข้หนาวสั่น'
              ].map(sym => (
                <label key={sym} className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(sym)}
                    onChange={() => handleToggleSymptom(sym)}
                    className="rounded text-teal-600"
                  />
                  <span className={selectedSymptoms.includes(sym) ? 'font-bold text-rose-700' : 'text-slate-700'}>
                    {sym}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Treatment & Advice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">
                การรักษาและคำแนะนำ (Treatment & Counseling)
              </label>
              <input
                type="text"
                value={treatmentAndAdvice}
                onChange={(e) => setTreatmentAndAdvice(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">
                ยาที่จ่ายในครั้งนี้
              </label>
              <input
                type="text"
                value={meds}
                onChange={(e) => setMeds(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingNewVisit(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              บันทึกการตรวจครั้งที่ {visitNumber}
            </button>
          </div>
        </form>
      )}

      {/* Historical Visits Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>ประวัติการตรวจ ANC ทั้งหมด ({patientVisits.length} ครั้ง)</span>
          </h3>
          <span className="text-xs text-slate-400">
            ตามแบบบันทึกการดูแลระหว่างตั้งครรภ์ สมุดสีชมพู 2568
          </span>
        </div>

        {patientVisits.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            ยังไม่มีประวัติการตรวจ กรุณากดปุ่ม "บันทึกการตรวจครั้งใหม่"
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {patientVisits.map((visit) => {
              const isHighBP = visit.bpSystolic >= 140 || visit.bpDiastolic >= 90;
              const hasProteinuria = visit.urineProtein !== 'Negative' && visit.urineProtein !== 'Trace';

              return (
                <div key={visit.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                  {/* Visit Top Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                        #{visit.visitNumber}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          ตรวจครั้งที่ {visit.visitNumber} - วันที่ {formatThaiDate(visit.date)}
                        </div>
                        <div className="text-xs text-teal-700 font-medium">
                          อายุครรภ์: {visit.gaWeeks} สัปดาห์ | บันทึกโดย: {visit.recordedBy}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isHighBP && (
                        <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> ความดันสูง ({visit.bpSystolic}/{visit.bpDiastolic})
                        </span>
                      )}
                      {hasProteinuria && (
                        <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          Protein {visit.urineProtein}
                        </span>
                      )}
                      {visit.nextAppointmentDate && (
                        <div className="text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>นัดถัดไป: {formatThaiDate(visit.nextAppointmentDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 text-3xs block">น้ำหนัก:</span>
                      <strong className="text-slate-800">{visit.weight} กก.</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-3xs block">ความดันโลหิต:</span>
                      <strong className={isHighBP ? 'text-rose-700 font-bold' : 'text-slate-800'}>
                        {visit.bpSystolic}/{visit.bpDiastolic} mmHg
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-3xs block">ยอดมดลูก (FH):</span>
                      <strong className="text-slate-800">{visit.fundalHeightCm ? `${visit.fundalHeightCm} ซม.` : '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-3xs block">เสียงหัวใจ (FHS):</span>
                      <strong className="text-slate-800">{visit.fetalHeartSoundBpm ? `${visit.fetalHeartSoundBpm} bpm` : '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-3xs block">ปัสสาวะ (Urine):</span>
                      <strong className="text-slate-800">Prot: {visit.urineProtein} / Sug: {visit.urineSugar}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-3xs block">อาการบวม / ดิ้น:</span>
                      <strong className="text-slate-800">บวม: {visit.edema} / {visit.fetalMovement === 'NORMAL' ? 'ดิ้นดี' : visit.fetalMovement}</strong>
                    </div>
                  </div>

                  {/* Abnormal Symptoms */}
                  {visit.abnormalSymptoms.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span><strong>อาการผิดปกติ:</strong> {visit.abnormalSymptoms.join(', ')}</span>
                    </div>
                  )}

                  {/* Treatment & Advice */}
                  <div className="text-xs text-slate-700 bg-teal-50/40 p-2.5 rounded-lg border border-teal-100/60">
                    <div><strong>การรักษาและคำแนะนำ:</strong> {visit.treatmentAndAdvice}</div>
                    {visit.medicationsDispensed && visit.medicationsDispensed.length > 0 && (
                      <div className="mt-1 text-teal-800 flex items-center gap-1.5">
                        <Pill className="w-3 h-3" />
                        <span><strong>ยาที่จ่าย:</strong> {visit.medicationsDispensed.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
