import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConsentRequest } from '../types';
import {
  User,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  XCircle,
  Ban,
  Clock,
  Award,
  Lock,
  Building,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    consentRequests,
    approveConsent,
    denyConsent,
    revokeConsent,
    setActiveScreen,
  } = useApp();

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // OTP Modal
  const [activeOtpRequest, setActiveOtpRequest] = useState<ConsentRequest | null>(null);
  const [otpInput, setOtpInput] = useState<string>('123456');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Filter consent requests for this student's APAAR ID
  const studentRequests = consentRequests.filter(
    (r) => r.apaarId.replace(/[\s-]/g, '') === currentStudent.apaarId.replace(/[\s-]/g, '')
  );

  const handleApprove = (req: ConsentRequest) => {
    setActiveOtpRequest(req);
    setOtpInput('123456');
    setOtpError(null);
  };

  const handleConfirmOtp = () => {
    if (!activeOtpRequest) return;
    const ok = approveConsent(activeOtpRequest.id, otpInput);
    if (ok) {
      setActiveOtpRequest(null);
    } else {
      setOtpError('Invalid OTP! Please enter 123456 to simulate Aadhaar OTP authentication.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Profile Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0B2A4A] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm border border-slate-700">
            {currentStudent.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentStudent.name}</h2>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified APAAR</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {currentStudent.programName} • {currentStudent.institutionName} ({currentStudent.state})
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono pt-1">
              <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800">
                APAAR ID: {currentStudent.apaarId}
              </span>
              <span className="text-slate-500">
                Admitted: {currentStudent.admissionYear}
              </span>
              <span className="text-slate-500">
                DOB: {currentStudent.dob}
              </span>
            </div>
          </div>
        </div>

        {/* Student Switcher & Certificate Link */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="text-right">
            <label htmlFor="student-profile-select" className="text-[11px] text-slate-400 block font-medium">Switch Persona:</label>
            <select
              id="student-profile-select"
              aria-label="Switch Student Persona"
              value={currentStudent.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 font-medium max-w-[200px] truncate focus:ring-1 focus:ring-[#0FA3A3]"
            >
              {students.slice(0, 30).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.apaarId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setActiveScreen('certificate_preview')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0FA3A3] hover:bg-[#0A7373] text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Award className="w-4 h-4" />
            <span>View Degree Certificate</span>
          </button>
        </div>
      </div>

      {/* Consent Requests Inbox */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0FA3A3]" />
              Data Privacy &amp; Credential Consent Inbox
            </h3>
            <p className="text-xs text-slate-500">
              External verifiers (employers, banks, universities) request temporary access to your degree records.
            </p>
          </div>
          <span className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-slate-200 font-semibold text-slate-700">
            {studentRequests.length} Request(s)
          </span>
        </div>

        {studentRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No pending or active verification requests for this student. (Switch to Employer role to initiate one).
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {studentRequests.map((req) => (
              <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{req.verifierOrg}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'REVOKED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{req.purpose}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Verifier: {req.verifierName} • Requested: {new Date(req.requestedAt).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => denyConsent(req.id)}
                        className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 font-semibold border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => handleApprove(req)}
                        className="px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Approve via OTP</span>
                      </button>
                    </>
                  )}

                  {req.status === 'APPROVED' && (
                    <button
                      onClick={() => revokeConsent(req.id)}
                      className="px-3.5 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 font-semibold border border-red-300 rounded-lg flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5 text-red-600" />
                      <span>Revoke Access</span>
                    </button>
                  )}

                  {req.status === 'REVOKED' && (
                    <span className="text-xs text-red-600 font-semibold italic">
                      Access Terminated
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OTP Approval Modal */}
      {activeOtpRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#E6F7F7] text-[#0A7373] rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Citizen OTP Verification</h3>
                <p className="text-xs text-slate-500">
                  Authorize credential release for {activeOtpRequest.verifierOrg}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Enter 6-digit OTP sent to registered mobile (Default: 123456)
              </label>
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                className="w-full text-center text-lg font-mono font-bold tracking-widest px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
              />
              {otpError && <p className="text-xs text-red-600 font-medium">{otpError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveOtpRequest(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOtp}
                className="px-4 py-2 bg-[#0B2A4A] hover:bg-[#103B66] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Sign Consent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
