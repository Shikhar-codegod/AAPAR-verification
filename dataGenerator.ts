import { Institution, MockApaarRecord, Student, Category, QuotaType, SponsorCategory } from '../types';
import { mockApaarRegistry } from './apaarRegistry';
import { validateStudentRecord } from './validationEngine';
import { sha256 } from './cryptoLedger';

const FIRST_NAMES_MALE = [
  'Aarav', 'Aditya', 'Arjun', 'Dhruv', 'Kabir', 'Rohan', 'Vivaan', 'Sai', 'Vihaan', 'Reyansh',
  'Aayush', 'Karthik', 'Siddharth', 'Nikhil', 'Harsh', 'Pranav', 'Varun', 'Yash', 'Rishi', 'Abhinav',
  'Gautam', 'Anirudh', 'Devansh', 'Kunal', 'Manish', 'Raghav', 'Suraj', 'Tejas', 'Utkarsh', 'Vikram',
  'Aniket', 'Chinmay', 'Darshan', 'Ganesh', 'Kailash', 'Mihir', 'Omkar', 'Pushkar', 'Rahul', 'Sumeet'
];

const FIRST_NAMES_FEMALE = [
  'Aanya', 'Diya', 'Ananya', 'Isha', 'Myra', 'Navya', 'Pooja', 'Riya', 'Saanvi', 'Tanvi',
  'Aditi', 'Anushka', 'Ishani', 'Kavya', 'Meera', 'Nandini', 'Prisha', 'Rhea', 'Shruti', 'Tara',
  'Avani', 'Gayatri', 'Ishita', 'Khushi', 'Lavanya', 'Meenakshi', 'Neha', 'Parvati', 'Ruchika', 'Sneha',
  'Swati', 'Trisha', 'Vaishnavi', 'Vidya', 'Yamini', 'Bhavna', 'Charu', 'Deepika', 'Divya', 'Garima'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Singh', 'Gupta', 'Kumar', 'Banerjee',
  'Chatterjee', 'Mukherjee', 'Deshmukh', 'Kulkarni', 'Joshi', 'Patil', 'Pawar', 'Chauhan', 'Yadav', 'Mishra',
  'Pandey', 'Tiwari', 'Bose', 'Sen', 'Dutta', 'Menon', 'Pillai', 'Rao', 'Bhat', 'Shetty',
  'Gowda', 'Hegde', 'Mehta', 'Shah', 'Modi', 'Agarwal', 'Bansal', 'Goyal', 'Mittals', 'Soni'
];

