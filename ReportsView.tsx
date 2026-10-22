import React from 'react';
import { useApp } from '../context/AppContext';
import { FileSpreadsheet, FileDown, ShieldAlert, BarChart3, History, CheckCircle } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { students, institutionRisks, stateUtilisations, auditLogs } = useApp();

  // Export 1: Flagged Records CSV
  const handleExportFlaggedRecords = () => {
    const flagged = students.filter(
      (s) => s.verificationStatus === 'Error' || s.verificationStatus === 'Warning'
    );

    let csv = 'Student_ID,APAAR_ID,Name,DOB,Gender,Institution,State,Program,Admission_Year,Category,Quota,Status,Violation_Codes,Violations_Summary\n';
    flagged.forEach((s) => {
      const codes = s.validationIssues.map((i) => i.code).join('|');
      const messages = s.validationIssues.map((i) => i.message.replace(/,/g, ';')).join(' | ');
      csv += `"${s.id}","${s.apaarId}","${s.name}","${s.dob}","${s.gender}","${s.institutionName}","${s.state}","${s.programName}",${s.admissionYear},"${s.category}","${s.quotaType}","${s.verificationStatus}","${codes}","${messages}"\n`;
    });

    downloadCSV(csv, 'AICTE_Flagged_Records_Compliance_Report.csv');
  };

  // Export 2: Institution Risk Ranking CSV
  const handleExportRiskRanking = () => {
    let csv = 'Rank,Institution_ID,Institution_Name,State,Approved_Capacity,Total_Enrolled,Rejection_Rate_Pct,Intake_Overshoot_Pct,NRI_Supernumerary_ZScore,Duplicate_Rate_Pct,Composite_Risk_Score,Risk_Level\n';
    institutionRisks.forEach((r, idx) => {
      csv += `${idx + 1},"${r.institutionId}","${r.institutionName}","${r.state}",${r.approvedCapacity},${r.totalEnrolled},${(r.rejectionRate * 100).toFixed(1)},${r.intakeOvershootPercent.toFixed(1)},${r.nriSupernumeraryZScore.toFixed(2)},${(r.duplicateRate * 100).toFixed(1)},${r.compositeRiskScore},"${r.riskLevel}"\n`;
    });

    downloadCSV(csv, 'AICTE_Institution_Explainable_Risk_Ranking.csv');
  };

  // Export 3: State-wise Utilisation CSV
  const handleExportStateUtilisation = () => {
    let csv = 'State,Colleges_Count,Approved_Intake,Regular_Admissions,Supernumerary_Admissions,Total_Enrolment,Utilisation_Rate_Pct,Flagged_Count\n';
    stateUtilisations.forEach((su) => {
      csv += `"${su.state}",${su.institutionsCount},${su.approvedIntake},${su.regularAdmissions},${su.supernumeraryAdmissions},${su.totalAdmissions},${su.utilisationRate},${su.flaggedCount}\n`;
    });

    downloadCSV(csv, 'AICTE_State_Seat_Utilisation_Report.csv');
  };

  // Export 4: Cryptographic Audit Ledger CSV
  const handleExportAuditLedger = () => {
    let csv = 'Block_Index,Timestamp,Action,Actor_Role,Actor_Entity,Details,Previous_Hash,Current_Hash\n';
    auditLogs.forEach((blk) => {
      csv += `${blk.index},"${blk.timestamp}","${blk.action}","${blk.actorRole}","${blk.actorEntity}","${blk.details.replace(/"/g, '""')}","${blk.previousHash}","${blk.currentHash}"\n`;
    });

    downloadCSV(csv, 'AICTE_Cryptographic_Audit_Ledger_Export.csv');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const flaggedCount = students.filter(
    (s) => s.verificationStatus === 'Error' || s.verificationStatus === 'Warning'
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Official Regulatory Exports &amp; Compliance Data</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Download standardized CSV reports for Ministry of Education oversight, state technical education directorates,
          and external audit committees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report 1: Flagged Records */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-2.5 bg-red-50 text-red-700 w-fit rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Flagged Records Exception Report</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete catalog of students with APAAR formatting flaws, duplicate enrolments, under-age violations,
              and citizenship inconsistencies.
            </p>
            <div className="text-xs font-mono text-slate-700 font-semibold pt-1">
              {flaggedCount} Flagged Records Ready for Export
            </div>
          </div>

          <button
            onClick={handleExportFlaggedRecords}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0B2A4A] hover:bg-[#103B66] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4 text-[#0FA3A3]" />
            <span>Download Flagged Records CSV</span>
          </button>
        </div>

        {/* Report 2: Institution Risk Ranking */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-2.5 bg-amber-50 text-amber-700 w-fit rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Institutional Explainable Risk Indices</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Calculated 0–100 composite risk scores with individual factor contributions (intake overshoots, rejection velocity, quota z-scores).
            </p>
            <div className="text-xs font-mono text-slate-700 font-semibold pt-1">
              40 Institutions Ranked &amp; Scored
            </div>
          </div>

          <button
            onClick={handleExportRiskRanking}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0B2A4A] hover:bg-[#103B66] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4 text-[#0FA3A3]" />
            <span>Download Risk Ranking CSV</span>
          </button>
        </div>

        {/* Report 3: State Seat Utilisation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-2.5 bg-sky-50 text-sky-700 w-fit rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">State-Wise Capacity &amp; Seat Utilisation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Consolidated intake vs. regular and supernumerary admissions matrix across all 10 monitored Indian states.
            </p>
            <div className="text-xs font-mono text-slate-700 font-semibold pt-1">
              10 State Clusters Summarized
            </div>
          </div>

          <button
            onClick={handleExportStateUtilisation}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0B2A4A] hover:bg-[#103B66] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4 text-[#0FA3A3]" />
            <span>Download State Utilisation CSV</span>
          </button>
        </div>

        {/* Report 4: Cryptographic Audit Ledger */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 w-fit rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Cryptographic SHA-256 Audit Ledger</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export the full verifiable chain of transaction blocks for external security audit and regulatory compliance verification.
            </p>
            <div className="text-xs font-mono text-slate-700 font-semibold pt-1">
              {auditLogs.length} Cryptographic Blocks
            </div>
          </div>

          <button
            onClick={handleExportAuditLedger}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0B2A4A] hover:bg-[#103B66] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4 text-[#0FA3A3]" />
            <span>Download Audit Ledger CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
