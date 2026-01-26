import { MarketingLayout } from "@/components/marketing-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Building2,
  Upload,
  Search,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "Connect Your Practice",
    description: "Register your dental practice and connect your Dentrix Ascend account. Our secure integration syncs your patient data automatically.",
    details: [
      "Quick practice registration",
      "Secure Dentrix Ascend integration",
      "Multi-location setup support",
      "Customizable practice settings",
    ],
  },
  {
    number: "02",
    icon: Upload,
    title: "Import Your Patients",
    description: "Import existing patients via CSV or let our Dentrix sync handle it. Add insurance policies and coverage details for each patient.",
    details: [
      "Bulk CSV import with smart parsing",
      "Automatic duplicate detection",
      "Insurance policy linking",
      "Manual entry for new patients",
    ],
  },
  {
    number: "03",
    icon: Search,
    title: "Verify Insurance",
    description: "Submit eligibility requests for dental and medical insurance. Our system queries DentalXchange and Availity in real-time.",
    details: [
      "Dual-insurance verification",
      "Real-time eligibility checks",
      "Automated background processing",
      "Detailed benefits breakdown",
    ],
  },
  {
    number: "04",
    icon: CheckCircle,
    title: "Streamline Operations",
    description: "Use verified data to prepare for appointments, manage billing, and coordinate with your team through the messaging center.",
    details: [
      "Pre-visit verification reports",
      "Patient billing portal",
      "Staff messaging and scheduling",
      "Analytics and reporting",
    ],
  },
];

export default function HowItWorks() {
  return (
    <MarketingLayout>
      <section className="py-16 lg:py-24" data-testid="section-how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              How EtherAI Works
            </h1>
            <p className="text-xl text-muted-foreground">
              Get up and running in minutes. Our streamlined workflow makes insurance 
              verification and practice management effortless.
            </p>
          </div>

          <div className="space-y-12 lg:space-y-16" data-testid="steps-container">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col lg:flex-row gap-8 lg:gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
                data-testid={`step-${index + 1}`}
              >
                <div className="flex-1 w-full">
                  <Card className="p-8">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
                          {step.number}
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                          <step.icon className="h-7 w-7 text-primary" />
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
                      <p className="text-muted-foreground mb-6">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center">
                    <ArrowRight className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-16 space-y-4">
            <p className="text-lg text-muted-foreground">
              Ready to streamline your practice operations?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" data-testid="button-request-demo">
                  Request a Demo
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" data-testid="button-view-pricing">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
