import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_OPTIONS = [
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM",
];

const BREAK_OPTIONS = ["No break", "15 min", "30 min", "45 min", "60 min", "90 min"];

const ROLE_OPTIONS = [
  { value: "Hygienist", label: "Hygienist", category: "Clinical" },
  { value: "Dentist", label: "Dentist", category: "Clinical" },
  { value: "Dental Assistant", label: "Dental Assistant", category: "Clinical" },
  { value: "Office Coordinator", label: "Office Coordinator", category: "Administrative" },
  { value: "Front Desk", label: "Front Desk", category: "Administrative" },
  { value: "Billing Staff", label: "Billing Staff", category: "Administrative" },
];

const PAYROLL_BREAKDOWN = {
  socialSecurityTax: { label: "Social security tax", rate: 0.062 },
  medicareTax: { label: "Medicare tax", rate: 0.0145 },
  federalUnemploymentTax: { label: "Federal unemployment tax", rate: 0.006 },
  stateUnemploymentTax: { label: "State unemployment tax", rate: 0.027 },
  workersCompCoverage: { label: "Workers compensation coverage", rate: 0.0019 },
  paidSickLeave: { label: "Paid sick leave (ESTA)", rate: 0.0333 },
};

const ETHERAI_FEE_RATE = 0.12;
const MIN_RATE = 49;
const MAX_RATE = 58;

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  const days: { date: number; fullDate: string; currentMonth: boolean; isToday: boolean; isPast: boolean }[] = [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonthLastDay - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const fullDate = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const dayDate = new Date(prevYear, prevMonth, date);
    days.push({ date, fullDate, currentMonth: false, isToday: false, isPast: dayDate < today });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === i;
    const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayDate = new Date(year, month, i);
    days.push({ date: i, fullDate, currentMonth: true, isToday, isPast: dayDate < today });
  }
  
  const remainingDays = 42 - days.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let i = 1; i <= remainingDays; i++) {
    const fullDate = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ date: i, fullDate, currentMonth: false, isToday: false, isPast: false });
  }
  
  return days;
}

function getFillRateInfo(rate: number, minRate: number, maxRate: number) {
  const midpoint = (minRate + maxRate) / 2;
  if (rate >= maxRate - 1) {
    return { label: "High fill rate", color: "text-green-600" };
  } else if (rate >= midpoint) {
    return { label: "Good fill rate", color: "text-green-600" };
  } else {
    return { label: "Low fill rate", color: "text-orange-500" };
  }
}

