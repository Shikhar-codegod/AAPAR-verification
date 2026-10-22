import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, Program, ValidationResult, Category, QuotaType, SponsorCategory } from '../types';
import {
  Upload,
  FileDown,
  PlusCircle,
  AlertOctagon,
  CheckCircle,
  AlertTriangle,
  PieChart as PieIcon,
  Send,
  Building,
  RefreshCw,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const InstitutionPortal: React.FC = () => {
  const {
    currentInstitution,
    institutions,
    selectedInstitutionId,
    setSelectedInstitutionId,
    students,
    addSingleStudent,
    batchValidateDrafts,
    commitValidBatch,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');

  // Single Student Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    apaarId: '',
    name: '',
    dob: '2006-05-15',
    gender: 'Male',
    programId: currentInstitution.programs[0]?.id || '',
    admissionYear: 2026,
    admissionDate: '2026-08-10',
    category: 'General',
    quotaType: 'State Merit',
    isNRI: false,
    isOCI: false,
    isForeignNational: false,
    isSupernumerary: false,
    sponsorCategory: 'None',
  });

  const [formValidationResult, setFormValidationResult] = useState<ValidationResult | null>(null);
  const [formSubmittedSuccess, setFormSubmittedSuccess] = useState(false);

  // Batch Upload State
  const [batchDrafts, setBatchDrafts] = useState<Array<{ candidate: Partial<Student>; result: ValidationResult }>>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [committedCount, setCommittedCount] = useState<number | null>(null);

  // Seat Utilisation Data per program
  const programUtilisation = useMemo(() => {
    const instStudents = students.filter((s) => s.institutionId === currentInstitution.id);

    return currentInstitution.programs.map((prog) => {
      const progStudents = instStudents.filter((s) => s.programId === prog.id);
      const regularAdmitted = progStudents.filter((s) => !s.isSupernumerary).length;
      const supernumeraryAdmitted = progStudents.filter((s) => s.isSupernumerary).length;
      const isExceeded = regularAdmitted > prog.approvedIntake;
      const excessSeats = Math.max(0, regularAdmitted - prog.approvedIntake);
      const vacantRegular = Math.max(0, prog.approvedIntake - regularAdmitted);

      const chartData = [
        { name: 'Regular Admissions', value: regularAdmitted, fill: isExceeded ? '#DC2626' : '#0B2A4A' },
        { name: 'Supernumerary Quota', value: supernumeraryAdmitted, fill: '#0FA3A3' },
        { name: 'Available Regular Seats', value: vacantRegular, fill: '#E2E8F0' },
      ];

      return {
        prog,
        regularAdmitted,
        supernumeraryAdmitted,
        totalAdmitted: regularAdmitted + supernumeraryAdmitted,
        isExceeded,
        excessSeats,
        vacantRegular,
        chartData,
      };
    });
  }, [currentInstitution, students]);

  // Handle Form Input Change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormSubmittedSuccess(false);
  };

  // Submit Single Student
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate: Partial<Student> = {
      ...formData,
      institutionId: currentInstitution.id,
      institutionName: currentInstitution.name,
      state: currentInstitution.state,
    };

    const res = addSingleStudent(candidate);
    setFormValidationResult(res);
    if (res.status === 'Valid' || res.status === 'Warning') {
      setFormSubmittedSuccess(true);
      setFormData((prev) => ({
        ...prev,
        apaarId: '',
        name: '',
      }));
    }
  };

  // Generate Sample CSV with valid, duplicate, and inconsistent rows for testing
  const handleDownloadSampleCSV = () => {
    const csvContent =
      'apaarId,name,dob,gender,programCode,admissionYear,category,quotaType,isNRI,isOCI,isForeignNational,isSupernumerary,sponsorCategory\n' +
      '100000000411,Kavya Sundaram,2005-04-18,Female,CSE,2026,General,State Merit,false,false,false,false,None\n' +
      '100000000548,Arunabh Chatterjee,2005-09-22,Male,ECE,2026,OBC-NCL,State Merit,false,false,false,false,None\n' +
      '100000000685,Fatima Begum,2005-11-14,Female,CSE,2026,General,Supernumerary,false,false,false,true,None\n' +
      '9876543,Rohan Mehta,2005-06-12,Male,MECH,2026,General,State Merit,false,false,false,false,None\n' +
      '100000000822,Tariq Al-Mansoor,2004-03-10,Male,CSE,2026,General,NRI,true,true,true,false,Father\n' +
      '100000000959,Chirag Deshmukh,2013-02-19,Male,ECE,2026,SC,State Merit,false,false,false,false,None\n' +
      '100000000411,Kavya Sundaram Duplicate,2005-04-18,Female,CSE,2026,General,State Merit,false,false,false,false,None\n' +
      '100000001096,Devika Nair,2005-07-28,Female,MECH,2026,General,NRI,true,false,false,false,None\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AICTE_Sample_Enrolment_${currentInstitution.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulated File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingBatch(true);
    setCommittedCount(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

      // Parse CSV rows
      const candidates: Partial<Student>[] = [];
      const progCse = currentInstitution.programs.find((p) => p.code === 'CSE') || currentInstitution.programs[0];
      const progEce = currentInstitution.programs.find((p) => p.code === 'ECE') || currentInstitution.programs[1];
      const progMe = currentInstitution.programs.find((p) => p.code === 'MECH') || currentInstitution.programs[2];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length < 5) continue;

        const [
          apaarId,
          name,
          dob,
          gender,
          programCode,
          admissionYearStr,
          category,
          quotaType,
          isNRIStr,
          isOCIStr,
          isFNStr,
          isSuperStr,
          sponsorCat,
        ] = parts;

        const targetProg =
          programCode === 'ECE' ? progEce : programCode === 'MECH' ? progMe : progCse;

        candidates.push({
          apaarId: apaarId || '',
          name: name || 'Uploaded Candidate',
          dob: dob || '2005-01-01',
          gender: (gender as 'Male' | 'Female' | 'Other') || 'Male',
          institutionId: currentInstitution.id,
          institutionName: currentInstitution.name,
          state: currentInstitution.state,
          programId: targetProg.id,
          programName: targetProg.name,
          admissionYear: parseInt(admissionYearStr, 10) || 2026,
          admissionDate: '2026-08-15',
          category: (category as Category) || 'General',
          quotaType: (quotaType as QuotaType) || 'State Merit',
          isNRI: isNRIStr?.toLowerCase() === 'true',
          isOCI: isOCIStr?.toLowerCase() === 'true',
          isForeignNational: isFNStr?.toLowerCase() === 'true',
          isSupernumerary: isSuperStr?.toLowerCase() === 'true',
          sponsorCategory: (sponsorCat as SponsorCategory) || undefined,
        });
      }

      // Batch validate against live validation engine
      const validated = batchValidateDrafts(candidates);
      setBatchDrafts(validated);
      setIsProcessingBatch(false);
    };

    reader.readAsText(file);
  };

  // Commit valid records
  const handleCommitValid = () => {
    const validRows: Student[] = [];
    let rejectedCount = 0;

    batchDrafts.forEach(({ candidate, result }) => {
      if (result.isValid) {
        validRows.push({
          id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          apaarId: candidate.apaarId || '',
          name: candidate.name || '',
          dob: candidate.dob || '2005-01-01',
          gender: candidate.gender || 'Male',
          institutionId: currentInstitution.id,
          institutionName: currentInstitution.name,
          state: currentInstitution.state,
          programId: candidate.programId || currentInstitution.programs[0].id,
          programName: candidate.programName || currentInstitution.programs[0].name,
          admissionYear: candidate.admissionYear || 2026,
          admissionDate: candidate.admissionDate || '2026-08-15',
          category: candidate.category || 'General',
          quotaType: candidate.quotaType || 'State Merit',
          isNRI: !!candidate.isNRI,
          isOCI: !!candidate.isOCI,
          isForeignNational: !!candidate.isForeignNational,
          isSupernumerary: !!candidate.isSupernumerary,
          sponsorCategory: candidate.sponsorCategory,
          status: 'Enrolled',
          verificationStatus: result.status,
          validationIssues: result.issues,
        });
      } else {
        rejectedCount++;
      }
    });

    commitValidBatch(validRows, rejectedCount);
    setCommittedCount(validRows.length);
  };

  // Export rejected error report
  const handleDownloadErrorReport = () => {
    const errorRows = batchDrafts.filter((d) => !d.result.isValid);
    if (errorRows.length === 0) return;

    let csv = 'APAAR_ID,Candidate_Name,Program,Reason_For_Rejection,Severity\n';
    errorRows.forEach(({ candidate, result }) => {
      const issueMsgs = result.issues.map((i) => `"${i.message}"`).join('; ');
      csv += `"${candidate.apaarId}","${candidate.name}","${candidate.programName}",${issueMsgs},"${result.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rejected_Records_Report_${currentInstitution.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validDraftsCount = batchDrafts.filter((d) => d.result.isValid).length;
  const invalidDraftsCount = batchDrafts.filter((d) => !d.result.isValid).length;

  return (
    <div className="space-y-6">
      {/* Institution Banner & Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-teal-50 text-[#0A7373] rounded-xl border border-[#0FA3A3]/20">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#0FA3A3] bg-[#E6F7F7] px-2 py-0.5 rounded border border-[#0FA3A3]/20">
                {currentInstitution.code}
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase">
                {currentInstitution.type} College • Est. {currentInstitution.establishedYear}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{currentInstitution.name}</h2>
            <p className="text-xs text-slate-500">
              {currentInstitution.city}, {currentInstitution.state} • Affiliated to State Technical Directorate
            </p>
          </div>
        </div>

        {/* Institution Switcher for Testing */}
        <div className="flex flex-col gap-1 text-right">
          <label htmlFor="inst-portal-select" className="text-[11px] text-slate-500 font-medium">Switch College View:</label>
          <select
            id="inst-portal-select"
            aria-label="Switch College View"
            value={selectedInstitutionId}
            onChange={(e) => {
              setSelectedInstitutionId(e.target.value);
              setBatchDrafts([]);
              setCommittedCount(null);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0FA3A3]"
          >
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.state})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seat Utilisation Cards per Program */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Seat Utilisation &amp; Intake Cap Compliance</h3>
            <p className="text-xs text-slate-500">
              Supernumerary seats (EWS, TFWS, NRI) are separated from the sanctioned regular intake.
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
            Academic Session 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {programUtilisation.map(({ prog, regularAdmitted, supernumeraryAdmitted, totalAdmitted, isExceeded, excessSeats, vacantRegular, chartData }) => (
            <div
              key={prog.id}
              className={`bg-white rounded-xl border p-4 shadow-xs relative transition-all ${
                isExceeded ? 'border-red-300 bg-red-50/20 ring-1 ring-red-400' : 'border-slate-200'
              }`}
            >
              {/* Alert Badge if Exceeded */}
              {isExceeded && (
                <div className="mb-2 bg-red-100 text-red-800 text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1.5 border border-red-200">
                  <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                  <span>ALERT: Exceeded Intake by +{excessSeats} Seats!</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {prog.code}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs mt-1 leading-snug">{prog.name}</h4>
                </div>
              </div>

              {/* Donut Chart & Numbers */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="h-24 w-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={28}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-xs space-y-1 grow">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Approved Regular:</span>
                    <span className="font-bold text-slate-900 font-mono">{prog.approvedIntake}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Regular Admitted:</span>
                    <span className={`font-bold font-mono ${isExceeded ? 'text-red-600' : 'text-slate-900'}`}>
                      {regularAdmitted}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#0A7373]">
                    <span>Supernumerary:</span>
                    <span className="font-bold font-mono">
                      {supernumeraryAdmitted} / {prog.supernumeraryQuota}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <span>Total Enrolled:</span>
                    <span className="font-mono">{totalAdmitted}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload or Manual Entry Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-[#0FA3A3] text-[#0B2A4A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Batch Upload Student Records (CSV)</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'border-[#0FA3A3] text-[#0B2A4A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Single Student Form Entry</span>
          </button>
        </div>

        {/* Tab 1: Batch Upload */}
        {activeTab === 'upload' && (
          <div className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Download Template or Upload Batch</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pre-formatted CSV including APAAR ID, DOB, citizenship flags, and quota allocations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSampleCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B2A4A] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#0FA3A3]" />
                  <span>Download Sample CSV</span>
                </button>

                <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B2A4A] hover:bg-[#103B66] rounded-lg cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isProcessingBatch ? 'Validating...' : 'Select CSV File'}</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Validation Preview Table */}
            {batchDrafts.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-bold text-slate-900">
                      Validation Preview ({batchDrafts.length} Rows Parsed)
                    </h4>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                      {validDraftsCount} Valid
                    </span>
                    <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-mono">
                      {invalidDraftsCount} Issues Found
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {invalidDraftsCount > 0 && (
                      <button
                        onClick={handleDownloadErrorReport}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Download Error Report</span>
                      </button>
                    )}

                    <button
                      onClick={handleCommitValid}
                      disabled={validDraftsCount === 0}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-lg shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Commit {validDraftsCount} Valid Records</span>
                    </button>
                  </div>
                </div>

                {committedCount !== null && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>
                      Successfully committed {committedCount} verified records into the national repository and chained audit ledger!
                    </span>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto max-h-80 border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Row</th>
                        <th className="py-2.5 px-3">APAAR ID</th>
                        <th className="py-2.5 px-3">Candidate Name</th>
                        <th className="py-2.5 px-3">Program</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Plain-Language Validation Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchDrafts.map(({ candidate, result }, idx) => (
                        <tr
                          key={idx}
                          className={
                            result.status === 'Error'
                              ? 'bg-red-50/40'
                              : result.status === 'Warning'
                              ? 'bg-amber-50/30'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-2 px-3 font-mono text-slate-500">#{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-medium text-slate-900">
                            {candidate.apaarId || '<EMPTY>'}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{candidate.name}</td>
                          <td className="py-2 px-3 text-slate-600">{candidate.programName}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                result.status === 'Error'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : result.status === 'Warning'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {result.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-700 text-[11px]">
                            {result.issues.length === 0 ? (
                              <span className="text-emerald-700 font-medium">Passed all checks</span>
                            ) : (
                              <ul className="list-disc list-inside space-y-0.5">
                                {result.issues.map((i, iIdx) => (
                                  <li key={iIdx} className={i.severity === 'Error' ? 'text-red-700 font-medium' : 'text-amber-800'}>
                                    {i.message}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manual Single Student Form */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSingleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  12-Digit APAAR ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apaarId"
                  placeholder="e.g. 100000000137"
                  value={formData.apaarId}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Date of Birth (DOB)</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Degree Program</label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                >
                  {currentInstitution.programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Admission Year</label>
                <input
                  type="number"
                  name="admissionYear"
                  value={formData.admissionYear}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Caste Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                >
                  <option value="General">General</option>
                  <option value="OBC-NCL">OBC-NCL</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quota Type</label>
                <select
                  name="quotaType"
                  value={formData.quotaType}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                >
                  <option value="State Merit">State Merit</option>
                  <option value="All India">All India</option>
                  <option value="Management">Management</option>
                  <option value="NRI">NRI Quota</option>
                  <option value="Supernumerary">Supernumerary (TFWS/Sports)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">NRI Sponsor Category</label>
                <select
                  name="sponsorCategory"
                  value={formData.sponsorCategory}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                >
                  <option value="None">None</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="First Degree Relative">First Degree Relative</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                </select>
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isSupernumerary"
                  checked={formData.isSupernumerary}
                  onChange={handleFormChange}
                  className="rounded text-[#0FA3A3] focus:ring-[#0FA3A3]"
                />
                <span className="font-medium text-slate-700">Supernumerary Quota (EWS / TFWS)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isNRI"
                  checked={formData.isNRI}
                  onChange={handleFormChange}
                  className="rounded text-[#0FA3A3] focus:ring-[#0FA3A3]"
                />
                <span className="font-medium text-slate-700">Non-Resident Indian (NRI)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isOCI"
                  checked={formData.isOCI}
                  onChange={handleFormChange}
                  className="rounded text-[#0FA3A3] focus:ring-[#0FA3A3]"
                />
                <span className="font-medium text-slate-700">Overseas Citizen of India (OCI)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isForeignNational"
                  checked={formData.isForeignNational}
                  onChange={handleFormChange}
                  className="rounded text-[#0FA3A3] focus:ring-[#0FA3A3]"
                />
                <span className="font-medium text-slate-700">Foreign National (FN)</span>
              </label>
            </div>

            {/* Instant Validation Output */}
            {formValidationResult && (
              <div
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  formValidationResult.status === 'Error'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : formValidationResult.status === 'Warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Engine Verdict: {formValidationResult.status}</span>
                  <span>{formValidationResult.issues.length} issue(s) detected</span>
                </div>
                {formValidationResult.issues.map((iss, i) => (
                  <p key={i} className="text-[11px]">
                    • {iss.ruleTitle}: {iss.message}
                  </p>
                ))}
              </div>
            )}

            {formSubmittedSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Student record submitted and pushed into central records ledger!</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-[#0B2A4A] hover:bg-[#103B66] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Validate &amp; Enroll Candidate</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
