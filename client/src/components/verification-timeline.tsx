import { format } from "date-fns";
import { Phone, Database, User, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: "clearinghouse" | "phone" | "manual";
  status: "completed" | "failed" | "in_progress";
  timestamp: Date;
  verifiedBy?: string;
  notes?: string;
}

interface VerificationTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const methodIcons = {
  clearinghouse: Database,
  phone: Phone,
  manual: User,
};

const methodLabels = {
  clearinghouse: "Clearinghouse Verification",
  phone: "AI Phone Verification",
  manual: "Manual Verification",
};

const statusIcons = {
  completed: CheckCircle,
  failed: XCircle,
  in_progress: Clock,
};

const statusColors = {
  completed: "text-emerald-500",
  failed: "text-red-500",
  in_progress: "text-blue-500",
};

export function VerificationTimeline({ events, className }: VerificationTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn("py-8 text-center text-muted-foreground", className)}>
        <Database className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>No verification history</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {events.map((event, index) => {
        const MethodIcon = methodIcons[event.type];
        const StatusIcon = statusIcons[event.status];
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4">
            {!isLast && (
              <div className="absolute left-4 top-10 h-full w-px bg-border" />
            )}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <MethodIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">{methodLabels[event.type]}</span>
                <StatusIcon className={cn("h-4 w-4", statusColors[event.status])} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}</span>
                {event.verifiedBy && (
                  <>
                    <span>·</span>
                    <span>by {event.verifiedBy}</span>
                  </>
                )}
              </div>
              {event.notes && (
                <p className="text-sm text-muted-foreground">{event.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