export default function AddShiftPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  
  const [selectedRole, setSelectedRole] = useState("Hygienist");
  const [arrivalTime, setArrivalTime] = useState("8:30 AM");
  const [firstPatient, setFirstPatient] = useState("9:00 AM");
  const [endTime, setEndTime] = useState("5:00 PM");
  const [breakDuration, setBreakDuration] = useState("60 min");
  
  const [pricingMode, setPricingMode] = useState<"fixed" | "smart">("smart");
  const [minHourlyRate, setMinHourlyRate] = useState(MIN_RATE);
  const [maxHourlyRate, setMaxHourlyRate] = useState(MAX_RATE);
  const [fixedHourlyRate, setFixedHourlyRate] = useState(55);
  
  const [showPayrollBreakdown, setShowPayrollBreakdown] = useState(false);
  const [pricingTab, setPricingTab] = useState<"min" | "max">("min");

  const createShiftsMutation = useMutation({
    mutationFn: async (data: {
      dates: string[];
      role: string;
      arrivalTime: string;
      firstPatientTime: string;
      endTime: string;
      breakDuration: string;
      pricingMode: "fixed" | "smart";
      minHourlyRate: number | null;
      maxHourlyRate: number | null;
      fixedHourlyRate: number | null;
    }) => {
      const response = await apiRequest("POST", "/api/shifts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.startsWith('/api/shifts');
      }});
      toast({
        title: "Shifts posted",
        description: `Successfully posted ${selectedDates.size} shift${selectedDates.size !== 1 ? 's' : ''}.`,
      });
      setLocation("/staffing");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post shifts. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create shifts:", error);
    },
  });

  const handlePostShifts = () => {
    if (selectedDates.size === 0) return;
    
    createShiftsMutation.mutate({
      dates: Array.from(selectedDates).sort(),
      role: selectedRole,
      arrivalTime,
      firstPatientTime: firstPatient,
      endTime,
      breakDuration,
      pricingMode,
      minHourlyRate: pricingMode === "smart" ? minHourlyRate : null,
      maxHourlyRate: pricingMode === "smart" ? maxHourlyRate : null,
      fixedHourlyRate: pricingMode === "fixed" ? fixedHourlyRate : null,
    });
  };
  
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getMonthData(currentYear, currentMonth);
  
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
  
  const toggleDate = (fullDate: string, isPast: boolean) => {
    if (isPast) return;
    const newDates = new Set(selectedDates);
    if (newDates.has(fullDate)) {
      newDates.delete(fullDate);
    } else {
      newDates.add(fullDate);
    }
    setSelectedDates(newDates);
  };
  
  const selectedDatesArray = useMemo(() => {
    return Array.from(selectedDates).sort();
  }, [selectedDates]);
  
  const firstSelectedDate = selectedDatesArray[0];
  const firstSelectedDayName = firstSelectedDate
    ? DAYS_OF_WEEK[new Date(firstSelectedDate + "T12:00:00").getDay()]
    : "";
  
  const displayRate = pricingMode === "fixed" 
    ? fixedHourlyRate 
    : (pricingTab === "min" ? minHourlyRate : maxHourlyRate);
  
  const pricing = useMemo(() => {
    const baseWage = displayRate;
    
    const payrollFees = Object.entries(PAYROLL_BREAKDOWN).reduce((sum, [_, item]) => {
      return sum + (baseWage * item.rate);
    }, 0);
    
    const subtotal = baseWage + payrollFees;
    const etherAIFee = subtotal * ETHERAI_FEE_RATE;
    const hourlyTotal = subtotal + etherAIFee;
    
    return {
      baseWage,
      payrollFees,
      payrollBreakdown: Object.entries(PAYROLL_BREAKDOWN).map(([key, item]) => ({
        key,
        label: item.label,
        rate: item.rate,
        amount: baseWage * item.rate,
      })),
      etherAIFee,
      hourlyTotal,
    };
  }, [displayRate]);
  
  const fillRateInfo = getFillRateInfo(
    pricingMode === "fixed" ? fixedHourlyRate : maxHourlyRate,
    MIN_RATE,
    MAX_RATE
  );
  
  const handleClose = () => {
    setLocation("/staffing");
  };
  
  const adjustMinRate = (delta: number) => {
    const newRate = Math.max(MIN_RATE, Math.min(maxHourlyRate - 1, minHourlyRate + delta));
    setMinHourlyRate(newRate);
  };
  
  const adjustMaxRate = (delta: number) => {
    const newRate = Math.max(minHourlyRate + 1, Math.min(MAX_RATE + 10, maxHourlyRate + delta));
    setMaxHourlyRate(newRate);
  };
  
  const adjustFixedRate = (delta: number) => {
    const newRate = Math.max(MIN_RATE, Math.min(MAX_RATE + 10, fixedHourlyRate + delta));
    setFixedHourlyRate(newRate);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center gap-4 p-4 border-b bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          data-testid="button-close-add-shift"
        >
          <X className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold" data-testid="text-add-shifts-title">Add shifts</h1>
      </header>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1" data-testid="text-select-dates">Select your dates.</h2>
                <p className="text-muted-foreground text-sm">You can choose multiple at once.</p>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={goToPrevMonth}
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium" data-testid="text-current-month">{monthName}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={goToNextMonth}
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_SHORT.map((day) => (
                    <div key={day} className="text-center text-sm text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {days.map((day, index) => {
                    const isSelected = selectedDates.has(day.fullDate);
                    return (
                      <button
                        key={index}
                        onClick={() => toggleDate(day.fullDate, day.isPast)}
                        disabled={day.isPast}
                        className={cn(
                          "h-10 w-10 mx-auto rounded-full text-sm flex items-center justify-center transition-colors hover-elevate",
                          !day.currentMonth && "text-muted-foreground/50",
                          day.isPast && "text-muted-foreground/30 cursor-not-allowed opacity-50",
                          day.currentMonth && !day.isPast && "cursor-pointer",
                          isSelected && "bg-foreground text-background",
                          day.isToday && !isSelected && "ring-1 ring-foreground"
                        )}
                        data-testid={day.currentMonth ? `button-calendar-day-${day.date}` : undefined}
                      >
                        {day.date}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <span data-testid="text-days-selected">
                  {selectedDates.size} day{selectedDates.size !== 1 ? 's' : ''} selected
                </span>
                <HelpCircle className="h-4 w-4" />
              </div>
              
              {selectedDates.size > 0 && (
                <div className="border-t pt-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Role</label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-[160px]" data-testid="select-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role.value} value={role.value} data-testid={`option-role-${role.value.replace(/[ ]/g, '-')}`}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Arrival time</label>
                      <Select value={arrivalTime} onValueChange={setArrivalTime}>
                        <SelectTrigger className="w-[120px]" data-testid="select-arrival-time">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time} data-testid={`option-arrival-${time.replace(/[: ]/g, '-')}`}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">First patient</label>
                      <Select value={firstPatient} onValueChange={setFirstPatient}>
                        <SelectTrigger className="w-[120px]" data-testid="select-first-patient">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time} data-testid={`option-first-patient-${time.replace(/[: ]/g, '-')}`}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">End time</label>
                      <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger className="w-[120px]" data-testid="select-end-time">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time} data-testid={`option-end-${time.replace(/[: ]/g, '-')}`}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Break (unpaid)</label>
                      <Select value={breakDuration} onValueChange={setBreakDuration}>
                        <SelectTrigger className="w-[100px]" data-testid="select-break">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BREAK_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt} data-testid={`option-break-${opt.replace(/[ ]/g, '-')}`}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={cn(
                  "p-6 cursor-pointer transition-all relative",
                  pricingMode === "fixed" && "ring-2 ring-foreground"
                )}
                onClick={() => setPricingMode("fixed")}
                data-testid="card-fixed-pricing"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                    pricingMode === "fixed" ? "border-foreground" : "border-muted-foreground"
                  )}>
                    {pricingMode === "fixed" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Fixed pricing</h3>
                    <p className="text-sm text-muted-foreground">
                      Set one hourly rate. Straightforward, but may require manual adjustments to stay competitive.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card
                className={cn(
                  "p-6 cursor-pointer transition-all relative",
                  pricingMode === "smart" && "ring-2 ring-foreground"
                )}
                onClick={() => setPricingMode("smart")}
                data-testid="card-smart-pricing"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1 rounded-full" data-testid="badge-fill-more-shifts">
                    Fill more shifts <TrendingUp className="h-3 w-3" />
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                    pricingMode === "smart" ? "border-foreground" : "border-muted-foreground"
                  )}>
                    {pricingMode === "smart" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold">Smart pricing</h3>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      We optimize the rate daily within your range. Set it, forget it, and quickly get fully staffed.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-2">Hourly rate</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Offices in this area usually set rates for this position between <strong>${MIN_RATE}</strong> and <strong>${MAX_RATE}</strong>.
              </p>
              
              <div className="mb-8">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  {pricingMode === "smart" && (
                    <>
                      <span>${minHourlyRate + 3}/hr</span>
                      <span>${maxHourlyRate}/hr</span>
                    </>
                  )}
                </div>
                
                <div className="relative">
                  <div className="h-2 rounded-full bg-gradient-to-r from-gray-300 via-orange-400 via-yellow-400 to-green-500" />
                  
                  {pricingMode === "smart" ? (
                    <>
                      <div 
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: `${((minHourlyRate - MIN_RATE) / (MAX_RATE - MIN_RATE + 10)) * 100}%` }}
                      >
                        <div className="w-4 h-4 bg-gray-500 rounded-full border-2 border-white shadow-md" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          ${minHourlyRate}/hr
                        </span>
                      </div>
                      <div 
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: `${((maxHourlyRate - MIN_RATE) / (MAX_RATE - MIN_RATE + 10)) * 100}%` }}
                      >
                        <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-md" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          ${maxHourlyRate}/hr
                        </span>
                      </div>
                    </>
                  ) : (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{ left: `${((fixedHourlyRate - MIN_RATE) / (MAX_RATE - MIN_RATE + 10)) * 100}%` }}
                    >
                      <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-md" />
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        ${fixedHourlyRate}/hr
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-12 pt-6">
                {pricingMode === "smart" ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => adjustMinRate(-1)}
                          disabled={minHourlyRate <= MIN_RATE}
                          data-testid="button-decrease-min-rate"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-3xl font-semibold w-20 text-center" data-testid="text-min-rate">
                          ${minHourlyRate}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => adjustMinRate(1)}
                          disabled={minHourlyRate >= maxHourlyRate - 1}
                          data-testid="button-increase-min-rate"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground text-center mt-2">Minimum hourly rate</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => adjustMaxRate(-1)}
                          disabled={maxHourlyRate <= minHourlyRate + 1}
                          data-testid="button-decrease-max-rate"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-3xl font-semibold w-20 text-center" data-testid="text-max-rate">
                          ${maxHourlyRate}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => adjustMaxRate(1)}
                          data-testid="button-increase-max-rate"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground text-center mt-2">Maximum hourly rate</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="border rounded-lg p-6 w-64">
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => adjustFixedRate(-1)}
                          disabled={fixedHourlyRate <= MIN_RATE}
                          data-testid="button-decrease-fixed-rate"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-3xl font-semibold w-20 text-center" data-testid="text-fixed-rate">
                          ${fixedHourlyRate}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => adjustFixedRate(1)}
                          data-testid="button-increase-fixed-rate"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground text-center mt-2">Hourly rate</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-6" data-testid="indicator-fill-rate">
                <TrendingUp className={cn("h-4 w-4", fillRateInfo.color)} />
                <span className={cn("text-sm font-medium", fillRateInfo.color)} data-testid="text-fill-rate">
                  {fillRateInfo.label}
                </span>
              </div>
            </Card>
            
            <div className="space-y-4">
              <Button 
                className="w-full h-12 text-base"
                disabled={selectedDates.size === 0 || createShiftsMutation.isPending}
                onClick={handlePostShifts}
                data-testid="button-post-shifts"
              >
                {createShiftsMutation.isPending 
                  ? "Posting..." 
                  : `Post ${selectedDates.size} shift${selectedDates.size !== 1 ? 's' : ''}`}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                It's always free to post shifts on EtherAI. Free cancellation up to 24 hours before a confirmed shift begins. By clicking "Post shifts" you agree to the EtherAI{" "}
                <a href="#" className="underline" data-testid="link-terms-of-service">Terms of Service</a> and <a href="#" className="underline" data-testid="link-privacy-policy">Privacy Policy</a>.
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24" data-testid="card-estimated-pricing">
              <h3 className="text-xl font-semibold mb-4" data-testid="text-estimated-pricing">Estimated pricing</h3>
              
              {pricingMode === "smart" && (
                <div className="flex mb-4">
                  <button
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-l-md border",
                      pricingTab === "min" 
                        ? "bg-foreground text-background" 
                        : "bg-background text-foreground"
                    )}
                    onClick={() => setPricingTab("min")}
                    data-testid="button-min-rate-tab"
                  >
                    min rate
                  </button>
                  <button
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-r-md border-t border-r border-b",
                      pricingTab === "max" 
                        ? "bg-foreground text-background" 
                        : "bg-background text-foreground"
                    )}
                    onClick={() => setPricingTab("max")}
                    data-testid="button-max-rate-tab"
                  >
                    max rate
                  </button>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Hygienist wages</span>
                  <span className="text-sm font-medium" data-testid="text-base-wage">
                    ${pricing.baseWage.toFixed(2)}
                  </span>
                </div>
                
                <Collapsible open={showPayrollBreakdown} onOpenChange={setShowPayrollBreakdown}>
                  <CollapsibleTrigger className="flex justify-between w-full group" data-testid="button-toggle-payroll-breakdown">
                    <span className="text-sm flex items-center gap-1">
                      Payroll fees
                      {showPayrollBreakdown ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                    <span className="text-sm" data-testid="text-payroll-fees">
                      ${pricing.payrollFees.toFixed(2)}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2 pl-4">
                    {pricing.payrollBreakdown.map((item) => (
                      <div key={item.key} className="flex justify-between text-xs text-muted-foreground" data-testid={`text-payroll-${item.key}`}>
                        <span>{item.label} ({(item.rate * 100).toFixed(item.rate < 0.01 ? 2 : 1)}%)</span>
                        <span>${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">EtherAI fee (12%)</span>
                  <span className="text-sm" data-testid="text-etherai-fee">
                    ${pricing.etherAIFee.toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Hourly total</span>
                  <span className="font-semibold text-lg" data-testid="text-hourly-total">
                    ${pricing.hourlyTotal.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Completed shifts are not billed until after the shift is finished. The final bill will be calculated based on actual hours worked.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Credit card payments will incur an additional 3% payment fee.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
