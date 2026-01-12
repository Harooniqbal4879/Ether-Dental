import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Users, ChevronRight, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { PatientSearch } from "@/components/patient-search";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { PatientCardSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import type { PatientWithInsurance } from "@shared/schema";

export default function Patients() {
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
    <div className="space-y-6 p-6">
      <PageHeader
        title="Patients"
        description="Manage patient profiles and insurance information"
        actions={
          <Button asChild data-testid="button-add-patient">
            <Link href="/patients/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Link>
          </Button>
        }
      />

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
