import { mockApaarRegistry } from './apaarRegistry';
import { Student, ValidationIssue, ValidationResult, Institution, Program } from '../types';

export interface ValidationContext {
  existingStudents: Student[];
  institutions: Institution[];
  academicYear?: number;
}

export interface RuleDefinition {
  id: string;
  code: string;
  title: string;
  category: 'Identity' | 'Enrolment' | 'Intake Cap' | 'Regulatory Eligibility';
  severity: 'Error' | 'Warning';
  description: string;
  regulatoryReference: string;
}

export const VALIDATION_RULES: RuleDefinition[] = [
  {
    id: 'R1_APAAR_FORMAT',
    code: 'ERR_APAAR_FORMAT',
    title: 'APAAR 12-Digit Format',
    category: 'Identity',
    severity: 'Error',
    description: 'APAAR (Automated Permanent Academic Account Registry) ID must be exactly 12 numeric digits without alphabetic characters or symbols.',
    regulatoryReference: 'National Education Policy 2020 & APAAR/ABC National Registry Guidelines Clause 4.1',
  },
  {
    id: 'R2_APAAR_EXISTENCE',
    code: 'ERR_APAAR_NOT_FOUND',
    title: 'National APAAR Registry Verification',
    category: 'Identity',
    severity: 'Error',
    description: 'The student APAAR ID must exist in the National APAAR/ABC Central Registry and must not be marked SUSPENDED or DEACTIVATED.',
    regulatoryReference: 'MoE / UGC Academic Bank of Credits (ABC) Operational Framework 2021',
  },
  {
    id: 'R3_NAME_DOB_MISMATCH',
    code: 'WARN_DEMO_MISMATCH',
    title: 'Demographic Match (Name & DOB)',
    category: 'Identity',
    severity: 'Warning',
    description: 'Student name and date of birth in institutional records must match the verified APAAR identity within a 75% fuzzy threshold and exact date format.',
    regulatoryReference: 'AICTE Approval Process Handbook (APH) 2025-26, Verification Norms',
  },
  {
    id: 'R4_INTRA_INST_DUPLICATE',
    code: 'ERR_INTRA_DUPLICATE',
    title: 'Intra-Institutional Duplicate Enrolment',
    category: 'Enrolment',
    severity: 'Error',
    description: 'The same APAAR ID cannot be enrolled multiple times within the same institution in the same academic year.',
    regulatoryReference: 'AICTE APH 2025-26, Student Enrolment Compliance Annexure 3',
  },
  {
    id: 'R5_CROSS_INST_DUPLICATE',
    code: 'ERR_CROSS_INST_DUPLICATE',
    title: 'Cross-Institutional Dual Enrolment Conflict',
    category: 'Enrolment',
    severity: 'Error',
    description: 'A student cannot be concurrently enrolled in full-time regular degree programs across two distinct AICTE-approved institutions in the same academic year.',
    regulatoryReference: 'UGC Guidelines on Pursuing Two Academic Programmes Simultaneously (Full-time Regular Prohibitions)',
  },
  {
    id: 'R6_INTAKE_CAP_EXCEEDED',
    code: 'ERR_INTAKE_CAP',
    title: 'Approved Intake Cap Compliance',
    category: 'Intake Cap',
    severity: 'Error',
    description: 'Total regular admissions in a program must not exceed the sanctioned intake approved by the AICTE Executive Committee. Supernumerary quota (EWS/TFWS/NRI/FN) is computed separately.',
    regulatoryReference: 'AICTE Regulations Clause 7.14 on Sanctioned Intake vs Supernumerary Quotas',
  },
  {
    id: 'R7_ELIGIBILITY_AGE',
    code: 'ERR_AGE_UNDER_16',
    title: 'Minimum Age Eligibility',
    category: 'Regulatory Eligibility',
    severity: 'Error',
    description: 'The candidate must be at least 16 years of age on 31st December of the year of admission to an AICTE technical degree program.',
    regulatoryReference: 'AICTE Minimum Age Eligibility Norms for Technical Education Degree Entry',
  },
  {
    id: 'R8_CITIZENSHIP_CONSISTENCY',
    code: 'ERR_CITIZENSHIP_CONFLICT',
    title: 'OCI and Foreign National Conflict',
    category: 'Regulatory Eligibility',
    severity: 'Error',
    description: 'A student cannot be simultaneously classified as both a Foreign National (FN) and an Overseas Citizen of India (OCI).',
    regulatoryReference: 'Ministry of Home Affairs & AICTE NRI/OCI/FN Admission Guidelines',
  },
  {
    id: 'R9_NRI_SPONSOR_REQUIRED',
    code: 'WARN_NRI_SPONSOR',
    title: 'NRI Quota Sponsor Verification',
    category: 'Regulatory Eligibility',
    severity: 'Warning',
    description: 'Admissions under the NRI quota must designate a valid NRI parent or first-degree blood relative sponsor with legal financial undertaking.',
    regulatoryReference: 'Hon\'ble Supreme Court of India P.A. Inamdar Judgement & AICTE NRI Quota Rules',
  },
  {
    id: 'R10_ADMISSION_WINDOW',
    code: 'WARN_ADMISSION_DATE',
    title: 'Academic Session Admission Cut-off Date',
    category: 'Regulatory Eligibility',
    severity: 'Warning',
    description: 'Admission date must fall within the sanctioned academic admission window (typically July 1 to November 30).',
    regulatoryReference: 'AICTE Academic Calendar Mandate 2025-26',
  },
];

