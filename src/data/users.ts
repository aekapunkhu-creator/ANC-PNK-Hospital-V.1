import { AppUser } from '../types';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-admin',
    name: 'นายเอกพันธ์ ขันติ',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    systemRole: 'doctor_pcu',
    roleLabel: 'ผู้ดูแลระบบ (Admin)',
    position: 'นักวิชาการสาธารณสุข'
  },
  {
    id: 'usr-pcu01',
    name: 'นางพิชญกร นามนนท์',
    username: 'pcu01',
    password: 'pnk11103',
    role: 'head',
    systemRole: 'executive_pcu',
    roleLabel: 'หัวหน้ากลุ่มงาน (Head)',
    position: 'พยาบาลวิชาชีพชำนาญการพิเศษ'
  },
  {
    id: 'usr-pcu02',
    name: 'นางแพรวนภา จันทร์ลาย',
    username: 'pcu02',
    password: 'pnk11103',
    role: 'officer',
    systemRole: 'nurse_pcu',
    roleLabel: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พยาบาลวิชาชีพชำนาญการ'
  },
  {
    id: 'usr-pcu03',
    name: 'น.ส.จริยา การุญ',
    username: 'pcu03',
    password: 'pnk11103',
    role: 'officer',
    systemRole: 'nurse_pcu',
    roleLabel: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พยาบาลวิชาชีพชำนาญการ'
  },
  {
    id: 'usr-pcu04',
    name: 'น.ส.กนกพร ใจส่อง',
    username: 'pcu04',
    password: 'pnk11103',
    role: 'officer',
    systemRole: 'nurse_pcu',
    roleLabel: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'นักสาธารณสุขปฏิบัติการ'
  },
  {
    id: 'usr-pcu05',
    name: 'นายเอกพันธ์ ขันติ',
    username: 'pcu05',
    password: 'pnk11103',
    role: 'officer',
    systemRole: 'referral_coord',
    roleLabel: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'นักวิชาการสาธารณสุข'
  },
  {
    id: 'usr-pcu06',
    name: 'น.ส.พิมลวรรณ สุพะสอน',
    username: 'pcu06',
    password: 'pnk11103',
    role: 'officer',
    systemRole: 'referral_coord',
    roleLabel: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'นักวิชาการสาธารณสุข'
  },
  {
    id: 'usr-pcu07',
    name: 'น.ส.ปภัสสร พุทนา',
    username: 'pcu07',
    password: 'pnk11103',
    role: 'officer',
    systemRole: 'nurse_pcu',
    roleLabel: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พยาบาลวิชาชีพ'
  },
  {
    id: 'usr-pcu08',
    name: 'น.ส.ประภัสสร เรืองศรี',
    username: 'pcu08',
    password: 'pnk11103',
    role: 'officer',
    systemRole: 'nurse_pcu',
    roleLabel: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'นักวิชาการสาธารณสุข'
  },
  {
    id: 'usr-pcu09',
    name: 'นางแสงฟ้า เหลืองชาลี',
    username: 'pcu09',
    password: 'pnk11103',
    role: 'officer',
    systemRole: 'nurse_pcu',
    roleLabel: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พนักงานผู้ช่วยเหลือคนไข้'
  },
  {
    id: 'usr-pcu10',
    name: 'น.ส.รุ่งนภา การนอก',
    username: 'pcu10',
    password: 'pnk11103',
    role: 'officer',
    systemRole: 'nurse_pcu',
    roleLabel: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พนักงานผู้ช่วยเหลือคนไข้'
  },
  {
    id: 'usr-skn01',
    name: 'ทีม ANC รพ.สกลนคร',
    username: 'skn01',
    password: 'pnk11103',
    role: 'hospital',
    systemRole: 'anc_sakonnakhon',
    roleLabel: 'ANC รพ.สกลนคร (โรงพยาบาลแม่ข่าย)',
    position: 'พยาบาลวิชาชีพ/แพทย์เฉพาะทางสูติศาสตร์'
  }
];
