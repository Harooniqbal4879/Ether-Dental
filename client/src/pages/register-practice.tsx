import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, CheckCircle, ArrowLeft, Shield, Clock, Sparkles } from "lucide-react";
import { PracticeForm, type PracticeFormData } from "@/components/practice-form";

export default function RegisterPracticePage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const registerMutation = useMutation({
    mutationFn: async (data: PracticeFormData) => {
      return apiRequest("POST", "/api/practices/register", {
        name: data.name,
        address: data.address,
        city: data.city,
        stateCode: data.stateCode,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
        npiNumber: data.npiNumber,
        taxId: data.taxId,
        ownerFirstName: data.adminFirstName,
        ownerLastName: data.adminLastName,
        ownerEmail: data.adminEmail,
        ownerPhone: data.adminPhone,
        ownerPassword: data.adminPassword,
      });
    },
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.adminEmail);
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Registration failed", 
        description: error.message || "Please try again or contact support.",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: PracticeFormData) => {
    registerMutation.mutate(data);
  };

  const handleCancel = () => {
    window.location.href = "/";
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Registration Submitted!</CardTitle>
            <CardDescription className="text-base">
              Thank you for registering your practice with EtherAI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
              <h4 className="font-medium">What happens next?</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Our team will review your registration within 1-2 business days</li>
                <li>You'll receive an email at <strong>{submittedEmail}</strong> once approved</li>
                <li>After approval, you can log in and start using the platform</li>
              </ol>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/">
                <Button variant="default" className="w-full" data-testid="button-back-to-home">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" data-testid="link-back-home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to EtherAI
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-register-title">Register Your Practice</h1>
            <p className="text-muted-foreground text-lg">
              Join EtherAI and streamline your dental practice management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Secure & Compliant</h3>
                <p className="text-sm text-muted-foreground">HIPAA-compliant platform with enterprise-grade security</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
              <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">Smart verification and automated workflows</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
              <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Quick Approval</h3>
                <p className="text-sm text-muted-foreground">Get started within 1-2 business days</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Practice Registration Form</CardTitle>
              <CardDescription>
                Fill out the form below to register your dental practice. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PracticeForm
                mode="self_register"
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={registerMutation.isPending}
                showFooterInDialog={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
