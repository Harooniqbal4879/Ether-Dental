import { MarketingLayout } from "@/components/marketing-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

const demoFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  practiceName: z.string().min(1, "Practice name is required"),
  practiceSize: z.string().optional(),
  currentSoftware: z.string().optional(),
  message: z.string().optional(),
});

type DemoFormData = z.infer<typeof demoFormSchema>;

const benefits = [
  {
    icon: Calendar,
    title: "Personalized Demo",
    description: "See how EtherAI-Dental fits your specific practice needs",
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

  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      practiceName: "",
      practiceSize: "",
      currentSoftware: "",
      message: "",
    },
  });

  const onSubmit = async (data: DemoFormData) => {
    try {
      await apiRequest("POST", "/api/demo-requests", data);
      setSubmitted(true);
      toast({
        title: "Demo Request Submitted",
        description: "We'll be in touch within 24 hours to schedule your demo.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
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
                <h1 className="text-2xl font-bold mb-4" data-testid="text-thank-you">Thank You!</h1>
                <p className="text-muted-foreground mb-6" data-testid="text-success-message">
                  Your demo request has been received. A member of our team will 
                  reach out within 24 hours to schedule your personalized demonstration.
                </p>
                <p className="text-sm text-muted-foreground">
                  In the meantime, feel free to explore our{" "}
                  <a href="/features" className="text-primary hover:underline" data-testid="link-features">features</a>{" "}
                  or{" "}
                  <a href="/faq" className="text-primary hover:underline" data-testid="link-faq">FAQ</a>.
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
              <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-demo-title">
                See EtherAI-Dental in Action
              </h1>
              <p className="text-xl text-muted-foreground mb-8" data-testid="text-demo-description">
                Schedule a personalized demo with our team. We'll show you how 
                EtherAI-Dental can transform your practice's insurance verification 
                and patient management workflows.
              </p>

              <div className="grid sm:grid-cols-2 gap-6" data-testid="demo-benefits">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4" data-testid={`demo-benefit-${index}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold" data-testid={`text-benefit-title-${index}`}>{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 bg-muted/30 rounded-lg" data-testid="box-trial-info">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Prefer to explore on your own?</strong>
                  {" "}You can also sign up for a 14-day free trial and test EtherAI-Dental 
                  with your own practice data.
                </p>
              </div>
            </div>

            <Card data-testid="card-demo-form">
              <CardHeader>
                <CardTitle data-testid="text-form-title">Request Your Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage data-testid="error-first-name" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage data-testid="error-last-name" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage data-testid="error-email" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="practiceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Practice Name *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-practice-name" />
                          </FormControl>
                          <FormMessage data-testid="error-practice-name" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="practiceSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Practice Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-practice-size">
                                <SelectValue placeholder="Select practice size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="solo" data-testid="option-solo">Solo Practice</SelectItem>
                              <SelectItem value="small" data-testid="option-small">2-5 Providers</SelectItem>
                              <SelectItem value="medium" data-testid="option-medium">6-15 Providers</SelectItem>
                              <SelectItem value="large" data-testid="option-large">16-50 Providers</SelectItem>
                              <SelectItem value="dso" data-testid="option-dso">DSO / 50+ Providers</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentSoftware"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Practice Management Software</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Dentrix, Eaglesoft, Open Dental"
                              {...field}
                              data-testid="input-current-software"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are you hoping to accomplish?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your verification challenges..."
                              rows={3}
                              {...field}
                              data-testid="textarea-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={form.formState.isSubmitting}
                      data-testid="button-submit-demo"
                    >
                      {form.formState.isSubmitting ? "Submitting..." : "Request Demo"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center" data-testid="text-privacy-notice">
                      By submitting this form, you agree to receive communications from EtherAI-Dental. 
                      We respect your privacy and will never share your information.
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
