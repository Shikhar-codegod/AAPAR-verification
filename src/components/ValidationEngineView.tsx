import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VALIDATION_RULES, validateStudentRecord, runValidationSanityChecks, RuleDefinition } from '../services/validationEngine';
import { mockApaarRegistry } from '../services/apaarRegistry';
import { Student, ValidationResult } from '../types';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Shield,
  BookOpen,
  HelpCircle,
  Sparkles,
  Terminal,
  Cpu,
} from 'lucide-react';

export const ValidationEngineView: React.FC = () => {
  const { students, institutions } = useApp();

  // Test sandbox state
  const [testApaar, setTestApaar] = useState<string>('100000000137');
  const [testName, setTestName] = useState<string>('Aarav Sharma');
  const [testDob, setTestDob] = useState<string>('2005-04-12');
  const [testInstId, setTestInstId] = useState<string>(institutions[0]?.id || 'inst-001');
  const [testYear, setTestYear] = useState<number>(2026);
  const [testIsFN, setTestIsFN] = useState<boolean>(false);
  const [testIsOCI, setTestIsOCI] = useState<boolean>(false);
  const [testIsSuper, setTestIsSuper] = useState<boolean>(false);
  const [testSponsor, setTestSponsor] = useState<string>('Father');

  const [sandboxResult, setSandboxResult] = useState<ValidationResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Sanity checks run state
  const [sanityTestState, setSanityTestState] = useState<{
    ran: boolean;
    passed: boolean;
    testResults: { name: string; passed: boolean; message: string }[];
  }>({
    ran: true,
    ...runValidationSanityChecks(),
  });

  const handleRunSandbox = () => {
    const inst = institutions.find((i) => i.id === testInstId) || institutions[0];
    const candidate: Partial<Student> = {
      apaarId: testApaar,
      name: testName,
      dob: testDob,
      institutionId: inst.id,
      institutionName: inst.name,
      programId: inst.programs[0]?.id,
      programName: inst.programs[0]?.name,
      admissionYear: testYear,
      admissionDate: `${testYear}-08-15`,
      isForeignNational: testIsFN,
      isOCI: testIsOCI,
      isSupernumerary: testIsSuper,
      sponsorCategory: testSponsor as any,
    };

    const res = validateStudentRecord(candidate, {
      existingStudents: students,
      institutions,
      academicYear: testYear,
    });

    setSandboxResult(res);
  };

  const handleRerunSanityChecks = () => {
    const res = runValidationSanityChecks();
    setSanityTestState({
      ran: true,
      passed: res.passed,
      testResults: res.testResults,
    });
  };

  const filteredRules = activeCategory === 'ALL'
    ? VALIDATION_RULES
    : VALIDATION_RULES.filter((r) => r.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#0FA3A3] uppercase">
            <Cpu className="w-4 h-4" />
            <span>AICTE-SVRS Engine Specification 2026</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">Multi-Tier Validation &amp; Compliance Engine</h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            A shared, deterministic rule matrix enforcing 12-digit APAAR validity, national registry reconciliation,
            anti-ghost enrolment filters, and statutory intake ceiling compliance.
          </p>
        </div>

        {/* Unit Test Indicator */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <Terminal className="w-4 h-4 text-slate-600" />
          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>Unit Sanity Suite:</span>
              <span className={sanityTestState.passed ? 'text-emerald-600' : 'text-red-600'}>
                {sanityTestState.passed ? 'ALL PASSED (3/3)' : 'FAILURES DETECTED'}
              </span>
            </div>
            <button
              onClick={handleRerunSanityChecks}
              className="text-[11px] text-[#0A7373] hover:underline font-medium"
            >
              Re-run Unit Sanity Checks
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Engine Sandbox */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F28C28]" />
              Live Validation Engine Sandbox
            </h3>
            <p className="text-xs text-slate-500">
              Test any custom student record or edge case against the central registry and regulatory matrix.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTestApaar('9876543'); // 7 digits (fail format)
                setTestName('Siddharth Mehta');
                setTestDob('2014-05-10'); // under 16
                setTestIsFN(true);
                setTestIsOCI(true); // conflict
              }}
              className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
            >
              Load Inconsistent Case
            </button>
            <button
              onClick={() => {
                setTestApaar('100000000137');
                setTestName('Aarav Sharma');
                setTestDob('2005-04-12');
                setTestIsFN(false);
                setTestIsOCI(false);
              }}
              className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
            >
              Load Valid Case
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">APAAR ID (12 Digits)</label>
            <input
              type="text"
              value={testApaar}
              onChange={(e) => setTestApaar(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-[#0FA3A3]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Candidate Name</label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0FA3A3]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              value={testDob}
              onChange={(e) => setTestDob(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0FA3A3]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Institution</label>
            <select
              value={testInstId}
              onChange={(e) => setTestInstId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0FA3A3] truncate"
            >
              {institutions.slice(0, 15).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={testIsFN}
                onChange={(e) => setTestIsFN(e.target.checked)}
                className="rounded text-[#0FA3A3]"
              />
              <span>Foreign National (FN)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={testIsOCI}
                onChange={(e) => setTestIsOCI(e.target.checked)}
                className="rounded text-[#0FA3A3]"
              />
              <span>Overseas Citizen of India (OCI)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={testIsSuper}
                onChange={(e) => setTestIsSuper(e.target.checked)}
                className="rounded text-[#0FA3A3]"
              />
              <span>Supernumerary Seat</span>
            </label>
          </div>

          <button
            onClick={handleRunSandbox}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#0B2A4A] hover:bg-[#103B66] text-white font-bold text-xs rounded-lg shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute Engine Evaluation</span>
          </button>
        </div>

        {/* Live Evaluation Output */}
        {sandboxResult && (
          <div className="mt-3 p-4 rounded-xl border bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Evaluation Result:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    sandboxResult.status === 'Error'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : sandboxResult.status === 'Warning'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {sandboxResult.status} ({sandboxResult.isValid ? 'Approved' : 'Rejected'})
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {sandboxResult.issues.length} Issue(s) Recorded
              </span>
            </div>

            {sandboxResult.issues.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium">
                ✓ Candidate passes all 10 regulatory &amp; APAAR registry verification checks without flags.
              </p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {sandboxResult.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-xs border ${
                      issue.severity === 'Error'
                        ? 'bg-red-50 text-red-900 border-red-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{issue.ruleTitle}</span>
                      <span className="font-mono text-[10px] px-1 bg-white rounded border">
                        {issue.code}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5">{issue.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rule Directory */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0B2A4A]" />
              Official Statutory Rule Repository
            </h3>
            <p className="text-xs text-slate-500">
              Standardized regulatory definitions with legal citations from NEP 2020 and AICTE APH 2025–26.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs">
            {['ALL', 'Identity', 'Enrolment', 'Intake Cap', 'Regulatory Eligibility'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{rule.title}</span>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {rule.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                    {rule.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      rule.severity === 'Error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rule.severity}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600">{rule.description}</p>

              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <span className="text-slate-500 font-semibold">Statutory Reference:</span>
                <span>{rule.regulatoryReference}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
