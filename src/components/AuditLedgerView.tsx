import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLogEntry } from '../types';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Link as LinkIcon,
  Cpu,
} from 'lucide-react';

export const AuditLedgerView: React.FC = () => {
  const { auditLogs, verifyAuditIntegrity, simulateTamperLog, restoreAuditLog } = useApp();

  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    brokenIndex?: number;
    message: string;
    totalBlocks: number;
  } | null>(null);

  const [inspectBlock, setInspectBlock] = useState<AuditLogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleVerify = () => {
    const res = verifyAuditIntegrity();
    setVerificationResult(res);
  };

  const handleTamper = () => {
    simulateTamperLog();
    setVerificationResult(null);
  };

  const handleRestore = () => {
    restoreAuditLog();
    setVerificationResult(null);
  };

  const filteredLogs = auditLogs.filter((entry) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      entry.action.toLowerCase().includes(q) ||
      entry.actorRole.toLowerCase().includes(q) ||
      entry.actorEntity.toLowerCase().includes(q) ||
      entry.details.toLowerCase().includes(q) ||
      entry.currentHash.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0FA3A3] uppercase tracking-wider font-mono">
            <Fingerprint className="w-4 h-4" />
            <span>Cryptographic Chained SHA-256 State Ledger</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">Append-Only Regulatory Audit Log</h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Every batch upload, commit, consent grant, verification query, and regulatory action is irreversibly linked
            via a SHA-256 hash pointer to the preceding block.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleVerify}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Log Integrity</span>
          </button>

          <button
            onClick={handleTamper}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded-lg border border-red-300 transition-colors"
            title="Simulate unauthorized mutation of Block #1"
          >
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Simulate Tamper</span>
          </button>

          <button
            onClick={handleRestore}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200"
            title="Restore pristine cryptographic ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
            verificationResult.isValid
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          {verificationResult.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-wider">
              {verificationResult.isValid ? 'Cryptographic Integrity Confirmed' : 'Cryptographic Tampering Detected!'}
            </h4>
            <p className="text-xs">{verificationResult.message}</p>
            {verificationResult.isValid ? (
              <p className="text-[11px] text-emerald-700 font-mono">
                Hash pointers from Genesis block to tip block #{verificationResult.totalBlocks - 1} verified.
              </p>
            ) : (
              <p className="text-[11px] text-red-700 font-mono font-semibold">
                Block #{verificationResult.brokenIndex} fails hash verification! Previous state has been altered.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#0FA3A3]" />
              Immutable Block Sequence ({auditLogs.length} Blocks)
            </h3>
            <p className="text-xs text-slate-500">
              Each block contains SHA-256(index + timestamp + action + actor + details + prevHash).
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search actions or actors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Block #</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Actor &amp; Entity</th>
                <th className="py-2.5 px-3">Transaction Details</th>
                <th className="py-2.5 px-3">Chained SHA-256 Hash</th>
                <th className="py-2.5 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    #{entry.index}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        entry.action === 'GENESIS_BLOCK'
                          ? 'bg-slate-800 text-white'
                          : entry.action === 'INTAKE_ALERT'
                          ? 'bg-red-100 text-red-800'
                          : entry.action === 'CONSENT_APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans max-w-[150px]">
                    <div className="font-semibold text-slate-800 text-[11px] truncate">
                      {entry.actorEntity}
                    </div>
                    <div className="text-[10px] text-slate-400">{entry.actorRole}</div>
                  </td>
                  <td className="py-2.5 px-3 font-sans max-w-sm text-slate-700 text-[11px]">
                    {entry.details}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[10px]">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {entry.currentHash.substring(0, 16)}...
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    <button
                      onClick={() => setInspectBlock(entry)}
                      className="text-[#0FA3A3] hover:text-[#0A7373] text-[11px] font-semibold hover:underline"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Inspector Modal */}
      {inspectBlock && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-slate-100 text-[#0B2A4A] rounded-lg">
                  <Fingerprint className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ledger Block #{inspectBlock.index}</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {inspectBlock.id}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectBlock(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase">Timestamp</span>
                <p className="font-mono text-slate-800">{inspectBlock.timestamp}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase">Action &amp; Actor</span>
                <p className="font-semibold text-slate-900">
                  {inspectBlock.action} by {inspectBlock.actorEntity} ({inspectBlock.actorRole})
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase">Payload Details</span>
                <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700">
                  {inspectBlock.details}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase">Previous Block Hash (Parent)</span>
                <p className="font-mono text-[10px] text-slate-600 bg-slate-100 p-2 rounded break-all">
                  {inspectBlock.previousHash}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase">Current Block SHA-256 Hash</span>
                <p className="font-mono text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded break-all font-semibold">
                  {inspectBlock.currentHash}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectBlock(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
