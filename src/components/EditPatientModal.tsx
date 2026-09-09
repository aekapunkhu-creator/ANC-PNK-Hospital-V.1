import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Heart, 
  Activity, 
  FlaskConical, 
  ShieldAlert, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText,
  Lock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Patient, RiskLevel } from '../types';
import { 
  calculateEDC, 
  calculateGA, 
  calculateBMI, 
  evaluateRisk, 
  formatThaiDate 
} from '../utils/ancCalculations';
import { VILLAGES, PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';

export const EditPatientModal: React.FC = () => {
  const { 
    isEditPatientModalOpen, 
    patientToEdit, 
    closeEditPatientModal, 
    updatePatient, 
    deletePatient, 
    isAdmin,
    currentUserLabel
  } = useApp();

  const [activeSection, setActiveSection] = useState<'general' | 'pregnancy_vitals' | 'lab' | 'risk'>('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Form states initialized when patientToEdit changes
  const [fullName, setFullName] = useState('');
  const [cid, setCid] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState(25);
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [village, setVillage] = useState('');
  const [rights, setRights] = useState('');
  const [status, setStatus] = useState<Patient['status']>('ACTIVE');

  // Obstetric
  const [gravida, setGravida] = useState(1);
  const [para, setPara] = useState(0);
  const [abortion, setAbortion] = useState(0);
  const [living, setLiving] = useState(0);
  const [lmp, setLmp] = useState('');
  const [edc, setEdc] = useState('');
  const [calculationMethod, setCalculationMethod] = useState<'LMP' | 'USG'>('LMP');

  // Baseline Vitals
  const [weight, setWeight] = useState(50);
  const [height, setHeight] = useState(155);
  const [bpSystolic, setBpSystolic] = useState(110);
  const [bpDiastolic, setBpDiastolic] = useState(70);
  const [pulseRate, setPulseRate] = useState(76);

  // Baseline Lab
  const [bloodGroup, setBloodGroup] = useState('O');
  const [rh, setRh] = useState('Positive');
  const [hb, setHb] = useState(12.0);
  const [hct, setHct] = useState(36.0);
  const [vdrl, setVdrl] = useState<'Non-reactive' | 'Reactive'>('Non-reactive');
  const [hiv, setHiv] = useState<'Negative' | 'Positive'>('Negative');
  const [hbsag, setHbsag] = useState<'Negative' | 'Positive'>('Negative');
  const [thalassemia, setThalassemia] = useState<'Normal' | 'Trait/Carrier' | 'Disease' | 'Pending'>('Normal');
  const [urineAlbumin, setUrineAlbumin] = useState<'Negative' | 'Trace' | '1+' | '2+' | '3+'>('Negative');
  const [urineSugar, setUrineSugar] = useState<'Negative' | 'Trace' | '1+' | '2+' | '3+'>('Negative');
  const [oralHealthExam, setOralHealthExam] = useState<'Normal' | 'Needs dental care'>('Normal');

  // Medical History Flags
  const [hasPreviousCS, setHasPreviousCS] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasHypertension, setHasHypertension] = useState(false);
  const [hasRecurrentAbortion, setHasRecurrentAbortion] = useState(false);
  const [otherHistory, setOtherHistory] = useState('');
  const [drugAllergies, setDrugAllergies] = useState('');

  // Clinical Risk notes & manual level
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('GREEN');
  const [clinicalRiskNotes, setClinicalRiskNotes] = useState('');
  const [clinicalRiskConfirmed, setClinicalRiskConfirmed] = useState(false);

  // Load patient data when modal opens
  useEffect(() => {
    if (patientToEdit) {
      setFullName(patientToEdit.fullName || '');
      setCid(patientToEdit.cid || '');
      setBirthDate(patientToEdit.birthDate || '');
      setAge(patientToEdit.age || 25);
      setPhone(patientToEdit.phone || '');
      setEmergencyContact(patientToEdit.emergencyContact || '');
      setAddress(patientToEdit.address || '');
      setSubdistrict(patientToEdit.subdistrict || PHON_NA_KAEO_SUBDISTRICTS[0].name);
      setVillage(patientToEdit.village || VILLAGES[0]);
      setRights(patientToEdit.rights || 'บัตรทอง (UCS)');
      setStatus(patientToEdit.status || 'ACTIVE');

      setGravida(patientToEdit.gravida || 1);
      setPara(patientToEdit.para || 0);
      setAbortion(patientToEdit.abortion || 0);
      setLiving(patientToEdit.living || 0);
      setLmp(patientToEdit.lmp || '');
      setEdc(patientToEdit.edc || '');
      setCalculationMethod(patientToEdit.calculationMethod || 'LMP');

      setWeight(patientToEdit.baselineVitals?.weight || 50);
      setHeight(patientToEdit.baselineVitals?.height || 155);
      setBpSystolic(patientToEdit.baselineVitals?.bpSystolic || 110);
      setBpDiastolic(patientToEdit.baselineVitals?.bpDiastolic || 70);
      setPulseRate(patientToEdit.baselineVitals?.pulseRate || 76);

      setBloodGroup(patientToEdit.baselineLab?.bloodGroup || 'O');
      setRh(patientToEdit.baselineLab?.rh || 'Positive');
      setHb(patientToEdit.baselineLab?.hb || 12.0);
      setHct(patientToEdit.baselineLab?.hct || 36.0);
      setVdrl(patientToEdit.baselineLab?.vdrl || 'Non-reactive');
      setHiv(patientToEdit.baselineLab?.hiv || 'Negative');
      setHbsag(patientToEdit.baselineLab?.hbsag || 'Negative');
      setThalassemia(patientToEdit.baselineLab?.thalassemia || 'Normal');
      setUrineAlbumin(patientToEdit.baselineLab?.urineAlbumin || 'Negative');
      setUrineSugar(patientToEdit.baselineLab?.urineSugar || 'Negative');
      setOralHealthExam(patientToEdit.baselineLab?.oralHealthExam || 'Normal');

      const medHistory = patientToEdit.medicalHistory || [];
      setHasPreviousCS(medHistory.some(m => m.includes('ผ่าตัด') || m.includes('CS')));
      setHasDiabetes(medHistory.some(m => m.includes('เบาหวาน') || m.includes('DM') || m.includes('Diabetes')));
      setHasHypertension(medHistory.some(m => m.includes('ความดัน') || m.includes('HT') || m.includes('Hypertension')));
      setHasRecurrentAbortion(medHistory.some(m => m.includes('แท้ง') || m.includes('Abortion')));
      setOtherHistory(medHistory.filter(m => 
        !m.includes('ผ่าตัด') && !m.includes('CS') &&
        !m.includes('เบาหวาน') && !m.includes('DM') && !m.includes('Diabetes') &&
        !m.includes('ความดัน') && !m.includes('HT') && !m.includes('Hypertension') &&
        !m.includes('แท้ง') && !m.includes('Abortion')
      ).join(', '));
      setDrugAllergies(patientToEdit.drugAllergies || 'ปฏิเสธประวัติแพ้ยา');

      setRiskLevel(patientToEdit.riskLevel || 'GREEN');
      setClinicalRiskNotes(patientToEdit.clinicalRiskNotes || '');
      setClinicalRiskConfirmed(patientToEdit.clinicalRiskConfirmed || false);

      setActiveSection('general');
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setSaveSuccessMsg(null);
    }
  }, [patientToEdit]);

  // Live Auto Calculations
  const calculatedBMI = useMemo(() => {
    return calculateBMI(weight, height);
  }, [weight, height]);

  const calculatedGA = useMemo(() => {
    return calculateGA(lmp);
  }, [lmp]);

  // Handle LMP change: auto-recalculate EDC
  const handleLmpChange = (val: string) => {
    setLmp(val);
    if (val && calculationMethod === 'LMP') {
      const calculated = calculateEDC(val);
      setEdc(calculated);
    }
  };

  // Re-evaluate risk live
  const autoEvaluatedRisk = useMemo(() => {
    const medHistoryList: string[] = [];
    if (hasPreviousCS) medHistoryList.push('Previous CS (เคยผ่าคลอด)');
    if (hasDiabetes) medHistoryList.push('Diabetes (เบาหวาน)');
    if (hasHypertension) medHistoryList.push('Hypertension (ความดันโลหิตสูง)');
    if (hasRecurrentAbortion) medHistoryList.push('Recurrent abortion (แท้งซ้ำ)');
    if (otherHistory) medHistoryList.push(otherHistory);

    return evaluateRisk({
      age,
      bpSystolic,
      bpDiastolic,
      urineProtein: urineAlbumin,
      hb,
      rh,
      medicalHistory: medHistoryList,
      gravida
    });
  }, [age, bpSystolic, bpDiastolic, urineAlbumin, hb, rh, hasPreviousCS, hasDiabetes, hasHypertension, hasRecurrentAbortion, otherHistory, gravida]);

  if (!isEditPatientModalOpen || !patientToEdit) {
    return null;
  }

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: Partial<Patient> = {
      fullName,
      cid,
      birthDate,
      age: Number(age),
      phone,
      emergencyContact,
      address,
      subdistrict,
      village,
      rights,
      status,
      gravida: Number(gravida),
      para: Number(para),
      abortion: Number(abortion),
      living: Number(living),
      lmp,
      edc,
      calculationMethod,
      baselineVitals: {
        weight: Number(weight),
        height: Number(height),
        bmi: calculatedBMI.bmi,
        bpSystolic: Number(bpSystolic),
        bpDiastolic: Number(bpDiastolic),
        pulseRate: Number(pulseRate)
      },
      baselineLab: {
        bloodGroup,
        rh,
        hb: Number(hb),
        hct: Number(hct),
        vdrl,
        hiv,
        hbsag,
        thalassemia,
        urineAlbumin,
        urineSugar,
        oralHealthExam
      },
      medicalHistory: (() => {
        const hist: string[] = [];
        if (hasPreviousCS) hist.push('Previous CS (เคยผ่าตัดคลอด)');
        if (hasDiabetes) hist.push('Diabetes (เบาหวาน)');
        if (hasHypertension) hist.push('Hypertension (ความดันโลหิตสูง)');
        if (hasRecurrentAbortion) hist.push('Recurrent abortion (แท้งบุตรซ้ำ >= 2 ครั้ง)');
        if (otherHistory.trim()) hist.push(otherHistory.trim());
        return hist;
      })(),
      drugAllergies,
      riskLevel,
      riskReasons: autoEvaluatedRisk.reasons,
      clinicalRiskNotes,
      clinicalRiskConfirmed
    };

    const ok = updatePatient(patientToEdit.id, updatedData);
    if (ok) {
      setSaveSuccessMsg('บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        closeEditPatientModal();
      }, 1000);
    }
  };

  const handleDeleteCase = () => {
    if (!isAdmin) {
      alert('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบเคสผู้ป่วยได้');
      return;
    }

    if (deleteConfirmText.trim() !== patientToEdit.hn) {
      alert(`กรุณาพิมพ์รหัส HN "${patientToEdit.hn}" ให้ถูกต้องเพื่อยืนยันการลบเคส`);
      return;
    }

    const result = deletePatient(patientToEdit.id);
    if (result.success) {
      alert(result.message);
      closeEditPatientModal();
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="bg-teal-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-800/80 rounded-xl">
              <FileText className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">แก้ไขข้อมูลการฝากครรภ์</h3>
                <span className="px-2 py-0.5 rounded-md bg-teal-800 text-teal-200 text-xs font-mono font-bold">
                  HN: {patientToEdit.hn}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  patientToEdit.riskLevel === 'RED'
                    ? 'bg-rose-500 text-white'
                    : patientToEdit.riskLevel === 'YELLOW'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {patientToEdit.riskLevel === 'RED' ? 'เสี่ยงสูง (แดง)' : patientToEdit.riskLevel === 'YELLOW' ? 'เฝ้าระวัง (เหลือง)' : 'ปกติ (เขียว)'}
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-0.5">
                ผู้รับบริการ: <span className="font-semibold text-white">{patientToEdit.fullName}</span> • บันทึกและปรับปรุงเวชระเบียนแบบเรียลไทม์
              </p>
            </div>
          </div>

          <button
            onClick={closeEditPatientModal}
            className="p-2 rounded-xl text-teal-100 hover:text-white hover:bg-teal-600/70 transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('general')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeSection === 'general'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. ข้อมูลทั่วไป & สิทธิ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('pregnancy_vitals')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeSection === 'pregnancy_vitals'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>2. การตั้งครรภ์ & สัญญาณชีพ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('lab')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeSection === 'lab'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>3. ผลตรวจ Lab พื้นฐาน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('risk')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeSection === 'risk'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>4. ประเมินความเสี่ยง & แพ้ยา</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveChanges} className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Toast / Notification */}
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* SECTION 1: GENERAL INFO */}
          {activeSection === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เลขบัตรประชาชน (CID 13 หลัก) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={cid}
                    onChange={(e) => setCid(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานะการดูแลในระบบ
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Patient['status'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                  >
                    <option value="ACTIVE">กำลังดูแลต่อเนื่อง (Active)</option>
                    <option value="DELIVERED">คลอดแล้ว (Delivered)</option>
                    <option value="REFERRED">ส่งต่อไป รพ.สกลนคร (Referred)</option>
                    <option value="MOVED_OUT">ย้ายออกนอกพื้นที่ (Moved Out)</option>
                    <option value="TERMINATED">สิ้นสุดการตั้งครรภ์/แท้ง (Terminated)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">วันเกิด</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อายุ (ปี) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                  />
                  {age < 18 && (
                    <span className="text-3xs text-rose-600 font-bold block mt-1">
                      ⚠️ ตั้งครรภ์วัยรุ่น (อายุน้อยกว่า 18 ปี)
                    </span>
                  )}
                  {age >= 35 && (
                    <span className="text-3xs text-amber-600 font-bold block mt-1">
                      ⚠️ สตรีตั้งครรภ์อายุตั้งแต่ 35 ปีขึ้นไป
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สิทธิการรักษา</label>
                  <select
                    value={rights}
                    onChange={(e) => setRights(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="บัตรทอง (UCS)">บัตรทอง (UCS - สิทธิหลักประกันสุขภาพ)</option>
                    <option value="ประกันสังคม">ประกันสังคม</option>
                    <option value="จ่ายตรงข้าราชการ">จ่ายตรงข้าราชการ</option>
                    <option value="ชำระเงินเอง">ชำระเงินเอง</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เบอร์ติดต่อฉุกเฉิน / ญาติ</label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">ตำบล (อ.โพนนาแก้ว)</label>
                  <select
                    value={subdistrict}
                    onChange={(e) => setSubdistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                  >
                    {PHON_NA_KAEO_SUBDISTRICTS.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.totalVillages} หมู่บ้าน)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมู่บ้าน</label>
                  <select
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                  >
                    {VILLAGES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ที่อยู่ตามทะเบียนราษฎร์ / ที่พักปัจจุบัน</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="เลขที่ หมู่ ซอย ถนน"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* SECTION 2: PREGNANCY & VITALS */}
          {activeSection === 'pregnancy_vitals' && (
            <div className="space-y-5">
              {/* Obstetric History */}
              <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 space-y-3">
                <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                  ประวัติสูติกรรม (Obstetric History)
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gravida (ครรภ์ที่)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={gravida}
                      onChange={(e) => setGravida(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Para (คลอด)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={para}
                      onChange={(e) => setPara(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Abortion (แท้ง)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={abortion}
                      onChange={(e) => setAbortion(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Living (มีชีวิต)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={living}
                      onChange={(e) => setLiving(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* LMP & EDC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วันแรกของประจำเดือนครั้งสุดท้าย (LMP)
                  </label>
                  <input
                    type="date"
                    value={lmp}
                    onChange={(e) => handleLmpChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                  <span className="text-3xs text-teal-700 font-medium mt-1 block">
                    อายุครรภ์ปัจจุบัน (GA): {calculatedGA.text}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วันกำหนดคลอด (EDC)
                  </label>
                  <input
                    type="date"
                    value={edc}
                    onChange={(e) => setEdc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                  <span className="text-3xs text-slate-500 mt-1 block">
                    {formatThaiDate(edc)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วิธีคำนวณอายุครรภ์
                  </label>
                  <select
                    value={calculationMethod}
                    onChange={(e) => setCalculationMethod(e.target.value as 'LMP' | 'USG')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="LMP">ตามประจำเดือน (LMP Naegele)</option>
                    <option value="USG">ตามอัลตราซาวด์ (Ultrasound / USG)</option>
                  </select>
                </div>
              </div>

              {/* Baseline Vitals */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>สัญญาณชีพแรกรับ (Baseline Vitals)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">น้ำหนัก (กก.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ส่วนสูง (ซม.)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ดัชนีมวลกาย (BMI)</label>
                    <div className="px-3 py-2 bg-slate-100 rounded-xl text-sm font-bold text-center text-slate-800">
                      {calculatedBMI.bmi}
                    </div>
                    <span className="text-3xs text-slate-500 text-center block mt-0.5 truncate">
                      {calculatedBMI.interpretation}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">BP บน (mmHg)</label>
                    <input
                      type="number"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-xl text-sm font-bold text-center ${
                        bpSystolic >= 140 ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">BP ล่าง (mmHg)</label>
                    <input
                      type="number"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-xl text-sm font-bold text-center ${
                        bpDiastolic >= 90 ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                {(bpSystolic >= 140 || bpDiastolic >= 90) && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>ความดันโลหิตสูง ({bpSystolic}/{bpDiastolic} mmHg) เข้าเกณฑ์ความเสี่ยงสีแดง ต้องเฝ้าระวังครรภ์เป็นพิษ (Preeclampsia)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: BASELINE LAB */}
          {activeSection === 'lab' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมู่เลือด (ABO)</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมู่เลือด (Rh)</label>
                  <select
                    value={rh}
                    onChange={(e) => setRh(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold ${
                      rh === 'Negative' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                    }`}
                  >
                    <option value="Positive">Positive (+)</option>
                    <option value="Negative">Negative (-) เสี่ยงสูง</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hb (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hb}
                    onChange={(e) => setHb(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold text-center ${
                      hb < 11.0 ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-300'
                    }`}
                  />
                  {hb < 11.0 && <span className="text-3xs text-amber-700 font-bold block mt-0.5">โลหิตจาง (&lt; 11 g/dL)</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hct (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hct}
                    onChange={(e) => setHct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">VDRL / Syphilis</label>
                  <select
                    value={vdrl}
                    onChange={(e) => setVdrl(e.target.value as any)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold ${
                      vdrl === 'Reactive' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                    }`}
                  >
                    <option value="Non-reactive">Non-reactive (ปกติ)</option>
                    <option value="Reactive">Reactive (เสี่ยงสูง)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">HIV</label>
                  <select
                    value={hiv}
                    onChange={(e) => setHiv(e.target.value as any)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold ${
                      hiv === 'Positive' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                    }`}
                  >
                    <option value="Negative">Negative (ผลลบ)</option>
                    <option value="Positive">Positive (ผลบวก)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">HBsAg (ไวรัสตับอักเสบบี)</label>
                  <select
                    value={hbsag}
                    onChange={(e) => setHbsag(e.target.value as any)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold ${
                      hbsag === 'Positive' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                    }`}
                  >
                    <option value="Negative">Negative (ผลลบ)</option>
                    <option value="Positive">Positive (ผลบวก)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thalassemia Screening</label>
                  <select
                    value={thalassemia}
                    onChange={(e) => setThalassemia(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    <option value="Normal">Normal (ปกติ)</option>
                    <option value="Trait/Carrier">Trait / พาหะ</option>
                    <option value="Disease">Disease / ผู้ป่วยโรค</option>
                    <option value="Pending">รอผลตรวจ (Pending)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ปัสสาวะ โปรตีน (Urine Albumin)</label>
                  <select
                    value={urineAlbumin}
                    onChange={(e) => setUrineAlbumin(e.target.value as any)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold ${
                      ['1+', '2+', '3+'].includes(urineAlbumin) ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                    }`}
                  >
                    <option value="Negative">Negative</option>
                    <option value="Trace">Trace</option>
                    <option value="1+">1+</option>
                    <option value="2+">2+</option>
                    <option value="3+">3+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ปัสสาวะ น้ำตาล (Urine Sugar)</label>
                  <select
                    value={urineSugar}
                    onChange={(e) => setUrineSugar(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    <option value="Negative">Negative</option>
                    <option value="Trace">Trace</option>
                    <option value="1+">1+</option>
                    <option value="2+">2+</option>
                    <option value="3+">3+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">การตรวจสุขภาพช่องปาก</label>
                  <select
                    value={oralHealthExam}
                    onChange={(e) => setOralHealthExam(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    <option value="Normal">ปกติ</option>
                    <option value="Needs dental care">พบปัญหา/ต้องรับการบำบัดทางทันตกรรม</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: RISK & MEDICAL HISTORY */}
          {activeSection === 'risk' && (
            <div className="space-y-4">
              {/* Medical History Flags */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  ประวัติความเสี่ยงทางการแพทย์ (Medical History Flags)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-teal-50/50">
                    <input
                      type="checkbox"
                      checked={hasPreviousCS}
                      onChange={(e) => setHasPreviousCS(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-slate-700">เคยผ่าตัดคลอด (Previous C/S)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-teal-50/50">
                    <input
                      type="checkbox"
                      checked={hasDiabetes}
                      onChange={(e) => setHasDiabetes(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-slate-700">เบาหวาน (GDM / DM)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-teal-50/50">
                    <input
                      type="checkbox"
                      checked={hasHypertension}
                      onChange={(e) => setHasHypertension(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-slate-700">ความดันโลหิตสูง (Chronic HTN)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-teal-50/50">
                    <input
                      type="checkbox"
                      checked={hasRecurrentAbortion}
                      onChange={(e) => setHasRecurrentAbortion(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-slate-700">แท้งติดต่อกัน ≥ 2 ครั้ง (Recurrent Abortion)</span>
                  </label>
                </div>

                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประวัติโรคประจำตัว / การเจ็บป่วยอื่นๆ
                  </label>
                  <input
                    type="text"
                    value={otherHistory}
                    onChange={(e) => setOtherHistory(e.target.value)}
                    placeholder="เช่น ไทรอยด์, โรคหัวใจ, SLE หรือประวัติอื่นๆ"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประวัติแพ้ยา / อาหาร
                  </label>
                  <input
                    type="text"
                    value={drugAllergies}
                    onChange={(e) => setDrugAllergies(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 font-medium text-rose-700"
                  />
                </div>
              </div>

              {/* Risk Level Override & Clinical Review */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-teal-700" />
                    <span>ระดับความเสี่ยงตามเกณฑ์สมุด 2568</span>
                  </h4>
                  <span className="text-3xs text-teal-700 font-medium">
                    ระบบประเมินอัตโนมัติ: <strong className="font-bold">{autoEvaluatedRisk.level}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRiskLevel('GREEN')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      riskLevel === 'GREEN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    🟢 สีเขียว (ปกติ)
                  </button>

                  <button
                    type="button"
                    onClick={() => setRiskLevel('YELLOW')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      riskLevel === 'YELLOW'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    🟡 สีเหลือง (เฝ้าระวัง)
                  </button>

                  <button
                    type="button"
                    onClick={() => setRiskLevel('RED')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      riskLevel === 'RED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    🔴 สีแดง (เสี่ยงสูง)
                  </button>
                </div>

                {autoEvaluatedRisk.reasons.length > 0 && (
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-teal-100">
                    <span className="font-bold text-teal-900 block mb-1">เหตุผลความเสี่ยงที่พบ:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-3xs text-slate-600">
                      {autoEvaluatedRisk.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    บันทึกการตัดสินใจทางคลินิก (Clinical Notes)
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalRiskNotes}
                    onChange={(e) => setClinicalRiskNotes(e.target.value)}
                    placeholder="บันทึกการวินิจฉัย การวางแผนดูแล หรือเหตุผลการปรับระดับความเสี่ยง..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-teal-900">
                  <input
                    type="checkbox"
                    checked={clinicalRiskConfirmed}
                    onChange={(e) => setClinicalRiskConfirmed(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span>ยืนยันการตัดสินใจทางคลินิกโดย {currentUserLabel}</span>
                </label>
              </div>
            </div>
          )}

          {/* Delete Confirm Box if toggled */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900">
                    ยืนยันการลบเคสผู้ป่วย (เฉพาะแอดมินเท่านั้น)
                  </h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    ข้อมูลผู้ป่วย <span className="font-bold text-slate-900">{patientToEdit.fullName}</span> (HN: {patientToEdit.hn}), บันทึกการตรวจ ANC ทั้งหมด และใบส่งต่อจะถูกลบออกจากฐานข้อมูลอย่างถาวร
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  พิมพ์รหัส HN <span className="font-mono text-rose-700 font-extrabold">{patientToEdit.hn}</span> เพื่อยืนยัน:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={patientToEdit.hn}
                  className="w-full sm:w-64 px-3 py-1.5 border border-rose-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDeleteCase}
                  disabled={deleteConfirmText.trim() !== patientToEdit.hn}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ยืนยันลบเคสถาวร
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Delete button (Admin Only) */}
            <div>
              {isAdmin ? (
                !showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ลบเคสนี้ (Admin Only)</span>
                  </button>
                )
              ) : (
                <div
                  title="เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบเคสได้"
                  className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>ลบเคส (จำกัดสิทธิ์เฉพาะแอดมิน)</span>
                </div>
              )}
            </div>

            {/* Save & Cancel Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={closeEditPatientModal}
                className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไขข้อมูล</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