export const STATES_AND_INSTITUTIONS: {
  state: string;
  institutions: { code: string; name: string; city: string; type: 'Government' | 'Autonomous' | 'Private' }[];
}[] = [
  {
    state: 'Maharashtra',
    institutions: [
      { code: 'AICTE-MH-1001', name: 'Veermata Jijabai Technological Institute (VJTI)', city: 'Mumbai', type: 'Government' },
      { code: 'AICTE-MH-1002', name: 'COEP Technological University', city: 'Pune', type: 'Autonomous' },
      { code: 'AICTE-MH-1003', name: 'Walchand College of Engineering', city: 'Sangli', type: 'Autonomous' },
      { code: 'AICTE-MH-1004', name: 'Visvesvaraya National Institute of Technology', city: 'Nagpur', type: 'Government' },
    ],
  },
  {
    state: 'Tamil Nadu',
    institutions: [
      { code: 'AICTE-TN-1001', name: 'College of Engineering, Guindy (Anna University)', city: 'Chennai', type: 'Government' },
      { code: 'AICTE-TN-1002', name: 'PSG College of Technology', city: 'Coimbatore', type: 'Autonomous' },
      { code: 'AICTE-TN-1003', name: 'Coimbatore Institute of Technology (CIT)', city: 'Coimbatore', type: 'Autonomous' },
      { code: 'AICTE-TN-1004', name: 'Madras Institute of Technology (MIT)', city: 'Chromepet', type: 'Government' },
    ],
  },
  {
    state: 'Karnataka',
    institutions: [
      { code: 'AICTE-KA-1001', name: 'R.V. College of Engineering (RVCE)', city: 'Bengaluru', type: 'Autonomous' },
      { code: 'AICTE-KA-1002', name: 'BMS College of Engineering', city: 'Bengaluru', type: 'Autonomous' },
      { code: 'AICTE-KA-1003', name: 'PES University Institute of Technology', city: 'Bengaluru', type: 'Private' },
      { code: 'AICTE-KA-1004', name: 'National Institute of Technology Karnataka (NITK)', city: 'Surathkal', type: 'Government' },
    ],
  },
  {
    state: 'Uttar Pradesh',
    institutions: [
      { code: 'AICTE-UP-1001', name: 'Harcourt Butler Technical University (HBTU)', city: 'Kanpur', type: 'Government' },
      { code: 'AICTE-UP-1002', name: 'Institute of Engineering and Technology (IET)', city: 'Lucknow', type: 'Government' },
      { code: 'AICTE-UP-1003', name: 'Madan Mohan Malaviya University of Technology', city: 'Gorakhpur', type: 'Government' },
      { code: 'AICTE-UP-1004', name: 'JSS Academy of Technical Education', city: 'Noida', type: 'Private' },
    ],
  },
  {
    state: 'Telangana',
    institutions: [
      { code: 'AICTE-TS-1001', name: 'JNTUH University College of Engineering', city: 'Hyderabad', type: 'Government' },
      { code: 'AICTE-TS-1002', name: 'University College of Engineering (Osmania)', city: 'Hyderabad', type: 'Government' },
      { code: 'AICTE-TS-1003', name: 'Chaitanya Bharathi Institute of Technology (CBIT)', city: 'Hyderabad', type: 'Autonomous' },
      { code: 'AICTE-TS-1004', name: 'VNR Vignana Jyothi Institute of Engineering', city: 'Hyderabad', type: 'Autonomous' },
    ],
  },
  {
    state: 'Gujarat',
    institutions: [
      { code: 'AICTE-GJ-1001', name: 'L.D. College of Engineering', city: 'Ahmedabad', type: 'Government' },
      { code: 'AICTE-GJ-1002', name: 'Faculty of Tech & Engg, MSU Baroda', city: 'Vadodara', type: 'Government' },
      { code: 'AICTE-GJ-1003', name: 'Birla Vishvakarma Mahavidyalaya (BVM)', city: 'Vallabh Vidyanagar', type: 'Autonomous' },
      { code: 'AICTE-GJ-1004', name: 'Nirma University Institute of Technology', city: 'Ahmedabad', type: 'Private' },
    ],
  },
  {
    state: 'Rajasthan',
    institutions: [
      { code: 'AICTE-RJ-1001', name: 'MBM University College of Engineering', city: 'Jodhpur', type: 'Government' },
      { code: 'AICTE-RJ-1002', name: 'University Department of Engineering, RTU', city: 'Kota', type: 'Government' },
      { code: 'AICTE-RJ-1003', name: 'Malaviya National Institute of Technology (MNIT)', city: 'Jaipur', type: 'Government' },
      { code: 'AICTE-RJ-1004', name: 'College of Technology and Engineering (CTAE)', city: 'Udaipur', type: 'Government' },
    ],
  },
  {
    state: 'West Bengal',
    institutions: [
      { code: 'AICTE-WB-1001', name: 'Faculty of Engineering & Tech, Jadavpur University', city: 'Kolkata', type: 'Government' },
      { code: 'AICTE-WB-1002', name: 'IIEST Shibpur (Indian Institute of Engineering)', city: 'Howrah', type: 'Government' },
      { code: 'AICTE-WB-1003', name: 'Heritage Institute of Technology', city: 'Kolkata', type: 'Autonomous' },
      { code: 'AICTE-WB-1004', name: 'Kalyani Government Engineering College', city: 'Kalyani', type: 'Government' },
    ],
  },
  {
    state: 'Kerala',
    institutions: [
      { code: 'AICTE-KL-1001', name: 'College of Engineering Trivandrum (CET)', city: 'Thiruvananthapuram', type: 'Government' },
      { code: 'AICTE-KL-1002', name: 'Government Engineering College (GEC)', city: 'Thrissur', type: 'Government' },
      { code: 'AICTE-KL-1003', name: 'TKM College of Engineering', city: 'Kollam', type: 'Autonomous' },
      { code: 'AICTE-KL-1004', name: 'Model Engineering College (MEC)', city: 'Ernakulam', type: 'Government' },
    ],
  },
  {
    state: 'Delhi',
    institutions: [
      { code: 'AICTE-DL-1001', name: 'Delhi Technological University (DTU)', city: 'Delhi', type: 'Government' },
      { code: 'AICTE-DL-1002', name: 'Netaji Subhas University of Technology (NSUT)', city: 'Delhi', type: 'Government' },
      { code: 'AICTE-DL-1003', name: 'Indira Gandhi Delhi Technical University for Women', city: 'Delhi', type: 'Government' },
      { code: 'AICTE-DL-1004', name: 'Faculty of Engineering & Tech, Jamia Millia Islamia', city: 'Delhi', type: 'Government' },
    ],
  },
];

