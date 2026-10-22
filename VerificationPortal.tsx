import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ConsentRequest, Student } from '../types';
import QRCode from 'qrcode';
import {
  Lock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  KeyRound,
  QrCode as QrIcon,
  Search,
  Building,
  UserCheck,
  Ban,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const VerificationPortal: React.FC = () => {
  const {
    role,
    consentRequests,
    createConsentRequest,
    approveConsent,
    denyConsent,
    revokeConsent,
    students,
  } = useApp();

  // Verifier Form State
  const [targetApaar, setTargetApaar] = useState<string>('100000000137');
  const [verifierName, setVerifierName] = useState<string>('Priya Menon');
  const [verifierOrg, setVerifierOrg] = useState<string>('Tata Consultancy Services (HR Recruitment)');
  const [purpose, setPurpose] = useState<string>('Background Verification for Associate Software Engineer Role');
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>('req-101');

  // Student OTP Modal State
  const [activeOtpModalRequest, setActiveOtpModalRequest] = useState<ConsentRequest | null>(null);
  const [otpInput, setOtpInput] = useState<string>('123456');
  const [otpError, setOtpError] = useState<string | null>(null);

  // QR Code Image Data URL
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Selected request for verifier inspector
  const activeVerifierRequest = consentRequests.find((r) => r.id === submittedRequestId) || consentRequests[0];

  // Matched student record for the active request
  const matchedStudent = students.find(
    (s) => s.apaarId.replace(/[\s-]/g, '') === (activeVerifierRequest?.apaarId || '').replace(/[\s-]/g, '')
  );

  // Generate QR code whenever the approved request changes
  useEffect(() => {
    if (activeVerifierRequest && activeVerifierRequest.status === 'APPROVED' && activeVerifierRequest.verificationHash) {
      const payload = JSON.stringify({
        aicte_svrs: 'SIH_2026',
        apaarId: activeVerifierRequest.apaarId,
        status: matchedStudent?.status || 'Enrolled',
        inst: matchedStudent?.institutionName || 'AICTE Institute',
        prog: matchedStudent?.programName || 'Degree Program',
        admYear: matchedStudent?.admissionYear || 2026,
        hash: activeVerifierRequest.verificationHash,
        validUntil: activeVerifierRequest.expiresAt,
      });

      QRCode.toDataURL(payload, { width: 220, margin: 1, color: { dark: '#0B2A4A', light: '#FFFFFF' } })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    } else {
      setQrCodeUrl('');
    }
  }, [activeVerifierRequest, matchedStudent]);

  // Handle Verifier Submit Request
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const req = createConsentRequest(targetApaar, verifierName, verifierOrg, purpose);
    if (req) {
      setSubmittedRequestId(req.id);
    }
  };

  // Handle OTP Submit
  const handleConfirmOtp = () => {
    if (!activeOtpModalRequest) return;
    const ok = approveConsent(activeOtpModalRequest.id, otpInput);
    if (ok) {
      setActiveOtpModalRequest(null);
      setOtpError(null);
    } else {
      setOtpError('Invalid OTP! Please enter 123456 to simulate Aadhaar/APAAR authentication.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0FA3A3] uppercase tracking-wider font-mono">
            <Lock className="w-4 h-4" />
            <span>DPDP Act 2023 Compliant Citizen Consent Gateway</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">Consent-Based Credential Verification</h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Zero-knowledge, privacy-preserving credential validation. Employers and verifiers can query records only with
            explicit student OTP consent. Sensitive attributes (DOB, category, religion) are strictly masked at the protocol layer.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Consent Window: 24 Hours Default</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Verifier Action Desk (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* New Consent Request Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0B2A4A]" />
                Initiate New Verification Request
              </h3>
              <p className="text-xs text-slate-500">
                Queries are dispatched directly to the student's APAAR consent inbox for biometric/OTP approval.
              </p>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Candidate's 12-Digit APAAR ID <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={targetApaar}
                    onChange={(e) => setTargetApaar(e.target.value)}
                    placeholder="e.g. 100000000137"
                    required
                    className="grow px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetApaar('100000000137')}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
                  >
                    Use Sample ID
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Verifier Officer Name</label>
                  <input
                    type="text"
                    value={verifierName}
                    onChange={(e) => setVerifierName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Organization / Employer</label>
                  <input
                    type="text"
                    value={verifierOrg}
                    onChange={(e) => setVerifierOrg(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Verification Purpose</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Pre-employment Background Check"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0FA3A3] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800">Permitted Fields Upon Approval:</span>
                <p>Enrolment / Graduation Status, Institution Name, Program of Study, Admission Year.</p>
                <p className="text-red-700 font-medium">
                  Protected Excluded Fields: Date of Birth (DOB), Category, Mobile, Address.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B2A4A] hover:bg-[#103B66] text-white font-bold rounded-lg shadow-xs flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Request Candidate Consent</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Consent Requests List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Consent Activity Log</h3>
              <span className="text-xs font-mono text-slate-500 font-semibold">
                {consentRequests.length} Requests Active
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {consentRequests.map((req) => {
                const isSelected = submittedRequestId === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSubmittedRequestId(req.id)}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-50/70 border-l-4 border-l-[#0FA3A3]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{req.apaarId}</span>
                        <span className="text-xs text-slate-700 font-medium">• {req.studentName}</span>
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
                      <p className="text-[11px] text-slate-500 truncate max-w-md">{req.purpose}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Requester: {req.verifierOrg}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[11px] font-semibold text-[#0FA3A3]">
                        {isSelected ? 'Inspecting' : 'Click to View'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Verifier Result Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {activeVerifierRequest ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    Verification Outcome
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Permitted Credential View</h3>
                </div>

                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    activeVerifierRequest.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : activeVerifierRequest.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  {activeVerifierRequest.status === 'APPROVED' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  ) : activeVerifierRequest.status === 'PENDING' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <Ban className="w-3.5 h-3.5 text-red-600" />
                  )}
                  <span>{activeVerifierRequest.status}</span>
                </span>
              </div>

              {/* Status Conditional Views */}
              {activeVerifierRequest.status === 'PENDING' && (
                <div className="p-6 text-center space-y-3 bg-amber-50/50 rounded-xl border border-amber-200">
                  <Clock className="w-10 h-10 text-amber-600 mx-auto animate-pulse" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Consent Pending Citizen Approval</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                      Awaiting OTP approval from the student in their Citizen Portal. Switch to the Student role or use the action below to simulate approval.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveOtpModalRequest(activeVerifierRequest)}
                    className="px-3.5 py-1.5 bg-[#0B2A4A] hover:bg-[#103B66] text-white text-xs font-bold rounded-lg shadow-xs inline-flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Simulate Student OTP Approval</span>
                  </button>
                </div>
              )}

              {activeVerifierRequest.status === 'REVOKED' && (
                <div className="p-6 text-center space-y-3 bg-red-50 rounded-xl border border-red-200">
                  <Ban className="w-10 h-10 text-red-600 mx-auto" />
                  <div>
                    <h4 className="font-bold text-red-900 text-sm">Access Revoked by Citizen</h4>
                    <p className="text-xs text-red-700 mt-1">
                      The candidate has revoked this verification token. All academic records are now cryptographically inaccessible.
                    </p>
                  </div>
                </div>
              )}

              {activeVerifierRequest.status === 'APPROVED' && (
                <div className="space-y-4">
                  {/* Verified Badge Header */}
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        Officially Verified Record
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        Authenticated via National APAAR/ABC Gateway
                      </span>
                    </div>
                  </div>

                  {/* Permitted Data Fields */}
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Candidate Name</span>
                      <span className="text-sm font-bold text-slate-900">{activeVerifierRequest.studentName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">12-Digit APAAR</span>
                        <span className="font-mono font-bold text-slate-900">{activeVerifierRequest.apaarId}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Academic Status</span>
                        <span className="font-bold text-emerald-700">
                          {matchedStudent?.status || 'Enrolled (Active)'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">AICTE Institution</span>
                      <span className="font-semibold text-slate-800">
                        {matchedStudent?.institutionName || 'Recognized AICTE Institute'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Program of Study</span>
                        <span className="font-medium text-slate-800">
                          {matchedStudent?.programName || 'B.Tech Program'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Admission Year</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {matchedStudent?.admissionYear || 2026}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tamper-Evident SHA-256 Hash */}
                  <div className="p-2.5 bg-slate-900 text-white rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#0FA3A3] block font-mono">
                      Tamper-Evident SHA-256 Digest
                    </span>
                    <p className="font-mono text-[10px] text-slate-300 break-all">
                      {activeVerifierRequest.verificationHash}
                    </p>
                  </div>

                  {/* QR Code Container */}
                  {qrCodeUrl && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                      <img
                        src={qrCodeUrl}
                        alt="Verification QR Code"
                        className="w-36 h-36 rounded-lg border border-slate-300 bg-white p-1"
                      />
                      <span className="text-[10px] text-slate-500 font-mono text-center">
                        Scan with any mobile device to inspect credential signature
                      </span>
                    </div>
                  )}

                  {/* Student Revocation Trigger (Simulate student action from here or student portal) */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">Citizen Control:</span>
                    <button
                      onClick={() => revokeConsent(activeVerifierRequest.id)}
                      className="text-red-600 hover:text-red-700 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <Ban className="w-3 h-3" />
                      <span>Revoke Citizen Consent</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Select or submit a verification request to inspect results.
            </div>
          )}
        </div>
      </div>

      {/* Simulated OTP Modal */}
      {activeOtpModalRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#E6F7F7] text-[#0A7373] rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Simulated Citizen OTP Authorization</h3>
                <p className="text-xs text-slate-500">
                  Authenticate consent via simulated Aadhaar / APAAR OTP service.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p>
                <strong>Requester:</strong> {activeOtpModalRequest.verifierOrg}
              </p>
              <p>
                <strong>Purpose:</strong> {activeOtpModalRequest.purpose}
              </p>
              <p className="text-[11px] text-slate-500">
                Granting access enables 24-hour read access to program and enrolment status only.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Enter 6-Digit OTP (Pre-filled: 123456)
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
                onClick={() => {
                  denyConsent(activeOtpModalRequest.id);
                  setActiveOtpModalRequest(null);
                }}
                className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                Deny Request
              </button>
              <button
                type="button"
                onClick={handleConfirmOtp}
                className="px-4 py-2 bg-[#0B2A4A] hover:bg-[#103B66] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Sign &amp; Approve Consent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
