import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PatientRegistryView } from './components/PatientRegistryView';
import { FirstAncFormModal } from './components/FirstAncFormModal';
import { AncVisitsView } from './components/AncVisitsView';
import { RiskTriageView } from './components/RiskTriageView';
import { ReferralCenterView } from './components/ReferralCenterView';
import { ReferralRegistryView } from './components/ReferralRegistryView';
import { AuditLogView } from './components/AuditLogView';
import { LoginView } from './components/LoginView';
import { EditPatientModal } from './components/EditPatientModal';
import { GlobalPatientBar } from './components/GlobalPatientBar';

const AppContent: React.FC = () => {
  const { activeTab, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Top Navigation Header */}
      <Header />

      {/* Global Patient Bar: Quick Search, Selection, and Edit from any page */}
      <GlobalPatientBar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-3 sm:p-5 gap-5">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content View */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'registry' && <PatientRegistryView />}
          {activeTab === 'referral_registry' && <ReferralRegistryView />}
          {activeTab === 'first_anc' && <FirstAncFormModal />}
          {activeTab === 'visits' && <AncVisitsView />}
          {activeTab === 'risk_triage' && <RiskTriageView />}
          {activeTab === 'referral_center' && <ReferralCenterView />}
          {activeTab === 'followup' && <ReferralRegistryView />}
          {(activeTab === 'audit_logs' || activeTab === 'audit_log') && <AuditLogView />}
        </main>
      </div>

      {/* Universal Edit Patient Modal accessible from any page */}
      <EditPatientModal />

      {/* Footer */}
      <footer className="no-print mt-auto py-4 text-center text-3xs text-slate-400 border-t border-slate-200 bg-white">
        ระบบบันทึกข้อมูลฝากครรภ์และส่งต่อต่อเนื่อง ANC PCU รพ.โพนนาแก้ว ⇄ ANC รพ.สกลนคร • มาตรฐานสมุดบันทึกสุขภาพแม่และเด็ก (2568)
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
