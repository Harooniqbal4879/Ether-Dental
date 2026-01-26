import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, isToday, isTomorrow, isThisWeek, addDays } from "date-fns";
import { Calendar, Clock, User, ChevronRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment, Patient, Verification } from "@shared/schema";

type AppointmentWithDetails = Appointment & {
  patient: Patient & { latestVerification?: Verification };
};

export default function Appointments() {
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
    <div className="space-y-6 p-6">
      <PageHeader
        title="Appointments"
        description="Upcoming appointments with verification status"
        actions={
          needsVerificationCount > 0 && (
            <Button variant="outline" data-testid="button-verify-all">
              <RefreshCw className="mr-2 h-4 w-4" />
              Verify All ({needsVerificationCount})
            </Button>
          )
        }
      />

      {needsVerificationCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium">
                {needsVerificationCount} appointments need verification
              </p>
              <p className="text-sm text-muted-foreground">
                Verify insurance before patient visits to ensure smooth check-in
              </p>
            </div>
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
                          href={`/app/patients/${apt.patientId}`}
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