/**
 * Pure function: Validate a single student candidate record
 */
export function validateStudentRecord(
  candidate: Partial<Student>,
  context: ValidationContext
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const apaarId = (candidate.apaarId || '').replace(/[\s-]/g, '').trim();

  // Rule 1: APAAR Format
  if (!apaarId || !/^\d{12}$/.test(apaarId)) {
    issues.push({
      code: 'ERR_APAAR_FORMAT',
      severity: 'Error',
      field: 'apaarId',
      message: `APAAR ID must be exactly 12 numeric digits. Found '${candidate.apaarId || 'EMPTY'}'.`,
      ruleTitle: 'APAAR 12-Digit Format',
    });
  } else {
    // Rule 2: APAAR Registry Lookup
    const regCheck = mockApaarRegistry.lookupSync(apaarId);
    if (!regCheck.exists) {
      issues.push({
        code: 'ERR_APAAR_NOT_FOUND',
        severity: 'Error',
        field: 'apaarId',
        message: `APAAR ID '${apaarId}' was not found in the Central APAAR/ABC National Registry.`,
        ruleTitle: 'National APAAR Registry Verification',
      });
    } else if (regCheck.status === 'SUSPENDED') {
      issues.push({
        code: 'ERR_APAAR_NOT_FOUND',
        severity: 'Error',
        field: 'apaarId',
        message: `APAAR ID '${apaarId}' is marked as SUSPENDED in national records.`,
        ruleTitle: 'National APAAR Registry Verification',
      });
    } else {
      // Rule 3: Demographic match
      if (candidate.name && regCheck.name) {
        const nameMatch = mockApaarRegistry.compareNames(candidate.name, regCheck.name);
        if (!nameMatch.matches) {
          issues.push({
            code: 'WARN_DEMO_MISMATCH',
            severity: 'Warning',
            field: 'name',
            message: `Name mismatch: Submitted '${candidate.name}' vs APAAR Registry '${regCheck.name}' (Fuzzy match: ${(nameMatch.score * 100).toFixed(0)}%).`,
            ruleTitle: 'Demographic Match (Name & DOB)',
          });
        }
      }

      if (candidate.dob && regCheck.dob && candidate.dob !== regCheck.dob) {
        issues.push({
          code: 'WARN_DEMO_MISMATCH',
          severity: 'Warning',
          field: 'dob',
          message: `DOB mismatch: Submitted '${candidate.dob}' vs APAAR Registry '${regCheck.dob}'.`,
          ruleTitle: 'Demographic Match (Name & DOB)',
        });
      }
    }
  }

  // Rule 4: Intra-institutional Duplicate
  if (apaarId && candidate.institutionId && candidate.admissionYear) {
    const intraDup = context.existingStudents.find(
      (s) =>
        s.id !== candidate.id &&
        s.apaarId.replace(/[\s-]/g, '') === apaarId &&
        s.institutionId === candidate.institutionId &&
        s.admissionYear === candidate.admissionYear &&
        s.programId === candidate.programId
    );
    if (intraDup) {
      issues.push({
        code: 'ERR_INTRA_DUPLICATE',
        severity: 'Error',
        field: 'apaarId',
        message: `Duplicate student: APAAR '${apaarId}' is already registered in '${candidate.programName || candidate.programId}' for session ${candidate.admissionYear}.`,
        ruleTitle: 'Intra-Institutional Duplicate Enrolment',
      });
    }
  }

  // Rule 5: Cross-institutional Duplicate
  if (apaarId && candidate.institutionId && candidate.admissionYear) {
    const crossDup = context.existingStudents.find(
      (s) =>
        s.id !== candidate.id &&
        s.apaarId.replace(/[\s-]/g, '') === apaarId &&
        s.institutionId !== candidate.institutionId &&
        s.admissionYear === candidate.admissionYear
    );
    if (crossDup) {
      issues.push({
        code: 'ERR_CROSS_INST_DUPLICATE',
        severity: 'Error',
        field: 'apaarId',
        message: `Cross-institutional dual enrolment: Student is already actively enrolled at '${crossDup.institutionName}' in session ${candidate.admissionYear}.`,
        ruleTitle: 'Cross-Institutional Dual Enrolment Conflict',
      });
    }
  }

  // Rule 7: Age eligibility (< 16 years)
  if (candidate.dob && candidate.admissionYear) {
    const birthYear = new Date(candidate.dob).getFullYear();
    const ageAtAdmission = candidate.admissionYear - birthYear;
    if (ageAtAdmission < 16) {
      issues.push({
        code: 'ERR_AGE_UNDER_16',
        severity: 'Error',
        field: 'dob',
        message: `Age ineligibility: Student is ${ageAtAdmission} years old at admission (${candidate.dob}). Minimum required age is 16 years.`,
        ruleTitle: 'Minimum Age Eligibility',
      });
    }
  }

  // Rule 8: FN & OCI Conflict
  if (candidate.isForeignNational && candidate.isOCI) {
    issues.push({
      code: 'ERR_CITIZENSHIP_CONFLICT',
      severity: 'Error',
      field: 'isForeignNational',
      message: 'Inconsistent citizenship status: Candidate cannot be simultaneously Foreign National (FN) and Overseas Citizen of India (OCI).',
      ruleTitle: 'OCI and Foreign National Conflict',
    });
  }

  // Rule 9: NRI sponsor validation
  if (candidate.isNRI && (!candidate.sponsorCategory || candidate.sponsorCategory === 'None')) {
    issues.push({
      code: 'WARN_NRI_SPONSOR',
      severity: 'Warning',
      field: 'sponsorCategory',
      message: 'NRI quota record lacks a declared sponsor category (Father, Mother, Legal Guardian, or First-Degree Relative).',
      ruleTitle: 'NRI Quota Sponsor Verification',
    });
  }

  // Rule 10: Academic admission window
  if (candidate.admissionDate && candidate.admissionYear) {
    const admDate = new Date(candidate.admissionDate);
    const month = admDate.getMonth() + 1; // 1-12
    // If admitted in January-May for current year or after December
    if (month < 6 || month > 11) {
      issues.push({
        code: 'WARN_ADMISSION_DATE',
        severity: 'Warning',
        field: 'admissionDate',
        message: `Admission date (${candidate.admissionDate}) is outside the normal AICTE academic admission window (June - November).`,
        ruleTitle: 'Academic Session Admission Cut-off Date',
      });
    }
  }

  // Rule 6: Intake Cap Check (if program & institution are provided)
  if (candidate.institutionId && candidate.programId && !candidate.isSupernumerary) {
    const inst = context.institutions.find((i) => i.id === candidate.institutionId);
    if (inst) {
      const prog = inst.programs.find((p) => p.id === candidate.programId);
      if (prog) {
        // Count regular admissions already present
        const currentRegular = context.existingStudents.filter(
          (s) =>
            s.id !== candidate.id &&
            s.institutionId === candidate.institutionId &&
            s.programId === candidate.programId &&
            !s.isSupernumerary &&
            s.admissionYear === (candidate.admissionYear || 2026)
        ).length;

        if (currentRegular >= prog.approvedIntake) {
          issues.push({
            code: 'ERR_INTAKE_CAP',
            severity: 'Error',
            field: 'programId',
            message: `Intake cap exceeded: Program '${prog.name}' has approved intake of ${prog.approvedIntake}. Regular admissions already at ${currentRegular}.`,
            ruleTitle: 'Approved Intake Cap Compliance',
          });
        }
      }
    }
  }

  const hasError = issues.some((i) => i.severity === 'Error');
  const hasWarning = issues.some((i) => i.severity === 'Warning');

  return {
    isValid: !hasError,
    status: hasError ? 'Error' : hasWarning ? 'Warning' : 'Valid',
    issues,
  };
}

