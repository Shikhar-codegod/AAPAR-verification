import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { ShieldCheck, UserCheck, School, Building2, User, RefreshCw, Play, AlertTriangle } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    demoStatus,
    runDemoStory,
    resetAllData,
    openFlagsCount,
    institutionsOverIntakeCount,
    institutions,
    selectedInstitutionId,
    setSelectedInstitutionId,
  } = useApp();

  const roles: { id: Role; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'aicte_admin', label: 'AICTE Admin', icon: <Building2 className="w-4 h-4" />, desc: 'Apex National Regulatory View' },
    { id: 'institution_admin', label: 'Institution Admin', icon: <School className="w-4 h-4" />, desc: 'College Enrolment & Compliance' },
    { id: 'verifier', label: 'Employer / Verifier', icon: <UserCheck className="w-4 h-4" />, desc: 'Consent-based Credentials Check' },
    { id: 'student', label: 'Student / Citizen', icon: <User className="w-4 h-4" />, desc: 'APAAR Identity & Consent Inbox' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Synthetic Data Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-amber-600">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-slate-950" />
          <span>
            PROTOTYPE WITH SYNTHETIC DATA. NOT REAL STUDENT DATA. Built for Smart India Hackathon 2026 (Problem Statement: APAAR-based Student Verification & Records System).
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
          <span className="bg-amber-600/30 px-2 py-0.5 rounded">Active Flags: {openFlagsCount}</span>
          <span className="bg-amber-600/30 px-2 py-0.5 rounded">Institutions Over Intake: {institutionsOverIntakeCount}</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and National Gov Emblem styling */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0B2A4A] flex items-center justify-center text-white shadow-sm border border-slate-700 shrink-0">
            <div className="text-center font-bold tracking-tight text-xs leading-tight">
              <span className="text-[#F28C28]">AICTE</span>
              <br />
              <span className="text-[#0FA3A3] text-[9px]">SVRS</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#0B2A4A] tracking-tight">
                AICTE-SVRS
              </h1>
              <span className="bg-[#E6F7F7] text-[#0A7373] text-[10px] font-bold px-2 py-0.5 rounded border border-[#0FA3A3]/30 tracking-wide uppercase">
                SIH 2026
              </span>
            </div>
            <p className="text-xs text-slate-550 hidden sm:block">
              APAAR-based Student Verification &amp; Records System
            </p>
          </div>
        </div>

        {/* Demo Mode & Quick Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {role === 'institution_admin' && (
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="inst-select" className="text-slate-600 font-medium hidden md:inline">
                College:
              </label>
              <select
                id="inst-select"
                aria-label="Select College"
                value={selectedInstitutionId}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 font-medium text-slate-800 max-w-[220px] truncate focus:outline-none focus:ring-2 focus:ring-[#0FA3A3]"
              >
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.state})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Demo Story button */}
          <button
            onClick={runDemoStory}
            disabled={demoStatus.isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors ${
              demoStatus.isRunning
                ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-wait'
                : 'bg-[#0B2A4A] hover:bg-[#103B66] text-white border border-[#0B2A4A]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${demoStatus.isRunning ? 'animate-spin' : 'fill-current'}`} />
            <span>{demoStatus.isRunning ? 'Running Demo...' : 'Demo Mode'}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={resetAllData}
            title="Reset in-memory dataset to initial pristine state"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Role Switcher Pill Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {roles.map((r) => {
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  title={r.desc}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-white text-[#0B2A4A] shadow-xs font-semibold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={isActive ? 'text-[#0FA3A3]' : 'text-slate-400'}>{r.icon}</span>
                  <span className="hidden md:inline">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Demo Notification Status Banner (if running) */}
      {demoStatus.message && (
        <div className="bg-sky-50 border-t border-sky-200 px-4 py-2 text-xs text-sky-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
            </span>
            <span className="font-semibold">Demo Scenario:</span>
            <span>{demoStatus.message}</span>
          </div>
          <span className="font-mono text-[11px] bg-sky-100 px-2 py-0.5 rounded text-sky-800">
            Step {demoStatus.step}/4
          </span>
        </div>
      )}
    </header>
  );
};
