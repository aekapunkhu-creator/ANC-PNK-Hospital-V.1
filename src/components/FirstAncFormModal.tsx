import React, { useState, useEffect, useId } from 'react';
import { 
  Baby, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  User, 
  MapPin, 
  Stethoscope, 
  Pill,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VILLAGES, PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';
import { 
  calculateEDC, 
  calculateGA, 
  calculateBMI, 
  evaluateRisk 
} from '../utils/ancCalculations';
import { RiskLevel } from '../types';

export const FirstAncFormModal: React.FC = () => {
  const { registerFirstAnc, setActiveTab, currentUserLabel } = useApp();

  // Identification
  const [fullName, setFullName] = useState('');
  const [cid, setCid] = useState('');
  const [birthDate, setBirthDate] = useState('1998-05-10');
  const [age, setAge] = useState(28);
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState(PHON_NA_KAEO_SUBDISTRICTS[0].name);
  const [village, setVillage] = useState(VILLAGES[0]);
  const [rights, setRights] = useState('บัตรทอง (UCS)');

  // Pregnancy
  const [gravida, setGravida] = useState(1);
  const [para, setPara] = useState(0);
  const [abortion, setAbortion] = useState(0);
  const [living, setLiving] = useState(0);
  const [lmp, setLmp] = useState('2026-06-25');
  const [edc, setEdc] = useState('');
  const [calculationMethod, setCalculationMethod] = useState<'LMP' | 'USG'>('LMP');
  const [firstVisitDate, setFirstVisitDate] = useState('2026-09-08');

  // Baseline Vitals
  const [weight, setWeight] = useState(55);
  const [height, setHeight] = useState(158);
  const [bpSystolic, setBpSystolic] = useState(115);
  const [bpDiastolic, setBpDiastolic] = useState(75);
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
  const [drugAllergies, setDrugAllergies] = useState('ปฏิเสธประวัติแพ้ยา');

  // Treatment & Clinical Notes
  const [meds, setMeds] = useState('Triferdine 1x1 tab pc, Folic acid 5mg 1x1 tab pc');
  const [clinicalNotes, setClinicalNotes] = useState('ฝากครรภ์ครั้งแรก แนะนำการปฏิบัติตัวและโภชนาการ');

  // Derived state
  useEffect(() => {
    if (lmp) {
      const calculated = calculateEDC(lmp);
      setEdc(calculated);
    }
  }, [lmp]);

  // Calculate age from birthDate
  useEffect(() => {
    if (birthDate) {
      const bDate = new Date(birthDate);
      const today = new Date('2026-09-08');
      let calculatedAge = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge > 0 ? calculatedAge : 25);
    }
  }, [birthDate]);

  const gaInfo = calculateGA(lmp, new Date(firstVisitDate));
  const isEarlyVisit = gaInfo.weeks <= 12;
  const bmiInfo = calculateBMI(weight, height);

  // Auto Risk Evaluation
  const historyList: string[] = [];
  if (hasPreviousCS) historyList.push('มีประวัติผ่าตัดคลอดครรภ์ก่อน (Previous C/S)');
  if (hasDiabetes) historyList.push('โรคเบาหวาน / เบาหวานขณะตั้งครรภ์ (GDM)');
  if (hasHypertension) historyList.push('โรคความดันโลหิตสูง');
  if (hasRecurrentAbortion) historyList.push('มีประวัติแท้งซ้ำหรือทารกเสียชีวิตในครรภ์');
  if (otherHistory.trim()) historyList.push(otherHistory.trim());

  const autoRisk = evaluateRisk({
    age,
    bpSystolic,
    bpDiastolic,
    urineProtein: urineAlbumin,
    hb,
    medicalHistory: historyList,
    bmi: bmiInfo.bmi,
    rh,
    gaWeeks: gaInfo.weeks
  });

  const [clinicalRiskOverride, setClinicalRiskOverride] = useState<RiskLevel | ''>('');
  const finalRiskLevel: RiskLevel = (clinicalRiskOverride || autoRisk.level) as RiskLevel;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert('กรุณากรอกชื่อ-สกุลหญิงตั้งครรภ์');
      return;
    }
    if (!cid.trim()) {
      alert('กรุณากรอกเลขบัตรประจำตัวประชาชน 13 หลัก');
      return;
    }

    const patientData = {
      cid: cid.replace(/\D/g, ''),
      fullName: fullName.trim(),
      birthDate,
      age,
      phone: phone.trim() || '081-000-0000',
      emergencyContact: emergencyContact.trim(),
      address: address.trim() || 'ในเขตรับผิดชอบ',
      village,
      subdistrict: selectedSubdistrict,
      district: 'อำเภอโพนนาแก้ว',
      province: 'จังหวัดสกลนคร',
      rights,
      gravida,
      para,
      abortion,
      living,
      pregnancyNumber: gravida,
      lmp,
      edc,
      gaWeeksAtFirstVisit: gaInfo.weeks,
      calculationMethod,
      firstVisitDate,
      isFirstVisitEarly: isEarlyVisit,
      riskLevel: finalRiskLevel,
      riskReasons: autoRisk.reasons,
      clinicalRiskConfirmed: true,
      clinicalRiskNotes: clinicalNotes,
      riskConfirmedBy: currentUserLabel,
      riskConfirmedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      baselineVitals: {
        weight,
        height,
        bmi: bmiInfo.bmi,
        bpSystolic,
        bpDiastolic,
        pulseRate
      },
      baselineLab: {
        bloodGroup,
        rh,
        hb,
        hct,
        vdrl,
        hiv,
        hbsag,
        thalassemia,
        urineAlbumin,
        urineSugar,
        oralHealthExam
      },
      medicalHistory: historyList,
      drugAllergies: drugAllergies.trim() || 'ปฏิเสธประวัติแพ้ยา',
      currentMedications: meds.split(',').map(m => m.trim()).filter(Boolean)
    };

    const newPatient = registerFirstAnc(patientData, clinicalNotes);
    alert(`ลงทะเบียนฝากครรภ์สำเร็จ!\nได้รับเลขประจำตัว HN: ${newPatient.hn}\nระดับความเสี่ยง: ${finalRiskLevel === 'RED' ? 'สีแดง' : finalRiskLevel === 'YELLOW' ? 'สีเหลือง' : 'สีเขียว'}`);
    setActiveTab('registry');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Baby className="w-6 h-6 text-teal-600" />
            <span>บันทึกฝากครรภ์ครั้งแรก (First ANC Assessment)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            มาตรฐานสมุดบันทึกสุขภาพแม่และเด็ก (สมุดสีชมพู 2568) PCU รพ.โพนนาแก้ว
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Demographics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
            <User className="w-4 h-4 text-teal-600" />
            <span>ส่วนที่ 1: ข้อมูลทั่วไปและข้อมูลระบุตัวตน</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อ-สกุล หญิงตั้งครรภ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น นางสาวมณีรัตน์ วงศ์สมบูรณ์"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขประจำตัวประชาชน (13 หลัก) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={13}
                placeholder="1470900XXXXXX"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วัน/เดือน/ปี เกิด
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อายุ (ปี)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
                {age < 20 && (
                  <span className="text-3xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold whitespace-nowrap">
                    วัยรุ่น
                  </span>
                )}
                {age >= 35 && (
                  <span className="text-3xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold whitespace-nowrap">
                    อายุ ≥ 35
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สิทธิการรักษา
              </label>
              <select
                value={rights}
                onChange={(e) => setRights(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="บัตรทอง (UCS)">บัตรทอง (UCS)</option>
                <option value="ประกันสังคม">ประกันสังคม</option>
                <option value="จ่ายตรงข้าราชการ">จ่ายตรงข้าราชการ</option>
                <option value="ชำระเงินเอง">ชำระเงินเอง</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ตำบล (อ.โพนนาแก้ว)
              </label>
              <select
                value={selectedSubdistrict}
                onChange={(e) => {
                  const newSub = e.target.value;
                  setSelectedSubdistrict(newSub);
                  const subObj = PHON_NA_KAEO_SUBDISTRICTS.find(s => s.name === newSub);
                  if (subObj && subObj.villages.length > 0) {
                    const firstV = subObj.villages[0];
                    setVillage(`${firstV.fullName} (${firstV.subdistrict.replace('ตำบล', 'ต.')})`);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              >
                {PHON_NA_KAEO_SUBDISTRICTS.map(sub => (
                  <option key={sub.name} value={sub.name}>
                    {sub.name} ({sub.totalVillages} หมู่บ้าน)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมู่บ้านในเขตรับผิดชอบ ({PHON_NA_KAEO_SUBDISTRICTS.find(s => s.name === selectedSubdistrict)?.totalVillages || 0} หมู่บ้าน)
              </label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              >
                {PHON_NA_KAEO_SUBDISTRICTS.find(s => s.name === selectedSubdistrict)?.villages.map(v => {
                  const fullVal = `${v.fullName} (${v.subdistrict.replace('ตำบล', 'ต.')})`;
                  return (
                    <option key={fullVal} value={fullVal}>
                      {v.fullName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์ติดต่อ
              </label>
              <input
                type="tel"
                placeholder="081-234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บุคคลติดต่อฉุกเฉิน (ชื่อ/ความสัมพันธ์/เบอร์)
              </label>
              <input
                type="text"
                placeholder="เช่น นายสมชาย (สามี) 089-xxx"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pregnancy History & GA calculation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>ส่วนที่ 2: ข้อมูลการตั้งครรภ์และการคำนวณอายุครรภ์</span>
            </div>
            <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isEarlyVisit ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {isEarlyVisit ? '✓ ฝากครรภ์เร็ว ≤ 12 สัปดาห์ (ผ่านเกณฑ์ สธ.)' : '⚠ ฝากครรภ์ช้า > 12 สัปดาห์'}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gravida (G)</label>
              <input
                type="number"
                min={1}
                value={gravida}
                onChange={(e) => setGravida(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Para (P)</label>
              <input
                type="number"
                min={0}
                value={para}
                onChange={(e) => setPara(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Abortion (A)</label>
              <input
                type="number"
                min={0}
                value={abortion}
                onChange={(e) => setAbortion(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Living (L)</label>
              <input
                type="number"
                min={0}
                value={living}
                onChange={(e) => setLiving(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันแรกของประจำเดือนครั้งสุดท้าย (LMP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={lmp}
                onChange={(e) => setLmp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                กำหนดคลอด (EDC - Naegele's Rule)
              </label>
              <input
                type="date"
                readOnly
                value={edc}
                className="w-full px-3 py-2 bg-teal-50/70 border border-teal-200 rounded-xl text-sm font-mono font-semibold text-teal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อายุครรภ์ (GA ณ วันมาตรวจ)
              </label>
              <div className="px-3 py-2 bg-teal-50/70 border border-teal-200 rounded-xl text-sm font-bold text-teal-900">
                {gaInfo.text}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Baseline Vitals & Laboratory */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span>ส่วนที่ 3: สัญญาณชีพและผลตรวจทางห้องปฏิบัติการเบื้องต้น</span>
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">น้ำหนัก (กก.)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">ส่วนสูง (ซม.)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">BMI ({bmiInfo.interpretation})</label>
              <div className={`px-2.5 py-1.5 rounded-lg text-sm font-bold border ${bmiInfo.bmi >= 30 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
                {bmiInfo.bmi}
              </div>
            </div>
            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">ความดันโลหิต Systolic</label>
              <input
                type="number"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(Number(e.target.value))}
                className={`w-full px-2.5 py-1.5 border rounded-lg text-sm font-bold ${bpSystolic >= 140 ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">ความดันโลหิต Diastolic</label>
              <input
                type="number"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(Number(e.target.value))}
                className={`w-full px-2.5 py-1.5 border rounded-lg text-sm font-bold ${bpDiastolic >= 90 ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
          </div>

          {/* Labs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">หมู่เลือด ABO</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="O">O</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
              </select>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">Rh Factor</label>
              <select
                value={rh}
                onChange={(e) => setRh(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="Positive">Rh Positive (ปกติ)</option>
                <option value="Negative">Rh Negative (เสี่ยงพิเศษ)</option>
              </select>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">Hb (g/dL)</label>
              <input
                type="number"
                step="0.1"
                value={hb}
                onChange={(e) => setHb(Number(e.target.value))}
                className={`w-full px-2.5 py-1.5 border rounded-lg text-sm font-bold ${hb < 11 ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">Hct (%)</label>
              <input
                type="number"
                step="0.1"
                value={hct}
                onChange={(e) => setHct(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">Urine Protein (Albumin)</label>
              <select
                value={urineAlbumin}
                onChange={(e) => setUrineAlbumin(e.target.value as any)}
                className={`w-full px-2.5 py-1.5 border rounded-lg text-sm ${urineAlbumin !== 'Negative' && urineAlbumin !== 'Trace' ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold' : 'bg-slate-50 border-slate-200'}`}
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
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="Negative">Negative</option>
                <option value="Trace">Trace</option>
                <option value="1+">1+</option>
                <option value="2+">2+</option>
              </select>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">VDRL (ซิฟิลิส)</label>
              <select
                value={vdrl}
                onChange={(e) => setVdrl(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="Non-reactive">Non-reactive</option>
                <option value="Reactive">Reactive (ผิดปกติ)</option>
              </select>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-700 mb-1">HIV / HBsAg</label>
              <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                HIV: {hiv} | HBV: {hbsag}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Risk Evaluation Matrix & Clinician Sign-off */}
        <div className={`rounded-2xl border p-5 shadow-xs transition-colors ${
          finalRiskLevel === 'RED'
            ? 'bg-rose-50/70 border-rose-200'
            : finalRiskLevel === 'YELLOW'
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 mb-3 border-black/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-700" />
              <h3 className="font-bold text-slate-900 text-sm">
                ส่วนที่ 4: การคัดกรองความเสี่ยงอัตโนมัติและการยืนยันทางคลินิก
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">ผลประเมินอัตโนมัติ:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-2xs ${
                finalRiskLevel === 'RED'
                  ? 'bg-rose-600 text-white'
                  : finalRiskLevel === 'YELLOW'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {finalRiskLevel === 'RED'
                  ? '🔴 สีแดง (เสี่ยงสูงมาก/ส่งต่อด่วน)'
                  : finalRiskLevel === 'YELLOW'
                  ? '🟡 สีเหลือง (เสี่ยงปานกลาง/เฝ้าระวัง)'
                  : '🟢 สีเขียว (ครรภ์ปกติ)'}
              </span>
            </div>
          </div>

          {/* Risk Factors Checklist */}
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-slate-700">ปัจจัยเสี่ยงและประวัติทางการแพทย์ (ติ๊กเลือกหากมี):</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPreviousCS}
                  onChange={(e) => setHasPreviousCS(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>ประวัติผ่าตัดคลอดครรภ์ก่อน (Previous C/S)</span>
              </label>

              <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDiabetes}
                  onChange={(e) => setHasDiabetes(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>โรคเบาหวาน / ครอบครัวเป็นเบาหวาน (GDM risk)</span>
              </label>

              <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasHypertension}
                  onChange={(e) => setHasHypertension(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>ความดันโลหิตสูงเรื้อรัง (Chronic HTN)</span>
              </label>

              <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasRecurrentAbortion}
                  onChange={(e) => setHasRecurrentAbortion(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>ประวัติแท้งซ้ำ ≥ 2 ครั้ง หรือทารกเสียชีวิตในครรภ์</span>
              </label>
            </div>

            {autoRisk.reasons.length > 0 && (
              <div className="p-3 bg-white/90 rounded-xl border border-slate-200">
                <div className="font-bold text-rose-800 mb-1">ตรวจพบข้อบ่งชี้ความเสี่ยง ({autoRisk.reasons.length} รายการ):</div>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                  {autoRisk.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clinician Confirmation & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-3xs font-semibold text-slate-700 mb-1">
                  ปรับระดับความเสี่ยงตามดุลยพินิจทางคลินิก (หากต้องการปรับเปลี่ยน)
                </label>
                <select
                  value={clinicalRiskOverride}
                  onChange={(e) => setClinicalRiskOverride(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="">ตามระบบอัตโนมัติ ({autoRisk.level})</option>
                  <option value="GREEN">ยืนยันเป็น: สีเขียว (ปกติ)</option>
                  <option value="YELLOW">ยืนยันเป็น: สีเหลือง (เฝ้าระวัง/เสี่ยงปานกลาง)</option>
                  <option value="RED">ยืนยันเป็น: สีแดง (เสี่ยงสูงมาก/ส่งต่อด่วน)</option>
                </select>
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-700 mb-1">
                  คำแนะนำ/แผนการดูแลแรกรับ
                </label>
                <input
                  type="text"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Initial Treatment & Medication */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Pill className="w-4 h-4 text-teal-600" />
            <span>ส่วนที่ 5: ยาบำรุงครรภ์และการส่งมอบ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ยาที่จ่ายในครั้งแรก
              </label>
              <input
                type="text"
                value={meds}
                onChange={(e) => setMeds(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ประวัติแพ้ยา
              </label>
              <input
                type="text"
                value={drugAllergies}
                onChange={(e) => setDrugAllergies(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกและเปิดสมุดสีชมพู</span>
          </button>
        </div>

      </form>
    </div>
  );
};
