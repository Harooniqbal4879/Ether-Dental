import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Search,
  DollarSign,
  Percent,
  Calendar,
  User,
  FileText,
  UserSearch
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePersona } from "@/lib/persona-context";
import { useLocation as useLocationContext } from "@/lib/location-context";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const ALLOWED_PERSONAS = ["admin", "front_desk", "treatment_coordinator", "billing_manager"];

const eligibilityFormSchema = z.object({
  patientId: z.string().optional(),
  providerType: z.enum(["1", "2"]),
  providerFirstName: z.string().optional(),
  providerLastName: z.string().optional(),
  providerOrgName: z.string().optional(),
  providerNpi: z.string().min(10, "NPI must be 10 digits"),
  providerTaxId: z.string().min(9, "Tax ID must be 9 digits"),
  payerIdCode: z.string().min(1, "Please select a payer"),
  payerName: z.string(),
  patientFirstName: z.string().min(1, "Required"),
  patientLastName: z.string().min(1, "Required"),
  patientDob: z.string().min(1, "Required"),
  patientMemberId: z.string().min(1, "Required"),
  patientRelationship: z.string().default("18"),
  groupNumber: z.string().optional(),
  policyId: z.string().optional(),
});

type EligibilityFormValues = z.infer<typeof eligibilityFormSchema>;

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
}

interface Policy {
  id: string;
  patientId: string;
  policyNumber: string;
  groupNumber: string | null;
  subscriberName: string;
  subscriberRelationship: string;
  carrier: {
    id: string;
    name: string;
  };
}

interface Payer {
  payerIdCode: string;
  name: string;
  eligibilitySupported: boolean;
}

interface EligibilityBenefit {
  id: string;
  benefitType: string;
  serviceType: string | null;
  procedureCode: string | null;
  network: string;
  coverageLevel: string | null;
  percent: string | null;
  amount: string | null;
  remaining: string | null;
  quantity: string | null;
  quantityQualifier: string | null;
  timePeriod: string | null;
  authorizationRequired: boolean;
  message: string | null;
}

interface EligibilityVerification {
  id: string;
  coverageStatus: string;
  patientFirstName: string;
  patientLastName: string;
  payerName: string;
  groupNumber: string | null;
  groupName: string | null;
  effectiveDateFrom: string | null;
  effectiveDateTo: string | null;
  planCoverageDescription: string | null;
  insuranceType: string | null;
  transactionId: string | null;
  responseMessages: string[] | null;
  createdAt: string;
  patientId?: string | null;
  policyId?: string | null;
}

interface Practice {
  id: string;
  name: string;
  npiNumber?: string;
  taxId?: string;
}

