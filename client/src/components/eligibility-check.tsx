import { useState } from "react";
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
  Building2,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const eligibilityFormSchema = z.object({
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
});

type EligibilityFormValues = z.infer<typeof eligibilityFormSchema>;

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
}

export function EligibilityCheck() {
  const { toast } = useToast();
  const [selectedVerification, setSelectedVerification] = useState<string | null>(null);

  const { data: payers } = useQuery<Payer[]>({
    queryKey: ["/api/eligibility/payers"],
  });

  const { data: recentVerifications } = useQuery<EligibilityVerification[]>({
    queryKey: ["/api/eligibility/verifications"],
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
      providerType: "1",
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

  const checkEligibilityMutation = useMutation({
    mutationFn: async (values: EligibilityFormValues) => {
      const payload = {
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
          description: "DentalXchange credentials not configured. Showing simulated data.",
        });
      } else {
        toast({
          title: "Eligibility Checked",
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
    <div className="space-y-6">
      <Tabs defaultValue="check" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check" data-testid="tab-eligibility-check">
            <Search className="w-4 h-4 mr-2" />
            Check Eligibility
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-eligibility-history">
            <FileText className="w-4 h-4 mr-2" />
            Recent Verifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="check" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  DentalXchange Eligibility Check
                </CardTitle>
                <CardDescription>
                  Verify patient insurance coverage and benefits in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                <Input placeholder="Sunshine Dental Care" {...field} data-testid="input-provider-org" />
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
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-payer">
                                  <SelectValue placeholder="Select insurance payer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {payers?.map((payer) => (
                                  <SelectItem key={payer.payerIdCode} value={payer.payerIdCode}>
                                    {payer.name}
                                  </SelectItem>
                                ))}
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
                              <FormLabel>Member ID</FormLabel>
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
                              <FormLabel>Relationship</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          Checking...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Check Eligibility
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {verificationDetails && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {verificationDetails.verification.patientFirstName} {verificationDetails.verification.patientLastName}
                    </CardTitle>
                    {getCoverageStatusBadge(verificationDetails.verification.coverageStatus)}
                  </div>
                  <CardDescription>
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
                      <h4 className="font-medium">Benefits Breakdown</h4>
                      
                      {Object.entries(groupBenefitsByType(verificationDetails.benefits)).map(([type, benefits]) => (
                        <div key={type} className="space-y-2">
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
                                <TableRow key={benefit.id}>
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

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Eligibility Verifications</CardTitle>
              <CardDescription>
                View history of eligibility checks performed through DentalXchange
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentVerifications && recentVerifications.length > 0 ? (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