export const STANDARD_PROGRAMS = [
  { id: 'prog-cse', code: 'CSE', name: 'B.Tech in Computer Science and Engineering', approvedIntake: 120, supernumeraryQuota: 18 },
  { id: 'prog-ece', code: 'ECE', name: 'B.Tech in Electronics and Communication Engineering', approvedIntake: 120, supernumeraryQuota: 18 },
  { id: 'prog-me', code: 'MECH', name: 'B.Tech in Mechanical Engineering', approvedIntake: 60, supernumeraryQuota: 9 },
];

/**
 * Generate 40 institutions across 10 states
 */
export function generateInstitutions(): Institution[] {
  const institutions: Institution[] = [];
  let idCounter = 1;

  for (const group of STATES_AND_INSTITUTIONS) {
    for (const inst of group.institutions) {
      institutions.push({
        id: `inst-${idCounter.toString().padStart(3, '0')}`,
        code: inst.code,
        name: inst.name,
        state: group.state,
        city: inst.city,
        type: inst.type,
        establishedYear: 1950 + ((idCounter * 7) % 65),
        programs: STANDARD_PROGRAMS.map((p) => ({
          ...p,
          id: `${p.id}-${idCounter}`,
        })),
      });
      idCounter++;
    }
  }

  return institutions;
}

// Pseudo-random deterministic generator for repeatable synthetic test data
class DeterministicPRNG {
  private seed: number;
  constructor(seed = 42) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }
}

