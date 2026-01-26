import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { ClipboardCheck, Filter, ChevronRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { PatientSearch } from "@/components/patient-search";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { TableRowSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import type { VerificationWithDetails } from "@shared/schema";

type StatusFilter = "all" | "completed" | "pending" | "in_progress" | "failed";

export default function Verifications() {
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
    <div className="space-y-6 p-6">
      <PageHeader
        title="Verifications"
        description="Track and manage insurance verification requests"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "all" ? "border-primary" : ""}`}
          onClick={() => setStatusFilter("all")}
          data-testid="filter-all"
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <div className="text-sm text-muted-foreground">All</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "completed" ? "border-emerald-500" : ""}`}
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
          className={`cursor-pointer transition-colors ${statusFilter === "pending" ? "border-amber-500" : ""}`}
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
          className={`cursor-pointer transition-colors ${statusFilter === "in_progress" ? "border-blue-500" : ""}`}
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
          className={`cursor-pointer transition-colors ${statusFilter === "failed" ? "border-red-500" : ""}`}
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
                        href={`/app/patients/${v.patientId}`}
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
                        <Link href={`/app/patients/${v.patientId}`}>
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
