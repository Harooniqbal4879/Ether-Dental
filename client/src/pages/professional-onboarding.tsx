import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle,
  Circle,
  User,
  FileText,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  CheckCircle2,
  Clock,
  IdCard,
  PartyPopper,
  ChevronRight,
  Camera,
  Smartphone,
  Download,
  ExternalLink,
  ClipboardCheck,
  Stethoscope,
  Shield,
  Heart,
  Award,
  Syringe,
  FileCheck,
  Wallet,
  Globe,
  Banknote,
  Lock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res;
}

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "D.C." }
];

const TAX_CLASSIFICATIONS = [
  { value: "individual", label: "Individual/Sole Proprietor" },
  { value: "llc_single", label: "LLC - Single Member" },
  { value: "llc_c_corp", label: "LLC - C Corporation" },
  { value: "llc_s_corp", label: "LLC - S Corporation" },
  { value: "llc_partnership", label: "LLC - Partnership" },
  { value: "c_corporation", label: "C Corporation" },
  { value: "s_corporation", label: "S Corporation" },
  { value: "partnership", label: "Partnership" },
];

const personalInfoSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phone: z.string().min(10, "Valid phone number required"),
  addressStreet: z.string().min(1, "Street address is required"),
  addressCity: z.string().min(1, "City is required"),
  addressState: z.string().min(1, "State is required"),
  addressZip: z.string().min(5, "Valid ZIP code required"),
  countryOfResidence: z.string().min(1, "Country is required"),
});

// Country options for residence
const countryOptions = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "MX", label: "Mexico" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "OTHER", label: "Other" },
];

const w9Schema = z.object({
  legalName: z.string().min(1, "Legal name is required"),
  businessName: z.string().optional(),
  taxClassification: z.string().min(1, "Tax classification is required"),
  useSsn: z.boolean().default(true),
  ssn: z.string().optional(),
  ein: z.string().optional(),
  taxAddressStreet: z.string().min(1, "Street address is required"),
  taxAddressCity: z.string().min(1, "City is required"),
  taxAddressState: z.string().min(1, "State is required"),
  taxAddressZip: z.string().min(5, "ZIP code required"),
  electronicSignature: z.boolean().refine((val) => val === true, "You must sign the form electronically"),
}).refine((data) => {
  if (data.useSsn) {
    return data.ssn && data.ssn.replace(/\D/g, "").length === 9;
  }
  return data.ein && data.ein.replace(/\D/g, "").length === 9;
}, {
  message: "Valid SSN or EIN is required",
  path: ["ssn"],
});

// Compliance document upload button component
function ComplianceUploadButton({ 
  documentType, 
  label, 
  uploadDocumentMutation 
}: { 
  documentType: string; 
  label: string; 
  uploadDocumentMutation: any;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const urlResponse = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
        credentials: "include",
      });
      if (!urlResponse.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlResponse.json();
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadResponse.ok) throw new Error("Failed to upload file");
      uploadDocumentMutation.mutate({
        documentType,
        documentUrl: objectPath,
        documentName: file.name,
      });
      toast({ title: `${label.replace("Upload ", "")} uploaded successfully` });
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        id={`compliance-${documentType}`}
        disabled={isUploading}
        onChange={handleUpload}
        data-testid={`input-${documentType}`}
      />
      <label htmlFor={`compliance-${documentType}`}>
        <Button variant="outline" size="sm" asChild disabled={isUploading} className="flex-shrink-0">
          <span>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {label}
              </>
            )}
          </span>
        </Button>
      </label>
    </>
  );
}

// Step configuration with detailed info
const ONBOARDING_STEPS = [
  { 
    key: "personal_info", 
    name: "Personal Info", 
    shortName: "Info",
    icon: User, 
    description: "Your basic information and address",
    action: "Complete your profile",
  },
  { 
    key: "identity", 
    name: "Identity Verification", 
    shortName: "Identity",
    icon: IdCard, 
    description: "Government ID and selfie verification",
    action: "Upload ID and verify identity",
  },
  { 
    key: "w9_tax", 
    name: "W-9 Tax Form", 
    shortName: "W-9",
    icon: FileText, 
    description: "Tax information for 1099 reporting",
    action: "Complete W-9 form",
  },
  { 
    key: "agreements", 
    name: "Agreements", 
    shortName: "Agreements",
    icon: ShieldCheck, 
    description: "Sign required legal agreements",
    action: "Review and sign agreements",
  },
  { 
    key: "compliance", 
    name: "Work Eligibility", 
    shortName: "Compliance",
    icon: ClipboardCheck, 
    description: "Professional credentials and compliance",
    action: "Submit required credentials",
  },
  { 
    key: "payment_setup", 
    name: "Payment Setup", 
    shortName: "Payment",
    icon: CreditCard, 
    description: "Set up how you receive payments",
    action: "Connect your payment method",
  },
];