/**
 * Pure function: Validate an entire batch of students
 */
export function validateBatch(
  candidates: Partial<Student>[],
  context: ValidationContext
): Array<{ candidate: Partial<Student>; result: ValidationResult }> {
  // We can track intra-batch duplicates as well
  const seenApaarInBatch = new Map<string, number>();

  return candidates.map((candidate, idx) => {
    const rawApaar = (candidate.apaarId || '').replace(/[\s-]/g, '').trim();
    const result = validateStudentRecord(candidate, context);

    if (rawApaar && /^\d{12}$/.test(rawApaar)) {
      if (seenApaarInBatch.has(rawApaar)) {
        const prevIdx = seenApaarInBatch.get(rawApaar)!;
        result.issues.push({
          code: 'ERR_INTRA_DUPLICATE',
          severity: 'Error',
          field: 'apaarId',
          message: `Batch duplicate: APAAR '${rawApaar}' appears multiple times in upload (Row ${prevIdx + 1} and Row ${idx + 1}).`,
          ruleTitle: 'Intra-Institutional Duplicate Enrolment',
        });
        result.isValid = false;
        result.status = 'Error';
      } else {
        seenApaarInBatch.set(rawApaar, idx);
      }
    }

    return { candidate, result };
  });
}

/**
 * Quick unit-style sanity check on pure functions
 */
