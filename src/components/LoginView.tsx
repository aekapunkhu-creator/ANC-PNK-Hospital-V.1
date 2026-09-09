import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  Database,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = login(username.trim(), password);
      setLoading(false);
      if (!result.success) {
        setError(result.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20 mb-1">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            ระบบบันทึกและส่งต่อ ANC คุณภาพ
          </h1>
          <p className="text-sm text-slate-600">
            PCU รพ.โพนนาแก้ว ⇄ ANC รพ.สกลนคร • สมุดสุขภาพแม่และเด็ก (2568)
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100/80 text-teal-800 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>เข้าสู่ระบบเพื่อความปลอดภัย (User Authentication)</span>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้งาน..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="กรอกรหัสผ่าน..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>กำลังตรวจสอบข้อมูล...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              ฐานข้อมูลคลาวด์ Firebase Firestore
            </span>
            <span className="text-3xs text-slate-400">ANC PCU โพนนาแก้ว</span>
          </div>
        </div>

      </div>
    </div>
  );
};
