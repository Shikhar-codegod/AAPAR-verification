import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  ShieldAlert,
  CheckCircle2,
  Lock,
  FileText,
  Award,
  History,
  Sliders,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role, activeScreen, setActiveScreen, openFlagsCount, institutionsOverIntakeCount } = useApp();

  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
    allowedRoles: string[];
  }

  const navItems: NavItem[] = [
    {
      id: 'aicte_dashboard',
      label: 'AICTE Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['aicte_admin'],
    },
    {
      id: 'anomaly_risk',
      label: 'Anomaly & Risk Scores',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: institutionsOverIntakeCount > 0 ? `${institutionsOverIntakeCount} at risk` : undefined,
      badgeColor: 'bg-red-100 text-red-700',
      allowedRoles: ['aicte_admin', 'institution_admin'],
    },
    {
      id: 'institution_portal',
      label: 'Institution Portal',
      icon: <Building2 className="w-4 h-4" />,
      badge: openFlagsCount > 0 ? `${openFlagsCount} flags` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      allowedRoles: ['aicte_admin', 'institution_admin'],
    },
    {
      id: 'validation_engine',
      label: 'Validation Engine',
      icon: <Sliders className="w-4 h-4" />,
      allowedRoles: ['aicte_admin', 'institution_admin'],
    },
    {
      id: 'consent_verification',
      label: 'Verification & Consent',
      icon: <Lock className="w-4 h-4" />,
      allowedRoles: ['aicte_admin', 'verifier', 'student'],
    },
    {
      id: 'certificate_preview',
      label: 'Certificate Preview',
      icon: <Award className="w-4 h-4" />,
      allowedRoles: ['aicte_admin', 'student'],
    },
    {
      id: 'audit_ledger',
      label: 'Chained Audit Ledger',
      icon: <History className="w-4 h-4" />,
      allowedRoles: ['aicte_admin', 'verifier'],
    },
    {
      id: 'reports',
      label: 'Reports & Exports',
      icon: <FileText className="w-4 h-4" />,
      allowedRoles: ['aicte_admin', 'institution_admin'],
    },
  ];

  // Filter by active role
  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 no-print">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation ({role.replace('_', ' ')})
        </div>

        {visibleItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-[#0B2A4A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[#0FA3A3]' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/50">
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] space-y-1">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>APAAR / ABC Node</span>
            <span className="flex items-center gap-1 text-[#0A7373]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0FA3A3] animate-pulse"></span>
              Live Gateway
            </span>
          </div>
          <p className="text-slate-500 text-[10px] leading-tight">
            Cryptographic SHA-256 Ledger Active. State stores 40 colleges across 10 regions.
          </p>
        </div>

        <div className="text-[10px] text-slate-400 text-center font-mono">
          AICTE-SVRS v2.6.4 • SIH 2026
        </div>
      </div>
    </aside>
  );
};
