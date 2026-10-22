import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { InstitutionRisk } from '../types';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Info,
  ChevronRight,
  X,
  FileSpreadsheet,
  AlertOctagon,
  Scale,
} from 'lucide-react';

export const AnomalyRiskView: React.FC = () => {
  const { institutionRisks } = useApp();

  const [selectedRiskInst, setSelectedRiskInst] = useState<InstitutionRisk | null>(
    institutionRisks[0] || null
  );

  // Scatter plot data: Intake Overshoot % vs NRI/Supernumerary Deviation Z-Score
  const scatterData = useMemo(() => {
    return institutionRisks.map((inst) => ({
      id: inst.institutionId,
      name: inst.institutionName,
      state: inst.state,
      intakeOvershoot: +inst.intakeOvershootPercent.toFixed(1),
      nriZScore: +inst.nriSupernumeraryZScore.toFixed(2),
      riskScore: inst.compositeRiskScore,
      riskLevel: inst.riskLevel,
      rejectionRate: +(inst.rejectionRate * 100).toFixed(1),
      isOutlier: inst.compositeRiskScore >= 45,
    }));
  }, [institutionRisks]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Governance Note */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0FA3A3] uppercase tracking-wider font-mono">
            <Scale className="w-4 h-4" />
            <span>Explainable AI &amp; Statistical Governance</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Institutional Risk Scoring &amp; Anomaly Detection
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Objective mathematical risk indices (0–100) combining verification rejection velocity, statutory intake
            overshoots, quota distribution z-scores, and cross-enrolment duplication factors.
          </p>
        </div>

        {/* Human-in-the-loop Regulatory Disclaimer Note */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 max-w-md text-xs text-amber-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug">
            <strong className="font-semibold">Human-in-the-Loop Safeguard:</strong> The AICTE-SVRS engine flags anomalies
            purely to guide human regional inspectors and never executes automated adverse regulatory actions or auto-cancellations.
          </p>
        </div>
      </div>

      {/* Scatter Plot of Institutions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Institutional Anomaly Scatter Distribution: Intake Overshoot vs. Quota Z-Score
            </h3>
            <p className="text-xs text-slate-500">
              Outliers in the upper-right quadrant exhibit simultaneous capacity violations and severe quota skews.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="text-slate-600 font-medium">Critical/High Outlier</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0FA3A3]"></span>
              <span className="text-slate-600 font-medium">Normal Range</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                type="number"
                dataKey="intakeOvershoot"
                name="Intake Overshoot %"
                unit="%"
                tick={{ fontSize: 11 }}
                label={{ value: 'Intake Overshoot (%)', position: 'insideBottom', offset: -12, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="nriZScore"
                name="NRI/Super Quota Z-Score"
                tick={{ fontSize: 11 }}
                label={{ value: 'Quota Z-Score', angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <ZAxis type="number" dataKey="riskScore" range={[60, 280]} name="Risk Score" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl space-y-1 max-w-xs">
                        <p className="font-bold text-[#0FA3A3]">{data.name}</p>
                        <p className="text-slate-300">{data.state}</p>
                        <div className="pt-1 border-t border-slate-700 text-[11px] space-y-0.5">
                          <p>Risk Score: <span className="font-bold font-mono text-amber-300">{data.riskScore}/100</span> ({data.riskLevel})</p>
                          <p>Intake Overshoot: <span className="font-mono">{data.intakeOvershoot}%</span></p>
                          <p>Quota Z-Score: <span className="font-mono">{data.nriZScore}</span></p>
                          <p>Rejection Rate: <span className="font-mono">{data.rejectionRate}%</span></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name="Institutions"
                data={scatterData}
                onClick={(entry: any) => {
                  const targetId = entry?.id || entry?.payload?.id;
                  const inst = institutionRisks.find((r) => r.institutionId === targetId);
                  if (inst) setSelectedRiskInst(inst);
                }}
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.riskScore >= 70 ? '#DC2626' : entry.riskScore >= 45 ? '#F28C28' : '#0FA3A3'}
                    stroke={entry.isOutlier ? '#0B2A4A' : 'none'}
                    strokeWidth={entry.isOutlier ? 2 : 0}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split Section: Risk-ranked Table + Why Flagged Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Risk-Ranked Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Risk-Ranked Institutional Registry</h3>
              <p className="text-xs text-slate-500">
                Sorted by composite risk index (0–100). Click an institution to inspect factor contributions.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
              40 Monitored Colleges
            </span>
          </div>

          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Institution</th>
                  <th className="py-2.5 px-3 text-center">Risk Score</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Overshoot</th>
                  <th className="py-2.5 px-3 text-right">Error Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {institutionRisks.map((inst, idx) => {
                  const isSelected = selectedRiskInst?.institutionId === inst.institutionId;
                  return (
                    <tr
                      key={inst.institutionId}
                      onClick={() => setSelectedRiskInst(inst)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-50/80 font-medium'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500 font-bold">
                        #{idx + 1}
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="font-semibold text-slate-800 truncate" title={inst.institutionName}>
                          {inst.institutionName}
                        </div>
                        <div className="text-[11px] text-slate-500">{inst.state}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-900">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              inst.compositeRiskScore >= 70
                                ? 'bg-red-600'
                                : inst.compositeRiskScore >= 45
                                ? 'bg-amber-500'
                                : 'bg-[#0FA3A3]'
                            }`}
                          />
                          <span>{inst.compositeRiskScore}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            inst.riskLevel === 'Critical'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : inst.riskLevel === 'High'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : inst.riskLevel === 'Moderate'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {inst.riskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {inst.intakeOvershootPercent > 0 ? (
                          <span className="text-red-600 font-bold">+{inst.intakeOvershootPercent.toFixed(1)}%</span>
                        ) : (
                          <span className="text-slate-400">0%</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {(inst.rejectionRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: "Why Flagged" Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
          {selectedRiskInst ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                    Risk Decomposition Card
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedRiskInst.riskLevel === 'Critical'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : selectedRiskInst.riskLevel === 'High'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {selectedRiskInst.riskLevel} Risk
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                  {selectedRiskInst.institutionName}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  State: {selectedRiskInst.state} • Sanctioned Capacity: {selectedRiskInst.approvedCapacity} seats
                </p>
              </div>

              {/* Composite Score Pill */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Total Explainable Risk Score</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {selectedRiskInst.compositeRiskScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </span>
              </div>

              {/* Factor Contribution Horizontal Breakdown */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Factor Contributions (Why Flagged)
                </h5>

                {selectedRiskInst.factorContributions.map((fc, i) => {
                  const maxPoints = fc.weight;
                  const pct = (fc.scoreContribution / maxPoints) * 100;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{fc.factor}</span>
                        <span className="font-mono text-slate-700 font-bold">
                          +{fc.scoreContribution} / {maxPoints} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            pct >= 60 ? 'bg-red-600' : pct >= 30 ? 'bg-amber-500' : 'bg-[#0FA3A3]'
                          }`}
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {fc.description} <span className="font-mono text-slate-700">({fc.rawMetric})</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select an institution from the table to view transparent factor breakdown.
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Statistical Model: Transparent Multi-Factor Z-Score</span>
            <span className="font-mono text-[#0FA3A3] font-semibold">100% Deterministic</span>
          </div>
        </div>
      </div>
    </div>
  );
};