export function EligibilityTabContent() {
  const { toast } = useToast();
  const { currentPersona } = usePersona();
  const { currentPracticeId } = useLocationContext();
  const [, navigate] = useLocation();
  const [selectedVerification, setSelectedVerification] = useState<string | null>(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (!ALLOWED_PERSONAS.includes(currentPersona)) {
      navigate("/app/patients");
    }
  }, [currentPersona, navigate]);

  const practiceId = currentPracticeId || "practice-1";

  const { data: practice } = useQuery<Practice>({
    queryKey: ["/api/practices", practiceId],
    enabled: !!practiceId,
  });

  if (!ALLOWED_PERSONAS.includes(currentPersona)) {
    return null;
  }

  const { data: patients, isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: payers, isLoading: loadingPayers } = useQuery<Payer[]>({
    queryKey: ["/api/eligibility/payers"],
  });

  const { data: recentVerifications, isLoading: loadingVerifications } = useQuery<EligibilityVerification[]>({
    queryKey: ["/api/eligibility/verifications"],
  });

  const { data: patientPolicies } = useQuery<Policy[]>({
    queryKey: ["/api/patients", selectedPatient?.id, "policies"],
    enabled: !!selectedPatient?.id,
  });

  const { data: verificationDetails, isLoading: loadingDetails } = useQuery<{
    verification: EligibilityVerification;
    benefits: EligibilityBenefit[];
  }>({
    queryKey: ["/api/eligibility/verifications", selectedVerification],
    enabled: !!selectedVerification,
  });

  const form = useForm<EligibilityFormValues>({
    resolver: zodResolver(eligibilityFormSchema),
    defaultValues: {
      providerType: "2",
      providerNpi: "",
      providerTaxId: "",
      payerIdCode: "",
      payerName: "",
      patientFirstName: "",
      patientLastName: "",
      patientDob: "",
      patientMemberId: "",
      patientRelationship: "18",
      groupNumber: "",
    },
  });

  useEffect(() => {
    if (practice) {
      if (practice.npiNumber) {
        form.setValue("providerNpi", practice.npiNumber);
      }
      if (practice.taxId) {
        form.setValue("providerTaxId", practice.taxId);
      }
      if (practice.name) {
        form.setValue("providerOrgName", practice.name);
      }
    }
  }, [practice, form]);

  const checkEligibilityMutation = useMutation({
    mutationFn: async (values: EligibilityFormValues) => {
      const payload = {
        patientId: values.patientId,
        policyId: values.policyId,
        provider: {
          type: values.providerType,
          firstName: values.providerFirstName,
          lastName: values.providerLastName,
          organizationName: values.providerOrgName,
          npi: values.providerNpi,
          taxId: values.providerTaxId,
        },
        payer: {
          name: values.payerName,
          payerIdCode: values.payerIdCode,
        },
        patient: {
          firstName: values.patientFirstName,
          lastName: values.patientLastName,
          dateOfBirth: values.patientDob,
          memberId: values.patientMemberId,
          relationship: values.patientRelationship,
        },
        groupNumber: values.groupNumber,
      };

      const response = await apiRequest("POST", "/api/eligibility/check", payload);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/eligibility/verifications"] });
      setSelectedVerification(data.verification.id);
      
      if (data.simulated) {
        toast({
          title: "Simulated Response",
          description: "DentalXchange credentials not configured by platform admin. Showing simulated data.",
        });
      } else {
        toast({
          title: "Eligibility Verified",
          description: `Coverage status: ${data.verification.coverageStatus}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check eligibility",
        variant: "destructive",
      });
    },
  });

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearchOpen(false);
    
    form.setValue("patientId", patient.id);
    form.setValue("patientFirstName", patient.firstName);
    form.setValue("patientLastName", patient.lastName);
    form.setValue("patientDob", patient.dateOfBirth);
  };

  const handlePolicySelect = (policyId: string) => {
    const policy = patientPolicies?.find(p => p.id === policyId);
    if (policy) {
      form.setValue("policyId", policy.id);
      form.setValue("patientMemberId", policy.policyNumber);
      form.setValue("groupNumber", policy.groupNumber || "");
      form.setValue("patientRelationship", policy.subscriberRelationship === "self" ? "18" : 
        policy.subscriberRelationship === "spouse" ? "01" : 
        policy.subscriberRelationship === "child" ? "19" : "21");
      
      const matchingPayer = payers?.find(p => 
        p.name.toLowerCase().includes(policy.carrier.name.toLowerCase()) ||
        policy.carrier.name.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matchingPayer) {
        form.setValue("payerIdCode", matchingPayer.payerIdCode);
        form.setValue("payerName", matchingPayer.name);
      }
    }
  };

  const onSubmit = (values: EligibilityFormValues) => {
    checkEligibilityMutation.mutate(values);
  };

  const getCoverageStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
      case "inactive":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>;
      case "simulated":
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Simulated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const groupBenefitsByType = (benefits: EligibilityBenefit[]) => {
    return benefits.reduce((acc, benefit) => {
      const type = benefit.benefitType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(benefit);
      return acc;
    }, {} as Record<string, EligibilityBenefit[]>);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="check" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="check" data-testid="tab-check-eligibility">
              <Search className="w-4 h-4 mr-2" />
              Check Eligibility
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-verification-history">
              <FileText className="w-4 h-4 mr-2" />
              Verification History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="check" className="space-y-4 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserSearch className="w-5 h-5 text-primary" />
                    Patient Eligibility Check
                  </CardTitle>
                  <CardDescription>
                    Select a patient from your records or enter information manually
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Patient Selection
                        </h4>
                        
                        <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                              data-testid="button-select-patient"
                            >
                              {selectedPatient ? (
                                <span>{selectedPatient.firstName} {selectedPatient.lastName}</span>
                              ) : (
                                <span className="text-muted-foreground">Search for a patient...</span>
                              )}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search patients..." data-testid="input-patient-search" />
                              <CommandList>
                                {loadingPatients ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="ml-2 text-sm">Loading patients...</span>
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>No patients found.</CommandEmpty>
                                    <CommandGroup>
                                      {patients?.map((patient) => (
                                        <CommandItem
                                          key={patient.id}
                                          value={`${patient.firstName} ${patient.lastName}`}
                                          onSelect={() => handlePatientSelect(patient)}
                                          data-testid={`patient-option-${patient.id}`}
                                        >
                                          <div className="flex flex-col">
                                            <span>{patient.firstName} {patient.lastName}</span>
                                            <span className="text-xs text-muted-foreground">
                                              DOB: {patient.dateOfBirth}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {selectedPatient && patientPolicies && patientPolicies.length > 0 && (
                          <FormField
                            control={form.control}
                            name="policyId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Insurance Policy</FormLabel>
                                <Select onValueChange={(value) => {
                                  field.onChange(value);
                                  handlePolicySelect(value);
                                }} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-patient-policy">
                                      <SelectValue placeholder="Select insurance policy" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {patientPolicies.map((policy) => (
                                      <SelectItem key={policy.id} value={policy.id}>
                                        {policy.carrier.name} - {policy.policyNumber}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Provider Information</h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="providerType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provider Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-provider-type">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1">Individual</SelectItem>
                                    <SelectItem value="2">Organization</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="providerNpi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provider NPI</FormLabel>
                                <FormControl>
                                  <Input placeholder="1234567890" {...field} data-testid="input-provider-npi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch("providerType") === "1" ? (
                            <>
                              <FormField
                                control={form.control}
                                name="providerFirstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Provider First Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="John" {...field} data-testid="input-provider-first" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="providerLastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Provider Last Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Smith" {...field} data-testid="input-provider-last" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          ) : (
                            <FormField
                              control={form.control}
                              name="providerOrgName"
                              render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                  <FormLabel>Organization Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your Dental Practice" {...field} data-testid="input-provider-org" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField
                            control={form.control}
                            name="providerTaxId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tax ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="123456789" {...field} data-testid="input-provider-tax" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Insurance Payer</h4>
                        <FormField
                          control={form.control}
                          name="payerIdCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payer</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const payer = payers?.find(p => p.payerIdCode === value);
                                  if (payer) {
                                    form.setValue("payerName", payer.name);
                                  }
                                }} 
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-payer">
                                    <SelectValue placeholder="Select insurance payer" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {loadingPayers ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span className="ml-2 text-sm">Loading payers...</span>
                                    </div>
                                  ) : (
                                    payers?.map((payer) => (
                                      <SelectItem key={payer.payerIdCode} value={payer.payerIdCode} data-testid={`payer-option-${payer.payerIdCode}`}>
                                        {payer.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Patient Information</h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="patientFirstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Jane" {...field} data-testid="input-patient-first" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="patientLastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" {...field} data-testid="input-patient-last" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="patientDob"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-patient-dob" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="patientMemberId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Member ID / Policy Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="123456789" {...field} data-testid="input-patient-member" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="patientRelationship"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship to Subscriber</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-relationship">
                                      <SelectValue placeholder="Select relationship" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="18">Self</SelectItem>
                                    <SelectItem value="01">Spouse</SelectItem>
                                    <SelectItem value="19">Child</SelectItem>
                                    <SelectItem value="21">Unknown</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="groupNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Group Number (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="GRP123" {...field} data-testid="input-group-number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={checkEligibilityMutation.isPending}
                        data-testid="button-check-eligibility"
                      >
                        {checkEligibilityMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking Eligibility...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Verify Insurance Eligibility
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {verificationDetails && (
                <Card data-testid="card-verification-details">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <span data-testid="text-patient-name">
                          {verificationDetails.verification.patientFirstName} {verificationDetails.verification.patientLastName}
                        </span>
                      </CardTitle>
                      <span data-testid="badge-coverage-status">
                        {getCoverageStatusBadge(verificationDetails.verification.coverageStatus)}
                      </span>
                    </div>
                    <CardDescription data-testid="text-payer-info">
                      {verificationDetails.verification.payerName}
                      {verificationDetails.verification.groupNumber && (
                        <span className="ml-2">| Group: {verificationDetails.verification.groupNumber}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {verificationDetails.verification.planCoverageDescription && (
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        {verificationDetails.verification.planCoverageDescription}
                      </div>
                    )}

                    {verificationDetails.verification.effectiveDateFrom && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Effective: {verificationDetails.verification.effectiveDateFrom}</span>
                        {verificationDetails.verification.effectiveDateTo && (
                          <span>to {verificationDetails.verification.effectiveDateTo}</span>
                        )}
                      </div>
                    )}

                    {verificationDetails.benefits.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium" data-testid="text-benefits-title">Benefits Breakdown</h4>
                        
                        {Object.entries(groupBenefitsByType(verificationDetails.benefits)).map(([type, benefits]) => (
                          <div key={type} className="space-y-2" data-testid={`section-benefit-${type}`}>
                            <h5 className="text-sm font-medium capitalize text-muted-foreground">
                              {type === "coInsurance" ? "Co-Insurance" : type}
                            </h5>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Service</TableHead>
                                  <TableHead>Network</TableHead>
                                  <TableHead className="text-right">
                                    {type === "coInsurance" ? "Patient %" : "Amount"}
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {benefits.slice(0, 5).map((benefit) => (
                                  <TableRow key={benefit.id} data-testid={`row-benefit-${benefit.id}`}>
                                    <TableCell className="font-medium">
                                      {benefit.procedureCode || benefit.serviceType || "General"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={benefit.network === "In-Network" ? "default" : "outline"} className="text-xs">
                                        {benefit.network}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {benefit.percent ? (
                                        <span className="flex items-center justify-end gap-1">
                                          <Percent className="w-3 h-3" />
                                          {benefit.percent}
                                        </span>
                                      ) : benefit.amount ? (
                                        <span className="flex items-center justify-end gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          {benefit.amount}
                                          {benefit.remaining && (
                                            <span className="text-muted-foreground">
                                              (${benefit.remaining} left)
                                            </span>
                                          )}
                                        </span>
                                      ) : "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    )}

                    {verificationDetails.verification.responseMessages && 
                     verificationDetails.verification.responseMessages.length > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                        <h5 className="font-medium mb-1">Messages</h5>
                        {verificationDetails.verification.responseMessages.map((msg, i) => (
                          <p key={i} className="text-muted-foreground">{msg}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Eligibility Verifications</CardTitle>
                <CardDescription>
                  View history of eligibility checks performed for your patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVerifications ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : recentVerifications && recentVerifications.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Payer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentVerifications.map((v) => (
                        <TableRow key={v.id} data-testid={`row-verification-${v.id}`}>
                          <TableCell className="font-medium">
                            {v.patientFirstName} {v.patientLastName}
                          </TableCell>
                          <TableCell>{v.payerName}</TableCell>
                          <TableCell>{getCoverageStatusBadge(v.coverageStatus)}</TableCell>
                          <TableCell>{format(new Date(v.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedVerification(v.id)}
                              data-testid={`button-view-${v.id}`}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No eligibility verifications yet</p>
                    <p className="text-sm">Check patient eligibility to see results here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedVerification && verificationDetails && (
              <Card className="mt-6" data-testid="verification-details">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <span data-testid="patient-name">
                        {verificationDetails.verification.patientFirstName} {verificationDetails.verification.patientLastName}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span data-testid="coverage-status">
                        {getCoverageStatusBadge(verificationDetails.verification.coverageStatus)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedVerification(null)}
                        data-testid="button-close-details"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                  <CardDescription data-testid="payer-info">
                    {verificationDetails.verification.payerName}
                    {verificationDetails.verification.groupNumber && (
                      <span className="ml-2">| Group: {verificationDetails.verification.groupNumber}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verificationDetails.verification.planCoverageDescription && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      {verificationDetails.verification.planCoverageDescription}
                    </div>
                  )}

                  {verificationDetails.verification.effectiveDateFrom && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Effective: {verificationDetails.verification.effectiveDateFrom}</span>
                      {verificationDetails.verification.effectiveDateTo && (
                        <span>to {verificationDetails.verification.effectiveDateTo}</span>
                      )}
                    </div>
                  )}

                  {verificationDetails.benefits.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium" data-testid="benefits-breakdown-title">Benefits Breakdown</h4>
                      
                      {Object.entries(groupBenefitsByType(verificationDetails.benefits)).map(([type, benefits]) => (
                        <div key={type} className="space-y-2" data-testid={`history-benefit-section-${type}`}>
                          <h5 className="text-sm font-medium capitalize text-muted-foreground">
                            {type === "coInsurance" ? "Co-Insurance" : type}
                          </h5>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead>Network</TableHead>
                                <TableHead className="text-right">
                                  {type === "coInsurance" ? "Patient %" : "Amount"}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {benefits.slice(0, 5).map((benefit, idx) => (
                                <TableRow key={benefit.id} data-testid={`history-benefit-row-${idx}`}>
                                  <TableCell className="font-medium">
                                    {benefit.procedureCode || benefit.serviceType || "General"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={benefit.network === "In-Network" ? "default" : "outline"} className="text-xs">
                                      {benefit.network}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {benefit.percent ? (
                                      <span className="flex items-center justify-end gap-1">
                                        <Percent className="w-3 h-3" />
                                        {benefit.percent}
                                      </span>
                                    ) : benefit.amount ? (
                                      <span className="flex items-center justify-end gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {benefit.amount}
                                        {benefit.remaining && (
                                          <span className="text-muted-foreground">
                                            (${benefit.remaining} left)
                                          </span>
                                        )}
                                      </span>
                                    ) : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  )}

                  {verificationDetails.verification.responseMessages && 
                   verificationDetails.verification.responseMessages.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                      <h5 className="font-medium mb-1">Messages</h5>
                      {verificationDetails.verification.responseMessages.map((msg, i) => (
                        <p key={i} className="text-muted-foreground">{msg}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}

export default function EligibilityPage() {
  const { currentPersona } = usePersona();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!ALLOWED_PERSONAS.includes(currentPersona)) {
      navigate("/app/patients");
    }
  }, [currentPersona, navigate]);

  if (!ALLOWED_PERSONAS.includes(currentPersona)) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-eligibility-title">
              Insurance Eligibility Verification
            </h1>
            <p className="text-sm text-muted-foreground">
              Verify patient insurance coverage and benefits in real-time
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <EligibilityTabContent />
      </div>
    </div>
  );
}
