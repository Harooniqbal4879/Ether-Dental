import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CoverageBadgeProps {
  percentage: number;
  className?: string;
}

export function CoverageBadge({ percentage, className }: CoverageBadgeProps) {
  const getColor = () => {
    if (percentage >= 100) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (percentage >= 80) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (percentage >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Badge
      variant="outline"
      className={cn("border-0 font-semibold tabular-nums", getColor(), className)}
    >
      {percentage}%
    </Badge>
  );
}
