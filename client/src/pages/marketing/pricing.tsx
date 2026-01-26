import { MarketingLayout } from "@/components/marketing-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    description: "For small practices getting started with automated verification",
    price: "$199",
    period: "/month",
    features: [
      "Up to 200 verifications/month",
      "1 practice location",
      "Basic patient management",
      "Dental insurance verification",
      "Email support",
      "Standard reporting",
    ],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Professional",
    description: "For growing practices that need comprehensive features",
    price: "$399",
    period: "/month",
    features: [
      "Up to 500 verifications/month",
      "Up to 3 practice locations",
      "Full patient management",
      "Dental + Medical verification",
      "Messaging center",
      "Priority support",
      "Advanced reporting",
      "CSV import/export",
    ],
    highlighted: true,
    cta: "Start Free Trial",
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    description: "For large practices and DSOs with custom requirements",
    price: "Custom",
    period: "",
    features: [
      "Unlimited verifications",
      "Unlimited locations",
      "All Professional features",
      "Dentrix Ascend integration",
      "Professionals Hub",
      "Shift management",
      "Patient billing portal",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    highlighted: false,
    cta: "Contact Sales",
  },
];

const addOns = [
  { name: "Additional Locations", price: "$50/location/month" },
  { name: "Extra Verifications (100)", price: "$75/month" },
  { name: "Remote Billing Service", price: "Starting at $299/month" },
  { name: "Premium Support", price: "$99/month" },
];

export default function Pricing() {
  return (
    <MarketingLayout>
      <section className="py-16 lg:py-24" data-testid="section-pricing">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-pricing-title">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground" data-testid="text-pricing-description">
              Choose the plan that fits your practice. All plans include a 14-day free trial 
              with no credit card required.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto mb-20" data-testid="grid-pricing">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.highlighted ? "border-primary shadow-lg" : ""}`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.name === "Enterprise" ? "/demo" : "/"}>
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                      data-testid={`button-plan-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-3xl mx-auto" data-testid="addons-section">
            <h2 className="text-2xl font-bold text-center mb-8">Optional Add-Ons</h2>
            <Card>
              <CardContent className="p-0">
                {addOns.map((addon, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 border-b last:border-0"
                    data-testid={`addon-${index}`}
                  >
                    <span className="font-medium">{addon.name}</span>
                    <span className="text-muted-foreground">{addon.price}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16 space-y-4">
            <p className="text-lg text-muted-foreground">
              Have questions about which plan is right for you?
            </p>
            <Link href="/demo">
              <Button size="lg" variant="outline" data-testid="button-talk-to-sales">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
