import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, ValidationIssue } from '../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  AlertTriangle,
  Building,
  Copy,
  Search,
  Filter,
  ChevronRight,
  X,
  CheckCircle,
  FileSpreadsheet,
  AlertOctagon,
  Sparkles,
  Info,
} from 'lucide-react';

export const AicteDashboard: React.FC = () => {
  const {
    students,
    institutions,
    stateUtilisations,
    totalVerifiedRecords,
    openFlagsCount,
    institutionsOverIntakeCount,
    crossInstitutionDuplicatesCount,
    runDemoStory,
    demoStatus,
  } = useApp();

  // Filters for flagged records table
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeDrillDownStudent, setActiveDrillDownStudent] = useState<Student | null>(null);

  // 1. Chart Data: Approved Intake vs Actual Enrolment by State
  const stateChartData = useMemo(() => {
    return stateUtilisations.map((su) => ({
      state: su.state.length > 9 ? su.state.substring(0, 9) + '..' : su.state,
      fullName: su.state,
      approvedIntake: su.approvedIntake,
      actualEnrolment: su.regularAdmissions + su.supernumeraryAdmissions,
      regularAdmissions: su.regularAdmissions,
      supernumerary: su.supernumeraryAdmissions,
      utilisationRate: su.utilisationRate,
    }));
  }, [stateUtilisations]);

  // 2. Chart Data: Monthly Admissions Timeline
  const monthlyData = useMemo(() => {
    const months = [
      { month: 'Jun 2026', count: 0 },
      { month: 'Jul 2026', count: 0 },
      { month: 'Aug 2026', count: 0 },
      { month: 'Sep 2026', count: 0 },
      { month: 'Oct 2026', count: 0 },
      { month: 'Nov 2026', count: 0 },
    ];

    students.forEach((s) => {
      if (!s.admissionDate) return;
      const m = new Date(s.admissionDate).getMonth(); // 0-11
      if (m === 5) months[0].count++;
      else if (m === 6) months[1].count++;
      else if (m === 7) months[2].count++;
      else if (m === 8) months[3].count++;
      else if (m === 9) months[4].count++;
      else if (m === 10) months[5].count++;
    });

    return months;
  }, [students]);

  // 3. Chart Data: Category, NRI, OCI, FN Distribution
  const categoryMixData = useMemo(() => {
    const states = ['Maharashtra', 'Tamil Nadu', 'Karnataka', 'Uttar Pradesh', 'Delhi'];
    return states.map((state) => {
      const stateStudents = students.filter((s) => s.state === state);
      return {
        state: state.substring(0, 6),
        fullName: state,
        General: stateStudents.filter((s) => s.category === 'General').length,
        OBC: stateStudents.filter((s) => s.category === 'OBC-NCL').length,
        SC_ST_EWS: stateStudents.filter((s) => ['SC', 'ST', 'EWS'].includes(s.category)).length,
        NRI_OCI_FN: stateStudents.filter((s) => s.isNRI || s.isOCI || s.isForeignNational).length,
      };
    });
  }, [students]);

  // 4. Funnel Metrics: Uploaded -> Format Valid -> APAAR Verified -> Duplicate-Free -> Accepted
  const funnelMetrics = useMemo(() => {
    const total = students.length;
    const formatValid = students.filter(
      (s) => !s.validationIssues.some((i) => i.code === 'ERR_APAAR_FORMAT')
    ).length;
    const apaarVerified = students.filter(
      (s) => !s.validationIssues.some((i) => i.code === 'ERR_APAAR_NOT_FOUND' || i.code === 'ERR_APAAR_FORMAT')
    ).length;
    const duplicateFree = students.filter(
      (s) =>
        !s.validationIssues.some(
          (i) => i.code === 'ERR_INTRA_DUPLICATE' || i.code === 'ERR_CROSS_INST_DUPLICATE'
        )
    ).length;
    const fullyAccepted = totalVerifiedRecords;

    return [
      { stage: '1. Uploaded Records', count: total, pct: 100, color: 'bg-slate-700' },
      { stage: '2. Format Valid (12-Digit)', count: formatValid, pct: +((formatValid / total) * 100).toFixed(1), color: 'bg-indigo-700' },
      { stage: '3. National APAAR Verified', count: apaarVerified, pct: +((apaarVerified / total) * 100).toFixed(1), color: 'bg-sky-700' },
      { stage: '4. Duplicate-Free (Cross/Intra)', count: duplicateFree, pct: +((duplicateFree / total) * 100).toFixed(1), color: 'bg-teal-700' },
      { stage: '5. Fully Accepted & Verified', count: fullyAccepted, pct: +((fullyAccepted / total) * 100).toFixed(1), color: 'bg-emerald-700' },
    ];
  }, [students, totalVerifiedRecords]);

  // Flagged students filtered
  const flaggedStudents = useMemo(() => {
    return students.filter((s) => {
      const isFlagged = s.verificationStatus === 'Error' || s.verificationStatus === 'Warning';
      if (!isFlagged) return false;

      if (selectedStateFilter !== 'ALL' && s.state !== selectedStateFilter) return false;
      if (selectedInstFilter !== 'ALL' && s.institutionId !== selectedInstFilter) return false;
      if (selectedSeverityFilter !== 'ALL' && s.verificationStatus !== selectedSeverityFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchApaar = s.apaarId.includes(q);
        const matchInst = s.institutionName.toLowerCase().includes(q);
        const matchRule = s.validationIssues.some((i) => i.ruleTitle.toLowerCase().includes(q));
        if (!matchName && !matchApaar && !matchInst && !matchRule) return false;
      }

      return true;
    });
  }, [students, selectedStateFilter, selectedInstFilter, selectedSeverityFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Demo Mode trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0B2A4A] to-[#103B66] text-white p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0FA3A3]">
            <span>National Regulatory Control</span>
            <span>•</span>
            <span>Apex Directorate</span>
          </div>
          <h2 className="text-xl font-bold mt-0.5">Central Academic Enrolment &amp; Compliance Hub</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time monitoring across 40 AICTE-approved institutions in 10 states. Enforcing APAAR ID validation,
            sanctioned intake caps, and cross-institutional dual enrolment prevention.
          </p>
        </div>

        <button
          onClick={runDemoStory}
          disabled={demoStatus.isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-[#0FA3A3] hover:bg-[#0A7373] text-white font-semibold text-xs rounded-lg shadow-sm transition-all shrink-0 self-start sm:self-center"
        >
          <Sparkles className="w-4 h-4" />
          <span>{demoStatus.isRunning ? 'Running Demo...' : 'Run Demo Story'}</span>
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Verified */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Records</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalVerifiedRecords.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Clean &amp; Registry-Backed</span>
            <span className="font-semibold text-emerald-600 font-mono">
              {((totalVerifiedRecords / (students.length || 1)) * 100).toFixed(1)}% clean
            </span>
          </div>
        </div>

        {/* Open Flags */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Flags</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {openFlagsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Pending Review / Hold</span>
            <span className="font-semibold text-amber-600 font-mono">
              {students.filter((s) => s.verificationStatus === 'Error').length} Critical Errors
            </span>
          </div>
        </div>

        {/* Institutions Over Intake */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Institutions Over Intake</span>
            <div className="p-2 bg-red-50 text-red-700 rounded-lg">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {institutionsOverIntakeCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Exceeded Regular Cap</span>
            <span className="text-red-600 font-semibold text-[11px]">Notice Mandated</span>
          </div>
        </div>

        {/* Cross-Institution Duplicates */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cross-College Duplicates</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Copy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-700">
            {crossInstitutionDuplicatesCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Dual Enrolment Violations</span>
            <span className="font-mono text-indigo-600 font-semibold">2026 Session</span>
          </div>
        </div>
      </div>

      {/* Charts Grid - 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: State Intake vs Enrolment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Approved Intake vs Actual Enrolment by State</h3>
            <p className="text-xs text-slate-500">
              Takeaway: Capacity utilisation remains healthy (88-96%) across major technical education clusters with occasional overshoots.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold text-[#0FA3A3]">{data.fullName}</p>
                          <p>Approved Intake: <span className="font-mono">{data.approvedIntake}</span></p>
                          <p>Regular Admissions: <span className="font-mono">{data.regularAdmissions}</span></p>
                          <p>Supernumerary Quota: <span className="font-mono">{data.supernumerary}</span></p>
                          <p>Total Enrolment: <span className="font-mono">{data.actualEnrolment}</span></p>
                          <p className="font-semibold text-amber-300">Utilisation: {data.utilisationRate}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="approvedIntake" name="Approved Intake" fill="#0B2A4A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="actualEnrolment" name="Actual Enrolment" fill="#0FA3A3" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Admissions Timeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Admissions by Month (Academic Session 2026)</h3>
            <p className="text-xs text-slate-500">
              Takeaway: Peak counselling rounds in July-August account for over 72% of total state admissions.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg">
                          <p className="font-bold text-teal-300">{payload[0].payload.month}</p>
                          <p>Total Admissions: <span className="font-mono font-bold">{payload[0].value}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Admissions Enrolled"
                  stroke="#F28C28"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0B2A4A', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Stacked Bar Category & Quota Mix */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Category &amp; Special Quota Mix by Top Technical States</h3>
            <p className="text-xs text-slate-500">
              Takeaway: Reserved &amp; social equity categories comprise ~65% of intake; NRI/FN admissions remain within safe caps.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryMixData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold text-teal-300">{d.fullName}</p>
                          <p>General: {d.General}</p>
                          <p>OBC-NCL: {d.OBC}</p>
                          <p>SC / ST / EWS: {d.SC_ST_EWS}</p>
                          <p>NRI / OCI / Foreign Nat: {d.NRI_OCI_FN}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="General" stackId="a" fill="#0B2A4A" name="General" />
                <Bar dataKey="OBC" stackId="a" fill="#0FA3A3" name="OBC-NCL" />
                <Bar dataKey="SC_ST_EWS" stackId="a" fill="#256EB3" name="SC/ST/EWS" />
                <Bar dataKey="NRI_OCI_FN" stackId="a" fill="#F28C28" name="NRI/OCI/FN" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Funnel of Records Validation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">National Record Verification Funnel</h3>
            <p className="text-xs text-slate-500 mb-4">
              Takeaway: 97.4% pass format check; drop-offs occur at APAAR registry existence and dual enrolments.
            </p>

            <div className="space-y-3">
              {funnelMetrics.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.stage}</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {item.count.toLocaleString()} ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${Math.max(item.pct, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Automated Zero-Tamper Verification
            </span>
            <span className="font-mono">Total Monitored: {students.length}</span>
          </div>
        </div>
      </div>

      {/* State-Wise Heat Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">State-Wise Capacity Utilisation Heat Table</h3>
            <p className="text-xs text-slate-500">
              Colour-coded utilisation benchmarks: Green (90–100%), Yellow (&lt;75%), Red Alert (&gt;100% capacity overshoot).
            </p>
          </div>
          <span className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-slate-200 font-semibold text-slate-700">
            10 States Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4 text-center">Colleges</th>
                <th className="py-2.5 px-4 text-right">Approved Intake</th>
                <th className="py-2.5 px-4 text-right">Regular Admitted</th>
                <th className="py-2.5 px-4 text-right">Supernumerary</th>
                <th className="py-2.5 px-4 text-right">Total Students</th>
                <th className="py-2.5 px-4 text-center">Utilisation</th>
                <th className="py-2.5 px-4 text-center">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stateUtilisations.map((su) => {
                // Determine colour indicator
                let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
                if (su.utilisationRate > 100) {
                  badgeClass = 'bg-red-50 text-red-700 border-red-300 font-bold';
                } else if (su.utilisationRate < 75) {
                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-300';
                }

                return (
                  <tr key={su.state} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{su.state}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">{su.institutionsCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{su.approvedIntake}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-800 font-medium">
                      {su.regularAdmissions}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      {su.supernumeraryAdmissions}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-900 font-bold">
                      {su.totalAdmissions}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono border ${badgeClass}`}>
                        {su.utilisationRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {su.flaggedCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          {su.flaggedCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flagged Records Table with Filters & Drill-down */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                Active Flagged Records Queue
              </h3>
              <p className="text-xs text-slate-500">
                Filtered review queue for regulatory discrepancies and duplicate admission prevention.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Showing {flaggedStudents.length} flags
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Student, APAAR or Rule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0FA3A3]"
              />
            </div>

            {/* State Filter */}
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0FA3A3]"
            >
              <option value="ALL">All States (10)</option>
              {stateUtilisations.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state}
                </option>
              ))}
            </select>

            {/* Institution Filter */}
            <select
              value={selectedInstFilter}
              onChange={(e) => setSelectedInstFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0FA3A3] truncate"
            >
              <option value="ALL">All Institutions (40)</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0FA3A3]"
            >
              <option value="ALL">All Severities</option>
              <option value="Error">Critical Errors Only</option>
              <option value="Warning">Warnings Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Student &amp; APAAR</th>
                <th className="py-2.5 px-4">Institution &amp; Program</th>
                <th className="py-2.5 px-4">Flag Category</th>
                <th className="py-2.5 px-4">Primary Regulatory Reason</th>
                <th className="py-2.5 px-4 text-center">Severity</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flaggedStudents.slice(0, 50).map((student) => {
                const primaryIssue = student.validationIssues[0];
                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-800">{student.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {student.apaarId || '<MISSING APAAR>'}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 truncate" title={student.institutionName}>
                        {student.institutionName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{student.programName}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {primaryIssue?.ruleTitle || 'Discrepancy'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 max-w-sm">
                      <p className="text-slate-600 text-[11px] leading-snug line-clamp-2">
                        {primaryIssue?.message || 'Verification anomaly detected'}
                      </p>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          student.verificationStatus === 'Error'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {student.verificationStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setActiveDrillDownStudent(student)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0FA3A3] hover:text-[#0A7373] hover:underline"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {flaggedStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No flagged records match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down Side Panel (Modal / Drawer) */}
      {activeDrillDownStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <AlertOctagon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Regulatory Flag Drill-down</h3>
                    <p className="text-xs text-slate-500 font-mono">Record ID: {activeDrillDownStudent.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDrillDownStudent(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Candidate Metadata */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Candidate Name</span>
                    <p className="font-semibold text-slate-900 text-sm">{activeDrillDownStudent.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">12-Digit APAAR ID</span>
                    <p className="font-mono font-bold text-slate-900">
                      {activeDrillDownStudent.apaarId || 'MISSING'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Date of Birth</span>
                    <p className="font-medium text-slate-800">{activeDrillDownStudent.dob}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Gender &amp; Category</span>
                    <p className="font-medium text-slate-800">
                      {activeDrillDownStudent.gender} • {activeDrillDownStudent.category}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Institution</span>
                    <p className="font-medium text-slate-800">{activeDrillDownStudent.institutionName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Program &amp; Session</span>
                    <p className="font-medium text-slate-800">
                      {activeDrillDownStudent.programName} ({activeDrillDownStudent.admissionYear})
                    </p>
                  </div>
                </div>
              </div>

              {/* Detected Regulatory Issues */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Detected Violations ({activeDrillDownStudent.validationIssues.length})
                </h4>
                {activeDrillDownStudent.validationIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      issue.severity === 'Error'
                        ? 'bg-red-50/70 border-red-200 text-red-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{issue.ruleTitle}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-white border">
                        {issue.code}
                      </span>
                    </div>
                    <p className="text-xs">{issue.message}</p>
                  </div>
                ))}
              </div>

              {/* Regulatory Notice & Recommended Actions */}
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-xs text-sky-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-sky-700" />
                  <span>Standard Regulatory Recourse</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  As per AICTE Academic Compliance Policy, institutions are served a 7-day electronic cure notice.
                  Dual enrolments require student choice affidavit; intake overshoots require statutory supernumerary reclassification.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveDrillDownStudent(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Electronic Notice generated and dispatched to Registrar of ${activeDrillDownStudent.institutionName} regarding APAAR discrepancy.`);
                  setActiveDrillDownStudent(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0B2A4A] hover:bg-[#103B66] rounded-md shadow-xs"
              >
                Issue Notice to College
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
