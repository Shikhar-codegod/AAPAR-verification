import { Institution, Student, InstitutionRisk, RiskFactorContribution } from '../types';

/**
 * Calculate Explainable Risk Scores for all institutions
 * Factors:
 * 1. Rejection / Error Rate (Weight: 25%)
 * 2. Intake Overshoot (Weight: 30%)
 * 3. NRI & Supernumerary Share vs National Avg Z-Score (Weight: 20%)
 * 4. Duplicate Rate (Intra- and Cross-Institution) (Weight: 15%)
 * 5. Admission Spike vs Baseline Capacity (Weight: 10%)
 */
export function computeInstitutionRisks(
  institutions: Institution[],
  students: Student[]
): InstitutionRisk[] {
  // Aggregate national metrics first
  const instStats = institutions.map((inst) => {
    const instStudents = students.filter((s) => s.institutionId === inst.id);
    const totalEnrolled = instStudents.length;

    let totalApprovedCapacity = 0;
    let totalSupernumeraryQuota = 0;
    let regularIntakeOvershootCount = 0;

    for (const prog of inst.programs) {
      totalApprovedCapacity += prog.approvedIntake;
      totalSupernumeraryQuota += prog.supernumeraryQuota;

      const progRegular = instStudents.filter((s) => s.programId === prog.id && !s.isSupernumerary).length;
      if (progRegular > prog.approvedIntake) {
        regularIntakeOvershootCount += (progRegular - prog.approvedIntake);
      }
    }

    const errorStudents = instStudents.filter((s) => s.verificationStatus === 'Error').length;
    const rejectionRate = totalEnrolled > 0 ? errorStudents / totalEnrolled : 0;

    const duplicateStudents = instStudents.filter((s) =>
      s.validationIssues.some(
        (issue) =>
          issue.code === 'ERR_INTRA_DUPLICATE' || issue.code === 'ERR_CROSS_INST_DUPLICATE'
      )
    ).length;
    const duplicateRate = totalEnrolled > 0 ? duplicateStudents / totalEnrolled : 0;

    const nriOrSuper = instStudents.filter((s) => s.isNRI || s.isSupernumerary).length;
    const nriSuperShare = totalEnrolled > 0 ? nriOrSuper / totalEnrolled : 0;

    const intakeOvershootPercent = totalApprovedCapacity > 0
      ? (regularIntakeOvershootCount / totalApprovedCapacity) * 100
      : 0;

    // Admission spike: ratio of total admitted vs baseline capacity
    const capacityRatio = totalApprovedCapacity > 0 ? totalEnrolled / (totalApprovedCapacity + totalSupernumeraryQuota) : 1;
    const admissionSpikePercent = Math.max(0, (capacityRatio - 1) * 100);

    return {
      inst,
      instStudents,
      totalEnrolled,
      totalApprovedCapacity,
      errorStudents,
      rejectionRate,
      duplicateRate,
      nriSuperShare,
      intakeOvershootPercent,
      regularIntakeOvershootCount,
      admissionSpikePercent,
    };
  });

  // Calculate National Mean and Std Dev for NRI/Supernumerary share
  const allShares = instStats.map((s) => s.nriSuperShare);
  const nationalMeanShare = allShares.reduce((a, b) => a + b, 0) / (allShares.length || 1);
  const variance = allShares.reduce((acc, val) => acc + Math.pow(val - nationalMeanShare, 2), 0) / (allShares.length || 1);
  const stdDev = Math.sqrt(variance) || 0.01;

  return instStats.map((stat) => {
    // 1. Z-Score for NRI / Supernumerary share
    const zScore = (stat.nriSuperShare - nationalMeanShare) / stdDev;
    const positiveZScore = Math.max(0, zScore);

    // Weights:
    // Rejection Rate: 25 max points
    // Intake Overshoot: 30 max points
    // NRI/Super Share Z-Score: 20 max points
    // Duplicate Rate: 15 max points
    // Admission Spike: 10 max points
    const rejectionContrib = Math.min(25, stat.rejectionRate * 250); // e.g., 10% rejection = 25 pts
    const overshootContrib = Math.min(30, (stat.intakeOvershootPercent / 15) * 30); // 15% overshoot = 30 pts
    const nriZScoreContrib = Math.min(20, (positiveZScore / 2.5) * 20); // Z=2.5 => 20 pts
    const duplicateContrib = Math.min(15, stat.duplicateRate * 200); // 7.5% duplicate = 15 pts
    const spikeContrib = Math.min(10, (stat.admissionSpikePercent / 20) * 10); // 20% spike = 10 pts

    const compositeScore = Math.min(
      100,
      Math.round(rejectionContrib + overshootContrib + nriZScoreContrib + duplicateContrib + spikeContrib)
    );

    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
    if (compositeScore >= 70) riskLevel = 'Critical';
    else if (compositeScore >= 45) riskLevel = 'High';
    else if (compositeScore >= 25) riskLevel = 'Moderate';

    const factorContributions: RiskFactorContribution[] = [
      {
        factor: 'Sanctioned Intake Overshoot',
        weight: 30,
        rawMetric: `${stat.intakeOvershootPercent.toFixed(1)}% overshoot (${stat.regularIntakeOvershootCount} seats over cap)`,
        scoreContribution: +overshootContrib.toFixed(1),
        description:
          stat.intakeOvershootPercent > 0
            ? `Regular admissions exceeded AICTE approved capacity by ${stat.intakeOvershootPercent.toFixed(1)}%.`
            : 'Enrolment strictly adheres to sanctioned seat limits.',
      },
      {
        factor: 'Verification Rejection Rate',
        weight: 25,
        rawMetric: `${(stat.rejectionRate * 100).toFixed(1)}% error rate (${stat.errorStudents} records)`,
        scoreContribution: +rejectionContrib.toFixed(1),
        description: `Proportion of submitted candidate records failing format, identity, or age rules.`,
      },
      {
        factor: 'NRI & Supernumerary Skew (Z-Score)',
        weight: 20,
        rawMetric: `Z = ${zScore.toFixed(2)} (${(stat.nriSuperShare * 100).toFixed(1)}% vs national avg ${(nationalMeanShare * 100).toFixed(1)}%)`,
        scoreContribution: +nriZScoreContrib.toFixed(1),
        description:
          zScore > 1.5
            ? `Statistically unusual concentration of NRI/Supernumerary admissions (${zScore.toFixed(2)} standard deviations above national mean).`
            : 'Quota distribution aligns with national baseline expectations.',
      },
      {
        factor: 'Enrolment Duplicate Ratio',
        weight: 15,
        rawMetric: `${(stat.duplicateRate * 100).toFixed(1)}% duplicate rate`,
        scoreContribution: +duplicateContrib.toFixed(1),
        description: `Students detected concurrently enrolled at another institution or duplicated within the college.`,
      },
      {
        factor: 'Capacity Spike Anomaly',
        weight: 10,
        rawMetric: `+${stat.admissionSpikePercent.toFixed(1)}% sudden surge`,
        scoreContribution: +spikeContrib.toFixed(1),
        description:
          stat.admissionSpikePercent > 0
            ? 'Total admissions exceed maximum theoretical infrastructure envelope.'
            : 'Admissions steady within expected infrastructural capacity.',
      },
    ];

    return {
      institutionId: stat.inst.id,
      institutionName: stat.inst.name,
      state: stat.inst.state,
      totalEnrolled: stat.totalEnrolled,
      approvedCapacity: stat.totalApprovedCapacity,
      rejectionRate: stat.rejectionRate,
      intakeOvershootPercent: stat.intakeOvershootPercent,
      nriSupernumeraryShare: stat.nriSuperShare,
      nriSupernumeraryZScore: +zScore.toFixed(2),
      duplicateRate: stat.duplicateRate,
      admissionSpikePercent: stat.admissionSpikePercent,
      compositeRiskScore: compositeScore,
      riskLevel,
      factorContributions,
    };
  }).sort((a, b) => b.compositeRiskScore - a.compositeRiskScore);
}
