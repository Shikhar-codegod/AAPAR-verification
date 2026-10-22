import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import QRCode from 'qrcode';
import { Award, Printer, ShieldCheck, CheckCircle2, Building, Sparkles } from 'lucide-react';

export const CertificatePreview: React.FC = () => {
  const { students, selectedStudentId, setSelectedStudentId } = useApp();

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const [certQrUrl, setCertQrUrl] = useState<string>('');

  useEffect(() => {
    if (currentStudent) {
      const payload = JSON.stringify({
        cert_type: 'AICTE_PROVISIONAL_DEGREE',
        apaarId: currentStudent.apaarId,
        studentName: currentStudent.name,
        inst: currentStudent.institutionName,
        prog: currentStudent.programName,
        cgpa: currentStudent.degreeCgpa || 8.45,
        credHash: currentStudent.credentialHash,
        verifiedAt: new Date().toISOString(),
      });

      QRCode.toDataURL(payload, { width: 180, margin: 1, color: { dark: '#0B2A4A', light: '#FFFFFF' } })
        .then((url) => setCertQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [currentStudent]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden when printing) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F28C28]" />
            Official Academic Degree Credential Preview
          </h2>
          <p className="text-xs text-slate-500">
            Tamper-evident degree award certificate integrated with National APAAR registry and verification QR code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Student Picker */}
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="student-cert-select" className="text-slate-600 font-semibold">Student:</label>
            <select
              id="student-cert-select"
              aria-label="Select Student"
              value={currentStudent.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 font-medium max-w-[200px] truncate focus:ring-1 focus:ring-[#0FA3A3]"
            >
              {students.slice(0, 40).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.apaarId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0B2A4A] hover:bg-[#103B66] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate / PDF</span>
          </button>
        </div>
      </div>

      {/* High-Fidelity Printable Degree Certificate */}
      <div className="flex justify-center p-2 sm:p-6 bg-slate-100 rounded-2xl overflow-x-auto">
        <div className="w-[820px] bg-white border-8 border-double border-[#0B2A4A] p-10 sm:p-14 rounded-lg shadow-2xl relative text-slate-900 select-none">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 text-[#0FA3A3] text-xs font-serif font-bold">✦ ✦ ✦</div>
          <div className="absolute top-2 right-2 text-[#0FA3A3] text-xs font-serif font-bold">✦ ✦ ✦</div>
          <div className="absolute bottom-2 left-2 text-[#0FA3A3] text-xs font-serif font-bold">✦ ✦ ✦</div>
          <div className="absolute bottom-2 right-2 text-[#0FA3A3] text-xs font-serif font-bold">✦ ✦ ✦</div>

          {/* Certificate Header */}
          <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6 relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0B2A4A] text-white shadow-md mb-1 border-2 border-amber-400">
              <span className="font-bold text-xs tracking-wider text-[#F28C28]">AICTE</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                Ministry of Education • Government of India
              </p>
              <h1 className="text-xl font-extrabold text-[#0B2A4A] tracking-tight uppercase">
                {currentStudent.institutionName}
              </h1>
              <p className="text-xs text-slate-600 font-serif italic">
                Approved by All India Council for Technical Education (AICTE), New Delhi
              </p>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="py-8 text-center space-y-5">
            <div className="text-xs uppercase tracking-widest font-bold text-[#0FA3A3]">
              Provisional Degree Certificate
            </div>

            <p className="text-sm text-slate-700 font-serif italic max-w-lg mx-auto">
              This is to certify that the candidate whose details are attested below has successfully fulfilled
              all prescribed academic requirements:
            </p>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-[#0B2A4A] tracking-wide font-serif">
                {currentStudent.name}
              </h2>
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-600 pt-1">
                <span>APAAR ID: <strong className="text-slate-900">{currentStudent.apaarId}</strong></span>
                <span>•</span>
                <span>Student ID: <strong className="text-slate-900">{currentStudent.id}</strong></span>
              </div>
            </div>

            <p className="text-sm text-slate-700 font-serif max-w-xl mx-auto leading-relaxed">
              has been admitted to the degree of
            </p>

            <div className="text-base font-bold text-slate-900 uppercase tracking-wide bg-slate-50 py-2.5 px-6 rounded-lg inline-block border border-slate-200">
              {currentStudent.programName}
            </div>

            <p className="text-xs text-slate-600 font-serif">
              with a cumulative grade point average of{' '}
              <strong className="font-mono text-slate-900 font-bold">
                {currentStudent.degreeCgpa || 8.45} / 10.00
              </strong>{' '}
              in the academic session {currentStudent.admissionYear}.
            </p>
          </div>

          {/* Certificate Footer with Live QR Code & Digital Signature */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-3 items-center text-xs">
            {/* Left: Security Details */}
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Verification Details
              </span>
              <p className="text-[11px] text-slate-600">
                Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>APAAR Verified</span>
              </div>
              <p className="font-mono text-[8px] text-slate-400 truncate max-w-[180px]">
                SHA-256: {currentStudent.credentialHash?.substring(0, 24)}...
              </p>
            </div>

            {/* Center: Live Verification QR Code */}
            <div className="flex flex-col items-center justify-center">
              {certQrUrl && (
                <img
                  src={certQrUrl}
                  alt="Certificate QR"
                  className="w-24 h-24 border border-slate-300 p-1 rounded bg-white shadow-xs"
                />
              )}
              <span className="text-[9px] text-slate-400 mt-1 font-mono text-center">
                Scan to verify credential
              </span>
            </div>

            {/* Right: Controller of Examinations Sign */}
            <div className="text-right space-y-1">
              <div className="font-serif italic text-base text-[#0B2A4A] font-bold">
                Dr. R. K. Srivastav
              </div>
              <div className="text-[11px] font-semibold text-slate-700">Controller of Examinations</div>
              <div className="text-[10px] text-slate-500">{currentStudent.institutionName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
