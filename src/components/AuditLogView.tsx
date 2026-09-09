import React, { useState } from 'react';
import { 
  Shield, 
  FileText, 
  Lock, 
  Filter, 
  Search, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditLog } from '../types';
import { formatThaiDate } from '../utils/ancCalculations';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchSearch = 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.patientHn && log.patientHn.includes(searchTerm));

    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchSearch && matchAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-100 text-emerald-800">สร้างข้อมูลใหม่</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-sky-100 text-sky-800">แก้ไขข้อมูล</span>;
      case 'VIEW':
        return <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-100 text-slate-700">เปิดดูประวัติ</span>;
      case 'REFERRAL_SENT':
        return <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-purple-100 text-purple-800">ส่งต่อผู้ป่วย</span>;
      case 'FEEDBACK_RECEIVED':
        return <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-teal-100 text-teal-800">บันทึกผลตอบกลับ</span>;
      case 'OVERRIDE_RISK':
        return <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-100 text-amber-800">ยืนยันความเสี่ยง</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-100 text-slate-600">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-800 font-bold shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                ประวัติการเข้าถึงและการดำเนินงาน (Audit Trail & Security Logs)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึกการเข้าถึงข้อมูลสุขภาพส่วนบุคคล (PDPA) ตามมาตรฐานความปลอดภัยสารสนเทศกระทรวงสาธารณสุข
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-teal-50 text-teal-800 px-3 py-1.5 rounded-xl border border-teal-200 font-medium">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>ระบบบันทึกความเปลี่ยนแปลงแบบไม่สามารถลบหรือแก้ไขย้อนหลังได้ (Immutable Audit)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาตามรายละเอียด, ผู้ดำเนินการ หรือ HN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">กิจกรรมทั้งหมด</option>
              <option value="CREATE">สร้างข้อมูลใหม่</option>
              <option value="UPDATE">แก้ไขข้อมูล</option>
              <option value="VIEW">เปิดดูประวัติ</option>
              <option value="REFERRAL_SENT">ส่งต่อผู้ป่วย</option>
              <option value="FEEDBACK_RECEIVED">บันทึกผลตอบกลับ</option>
              <option value="OVERRIDE_RISK">ยืนยันความเสี่ยง</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-3xs sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">วัน-เวลา (Timestamp)</th>
                <th className="py-3 px-3">ประเภทกิจกรรม</th>
                <th className="py-3 px-4">รายละเอียดกิจกรรม</th>
                <th className="py-3 px-3">HN ที่เกี่ยวข้อง</th>
                <th className="py-3 px-4">ผู้ดำเนินการ (Role)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    ไม่พบบันทึกกิจกรรมตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-3xs whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="py-3 px-3">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {log.details}
                    </td>

                    <td className="py-3 px-3 font-mono text-3xs">
                      {log.patientHn ? (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          {log.patientHn}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.performedByName}</div>
                      <div className="text-3xs text-slate-400 capitalize">{log.role.replace('_', ' ')}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
