import https from 'https';

// DentalXchange API Configuration
const DENTALXCHANGE_API_BASE = 'https://api.dentalxchange.com';

// Service type codes for dental procedures
export const ServiceTypeCodes = {
  DIAGNOSTIC_DENTAL: '23',
  PERIODONTICS: '24',
  RESTORATIVE: '25',
  ENDODONTICS: '26',
  MAXILLOFACIAL_PROSTHETICS: '27',
  ADJUNCTIVE_DENTAL: '28',
  HEALTH_BENEFIT_PLAN: '30',
  PLAN_WAITING_PERIOD: '32',
  DENTAL_CARE: '35',
  DENTAL_CROWNS: '36',
  DENTAL_ACCIDENT: '37',
  ORTHODONTICS: '38',
  PROSTHODONTICS: '39',
  ORAL_SURGERY: '40',
  ROUTINE_PREVENTIVE: '41',
  GENERAL_BENEFITS: '60',
} as const;

// Request/Response Types
export interface EligibilityProvider {
  type: '1' | '2'; // 1 = Individual, 2 = Organization
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  npi: string;
  taxId: string;
}

export interface EligibilityPayer {
  name: string;
  payerIdCode: string;
}

export interface EligibilityPatient {
  dateOfBirth: string; // YYYY-MM-DD
  memberId: string;
  firstName: string;
  lastName: string;
  relationship: string; // 18 = Self, 01 = Spouse, 19 = Child, etc.
}

export interface EligibilitySubscriber {
  dateOfBirth: string;
  memberId: string;
  firstName: string;
  lastName: string;
}

export interface EligibilityRequest {
  provider: EligibilityProvider;
  payer: EligibilityPayer;
  patient: EligibilityPatient;
  subscriber?: EligibilitySubscriber;
  groupNumber?: string;
  procedureCode?: string;
  category?: string;
  dxcGroupId?: number;
}

export interface Address {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Plan {
  groupNumber: string;
  groupName: string;
  subscriberId: string;
  coverageIndicator: string;
  effectiveDateFrom: string;
  effectiveDateTo?: string;
}

export interface CoInsurance {
  serviceType?: string;
  code?: string;
  network: string;
  coverageLevel: string;
  percent: string;
  authorizationRequired?: string;
  insuranceType: string;
  message?: string;
}

export interface Deductible {
  serviceType: string;
  network: string;
  coverageLevel: string;
  amount: string;
  remaining: string;
  insuranceType: string;
  timePeriod?: string;
}

export interface Maximum {
  serviceType: string;
  network: string;
  coverageLevel: string;
  amount: string;
  remaining: string;
  insuranceType: string;
  timePeriod?: string;
}

export interface Limitation {
  serviceType?: string;
  code?: string;
  quantity: string;
  quantityQualifier: string;
  timePeriod?: string;
  message?: string;
}

export interface ActiveCoverage {
  serviceType: string;
  planCoverageDescription: string;
  insuranceType: string;
  message: string;
}

export interface EligibilityResponseData {
  payer: {
    id: string;
    name: string;
  };
  subscriber: {
    firstName: string;
    lastName: string;
    address: Address;
    dateOfBirth: string;
    gender: string;
    plan: Plan;
  };
  patient: {
    firstName: string;
    lastName: string;
    address: Address;
    dateOfBirth: string;
    relationship: string;
    gender: string;
    plan: Plan;
  };
  activeCoverage: ActiveCoverage[];
  coInsurance: CoInsurance[];
  deductibles?: Deductible[];
  maximums?: Maximum[];
  limitations?: Limitation[];
}

export interface EligibilityResponse {
  status: {
    code: number;
    description: string;
  };
  messages: string[];
  transactionId: number;
  response: EligibilityResponseData;
}

export interface DentalXchangeCredentials {
  username: string;
  password: string;
  apiKey?: string;
}

// Rejection codes reference
export const EligibilityRejectionCodes: Record<string, string> = {
  '41': 'Authorization/Access Restrictions',
  '42': 'Unable to Respond at Current Time',
  '43': 'Invalid/Missing Provider Identification',
  '44': 'Invalid/Missing Provider Name',
  '45': 'Invalid/Missing Provider Specialty',
  '46': 'Invalid/Missing Provider Phone Number',
  '47': 'Invalid/Missing Provider State',
  '50': 'Provider Not on File',
  '51': 'Provider Not Eligible',
  '52': 'Invalid/Missing Service Provider Information',
  '60': 'Date of Birth Follows Date(s) of Service',
  '61': 'Date of Death Precedes Date(s) of Service',
  '62': 'Date of Service Not Within Allowable Inquiry Period',
  '63': 'Date of Service in Future',
  '64': 'Invalid/Missing Patient ID',
  '65': 'Invalid/Missing Patient Name',
  '66': 'Invalid/Missing Patient Date of Birth',
  '67': 'Patient Not Found',
  '68': 'Duplicate Patient ID Number',
  '69': 'Inconsistent with Patient\'s Age',
  '70': 'Patient Gender Mismatch',
  '71': 'Patient Birth Date Does Not Match That for the Patient on the Database',
  '72': 'Invalid/Missing Subscriber/Insured ID',
  '73': 'Invalid/Missing Subscriber/Insured Name',
  '74': 'Invalid/Missing Subscriber/Insured Gender Code',
  '75': 'Subscriber/Insured Not Found',
  '76': 'Duplicate Subscriber/Insured ID Number',
  '77': 'Subscriber Found, Patient Not Found',
  '78': 'Subscriber/Insured Not in Group/Plan Identified',
  '79': 'Invalid Participant Identification',
  '80': 'No Response received - Transaction Terminated',
  'T4': 'Payer Name or Payer Identifier Missing',
};

class DentalXchangeService {
  private credentials: DentalXchangeCredentials | null = null;

