import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  ClipboardCheck,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Calendar,
  UserCheck,
  Sparkles,
  Settings,
  Plus,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import type { VerificationWithDetails } from "@shared/schema";

interface DashboardStats {
  totalPatients: number;
  pendingVerifications: number;
  completedToday: number;
  failedVerifications: number;
  upcomingAppointments: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentVerifications, isLoading: verificationsLoading } = useQuery<
    VerificationWithDetails[]
  >({
    queryKey: ["/api/verifications/recent"],
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Welcome to EtherAI"
        description="Your dental practice management hub - track verifications, manage patients, and streamline operations"
        actions={
          <Button asChild data-testid="button-view-all-verifications">
            <Link href="/verifications">
              View All Verifications
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Link href="/patients">
              <StatCard
                title="Total Patients"
                value={stats?.totalPatients ?? 0}
                icon={Users}
                description="Active in system"
                className="cursor-pointer hover-elevate"
              />
            </Link>
            <Link href="/verifications">
              <StatCard
                title="Pending Verifications"
                value={stats?.pendingVerifications ?? 0}
                icon={AlertCircle}
                description="Need attention"
                className={`cursor-pointer hover-elevate ${
                  (stats?.pendingVerifications ?? 0) > 0
                    ? "border-amber-200 dark:border-amber-900/50"
                    : ""
                }`}
              />
            </Link>
            <Link href="/verifications">
              <StatCard
                title="Completed Today"
                value={stats?.completedToday ?? 0}
                icon={CheckCircle}
                description="Successful verifications"
                className="cursor-pointer hover-elevate"
              />
            </Link>
            <Link href="/appointments">
              <StatCard
                title="Upcoming Appointments"
                value={stats?.upcomingAppointments ?? 0}
                icon={Calendar}
                description="Next 7 days"
                className="cursor-pointer hover-elevate"
              />
            </Link>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/patients/new">
          <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-quick-add-patient">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Add Patient</p>
                <p className="text-sm text-muted-foreground">Register new patient</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/staffing">
          <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-quick-staffing">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Staffing</p>
                <p className="text-sm text-muted-foreground">Manage shifts & team</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/services">
          <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-quick-services">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Services</p>
                <p className="text-sm text-muted-foreground">Billing & subscriptions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings">
          <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-quick-settings">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-sm text-muted-foreground">Office & practice info</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base font-semibold">
              Recent Verifications
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/verifications" data-testid="link-see-all-verifications">
                See all
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {verificationsLoading ? (
              <Table>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={4} />
                  ))}
                </TableBody>
              </Table>
            ) : recentVerifications && recentVerifications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentVerifications.slice(0, 5).map((v) => (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer hover-elevate"
                      data-testid={`row-verification-${v.id}`}
                    >
                      <TableCell className="font-medium">
                        {v.patient.firstName} {v.patient.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {v.policy.carrier.name}
                      </TableCell>
                      <TableCell>
                        <VerificationStatusBadge
                          status={v.status as "completed" | "pending" | "in_progress" | "failed"}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {v.verifiedAt
                          ? format(new Date(v.verifiedAt), "MMM d, h:mm a")
                          : format(new Date(v.createdAt!), "MMM d, h:mm a")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No verifications yet"
                description="Verification history will appear here once you start verifying patient insurance."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base font-semibold">
              Verification Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-md bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium">Completed</p>
                    <p className="text-sm text-muted-foreground">
                      Successfully verified
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold tabular-nums">
                  {stats?.completedToday ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">Pending</p>
                    <p className="text-sm text-muted-foreground">
                      Awaiting verification
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold tabular-nums">
                  {stats?.pendingVerifications ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium">Failed</p>
                    <p className="text-sm text-muted-foreground">
                      Needs manual review
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold tabular-nums">
                  {stats?.failedVerifications ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
