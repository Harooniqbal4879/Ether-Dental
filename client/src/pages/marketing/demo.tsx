import { MarketingLayout } from "@/components/marketing-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";

interface DemoFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  practiceName: string;
  practiceSize: string;
  currentSoftware: string;
  message: string;
}

const benefits = [
  {
    icon: Calendar,
    title: "Personalized Demo",
    description: "See how EtherAI fits your specific practice needs",
  },
  {
    icon: Users,
    title: "Expert Guidance",
    description: "Get answers from our dental practice specialists",
  },
  {
    icon: Clock,
    title: "30-Minute Session",
    description: "Quick, focused overview of key features",
  },
  {
    icon: CheckCircle,
    title: "No Obligation",
    description: "Explore freely with no pressure to commit",
  },
];

export default function Demo() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DemoFormData>();

  const onSubmit = async (data: DemoFormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Demo request submitted:", data);
    setSubmitted(true);
    toast({
      title: "Demo Request Submitted",
      description: "We'll be in touch within 24 hours to schedule your demo.",
    });
  };

  if (submitted) {
    return (
      <MarketingLayout>
        <section className="py-16 lg:py-24" data-testid="section-demo-success">
          <div className="container mx-auto px-4">
            <Card className="max-w-xl mx-auto text-center">
              <CardContent className="p-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
                <p className="text-muted-foreground mb-6">
                  Your demo request has been received. A member of our team will 
                  reach out within 24 hours to schedule your personalized demonstration.
                </p>
                <p className="text-sm text-muted-foreground">
                  In the meantime, feel free to explore our{" "}
                  <a href="/features" className="text-primary hover:underline">features</a>{" "}
                  or{" "}
                  <a href="/faq" className="text-primary hover:underline">FAQ</a>.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <section className="py-16 lg:py-24" data-testid="section-demo">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                See EtherAI in Action
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Schedule a personalized demo with our team. We'll show you how 
                EtherAI can transform your practice's insurance verification 
                and patient management workflows.
              </p>

              <div className="grid sm:grid-cols-2 gap-6" data-testid="demo-benefits">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4" data-testid={`demo-benefit-${index}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Prefer to explore on your own?</strong>
                  {" "}You can also sign up for a 14-day free trial and test EtherAI 
                  with your own practice data.
                </p>
              </div>
            </div>

            <Card data-testid="card-demo-form">
              <CardHeader>
                <CardTitle>Request Your Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        {...register("firstName", { required: true })}
                        className={errors.firstName ? "border-destructive" : ""}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        {...register("lastName", { required: true })}
                        className={errors.lastName ? "border-destructive" : ""}
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                      className={errors.email ? "border-destructive" : ""}
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      data-testid="input-phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceName">Practice Name *</Label>
                    <Input
                      id="practiceName"
                      {...register("practiceName", { required: true })}
                      className={errors.practiceName ? "border-destructive" : ""}
                      data-testid="input-practice-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceSize">Practice Size</Label>
                    <Select onValueChange={(value) => register("practiceSize").onChange({ target: { value } })}>
                      <SelectTrigger data-testid="select-practice-size">
                        <SelectValue placeholder="Select practice size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo Practice</SelectItem>
                        <SelectItem value="small">2-5 Providers</SelectItem>
                        <SelectItem value="medium">6-15 Providers</SelectItem>
                        <SelectItem value="large">16-50 Providers</SelectItem>
                        <SelectItem value="dso">DSO / 50+ Providers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentSoftware">Current Practice Management Software</Label>
                    <Input
                      id="currentSoftware"
                      placeholder="e.g., Dentrix, Eaglesoft, Open Dental"
                      {...register("currentSoftware")}
                      data-testid="input-current-software"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">What are you hoping to accomplish?</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your verification challenges..."
                      rows={3}
                      {...register("message")}
                      data-testid="textarea-message"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    data-testid="button-submit-demo"
                  >
                    {isSubmitting ? "Submitting..." : "Request Demo"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting this form, you agree to receive communications from EtherAI. 
                    We respect your privacy and will never share your information.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
