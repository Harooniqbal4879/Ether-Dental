import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Users,
  Heart,
  Ban,
  Search,
  Gift,
  Stethoscope,
  UserCog,
  Briefcase,
  Clock,
  DollarSign,
  User,
  CheckCircle2,
  XCircle,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaffShift, ShiftTransactionWithDetails, ProfessionalWithBadges } from "@shared/schema";

const STAFF_ROLES = {
  all: { label: "All Roles", category: "all" },
  dentist: { label: "Dentist", category: "clinical" },
  hygienist: { label: "Hygienist", category: "clinical" },
  dental_assistant: { label: "Dental Assistant", category: "clinical" },
  office_coordinator: { label: "Office Coordinator", category: "administrative" },
  front_desk: { label: "Front Desk", category: "administrative" },
  billing: { label: "Billing Staff", category: "administrative" },
} as const;

type StaffRole = keyof typeof STAFF_ROLES;

const ROLE_BADGE_COLORS: Record<StaffRole, string> = {
  all: "bg-muted text-muted-foreground",
  dentist: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  hygienist: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  dental_assistant: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  office_coordinator: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  front_desk: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  billing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

function getRoleBadgeColor(role: string): string {
  const roleMap: Record<string, string> = {
    "Dentist": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Hygienist": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Dental Assistant": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "Office Coordinator": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "Front Desk": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    "Billing Staff": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  };
  return roleMap[role] || "bg-muted text-muted-foreground";
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Open</Badge>;
    case "filled":
      return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">Filled</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Completed</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

function ShiftDetailDialog({ 
  shift, 
  open, 
  onOpenChange 
}: { 
  shift: StaffShift | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { data: transaction, isLoading: txLoading } = useQuery<ShiftTransactionWithDetails>({
    queryKey: [`/api/shifts/${shift?.id}/transaction`],
    enabled: !!shift?.id && shift?.status === "completed",
  });

  const { data: professional } = useQuery<ProfessionalWithBadges>({
    queryKey: [`/api/professionals/${shift?.assignedProfessionalId}`],
    enabled: !!shift?.assignedProfessionalId,
  });

  if (!shift) return null;

  const formattedDate = new Date(shift.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col" data-testid="dialog-shift-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Shift Details
          </DialogTitle>
          <DialogDescription>{formattedDate}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", getRoleBadgeColor(shift.role))} data-testid="badge-shift-role">
                {shift.role}
              </Badge>
              {getStatusBadge(shift.status)}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arrival Time</span>
                <span data-testid="text-arrival-time">{shift.arrivalTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">First Patient</span>
                <span data-testid="text-first-patient-time">{shift.firstPatientTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Time</span>
                <span data-testid="text-end-time">{shift.endTime}</span>
              </div>
              {shift.breakDuration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Break Duration</span>
                  <span data-testid="text-break-duration">{shift.breakDuration} min</span>
                </div>
              )}
            </CardContent>
          </Card>

          {shift.specialties && shift.specialties.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Required Specialties</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {shift.specialties.map((spec, i) => (
                  <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-specialty-${i}`}>
                    {spec}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="capitalize" data-testid="text-pricing-mode">{shift.pricingMode}</span>
              </div>
              {shift.pricingMode === "fixed" && shift.fixedHourlyRate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span data-testid="text-fixed-rate">{formatCurrency(shift.fixedHourlyRate)}/hr</span>
                </div>
              )}
              {shift.pricingMode === "smart" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Rate</span>
                    <span data-testid="text-min-rate">{formatCurrency(shift.minHourlyRate)}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Rate</span>
                    <span data-testid="text-max-rate">{formatCurrency(shift.maxHourlyRate)}/hr</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {professional && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned Professional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span data-testid="text-professional-name">{professional.firstName} {professional.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span data-testid="text-professional-role">{professional.role}</span>
                </div>
                {professional.rating && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span data-testid="text-professional-rating">{professional.rating}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {shift.status === "completed" && (
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {txLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                ) : transaction ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hours Worked</span>
                      <span data-testid="text-hours-worked">{transaction.hoursWorked} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hourly Rate</span>
                      <span data-testid="text-tx-hourly-rate">{formatCurrency(transaction.hourlyRate)}/hr</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Regular Pay</span>
                      <span data-testid="text-regular-pay">{formatCurrency(transaction.regularPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Fee (22.5%)</span>
                      <span data-testid="text-service-fee">{formatCurrency(transaction.serviceFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Convenience Fee (3.5%)</span>
                      <span data-testid="text-convenience-fee">{formatCurrency(transaction.convenienceFee)}</span>
                    </div>
                    {transaction.adjustmentMade && transaction.adjustmentAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Adjustment</span>
                        <span data-testid="text-adjustment">{formatCurrency(transaction.adjustmentAmount)}</span>
                      </div>
                    )}
                    {parseFloat(transaction.counterCoverDiscount || "0") > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Counter Cover Discount</span>
                        <span data-testid="text-discount">-{formatCurrency(transaction.counterCoverDiscount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span data-testid="text-total-pay">{formatCurrency(transaction.totalPay)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-muted-foreground">Status</span>
                      <Badge 
                        variant={transaction.status === "charged" ? "default" : "secondary"}
                        data-testid="badge-tx-status"
                      >
                        {transaction.status === "charged" ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Charged</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Pending</>
                        )}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No transaction found for this shift.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  const days: { date: number; currentMonth: boolean; isToday: boolean; holiday?: string }[] = [];
  
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({ date: prevMonthLastDay - i, currentMonth: false, isToday: false });
  }
  
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === i;
    let holiday: string | undefined;
    if (month === 0 && i === 1) holiday = "New Year's Day";
    days.push({ date: i, currentMonth: true, isToday, holiday });
  }
  
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ date: i, currentMonth: false, isToday: false });
  }
  
  return days;
}

function CalendarView() {
  const [, setLocation] = useLocation();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getMonthData(currentYear, currentMonth);
  
  const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`;
  
  const { data: shifts = [], isLoading, isError } = useQuery<StaffShift[]>({
    queryKey: [`/api/shifts?startDate=${startDate}&endDate=${endDate}`],
  });

  const handleShiftClick = (shift: StaffShift) => {
    setSelectedShift(shift);
    setDialogOpen(true);
  };
  
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, StaffShift[]>();
    for (const shift of shifts) {
      const existing = map.get(shift.date) || [];
      existing.push(shift);
      map.set(shift.date, existing);
    }
    return map;
  }, [shifts]);
  
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth} data-testid="button-prev-month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} data-testid="button-next-month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold" data-testid="text-current-month">{monthName}</h2>
        </div>
        <Button variant="default" onClick={() => setLocation("/staffing/add-shift")} data-testid="button-add-shifts">
          <Plus className="h-4 w-4 mr-2" />
          Add shifts
        </Button>
      </div>
      
      {isError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg" data-testid="error-loading-shifts">
          Failed to load shifts. Please try refreshing the page.
        </div>
      )}
      
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/30">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="p-3 text-sm font-medium text-muted-foreground border-b">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dateStr = day.currentMonth 
              ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
              : null;
            const dayShifts = dateStr ? shiftsByDate.get(dateStr) || [] : [];
            const showLoadingSkeleton = isLoading && day.currentMonth;
            
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] p-2 border-b border-r last:border-r-0",
                  !day.currentMonth && "bg-muted/20",
                  day.isToday && "bg-primary/5"
                )}
                data-testid={day.currentMonth ? `calendar-day-${day.date}` : undefined}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                      !day.currentMonth && "text-muted-foreground",
                      day.isToday && "bg-primary text-primary-foreground font-medium"
                    )}
                    data-testid={day.isToday ? "text-today-date" : `text-day-${day.date}`}
                  >
                    {day.date}
                  </span>
                  {day.holiday && (
                    <span className="text-xs text-purple-600 dark:text-purple-400" data-testid={`text-holiday-${day.date}`}>{day.holiday}</span>
                  )}
                </div>
                {showLoadingSkeleton && (
                  <div className="mt-1 space-y-1 animate-pulse">
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                )}
                {!isLoading && dayShifts.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayShifts.slice(0, 2).map((shift) => (
                      <div 
                        key={shift.id} 
                        role="button"
                        tabIndex={0}
                        onClick={() => handleShiftClick(shift)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleShiftClick(shift); }}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded w-full text-left cursor-pointer hover-elevate",
                          getRoleBadgeColor(shift.role),
                          shift.status === "completed" && "border-l-2 border-emerald-500"
                        )}
                        data-testid={`shift-${shift.id}`}
                      >
                        <div className="font-medium truncate">{shift.role}</div>
                        <div className="flex items-center gap-1 opacity-80">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{shift.arrivalTime}</span>
                        </div>
                        {shift.specialties && shift.specialties.length > 0 && (
                          <div className="text-[10px] opacity-70 truncate mt-0.5">
                            {shift.specialties.slice(0, 2).join(", ")}
                            {shift.specialties.length > 2 && ` +${shift.specialties.length - 2}`}
                          </div>
                        )}
                      </div>
                    ))}
                    {dayShifts.length > 2 && (
                      <div className="text-xs text-muted-foreground pl-1" data-testid={`more-shifts-${day.date}`}>
                        +{dayShifts.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ShiftDetailDialog 
        shift={selectedShift} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
}

function PendingView() {
  const [, setLocation] = useLocation();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" data-testid="text-pending-title">Pending</h2>
      
      <div className="rounded-lg bg-muted/50 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="mb-6">
          <div className="w-48 h-48 flex items-center justify-center">
            <CalendarIcon className="h-24 w-24 text-muted-foreground/40" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2" data-testid="text-caught-up">
          You're caught up.
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          All caught up on confirmations and reviews. Keep the momentum going — add your next shift.
        </p>
        <Button variant="default" onClick={() => setLocation("/staffing/add-shift")} data-testid="button-add-shifts-pending">
          <Plus className="h-4 w-4 mr-2" />
          Add shifts
        </Button>
      </div>
    </div>
  );
}

function TeamView({ roleFilter }: { roleFilter: StaffRole }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const roleLabel = roleFilter === "all" ? "team members" : STAFF_ROLES[roleFilter].label.toLowerCase() + "s";
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-team-title">Your team</h2>
        <Button variant="outline" data-testid="button-refer-staff">
          <Gift className="h-4 w-4 mr-2" />
          Refer a professional
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="gap-2" data-testid="tab-all">
            <Users className="h-4 w-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2" data-testid="tab-favorites">
            <Heart className="h-4 w-4" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="blocked" className="gap-2" data-testid="tab-blocked">
            <Ban className="h-4 w-4" />
            Blocked
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <div className="rounded-lg bg-muted/50 p-12 flex flex-col items-center justify-center min-h-[350px]">
            <div className="mb-4">
              <Users className="h-16 w-16 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-center max-w-md mb-6" data-testid="text-no-professionals">
              No {roleLabel} have been scheduled to work at your office yet. When staff request shifts, you can add them to your favorites.
            </p>
            <Button variant="default" onClick={() => setLocation("/staffing/add-shift")} data-testid="button-start-adding-shifts">
              <Plus className="h-4 w-4 mr-2" />
              Start adding shifts
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-4">
          <div className="rounded-lg bg-muted/50 p-12 flex flex-col items-center justify-center min-h-[350px]">
            <div className="mb-4">
              <Heart className="h-16 w-16 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-center max-w-md" data-testid="text-no-favorites">
              No favorite {roleLabel} yet. Add staff to your favorites after they complete shifts at your office.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="blocked" className="mt-4">
          <div className="rounded-lg bg-muted/50 p-12 flex flex-col items-center justify-center min-h-[350px]">
            <div className="mb-4">
              <Ban className="h-16 w-16 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-center max-w-md" data-testid="text-no-blocked">
              No blocked {roleLabel}. If needed, you can block staff from requesting shifts at your office.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShiftHistoryView({ roleFilter }: { roleFilter: StaffRole }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("completed");
  const [searchQuery, setSearchQuery] = useState("");
  const roleLabel = roleFilter === "all" ? "staff" : STAFF_ROLES[roleFilter].label.toLowerCase();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-shift-history-title">Shift history</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${roleLabel} name`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-staff"
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
          <TabsTrigger value="incomplete" data-testid="tab-incomplete">Incomplete</TabsTrigger>
        </TabsList>
        
        <TabsContent value="completed" className="mt-4">
          <div className="rounded-lg bg-muted/50 p-12 flex flex-col items-center justify-center min-h-[350px]">
            <div className="mb-6">
              <div className="w-48 h-48 flex items-center justify-center">
                <CalendarIcon className="h-24 w-24 text-muted-foreground/40" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2" data-testid="text-no-shift-history">
              No shift history yet.
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Once you book shifts and staff complete them, you'll see all the details here.
            </p>
            <Button variant="default" onClick={() => setLocation("/staffing/add-shift")} data-testid="button-add-shifts-history">
              Add shifts
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="incomplete" className="mt-4">
          <div className="rounded-lg bg-muted/50 p-12 flex flex-col items-center justify-center min-h-[350px]">
            <div className="mb-4">
              <CalendarIcon className="h-16 w-16 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-center max-w-md" data-testid="text-no-incomplete">
              No incomplete shifts. All your shifts have been completed successfully.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentTransactionsView({ roleFilter }: { roleFilter: StaffRole }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const roleLabel = roleFilter === "all" ? "transactions" : `${STAFF_ROLES[roleFilter].label.toLowerCase()} transactions`;
  
  const { data: transactions, isLoading } = useQuery<ShiftTransactionWithDetails[]>({
    queryKey: ["/api/shift-transactions"],
  });

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((tx) => {
      const matchesRole = roleFilter === "all" || tx.shift?.role === STAFF_ROLES[roleFilter].label;
      const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
      const matchesSearch = searchQuery === "" || 
        `${tx.professional?.firstName} ${tx.professional?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.shift?.role?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [transactions, roleFilter, statusFilter, searchQuery]);

  const totalRegularPay = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.regularPay || "0"), 0);
  const totalServiceFees = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.serviceFee || "0"), 0);
  const totalConvenienceFees = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.convenienceFee || "0"), 0);
  const totalFees = totalServiceFees + totalConvenienceFees;
  const totalPay = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.totalPay || "0"), 0);
  const totalHours = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.hoursWorked || "0"), 0);
  const pendingAmount = filteredTransactions.filter(tx => tx.status === "pending").reduce((sum, tx) => sum + parseFloat(tx.totalPay || "0"), 0);
  const chargedAmount = filteredTransactions.filter(tx => tx.status === "charged").reduce((sum, tx) => sum + parseFloat(tx.totalPay || "0"), 0);
  const pendingCount = filteredTransactions.filter(tx => tx.status === "pending").length;
  const chargedCount = filteredTransactions.filter(tx => tx.status === "charged").length;

  function getTransactionStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Pending</Badge>;
      case "charged":
        return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">Charged</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="h-24 animate-pulse bg-muted" /></Card>
          <Card><CardContent className="h-24 animate-pulse bg-muted" /></Card>
          <Card><CardContent className="h-24 animate-pulse bg-muted" /></Card>
        </div>
        <Card><CardContent className="h-64 animate-pulse bg-muted" /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-payment-transactions-title">Payment Transactions</h2>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-transaction-status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="charged">Charged</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-transactions"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-transactions">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pay</p>
                <p className="text-xl font-bold">{formatCurrency(totalPay)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Regular Pay</span>
                <span>{formatCurrency(totalRegularPay)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Fees</span>
                <span>{formatCurrency(totalFees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Hours</span>
                <span>{totalHours.toFixed(1)} hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-fees-breakdown">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Receipt className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(totalFees)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fees</span>
                <span>{formatCurrency(totalServiceFees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Convenience Fees</span>
                <span>{formatCurrency(totalConvenienceFees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transactions</span>
                <span>{filteredTransactions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-pending-transactions">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transactions</span>
                <span>{pendingCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-charged-transactions">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Charged</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(chargedAmount)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transactions</span>
                <span>{chargedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredTransactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  data-testid={`row-transaction-${tx.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.professional?.firstName} {tx.professional?.lastName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{tx.shift?.role}</span>
                        <span>•</span>
                        <span>{tx.shift?.date ? new Date(tx.shift.date + "T00:00:00").toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(tx.regularPay)}</p>
                      <p className="text-xs text-muted-foreground">
                        Fees: {formatCurrency((parseFloat(tx.serviceFee || "0") + parseFloat(tx.convenienceFee || "0")).toString())}
                      </p>
                    </div>
                    {getTransactionStatusBadge(tx.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg bg-muted/50 p-12 flex flex-col items-center justify-center min-h-[350px]">
          <div className="mb-4">
            <Receipt className="h-16 w-16 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2" data-testid="text-no-transactions">
            No payment transactions yet.
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            Once shifts are completed and processed, payment transactions will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

function RoleFilterBadge({ role }: { role: StaffRole }) {
  if (role === "all") return null;
  return (
    <Badge className={cn("text-xs", ROLE_BADGE_COLORS[role])} data-testid={`badge-role-${role}`}>
      {STAFF_ROLES[role].label}
    </Badge>
  );
}

export default function StaffingPage() {
  const [location, setLocation] = useLocation();
  const [roleFilter, setRoleFilter] = useState<StaffRole>("all");
  
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get("tab") || "calendar";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") || "calendar";
    setActiveTab(tab);
  }, [location]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLocation(`/staffing?tab=${value}`);
  };

  const clinicalRoles = Object.entries(STAFF_ROLES).filter(([_, v]) => v.category === "clinical");
  const adminRoles = Object.entries(STAFF_ROLES).filter(([_, v]) => v.category === "administrative");

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Staffing Requests"
          description="Manage temporary and permanent staffing for your practice"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filter by role:</span>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as StaffRole)}>
            <SelectTrigger className="w-[200px]" data-testid="select-role-filter">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-all-roles">All Roles</SelectItem>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Clinical</div>
              {clinicalRoles.map(([key, role]) => (
                <SelectItem key={key} value={key} data-testid={`option-${key}`}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", ROLE_BADGE_COLORS[key as StaffRole].split(" ")[0])} />
                    {role.label}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Administrative</div>
              {adminRoles.map(([key, role]) => (
                <SelectItem key={key} value={key} data-testid={`option-${key}`}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", ROLE_BADGE_COLORS[key as StaffRole].split(" ")[0])} />
                    {role.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {roleFilter !== "all" && (
            <RoleFilterBadge role={roleFilter} />
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="calendar" data-testid="tab-staffing-calendar">Calendar</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-staffing-pending">Pending</TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-staffing-team">Team</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-staffing-history">Shift history</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-staffing-transactions">Payment Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar">
          <CalendarView />
        </TabsContent>
        
        <TabsContent value="pending">
          <PendingView />
        </TabsContent>
        
        <TabsContent value="team">
          <TeamView roleFilter={roleFilter} />
        </TabsContent>
        
        <TabsContent value="history">
          <ShiftHistoryView roleFilter={roleFilter} />
        </TabsContent>
        
        <TabsContent value="transactions">
          <PaymentTransactionsView roleFilter={roleFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
