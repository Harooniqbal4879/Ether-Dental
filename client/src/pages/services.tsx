import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceStatus = "active" | "inactive" | "pending";

interface ServiceSubscription {
  service: string;
  status: ServiceStatus;
  tier?: string;
  monthlyProduction?: number;
}

const mockSubscriptions: ServiceSubscription[] = [
  { service: "verification", status: "active", tier: "per_patient" },
  { service: "insurance_billing", status: "inactive" },
  { service: "patient_billing", status: "inactive" },
];

function StatusBadge({ status }: { status: ServiceStatus }) {
  const styles = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    inactive: "bg-muted text-muted-foreground",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  };
  
  const labels = {
    active: "Active",
    inactive: "Not Subscribed",
    pending: "Pending Setup",
  };
  
  return (
    <Badge className={cn("text-xs", styles[status])} data-testid={`badge-status-${status}`}>
      {labels[status]}
    </Badge>
  );
}

function InsuranceVerificationCard() {
  const subscription = mockSubscriptions.find(s => s.service === "verification");
  const isActive = subscription?.status === "active";
  
  return (
    <Card className="flex flex-col" data-testid="card-insurance-verification">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Insurance Verification</CardTitle>
              <CardDescription>Self-service eligibility & benefits</CardDescription>
            </div>
          </div>
          <StatusBadge status={subscription?.status || "inactive"} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>Custom breakdowns tailored to your office coding needs</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>Saved directly to your PMS</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>Verifying ahead of your schedule 7 days with accommodations for walk-ins</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>Coverage percentages and fee schedules updated directly in your PMS</span>
          </li>
        </ul>
        
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-3">Pricing: $99/mo + per patient</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Full coverage breakdown</span>
              <span className="font-medium">$4.99</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Eligibility verification only</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Failed eligibility verification</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expedited verifications</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        {isActive ? (
          <Button variant="outline" className="w-full" data-testid="button-manage-verification">
            Manage Subscription
          </Button>
        ) : (
          <Button className="w-full" data-testid="button-subscribe-verification">
            Subscribe Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function InsuranceBillingCard() {
  const subscription = mockSubscriptions.find(s => s.service === "insurance_billing");
  const isActive = subscription?.status === "active";
  
  return (
    <Card className="flex flex-col" data-testid="card-insurance-billing">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Insurance Billing</CardTitle>
              <CardDescription>Remote claims management</CardDescription>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
            Remote Service
          </Badge>
        </div>
        <div className="mt-2">
          <StatusBadge status={subscription?.status || "inactive"} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
            <span>Daily claims submission with rejections review</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
            <span>Accurate payment posting and adjustments</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
            <span>Proactive aging follow-up with detailed notes</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
            <span>Full appeals and denials management</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
            <span>Daily, weekly, and monthly tracking reports</span>
          </li>
        </ul>
        
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-3">Pricing per ins. collections</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Under $40,000</span>
              <span className="font-medium">$1,199/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">$40,000–$99,999</span>
              <span className="font-medium">3.00%*</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">$100,000–$149,999</span>
              <span className="font-medium">2.75%*</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Above $150,000</span>
              <span className="font-medium">2.25%*</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        {isActive ? (
          <Button variant="outline" className="w-full" data-testid="button-manage-insurance-billing">
            Manage Subscription
          </Button>
        ) : (
          <Button className="w-full" data-testid="button-subscribe-insurance-billing">
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function PatientBillingCard() {
  const subscription = mockSubscriptions.find(s => s.service === "patient_billing");
  const isActive = subscription?.status === "active";
  
  return (
    <Card className="flex flex-col" data-testid="card-patient-billing">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Patient Billing</CardTitle>
              <CardDescription>Remote collections & follow-up</CardDescription>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
            Remote Service
          </Badge>
        </div>
        <div className="mt-2">
          <StatusBadge status={subscription?.status || "inactive"} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <span>Electronic statements generated through your PMS</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <span>Personalized follow-up letters at 30, 60, and 90 day intervals</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <span>Up to 3 patient calls between each letter cycle</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <span>Complete call documentation added to patient records</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <span>Guidance on next steps for accounts that remain unpaid</span>
          </li>
        </ul>
        
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-3">Pricing per net production</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Under $100,000</span>
              <span className="font-medium">$999/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">$100,000–$249,999</span>
              <span className="font-medium">$1,299/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">$250,000–$499,999</span>
              <span className="font-medium">$1,499/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Above $500,000</span>
              <span className="font-medium">0.3%*</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        {isActive ? (
          <Button variant="outline" className="w-full" data-testid="button-manage-patient-billing">
            Manage Subscription
          </Button>
        ) : (
          <Button className="w-full" data-testid="button-subscribe-patient-billing">
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function HowItWorksSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2" data-testid="text-how-it-works">How It Works</h2>
        <p className="text-muted-foreground">Our hybrid model gives you flexibility - handle what you can, outsource the rest.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                1
              </div>
              <CardTitle className="text-base">Self-Service Verification</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your front desk handles insurance verification directly in the platform. Run eligibility checks, view benefits breakdowns, and track verification status.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">Included Free</Badge>
              <span className="text-muted-foreground">with basic platform access</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 font-semibold">
                2
              </div>
              <CardTitle className="text-base">Remote Billing Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our expert team handles complex claims, payment posting, denials management, and patient collections. You focus on patient care.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 text-xs">
                Subscription
              </Badge>
              <span className="text-muted-foreground">based on your production</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">The Best of Both Worlds</h3>
              <p className="text-sm text-muted-foreground">
                Keep routine verifications in-house while we handle complex billing, appeals, and collections. 
                All claim statuses and patient account updates sync back to your dashboard automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("services");
  
  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Services"
        description="Choose the services that fit your practice needs"
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="services" data-testid="tab-services">Available Services</TabsTrigger>
          <TabsTrigger value="how-it-works" data-testid="tab-how-it-works">How It Works</TabsTrigger>
          <TabsTrigger value="my-subscriptions" data-testid="tab-my-subscriptions">My Subscriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="services">
          <div className="grid lg:grid-cols-3 gap-6">
            <InsuranceVerificationCard />
            <InsuranceBillingCard />
            <PatientBillingCard />
          </div>
          
          <p className="text-xs text-muted-foreground mt-6">
            * Percentage-based pricing applies to monthly insurance collections or net production. Minimum monthly fees may apply.
          </p>
        </TabsContent>
        
        <TabsContent value="how-it-works">
          <HowItWorksSection />
        </TabsContent>
        
        <TabsContent value="my-subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Your Active Subscriptions</CardTitle>
              <CardDescription>Manage your service subscriptions and billing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSubscriptions.map((sub) => (
                  <div key={sub.service} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {sub.service === "verification" && <Shield className="h-5 w-5 text-primary" />}
                      {sub.service === "insurance_billing" && <FileText className="h-5 w-5 text-blue-600" />}
                      {sub.service === "patient_billing" && <TrendingUp className="h-5 w-5 text-green-600" />}
                      <div>
                        <p className="font-medium capitalize">
                          {sub.service.replace(/_/g, " ")}
                        </p>
                        {sub.status === "active" && (
                          <p className="text-xs text-muted-foreground">
                            {sub.tier === "per_patient" ? "$99/mo + per patient" : "Contact for pricing"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={sub.status} />
                      {sub.status === "active" ? (
                        <Button variant="outline" size="sm" data-testid={`button-manage-${sub.service}`}>
                          Manage
                        </Button>
                      ) : (
                        <Button size="sm" data-testid={`button-activate-${sub.service}`}>
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
