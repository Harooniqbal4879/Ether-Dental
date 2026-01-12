import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BenefitsProgressProps {
  label: string;
  used: number;
  total: number;
  formatAsCurrency?: boolean;
  className?: string;
}

export function BenefitsProgress({
  label,
  used,
  total,
  formatAsCurrency = true,
  className,
}: BenefitsProgressProps) {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const remaining = Math.max(total - used, 0);

  const formatValue = (value: number) => {
    if (formatAsCurrency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toString();
  };

  const getProgressColor = () => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatValue(remaining)} remaining
        </span>
      </div>
      <div className="relative">
        <Progress value={percentage} className="h-3" />
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all",
            getProgressColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Used: {formatValue(used)}</span>
        <span>Maximum: {formatValue(total)}</span>
      </div>
    </div>
  );
}
