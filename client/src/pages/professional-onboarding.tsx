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
    key: "identity_w9", 
    name: "Identity & W-9", 
    shortName: "ID & Tax",
    icon: IdCard, 
    description: "Government ID and tax information",
    action: "Upload ID and complete W-9",
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
  const [isUploadingId, setIsUploadingId] = useState(false);

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
  
  // Resend countdown timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

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
    const hasGovernmentId = docs.some(d => d.documentType === "government_id" || d.documentType === "identity");
    const hasW9 = taxForms.length > 0;
    const hasIdentityAndW9 = hasGovernmentId && hasW9;
    const hasSignedContractor = agreements.some(a => a.agreementType === "contractor_agreement" && a.signedAt);
    const hasSignedHipaa = agreements.some(a => a.agreementType === "hipaa_acknowledgment" && a.signedAt);
    const hasAgreements = hasSignedContractor && hasSignedHipaa;
    const hasPayment = paymentMethods.some(pm => pm.stripeOnboardingComplete || pm.verificationStatus === "verified");
    
    // Check verification statuses from backend
    const identityVerified = onboardingData?.documents?.some((d: any) => 
      (d.documentType === "government_id" || d.documentType === "identity") && 
      d.verificationStatus === "approved"
    ) || false;
    const w9Verified = taxForms[0]?.verificationStatus === "approved";
    const paymentVerified = paymentMethods.some(pm => pm.verificationStatus === "verified");
    
    const steps = [
      { 
        key: "personal_info", 
        complete: hasPersonalInfo,
        status: hasPersonalInfo ? "complete" : "pending" as const,
        needsVerification: false,
      },
      { 
        key: "identity_w9", 
        complete: hasIdentityAndW9,
        status: hasIdentityAndW9 ? "complete" : (hasGovernmentId || hasW9) ? "partial" : "pending" as const,
        hasId: hasGovernmentId,
        hasW9: hasW9,
        w9Status: taxForms[0]?.verificationStatus,
        needsVerification: hasIdentityAndW9 && (!identityVerified || !w9Verified),
        isVerified: identityVerified && w9Verified,
      },
      { 
        key: "agreements", 
        complete: hasAgreements,
        status: hasAgreements ? "complete" : (hasSignedContractor || hasSignedHipaa) ? "partial" : "pending" as const,
        hasContractor: hasSignedContractor,
        hasHipaa: hasSignedHipaa,
        needsVerification: false,
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
    mutationFn: async (data: { methodType: string }) => {
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

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const res = await apiRequest("POST", "/api/uploads/request-url", {
        filename: file.name,
        contentType: file.type,
        directory: ".private/profile-photos",
      });
      const { uploadUrl, objectPath } = await res.json();
      
      await fetch(uploadUrl, {
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
                        <Input placeholder="123 Main St" {...field} data-testid="input-street" />
                      </FormControl>
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
              Identity Verification & Tax Information
            </CardTitle>
            <CardDescription>
              Upload your government ID and complete your W-9 tax form
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step progress for this section */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {stepStatus.steps[1]?.hasId ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-sm ${stepStatus.steps[1]?.hasId ? "text-green-700 font-medium" : ""}`}>
                  Government ID
                </span>
              </div>
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-2">
                {stepStatus.steps[1]?.hasW9 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-sm ${stepStatus.steps[1]?.hasW9 ? "text-green-700 font-medium" : ""}`}>
                  W-9 Form
                </span>
              </div>
            </div>

            {/* Government ID Upload Section */}
            <div className="mb-8">
              <h4 className="text-base font-medium mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                Upload Government ID
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a clear photo of your government-issued ID (driver's license, passport, or state ID)
              </p>
              
              {onboardingData?.documents?.some(d => d.documentType === "government_id" || d.documentType === "identity") ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">ID Document Uploaded</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your government ID has been uploaded and is pending verification.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {isUploadingId ? (
                    <>
                      <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Uploading your ID document...
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload a clear photo of your government-issued ID
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id="id-upload"
                    disabled={isUploadingId}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setIsUploadingId(true);
                      try {
                        // Step 1: Get presigned URL for upload
                        const urlResponse = await fetch("/api/uploads/request-url", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: file.name,
                            size: file.size,
                            contentType: file.type,
                          }),
                          credentials: "include",
                        });
                        
                        if (!urlResponse.ok) {
                          throw new Error("Failed to get upload URL");
                        }
                        
                        const { uploadURL, objectPath } = await urlResponse.json();
                        
                        // Step 2: Upload file directly to object storage
                        const uploadResponse = await fetch(uploadURL, {
                          method: "PUT",
                          body: file,
                          headers: {
                            "Content-Type": file.type,
                          },
                        });
                        
                        if (!uploadResponse.ok) {
                          throw new Error("Failed to upload file");
                        }
                        
                        // Step 3: Register the document in the database
                        uploadDocumentMutation.mutate({
                          documentType: "government_id",
                          documentUrl: objectPath,
                          documentName: file.name,
                        });
                      } catch (error) {
                        toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
                      } finally {
                        setIsUploadingId(false);
                      }
                    }}
                    data-testid="input-id-upload"
                  />
                  <label htmlFor="id-upload">
                    <Button variant="outline" asChild disabled={isUploadingId}>
                      <span>
                        {isUploadingId ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Select File
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Accepted formats: JPEG, PNG, PDF (max 10MB)
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* W-9 Form Section */}
            <div>
              <h4 className="text-base font-medium mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                Complete W-9 Tax Form
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Your tax information for 1099 reporting
              </p>
            </div>

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

      {activeStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Agreements
            </CardTitle>
            <CardDescription>Review and sign the required agreements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Independent Contractor Agreement</h4>
                  <p className="text-sm text-muted-foreground">
                    Terms of engagement as an independent contractor
                  </p>
                </div>
                {hasSignedAgreement("contractor_agreement") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSignAgreement("contractor_agreement")}
                    disabled={signAgreementMutation.isPending}
                    data-testid="button-sign-contractor-agreement"
                  >
                    Sign Agreement
                  </Button>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">HIPAA Acknowledgment</h4>
                  <p className="text-sm text-muted-foreground">
                    Acknowledge HIPAA compliance requirements
                  </p>
                </div>
                {hasSignedAgreement("hipaa_acknowledgment") ? (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSignAgreement("hipaa_acknowledgment")}
                    disabled={signAgreementMutation.isPending}
                    data-testid="button-sign-hipaa"
                  >
                    Sign Agreement
                  </Button>
                )}
              </div>
            </div>

            {hasSignedAgreement("contractor_agreement") && hasSignedAgreement("hipaa_acknowledgment") && (
              <Button className="w-full" onClick={goToNextStep} data-testid="button-continue-to-payment">
                Continue to Payment Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {activeStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Setup
            </CardTitle>
            <CardDescription>Set up how you'd like to receive payments for completed shifts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {onboardingData?.paymentMethods?.some((pm) => pm.stripeOnboardingComplete) ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Payment Method Connected</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your Stripe account is set up and ready to receive payments.
                </p>
              </div>
            ) : (
              <>
                <div className="border rounded-lg p-4 hover-elevate cursor-pointer" onClick={() => addPaymentMethodMutation.mutate({ methodType: "stripe_connect" })} data-testid="button-stripe-connect">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Connect with Stripe</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive payments directly to your bank account via Stripe Connect
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                {addPaymentMethodMutation.isPending && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Setting up payment...</span>
                  </div>
                )}
              </>
            )}

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
