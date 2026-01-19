import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  
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
        <Button variant="default" data-testid="button-add-shifts">
          <Plus className="h-4 w-4 mr-2" />
          Add shifts
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/30">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="p-3 text-sm font-medium text-muted-foreground border-b">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PendingView() {
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
        <Button variant="default" data-testid="button-add-shifts-pending">
          <Plus className="h-4 w-4 mr-2" />
          Add shifts
        </Button>
      </div>
    </div>
  );
}

function HygienistsView() {
  const [activeTab, setActiveTab] = useState("all");
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-hygiene-team-title">Your hygiene team</h2>
        <Button variant="outline" data-testid="button-refer-hygienist">
          <Gift className="h-4 w-4 mr-2" />
          Refer a hygienist
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
              <CalendarIcon className="h-16 w-16 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-center max-w-md mb-6" data-testid="text-no-professionals">
              No professionals have been scheduled to work at your office. When a professional has requested a shift, you can add them to your favorites.
            </p>
            <Button variant="default" data-testid="button-start-adding-shifts">
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
              No favorite hygienists yet. Add hygienists to your favorites after they complete shifts at your office.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="blocked" className="mt-4">
          <div className="rounded-lg bg-muted/50 p-12 flex flex-col items-center justify-center min-h-[350px]">
            <div className="mb-4">
              <Ban className="h-16 w-16 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-center max-w-md" data-testid="text-no-blocked">
              No blocked hygienists. If needed, you can block hygienists from requesting shifts at your office.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShiftHistoryView() {
  const [activeTab, setActiveTab] = useState("completed");
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-shift-history-title">Shift history</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search hygienist name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-hygienist"
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
              Once you book shifts and hygienists complete them, you'll see all the details here.
            </p>
            <Button variant="default" data-testid="button-add-shifts-history">
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

export default function StaffingPage() {
  const [location, setLocation] = useLocation();
  
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

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Hygienist Staffing"
        description="Manage temporary and permanent hygienist staffing for your practice"
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="calendar" data-testid="tab-staffing-calendar">Calendar</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-staffing-pending">Pending</TabsTrigger>
          <TabsTrigger value="hygienists" data-testid="tab-staffing-hygienists">Hygienists</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-staffing-history">Shift history</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar">
          <CalendarView />
        </TabsContent>
        
        <TabsContent value="pending">
          <PendingView />
        </TabsContent>
        
        <TabsContent value="hygienists">
          <HygienistsView />
        </TabsContent>
        
        <TabsContent value="history">
          <ShiftHistoryView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
