import { MarketingLayout } from "@/components/marketing-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ClipboardCheck,
  Users,
  Shield,
  Zap,
  Calendar,
  MessageSquare,
  FileText,
  Building2,
  Clock,
  RefreshCw,
  CreditCard,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Automated Insurance Verification",
    description: "Dual-insurance eligibility verification for both dental (DentalXchange) and medical (Availity) coverage with real-time status updates.",
  },
  {
    icon: Users,
    title: "Patient Management",
    description: "Comprehensive patient records with insurance policy linking, appointment tracking, and CSV import capabilities.",
  },
  {
    icon: Shield,
    title: "Benefits Breakdown",
    description: "Detailed benefits analysis including deductibles, maximums, coverage percentages, and waiting periods.",
  },
  {
    icon: Zap,
    title: "Professionals Hub",
    description: "Manage dental professionals with real-time online status, credential tracking, and direct messaging.",
  },
  {
    icon: Calendar,
    title: "Shift Management",
    description: "Multi-role shift postings, calendar views, and dual pricing models for flexible staffing solutions.",
  },
  {
    icon: MessageSquare,
    title: "Messaging Center",
    description: "Real-time messaging system for practice admins to communicate with hygienists and send shift invitations.",
  },
  {
    icon: FileText,
    title: "Claims Processing",
    description: "Integrated clearinghouse connectivity with Office Ally for streamlined claims submission.",
  },
  {
    icon: Building2,
    title: "Multi-Location Support",
    description: "Manage multiple office locations with assignable shifts, appointments, and location-specific settings.",
  },
  {
    icon: Clock,
    title: "Appointment Tracking",
    description: "Track upcoming appointments with insurance verification status for complete pre-visit preparation.",
  },
  {
    icon: RefreshCw,
    title: "Dentrix Ascend Sync",
    description: "Practice-level integration with Dentrix Ascend for seamless patient data synchronization.",
  },
  {
    icon: CreditCard,
    title: "Patient Billing Portal",
    description: "Enable patients to view bills and make payments through a secure self-service portal.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Comprehensive insights into verification rates, pending tasks, and practice performance metrics.",
  },
];

export default function Features() {
  return (
    <MarketingLayout>
      <section className="py-16 lg:py-24" data-testid="section-features-hero">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-features-title">
              Powerful Features for Modern Dental Practices
            </h1>
            <p className="text-xl text-muted-foreground" data-testid="text-features-description">
              Everything you need to streamline insurance verification, manage patients, 
              and optimize your practice operations in one comprehensive platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="grid-features">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/demo">
              <Button size="lg" data-testid="button-see-demo">
                See It In Action
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