export function runValidationSanityChecks(): { passed: boolean; testResults: { name: string; passed: boolean; message: string }[] } {
  const tests: { name: string; passed: boolean; message: string }[] = [];

  // Test 1: Invalid APAAR format
  const t1 = validateStudentRecord(
    { apaarId: '12345', name: 'Test Student' },
    { existingStudents: [], institutions: [] }
  );
  tests.push({
    name: 'Reject 5-digit APAAR ID',
    passed: t1.status === 'Error' && t1.issues.some((i) => i.code === 'ERR_APAAR_FORMAT'),
    message: t1.issues[0]?.message || 'Passed',
  });

  // Test 2: FN and OCI conflict
  const t2 = validateStudentRecord(
    { apaarId: '999988887777', isForeignNational: true, isOCI: true },
    { existingStudents: [], institutions: [] }
  );
  tests.push({
    name: 'Reject simultaneous FN and OCI flags',
    passed: t2.issues.some((i) => i.code === 'ERR_CITIZENSHIP_CONFLICT'),
    message: t2.issues.find((i) => i.code === 'ERR_CITIZENSHIP_CONFLICT')?.message || 'Passed',
  });

  // Test 3: Age under 16
  const t3 = validateStudentRecord(
    { apaarId: '999988887777', dob: '2013-05-10', admissionYear: 2026 },
    { existingStudents: [], institutions: [] }
  );
  tests.push({
    name: 'Reject candidate under 16 years of age',
    passed: t3.issues.some((i) => i.code === 'ERR_AGE_UNDER_16'),
    message: t3.issues.find((i) => i.code === 'ERR_AGE_UNDER_16')?.message || 'Passed',
  });

  const allPassed = tests.every((t) => t.passed);
  return { passed: allPassed, testResults: tests };
}
