import { ApaarVerifyResponse, MockApaarRecord } from '../types';

/**
 * Mock APAAR Registry Module
 * Simulates the National Academic Bank of Credits (ABC) & APAAR Registry API
 * Designed with a clean adapter interface so a real Digilocker/NDML/NCTE/AICTE API can replace it.
 */
class ApaarRegistryService {
  private registry: Map<string, MockApaarRecord> = new Map();

  /**
   * Seed the central mock registry with known citizen records
   */
  public seedRegistry(records: MockApaarRecord[]): void {
    records.forEach((rec) => {
      this.registry.set(rec.apaarId.replace(/\s+/g, ''), rec);
    });
  }

  /**
   * Register or update a citizen APAAR record
   */
  public registerRecord(record: MockApaarRecord): void {
    this.registry.set(record.apaarId.replace(/\s+/g, ''), record);
  }

  /**
   * Standard adapter interface for APAAR / ABC National Gateway
   * verifyApaar(id) -> { exists, name, dob, gender, status, error }
   */
  public async verifyApaar(rawApaarId: string): Promise<ApaarVerifyResponse> {
    // Simulate brief network latency for realism if needed, or synchronous immediate return
    const sanitized = (rawApaarId || '').replace(/[\s-]/g, '').trim();

    // 12-digit format check
    if (!/^\d{12}$/.test(sanitized)) {
      return {
        exists: false,
        apaarId: sanitized,
        error: `Invalid APAAR format: Expected 12 numeric digits, received '${sanitized}' (${sanitized.length} characters).`,
      };
    }

    const record = this.registry.get(sanitized);
    if (!record) {
      return {
        exists: false,
        apaarId: sanitized,
        error: `APAAR ID '${sanitized}' not found in the National APAAR/ABC Registry.`,
      };
    }

    if (record.status === 'SUSPENDED') {
      return {
        exists: true,
        apaarId: sanitized,
        name: record.name,
        dob: record.dob,
        gender: record.gender,
        status: 'SUSPENDED',
        error: `APAAR ID is suspended due to regulatory hold or duplicate Aadhaar linkage.`,
      };
    }

    return {
      exists: true,
      apaarId: sanitized,
      name: record.name,
      dob: record.dob,
      gender: record.gender,
      status: record.status,
    };
  }

  /**
   * Synchronous lookup for high-throughput batch validation
   */
  public lookupSync(rawApaarId: string): ApaarVerifyResponse {
    const sanitized = (rawApaarId || '').replace(/[\s-]/g, '').trim();
    if (!/^\d{12}$/.test(sanitized)) {
      return {
        exists: false,
        apaarId: sanitized,
        error: `Invalid APAAR format: 12 digits required. Received: '${sanitized}'.`,
      };
    }
    const record = this.registry.get(sanitized);
    if (!record) {
      return {
        exists: false,
        apaarId: sanitized,
        error: `APAAR ID '${sanitized}' does not exist in national registry.`,
      };
    }
    return {
      exists: true,
      apaarId: sanitized,
      name: record.name,
      dob: record.dob,
      gender: record.gender,
      status: record.status,
    };
  }

  /**
   * Helper fuzzy name comparison (token matching & Levenshtein similarity)
   */
  public compareNames(inputName: string, registryName: string): { matches: boolean; score: number } {
    const clean1 = (inputName || '').trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const clean2 = (registryName || '').trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');

    if (clean1 === clean2) return { matches: true, score: 1.0 };

    const tokens1 = clean1.split(/\s+/).filter(Boolean);
    const tokens2 = clean2.split(/\s+/).filter(Boolean);

    // Check if tokens contain each other (e.g., "Aarav Sharma" vs "Aarav Kumar Sharma")
    const matchedTokens = tokens1.filter((t) => tokens2.includes(t));
    const tokenScore = (matchedTokens.length * 2) / (tokens1.length + tokens2.length);

    if (tokenScore >= 0.7) {
      return { matches: true, score: tokenScore };
    }

    const dist = this.levenshteinDistance(clean1, clean2);
    const maxLen = Math.max(clean1.length, clean2.length);
    const levScore = 1 - dist / maxLen;

    return {
      matches: levScore >= 0.75,
      score: Math.max(tokenScore, levScore),
    };
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  public getRegistrySize(): number {
    return this.registry.size;
  }
}

export const mockApaarRegistry = new ApaarRegistryService();
