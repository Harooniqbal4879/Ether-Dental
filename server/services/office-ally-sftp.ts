import SftpClient from "ssh2-sftp-client";

export interface OfficeAllySftpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface EDI270Request {
  subscriberId: string;
  subscriberFirstName: string;
  subscriberLastName: string;
  subscriberDob: string; // Format: YYYY-MM-DD or YYYYMMDD
  payerId: string;
  providerId: string;
  providerNpi: string;
  serviceTypeCode?: string;
  dateOfService?: string; // Format: YYYY-MM-DD or YYYYMMDD
}

function normalizeDate(dateStr: string): string {
  // Remove any dashes and normalize to YYYYMMDD
  const cleaned = dateStr.replace(/-/g, "");
  // Validate it's 8 digits
  if (!/^\d{8}$/.test(cleaned)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD or YYYYMMDD`);
  }
  return cleaned;
}

function validateEDI270Request(request: EDI270Request): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!request.subscriberId || request.subscriberId.length > 80) {
    errors.push("subscriberId is required and must be <= 80 characters");
  }
  if (!request.subscriberFirstName || request.subscriberFirstName.length > 35) {
    errors.push("subscriberFirstName is required and must be <= 35 characters");
  }
  if (!request.subscriberLastName || request.subscriberLastName.length > 60) {
    errors.push("subscriberLastName is required and must be <= 60 characters");
  }
  if (!request.payerId || request.payerId.length > 80) {
    errors.push("payerId is required and must be <= 80 characters");
  }
  if (!request.providerId || request.providerId.length > 80) {
    errors.push("providerId is required and must be <= 80 characters");
  }
  if (!request.providerNpi || !/^\d{10}$/.test(request.providerNpi)) {
    errors.push("providerNpi is required and must be exactly 10 digits");
  }
  
  try {
    normalizeDate(request.subscriberDob);
  } catch {
    errors.push("subscriberDob must be in YYYY-MM-DD or YYYYMMDD format");
  }
  
  if (request.dateOfService) {
    try {
      normalizeDate(request.dateOfService);
    } catch {
      errors.push("dateOfService must be in YYYY-MM-DD or YYYYMMDD format");
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  directoryListing?: string[];
}

export class OfficeAllySftpService {
  private config: OfficeAllySftpConfig;

  constructor() {
    this.config = {
      host: process.env.OFFICE_ALLY_SFTP_HOST || "",
      port: parseInt(process.env.OFFICE_ALLY_SFTP_PORT || "22", 10),
      username: process.env.OFFICE_ALLY_SFTP_USERNAME || "",
      password: process.env.OFFICE_ALLY_SFTP_PASSWORD || "",
    };
  }

  isConfigured(): boolean {
    return !!(
      this.config.host &&
      this.config.username &&
      this.config.password
    );
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "Office Ally SFTP credentials are not configured. Please add OFFICE_ALLY_SFTP_HOST, OFFICE_ALLY_SFTP_USERNAME, OFFICE_ALLY_SFTP_PASSWORD, and OFFICE_ALLY_SFTP_PORT to your environment.",
      };
    }

    const sftp = new SftpClient();
    
    try {
      await sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        readyTimeout: 10000,
        retries: 2,
        retry_minTimeout: 2000,
      });

      const listing = await sftp.list("/");
      const directoryNames = listing.map((item) => item.name);

      await sftp.end();

      return {
        success: true,
        message: `Successfully connected to Office Ally SFTP server at ${this.config.host}`,
        directoryListing: directoryNames,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Provide more helpful error messages based on common issues
      let helpfulMessage = `Failed to connect to Office Ally SFTP: ${errorMessage}`;
      
      if (errorMessage.includes("PROTOCOL_ERROR") || errorMessage.includes("handshake")) {
        helpfulMessage = `Connection failed with protocol error. Common causes:
1. The host address may be incorrect - Office Ally uses servers like ftp10.officeally.com, ftp11.officeally.com, etc.
2. SFTP credentials are DIFFERENT from your web portal login - you need to request SFTP access by emailing support@officeally.com
3. Your SFTP account may not be activated yet (typically takes 24-48 hours after requesting)
Current host: ${this.config.host}, Port: ${this.config.port}`;
      } else if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
        helpfulMessage = `Host not found: ${this.config.host}. Please verify the SFTP server address is correct (e.g., ftp10.officeally.com)`;
      } else if (errorMessage.includes("ECONNREFUSED")) {
        helpfulMessage = `Connection refused on port ${this.config.port}. Office Ally SFTP typically uses port 22.`;
      } else if (errorMessage.includes("Authentication") || errorMessage.includes("permission denied")) {
        helpfulMessage = `Authentication failed. Note: SFTP credentials are different from your Office Ally web portal login. Contact support@officeally.com to obtain your SFTP credentials.`;
      } else if (errorMessage.includes("ETIMEDOUT") || errorMessage.includes("timeout")) {
        helpfulMessage = `Connection timed out. The server may be unreachable or there may be a firewall issue.`;
      }
      
      return {
        success: false,
        message: helpfulMessage,
      };
    } finally {
      try {
        await sftp.end();
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  generateEDI270(request: EDI270Request): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const time = now.toTimeString().slice(0, 5).replace(":", "");
    const controlNumber = Math.floor(Math.random() * 999999999).toString().padStart(9, "0");
    const transactionControlNumber = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
    
    // Normalize dates using the validation function
    const normalizedDob = normalizeDate(request.subscriberDob);
    const normalizedDateOfService = request.dateOfService 
      ? normalizeDate(request.dateOfService) 
      : date;

    const segments = [
      `ISA*00*          *00*          *ZZ*${request.providerId.padEnd(15)}*ZZ*${request.payerId.padEnd(15)}*${date.slice(2)}*${time}*^*00501*${controlNumber}*0*P*:~`,
      `GS*HS*${request.providerId}*${request.payerId}*${date}*${time}*${controlNumber}*X*005010X279A1~`,
      `ST*270*${transactionControlNumber}*005010X279A1~`,
      `BHT*0022*13*${controlNumber}*${date}*${time}~`,
      `HL*1**20*1~`,
      `NM1*PR*2*${request.payerId}*****PI*${request.payerId}~`,
      `HL*2*1*21*1~`,
      `NM1*1P*2*DENTAL PRACTICE*****XX*${request.providerNpi}~`,
      `HL*3*2*22*0~`,
      `TRN*1*${controlNumber}*9${request.providerId}~`,
      `NM1*IL*1*${request.subscriberLastName}*${request.subscriberFirstName}****MI*${request.subscriberId}~`,
      `DMG*D8*${normalizedDob}~`,
      `DTP*291*D8*${normalizedDateOfService}~`,
      `EQ*${request.serviceTypeCode || "30"}~`,
      `SE*13*${transactionControlNumber}~`,
      `GE*1*${controlNumber}~`,
      `IEA*1*${controlNumber}~`,
    ];

    return segments.join("\n");
  }

  validateRequest(request: EDI270Request): { valid: boolean; errors: string[] } {
    return validateEDI270Request(request);
  }

  async submitEligibilityRequest(
    request: EDI270Request,
    filename?: string
  ): Promise<{ success: boolean; message: string; filename?: string; validationErrors?: string[] }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "Office Ally SFTP credentials are not configured.",
      };
    }

    // Validate request before processing
    const validation = validateEDI270Request(request);
    if (!validation.valid) {
      return {
        success: false,
        message: "Request validation failed",
        validationErrors: validation.errors,
      };
    }

    const sftp = new SftpClient();
    const edi270Content = this.generateEDI270(request);
    const actualFilename = filename || `270_${Date.now()}_${request.subscriberId}.edi`;

    try {
      await sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        readyTimeout: 10000,
      });

      const outboundDir = "/outbound";
      const dirExists = await sftp.exists(outboundDir);
      
      if (!dirExists) {
        await sftp.mkdir(outboundDir, true);
      }

      const remotePath = `${outboundDir}/${actualFilename}`;
      await sftp.put(Buffer.from(edi270Content), remotePath);

      await sftp.end();

      return {
        success: true,
        message: `EDI 270 file submitted successfully to ${remotePath}`,
        filename: actualFilename,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to submit EDI 270 file: ${errorMessage}`,
      };
    } finally {
      try {
        await sftp.end();
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  async retrieveEligibilityResponses(): Promise<{
    success: boolean;
    message: string;
    files?: Array<{ filename: string; content: string }>;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "Office Ally SFTP credentials are not configured.",
      };
    }

    const sftp = new SftpClient();

    try {
      await sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        readyTimeout: 10000,
      });

      const inboundDir = "/inbound";
      const dirExists = await sftp.exists(inboundDir);

      if (!dirExists) {
        await sftp.end();
        return {
          success: true,
          message: "No inbound directory found. No responses available yet.",
          files: [],
        };
      }

      const listing = await sftp.list(inboundDir);
      const ediFiles = listing.filter(
        (item) => item.type === "-" && item.name.endsWith(".edi")
      );

      const files: Array<{ filename: string; content: string }> = [];

      for (const file of ediFiles.slice(0, 10)) {
        try {
          const content = await sftp.get(`${inboundDir}/${file.name}`);
          files.push({
            filename: file.name,
            content: content.toString(),
          });
        } catch {
          // Skip files that can't be read
        }
      }

      await sftp.end();

      return {
        success: true,
        message: `Retrieved ${files.length} EDI 271 response file(s)`,
        files,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to retrieve EDI 271 files: ${errorMessage}`,
      };
    } finally {
      try {
        await sftp.end();
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  parseEDI271Response(content: string): {
    subscriberId?: string;
    eligibilityStatus?: string;
    planName?: string;
    coverageType?: string;
    effectiveDate?: string;
    terminationDate?: string;
    benefits?: Array<{
      serviceType: string;
      coverageLevel: string;
      amount?: string;
      percentage?: string;
    }>;
  } {
    const segments = content.split("~").map((s) => s.trim());
    const result: ReturnType<typeof this.parseEDI271Response> = {
      benefits: [],
    };

    for (const segment of segments) {
      const elements = segment.split("*");
      const segmentId = elements[0];

      switch (segmentId) {
        case "NM1":
          if (elements[1] === "IL") {
            result.subscriberId = elements[9];
          }
          break;
        case "INS":
          result.eligibilityStatus = elements[1] === "Y" ? "Active" : "Inactive";
          break;
        case "DTP":
          if (elements[1] === "346") {
            result.effectiveDate = elements[3];
          } else if (elements[1] === "347") {
            result.terminationDate = elements[3];
          }
          break;
        case "EB":
          if (elements.length > 1) {
            const benefit = {
              serviceType: elements[3] || "",
              coverageLevel: elements[2] || "",
              amount: elements[7] || undefined,
              percentage: elements[8] || undefined,
            };
            result.benefits?.push(benefit);
          }
          break;
      }
    }

    return result;
  }
}

export const officeAllySftpService = new OfficeAllySftpService();
