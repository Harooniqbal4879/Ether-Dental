import { MarketingLayout } from "@/components/marketing-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Shield,
  HeartPulse,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save Hours Every Week",
    description: "Automate time-consuming insurance verification calls and manual data entry. Staff can focus on patient care instead of paperwork.",
    stats: "Up to 80% reduction in verification time",
  },
  {
    icon: DollarSign,
    title: "Reduce Claim Denials",
    description: "Verify coverage before appointments to prevent surprise denials. Know exactly what's covered and what patients owe upfront.",
    stats: "35% fewer claim rejections",
  },
  {
    icon: TrendingUp,
    title: "Increase Practice Revenue",
    description: "Capture more billable services with accurate benefits information. Optimize treatment planning based on actual coverage.",
    stats: "15-20% revenue improvement",
  },
  {
    icon: Users,
    title: "Improve Patient Experience",
    description: "Provide accurate cost estimates before treatment. No more billing surprises means happier, more trusting patients.",
    stats: "40% improvement in patient satisfaction",
  },
  {
    icon: Shield,
    title: "HIPAA Compliant Security",
    description: "Enterprise-grade security protects patient data. All information is encrypted in transit and at rest.",
    stats: "SOC 2 Type II Certified",
  },
  {
    icon: HeartPulse,
    title: "Designed for Dental",
    description: "Built specifically for dental practices with features like dual-insurance handling, waiting periods, and frequency limitations.",
    stats: "Purpose-built for dentistry",
  },
];

const comparisonItems = [
  { feature: "Insurance verification", before: "15-30 min per patient", after: "2-3 minutes" },
  { feature: "Benefits breakdown", before: "Manual interpretation", after: "Instant, automated" },
  { feature: "Claim denials", before: "10-15% of claims", after: "Under 5%" },
  { feature: "Staff time on phones", before: "3-4 hours daily", after: "30 minutes" },
  { feature: "Patient cost estimates", before: "Often inaccurate", after: "Precise, upfront" },
  { feature: "Multi-location management", before: "Separate systems", after: "Unified platform" },
];

export default function Benefits() {
  return (
    <MarketingLayout>
      <section className="py-16 lg:py-24" data-testid="section-benefits">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Transform Your Practice Operations
            </h1>
            <p className="text-xl text-muted-foreground">
              See how EtherAI helps dental practices save time, reduce errors, 
              and improve patient satisfaction.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-20" data-testid="grid-benefits">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-benefit-${index}`}>
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground mb-4">{benefit.description}</p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <CheckCircle className="h-4 w-4" />
                    {benefit.stats}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-4xl mx-auto" data-testid="comparison-section">
            <h2 className="text-3xl font-bold text-center mb-8">
              Before vs. After EtherAI
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-3 gap-4 p-4 border-b bg-muted/30 font-semibold">
                  <div>Task</div>
                  <div className="text-center">Before</div>
                  <div className="text-center">After</div>
                </div>
                {comparisonItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-4 p-4 border-b last:border-0 items-center"
                    data-testid={`comparison-row-${index}`}
                  >
                    <div className="font-medium">{item.feature}</div>
                    <div className="text-center text-muted-foreground text-sm">{item.before}</div>
                    <div className="text-center text-primary text-sm font-medium flex items-center justify-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      {item.after}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16">
            <Link href="/demo">
              <Button size="lg" data-testid="button-see-benefits">
                Experience the Difference
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
