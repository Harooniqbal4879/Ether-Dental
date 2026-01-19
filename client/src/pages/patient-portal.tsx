import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  History,
  User,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, PatientPayment } from "@shared/schema";

function formatCurrency(amount: string | number | null | undefined): string {
  if (!amount) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    refunded: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <Badge className={cn("text-xs capitalize", styles[status] || styles.pending)} data-testid={`badge-payment-${status}`}>
      {status}
    </Badge>
  );
}

function PaymentSuccess() {
  const [verifying, setVerifying] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function verifyPayment() {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      
      if (sessionId) {
        try {
          const res = await fetch(`/api/portal/verify-payment/${sessionId}`);
          const data = await res.json();
          if (data.amount) {
            setPaymentAmount(data.amount);
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
        }
      }
      setVerifying(false);
    }
    
    verifyPayment();
  }, []);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            {paymentAmount 
              ? `Your payment of ${formatCurrency(paymentAmount)} has been processed.`
              : "Thank you for your payment."
            } A confirmation has been sent to your email.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => window.location.href = "/portal"} data-testid="button-back-to-portal">
            Back to Portal
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function PatientLookup({ onPatientSelect }: { onPatientSelect: (patient: Patient) => void }) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const handleSelect = () => {
    const patient = patients?.find(p => p.id === selectedPatientId);
    if (patient) {
      onPatientSelect(patient);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Patient Portal</CardTitle>
          <CardDescription>
            Access your billing information and make payments securely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-select">Select Patient</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger id="patient-select" data-testid="select-patient">
                <SelectValue placeholder="Choose a patient..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                ) : (
                  patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id} data-testid={`option-patient-${patient.id}`}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSelect}
            disabled={!selectedPatientId}
            data-testid="button-access-portal"
          >
            Access My Account
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function BillingDashboard({ patient }: { patient: Patient }) {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const { toast } = useToast();

  const { data: billing, isLoading: billingLoading } = useQuery({
    queryKey: ["/api/portal/billing", patient.id],
    queryFn: async () => {
      const res = await fetch(`/api/portal/billing/${patient.id}`);
      if (!res.ok) throw new Error("Failed to fetch billing");
      return res.json();
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PatientPayment[]>({
    queryKey: ["/api/portal/payments", patient.id],
    queryFn: async () => {
      const res = await fetch(`/api/portal/payments/${patient.id}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async (data: { patientId: string; amount: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/portal/create-checkout", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Payment Error",
        description: "Failed to create payment session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    createCheckoutMutation.mutate({
      patientId: patient.id,
      amount: paymentAmount,
      description: `Balance payment for ${patient.firstName} ${patient.lastName}`,
    });
  };

  const handlePayFullBalance = () => {
    const balance = parseFloat(billing?.patientPortion || "0");
    if (balance <= 0) {
      toast({
        title: "No Balance Due",
        description: "Your account has no outstanding balance.",
      });
      return;
    }

    createCheckoutMutation.mutate({
      patientId: patient.id,
      amount: balance.toString(),
      description: `Full balance payment for ${patient.firstName} ${patient.lastName}`,
    });
  };

  const patientBalance = parseFloat(billing?.patientPortion || "0");

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-patient-name">
              Welcome, {patient.firstName}!
            </h1>
            <p className="text-muted-foreground">Manage your account and payments</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()} data-testid="button-switch-patient">
            <User className="h-4 w-4 mr-2" />
            Switch Patient
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card data-testid="card-total-balance">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold" data-testid="text-total-balance">
                    {billingLoading ? "..." : formatCurrency(billing?.totalBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-insurance-portion">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Insurance Covers</p>
                  <p className="text-2xl font-bold" data-testid="text-insurance-portion">
                    {billingLoading ? "..." : formatCurrency(billing?.insurancePortion)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(patientBalance > 0 && "border-primary")} data-testid="card-your-portion">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  patientBalance > 0 
                    ? "bg-primary/10" 
                    : "bg-green-100 dark:bg-green-900"
                )}>
                  <CreditCard className={cn(
                    "h-6 w-6",
                    patientBalance > 0 
                      ? "text-primary" 
                      : "text-green-600 dark:text-green-400"
                  )} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Portion</p>
                  <p className="text-2xl font-bold" data-testid="text-patient-portion">
                    {billingLoading ? "..." : formatCurrency(billing?.patientPortion)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card data-testid="card-make-payment">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Make a Payment
              </CardTitle>
              <CardDescription>
                Pay your balance securely with credit card
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientBalance > 0 ? (
                <>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handlePayFullBalance}
                    disabled={createCheckoutMutation.isPending}
                    data-testid="button-pay-full-balance"
                  >
                    {createCheckoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Pay Full Balance ({formatCurrency(patientBalance)})
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or pay a custom amount</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="pl-9"
                        min="0.01"
                        step="0.01"
                        data-testid="input-payment-amount"
                      />
                    </div>
                    <Button 
                      onClick={handlePayment}
                      disabled={!paymentAmount || createCheckoutMutation.isPending}
                      data-testid="button-pay-custom"
                    >
                      Pay
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="font-medium">No Balance Due</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is current. Thank you!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-payment-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                Your recent payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No payment history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 rounded-lg border"
                      data-testid={`payment-row-${payment.id}`}
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Secure Payments</p>
                <p className="text-sm text-muted-foreground">
                  All payments are processed securely through Stripe. Your card information is never stored on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PatientPortal() {
  const [location] = useLocation();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Check for success/canceled URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get("success") === "true";
  const isCanceled = urlParams.get("canceled") === "true";

  if (isSuccess) {
    return <PaymentSuccess />;
  }

  if (!selectedPatient) {
    return <PatientLookup onPatientSelect={setSelectedPatient} />;
  }

  return <BillingDashboard patient={selectedPatient} />;
}
