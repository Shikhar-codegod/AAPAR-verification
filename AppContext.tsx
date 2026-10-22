import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  Role,
  Institution,
  Student,
  ConsentRequest,
  AuditLogEntry,
  ValidationResult,
  InstitutionRisk,
  StateUtilisation,
} from '../types';
import { generateInstitutions, generateSyntheticDataset } from '../services/dataGenerator';
import { validateBatch, validateStudentRecord, ValidationContext } from '../services/validationEngine';
import { computeInstitutionRisks } from '../services/riskEngine';
import { createAuditBlock, createGenesisBlock, verifyLedgerIntegrity, sha256 } from '../services/cryptoLedger';
import { mockApaarRegistry } from '../services/apaarRegistry';

interface AppContextType {
  // State
  role: Role;
  setRole: (role: Role) => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  institutions: Institution[];
  students: Student[];
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  consentRequests: ConsentRequest[];
  auditLogs: AuditLogEntry[];
  institutionRisks: InstitutionRisk[];
  stateUtilisations: StateUtilisation[];
  demoStatus: { isRunning: boolean; step: number; message: string | null };

  // Computed
  totalVerifiedRecords: number;
  openFlagsCount: number;
  institutionsOverIntakeCount: number;
  crossInstitutionDuplicatesCount: number;
  currentInstitution: Institution;
  currentStudent: Student;

  // Actions
  addSingleStudent: (candidate: Partial<Student>) => ValidationResult;
  batchValidateDrafts: (candidates: Partial<Student>[]) => { candidate: Partial<Student>; result: ValidationResult }[];
  commitValidBatch: (validStudents: Student[], rejectedCount: number) => void;
  createConsentRequest: (apaarId: string, verifierName: string, verifierOrg: string, purpose: string) => ConsentRequest | null;
  approveConsent: (requestId: string, otp: string) => boolean;
  denyConsent: (requestId: string) => void;
  revokeConsent: (requestId: string) => void;
  verifyAuditIntegrity: () => { isValid: boolean; brokenIndex?: number; message: string; totalBlocks: number };
  simulateTamperLog: () => void;
  restoreAuditLog: () => void;
  runDemoStory: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize Institutions
  const [institutions] = useState<Institution[]>(() => generateInstitutions());

  // Initialize Students & Registry
  const [students, setStudents] = useState<Student[]>(() => {
    const { students } = generateSyntheticDataset(institutions);
    return students;
  });

