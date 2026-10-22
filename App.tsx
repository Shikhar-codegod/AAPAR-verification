import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AicteDashboard } from './components/AicteDashboard';
import { InstitutionPortal } from './components/InstitutionPortal';
import { ValidationEngineView } from './components/ValidationEngineView';
import { AnomalyRiskView } from './components/AnomalyRiskView';
import { VerificationPortal } from './components/VerificationPortal';
import { CertificatePreview } from './components/CertificatePreview';
import { AuditLedgerView } from './components/AuditLedgerView';
import { ReportsView } from './components/ReportsView';
import { StudentPortal } from './components/StudentPortal';

const MainLayout: React.FC = () => {
  const { role, activeScreen, setActiveScreen } = useApp();

  // Guard active screen to ensure role-appropriate view
  useEffect(() => {
    if (role === 'student' && activeScreen !== 'student_consent' && activeScreen !== 'certificate_preview') {
      setActiveScreen('student_consent');
    } else if (role === 'verifier' && activeScreen !== 'consent_verification' && activeScreen !== 'audit_ledger') {
      setActiveScreen('consent_verification');
    } else if (
      role === 'institution_admin' &&
      !['institution_portal', 'validation_engine', 'anomaly_risk', 'reports'].includes(activeScreen)
    ) {
      setActiveScreen('institution_portal');
    }
  }, [role, activeScreen, setActiveScreen]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Header />

      <div className="flex grow">
        <Sidebar />

        <main className="grow p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {activeScreen === 'aicte_dashboard' && <AicteDashboard />}
          {activeScreen === 'institution_portal' && <InstitutionPortal />}
          {activeScreen === 'validation_engine' && <ValidationEngineView />}
          {activeScreen === 'anomaly_risk' && <AnomalyRiskView />}
          {activeScreen === 'consent_verification' && <VerificationPortal />}
          {activeScreen === 'student_consent' && <StudentPortal />}
          {activeScreen === 'certificate_preview' && <CertificatePreview />}
          {activeScreen === 'audit_ledger' && <AuditLedgerView />}
          {activeScreen === 'reports' && <ReportsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