  setCredentials(credentials: DentalXchangeCredentials) {
    this.credentials = credentials;
  }

  getCredentials(): DentalXchangeCredentials | null {
    return this.credentials;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    if (!this.credentials) {
      throw new Error('DentalXchange credentials not configured');
    }

    const url = new URL(endpoint, DENTALXCHANGE_API_BASE);
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'username': this.credentials.username,
      'password': this.credentials.password,
      ...headers,
    };

    if (this.credentials.apiKey) {
      requestHeaders['X-API-Key'] = this.credentials.apiKey;
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method,
        headers: requestHeaders,
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(data);
              resolve(parsed as T);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (body && method === 'POST') {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResponse> {
    return this.makeRequest<EligibilityResponse>('/eligibility', 'POST', request);
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>('/eligibility/health', 'GET');
  }

  // Parse co-insurance into a structured benefits breakdown
  parseBenefitsBreakdown(response: EligibilityResponseData) {
    const benefits: Record<string, {
      inNetwork: { percent: string; message?: string };
      outOfNetwork: { percent: string; message?: string };
    }> = {};

    for (const coIns of response.coInsurance) {
      const key = coIns.code || coIns.serviceType || 'General';
      
      if (!benefits[key]) {
        benefits[key] = {
          inNetwork: { percent: '0' },
          outOfNetwork: { percent: '0' },
        };
      }

      if (coIns.network === 'In-Network') {
        benefits[key].inNetwork = {
          percent: coIns.percent,
          message: coIns.message,
        };
      } else if (coIns.network === 'Out-Of-Network') {
        benefits[key].outOfNetwork = {
          percent: coIns.percent,
          message: coIns.message,
        };
      }
    }

    return benefits;
  }

  // Parse deductibles into a structured format
  parseDeductibles(response: EligibilityResponseData) {
    const deductibles: Record<string, {
      inNetwork: { amount: string; remaining: string };
      outOfNetwork: { amount: string; remaining: string };
    }> = {};

    if (!response.deductibles) return deductibles;

    for (const ded of response.deductibles) {
      const key = `${ded.serviceType}-${ded.coverageLevel}`;
      
      if (!deductibles[key]) {
        deductibles[key] = {
          inNetwork: { amount: '0', remaining: '0' },
          outOfNetwork: { amount: '0', remaining: '0' },
        };
      }

      if (ded.network === 'In-Network') {
        deductibles[key].inNetwork = {
          amount: ded.amount,
          remaining: ded.remaining,
        };
      } else {
        deductibles[key].outOfNetwork = {
          amount: ded.amount,
          remaining: ded.remaining,
        };
      }
    }

    return deductibles;
  }

  // Parse maximums into a structured format
  parseMaximums(response: EligibilityResponseData) {
    const maximums: Record<string, {
      inNetwork: { amount: string; remaining: string };
      outOfNetwork: { amount: string; remaining: string };
    }> = {};

    if (!response.maximums) return maximums;

    for (const max of response.maximums) {
      const key = `${max.serviceType}-${max.coverageLevel}`;
      
      if (!maximums[key]) {
        maximums[key] = {
          inNetwork: { amount: '0', remaining: '0' },
          outOfNetwork: { amount: '0', remaining: '0' },
        };
      }

      if (max.network === 'In-Network') {
        maximums[key].inNetwork = {
          amount: max.amount,
          remaining: max.remaining,
        };
      } else {
        maximums[key].outOfNetwork = {
          amount: max.amount,
          remaining: max.remaining,
        };
      }
    }

    return maximums;
  }
}

// Export singleton instance
export const dentalXchangeService = new DentalXchangeService();

// List of common dental payers with their DentalXchange payer IDs
export const CommonDentalPayers: { name: string; payerIdCode: string }[] = [
  { name: 'Delta Dental', payerIdCode: '82026' },
  { name: 'Cigna Dental', payerIdCode: '62308' },
  { name: 'MetLife', payerIdCode: '65978' },
  { name: 'Aetna', payerIdCode: '60054' },
  { name: 'United Healthcare Dental', payerIdCode: '87726' },
  { name: 'Guardian', payerIdCode: '91617' },
  { name: 'Principal', payerIdCode: '61271' },
  { name: 'Humana Dental', payerIdCode: '61101' },
  { name: 'Ameritas', payerIdCode: '84105' },
  { name: 'BlueCross BlueShield', payerIdCode: '00790' },
  { name: 'Anthem', payerIdCode: '47198' },
  { name: 'Sun Life', payerIdCode: '80314' },
  { name: 'Lincoln Financial', payerIdCode: '65676' },
  { name: 'Standard Insurance', payerIdCode: '69140' },
  { name: 'Unum', payerIdCode: 'UNUM1' },
];

// Relationship codes for patient to subscriber relationship
export const RelationshipCodes = {
  SELF: '18',
  SPOUSE: '01',
  CHILD: '19',
  EMPLOYEE: '20',
  UNKNOWN: '21',
  HANDICAPPED_DEPENDENT: '22',
  SPONSORED_DEPENDENT: '23',
  DEPENDENT_OF_MINOR: '24',
  SIGNIFICANT_OTHER: '29',
  MOTHER: '32',
  FATHER: '33',
  EMANCIPATED_MINOR: '36',
  ORGAN_DONOR: '39',
  CADAVER_DONOR: '40',
  INJURED_PLAINTIFF: '41',
  CHILD_INSURED_NO_FINANCIAL: '43',
  LIFE_PARTNER: '53',
  OTHER_RELATIONSHIP: 'G8',
} as const;
