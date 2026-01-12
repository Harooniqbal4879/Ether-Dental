import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationStatus = "completed" | "pending" | "in_progress" | "failed";

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const statusConfig = {
  completed: {
    label: "Verified",
    icon: CheckCircle,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  pending: {
    label: "Needs Verification",
    icon: AlertCircle,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function VerificationStatusBadge({
  status,
  className,
}: VerificationStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-0 font-medium",
        config.className,
        className
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", status === "in_progress" && "animate-spin")}
      />
      {config.label}
    </Badge>
  );
}
