import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Star,
  CheckCircle,
  Award,
  Clock,
  Users,
  Lightbulb,
  Heart,
  ChevronLeft,
  Mail,
  Phone,
  GraduationCap,
  BadgeCheck,
  Briefcase,
  Wrench,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  CalendarClock,
  FileText,
  Plus,
  UserPlus,
  Settings,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  BookOpen,
  Building2,
  Edit,
  Trash2,
  AlertCircle,
  Upload,
  ExternalLink,
  MessageCircle,
  X,
  ClipboardCheck,
  ShieldAlert,
  ShieldOff,
  Loader2,
  CheckCircle2,
  XCircle,
  FileCheck,
  CreditCard,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { ObjectUploader } from "@/components/ObjectUploader";
import {
  type ProfessionalWithBadges,
  type ProfessionalWithCredentials,
  type ProfessionalPreferences,
  type ProfessionalCertification,
  type ProfessionalSkill,
  type ProfessionalExperience,
  type ProfessionalEducation,
  type ProfessionalAward,
  type ProfessionalTraining,
  type StaffShift,
  type ShiftTransactionWithDetails,
  type PracticeInvitation,
  type Professional,
  StaffRoles,
  DentalSpecialties,
  OnboardingStatus,
} from "@shared/schema";
import { PageHeader } from "@/components/page-header";
import { usePersona } from "@/lib/persona-context";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const badgeIcons: Record<string, React.ReactNode> = {
  perfect_attendance: <Award className="h-5 w-5" />,
  shifts_completed: <CheckCircle className="h-5 w-5" />,
  timeliness: <Clock className="h-5 w-5" />,
  knowledge: <Lightbulb className="h-5 w-5" />,
  teamwork: <Heart className="h-5 w-5" />,
};

const badgeLabels: Record<string, string> = {
  perfect_attendance: "Perfect Attendance",
  shifts_completed: "Shifts Completed",
  timeliness: "Timeliness",
  knowledge: "Knowledge",
  teamwork: "Teamwork",
};

const badgeColors: Record<string, string> = {
  bronze: "bg-amber-600",
  silver: "bg-slate-400",
  gold: "bg-yellow-500",
};

const onboardingStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  invited: { 
    label: "Invited", 
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: <Mail className="h-3 w-3" />
  },
  in_progress: { 
    label: "In Progress", 
    color: "text-amber-600 dark:text-amber-400", 
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    icon: <Loader2 className="h-3 w-3" />
  },
  under_review: { 
    label: "Under Review", 
    color: "text-purple-600 dark:text-purple-400", 
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    icon: <ClipboardCheck className="h-3 w-3" />
  },
  verified: { 
    label: "Verified", 
    color: "text-green-600 dark:text-green-400", 
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  rejected: { 
    label: "Rejected", 
    color: "text-red-600 dark:text-red-400", 
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: <XCircle className="h-3 w-3" />
  },
  payment_eligible: { 
    label: "Payment Eligible", 
    color: "text-emerald-600 dark:text-emerald-400", 
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: <CreditCard className="h-3 w-3" />
  },
  suspended: { 
    label: "Suspended", 
    color: "text-gray-600 dark:text-gray-400", 
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    icon: <ShieldOff className="h-3 w-3" />
  },
};

const roleColors: Record<string, string> = {
  Dentist: "bg-blue-500",
  Hygienist: "bg-teal-500",
  "Dental Assistant": "bg-purple-500",
  "Office Coordinator": "bg-orange-500",
  "Front Desk": "bg-pink-500",
  "Billing Staff": "bg-indigo-500",
};

const inviteProfessionalSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Valid email is required"),
  role: z.string().min(1, "Role is required"),
  message: z.string().optional(),
});

type InviteProfessionalFormData = z.infer<typeof inviteProfessionalSchema>;

