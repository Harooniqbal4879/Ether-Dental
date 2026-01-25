import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  RefreshCw,
  Clock,
  User,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { BenefitsCard } from "@/components/benefits-card";
import { VerificationTimeline } from "@/components/verification-timeline";
import { BenefitsDetailSkeleton } from "@/components/loading-skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PatientWithInsurance, Verification, Benefit } from "@shared/schema";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: patient, isLoading } = useQuery<PatientWithInsurance>({
    queryKey: ["/api/patients", id],
  });

  const { data: verifications } = useQuery<(Verification & { benefits?: Benefit })[]>({
    queryKey: ["/api/patients", id, "verifications"],
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/patients/${id}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", id, "verifications"] });
      toast({
        title: "Verification started",
        description: "Insurance verification has been initiated.",
      });
    },
    onError: () => {
      toast({
        title: "Verification failed",
        description: "Unable to start verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Patient not found</h2>
        <p className="mt-2 text-muted-foreground">
          The patient you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/patients">Back to Patients</Link>
        </Button>
      </div>
    );
  }

  const primaryPolicy = patient.insurancePolicies?.find((p) => p.isPrimary);
  
  // Get benefits by insurance type
  const dentalVerification = verifications?.find(v => v.insuranceType === "dental" && v.status === "completed" && v.benefits);
  const medicalVerification = verifications?.find(v => v.insuranceType === "medical" && v.status === "completed" && v.benefits);
  const dentalBenefits = dentalVerification?.benefits;
  const medicalBenefits = medicalVerification?.benefits;
  const hasBenefits = dentalBenefits || medicalBenefits;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const verificationTimelineEvents = verifications?.map((v) => ({
    id: v.id,
    type: (v.method as "clearinghouse" | "phone" | "manual") || "manual",
    status: v.status as "completed" | "failed" | "in_progress",
    timestamp: new Date(v.verifiedAt || v.createdAt!),
    verifiedBy: v.verifiedBy || undefined,
    notes: v.notes || undefined,
  })) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/patients" data-testid="button-back-to-patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-1 items-center gap-4">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
              {getInitials(patient.firstName, patient.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              DOB: {format(new Date(patient.dateOfBirth), "MMMM d, yyyy")}
              {patient.ssnLast4 && ` · SSN: ***-**-${patient.ssnLast4}`}
            </p>
          </div>
        </div>
        <Button
          onClick={() => verifyMutation.mutate()}
          disabled={verifyMutation.isPending}
          data-testid="button-verify-insurance"
        >
          {verifyMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Verify Insurance
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{patient.phone}</p>
                    <p className="text-xs text-muted-foreground">Phone</p>
                  </div>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{patient.email}</p>
                    <p className="text-xs text-muted-foreground">Email</p>
                  </div>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{patient.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {patient.city}, {patient.state} {patient.zipCode}
                    </p>
                  </div>
                </div>
              )}
              {patient.emergencyContactName && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {patient.emergencyContactName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Emergency Contact · {patient.emergencyContactPhone}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {primaryPolicy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                    {primaryPolicy.carrier.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{primaryPolicy.carrier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Primary Insurance
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Policy Number</p>
                    <p className="font-mono font-medium">
                      {primaryPolicy.policyNumber}
                    </p>
                  </div>
                  {primaryPolicy.groupNumber && (
                    <div>
                      <p className="text-muted-foreground">Group Number</p>
                      <p className="font-mono font-medium">
                        {primaryPolicy.groupNumber}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Subscriber</p>
                    <p className="font-medium">{primaryPolicy.subscriberName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Relationship</p>
                    <p className="font-medium capitalize">
                      {primaryPolicy.subscriberRelationship}
                    </p>
                  </div>
                </div>

                {primaryPolicy.effectiveDate && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Effective:</span>
                      <span className="font-medium">
                        {format(
                          new Date(primaryPolicy.effectiveDate),
                          "MMM d, yyyy"
                        )}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="benefits" className="space-y-4">
            <TabsList>
              <TabsTrigger value="benefits" data-testid="tab-benefits">
                Benefits
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                Verification History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="benefits" className="space-y-4">
              {patient.latestVerification && (
                <div className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last verified:</span>
                    <span className="font-medium">
                      {patient.latestVerification.verifiedAt
                        ? format(
                            new Date(patient.latestVerification.verifiedAt),
                            "MMM d, yyyy 'at' h:mm a"
                          )
                        : "Pending"}
                    </span>
                  </div>
                  <VerificationStatusBadge
                    status={
                      patient.latestVerification.status as
                        | "completed"
                        | "pending"
                        | "in_progress"
                        | "failed"
                    }
                  />
                </div>
              )}

              {hasBenefits ? (
                <div className="grid gap-6">
                  {dentalBenefits && (
                    <BenefitsCard
                      title="Dental Benefits"
                      insuranceType="dental"
                      benefits={dentalBenefits}
                    />
                  )}
                  
                  {medicalBenefits && (
                    <BenefitsCard
                      title="Medical Benefits"
                      insuranceType="medical"
                      benefits={medicalBenefits}
                    />
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <CreditCard className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">
                        No benefits data available
                      </h3>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Verify insurance to retrieve the patient's benefits breakdown.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => verifyMutation.mutate()}
                        disabled={verifyMutation.isPending}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Verify Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Verification Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VerificationTimeline events={verificationTimelineEvents} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