  const [role, setRole] = useState<Role>('aicte_admin');
  const [activeScreen, setActiveScreen] = useState<string>('aicte_dashboard');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('inst-001');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Initial Audit Logs with Genesis Block
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const genesis = createGenesisBlock();
    const blk1 = createAuditBlock(
      'UPLOAD_BATCH',
      'AICTE_SYSTEM',
      'AICTE Central Server',
      'Seeded 40 State Institutions and baseline academic programs for academic year 2026.',
      genesis
    );
    const blk2 = createAuditBlock(
      'COMMIT_RECORDS',
      'INSTITUTION_REGISTRAR',
      'Veermata Jijabai Technological Institute (VJTI)',
      'Committed 132 validated APAAR student enrolment credentials.',
      blk1
    );
    const blk3 = createAuditBlock(
      'INTAKE_ALERT',
      'AICTE_REGULATOR',
      'Regional Directorate',
      'Automated intake alert: Delhi Technological University exceeded approved intake by 22 seats in CSE.',
      blk2
    );
    return [genesis, blk1, blk2, blk3];
  });

  // Initial Consent Requests
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>(() => [
    {
      id: 'req-101',
      apaarId: '100000000137',
      studentName: 'Aarav Sharma',
      verifierName: 'Vikram Malhotra',
      verifierOrg: 'Tata Consultancy Services (HR Background Verification)',
      purpose: 'Employment credential and degree awarding validation for Software Engineer role',
      requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * 20).toISOString(),
      status: 'APPROVED',
      approvedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      permittedFields: ['Status', 'Institution', 'Program', 'Admission Year'],
      verificationHash: sha256('TCS-VERIFY|100000000137|Aarav Sharma|Veermata Jijabai Technological Institute (VJTI)'),
    },
    {
      id: 'req-102',
      apaarId: '100000000274',
      studentName: 'Diya Verma',
      verifierName: 'Ananya Deshmukh',
      verifierOrg: 'Infosys Credentials Desk',
      purpose: 'Graduate Engineering Trainee Onboarding Compliance',
      requestedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * 22).toISOString(),
      status: 'PENDING',
      permittedFields: ['Status', 'Institution', 'Program', 'Admission Year'],
    },
  ]);

  const [demoStatus, setDemoStatus] = useState<{ isRunning: boolean; step: number; message: string | null }>({
    isRunning: false,
    step: 0,
    message: null,
  });

  // Helper to add audit log block safely
  const appendAuditLog = useCallback(
    (action: AuditLogEntry['action'], actorRole: string, actorEntity: string, details: string) => {
      setAuditLogs((prev) => {
        const lastEntry = prev.length > 0 ? prev[prev.length - 1] : undefined;
        const newBlock = createAuditBlock(action, actorRole, actorEntity, details, lastEntry);
        return [...prev, newBlock];
      });
    },
    []
  );

  // Set default student ID if none selected
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  // Derived current institution & student
  const currentInstitution = useMemo(
    () => institutions.find((i) => i.id === selectedInstitutionId) || institutions[0],
    [institutions, selectedInstitutionId]
  );

  const currentStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );

  // Compute institution risks dynamically from current state
  const institutionRisks = useMemo(() => {
    return computeInstitutionRisks(institutions, students);
  }, [institutions, students]);

  // Compute state-wise seat utilisation
  const stateUtilisations = useMemo(() => {
    const map = new Map<string, StateUtilisation>();

    for (const inst of institutions) {
      if (!map.has(inst.state)) {
        map.set(inst.state, {
          state: inst.state,
          institutionsCount: 0,
          approvedIntake: 0,
          regularAdmissions: 0,
          supernumeraryAdmissions: 0,
          totalAdmissions: 0,
          utilisationRate: 0,
          flaggedCount: 0,
        });
      }
      const entry = map.get(inst.state)!;
      entry.institutionsCount++;
      for (const p of inst.programs) {
        entry.approvedIntake += p.approvedIntake;
      }
    }

    for (const student of students) {
      const entry = map.get(student.state);
      if (entry) {
        entry.totalAdmissions++;
        if (student.isSupernumerary) {
          entry.supernumeraryAdmissions++;
        } else {
          entry.regularAdmissions++;
        }
        if (student.verificationStatus === 'Error' || student.verificationStatus === 'Warning') {
          entry.flaggedCount++;
        }
      }
    }

    const result = Array.from(map.values()).map((s) => {
      s.utilisationRate = s.approvedIntake > 0 ? +((s.regularAdmissions / s.approvedIntake) * 100).toFixed(1) : 0;
      return s;
    });

    return result.sort((a, b) => b.utilisationRate - a.utilisationRate);
  }, [institutions, students]);

  // KPI counters
  const totalVerifiedRecords = useMemo(
    () => students.filter((s) => s.verificationStatus === 'Valid').length,
    [students]
  );

  const openFlagsCount = useMemo(
    () => students.filter((s) => s.verificationStatus === 'Error' || s.verificationStatus === 'Warning').length,
    [students]
  );

  const institutionsOverIntakeCount = useMemo(() => {
    return institutionRisks.filter((r) => r.intakeOvershootPercent > 0).length;
  }, [institutionRisks]);

  const crossInstitutionDuplicatesCount = useMemo(() => {
    return students.filter((s) =>
      s.validationIssues.some((i) => i.code === 'ERR_CROSS_INST_DUPLICATE')
    ).length;
  }, [students]);

  // Action: Single student add
  const addSingleStudent = useCallback(
    (candidate: Partial<Student>): ValidationResult => {
      const context: ValidationContext = {
        existingStudents: students,
        institutions,
        academicYear: candidate.admissionYear || 2026,
      };

      const result = validateStudentRecord(candidate, context);

      const inst = institutions.find((i) => i.id === candidate.institutionId) || currentInstitution;
      const prog = inst?.programs.find((p) => p.id === candidate.programId) || inst?.programs[0];

      const newStudent: Student = {
        id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        apaarId: candidate.apaarId || '',
        name: candidate.name || 'Unnamed Student',
        dob: candidate.dob || '2005-01-01',
        gender: candidate.gender || 'Male',
        institutionId: inst.id,
        institutionName: inst.name,
        state: inst.state,
        programId: prog?.id || 'prog-cse',
        programName: prog?.name || 'Computer Science and Engineering',
        admissionYear: candidate.admissionYear || 2026,
        admissionDate: candidate.admissionDate || new Date().toISOString().split('T')[0],
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
        credentialHash: sha256(`CERT|${candidate.apaarId}|${candidate.name}|${inst.name}|${candidate.admissionYear}`),
      };

      setStudents((prev) => [newStudent, ...prev]);

      appendAuditLog(
        'COMMIT_RECORDS',
        'INSTITUTION_REGISTRAR',
        inst.name,
        `Added candidate ${newStudent.name} (APAAR: ${newStudent.apaarId}). Verification status: ${result.status}.`
      );

      return result;
    },
    [students, institutions, currentInstitution, appendAuditLog]
  );

  // Action: Batch validate candidate drafts
  const batchValidateDrafts = useCallback(
    (candidates: Partial<Student>[]) => {
      const context: ValidationContext = {
        existingStudents: students,
        institutions,
        academicYear: 2026,
      };
      return validateBatch(candidates, context);
    },
    [students, institutions]
  );

  // Action: Commit valid batch of students
  const commitValidBatch = useCallback(
    (validStudents: Student[], rejectedCount: number) => {
      setStudents((prev) => [...validStudents, ...prev]);
      const instName = validStudents[0]?.institutionName || 'Institution';

      appendAuditLog(
        'COMMIT_RECORDS',
        'INSTITUTION_REGISTRAR',
        instName,
        `Committed ${validStudents.length} verified student records to national registry. (${rejectedCount} records held in exception queue).`
      );
    },
    [appendAuditLog]
  );

  // Action: Create verification consent request
  const createConsentRequest = useCallback(
    (apaarId: string, verifierName: string, verifierOrg: string, purpose: string): ConsentRequest | null => {
      const sanitizedApaar = apaarId.replace(/[\s-]/g, '').trim();
      const student = students.find((s) => s.apaarId.replace(/[\s-]/g, '') === sanitizedApaar);

      const newRequest: ConsentRequest = {
        id: `req-${Date.now()}`,
        apaarId: sanitizedApaar,
        studentName: student ? student.name : 'Unknown Citizen / Student',
        verifierName,
        verifierOrg,
        purpose,
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
        status: 'PENDING',
        permittedFields: ['Status', 'Institution', 'Program', 'Admission Year'],
      };

      setConsentRequests((prev) => [newRequest, ...prev]);

      appendAuditLog(
        'CONSENT_REQUEST',
        'VERIFIER_PORTAL',
        verifierOrg,
        `New consent request initiated for APAAR ID ${sanitizedApaar} for purpose: "${purpose}".`
      );

      return newRequest;
    },
    [students, appendAuditLog]
  );

  // Action: Approve consent with OTP
  const approveConsent = useCallback(
    (requestId: string, otp: string): boolean => {
      if (otp !== '123456' && otp.length !== 6) {
        return false;
      }

      setConsentRequests((prev) =>
        prev.map((req) => {
          if (req.id === requestId) {
            const student = students.find((s) => s.apaarId.replace(/[\s-]/g, '') === req.apaarId);
            const instName = student?.institutionName || 'AICTE Institute';
            const progName = student?.programName || 'Degree Program';
            const hash = sha256(`VERIFIED|${req.apaarId}|${req.studentName}|${instName}|${progName}|${Date.now()}`);

            return {
              ...req,
              status: 'APPROVED',
              approvedAt: new Date().toISOString(),
              verificationHash: hash,
            };
          }
          return req;
        })
      );

      appendAuditLog(
        'CONSENT_APPROVED',
        'STUDENT_CITIZEN',
        'Aadhaar/APAAR OTP Auth',
        `Consent granted for request ${requestId}. 24-hour verification token generated.`
      );

      return true;
    },
    [students, appendAuditLog]
  );

  // Action: Deny consent
  const denyConsent = useCallback(
    (requestId: string) => {
      setConsentRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: 'DENIED' } : req))
      );

      appendAuditLog(
        'CONSENT_DENIED',
        'STUDENT_CITIZEN',
        'Aadhaar/APAAR Auth',
        `Student denied verification consent for request ${requestId}.`
      );
    },
    [appendAuditLog]
  );

  // Action: Revoke consent
  const revokeConsent = useCallback(
    (requestId: string) => {
      setConsentRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: 'REVOKED', revokedAt: new Date().toISOString() } : req
        )
      );

      appendAuditLog(
        'CONSENT_REVOKED',
        'STUDENT_CITIZEN',
        'Aadhaar/APAAR Auth',
        `Verification access token immediately revoked by citizen for request ${requestId}.`
      );
    },
    [appendAuditLog]
  );

  // Action: Verify Audit Log Integrity
  const verifyAuditIntegrity = useCallback(() => {
    const res = verifyLedgerIntegrity(auditLogs);
    return {
      isValid: res.isValid,
      brokenIndex: res.brokenIndex,
      totalBlocks: res.totalBlocks,
      message: res.isValid
        ? `Ledger Cryptographically Verified: All ${res.totalBlocks} blocks intact with valid SHA-256 chain.`
        : `Ledger Tampering Detected at Block #${res.brokenIndex}! Hash mismatch violates cryptographic chain.`,
    };
  }, [auditLogs]);

  // Action: Simulate tampering with the audit log
  const simulateTamperLog = useCallback(() => {
    setAuditLogs((prev) => {
      if (prev.length <= 2) return prev;
      const clone = [...prev];
      // Tamper block #1 details
      clone[1] = {
        ...clone[1],
        details: 'TAMPERED: Altered student admission numbers without authorization!',
      };
      return clone;
    });
  }, []);

  // Action: Restore audit log
  const restoreAuditLog = useCallback(() => {
    const genesis = createGenesisBlock();
    const blk1 = createAuditBlock(
      'UPLOAD_BATCH',
      'AICTE_SYSTEM',
      'AICTE Central Server',
      'Seeded 40 State Institutions and baseline academic programs for academic year 2026.',
      genesis
    );
    const blk2 = createAuditBlock(
      'COMMIT_RECORDS',
      'INSTITUTION_REGISTRAR',
      'Veermata Jijabai Technological Institute (VJTI)',
      'Committed 132 validated APAAR student enrolment credentials.',
      blk1
    );
    const blk3 = createAuditBlock(
      'INTAKE_ALERT',
      'AICTE_REGULATOR',
      'Regional Directorate',
      'Automated intake alert: Delhi Technological University exceeded approved intake by 22 seats in CSE.',
      blk2
    );
    setAuditLogs([genesis, blk1, blk2, blk3]);
  }, []);

  // Action: Demo Mode Story Walkthrough
  const runDemoStory = useCallback(() => {
    setDemoStatus({
      isRunning: true,
      step: 1,
      message: 'Step 1/4: Simulating CSV upload for College of Engineering Guindy with planted anomalies...',
    });

    setTimeout(() => {
      // Step 2: plant extra dual enrolment & format errors
      setDemoStatus({
        isRunning: true,
        step: 2,
        message: 'Step 2/4: Validation engine analyzing APAAR formats, intake caps, and cross-college enrolments...',
      });

      // Inject demo students with errors
      const demoCandidate: Partial<Student> = {
        apaarId: '999988887777',
        name: 'Siddharth R. Iyer',
        dob: '2014-04-12', // under 16
        gender: 'Male',
        institutionId: 'inst-005',
        institutionName: 'College of Engineering, Guindy (Anna University)',
        state: 'Tamil Nadu',
        programId: 'prog-cse-5',
        programName: 'B.Tech in Computer Science and Engineering',
        admissionYear: 2026,
        admissionDate: '2026-08-20',
        category: 'General',
        quotaType: 'State Merit',
        isForeignNational: true,
        isOCI: true, // conflict!
      };

      addSingleStudent(demoCandidate);

      setTimeout(() => {
        setDemoStatus({
          isRunning: true,
          step: 3,
          message: 'Step 3/4: Flags caught! AICTE dashboard and Risk Engine recalculated institution scores.',
        });

        setTimeout(() => {
          setDemoStatus({
            isRunning: false,
            step: 4,
            message: 'Demo Complete: All 10 validation checks executed. Explore the Anomaly Detection and Audit Ledger tabs!',
          });
        }, 3000);
      }, 3000);
    }, 2500);
  }, [addSingleStudent]);

  // Reset all data
  const resetAllData = useCallback(() => {
    const { students: newStudents } = generateSyntheticDataset(institutions);
    setStudents(newStudents);
    restoreAuditLog();
    setDemoStatus({ isRunning: false, step: 0, message: null });
  }, [institutions, restoreAuditLog]);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeScreen,
        setActiveScreen,
        institutions,
        students,
        selectedInstitutionId,
        setSelectedInstitutionId,
        selectedStudentId,
        setSelectedStudentId,
        consentRequests,
        auditLogs,
        institutionRisks,
        stateUtilisations,
        demoStatus,
        totalVerifiedRecords,
        openFlagsCount,
        institutionsOverIntakeCount,
        crossInstitutionDuplicatesCount,
        currentInstitution,
        currentStudent,
        addSingleStudent,
        batchValidateDrafts,
        commitValidBatch,
        createConsentRequest,
        approveConsent,
        denyConsent,
        revokeConsent,
        verifyAuditIntegrity,
        simulateTamperLog,
        restoreAuditLog,
        runDemoStory,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
