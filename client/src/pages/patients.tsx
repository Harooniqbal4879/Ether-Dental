import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { format, isToday, isTomorrow } from "date-fns";
import { Plus, Users, ChevronRight, Phone, Mail, ClipboardCheck, Calendar, Clock, RefreshCw, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { PatientSearch } from "@/components/patient-search";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { PatientCardSkeleton, TableRowSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { PatientWithInsurance, VerificationWithDetails, Appointment, Patient, Verification } from "@shared/schema";

type StatusFilter = "all" | "completed" | "pending" | "in_progress" | "failed";

type AppointmentWithDetails = Appointment & {
  patient: Patient & { latestVerification?: Verification };
};

function PatientsTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: patients, isLoading } = useQuery<PatientWithInsurance[]>({
    queryKey: ["/api/patients"],
  });

  const filteredPatients = patients?.filter((patient) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(query) ||
      patient.lastName.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.includes(query) ||
      patient.insurancePolicies?.some(
        (policy) =>
          policy.carrier.name.toLowerCase().includes(query) ||
          policy.policyNumber.toLowerCase().includes(query)
      )
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getVerificationStatus = (patient: PatientWithInsurance) => {
    if (!patient.latestVerification) return "pending";
    return patient.latestVerification.status as "completed" | "pending" | "in_progress" | "failed";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <PatientSearch
          value={searchQuery}
          onChange={setSearchQuery}
          className="flex-1 max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {filteredPatients?.length ?? 0} patients
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PatientCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPatients && filteredPatients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Link
              key={patient.id}
              href={`/patients/${patient.id}`}
              className="block"
            >
              <Card
                className="group cursor-pointer transition-colors hover-elevate"
                data-testid={`card-patient-${patient.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-11 w-11 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(patient.firstName, patient.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate font-semibold">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        DOB: {format(new Date(patient.dateOfBirth), "MM/dd/yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {patient.insurancePolicies?.[0] && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {patient.insurancePolicies[0].carrier.name}
                        </span>
                        <VerificationStatusBadge
                          status={getVerificationStatus(patient)}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {patient.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="truncate">{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={searchQuery ? "No patients found" : "No patients yet"}
          description={
            searchQuery
              ? "Try adjusting your search terms"
              : "Add your first patient to start verifying insurance"
          }
          action={
            !searchQuery && (
              <Button asChild>
                <Link href="/patients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patient
                </Link>
              </Button>
            )
          }
        />
      )}
    </div>
  );
}

function VerificationsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: verifications, isLoading } = useQuery<VerificationWithDetails[]>({
    queryKey: ["/api/verifications"],
  });

  const filteredVerifications = verifications?.filter((v) => {
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      `${v.patient.firstName} ${v.patient.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      v.policy.carrier.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: verifications?.length ?? 0,
    completed: verifications?.filter((v) => v.status === "completed").length ?? 0,
    pending: verifications?.filter((v) => v.status === "pending").length ?? 0,
    in_progress: verifications?.filter((v) => v.status === "in_progress").length ?? 0,
    failed: verifications?.filter((v) => v.status === "failed").length ?? 0,
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card
          className={`cursor-pointer transition-colors hover-elevate ${statusFilter === "all" ? "border-primary" : ""}`}
          onClick={() => setStatusFilter("all")}
          data-testid="filter-all"
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <div className="text-sm text-muted-foreground">All</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors hover-elevate ${statusFilter === "completed" ? "border-emerald-500" : ""}`}
          onClick={() => setStatusFilter("completed")}
          data-testid="filter-completed"
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statusCounts.completed}
            </div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors hover-elevate ${statusFilter === "pending" ? "border-amber-500" : ""}`}
          onClick={() => setStatusFilter("pending")}
          data-testid="filter-pending"
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {statusCounts.pending}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors hover-elevate ${statusFilter === "in_progress" ? "border-blue-500" : ""}`}
          onClick={() => setStatusFilter("in_progress")}
          data-testid="filter-in-progress"
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statusCounts.in_progress}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors hover-elevate ${statusFilter === "failed" ? "border-red-500" : ""}`}
          onClick={() => setStatusFilter("failed")}
          data-testid="filter-failed"
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {statusCounts.failed}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <PatientSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by patient or carrier..."
          className="flex-1 max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={6} />
                ))}
              </TableBody>
            </Table>
          ) : filteredVerifications && filteredVerifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.map((v) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer"
                    data-testid={`row-verification-${v.id}`}
                  >
                    <TableCell>
                      <Link
                        href={`/patients/${v.patientId}`}
                        className="font-medium hover:underline"
                      >
                        {v.patient.firstName} {v.patient.lastName}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        DOB: {format(new Date(v.patient.dateOfBirth), "MM/dd/yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{v.policy.carrier.name}</div>
                      <div className="font-mono text-sm text-muted-foreground">
                        {v.policy.policyNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-muted-foreground">
                        {v.method || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <VerificationStatusBadge
                        status={v.status as "completed" | "pending" | "in_progress" | "failed"}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.verifiedAt
                        ? format(new Date(v.verifiedAt), "MMM d, yyyy h:mm a")
                        : format(new Date(v.createdAt!), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/patients/${v.patientId}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title={searchQuery || statusFilter !== "all" ? "No verifications found" : "No verifications yet"}
              description={
                searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Verifications will appear here when you verify patient insurance."
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AppointmentsTab() {
  const { data: appointments, isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  const groupedAppointments = appointments?.reduce(
    (groups, apt) => {
      const dateKey = format(new Date(apt.scheduledAt), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(apt);
      return groups;
    },
    {} as Record<string, AppointmentWithDetails[]>
  );

  const sortedDates = groupedAppointments
    ? Object.keys(groupedAppointments).sort()
    : [];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const needsVerificationCount =
    appointments?.filter(
      (a) =>
        !a.patient.latestVerification ||
        a.patient.latestVerification.status !== "completed"
    ).length ?? 0;

  return (
    <div className="space-y-4">
      {needsVerificationCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {needsVerificationCount} appointments need verification
              </p>
              <p className="text-sm text-muted-foreground">
                Verify insurance before patient visits to ensure smooth check-in
              </p>
            </div>
            <Button variant="outline" data-testid="button-verify-all">
              <RefreshCw className="mr-2 h-4 w-4" />
              Verify All
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Card>
                <CardContent className="p-0">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-4 border-b p-4 last:border-0">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const date = new Date(dateKey);
            const dayAppointments = groupedAppointments![dateKey];

            return (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{getDateLabel(date)}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {dayAppointments.length} appointments
                  </Badge>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y">
                    {dayAppointments.map((apt) => {
                      const verificationStatus =
                        apt.patient.latestVerification?.status || "pending";

                      return (
                        <Link
                          key={apt.id}
                          href={`/patients/${apt.patientId}`}
                          className="flex items-center gap-4 p-4 hover-elevate cursor-pointer"
                          data-testid={`appointment-${apt.id}`}
                        >
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                              {getInitials(
                                apt.patient.firstName,
                                apt.patient.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {apt.patient.firstName} {apt.patient.lastName}
                              </span>
                              <VerificationStatusBadge
                                status={
                                  verificationStatus as
                                    | "completed"
                                    | "pending"
                                    | "in_progress"
                                    | "failed"
                                }
                              />
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(new Date(apt.scheduledAt), "h:mm a")}
                              </span>
                              <span>{apt.appointmentType}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No upcoming appointments"
          description="Appointments will appear here once they're scheduled in your practice management system."
        />
      )}
    </div>
  );
}

export default function Patients() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  
  const params = new URLSearchParams(searchString);
  const tabFromUrl = params.get("tab") || "patients";
  const activeTab = ["patients", "verifications", "appointments"].includes(tabFromUrl) 
    ? tabFromUrl 
    : "patients";

  const handleTabChange = (value: string) => {
    if (value === "patients") {
      setLocation("/patients");
    } else {
      setLocation(`/patients?tab=${value}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Patients"
        description="Manage patients, insurance verifications, and appointments"
        actions={
          <Button asChild data-testid="button-add-patient">
            <Link href="/patients/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Link>
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="patients" className="flex items-center gap-2" data-testid="tab-patients">
            <Users className="h-4 w-4" />
            Patients
          </TabsTrigger>
          <TabsTrigger value="verifications" className="flex items-center gap-2" data-testid="tab-verifications">
            <ClipboardCheck className="h-4 w-4" />
            Verifications
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2" data-testid="tab-appointments">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="eligibility" className="flex items-center gap-2" data-testid="tab-eligibility" asChild>
            <Link href="/patients/eligibility">
              <Shield className="h-4 w-4" />
              Eligibility
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <PatientsTab />
        </TabsContent>

        <TabsContent value="verifications">
          <VerificationsTab />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