function VerificationStatusBadge({ 
  status, 
  onClick,
  showLabel = true,
}: { 
  status: string; 
  onClick?: (e: React.MouseEvent) => void;
  showLabel?: boolean;
}) {
  const config = onboardingStatusConfig[status] || onboardingStatusConfig.in_progress;
  
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} hover:opacity-80 transition-opacity`}
      title={`Verification Status: ${config.label}`}
      data-testid="badge-verification-status"
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </button>
  );
}

interface ContractorDocument {
  id: string;
  type: string;
  name: string;
  uploadedAt: string;
  status: string;
  url?: string;
}

interface ContractorTaxForm {
  id: string;
  formType: string;
  taxId: string;
  businessType: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
}

interface ContractorAgreement {
  id: string;
  type: string;
  signedAt: string;
  ipAddress: string;
}

interface ContractorPaymentMethod {
  id: string;
  type: string;
  status: string;
  lastFour?: string;
}

interface ContractorVerificationData {
  professional: ProfessionalWithBadges;
  documents: ContractorDocument[];
  taxForms: ContractorTaxForm[];
  agreements: ContractorAgreement[];
  paymentMethods: ContractorPaymentMethod[];
}

function VerificationModal({
  open,
  onOpenChange,
  professionalId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
}) {
  const { toast } = useToast();
  const { currentPersona } = usePersona();
  const isAdmin = currentPersona === "admin" || currentPersona === "system_admin";

  const { data: verificationData, isLoading } = useQuery<ContractorVerificationData>({
    queryKey: ["/api/contractors", professionalId, "verification"],
    enabled: open && !!professionalId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: string; reason?: string }) => {
      const response = await apiRequest("PATCH", `/api/contractors/${professionalId}/status`, { status, reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors", professionalId, "verification"] });
      queryClient.invalidateQueries({ queryKey: ["/api/professionals"] });
      toast({ title: "Status Updated", description: "Contractor verification status has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const approveW9Mutation = useMutation({
    mutationFn: async (taxFormId: string) => {
      const response = await apiRequest("PATCH", `/api/contractors/${professionalId}/tax-forms/${taxFormId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors", professionalId, "verification"] });
      toast({ title: "W-9 Approved", description: "Tax form has been approved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const approveIdentityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/contractors/${professionalId}/identity/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors", professionalId, "verification"] });
      toast({ title: "Identity Verified", description: "Identity has been verified." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const professional = verificationData?.professional;
  const documents = verificationData?.documents || [];
  const taxForms = verificationData?.taxForms || [];
  const agreements = verificationData?.agreements || [];
  const paymentMethods = verificationData?.paymentMethods || [];

  const statusConfig = professional?.onboardingStatus 
    ? onboardingStatusConfig[professional.onboardingStatus] 
    : onboardingStatusConfig.in_progress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Contractor Verification
          </DialogTitle>
          <DialogDescription>
            Review and manage contractor onboarding and verification status
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : professional ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={professional.photoUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {professional.firstName[0]}{professional.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{professional.firstName} {professional.lastName}</h3>
                <p className="text-sm text-muted-foreground">{professional.role}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="checklist" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="checklist" data-testid="tab-checklist">Checklist</TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                <TabsTrigger value="w9" data-testid="tab-w9">W-9</TabsTrigger>
                <TabsTrigger value="payment" data-testid="tab-payment">Payment</TabsTrigger>
              </TabsList>

              <TabsContent value="checklist" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${professional.identityVerified ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      {professional.identityVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="font-medium">Identity Verification</span>
                    </div>
                    {isAdmin && !professional.identityVerified && documents.some(d => d.type === 'identity') && (
                      <Button 
                        size="sm" 
                        onClick={() => approveIdentityMutation.mutate()}
                        disabled={approveIdentityMutation.isPending}
                        data-testid="button-approve-identity"
                      >
                        Approve
                      </Button>
                    )}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border ${professional.w9Completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      {professional.w9Completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="font-medium">W-9 Tax Form</span>
                    </div>
                    {professional.w9Completed && <Badge variant="secondary">Approved</Badge>}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border ${professional.agreementsSigned ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      {professional.agreementsSigned ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="font-medium">Agreements Signed</span>
                    </div>
                    {agreements.length > 0 && (
                      <Badge variant="secondary">{agreements.length} signed</Badge>
                    )}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border ${professional.paymentMethodVerified ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      {professional.paymentMethodVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="font-medium">Payment Method</span>
                    </div>
                    {professional.paymentMethodVerified && <Badge variant="secondary">Verified</Badge>}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border ${professional.paymentEligible ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      {professional.paymentEligible ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="font-medium">Payment Eligible</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-4 border-t space-y-3">
                    <h4 className="font-medium text-sm">Admin Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {professional.onboardingStatus === "under_review" && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => updateStatusMutation.mutate({ status: "verified" })}
                            disabled={updateStatusMutation.isPending}
                            data-testid="button-verify-contractor"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Verify Contractor
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateStatusMutation.mutate({ status: "rejected", reason: "Did not meet requirements" })}
                            disabled={updateStatusMutation.isPending}
                            data-testid="button-reject-contractor"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {professional.onboardingStatus === "verified" && !professional.paymentEligible && (
                        <Button 
                          size="sm" 
                          onClick={() => updateStatusMutation.mutate({ status: "payment_eligible" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid="button-enable-payments"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Enable Payments
                        </Button>
                      )}
                      {professional.onboardingStatus !== "suspended" && professional.onboardingStatus !== "rejected" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ status: "suspended", reason: "Admin action" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid="button-suspend-contractor"
                        >
                          <ShieldOff className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      )}
                      {(professional.onboardingStatus === "suspended" || professional.onboardingStatus === "rejected") && (
                        <Button 
                          size="sm" 
                          onClick={() => updateStatusMutation.mutate({ status: "under_review" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid="button-reinstate-contractor"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Reinstate for Review
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <FileCheck className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.type} - {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="w9" className="mt-4">
                {taxForms.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No W-9 submitted yet</p>
                ) : (
                  <div className="space-y-3">
                    {taxForms.map((form) => (
                      <div key={form.id} className="p-4 rounded-lg border space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{form.formType}</h4>
                          <Badge variant={form.status === 'approved' ? 'default' : 'secondary'}>
                            {form.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tax ID:</span>
                            <span className="ml-2">***-**-{form.taxId}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Business Type:</span>
                            <span className="ml-2">{form.businessType}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Submitted:</span>
                            <span className="ml-2">{new Date(form.submittedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {isAdmin && form.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => approveW9Mutation.mutate(form.id)}
                            disabled={approveW9Mutation.isPending}
                            data-testid="button-approve-w9"
                          >
                            Approve W-9
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payment" className="mt-4">
                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No payment method set up yet</p>
                ) : (
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{method.type}</p>
                            {method.lastFour && (
                              <p className="text-xs text-muted-foreground">****{method.lastFour}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={method.status === 'verified' ? 'default' : 'secondary'}>
                          {method.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Unable to load verification data</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InviteProfessionalDialog({ 
  open, 
  onOpenChange, 
  practiceId 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  practiceId: string | null;
}) {
  const { toast } = useToast();

  const form = useForm<InviteProfessionalFormData>({
    resolver: zodResolver(inviteProfessionalSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      message: "",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteProfessionalFormData) => {
      if (!practiceId) throw new Error("Practice ID is required");
      const response = await apiRequest("POST", `/api/practices/${practiceId}/invitations`, data);
      return response.json();
    },
    onSuccess: (data: { emailSent?: boolean; invitationLink?: string; message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId, "invitations"] });
      toast({
        title: data.emailSent ? "Invitation Email Sent" : "Invitation Created",
        description: data.emailSent 
          ? `An invitation email has been sent to ${form.getValues("email")}.`
          : `Invitation created for ${form.getValues("email")}. Share the invitation link manually if needed.`,
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteProfessionalFormData) => {
    inviteMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Professional</DialogTitle>
          <DialogDescription>
            Send an email invitation to a dental professional. They'll receive a link to join your practice network.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="professional@example.com" {...field} data-testid="input-invite-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} data-testid="input-invite-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} data-testid="input-invite-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-invite-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(StaffRoles).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="We'd love to have you join our team..."
                      className="resize-none"
                      {...field} 
                      data-testid="input-invite-message" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-invite">
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending || !practiceId} data-testid="button-send-invitation">
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const editProfessionalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  specialty: z.string().optional(),
  education: z.string().optional(),
  graduationDate: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseYearIssued: z.string().optional(),
  experienceRange: z.string().optional(),
  bio: z.string().optional(),
});

type EditProfessionalFormData = z.infer<typeof editProfessionalSchema>;

function EditProfessionalDialog({
  open,
  onOpenChange,
  professional,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: ProfessionalWithBadges;
}) {
  const { toast } = useToast();

  const form = useForm<EditProfessionalFormData>({
    resolver: zodResolver(editProfessionalSchema),
    defaultValues: {
      firstName: professional.firstName || "",
      lastName: professional.lastName || "",
      email: professional.email || "",
      phone: professional.phone || "",
      role: professional.role || "",
      specialty: professional.specialty || "",
      education: professional.education || "",
      graduationDate: professional.graduationDate || "",
      licenseNumber: professional.licenseNumber || "",
      licenseState: professional.licenseState || "",
      licenseYearIssued: professional.licenseYearIssued || "",
      experienceRange: professional.experienceRange || "",
      bio: professional.bio || "",
    },
  });

  const updateProfessionalMutation = useMutation({
    mutationFn: async (data: EditProfessionalFormData) => {
      const response = await apiRequest("PATCH", `/api/professionals/${professional.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professional.id] });
      toast({
        title: "Professional Updated",
        description: "The professional information has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update professional",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditProfessionalFormData) => {
    updateProfessionalMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Professional Information</DialogTitle>
          <DialogDescription>
            Update the professional's profile information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} data-testid="input-edit-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-edit-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(StaffRoles).map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-specialty">
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(DentalSpecialties).map((specialty) => (
                          <SelectItem key={specialty} value={specialty}>
                            {specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education</FormLabel>
                  <FormControl>
                    <Input placeholder="School name" {...field} data-testid="input-edit-education" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="graduationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Graduation Date</FormLabel>
                    <FormControl>
                      <Input placeholder="MM/DD/YYYY" {...field} data-testid="input-edit-graduation-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experienceRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-experience">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                        <SelectItem value="1-3 Years">1-3 Years</SelectItem>
                        <SelectItem value="3-5 Years">3-5 Years</SelectItem>
                        <SelectItem value="5-10 Years">5-10 Years</SelectItem>
                        <SelectItem value="10+ Years">10+ Years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-edit-license-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="licenseState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License State</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CA" {...field} data-testid="input-edit-license-state" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseYearIssued"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Issued</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2020" {...field} data-testid="input-edit-license-year" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-edit-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={updateProfessionalMutation.isPending} data-testid="button-edit-professional-submit">
                {updateProfessionalMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ProfessionalProfileDisplay({
  professional,
  canEdit,
  showBackButton = false,
  onEditClick,
}: {
  professional: ProfessionalWithBadges;
  canEdit: boolean;
  showBackButton?: boolean;
  onEditClick?: () => void;
}) {
  const initials = `${professional.firstName[0]}${professional.lastName[0]}`;
  const rating = parseFloat(professional.rating || "0");

  return (
    <div className="space-y-6">
      {showBackButton && (
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/professionals" data-testid="button-back-to-professionals">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Professionals
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={professional.photoUrl || undefined} alt={`${professional.firstName} ${professional.lastName}`} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">
                    {professional.firstName} {professional.lastName}
                  </h2>
                  {rating > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-5 w-5 fill-yellow-400" />
                      <span className="font-semibold">{rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {professional.credentialsVerified && (
                  <div className="flex items-center gap-1 text-primary text-sm mb-2">
                    <BadgeCheck className="h-4 w-4" />
                    <span>Credentials Verified</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {professional.email && (
                    <Badge variant="outline" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      {professional.email}
                    </Badge>
                  )}
                  {professional.phone && (
                    <Badge variant="outline" className="text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      {professional.phone}
                    </Badge>
                  )}
                </div>
                {canEdit && onEditClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={onEditClick}
                    data-testid="button-edit-professional"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              {professional.education && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    Education
                  </h4>
                  <p className="text-sm text-muted-foreground">{professional.education}</p>
                  {professional.graduationDate && (
                    <p className="text-xs text-muted-foreground">Graduation Date: {professional.graduationDate}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Profession
                </h4>
                <p className="text-sm text-muted-foreground">{professional.role}</p>
              </div>

              {professional.licenseNumber && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    License Information
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>License #: {professional.licenseNumber}</p>
                    {professional.licenseState && <p>Issued by State of: {professional.licenseState}</p>}
                    {professional.licenseYearIssued && <p>Year Issued: {professional.licenseYearIssued}</p>}
                  </div>
                </div>
              )}

              {professional.experienceRange && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Years of Experience</h4>
                  <p className="text-sm text-muted-foreground">{professional.experienceRange}</p>
                </div>
              )}

              {professional.software && professional.software.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Software</h4>
                  <div className="flex flex-wrap gap-1">
                    {professional.software.map((sw) => (
                      <Badge key={sw} variant="secondary" className="text-xs">
                        {sw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {professional.specialty && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    Specialty
                  </h4>
                  <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                  {professional.specialties && professional.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {professional.specialties.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {professional.badges && professional.badges.length > 0 ? (
                <div className="grid grid-cols-5 gap-4">
                  {professional.badges.map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center text-center">
                      <div
                        className={`flex items-center justify-center h-14 w-14 rounded-full ${badgeColors[badge.level] || "bg-muted"} mb-2`}
                      >
                        <span className="text-white">
                          {badgeIcons[badge.badgeType]}
                        </span>
                      </div>
                      <span className="text-xs font-medium">
                        {badgeLabels[badge.badgeType] || badge.badgeType}
                      </span>
                      {badge.count && badge.count > 0 && (
                        <span className="text-xs text-muted-foreground">{badge.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No badges earned yet
                </p>
              )}
              {professional.badges && professional.badges.some(b => b.level === "gold") && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
                  <p className="text-sm">
                    <span className="font-semibold text-yellow-700 dark:text-yellow-400">Gold:</span>{" "}
                    <span className="text-muted-foreground">
                      Perfect Attendance. This professional has shown unwavering commitment and never cancelled a shift late!
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {professional.procedures && professional.procedures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Experienced Procedures</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {professional.procedures.map((procedure) => (
                    <li key={procedure} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {procedure}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: string | number | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num === null || num === undefined || isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function MyShiftsView({ professionalId }: { professionalId: string }) {
  const { data: shifts, isLoading } = useQuery<StaffShift[]>({
    queryKey: [`/api/professionals/${professionalId}/shifts`],
  });

  const today = new Date().toISOString().split("T")[0];
  const upcomingShifts = shifts?.filter((s) => s.date >= today && s.status !== "completed" && s.status !== "cancelled") || [];
  const pastShifts = shifts?.filter((s) => s.date < today || s.status === "completed") || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Upcoming Shifts
        </h3>
        {upcomingShifts.length > 0 ? (
          <div className="space-y-3">
            {upcomingShifts.map((shift) => (
              <Card key={shift.id} data-testid={`card-shift-upcoming-${shift.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={`${roleColors[shift.role] || "bg-muted"} text-white`}
                        >
                          {shift.role}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {shift.status}
                        </Badge>
                      </div>
                      <p className="font-medium">{formatDate(shift.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {shift.arrivalTime} - {shift.endTime}
                      </p>
                      {shift.specialties && shift.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {shift.specialties.map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(shift.fixedHourlyRate || shift.minHourlyRate)}/hr
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shift.pricingMode === "fixed" ? "Fixed rate" : "Smart pricing"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No upcoming shifts scheduled</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Completed Shifts
        </h3>
        {pastShifts.length > 0 ? (
          <div className="space-y-3">
            {pastShifts.slice(0, 10).map((shift) => (
              <Card key={shift.id} data-testid={`card-shift-completed-${shift.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className="capitalize"
                        >
                          {shift.role}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Completed
                        </Badge>
                      </div>
                      <p className="font-medium">{formatDate(shift.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {shift.arrivalTime} - {shift.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(shift.fixedHourlyRate || shift.minHourlyRate)}/hr
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No completed shifts yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MyEarningsView({ professionalId }: { professionalId: string }) {
  const { data: transactions, isLoading } = useQuery<ShiftTransactionWithDetails[]>({
    queryKey: [`/api/professionals/${professionalId}/transactions`],
  });

  const totalEarnings = transactions?.reduce((sum, tx) => sum + parseFloat(tx.regularPay || "0"), 0) || 0;
  const totalFees = transactions?.reduce((sum, tx) => sum + parseFloat(tx.serviceFee || "0") + parseFloat(tx.convenienceFee || "0"), 0) || 0;
  const pendingAmount = transactions?.filter((tx) => tx.status === "pending").reduce((sum, tx) => sum + parseFloat(tx.regularPay || "0"), 0) || 0;
  const completedShifts = transactions?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card data-testid="card-total-earnings">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-pending-payments">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-shifts-completed">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shifts Completed</p>
                <p className="text-xl font-bold">{completedShifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between gap-4 p-4 border rounded-md"
                  data-testid={`row-transaction-${tx.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{formatDate(tx.chargeDate)}</p>
                      <Badge
                        variant={tx.status === "charged" ? "default" : "secondary"}
                        className={tx.status === "charged" ? "bg-green-600" : ""}
                      >
                        {tx.status === "charged" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tx.shift?.role} - {tx.hoursWorked} hours @ {formatCurrency(tx.hourlyRate)}/hr
                    </p>
                    {tx.adjustmentMade && tx.adjustmentAmount && (
                      <p className="text-sm text-orange-600">
                        Adjustment: {formatCurrency(tx.adjustmentAmount)} - {tx.adjustmentReason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(tx.regularPay)}</p>
                    <p className="text-xs text-muted-foreground">
                      Fees: {formatCurrency(parseFloat(tx.serviceFee || "0") + parseFloat(tx.convenienceFee || "0"))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No payment history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfessionalPortalView() {
  const [activeTab, setActiveTab] = useState("profile");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { data: professionals, isLoading } = useQuery<ProfessionalWithBadges[]>({
    queryKey: ["/api/professionals"],
  });

  // In a real application, this would be determined by the authenticated user's profile
  // For demo purposes, we use the first professional in the list
  const currentProfessional = professionals?.[0];

  if (isLoading) {
    return (
      <div className="container max-w-5xl py-6 space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!currentProfessional) {
    return (
      <div className="container max-w-5xl py-6">
        <PageHeader
          title="My Portal"
          description="View your shifts and earnings"
        />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Profile Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Your professional profile has not been set up yet. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <Users className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="shifts" data-testid="tab-shift-history">
            <Calendar className="h-4 w-4 mr-2" />
            Shifts
          </TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-payment-transactions">
            <DollarSign className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="credentials" data-testid="tab-credentials">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Credentials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfessionalProfileDisplay
            professional={currentProfessional}
            canEdit={true}
            showBackButton={false}
            onEditClick={() => setEditDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="shifts" className="mt-6">
          <MyShiftsView professionalId={currentProfessional.id} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <MyEarningsView professionalId={currentProfessional.id} />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <MyPreferencesView professionalId={currentProfessional.id} />
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <MyCredentialsView professionalId={currentProfessional.id} />
        </TabsContent>
      </Tabs>

      <EditProfessionalDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        professional={currentProfessional}
      />
    </div>
  );
}

function MyPreferencesView({ professionalId }: { professionalId: string }) {
  const { toast } = useToast();

  const { data: preferences, isLoading } = useQuery<ProfessionalPreferences | null>({
    queryKey: ["/api/professionals", professionalId, "preferences"],
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<ProfessionalPreferences>) => {
      const response = await apiRequest("PUT", `/api/professionals/${professionalId}/preferences`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalId, "preferences"] });
      toast({
        title: "Preferences Updated",
        description: "Your shift preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const [editingPreferences, setEditingPreferences] = useState(false);
  const [formData, setFormData] = useState({
    preferredDays: [] as string[],
    preferredTimeStart: "",
    preferredTimeEnd: "",
    minHourlyRate: "",
    maxHourlyRate: "",
    maxDistanceMiles: "",
    acceptLastMinuteShifts: false,
    acceptOvertimeShifts: false,
  });

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate({
      preferredDays: formData.preferredDays.length > 0 ? formData.preferredDays : null,
      preferredTimeStart: formData.preferredTimeStart || null,
      preferredTimeEnd: formData.preferredTimeEnd || null,
      minHourlyRate: formData.minHourlyRate || null,
      maxHourlyRate: formData.maxHourlyRate || null,
      maxDistanceMiles: formData.maxDistanceMiles ? parseInt(formData.maxDistanceMiles) : null,
      acceptLastMinuteShifts: formData.acceptLastMinuteShifts,
      acceptOvertimeShifts: formData.acceptOvertimeShifts,
    });
    setEditingPreferences(false);
  };

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Shift Preferences</h3>
        {!editingPreferences && (
          <Button variant="outline" size="sm" onClick={() => {
            setFormData({
              preferredDays: preferences?.preferredDays || [],
              preferredTimeStart: preferences?.preferredTimeStart || "",
              preferredTimeEnd: preferences?.preferredTimeEnd || "",
              minHourlyRate: preferences?.minHourlyRate || "",
              maxHourlyRate: preferences?.maxHourlyRate || "",
              maxDistanceMiles: preferences?.maxDistanceMiles?.toString() || "",
              acceptLastMinuteShifts: preferences?.acceptLastMinuteShifts || false,
              acceptOvertimeShifts: preferences?.acceptOvertimeShifts || false,
            });
            setEditingPreferences(true);
          }} data-testid="button-edit-preferences">
            <Edit className="h-4 w-4 mr-2" />
            Edit Preferences
          </Button>
        )}
      </div>

      {editingPreferences ? (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <Label className="text-sm font-medium">Preferred Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <Badge
                    key={day}
                    variant={formData.preferredDays.includes(day) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => {
                      const newDays = formData.preferredDays.includes(day)
                        ? formData.preferredDays.filter((d) => d !== day)
                        : [...formData.preferredDays, day];
                      setFormData({ ...formData, preferredDays: newDays });
                    }}
                    data-testid={`badge-day-${day}`}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="timeStart">Preferred Start Time</Label>
                <Input
                  id="timeStart"
                  type="time"
                  value={formData.preferredTimeStart}
                  onChange={(e) => setFormData({ ...formData, preferredTimeStart: e.target.value })}
                  data-testid="input-preferred-start-time"
                />
              </div>
              <div>
                <Label htmlFor="timeEnd">Preferred End Time</Label>
                <Input
                  id="timeEnd"
                  type="time"
                  value={formData.preferredTimeEnd}
                  onChange={(e) => setFormData({ ...formData, preferredTimeEnd: e.target.value })}
                  data-testid="input-preferred-end-time"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="minRate">Min Hourly Rate ($)</Label>
                <Input
                  id="minRate"
                  type="number"
                  step="0.01"
                  value={formData.minHourlyRate}
                  onChange={(e) => setFormData({ ...formData, minHourlyRate: e.target.value })}
                  placeholder="35.00"
                  data-testid="input-min-hourly-rate"
                />
              </div>
              <div>
                <Label htmlFor="maxRate">Max Hourly Rate ($)</Label>
                <Input
                  id="maxRate"
                  type="number"
                  step="0.01"
                  value={formData.maxHourlyRate}
                  onChange={(e) => setFormData({ ...formData, maxHourlyRate: e.target.value })}
                  placeholder="75.00"
                  data-testid="input-max-hourly-rate"
                />
              </div>
              <div>
                <Label htmlFor="maxDistance">Max Distance (miles)</Label>
                <Input
                  id="maxDistance"
                  type="number"
                  value={formData.maxDistanceMiles}
                  onChange={(e) => setFormData({ ...formData, maxDistanceMiles: e.target.value })}
                  placeholder="25"
                  data-testid="input-max-distance"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptLastMinuteShifts}
                  onChange={(e) => setFormData({ ...formData, acceptLastMinuteShifts: e.target.checked })}
                  className="rounded border-input"
                  data-testid="checkbox-last-minute-shifts"
                />
                <span className="text-sm">Accept last-minute shifts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptOvertimeShifts}
                  onChange={(e) => setFormData({ ...formData, acceptOvertimeShifts: e.target.checked })}
                  className="rounded border-input"
                  data-testid="checkbox-overtime-shifts"
                />
                <span className="text-sm">Accept overtime shifts</span>
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSavePreferences} disabled={updatePreferencesMutation.isPending} data-testid="button-save-preferences">
                {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
              </Button>
              <Button variant="outline" onClick={() => setEditingPreferences(false)} data-testid="button-cancel-preferences">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {!preferences ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">No Preferences Set</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Configure your shift preferences to help match you with suitable opportunities.
                </p>
                <Button onClick={() => setEditingPreferences(true)} data-testid="button-set-preferences">
                  Set Preferences
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {preferences.preferredDays && preferences.preferredDays.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Preferred Days</h4>
                    <div className="flex flex-wrap gap-2">
                      {preferences.preferredDays.map((day) => (
                        <Badge key={day} variant="secondary" className="capitalize">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {(preferences.preferredTimeStart || preferences.preferredTimeEnd) && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Preferred Hours</h4>
                      <p className="text-sm">
                        {preferences.preferredTimeStart || "Any"} - {preferences.preferredTimeEnd || "Any"}
                      </p>
                    </div>
                  )}
                  {(preferences.minHourlyRate || preferences.maxHourlyRate) && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Rate Range</h4>
                      <p className="text-sm">
                        ${preferences.minHourlyRate || "0"} - ${preferences.maxHourlyRate || "∞"}/hr
                      </p>
                    </div>
                  )}
                  {preferences.maxDistanceMiles && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Max Distance</h4>
                      <p className="text-sm">{preferences.maxDistanceMiles} miles</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  {preferences.acceptLastMinuteShifts && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Last-minute shifts OK
                    </Badge>
                  )}
                  {preferences.acceptOvertimeShifts && (
                    <Badge variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Overtime OK
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MyCredentialsView({ professionalId, canEdit = true }: { professionalId: string; canEdit?: boolean }) {
  const { toast } = useToast();
  const [activeCredentialTab, setActiveCredentialTab] = useState("certifications");

  const { data: professionalData, isLoading } = useQuery<ProfessionalWithCredentials>({
    queryKey: ["/api/professionals", professionalId, "full"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { certifications = [], skills = [], experience = [], education = [], awards = [], training = [] } = professionalData || {};

  return (
    <div className="space-y-6">
      <Tabs value={activeCredentialTab} onValueChange={setActiveCredentialTab}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="certifications" className="text-xs sm:text-sm">
            <ShieldCheck className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
            Certifications
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-xs sm:text-sm">
            <Sparkles className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="experience" className="text-xs sm:text-sm">
            <Building2 className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
            Experience
          </TabsTrigger>
          <TabsTrigger value="education" className="text-xs sm:text-sm">
            <GraduationCap className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
            Education
          </TabsTrigger>
          <TabsTrigger value="awards" className="text-xs sm:text-sm">
            <Trophy className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
            Awards
          </TabsTrigger>
          <TabsTrigger value="training" className="text-xs sm:text-sm">
            <BookOpen className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
            Training
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certifications" className="mt-4">
          <CredentialSection
            title="Certifications"
            items={certifications}
            emptyMessage="No certifications added yet"
            renderItem={(cert: ProfessionalCertification) => (
              <CertificationItem key={cert.id} cert={cert} professionalId={professionalId} />
            )}
            professionalId={professionalId}
            credentialType="certifications"
          />
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          <CredentialSection
            title="Skills"
            items={skills}
            emptyMessage="No skills added yet"
            renderItem={(skill: ProfessionalSkill) => (
              <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`skill-${skill.id}`}>
                <div>
                  <h4 className="font-medium">{skill.skillName}</h4>
                  {skill.category && <p className="text-xs text-muted-foreground">{skill.category}</p>}
                </div>
                <Badge variant="outline">{skill.proficiencyLevel}</Badge>
              </div>
            )}
            professionalId={professionalId}
            credentialType="skills"
          />
        </TabsContent>

        <TabsContent value="experience" className="mt-4">
          <CredentialSection
            title="Work Experience"
            items={experience}
            emptyMessage="No work experience added yet"
            renderItem={(exp: ProfessionalExperience) => (
              <div key={exp.id} className="p-4 border rounded-lg" data-testid={`exp-${exp.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{exp.jobTitle}</h4>
                    <p className="text-sm text-muted-foreground">{exp.employer}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                    </p>
                  </div>
                </div>
                {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
              </div>
            )}
            professionalId={professionalId}
            credentialType="experience"
          />
        </TabsContent>

        <TabsContent value="education" className="mt-4">
          <CredentialSection
            title="Education"
            items={education}
            emptyMessage="No education records added yet"
            renderItem={(edu: ProfessionalEducation) => (
              <div key={edu.id} className="p-4 border rounded-lg" data-testid={`edu-${edu.id}`}>
                <h4 className="font-medium">{edu.degree}</h4>
                <p className="text-sm text-muted-foreground">{edu.institution}</p>
                {edu.fieldOfStudy && <p className="text-xs text-muted-foreground">{edu.fieldOfStudy}</p>}
                {edu.graduationDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Graduated: {edu.graduationDate}
                  </p>
                )}
              </div>
            )}
            professionalId={professionalId}
            credentialType="education"
          />
        </TabsContent>

        <TabsContent value="awards" className="mt-4">
          <CredentialSection
            title="Awards & Recognitions"
            items={awards}
            emptyMessage="No awards added yet"
            renderItem={(award: ProfessionalAward) => (
              <div key={award.id} className="flex items-start gap-3 p-4 border rounded-lg" data-testid={`award-${award.id}`}>
                <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">{award.title}</h4>
                  <p className="text-sm text-muted-foreground">{award.issuer}</p>
                  {award.dateReceived && (
                    <p className="text-xs text-muted-foreground">{award.dateReceived}</p>
                  )}
                </div>
              </div>
            )}
            professionalId={professionalId}
            credentialType="awards"
          />
        </TabsContent>

        <TabsContent value="training" className="mt-4">
          <CredentialSection
            title="Continuing Education & Training"
            items={training}
            emptyMessage="No training records added yet"
            renderItem={(t: ProfessionalTraining) => (
              <div key={t.id} className="p-4 border rounded-lg" data-testid={`training-${t.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{t.courseName}</h4>
                    <p className="text-sm text-muted-foreground">{t.provider}</p>
                    {t.completionDate && (
                      <p className="text-xs text-muted-foreground">Completed: {t.completionDate}</p>
                    )}
                  </div>
                  {t.ceCredits && (
                    <Badge variant="secondary">{t.ceCredits} CE Credits</Badge>
                  )}
                </div>
              </div>
            )}
            professionalId={professionalId}
            credentialType="training"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CertificationItem({ cert, professionalId }: { cert: ProfessionalCertification; professionalId: string }) {
  const { toast } = useToast();
  const [pendingObjectPath, setPendingObjectPath] = useState<string | null>(null);

  const handleUploadComplete = async (result: any) => {
    const file = result.successful?.[0];
    if (file && pendingObjectPath) {
      try {
        await apiRequest("PATCH", `/api/credentials/certifications/${cert.id}/document`, {
          documentUrl: pendingObjectPath,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalId, "full"] });
        toast({
          title: "Document Uploaded",
          description: "The certification document has been uploaded successfully.",
        });
        setPendingObjectPath(null);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save document reference",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg" data-testid={`cert-${cert.id}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{cert.name}</h4>
          {cert.verificationStatus === "verified" && (
            <Badge variant="default" className="bg-green-500">Verified</Badge>
          )}
          {cert.verificationStatus === "pending" && (
            <Badge variant="secondary">Pending</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{cert.issuingAuthority}</p>
        {cert.expirationDate && (
          <p className="text-xs text-muted-foreground mt-1">
            Expires: {new Date(cert.expirationDate).toLocaleDateString()}
            {new Date(cert.expirationDate) < new Date() && (
              <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>
            )}
          </p>
        )}
        {cert.documentUrl && (
          <a
            href={cert.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            data-testid={`link-cert-doc-${cert.id}`}
          >
            <FileText className="h-3 w-3" />
            View Document
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <ObjectUploader
        onGetUploadParameters={async (file) => {
          const res = await fetch("/api/uploads/request-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              contentType: file.type,
            }),
          });
          const data = await res.json();
          setPendingObjectPath(data.objectPath);
          return {
            method: "PUT" as const,
            url: data.uploadURL,
            headers: { "Content-Type": file.type },
          };
        }}
        onComplete={handleUploadComplete}
        buttonClassName="text-xs"
      >
        <Upload className="h-3 w-3 mr-1" />
        {cert.documentUrl ? "Replace" : "Upload"}
      </ObjectUploader>
    </div>
  );
}

function CredentialSection<T extends { id: string }>({
  title,
  items,
  emptyMessage,
  renderItem,
  professionalId,
  credentialType,
}: {
  title: string;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
  professionalId: string;
  credentialType: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{emptyMessage}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add credentials from the mobile app
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}

function ProfessionalCard({ professional, isOnline }: { professional: ProfessionalWithBadges; isOnline?: boolean }) {
  const [, navigate] = useLocation();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const { currentPersona } = usePersona();
  const isAdmin = currentPersona === "admin" || currentPersona === "system_admin";
  const initials = `${professional.firstName[0]}${professional.lastName[0]}`;
  const rating = parseFloat(professional.rating || "0");

  const handleMessageClick = (e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/app/messaging?professional=${professional.id}`);
  };

  const handleVerificationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVerificationModalOpen(true);
  };

  const onboardingStatus = professional.onboardingStatus || "in_progress";

  return (
    <>
      <Link href={`/app/professionals/${professional.id}`}>
        <Card className="hover-elevate cursor-pointer" data-testid={`card-professional-${professional.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={professional.photoUrl || undefined} alt={`${professional.firstName} ${professional.lastName}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${
                    isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                  title={isOnline ? "Online" : "Offline"}
                  data-testid={`status-indicator-${professional.id}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {professional.firstName} {professional.lastName}
                    </h3>
                    {professional.credentialsVerified && (
                      <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="shrink-0"
                    onClick={handleMessageClick}
                    title="Send message"
                    data-testid={`button-message-${professional.id}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{professional.role}</p>
                  <span className={`text-xs ${isOnline ? "text-green-600" : "text-muted-foreground"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                    </div>
                  )}
                  {professional.specialty && (
                    <Badge variant="secondary" className="text-xs">
                      {professional.specialty}
                    </Badge>
                  )}
                  {isAdmin && (
                    <VerificationStatusBadge 
                      status={onboardingStatus} 
                      onClick={handleVerificationClick}
                      showLabel={true}
                    />
                  )}
                </div>
              </div>
            </div>
            {professional.badges && professional.badges.length > 0 && (
              <div className="flex gap-2 mt-3 pt-3 border-t">
                {professional.badges.slice(0, 4).map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex items-center justify-center h-8 w-8 rounded-full ${badgeColors[badge.level] || "bg-muted"}`}
                    title={`${badgeLabels[badge.badgeType] || badge.badgeType} (${badge.level})`}
                  >
                    <span className="text-white text-xs">
                      {badgeIcons[badge.badgeType]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
      <VerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
        professionalId={professional.id}
      />
    </>
  );
}

function ProfessionalDetail({ professional }: { professional: ProfessionalWithBadges }) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/professionals" data-testid="button-back-to-professionals">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Professionals
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile" data-testid="admin-tab-profile">
            <Users className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="credentials" data-testid="admin-tab-credentials">
            <Award className="h-4 w-4 mr-2" />
            Credentials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfessionalProfileDisplay
            professional={professional}
            canEdit={false}
            showBackButton={false}
          />
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <MyCredentialsView
            professionalId={professional.id}
            canEdit={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProfessionalsHub() {
  const [, params] = useRoute("/app/professionals/:id");
  const professionalId = params?.id;
  const { currentPersona } = usePersona();
  const { admin, practice } = useAuth();
  const practiceId = practice?.id || admin?.practiceId || null;

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: professionals, isLoading } = useQuery<ProfessionalWithBadges[]>({
    queryKey: ["/api/professionals"],
  });

  // Fetch online status for all professionals - poll every 30 seconds
  const { data: onlineStatus } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/professionals/online-status"],
    refetchInterval: 30000,
  });

  // Fetch pending invitations for the practice
  const { data: invitations } = useQuery<PracticeInvitation[]>({
    queryKey: ["/api/practices", practiceId, "invitations"],
    enabled: !!practiceId,
  });

  // Cancel/delete invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!practiceId) throw new Error("Practice ID is required");
      await apiRequest("DELETE", `/api/practices/${practiceId}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId, "invitations"] });
      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invitation",
        variant: "destructive",
      });
    },
  });

  const { data: selectedProfessional, isLoading: isLoadingDetail } = useQuery<ProfessionalWithBadges>({
    queryKey: ["/api/professionals", professionalId],
    enabled: !!professionalId,
  });

  if (currentPersona === "professional") {
    return <ProfessionalPortalView />;
  }

  if (professionalId) {
    if (isLoadingDetail) {
      return (
        <div className="container max-w-5xl py-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
        </div>
      );
    }

    if (selectedProfessional) {
      return (
        <div className="container max-w-5xl py-6">
          <ProfessionalDetail professional={selectedProfessional} />
        </div>
      );
    }

    return (
      <div className="container max-w-5xl py-6">
        <p className="text-muted-foreground">Professional not found</p>
      </div>
    );
  }

  const filteredProfessionals = professionals?.filter((p) => {
    if (roleFilter !== "all" && p.role !== roleFilter) return false;
    if (specialtyFilter !== "all" && p.specialty !== specialtyFilter && !p.specialties?.includes(specialtyFilter)) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.role.toLowerCase().includes(query) ||
        p.specialty?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Professionals Hub"
          description="View and manage dental professionals in your network"
        />
        <Button onClick={() => setInviteDialogOpen(true)} data-testid="button-invite-professional">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Professional
        </Button>
      </div>

      <InviteProfessionalDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} practiceId={practiceId} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search professionals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-professionals"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-role-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.values(StaffRoles).map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-specialty-filter">
            <SelectValue placeholder="Filter by specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {Object.values(DentalSpecialties).map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pending Invitations Section */}
      {invitations && invitations.filter(i => i.status === "pending").length > 0 && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Pending Invitations ({invitations.filter(i => i.status === "pending").length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {invitations.filter(i => i.status === "pending").map((invitation) => (
                <Badge 
                  key={invitation.id} 
                  variant="outline" 
                  className="py-1.5 px-3 bg-background flex items-center gap-1"
                  data-testid={`badge-pending-invitation-${invitation.id}`}
                >
                  <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="font-medium">{invitation.email}</span>
                  <span className="text-muted-foreground ml-1">({invitation.role})</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelInvitationMutation.mutate(invitation.id);
                    }}
                    disabled={cancelInvitationMutation.isPending}
                    className="ml-1.5 p-0.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    data-testid={`button-cancel-invitation-${invitation.id}`}
                    title="Cancel invitation"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              These professionals have been invited but haven't responded yet.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filteredProfessionals && filteredProfessionals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfessionals.map((professional) => (
            <ProfessionalCard 
              key={professional.id} 
              professional={professional} 
              isOnline={onlineStatus?.[professional.id] || false}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Professionals Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || roleFilter !== "all" || specialtyFilter !== "all"
                ? "No professionals match your current filters. Try adjusting your search criteria."
                : "No professionals have been added to the system yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
