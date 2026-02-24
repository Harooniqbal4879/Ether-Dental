import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CalendarCheck, Mail, Phone, Building2, Monitor, MessageSquare, Clock } from "lucide-react";
import type { DemoRequest } from "@shared/schema";

const statusOptions = [
  { value: "new", label: "New", variant: "default" as const },
  { value: "contacted", label: "Contacted", variant: "secondary" as const },
  { value: "scheduled", label: "Scheduled", variant: "outline" as const },
  { value: "completed", label: "Completed", variant: "default" as const },
  { value: "declined", label: "Declined", variant: "destructive" as const },
];

const practiceSizeLabels: Record<string, string> = {
  solo: "Solo Practice",
  small: "2-5 Providers",
  medium: "6-15 Providers",
  large: "16-50 Providers",
  dso: "DSO / 50+ Providers",
};

function StatusBadge({ status }: { status: string }) {
  const option = statusOptions.find(o => o.value === status);
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || ""}`} data-testid={`badge-status-${status}`}>
      {option?.label || status}
    </span>
  );
}

export default function DemoRequests() {
  const { toast } = useToast();

  const { data: requests, isLoading } = useQuery<DemoRequest[]>({
    queryKey: ["/api/demo-requests"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/demo-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demo-requests"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Demo Requests" description="Loading..." />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-72" /><Skeleton className="h-4 w-56" /></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const newCount = requests?.filter(r => r.status === "new").length || 0;
  const totalCount = requests?.length || 0;

  return (
    <div className="space-y-6" data-testid="page-demo-requests">
      <PageHeader
        title="Demo Requests"
        description={`${totalCount} total requests${newCount > 0 ? ` (${newCount} new)` : ""}`}
      />

      {!requests || requests.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No demo requests yet"
          description="Demo requests submitted through the website will appear here."
        />
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover-elevate" data-testid={`card-demo-request-${request.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold" data-testid={`text-name-${request.id}`}>
                        {request.firstName} {request.lastName}
                      </h3>
                      <StatusBadge status={request.status} />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-email-${request.id}`}>
                        <Mail className="h-4 w-4 shrink-0" />
                        <a href={`mailto:${request.email}`} className="text-primary hover:underline truncate">
                          {request.email}
                        </a>
                      </div>
                      {request.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-phone-${request.id}`}>
                          <Phone className="h-4 w-4 shrink-0" />
                          <a href={`tel:${request.phone}`} className="hover:underline">
                            {request.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-practice-${request.id}`}>
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span>{request.practiceName}</span>
                        {request.practiceSize && (
                          <span className="text-xs">({practiceSizeLabels[request.practiceSize] || request.practiceSize})</span>
                        )}
                      </div>
                      {request.currentSoftware && (
                        <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-software-${request.id}`}>
                          <Monitor className="h-4 w-4 shrink-0" />
                          <span>{request.currentSoftware}</span>
                        </div>
                      )}
                    </div>

                    {request.message && (
                      <div className="flex gap-2 text-sm" data-testid={`text-message-${request.id}`}>
                        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                        <p className="text-muted-foreground italic">"{request.message}"</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`text-date-${request.id}`}>
                      <Clock className="h-3.5 w-3.5" />
                      <span>{request.createdAt ? new Date(request.createdAt).toLocaleString() : "Unknown"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={request.status}
                      onValueChange={(value) => updateMutation.mutate({ id: request.id, status: value })}
                    >
                      <SelectTrigger className="w-[140px]" data-testid={`select-status-${request.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} data-testid={`option-status-${opt.value}`}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <a href={`mailto:${request.email}`}>
                      <Button variant="outline" size="sm" data-testid={`button-reply-${request.id}`}>
                        Reply
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
