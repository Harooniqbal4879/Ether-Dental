import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Loader2, CheckCircle, ArrowLeft, Shield, Clock, Sparkles } from "lucide-react";

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "District of Columbia" },
];

interface RegistrationFormData {
  name: string;
  address: string;
  city: string;
  stateCode: string;
  zipCode: string;
  phone: string;
  email: string;
  npiNumber: string;
  taxId: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  agreeToTerms: boolean;
}

export default function RegisterPracticePage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: "",
    address: "",
    city: "",
    stateCode: "",
    zipCode: "",
    phone: "",
    email: "",
    npiNumber: "",
    taxId: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPhone: "",
    agreeToTerms: false,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const { agreeToTerms, ...practiceData } = data;
      return apiRequest("POST", "/api/practices/register", {
        ...practiceData,
        registrationStatus: "pending",
        registrationSource: "self_registration",
      });
    },
    onSuccess: () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      toast({ title: "Please agree to the terms and conditions", variant: "destructive" });
      return;
    }
    registerMutation.mutate(formData);
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
                <li>You'll receive an email at <strong>{formData.ownerEmail}</strong> once approved</li>
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
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg border-b pb-2">Practice Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Practice Name *</Label>
                      <Input
                        id="name"
                        data-testid="input-reg-practice-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Sunny Pines Dental"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        data-testid="input-reg-address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main Street, Suite 100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        data-testid="input-reg-city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Los Angeles"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="stateCode">State *</Label>
                      <Select 
                        value={formData.stateCode} 
                        onValueChange={(value) => setFormData({ ...formData, stateCode: value })}
                        required
                      >
                        <SelectTrigger data-testid="select-reg-state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip Code *</Label>
                      <Input
                        id="zipCode"
                        data-testid="input-reg-zip"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder="90210"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Practice Phone *</Label>
                      <Input
                        id="phone"
                        data-testid="input-reg-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="email">Practice Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        data-testid="input-reg-practice-email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="info@yourpractice.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="npiNumber">NPI Number</Label>
                      <Input
                        id="npiNumber"
                        data-testid="input-reg-npi"
                        value={formData.npiNumber}
                        onChange={(e) => setFormData({ ...formData, npiNumber: e.target.value })}
                        placeholder="1234567890"
                      />
                      <p className="text-xs text-muted-foreground mt-1">10-digit National Provider Identifier</p>
                    </div>
                    <div>
                      <Label htmlFor="taxId">Tax ID (EIN)</Label>
                      <Input
                        id="taxId"
                        data-testid="input-reg-tax-id"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        placeholder="12-3456789"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Employer Identification Number</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg border-b pb-2">Practice Owner Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ownerFirstName">First Name *</Label>
                      <Input
                        id="ownerFirstName"
                        data-testid="input-reg-owner-first"
                        value={formData.ownerFirstName}
                        onChange={(e) => setFormData({ ...formData, ownerFirstName: e.target.value })}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerLastName">Last Name *</Label>
                      <Input
                        id="ownerLastName"
                        data-testid="input-reg-owner-last"
                        value={formData.ownerLastName}
                        onChange={(e) => setFormData({ ...formData, ownerLastName: e.target.value })}
                        placeholder="Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerEmail">Email Address *</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        data-testid="input-reg-owner-email"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        placeholder="john.doe@example.com"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">We'll send approval notifications here</p>
                    </div>
                    <div>
                      <Label htmlFor="ownerPhone">Phone Number *</Label>
                      <Input
                        id="ownerPhone"
                        data-testid="input-reg-owner-phone"
                        value={formData.ownerPhone}
                        onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                        placeholder="(555) 987-6543"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox 
                      id="terms" 
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                      data-testid="checkbox-agree-terms"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the Terms of Service and Privacy Policy *
                      </label>
                      <p className="text-xs text-muted-foreground">
                        By registering, you agree to our terms of service, privacy policy, and HIPAA Business Associate Agreement.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Link href="/">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={registerMutation.isPending || !formData.agreeToTerms}
                    data-testid="button-submit-registration"
                  >
                    {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Registration
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