export function generateSyntheticDataset(institutions: Institution[]): {
  students: Student[];
  registryRecords: MockApaarRecord[];
} {
  const prng = new DeterministicPRNG(2026);
  const students: Student[] = [];
  const registryRecords: MockApaarRecord[] = [];

  const CATEGORIES: Category[] = ['General', 'General', 'OBC-NCL', 'OBC-NCL', 'SC', 'ST', 'EWS'];
  const QUOTA_TYPES: QuotaType[] = ['State Merit', 'State Merit', 'All India', 'Management'];

  let apaarSeed = 100000000000;
  let studentCounter = 1;

  // 3 institutions flagged for exceeding regular intake:
  // 1. DTU (inst-037) CSE
  // 2. HBTU Kanpur (inst-013) CSE
  // 3. LD College of Engineering (inst-021) ECE
  const overshootInstitutions = new Set(['inst-037', 'inst-013', 'inst-021']);

  // Pool of legitimate citizen records created first
  for (const inst of institutions) {
    const isOvershoot = overshootInstitutions.has(inst.id);

    for (const prog of inst.programs) {
      // Determine student count for this program
      let targetRegularCount = isOvershoot && (prog.code === 'CSE' || prog.code === 'ECE')
        ? prog.approvedIntake + (inst.id === 'inst-037' ? 22 : inst.id === 'inst-013' ? 14 : 10)
        : Math.min(prog.approvedIntake, Math.floor(prog.approvedIntake * (0.85 + prng.next() * 0.14)));

      // Supernumerary students (TFWS/EWS/Sports/NRI)
      const targetSupernumeraryCount = Math.floor(prog.supernumeraryQuota * (0.6 + prng.next() * 0.38));
      const totalStudentsForProg = targetRegularCount + targetSupernumeraryCount;

      for (let s = 0; s < totalStudentsForProg; s++) {
        const isSupernumerary = s >= targetRegularCount;
        const isMale = prng.next() > 0.42;
        const firstName = isMale ? prng.pick(FIRST_NAMES_MALE) : prng.pick(FIRST_NAMES_FEMALE);
        const lastName = prng.pick(LAST_NAMES);
        const fullName = `${firstName} ${lastName}`;
        const gender = isMale ? 'Male' : 'Female';

        apaarSeed += 137;
        const apaarIdStr = apaarSeed.toString();

        // DOB between 2004 and 2007 (age 18-21 at admission in 2025/2026)
        const birthYear = 2004 + (studentCounter % 4);
        const birthMonth = (1 + (studentCounter % 12)).toString().padStart(2, '0');
        const birthDay = (1 + (studentCounter % 28)).toString().padStart(2, '0');
        const dob = `${birthYear}-${birthMonth}-${birthDay}`;

        const isNRI = !isSupernumerary && prng.next() < 0.04;
        const isOCI = !isNRI && prng.next() < 0.015;
        const isFN = !isNRI && !isOCI && prng.next() < 0.01;

        let sponsorCategory: SponsorCategory | undefined = undefined;
        if (isNRI) {
          sponsorCategory = prng.pick(['Father', 'Mother', 'First Degree Relative', 'Legal Guardian']);
        }

        const category = prng.pick(CATEGORIES);
        const quotaType: QuotaType = isSupernumerary
          ? 'Supernumerary'
          : isNRI
          ? 'NRI'
          : prng.pick(QUOTA_TYPES);

        // Admission Date in June - October
        const admMonth = (6 + (studentCounter % 5)).toString().padStart(2, '0');
        const admDay = (1 + (studentCounter % 25)).toString().padStart(2, '0');
        const admissionYear = 2026;
        const admissionDate = `${admissionYear}-${admMonth}-${admDay}`;

        // Create standard registry entry
        const registryRecord: MockApaarRecord = {
          apaarId: apaarIdStr,
          name: fullName,
          dob,
          gender,
          aadhaarVaultRef: `AV-IN-${studentCounter.toString().padStart(8, '0')}`,
          status: 'ACTIVE',
        };
        registryRecords.push(registryRecord);

        // Credential hash
        const credHash = sha256(`CERT|${apaarIdStr}|${fullName}|${inst.name}|${prog.name}|${admissionYear}`);

        const student: Student = {
          id: `stu-${studentCounter.toString().padStart(5, '0')}`,
          apaarId: apaarIdStr,
          name: fullName,
          dob,
          gender,
          institutionId: inst.id,
          institutionName: inst.name,
          state: inst.state,
          programId: prog.id,
          programName: prog.name,
          admissionYear,
          admissionDate,
          category,
          quotaType,
          isNRI,
          isOCI,
          isForeignNational: isFN,
          isSupernumerary,
          sponsorCategory,
          status: 'Enrolled',
          verificationStatus: 'Valid',
          validationIssues: [],
          degreeCgpa: +(7.2 + prng.next() * 2.6).toFixed(2),
          credentialHash: credHash,
        };

        students.push(student);
        studentCounter++;
      }
    }
  }

  // Seed the central mock registry with all valid generated identities
  mockApaarRegistry.seedRegistry(registryRecords);

  // ----------------------------------------------------
  // DELIBERATELY PLANT PROBLEMS (AS EXPLICITLY REQUIRED):
  // 1. ~40 duplicate APAAR IDs
  // 2. ~60 invalid or missing IDs
  // 3. ~25 students enrolled at two institutions in the same year (cross-institutional)
  // 4. Inconsistent records: FN + OCI both true, DOB under 16, NRI missing sponsor
  // ----------------------------------------------------

  // 1. Plant ~40 Duplicate APAAR IDs (students sharing the same APAAR within or across)
  for (let i = 0; i < 40; i++) {
    const targetIdx = 100 + i * 35;
    const sourceIdx = 20 + i * 2;
    if (students[targetIdx] && students[sourceIdx]) {
      students[targetIdx].apaarId = students[sourceIdx].apaarId;
    }
  }

  // 2. Plant ~60 invalid or missing APAAR IDs
  // (e.g. 11 digits, alphanumeric, empty, or unlisted in APAAR registry)
  for (let i = 0; i < 60; i++) {
    const idx = 300 + i * 25;
    if (students[idx]) {
      if (i % 4 === 0) {
        students[idx].apaarId = '9876543210'; // 10 digits
      } else if (i % 4 === 1) {
        students[idx].apaarId = '4589X72190A2'; // alphanumeric
      } else if (i % 4 === 2) {
        students[idx].apaarId = ''; // missing
      } else {
        students[idx].apaarId = '999988887777'; // 12 digits, but not in registry
      }
    }
  }

  // 3. Plant ~25 Cross-institution dual enrolments (active at two institutions in 2026)
  for (let i = 0; i < 25; i++) {
    const studentA = students[600 + i * 40];
    const studentB = students[1800 + i * 30];
    if (studentA && studentB && studentA.institutionId !== studentB.institutionId) {
      studentB.apaarId = studentA.apaarId;
      studentB.name = studentA.name;
      studentB.dob = studentA.dob;
      studentB.admissionYear = 2026;
    }
  }

  // 4. Plant inconsistent records
  // 12 records where FN and OCI are both true
  for (let i = 0; i < 12; i++) {
    const idx = 800 + i * 70;
    if (students[idx]) {
      students[idx].isForeignNational = true;
      students[idx].isOCI = true;
    }
  }

  // 15 records where DOB makes the student under 16 at admission in 2026
  for (let i = 0; i < 15; i++) {
    const idx = 950 + i * 60;
    if (students[idx]) {
      students[idx].dob = '2013-08-15'; // age 13
    }
  }

  // 20 records where NRI is true but sponsorCategory is None or missing
  for (let i = 0; i < 20; i++) {
    const idx = 1100 + i * 50;
    if (students[idx]) {
      students[idx].isNRI = true;
      students[idx].sponsorCategory = 'None';
    }
  }

  // Now run validation across all students in context to populate initial status & issues
  const validationContext = {
    existingStudents: students,
    institutions,
    academicYear: 2026,
  };

  for (let i = 0; i < students.length; i++) {
    const res = validateStudentRecord(students[i], validationContext);
    students[i].verificationStatus = res.status;
    students[i].validationIssues = res.issues;
  }

  return { students, registryRecords };
}