export default function ProfessionalOnboarding() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { professional, isProfessionalAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [manualStepSelection, setManualStepSelection] = useState(false);
  const [isUploadingIdFront, setIsUploadingIdFront] = useState(false);
  const [isUploadingIdBack, setIsUploadingIdBack] = useState(false);
  const [isUploadingW9, setIsUploadingW9] = useState(false);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [selectedIdType, setSelectedIdType] = useState<string>("drivers_license");
  const [isRunningFaceMatch, setIsRunningFaceMatch] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    accountHolderName: "",
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState<string | null>(null);
  const [paymentAccountEmail, setPaymentAccountEmail] = useState("");
  const [viewPaymentMethod, setViewPaymentMethod] = useState<any | null>(null);
  const [showSensitiveDetails, setShowSensitiveDetails] = useState(false);
  const [faceMatchResult, setFaceMatchResult] = useState<{
    isMatch: boolean;
    confidence: number;
    analysisDetails: {
      idPhotoQuality: string;
      selfieQuality: string;
      facialFeatures: string;
      matchReasoning: string;
    };
    warnings: string[];
  } | null>(null);

  const { data: onboardingData, isLoading, refetch } = useQuery<{
    professional: any;
    documents: any[];
    taxForms: any[];
    paymentMethods: any[];
    agreements: any[];
    progress: {
      steps: Array<{ name: string; complete: boolean }>;
      completedSteps: number;
      totalSteps: number;
      percentComplete: number;
    };
  }>({
    queryKey: ["/api/professional/onboarding"],
    enabled: isProfessionalAuthenticated,
  });

  const personalInfoForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      dateOfBirth: "",
      phone: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressZip: "",
      countryOfResidence: "US",
    },
  });

  // Profile photo upload state
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Phone OTP verification state
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  // Email OTP verification state
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [emailResendCountdown, setEmailResendCountdown] = useState(0);
  
  // Resend countdown timer effect for phone
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Resend countdown timer effect for email
  useEffect(() => {
    if (emailResendCountdown > 0) {
      const timer = setTimeout(() => setEmailResendCountdown(emailResendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailResendCountdown]);

  const w9Form = useForm<z.infer<typeof w9Schema>>({
    resolver: zodResolver(w9Schema),
    defaultValues: {
      legalName: "",
      businessName: "",
      taxClassification: "individual",
      useSsn: true,
      ssn: "",
      ein: "",
      taxAddressStreet: "",
      taxAddressCity: "",
      taxAddressState: "",
      taxAddressZip: "",
      electronicSignature: false,
    },
  });

  // Calculate step completion status
  const stepStatus = useMemo(() => {
    if (!onboardingData) return { steps: [], firstIncomplete: 0 };
    
    const p = onboardingData.professional;
    const docs = onboardingData.documents || [];
    const taxForms = onboardingData.taxForms || [];
    const agreements = onboardingData.agreements || [];
    const paymentMethods = onboardingData.paymentMethods || [];
    
    const hasPersonalInfo = !!(p?.dateOfBirth && p?.phone && p?.addressStreet);
    // KYC document checks - require ID front, ID back (unless passport), and selfie
    const hasIdFront = docs.some(d => d.documentType === "id_front");
    const hasIdBack = docs.some(d => d.documentType === "id_back");
    const hasSelfie = docs.some(d => d.documentType === "selfie");
    const hasLegacyId = docs.some(d => d.documentType === "government_id" || d.documentType === "identity");
    
    // Get stored ID type from metadata with safe JSON parsing
    const idTypeDoc = docs.find(d => d.documentType === "id_front");
    let storedIdType: string | null = null;
    try {
      storedIdType = idTypeDoc?.metadata ? JSON.parse(idTypeDoc.metadata).idType : null;
    } catch {
      storedIdType = null;
    }
    const isPassport = storedIdType === "passport";
    
    // For passport, back is not required; otherwise all three are needed
    const hasFullKyc = hasIdFront && (isPassport || hasIdBack) && hasSelfie;
    const hasGovernmentId = hasFullKyc || hasLegacyId;
    const hasUploadedW9Document = onboardingData?.documents?.some(d => d.documentType === "w9_form") || false;
    const hasW9 = taxForms.length > 0 || hasUploadedW9Document;
    
    // Check all required agreements
    const requiredAgreements = ["contractor_agreement", "terms_of_service", "escrow_dispute_policy", "non_circumvention", "nda", "hipaa_acknowledgment"];
    const signedAgreementsCount = requiredAgreements.filter(
      type => agreements.some(a => a.agreementType === type && a.signedAt)
    ).length;
    const hasAgreements = signedAgreementsCount === requiredAgreements.length;
    const agreementsPartial = signedAgreementsCount > 0 && signedAgreementsCount < requiredAgreements.length;
    
    // Check compliance documents (professional credentials)
    const requiredComplianceDocs = ["professional_license", "npi_number", "malpractice_insurance", "background_check", "immunization_records", "cpr_bls_certification"];
    const complianceDocsCount = requiredComplianceDocs.filter(
      type => onboardingData?.documents?.some((d: any) => d.documentType === type)
    ).length;
    const hasCompliance = complianceDocsCount === requiredComplianceDocs.length;
    const compliancePartial = complianceDocsCount > 0 && complianceDocsCount < requiredComplianceDocs.length;
    const complianceVerified = requiredComplianceDocs.every(
      type => onboardingData?.documents?.some((d: any) => d.documentType === type && d.verificationStatus === "approved")
    );
    
    const hasPayment = paymentMethods.some(pm => pm.stripeOnboardingComplete || pm.verificationStatus === "verified");
    
    // Check verification statuses from backend - include new KYC document types
    const identityVerified = onboardingData?.documents?.some((d: any) => 
      (d.documentType === "government_id" || d.documentType === "identity" || 
       d.documentType === "id_front" || d.documentType === "selfie") && 
      d.verificationStatus === "approved"
    ) || false;
    const uploadedW9Doc = onboardingData?.documents?.find(d => d.documentType === "w9_form");
    const w9Verified = taxForms[0]?.verificationStatus === "approved" || uploadedW9Doc?.verificationStatus === "approved";
    const paymentVerified = paymentMethods.some(pm => pm.verificationStatus === "verified");
    
    const steps = [
      { 
        key: "personal_info", 
        complete: hasPersonalInfo,
        status: hasPersonalInfo ? "complete" : "pending" as const,
        needsVerification: false,
      },
      { 
        key: "identity", 
        complete: hasGovernmentId,
        status: hasGovernmentId ? "complete" : (hasIdFront || hasSelfie) ? "partial" : "pending" as const,
        hasId: hasGovernmentId,
        hasIdFront,
        hasIdBack,
        hasSelfie,
        isPassport,
        storedIdType,
        needsVerification: hasGovernmentId && !identityVerified,
        isVerified: identityVerified,
      },
      { 
        key: "w9_tax", 
        complete: hasW9,
        status: hasW9 ? "complete" : "pending" as const,
        hasW9: hasW9,
        w9Status: taxForms[0]?.verificationStatus,
        needsVerification: hasW9 && !w9Verified,
        isVerified: w9Verified,
      },
      { 
        key: "agreements", 
        complete: hasAgreements,
        status: hasAgreements ? "complete" : agreementsPartial ? "partial" : "pending" as const,
        signedCount: signedAgreementsCount,
        totalRequired: requiredAgreements.length,
        needsVerification: false,
      },
      { 
        key: "compliance", 
        complete: hasCompliance,
        status: hasCompliance ? "complete" : compliancePartial ? "partial" : "pending" as const,
        documentsCount: complianceDocsCount,
        totalRequired: requiredComplianceDocs.length,
        needsVerification: hasCompliance && !complianceVerified,
        isVerified: complianceVerified,
      },
      { 
        key: "payment_setup", 
        complete: hasPayment,
        status: hasPayment ? "complete" : "pending" as const,
        needsVerification: hasPayment && !paymentVerified,
        isVerified: paymentVerified,
      },
    ];
    
    const firstIncomplete = steps.findIndex(s => !s.complete);
    const allComplete = steps.every(s => s.complete);
    const hasPendingVerification = steps.some(s => s.needsVerification);
    
    return { 
      steps, 
      firstIncomplete: firstIncomplete === -1 ? steps.length - 1 : firstIncomplete,
      allComplete,
      hasPendingVerification,
    };
  }, [onboardingData]);

  // Auto-navigate to first incomplete step (only on initial load)
  useEffect(() => {
    if (!manualStepSelection && activeStep === null && stepStatus.steps.length > 0) {
      setActiveStep(stepStatus.firstIncomplete);
    }
  }, [stepStatus, manualStepSelection, activeStep]);

  // Sync selectedIdType from stored metadata when data loads
  useEffect(() => {
    const storedType = stepStatus.steps[1]?.storedIdType;
    if (storedType && storedType !== selectedIdType) {
      setSelectedIdType(storedType);
    }
  }, [stepStatus.steps]);

  // Load existing face match result from selfie document metadata
  useEffect(() => {
    if (onboardingData?.documents) {
      const selfieDoc = onboardingData.documents.find(d => d.documentType === "selfie");
      if (selfieDoc?.metadata) {
        try {
          const metadata = typeof selfieDoc.metadata === 'string' 
            ? JSON.parse(selfieDoc.metadata) 
            : selfieDoc.metadata;
          if (metadata.faceMatchResult && !faceMatchResult) {
            setFaceMatchResult(metadata.faceMatchResult);
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }
  }, [onboardingData?.documents]);

  // Handle manual step selection
  const handleStepClick = (stepIndex: number) => {
    setManualStepSelection(true);
    setActiveStep(stepIndex);
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (activeStep !== null && activeStep < ONBOARDING_STEPS.length - 1) {
      setActiveStep(activeStep + 1);
      setManualStepSelection(true);
    }
  };

  // Navigate to previous step
  const goToPrevStep = () => {
    if (activeStep !== null && activeStep > 0) {
      setActiveStep(activeStep - 1);
      setManualStepSelection(true);
    }
  };

  useEffect(() => {
    if (onboardingData?.professional) {
      const p = onboardingData.professional;
      personalInfoForm.reset({
        dateOfBirth: p.dateOfBirth || "",
        phone: p.phone || "",
        addressStreet: p.addressStreet || "",
        addressCity: p.addressCity || "",
        addressState: p.addressState || "",
        addressZip: p.addressZip || "",
      });

      if (p.firstName && p.lastName) {
        w9Form.setValue("legalName", `${p.firstName} ${p.lastName}`);
      }
      if (p.addressStreet) {
        w9Form.setValue("taxAddressStreet", p.addressStreet);
        w9Form.setValue("taxAddressCity", p.addressCity || "");
        w9Form.setValue("taxAddressState", p.addressState || "");
        w9Form.setValue("taxAddressZip", p.addressZip || "");
      }
    }

    if (onboardingData?.taxForms?.[0]) {
      const tf = onboardingData.taxForms[0];
      w9Form.reset({
        legalName: tf.legalName || "",
        businessName: tf.businessName || "",
        taxClassification: tf.taxClassification || "individual",
        useSsn: tf.useSsn !== false,
        ssn: tf.ssnLast4 ? `***-**-${tf.ssnLast4}` : "",
        ein: tf.einLast4 ? `**-***${tf.einLast4}` : "",
        taxAddressStreet: tf.taxAddressStreet || "",
        taxAddressCity: tf.taxAddressCity || "",
        taxAddressState: tf.taxAddressState || "",
        taxAddressZip: tf.taxAddressZip || "",
        electronicSignature: !!tf.signatureDate,
      });
    }
  }, [onboardingData]);

  const updatePersonalInfoMutation = useMutation({
    mutationFn: async (data: z.infer<typeof personalInfoSchema>) => {
      const res = await apiRequest("PATCH", "/api/professional/onboarding/personal-info", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Personal information saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
      goToNextStep();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const submitW9Mutation = useMutation({
    mutationFn: async (data: z.infer<typeof w9Schema>) => {
      const res = await apiRequest("POST", "/api/professional/onboarding/w9", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "W-9 form submitted" });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const signAgreementMutation = useMutation({
    mutationFn: async (data: { agreementType: string; signatureName: string }) => {
      const res = await apiRequest("POST", "/api/professional/onboarding/agreements", {
        ...data,
        agreementVersion: "2024-01",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Agreement signed" });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (data: { methodType: string; paymentEmail?: string }) => {
      const res = await apiRequest("POST", "/api/professional/onboarding/payment-methods", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        toast({ title: "Payment method added" });
        queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removePaymentMethodMutation = useMutation({
    mutationFn: async (methodType: string) => {
      const res = await apiRequest("DELETE", `/api/professional/onboarding/payment-methods/${methodType}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payment method removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { documentType: string; documentUrl: string; documentName: string }) => {
      const res = await apiRequest("POST", "/api/professional/onboarding/documents", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document uploaded" });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeDocumentMutation = useMutation({
    mutationFn: async (documentType: string) => {
      const res = await apiRequest("DELETE", `/api/professional/onboarding/documents/${documentType}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const res = await apiRequest("POST", "/api/uploads/request-url", {
        name: file.name,
        contentType: file.type,
        size: file.size,
      });
      const { uploadURL, objectPath } = await res.json();
      
      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      
      setProfilePhotoUrl(objectPath);
      
      await apiRequest("PATCH", "/api/professional/onboarding/personal-info", {
        profilePhotoUrl: objectPath,
      });
      
      toast({ title: "Profile photo uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload profile photo", variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle phone OTP send
  const handleSendOtp = async () => {
    const phone = personalInfoForm.getValues("phone");
    if (!phone || phone.length < 10) {
      toast({ title: "Error", description: "Please enter a valid phone number first", variant: "destructive" });
      return;
    }
    setIsSendingOtp(true);
    try {
      await apiRequest("POST", "/api/professional/onboarding/send-otp", { phone });
      setPhoneOtpSent(true);
      setResendCountdown(60); // 60 second cooldown before resend
      toast({ title: "Verification code sent", description: "Check your phone for the 6-digit code" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send verification code", variant: "destructive" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle phone OTP verification
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }
    setIsVerifyingPhone(true);
    try {
      await apiRequest("POST", "/api/professional/onboarding/verify-otp", { code: otpCode });
      toast({ title: "Phone verified successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
      setPhoneOtpSent(false);
      setOtpCode("");
    } catch (error) {
      toast({ title: "Error", description: "Invalid or expired verification code", variant: "destructive" });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  // Handle email OTP send
  const handleSendEmailOtp = async () => {
    const email = onboardingData?.professional?.email;
    if (!email) {
      toast({ title: "Error", description: "Email not found", variant: "destructive" });
      return;
    }
    setIsSendingEmailOtp(true);
    try {
      await apiRequest("POST", "/api/professional/onboarding/send-email-otp", { email });
      setEmailOtpSent(true);
      setEmailResendCountdown(60); // 60 second cooldown before resend
      toast({ title: "Verification code sent", description: "Check your email for the 6-digit code" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send verification code", variant: "destructive" });
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // Handle email OTP verification
  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode || emailOtpCode.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }
    setIsVerifyingEmail(true);
    try {
      await apiRequest("POST", "/api/professional/onboarding/verify-email-otp", { code: emailOtpCode });
      toast({ title: "Email verified successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/onboarding"] });
      setEmailOtpSent(false);
      setEmailOtpCode("");
    } catch (error) {
      toast({ title: "Error", description: "Invalid or expired verification code", variant: "destructive" });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  if (!isProfessionalAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Sign In Required</h2>
                <p className="text-muted-foreground">Please sign in as a professional to access onboarding.</p>
              </div>
              <Button onClick={() => setLocation("/login/professional")} data-testid="button-signin">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = onboardingData?.progress;
  const completedCount = stepStatus.steps.filter(s => s.complete).length;
  const percentComplete = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment_eligible":
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Payment Eligible</Badge>;
      case "verified":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Verified</Badge>;
      case "under_review":
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Under Review</Badge>;
      case "in_progress":
        return <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/20">In Progress</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-700 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasSignedAgreement = (type: string) => {
    return onboardingData?.agreements?.some((a) => a.agreementType === type && a.signedAt);
  };

  const handleSignAgreement = (type: string) => {
    const name = `${onboardingData?.professional?.firstName} ${onboardingData?.professional?.lastName}`;
    signAgreementMutation.mutate({ agreementType: type, signatureName: name });
  };

  // Get step icon based on status
  const getStepIcon = (stepIndex: number, isActive: boolean) => {
    const stepData = stepStatus.steps[stepIndex];
    if (!stepData) return <Circle className="h-5 w-5" />;
    
    if (stepData.complete) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (stepData.status === "partial") {
      return <Clock className="h-5 w-5 text-amber-500" />;
    }
    if (isActive) {
      return <Circle className="h-5 w-5 text-primary fill-primary" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  // Current step info for "What's Next" guidance
  const currentStepInfo = activeStep !== null ? ONBOARDING_STEPS[activeStep] : null;
  const currentStepStatus = activeStep !== null ? stepStatus.steps[activeStep] : null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header with progress */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Complete Your Onboarding</h1>
              <p className="text-sm text-muted-foreground">
                {stepStatus.allComplete 
                  ? "All steps complete! Waiting for verification."
                  : `Step ${(activeStep ?? 0) + 1} of ${ONBOARDING_STEPS.length}: ${currentStepInfo?.name || ""}`
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Progress value={percentComplete} className="w-32 h-2" data-testid="progress-onboarding" />
                <span className="text-sm font-medium">{percentComplete}%</span>
              </div>
              {getStatusBadge(onboardingData?.professional?.onboardingStatus || "in_progress")}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* What's Next Banner - only show if not all complete */}
        {!stepStatus.allComplete && currentStepInfo && !currentStepStatus?.complete && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">What's Next</h3>
                  <p className="text-sm text-muted-foreground">{currentStepInfo.action}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Complete Banner */}
        {stepStatus.allComplete && (
          <Card className={`mb-6 ${stepStatus.hasPendingVerification ? "border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800" : "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"}`}>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${stepStatus.hasPendingVerification ? "bg-amber-100 dark:bg-amber-800/30" : "bg-green-100 dark:bg-green-800/30"}`}>
                  {stepStatus.hasPendingVerification ? (
                    <Clock className="h-6 w-6 text-amber-600" />
                  ) : (
                    <PartyPopper className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${stepStatus.hasPendingVerification ? "text-amber-800 dark:text-amber-200" : "text-green-800 dark:text-green-200"}`}>
                    {stepStatus.hasPendingVerification ? "Onboarding Submitted - Pending Verification" : "Onboarding Complete!"}
                  </h3>
                  <p className={`text-sm ${stepStatus.hasPendingVerification ? "text-amber-700 dark:text-amber-300" : "text-green-700 dark:text-green-300"}`}>
                    {stepStatus.hasPendingVerification 
                      ? "Your information has been submitted. An administrator will review and verify your identity and W-9 before you can receive payments."
                      : "Your account has been fully verified and you are eligible to receive payments."
                    }
                  </p>
                </div>
                <Button onClick={() => setLocation("/app/hub")} data-testid="button-go-to-hub">
                  Go to Hub
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Vertical Stepper Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Onboarding Steps</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-1">
                  {ONBOARDING_STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const stepData = stepStatus.steps[idx];
                    const isActive = activeStep === idx;
                    const isComplete = stepData?.complete;
                    const isPartial = stepData?.status === "partial";
                    const needsVerification = stepData?.needsVerification;
                    
                    return (
                      <button
                        key={step.key}
                        onClick={() => handleStepClick(idx)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : isComplete 
                              ? "hover:bg-muted/80" 
                              : "hover:bg-muted/50"
                        }`}
                        data-testid={`button-step-${step.key}`}
                      >
                        <div className="flex-shrink-0">
                          {getStepIcon(idx, isActive)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>
                            {step.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {isComplete 
                              ? needsVerification 
                                ? "Submitted - Pending Review" 
                                : "Complete" 
                              : isPartial 
                                ? "In Progress" 
                                : step.description}
                          </div>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Stats */}
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{completedCount} of {ONBOARDING_STEPS.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(onboardingData?.professional?.onboardingStatus || "in_progress")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="space-y-6">

      {activeStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Provide your personal details for tax and compliance purposes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...personalInfoForm}>
              <form onSubmit={personalInfoForm.handleSubmit((data) => updatePersonalInfoMutation.mutate(data))} className="space-y-6">
                
                {/* Profile Photo Upload Section */}
                <div className="space-y-3">
                  <FormLabel>Profile Photo</FormLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/25">
                      <AvatarImage 
                        src={profilePhotoUrl || onboardingData?.professional?.photoUrl || undefined}
                        alt="Profile" 
                      />
                      <AvatarFallback className="bg-muted">
                        {isUploadingPhoto ? (
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="profile-photo-input"
                        data-testid="input-profile-photo"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProfilePhotoUpload(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingPhoto}
                        onClick={() => document.getElementById("profile-photo-input")?.click()}
                        data-testid="button-upload-photo"
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Photo
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Professional headshot recommended
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Email Verification Section */}
                <div className="space-y-3">
                  <FormLabel>Email Address</FormLabel>
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={onboardingData?.professional?.email || ""} 
                      disabled 
                      className="flex-1 bg-muted"
                      data-testid="input-email"
                    />
                    {!onboardingData?.professional?.emailVerified && (
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        disabled={isSendingEmailOtp || emailOtpSent}
                        onClick={handleSendEmailOtp}
                        data-testid="button-send-email-otp"
                      >
                        {isSendingEmailOtp ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : emailOtpSent ? (
                          "Code Sent"
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    )}
                    {onboardingData?.professional?.emailVerified && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {/* Email OTP Input Section */}
                  {emailOtpSent && !onboardingData?.professional?.emailVerified && (
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        placeholder="Enter 6-digit code"
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="w-40"
                        data-testid="input-email-otp-code"
                      />
                      <Button
                        type="button"
                        variant="default"
                        size="default"
                        disabled={isVerifyingEmail || emailOtpCode.length !== 6}
                        onClick={handleVerifyEmailOtp}
                        data-testid="button-verify-email-otp"
                      >
                        {isVerifyingEmail ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verify Code"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={emailResendCountdown > 0 || isSendingEmailOtp}
                        onClick={handleSendEmailOtp}
                        data-testid="button-resend-email-otp"
                      >
                        {emailResendCountdown > 0 ? `Resend in ${emailResendCountdown}s` : "Resend"}
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Email from your registration. Verify to receive important notifications.
                  </p>
                </div>

                <Separator />

                <FormField
                  control={personalInfoForm.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-dob" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone with OTP Verification */}
                <div className="space-y-3">
                  <FormField
                    control={personalInfoForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" className="flex-1" />
                          </FormControl>
                          {!onboardingData?.professional?.phoneVerified && (
                            <Button
                              type="button"
                              variant="outline"
                              size="default"
                              disabled={isSendingOtp || phoneOtpSent}
                              onClick={handleSendOtp}
                              data-testid="button-send-otp"
                            >
                              {isSendingOtp ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : phoneOtpSent ? (
                                "Code Sent"
                              ) : (
                                "Verify"
                              )}
                            </Button>
                          )}
                          {onboardingData?.professional?.phoneVerified && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* OTP Verification Input - shown after sending code */}
                  {phoneOtpSent && !onboardingData?.professional?.phoneVerified && (
                    <div className="flex gap-2 items-center pl-1">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        className="w-32"
                        data-testid="input-otp-code"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isVerifyingPhone || otpCode.length !== 6}
                        onClick={handleVerifyOtp}
                        data-testid="button-verify-otp"
                      >
                        {isVerifyingPhone ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verify Code"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={resendCountdown > 0 || isSendingOtp}
                        onClick={handleSendOtp}
                        data-testid="button-resend-otp"
                      >
                        {resendCountdown > 0 ? (
                          `Resend in ${resendCountdown}s`
                        ) : (
                          "Resend"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />
                <h4 className="font-medium">Address</h4>

                <FormField
                  control={personalInfoForm.control}
                  name="addressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <AddressAutocomplete 
                          value={field.value}
                          onChange={field.onChange}
                          onAddressSelect={(components) => {
                            personalInfoForm.setValue("addressCity", components.city);
                            personalInfoForm.setValue("addressState", components.state);
                            personalInfoForm.setValue("addressZip", components.zip);
                            personalInfoForm.setValue("countryOfResidence", components.country);
                          }}
                          placeholder="Start typing your address..."
                          data-testid="input-street"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Start typing to see address suggestions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <FormField
                    control={personalInfoForm.control}
                    name="addressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalInfoForm.control}
                    name="addressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-state">
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalInfoForm.control}
                    name="addressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} data-testid="input-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalInfoForm.control}
                    name="countryOfResidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countryOptions.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={updatePersonalInfoMutation.isPending} className="w-full" data-testid="button-save-personal">
                  {updatePersonalInfoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save & Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5" />
              Identity Verification
            </CardTitle>
            <CardDescription>
              Upload your government ID and take a selfie for identity verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* KYC Progress Tracker - use consistent ID type source */}
            {(() => {
              // Determine effective ID type - prefer stored type, fall back to selected
              const effectiveIdType = stepStatus.steps[1]?.storedIdType || selectedIdType;
              const showIdBack = effectiveIdType !== "passport";
              return (
            <div className="flex items-center gap-2 mb-6 p-4 bg-muted/50 rounded-lg flex-wrap">
              <div className="flex items-center gap-2">
                {stepStatus.steps[1]?.hasIdFront ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-sm ${stepStatus.steps[1]?.hasIdFront ? "text-green-700 font-medium" : ""}`}>
                  ID Front
                </span>
              </div>
              <div className="h-px flex-1 bg-border min-w-[20px]" />
              {showIdBack && (
                <>
                  <div className="flex items-center gap-2">
                    {stepStatus.steps[1]?.hasIdBack ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={`text-sm ${stepStatus.steps[1]?.hasIdBack ? "text-green-700 font-medium" : ""}`}>
                      ID Back
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-border min-w-[20px]" />
                </>
              )}
              <div className="flex items-center gap-2">
                {stepStatus.steps[1]?.hasSelfie ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-sm ${stepStatus.steps[1]?.hasSelfie ? "text-green-700 font-medium" : ""}`}>
                  Selfie
                </span>
              </div>
            </div>
              );
            })()}

            {/* Government ID Upload Section - KYC Compliant */}
            <div className="mb-8">
              <h4 className="text-base font-medium mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                Government ID Verification
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Upload clear photos of your government-issued ID for identity verification (KYC)
              </p>

              {/* ID Type Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Select ID Type</label>
                <Select value={selectedIdType} onValueChange={setSelectedIdType}>
                  <SelectTrigger className="w-full max-w-xs" data-testid="select-id-type">
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="national_id">National ID Card</SelectItem>
                    <SelectItem value="residence_permit">Residence Permit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* ID Front Upload */}
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    {selectedIdType === "passport" ? "Photo Page" : "Front Side"}
                  </h5>
                  {onboardingData?.documents?.some(d => d.documentType === "id_front") ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">Uploaded</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      {isUploadingIdFront ? (
                        <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        id="id-front-upload"
                        disabled={isUploadingIdFront}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingIdFront(true);
                          try {
                            const urlResponse = await fetch("/api/uploads/request-url", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                              credentials: "include",
                            });
                            if (!urlResponse.ok) throw new Error("Failed to get upload URL");
                            const { uploadURL, objectPath } = await urlResponse.json();
                            const uploadResponse = await fetch(uploadURL, {
                              method: "PUT",
                              body: file,
                              headers: { "Content-Type": file.type },
                            });
                            if (!uploadResponse.ok) throw new Error("Failed to upload file");
                            uploadDocumentMutation.mutate({
                              documentType: "id_front",
                              documentUrl: objectPath,
                              documentName: file.name,
                              metadata: JSON.stringify({ idType: selectedIdType }),
                            });
                          } catch (error) {
                            toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
                          } finally {
                            setIsUploadingIdFront(false);
                          }
                        }}
                        data-testid="input-id-front-upload"
                      />
                      <label htmlFor="id-front-upload">
                        <Button variant="outline" size="sm" asChild disabled={isUploadingIdFront}>
                          <span>{isUploadingIdFront ? "Uploading..." : "Upload Front"}</span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>

                {/* ID Back Upload - Not required for passport */}
                {selectedIdType !== "passport" && (
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <IdCard className="h-4 w-4" />
                      Back Side
                    </h5>
                    {onboardingData?.documents?.some(d => d.documentType === "id_back") ? (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">Uploaded</span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                        {isUploadingIdBack ? (
                          <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          id="id-back-upload"
                          disabled={isUploadingIdBack}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingIdBack(true);
                            try {
                              const urlResponse = await fetch("/api/uploads/request-url", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                                credentials: "include",
                              });
                              if (!urlResponse.ok) throw new Error("Failed to get upload URL");
                              const { uploadURL, objectPath } = await urlResponse.json();
                              const uploadResponse = await fetch(uploadURL, {
                                method: "PUT",
                                body: file,
                                headers: { "Content-Type": file.type },
                              });
                              if (!uploadResponse.ok) throw new Error("Failed to upload file");
                              uploadDocumentMutation.mutate({
                                documentType: "id_back",
                                documentUrl: objectPath,
                                documentName: file.name,
                                metadata: JSON.stringify({ idType: selectedIdType }),
                              });
                            } catch (error) {
                              toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
                            } finally {
                              setIsUploadingIdBack(false);
                            }
                          }}
                          data-testid="input-id-back-upload"
                        />
                        <label htmlFor="id-back-upload">
                          <Button variant="outline" size="sm" asChild disabled={isUploadingIdBack}>
                            <span>{isUploadingIdBack ? "Uploading..." : "Upload Back"}</span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Passport notice */}
              {selectedIdType === "passport" && (
                <p className="text-xs text-muted-foreground mt-2">
                  For passports, only the photo page is required.
                </p>
              )}
            </div>

            <Separator className="my-6" />

            {/* Selfie / Liveness Check Section */}
            <div className="mb-8">
              <h4 className="text-base font-medium mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                Selfie Verification
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Take or upload a clear selfie for identity verification. This helps us confirm that you are the person on the ID document.
              </p>

              {onboardingData?.documents?.some(d => d.documentType === "selfie") ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">Selfie Uploaded</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your selfie has been uploaded. Now verify your identity.
                    </p>
                  </div>

                  {/* Face Match Verification */}
                  {stepStatus.steps[1]?.hasIdFront && (
                    <div className="border rounded-lg p-4 bg-card">
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        AI Identity Verification
                      </h5>
                      <p className="text-sm text-muted-foreground mb-4">
                        Our AI system will compare your selfie with your ID photo to verify your identity.
                      </p>

                      {faceMatchResult ? (
                        <div className={`rounded-lg p-4 ${faceMatchResult.isMatch ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"} border`}>
                          <div className="flex items-center gap-2 mb-2">
                            {faceMatchResult.isMatch ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className={`font-medium ${faceMatchResult.isMatch ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                              {faceMatchResult.isMatch ? "Identity Verified" : "Verification Failed"}
                            </span>
                            <Badge variant={faceMatchResult.isMatch ? "default" : "destructive"} className="ml-2">
                              {faceMatchResult.confidence}% confidence
                            </Badge>
                          </div>
                          <p className={`text-sm ${faceMatchResult.isMatch ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                            {faceMatchResult.analysisDetails.matchReasoning}
                          </p>
                          {faceMatchResult.warnings.length > 0 && (
                            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                              <strong>Notes:</strong> {faceMatchResult.warnings.join(", ")}
                            </div>
                          )}
                          {!faceMatchResult.isMatch && (
                            <Button 
                              variant="outline" 
                              className="mt-3"
                              onClick={() => setFaceMatchResult(null)}
                              data-testid="button-retry-face-match"
                            >
                              Try Again
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={async () => {
                            setIsRunningFaceMatch(true);
                            try {
                              const response = await fetch("/api/professional/onboarding/face-match", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                              });
                              if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || "Verification failed");
                              }
                              const result = await response.json();
                              setFaceMatchResult(result);
                              if (result.isMatch) {
                                toast({ title: "Identity Verified", description: `Face match confirmed with ${result.confidence}% confidence.` });
                              } else {
                                toast({ title: "Verification Failed", description: "The photos don't appear to match. Please try with better quality photos.", variant: "destructive" });
                              }
                            } catch (error) {
                              toast({ 
                                title: "Verification Error", 
                                description: error instanceof Error ? error.message : "Unknown error", 
                                variant: "destructive" 
                              });
                            } finally {
                              setIsRunningFaceMatch(false);
                            }
                          }}
                          disabled={isRunningFaceMatch}
                          data-testid="button-verify-identity"
                        >
                          {isRunningFaceMatch ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing Photos...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Verify My Identity
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {isUploadingSelfie ? (
                    <>
                      <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
                      <p className="text-sm text-muted-foreground mb-3">Uploading your selfie...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload a clear photo of your face
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    id="selfie-upload"
                    disabled={isUploadingSelfie}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingSelfie(true);
                      try {
                        const urlResponse = await fetch("/api/uploads/request-url", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                          credentials: "include",
                        });
                        if (!urlResponse.ok) throw new Error("Failed to get upload URL");
                        const { uploadURL, objectPath } = await urlResponse.json();
                        const uploadResponse = await fetch(uploadURL, {
                          method: "PUT",
                          body: file,
                          headers: { "Content-Type": file.type },
                        });
                        if (!uploadResponse.ok) throw new Error("Failed to upload file");
                        uploadDocumentMutation.mutate({
                          documentType: "selfie",
                          documentUrl: objectPath,
                          documentName: file.name,
                        });
                      } catch (error) {
                        toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
                      } finally {
                        setIsUploadingSelfie(false);
                      }
                    }}
                    data-testid="input-selfie-upload"
                  />
                  <label htmlFor="selfie-upload">
                    <Button variant="outline" asChild disabled={isUploadingSelfie}>
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        {isUploadingSelfie ? "Uploading..." : "Take or Upload Selfie"}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    For best results: good lighting, face clearly visible, no sunglasses or hats
                  </p>
                </div>
              )}
            </div>

            {/* Continue button for identity step */}
            {stepStatus.steps[1]?.complete && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={() => {
                    setManualStepSelection(true);
                    setActiveStep(2);
                  }}
                  className="w-full"
                  data-testid="button-continue-to-w9"
                >
                  Continue to W-9 Form
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: W-9 Tax Form */}
      {activeStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              W-9 Tax Form
            </CardTitle>
            <CardDescription>
              Complete your W-9 tax form for 1099 reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onboardingData?.taxForms?.[0]?.verificationStatus === "pending" && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">W-9 Under Review</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Your W-9 form has been submitted and is pending admin verification.
                </p>
              </div>
            )}

            {/* Download Blank W-9 and Upload Filled Form Section */}
            <div className="border rounded-lg p-4 mb-6 bg-muted/30">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download & Upload W-9 Form
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                You can either fill out the form below digitally, or download a blank W-9, fill it out, and upload the completed form.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Download Blank W-9 */}
                <div className="border rounded-lg p-4 bg-background">
                  <h5 className="font-medium mb-2 text-sm">Download Blank W-9</h5>
                  <p className="text-xs text-muted-foreground mb-3">
                    Get the official IRS W-9 form to fill out manually
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open("https://www.irs.gov/pub/irs-pdf/fw9.pdf", "_blank")}
                    data-testid="button-download-w9"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download W-9 (PDF)
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </div>

                {/* Upload Filled W-9 */}
                <div className="border rounded-lg p-4 bg-background">
                  <h5 className="font-medium mb-2 text-sm">Upload Completed W-9</h5>
                  {onboardingData?.documents?.some(d => d.documentType === "w9_form") ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">W-9 Uploaded</span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Your W-9 document has been uploaded and is pending review
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">
                        Upload your completed W-9 form (PDF or image)
                      </p>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 text-center">
                        {isUploadingW9 ? (
                          <Loader2 className="h-6 w-6 text-primary mx-auto mb-2 animate-spin" />
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          id="w9-upload"
                          disabled={isUploadingW9}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingW9(true);
                            try {
                              const urlResponse = await fetch("/api/uploads/request-url", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                                credentials: "include",
                              });
                              if (!urlResponse.ok) throw new Error("Failed to get upload URL");
                              const { uploadURL, objectPath } = await urlResponse.json();
                              const uploadResponse = await fetch(uploadURL, {
                                method: "PUT",
                                body: file,
                                headers: { "Content-Type": file.type },
                              });
                              if (!uploadResponse.ok) throw new Error("Failed to upload file");
                              uploadDocumentMutation.mutate({
                                documentType: "w9_form",
                                documentUrl: objectPath,
                                documentName: file.name,
                              });
                              toast({ title: "W-9 document uploaded successfully" });
                            } catch (error) {
                              toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
                            } finally {
                              setIsUploadingW9(false);
                            }
                          }}
                          data-testid="input-w9-upload"
                        />
                        <label htmlFor="w9-upload">
                          <Button variant="outline" size="sm" asChild disabled={isUploadingW9}>
                            <span>{isUploadingW9 ? "Uploading..." : "Upload W-9"}</span>
                          </Button>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />
            
            <h4 className="font-medium mb-4">Or Complete the Digital W-9 Form</h4>

            <Form {...w9Form}>
              <form onSubmit={w9Form.handleSubmit((data) => submitW9Mutation.mutate(data))} className="space-y-6">
                <FormField
                  control={w9Form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Name (as shown on your income tax return)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-legal-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={w9Form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name / DBA (if different)</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} data-testid="input-business-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={w9Form.control}
                  name="taxClassification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Classification</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tax-classification">
                            <SelectValue placeholder="Select classification" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TAX_CLASSIFICATIONS.map((tc) => (
                            <SelectItem key={tc.value} value={tc.value}>
                              {tc.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={w9Form.control}
                  name="useSsn"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-4">
                      <FormLabel className="m-0">Tax ID Type:</FormLabel>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={field.value}
                            onChange={() => field.onChange(true)}
                            data-testid="radio-ssn"
                          />
                          SSN
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={!field.value}
                            onChange={() => field.onChange(false)}
                            data-testid="radio-ein"
                          />
                          EIN
                        </label>
                      </div>
                    </FormItem>
                  )}
                />

                {w9Form.watch("useSsn") ? (
                  <FormField
                    control={w9Form.control}
                    name="ssn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Security Number (SSN)</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="XXX-XX-XXXX"
                            {...field}
                            data-testid="input-ssn"
                          />
                        </FormControl>
                        <FormDescription>Your SSN is encrypted and securely stored</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={w9Form.control}
                    name="ein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Identification Number (EIN)</FormLabel>
                        <FormControl>
                          <Input placeholder="XX-XXXXXXX" {...field} data-testid="input-ein" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Separator />
                <h4 className="font-medium">Tax Address</h4>

                <FormField
                  control={w9Form.control}
                  name="taxAddressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-tax-street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <FormField
                    control={w9Form.control}
                    name="taxAddressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-tax-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={w9Form.control}
                    name="taxAddressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tax-state">
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={w9Form.control}
                    name="taxAddressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-tax-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={w9Form.control}
                  name="electronicSignature"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-signature"
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>Electronic Signature</FormLabel>
                        <FormDescription>
                          By checking this box, I certify that the information provided is accurate and I agree to sign
                          this W-9 form electronically.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={submitW9Mutation.isPending}
                  className="w-full"
                  data-testid="button-submit-w9"
                >
                  {submitW9Mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit W-9 Form
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Agreements */}
      {activeStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Contractual Agreements
            </CardTitle>
            <CardDescription>
              Review and sign the required agreements before payment eligibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Independent Contractor Agreement */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">Independent Contractor Agreement</h4>
                  <p className="text-sm text-muted-foreground">
                    Terms of engagement as an independent contractor including work scope, compensation, and relationship classification
                  </p>
                </div>
                {hasSignedAgreement("contractor_agreement") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSignAgreement("contractor_agreement")}
                    disabled={signAgreementMutation.isPending}
                    data-testid="button-sign-contractor-agreement"
                    className="flex-shrink-0"
                  >
                    Sign Agreement
                  </Button>
                )}
              </div>
            </div>

            {/* Marketplace Terms of Service */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">Marketplace Terms of Service</h4>
                  <p className="text-sm text-muted-foreground">
                    Platform usage terms, account responsibilities, and service guidelines
                  </p>
                </div>
                {hasSignedAgreement("terms_of_service") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSignAgreement("terms_of_service")}
                    disabled={signAgreementMutation.isPending}
                    data-testid="button-sign-terms-of-service"
                    className="flex-shrink-0"
                  >
                    Sign Agreement
                  </Button>
                )}
              </div>
            </div>

            {/* Escrow & Dispute Policies */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">Escrow & Dispute Policies</h4>
                  <p className="text-sm text-muted-foreground">
                    Payment escrow terms, dispute resolution procedures, and refund policies
                  </p>
                </div>
                {hasSignedAgreement("escrow_dispute_policy") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSignAgreement("escrow_dispute_policy")}
                    disabled={signAgreementMutation.isPending}
                    data-testid="button-sign-escrow-dispute"
                    className="flex-shrink-0"
                  >
                    Sign Agreement
                  </Button>
                )}
              </div>
            </div>

            {/* Non-Circumvention Agreement */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">Non-Circumvention Agreement</h4>
                  <p className="text-sm text-muted-foreground">
                    Commitment to conduct all transactions through the platform
                  </p>
                </div>
                {hasSignedAgreement("non_circumvention") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSignAgreement("non_circumvention")}
                    disabled={signAgreementMutation.isPending}
                    data-testid="button-sign-non-circumvention"
                    className="flex-shrink-0"
                  >
                    Sign Agreement
                  </Button>
                )}
              </div>
            </div>

            {/* Confidentiality / NDA */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">Confidentiality & NDA</h4>
                  <p className="text-sm text-muted-foreground">
                    Non-disclosure agreement for protecting sensitive practice and patient information
                  </p>
                </div>
                {hasSignedAgreement("nda") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSignAgreement("nda")}
                    disabled={signAgreementMutation.isPending}
                    data-testid="button-sign-nda"
                    className="flex-shrink-0"
                  >
                    Sign Agreement
                  </Button>
                )}
              </div>
            </div>

            {/* HIPAA Acknowledgment */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">HIPAA Acknowledgment</h4>
                  <p className="text-sm text-muted-foreground">
                    Acknowledge HIPAA compliance requirements for handling protected health information
                  </p>
                </div>
                {hasSignedAgreement("hipaa_acknowledgment") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSignAgreement("hipaa_acknowledgment")}
                    disabled={signAgreementMutation.isPending}
                    data-testid="button-sign-hipaa"
                    className="flex-shrink-0"
                  >
                    Sign Agreement
                  </Button>
                )}
              </div>
            </div>

            {/* Progress indicator */}
            {(() => {
              const allAgreements = ["contractor_agreement", "terms_of_service", "escrow_dispute_policy", "non_circumvention", "nda", "hipaa_acknowledgment"];
              const signedCount = allAgreements.filter(a => hasSignedAgreement(a)).length;
              const allSigned = signedCount === allAgreements.length;
              
              return (
                <>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Agreement Progress</span>
                      <span className="text-sm text-muted-foreground">{signedCount} of {allAgreements.length} signed</span>
                    </div>
                    <Progress value={(signedCount / allAgreements.length) * 100} className="h-2" />
                  </div>

                  {allSigned && (
                    <Button className="w-full" onClick={goToNextStep} data-testid="button-continue-to-compliance">
                      Continue to Work Eligibility
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Work Eligibility & Compliance */}
      {activeStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Work Eligibility & Compliance
            </CardTitle>
            <CardDescription>
              Submit your professional credentials and compliance documents for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Healthcare professionals must provide valid credentials. Documents will be verified by our compliance team before you can receive payments.
              </p>
            </div>

            {/* Professional License */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Professional License</h4>
                    <p className="text-sm text-muted-foreground">
                      State dental hygienist or dental assistant license
                    </p>
                  </div>
                </div>
                {onboardingData?.documents?.some(d => d.documentType === "professional_license") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <ComplianceUploadButton 
                    documentType="professional_license" 
                    label="Upload License"
                    uploadDocumentMutation={uploadDocumentMutation}
                  />
                )}
              </div>
            </div>

            {/* NPI Number */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">NPI Number Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      National Provider Identifier for U.S. clinicians
                    </p>
                  </div>
                </div>
                {onboardingData?.documents?.some(d => d.documentType === "npi_number") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <ComplianceUploadButton 
                    documentType="npi_number" 
                    label="Upload NPI"
                    uploadDocumentMutation={uploadDocumentMutation}
                  />
                )}
              </div>
            </div>

            {/* Malpractice Insurance */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Malpractice Insurance</h4>
                    <p className="text-sm text-muted-foreground">
                      Proof of professional liability coverage
                    </p>
                  </div>
                </div>
                {onboardingData?.documents?.some(d => d.documentType === "malpractice_insurance") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <ComplianceUploadButton 
                    documentType="malpractice_insurance" 
                    label="Upload Insurance"
                    uploadDocumentMutation={uploadDocumentMutation}
                  />
                )}
              </div>
            </div>

            {/* Background Check */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Background Check Authorization</h4>
                    <p className="text-sm text-muted-foreground">
                      Consent for criminal background verification
                    </p>
                  </div>
                </div>
                {onboardingData?.documents?.some(d => d.documentType === "background_check") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <ComplianceUploadButton 
                    documentType="background_check" 
                    label="Upload Authorization"
                    uploadDocumentMutation={uploadDocumentMutation}
                  />
                )}
              </div>
            </div>

            {/* Immunization Records */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Syringe className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Immunization Records</h4>
                    <p className="text-sm text-muted-foreground">
                      Hepatitis B, Flu, COVID-19, and other required vaccines
                    </p>
                  </div>
                </div>
                {onboardingData?.documents?.some(d => d.documentType === "immunization_records") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <ComplianceUploadButton 
                    documentType="immunization_records" 
                    label="Upload Records"
                    uploadDocumentMutation={uploadDocumentMutation}
                  />
                )}
              </div>
            </div>

            {/* CPR/BLS Certification */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">CPR/BLS Certification</h4>
                    <p className="text-sm text-muted-foreground">
                      Current CPR and Basic Life Support certification
                    </p>
                  </div>
                </div>
                {onboardingData?.documents?.some(d => d.documentType === "cpr_bls_certification") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <ComplianceUploadButton 
                    documentType="cpr_bls_certification" 
                    label="Upload Certification"
                    uploadDocumentMutation={uploadDocumentMutation}
                  />
                )}
              </div>
            </div>

            {/* Progress indicator */}
            {(() => {
              const allComplianceDocs = ["professional_license", "npi_number", "malpractice_insurance", "background_check", "immunization_records", "cpr_bls_certification"];
              const uploadedCount = allComplianceDocs.filter(type => onboardingData?.documents?.some(d => d.documentType === type)).length;
              const allUploaded = uploadedCount === allComplianceDocs.length;
              
              return (
                <>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Compliance Progress</span>
                      <span className="text-sm text-muted-foreground">{uploadedCount} of {allComplianceDocs.length} uploaded</span>
                    </div>
                    <Progress value={(uploadedCount / allComplianceDocs.length) * 100} className="h-2" />
                  </div>

                  {allUploaded && (
                    <Button className="w-full" onClick={goToNextStep} data-testid="button-continue-to-payment">
                      Continue to Payment Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Payment Setup */}
      {activeStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Setup
            </CardTitle>
            <CardDescription>Configure your preferred withdrawal method for receiving payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Select at least one payout method to receive payments for completed shifts. You can add multiple methods and set a primary one later.
              </p>
            </div>

            {/* Connected Payment Methods Summary */}
            {onboardingData?.paymentMethods?.some((pm) => pm.stripeOnboardingComplete || pm.verificationStatus === "verified" || pm.verificationStatus === "pending") && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Payment Methods Configured</span>
                </div>
                <div className="space-y-1">
                  {onboardingData.paymentMethods.filter(pm => pm.stripeOnboardingComplete || pm.verificationStatus === "verified" || pm.verificationStatus === "pending").map((pm, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="capitalize">{pm.methodType?.replace(/_/g, ' ')}</span>
                      {pm.verificationStatus === "pending" && <Badge variant="outline" className="text-xs">Pending Verification</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stripe Connect */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Stripe Connect</h4>
                    <p className="text-sm text-muted-foreground">
                      Fast payouts via Stripe's secure platform
                    </p>
                  </div>
                </div>
                {onboardingData?.paymentMethods?.some(pm => pm.methodType === "stripe_connect" && pm.stripeOnboardingComplete) ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setViewPaymentMethod(onboardingData?.paymentMethods?.find(pm => pm.methodType === "stripe_connect"))}
                      data-testid="button-view-stripe"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePaymentMethodMutation.mutate("stripe_connect")}
                      disabled={removePaymentMethodMutation.isPending}
                      data-testid="button-reset-stripe"
                    >
                      {removePaymentMethodMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reset"}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addPaymentMethodMutation.mutate({ methodType: "stripe_connect" })}
                    disabled={addPaymentMethodMutation.isPending}
                    data-testid="button-stripe-connect"
                  >
                    {addPaymentMethodMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
                  </Button>
                )}
              </div>
            </div>

            {/* ACH / Direct Bank Transfer */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Direct Bank Transfer (ACH/SEPA/Wire)</h4>
                    <p className="text-sm text-muted-foreground">
                      Transfer directly to your bank account
                    </p>
                  </div>
                </div>
                {onboardingData?.paymentMethods?.some(pm => pm.methodType === "ach_bank_transfer") ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {onboardingData?.paymentMethods?.find(pm => pm.methodType === "ach_bank_transfer")?.verificationStatus === "pending" ? "Pending" : "Added"}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setViewPaymentMethod(onboardingData?.paymentMethods?.find(pm => pm.methodType === "ach_bank_transfer"))}
                      data-testid="button-view-ach"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePaymentMethodMutation.mutate("ach_bank_transfer")}
                      disabled={removePaymentMethodMutation.isPending}
                      data-testid="button-reset-ach"
                    >
                      {removePaymentMethodMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reset"}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowBankForm(!showBankForm)}
                    data-testid="button-ach-transfer"
                  >
                    {showBankForm ? "Cancel" : "Add Bank"}
                  </Button>
                )}
              </div>

              {/* Bank Details Form */}
              {showBankForm && !onboardingData?.paymentMethods?.some(pm => pm.methodType === "ach_bank_transfer") && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Account holder name must match your verified identity (KYC) for successful payouts.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        placeholder="e.g., Chase Bank, Bank of America"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                        data-testid="input-bank-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountHolderName">Account Holder Name</Label>
                      <Input
                        id="accountHolderName"
                        placeholder="Must match KYC verification"
                        value={bankDetails.accountHolderName || (onboardingData?.professional?.firstName && onboardingData?.professional?.lastName ? `${onboardingData.professional.firstName} ${onboardingData.professional.lastName}` : "")}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                        data-testid="input-account-holder"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number / IBAN</Label>
                      <Input
                        id="accountNumber"
                        placeholder="Enter account number or IBAN"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                        data-testid="input-account-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routingNumber">Routing Number / SWIFT Code</Label>
                      <Input
                        id="routingNumber"
                        placeholder="Enter routing or SWIFT code"
                        value={bankDetails.routingNumber}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, routingNumber: e.target.value }))}
                        data-testid="input-routing-number"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      const holderName = bankDetails.accountHolderName || (onboardingData?.professional?.firstName && onboardingData?.professional?.lastName ? `${onboardingData.professional.firstName} ${onboardingData.professional.lastName}` : "");
                      if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.routingNumber || !holderName) {
                        toast({ title: "Please fill in all bank details", variant: "destructive" });
                        return;
                      }
                      addPaymentMethodMutation.mutate({ 
                        methodType: "ach_bank_transfer",
                        bankName: bankDetails.bankName,
                        accountNumber: bankDetails.accountNumber,
                        routingNumber: bankDetails.routingNumber,
                        accountHolderName: holderName,
                      });
                      setShowBankForm(false);
                    }}
                    disabled={addPaymentMethodMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-bank"
                  >
                    {addPaymentMethodMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Bank Account...
                      </>
                    ) : (
                      "Add Bank Account"
                    )}
                  </Button>
                </div>
              )}

              {/* Void Check Upload for ACH */}
              {onboardingData?.paymentMethods?.some(pm => pm.methodType === "ach_bank_transfer") && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Void Check (required for ACH verification)</span>
                    </div>
                    {onboardingData?.documents?.some(d => d.documentType === "void_check") ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const doc = onboardingData?.documents?.find(d => d.documentType === "void_check");
                            if (doc?.documentUrl) {
                              window.open(doc.documentUrl, "_blank");
                            }
                          }}
                          data-testid="button-view-void-check"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocumentMutation.mutate("void_check")}
                          disabled={removeDocumentMutation.isPending}
                          data-testid="button-remove-void-check"
                        >
                          {removeDocumentMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Remove"}
                        </Button>
                      </div>
                    ) : (
                      <ComplianceUploadButton 
                        documentType="void_check" 
                        label="Upload Void Check"
                        uploadDocumentMutation={uploadDocumentMutation}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PayPal */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">PayPal</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive payments to your PayPal account
                    </p>
                  </div>
                </div>
                {onboardingData?.paymentMethods?.some(pm => pm.methodType === "paypal") ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setViewPaymentMethod(onboardingData?.paymentMethods?.find(pm => pm.methodType === "paypal"))}
                      data-testid="button-view-paypal"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePaymentMethodMutation.mutate("paypal")}
                      disabled={removePaymentMethodMutation.isPending}
                      data-testid="button-reset-paypal"
                    >
                      {removePaymentMethodMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reset"}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setPaymentAccountEmail(""); setPaymentModalOpen("paypal"); }}
                    data-testid="button-paypal"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Payoneer */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Payoneer</h4>
                    <p className="text-sm text-muted-foreground">
                      Global payments with local receiving accounts
                    </p>
                  </div>
                </div>
                {onboardingData?.paymentMethods?.some(pm => pm.methodType === "payoneer") ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setViewPaymentMethod(onboardingData?.paymentMethods?.find(pm => pm.methodType === "payoneer"))}
                      data-testid="button-view-payoneer"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePaymentMethodMutation.mutate("payoneer")}
                      disabled={removePaymentMethodMutation.isPending}
                      data-testid="button-reset-payoneer"
                    >
                      {removePaymentMethodMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reset"}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setPaymentAccountEmail(""); setPaymentModalOpen("payoneer"); }}
                    data-testid="button-payoneer"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Wise (TransferWise) */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Banknote className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Wise (TransferWise)</h4>
                    <p className="text-sm text-muted-foreground">
                      Low-fee international transfers
                    </p>
                  </div>
                </div>
                {onboardingData?.paymentMethods?.some(pm => pm.methodType === "wise") ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setViewPaymentMethod(onboardingData?.paymentMethods?.find(pm => pm.methodType === "wise"))}
                      data-testid="button-view-wise"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePaymentMethodMutation.mutate("wise")}
                      disabled={removePaymentMethodMutation.isPending}
                      data-testid="button-reset-wise"
                    >
                      {removePaymentMethodMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reset"}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setPaymentAccountEmail(""); setPaymentModalOpen("wise"); }}
                    data-testid="button-wise"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Skrill */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Skrill</h4>
                    <p className="text-sm text-muted-foreground">
                      Digital wallet with worldwide reach
                    </p>
                  </div>
                </div>
                {onboardingData?.paymentMethods?.some(pm => pm.methodType === "skrill") ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setViewPaymentMethod(onboardingData?.paymentMethods?.find(pm => pm.methodType === "skrill"))}
                      data-testid="button-view-skrill"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePaymentMethodMutation.mutate("skrill")}
                      disabled={removePaymentMethodMutation.isPending}
                      data-testid="button-reset-skrill"
                    >
                      {removePaymentMethodMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reset"}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setPaymentAccountEmail(""); setPaymentModalOpen("skrill"); }}
                    data-testid="button-skrill"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Payment Method Setup Modal */}
            <Dialog open={paymentModalOpen !== null} onOpenChange={(open) => { if (!open) setPaymentModalOpen(null); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="capitalize">
                    Connect {paymentModalOpen === "wise" ? "Wise (TransferWise)" : paymentModalOpen}
                  </DialogTitle>
                  <DialogDescription>
                    Enter your {paymentModalOpen} account email to receive payments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentEmail">
                      {paymentModalOpen === "wise" ? "Wise" : paymentModalOpen?.charAt(0).toUpperCase() + paymentModalOpen?.slice(1)} Email Address
                    </Label>
                    <Input
                      id="paymentEmail"
                      type="email"
                      placeholder={`Enter your ${paymentModalOpen} email`}
                      value={paymentAccountEmail}
                      onChange={(e) => setPaymentAccountEmail(e.target.value)}
                      data-testid="input-payment-email"
                    />
                    <p className="text-xs text-muted-foreground">
                      This email must match your verified {paymentModalOpen} account
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPaymentModalOpen(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (!paymentAccountEmail || !paymentAccountEmail.includes("@")) {
                        toast({ title: "Please enter a valid email address", variant: "destructive" });
                        return;
                      }
                      addPaymentMethodMutation.mutate({ 
                        methodType: paymentModalOpen!, 
                        paymentEmail: paymentAccountEmail 
                      });
                      setPaymentModalOpen(null);
                    }}
                    disabled={addPaymentMethodMutation.isPending}
                    data-testid="button-confirm-payment"
                  >
                    {addPaymentMethodMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Account"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* View Payment Method Details Dialog */}
            <Dialog open={viewPaymentMethod !== null} onOpenChange={(open) => !open && setViewPaymentMethod(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Payment Method Details</DialogTitle>
                  <DialogDescription>
                    Your connected {viewPaymentMethod?.methodType?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} account details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {viewPaymentMethod?.methodType === "stripe_connect" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge className="bg-green-500/10 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {viewPaymentMethod?.stripeOnboardingComplete ? "Connected" : "Pending"}
                        </Badge>
                      </div>
                      {viewPaymentMethod?.stripeAccountId && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Account ID</span>
                          <span className="font-mono text-sm">{viewPaymentMethod.stripeAccountId}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {viewPaymentMethod?.methodType === "ach_bank_transfer" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Account Holder</span>
                        <span className="font-medium">{viewPaymentMethod?.accountHolderName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Bank Name</span>
                        <span className="font-medium">{viewPaymentMethod?.bankName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {showSensitiveDetails 
                              ? (viewPaymentMethod?.accountNumber || `••••${viewPaymentMethod?.accountNumberLast4 || "****"}`)
                              : `••••${viewPaymentMethod?.accountNumberLast4 || "****"}`}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowSensitiveDetails(!showSensitiveDetails)}
                            data-testid="button-toggle-account"
                          >
                            {showSensitiveDetails ? <Eye className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span className="ml-1 text-xs">{showSensitiveDetails ? "Hide" : "Show"}</span>
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Routing Number</span>
                        <span className="font-mono">
                          {showSensitiveDetails 
                            ? (viewPaymentMethod?.routingNumber || "•••••••••")
                            : "•••••••••"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge className={viewPaymentMethod?.verificationStatus === "verified" ? "bg-green-500/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"}>
                          {viewPaymentMethod?.verificationStatus === "verified" ? "Verified" : "Pending Verification"}
                        </Badge>
                      </div>
                      {viewPaymentMethod?.verificationStatus !== "verified" && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mt-2">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Pending Verification:</strong> Your bank account details have been submitted but need to be verified before payments can be processed. An admin will review and verify your account shortly.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {["paypal", "payoneer", "wise", "skrill"].includes(viewPaymentMethod?.methodType) && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Account Email</span>
                        <span className="font-medium">{viewPaymentMethod?.paymentEmail || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge className="bg-green-500/10 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Connected On</span>
                        <span className="text-sm">{viewPaymentMethod?.createdAt ? new Date(viewPaymentMethod.createdAt).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewPaymentMethod(null)} data-testid="button-close-view">
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Platform Escrow Release */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Platform Escrow</h4>
                    <p className="text-sm text-muted-foreground">
                      Hold funds in platform escrow until manual release
                    </p>
                  </div>
                </div>
                {onboardingData?.paymentMethods?.some(pm => pm.methodType === "platform_escrow") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addPaymentMethodMutation.mutate({ methodType: "platform_escrow" })}
                    disabled={addPaymentMethodMutation.isPending}
                    data-testid="button-escrow"
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>

            {addPaymentMethodMutation.isPending && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Setting up payment method...</span>
              </div>
            )}

            {/* Onboarding Complete */}
            {onboardingData?.professional?.paymentMethodVerified && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center mt-6">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Onboarding Complete!</h3>
                <p className="text-green-700 dark:text-green-300 mt-2">
                  You're all set to start working shifts and receiving payments.
                </p>
                <Button className="mt-4" onClick={() => setLocation("/app/hub")} data-testid="button-go-to-hub">
                  Go to Professionals Hub
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

            {/* Navigation buttons at bottom of content */}
            {activeStep !== null && (
              <div className="flex items-center justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={goToPrevStep}
                  disabled={activeStep === 0}
                  data-testid="button-prev-step"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button 
                  variant="outline"
                  onClick={goToNextStep}
                  disabled={activeStep === ONBOARDING_STEPS.length - 1}
                  data-testid="button-next-step"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
