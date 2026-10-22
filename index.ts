export type Role = 'aicte_admin' | 'institution_admin' | 'verifier' | 'student';

export interface Program {
  id: string;
  name: string;
  code: string;
  approvedIntake: number;
  supernumeraryQuota: number; // e.g., 18 (15% supernumerary quota for EWS/TFWS/NRI/FN)
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  state: string;
  city: string;
  type: 'Government' | 'Autonomous' | 'Private';
  programs: Program[];
  establishedYear: number;
}

export type Category = 'General' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS';
export type QuotaType = 'State Merit' | 'All India' | 'Management' | 'NRI' | 'Supernumerary';
export type SponsorCategory = 'Father' | 'Mother' | 'Legal Guardian' | 'First Degree Relative' | 'None';

export interface ValidationIssue {
  code: string;
  severity: 'Error' | 'Warning';
  field: string;
  message: string;
  ruleTitle: string;
}

export interface ValidationResult {
  isValid: boolean;
  status: 'Valid' | 'Warning' | 'Error';
  issues: ValidationIssue[];
}

export interface Student {
  id: string;
  apaarId: string;
  name: string;
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  institutionId: string;
  institutionName: string;
  state: string;
  programId: string;
  programName: string;
  admissionYear: number;
  admissionDate: string;
  category: Category;
  quotaType: QuotaType;
  isNRI: boolean;
  isOCI: boolean;
  isForeignNational: boolean;
  isSupernumerary: boolean;
  sponsorCategory?: SponsorCategory;
  status: 'Enrolled' | 'Graduated' | 'Active' | 'Disputed';
  verificationStatus: 'Valid' | 'Warning' | 'Error';
  validationIssues: ValidationIssue[];
  degreeAwardedDate?: string;
  degreeCgpa?: number;
  credentialHash?: string;
}

export interface MockApaarRecord {
  apaarId: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  aadhaarVaultRef: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface ApaarVerifyResponse {
  exists: boolean;
  apaarId: string;
  name?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  error?: string;
}

export interface RiskFactorContribution {
  factor: string;
  weight: number;
  rawMetric: string;
  scoreContribution: number;
  description: string;
}

export interface InstitutionRisk {
  institutionId: string;
  institutionName: string;
  state: string;
  totalEnrolled: number;
  approvedCapacity: number;
  rejectionRate: number;
  intakeOvershootPercent: number;
  nriSupernumeraryShare: number;
  nriSupernumeraryZScore: number;
  duplicateRate: number;
  admissionSpikePercent: number;
  compositeRiskScore: number; // 0 - 100
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  factorContributions: RiskFactorContribution[];
}

export interface ConsentRequest {
  id: string;
  apaarId: string;
  studentName: string;
  verifierName: string;
  verifierOrg: string;
  purpose: string;
  requestedAt: string;
  expiresAt: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'REVOKED';
  approvedAt?: string;
  revokedAt?: string;
  permittedFields: string[];
  verificationHash?: string;
}

export interface AuditLogEntry {
  id: string;
  index: number;
  timestamp: string;
  action:
    | 'GENESIS_BLOCK'
    | 'UPLOAD_BATCH'
    | 'COMMIT_RECORDS'
    | 'CONSENT_REQUEST'
    | 'CONSENT_APPROVED'
    | 'CONSENT_DENIED'
    | 'CONSENT_REVOKED'
    | 'RECORD_VERIFIED'
    | 'FLAG_REVIEWED'
    | 'INTAKE_ALERT';
  actorRole: string;
  actorEntity: string;
  details: string;
  previousHash: string;
  currentHash: string;
}

export interface StateUtilisation {
  state: string;
  institutionsCount: number;
  approvedIntake: number;
  regularAdmissions: number;
  supernumeraryAdmissions: number;
  totalAdmissions: number;
  utilisationRate: number; // percentage
  flaggedCount: number;
}
