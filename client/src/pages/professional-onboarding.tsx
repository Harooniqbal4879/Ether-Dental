import { useState, useEffect } from "react";
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
  Loader2,
  Building2,
  CheckCircle2,
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
import { ObjectUploader } from "@/components/ObjectUploader";
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
});

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

export default function ProfessionalOnboarding() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { professional, isProfessionalAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(0);

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
    },
  });

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
      setActiveStep(1);
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
      setActiveStep(2);
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
  const steps = [
    { name: "Personal Info", icon: User, key: "personal_info" },
    { name: "Tax Forms (W-9)", icon: FileText, key: "tax_forms" },
    { name: "Agreements", icon: ShieldCheck, key: "agreements" },
    { name: "Payment Setup", icon: CreditCard, key: "payment_setup" },
  ];

  const isStepComplete = (stepKey: string) => {
    return progress?.steps.find((s) => s.name === stepKey)?.complete || false;
  };

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

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <PageHeader
        title="Complete Your Onboarding"
        description="Complete the steps below to become eligible to receive payments"
      />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">{progress?.percentComplete || 0}%</span>
        </div>
        <Progress value={progress?.percentComplete || 0} className="h-2" data-testid="progress-onboarding" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-muted-foreground">
            {progress?.completedSteps || 0} of {progress?.totalSteps || 5} steps complete
          </span>
          {getStatusBadge(onboardingData?.professional?.onboardingStatus || "in_progress")}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const complete = isStepComplete(step.key);
          return (
            <Button
              key={step.key}
              variant={activeStep === idx ? "default" : complete ? "secondary" : "outline"}
              className="flex items-center gap-2 flex-shrink-0"
              onClick={() => setActiveStep(idx)}
              data-testid={`button-step-${step.key}`}
            >
              {complete ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <StepIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{step.name}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </Button>
          );
        })}
      </div>

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

                <FormField
                  control={personalInfoForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
              <FileText className="h-5 w-5" />
              W-9 Tax Form
            </CardTitle>
            <CardDescription>
              Complete your W-9 form for 1099 tax reporting
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
              <Button className="w-full" onClick={() => setActiveStep(3)} data-testid="button-continue-to-payment">
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

      {progress?.percentComplete === 100 && !onboardingData?.professional?.paymentEligible && (
        <Card className="mt-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Verification Pending</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your onboarding is complete. An administrator will review your information and verify your
                  account. You'll receive a notification once you're approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
