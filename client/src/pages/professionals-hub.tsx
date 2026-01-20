import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Star,
  CheckCircle,
  Award,
  Clock,
  Users,
  Lightbulb,
  Heart,
  ChevronLeft,
  Mail,
  Phone,
  GraduationCap,
  BadgeCheck,
  Briefcase,
  Wrench,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  CalendarClock,
  FileText,
  Plus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  type ProfessionalWithBadges,
  type StaffShift,
  type ShiftTransactionWithDetails,
  StaffRoles,
  DentalSpecialties,
} from "@shared/schema";
import { PageHeader } from "@/components/page-header";
import { usePersona } from "@/lib/persona-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const badgeIcons: Record<string, React.ReactNode> = {
  perfect_attendance: <Award className="h-5 w-5" />,
  shifts_completed: <CheckCircle className="h-5 w-5" />,
  timeliness: <Clock className="h-5 w-5" />,
  knowledge: <Lightbulb className="h-5 w-5" />,
  teamwork: <Heart className="h-5 w-5" />,
};

const badgeLabels: Record<string, string> = {
  perfect_attendance: "Perfect Attendance",
  shifts_completed: "Shifts Completed",
  timeliness: "Timeliness",
  knowledge: "Knowledge",
  teamwork: "Teamwork",
};

const badgeColors: Record<string, string> = {
  bronze: "bg-amber-600",
  silver: "bg-slate-400",
  gold: "bg-yellow-500",
};

const roleColors: Record<string, string> = {
  Dentist: "bg-blue-500",
  Hygienist: "bg-teal-500",
  "Dental Assistant": "bg-purple-500",
  "Office Coordinator": "bg-orange-500",
  "Front Desk": "bg-pink-500",
  "Billing Staff": "bg-indigo-500",
};

const addProfessionalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  specialty: z.string().optional(),
});

type AddProfessionalFormData = z.infer<typeof addProfessionalSchema>;

function AddProfessionalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();

  const form = useForm<AddProfessionalFormData>({
    resolver: zodResolver(addProfessionalSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      specialty: "",
    },
  });

  const createProfessionalMutation = useMutation({
    mutationFn: async (data: AddProfessionalFormData) => {
      const response = await apiRequest("POST", "/api/professionals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionals"] });
      toast({
        title: "Professional Added",
        description: "The professional has been added successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add professional",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddProfessionalFormData) => {
    createProfessionalMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Professional</DialogTitle>
          <DialogDescription>
            Add a dental professional to your network. They can then log in via the mobile app.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} data-testid="input-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} data-testid="input-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(StaffRoles).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialty (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-specialty">
                        <SelectValue placeholder="Select a specialty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DentalSpecialties).map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={createProfessionalMutation.isPending} data-testid="button-add-professional-submit">
                {createProfessionalMutation.isPending ? "Adding..." : "Add Professional"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: string | number | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num === null || num === undefined || isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function MyShiftsView({ professionalId }: { professionalId: string }) {
  const { data: shifts, isLoading } = useQuery<StaffShift[]>({
    queryKey: [`/api/professionals/${professionalId}/shifts`],
  });

  const today = new Date().toISOString().split("T")[0];
  const upcomingShifts = shifts?.filter((s) => s.date >= today && s.status !== "completed" && s.status !== "cancelled") || [];
  const pastShifts = shifts?.filter((s) => s.date < today || s.status === "completed") || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Upcoming Shifts
        </h3>
        {upcomingShifts.length > 0 ? (
          <div className="space-y-3">
            {upcomingShifts.map((shift) => (
              <Card key={shift.id} data-testid={`card-shift-upcoming-${shift.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={`${roleColors[shift.role] || "bg-muted"} text-white`}
                        >
                          {shift.role}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {shift.status}
                        </Badge>
                      </div>
                      <p className="font-medium">{formatDate(shift.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {shift.arrivalTime} - {shift.endTime}
                      </p>
                      {shift.specialties && shift.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {shift.specialties.map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(shift.fixedHourlyRate || shift.minHourlyRate)}/hr
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shift.pricingMode === "fixed" ? "Fixed rate" : "Smart pricing"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No upcoming shifts scheduled</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Completed Shifts
        </h3>
        {pastShifts.length > 0 ? (
          <div className="space-y-3">
            {pastShifts.slice(0, 10).map((shift) => (
              <Card key={shift.id} data-testid={`card-shift-completed-${shift.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className="capitalize"
                        >
                          {shift.role}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Completed
                        </Badge>
                      </div>
                      <p className="font-medium">{formatDate(shift.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {shift.arrivalTime} - {shift.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(shift.fixedHourlyRate || shift.minHourlyRate)}/hr
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No completed shifts yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MyEarningsView({ professionalId }: { professionalId: string }) {
  const { data: transactions, isLoading } = useQuery<ShiftTransactionWithDetails[]>({
    queryKey: [`/api/professionals/${professionalId}/transactions`],
  });

  const totalEarnings = transactions?.reduce((sum, tx) => sum + parseFloat(tx.regularPay || "0"), 0) || 0;
  const totalFees = transactions?.reduce((sum, tx) => sum + parseFloat(tx.serviceFee || "0") + parseFloat(tx.convenienceFee || "0"), 0) || 0;
  const pendingAmount = transactions?.filter((tx) => tx.status === "pending").reduce((sum, tx) => sum + parseFloat(tx.regularPay || "0"), 0) || 0;
  const completedShifts = transactions?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card data-testid="card-total-earnings">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-pending-payments">
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
          </CardContent>
        </Card>
        <Card data-testid="card-shifts-completed">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shifts Completed</p>
                <p className="text-xl font-bold">{completedShifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between gap-4 p-4 border rounded-md"
                  data-testid={`row-transaction-${tx.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{formatDate(tx.chargeDate)}</p>
                      <Badge
                        variant={tx.status === "charged" ? "default" : "secondary"}
                        className={tx.status === "charged" ? "bg-green-600" : ""}
                      >
                        {tx.status === "charged" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tx.shift?.role} - {tx.hoursWorked} hours @ {formatCurrency(tx.hourlyRate)}/hr
                    </p>
                    {tx.adjustmentMade && tx.adjustmentAmount && (
                      <p className="text-sm text-orange-600">
                        Adjustment: {formatCurrency(tx.adjustmentAmount)} - {tx.adjustmentReason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(tx.regularPay)}</p>
                    <p className="text-xs text-muted-foreground">
                      Fees: {formatCurrency(parseFloat(tx.serviceFee || "0") + parseFloat(tx.convenienceFee || "0"))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No payment history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfessionalPortalView() {
  const [activeTab, setActiveTab] = useState("shifts");
  
  const { data: professionals, isLoading } = useQuery<ProfessionalWithBadges[]>({
    queryKey: ["/api/professionals"],
  });

  // In a real application, this would be determined by the authenticated user's profile
  // For demo purposes, we use the first professional in the list
  const currentProfessional = professionals?.[0];

  if (isLoading) {
    return (
      <div className="container max-w-5xl py-6 space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!currentProfessional) {
    return (
      <div className="container max-w-5xl py-6">
        <PageHeader
          title="My Portal"
          description="View your shifts and earnings"
        />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Profile Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Your professional profile has not been set up yet. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = `${currentProfessional.firstName[0]}${currentProfessional.lastName[0]}`;
  const rating = parseFloat(currentProfessional.rating || "0");

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={currentProfessional.photoUrl || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              Welcome, {currentProfessional.firstName}!
            </h1>
            {currentProfessional.credentialsVerified && (
              <BadgeCheck className="h-5 w-5 text-primary" />
            )}
          </div>
          <p className="text-muted-foreground">{currentProfessional.role}</p>
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="shifts" data-testid="tab-shift-history">
            <Calendar className="h-4 w-4 mr-2" />
            Shift History
          </TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-payment-transactions">
            <DollarSign className="h-4 w-4 mr-2" />
            Payment Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="mt-6">
          <MyShiftsView professionalId={currentProfessional.id} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <MyEarningsView professionalId={currentProfessional.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfessionalCard({ professional }: { professional: ProfessionalWithBadges }) {
  const initials = `${professional.firstName[0]}${professional.lastName[0]}`;
  const rating = parseFloat(professional.rating || "0");

  return (
    <Link href={`/professionals/${professional.id}`}>
      <Card className="hover-elevate cursor-pointer" data-testid={`card-professional-${professional.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={professional.photoUrl || undefined} alt={`${professional.firstName} ${professional.lastName}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">
                  {professional.firstName} {professional.lastName}
                </h3>
                {professional.credentialsVerified && (
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{professional.role}</p>
              <div className="flex items-center gap-2 mt-1">
                {rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                  </div>
                )}
                {professional.specialty && (
                  <Badge variant="secondary" className="text-xs">
                    {professional.specialty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {professional.badges && professional.badges.length > 0 && (
            <div className="flex gap-2 mt-3 pt-3 border-t">
              {professional.badges.slice(0, 4).map((badge) => (
                <div
                  key={badge.id}
                  className={`flex items-center justify-center h-8 w-8 rounded-full ${badgeColors[badge.level] || "bg-muted"}`}
                  title={`${badgeLabels[badge.badgeType] || badge.badgeType} (${badge.level})`}
                >
                  <span className="text-white text-xs">
                    {badgeIcons[badge.badgeType]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ProfessionalDetail({ professional }: { professional: ProfessionalWithBadges }) {
  const initials = `${professional.firstName[0]}${professional.lastName[0]}`;
  const rating = parseFloat(professional.rating || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/professionals" data-testid="button-back-to-professionals">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Professionals
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={professional.photoUrl || undefined} alt={`${professional.firstName} ${professional.lastName}`} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">
                    {professional.firstName} {professional.lastName}
                  </h2>
                  {rating > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-5 w-5 fill-yellow-400" />
                      <span className="font-semibold">{rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {professional.credentialsVerified && (
                  <div className="flex items-center gap-1 text-primary text-sm mb-2">
                    <BadgeCheck className="h-4 w-4" />
                    <span>Credentials Verified</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {professional.email && (
                    <Badge variant="outline" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      {professional.email}
                    </Badge>
                  )}
                  {professional.phone && (
                    <Badge variant="outline" className="text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      {professional.phone}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              {professional.education && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    Education
                  </h4>
                  <p className="text-sm text-muted-foreground">{professional.education}</p>
                  {professional.graduationDate && (
                    <p className="text-xs text-muted-foreground">Graduation Date: {professional.graduationDate}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Profession
                </h4>
                <p className="text-sm text-muted-foreground">{professional.role}</p>
              </div>

              {professional.licenseNumber && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    License Information
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>License #: {professional.licenseNumber}</p>
                    {professional.licenseState && <p>Issued by State of: {professional.licenseState}</p>}
                    {professional.licenseYearIssued && <p>Year Issued: {professional.licenseYearIssued}</p>}
                  </div>
                </div>
              )}

              {professional.experienceRange && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Years of Experience</h4>
                  <p className="text-sm text-muted-foreground">{professional.experienceRange}</p>
                </div>
              )}

              {professional.software && professional.software.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Software</h4>
                  <div className="flex flex-wrap gap-1">
                    {professional.software.map((sw) => (
                      <Badge key={sw} variant="secondary" className="text-xs">
                        {sw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {professional.specialty && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    Specialty
                  </h4>
                  <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                  {professional.specialties && professional.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {professional.specialties.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {professional.badges && professional.badges.length > 0 ? (
                <div className="grid grid-cols-5 gap-4">
                  {professional.badges.map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center text-center">
                      <div
                        className={`flex items-center justify-center h-14 w-14 rounded-full ${badgeColors[badge.level] || "bg-muted"} mb-2`}
                      >
                        <span className="text-white">
                          {badgeIcons[badge.badgeType]}
                        </span>
                      </div>
                      <span className="text-xs font-medium">
                        {badgeLabels[badge.badgeType] || badge.badgeType}
                      </span>
                      {badge.count && badge.count > 0 && (
                        <span className="text-xs text-muted-foreground">{badge.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No badges earned yet
                </p>
              )}
              {professional.badges && professional.badges.some(b => b.level === "gold") && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
                  <p className="text-sm">
                    <span className="font-semibold text-yellow-700 dark:text-yellow-400">Gold:</span>{" "}
                    <span className="text-muted-foreground">
                      Perfect Attendance. This professional has shown unwavering commitment and never cancelled a shift late!
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {professional.procedures && professional.procedures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Experienced Procedures</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {professional.procedures.map((procedure) => (
                    <li key={procedure} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {procedure}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfessionalsHub() {
  const [, params] = useRoute("/professionals/:id");
  const professionalId = params?.id;
  const { currentPersona } = usePersona();

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: professionals, isLoading } = useQuery<ProfessionalWithBadges[]>({
    queryKey: ["/api/professionals"],
  });

  const { data: selectedProfessional, isLoading: isLoadingDetail } = useQuery<ProfessionalWithBadges>({
    queryKey: ["/api/professionals", professionalId],
    enabled: !!professionalId,
  });

  if (currentPersona === "professional") {
    return <ProfessionalPortalView />;
  }

  if (professionalId) {
    if (isLoadingDetail) {
      return (
        <div className="container max-w-5xl py-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
        </div>
      );
    }

    if (selectedProfessional) {
      return (
        <div className="container max-w-5xl py-6">
          <ProfessionalDetail professional={selectedProfessional} />
        </div>
      );
    }

    return (
      <div className="container max-w-5xl py-6">
        <p className="text-muted-foreground">Professional not found</p>
      </div>
    );
  }

  const filteredProfessionals = professionals?.filter((p) => {
    if (roleFilter !== "all" && p.role !== roleFilter) return false;
    if (specialtyFilter !== "all" && p.specialty !== specialtyFilter && !p.specialties?.includes(specialtyFilter)) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.role.toLowerCase().includes(query) ||
        p.specialty?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Professionals Hub"
          description="View and manage dental professionals in your network"
        />
        <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-professional">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Professional
        </Button>
      </div>

      <AddProfessionalDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search professionals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-professionals"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-role-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.values(StaffRoles).map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-specialty-filter">
            <SelectValue placeholder="Filter by specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {Object.values(DentalSpecialties).map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filteredProfessionals && filteredProfessionals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfessionals.map((professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Professionals Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || roleFilter !== "all" || specialtyFilter !== "all"
                ? "No professionals match your current filters. Try adjusting your search criteria."
                : "No professionals have been added to the system yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
