import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export interface PracticeFormData {
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
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  adminConfirmPassword: string;
  agreeToTerms?: boolean;
}

interface PracticeFormProps {
  mode: "admin_create" | "admin_edit" | "self_register";
  initialData?: Partial<PracticeFormData>;
  onSubmit: (data: PracticeFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  showFooterInDialog?: boolean;
}

export function PracticeForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  showFooterInDialog = true,
}: PracticeFormProps) {
  const [formData, setFormData] = useState<PracticeFormData>({
    name: initialData?.name || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    stateCode: initialData?.stateCode || "",
    zipCode: initialData?.zipCode || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    npiNumber: initialData?.npiNumber || "",
    taxId: initialData?.taxId || "",
    ownerFirstName: initialData?.ownerFirstName || "",
    ownerLastName: initialData?.ownerLastName || "",
    ownerEmail: initialData?.ownerEmail || "",
    ownerPhone: initialData?.ownerPhone || "",
    adminFirstName: initialData?.adminFirstName || "",
    adminLastName: initialData?.adminLastName || "",
    adminEmail: initialData?.adminEmail || "",
    adminPhone: initialData?.adminPhone || "",
    adminPassword: "",
    adminConfirmPassword: "",
    agreeToTerms: false,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordError, setPasswordError] = useState("");

  const getStepConfig = () => {
    if (mode === "self_register") {
      return {
        totalSteps: 2,
        stepLabels: ["Practice Info", "Practice Admin"],
      };
    } else if (mode === "admin_edit") {
      return {
        totalSteps: 2,
        stepLabels: ["Practice Info", "Owner Info"],
      };
    } else {
      return {
        totalSteps: 3,
        stepLabels: ["Practice Info", "Owner Info", "Practice Admin"],
      };
    }
  };

  const { totalSteps, stepLabels } = getStepConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.adminPassword !== formData.adminConfirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    onSubmit(formData);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return formData.name.trim() !== "";
    }
    
    if (mode === "self_register" && currentStep === 2) {
      const hasRequiredFields =
        formData.adminEmail.trim() !== "" &&
        formData.adminFirstName.trim() !== "" &&
        formData.adminLastName.trim() !== "" &&
        formData.adminPassword.length >= 8 &&
        formData.adminPassword === formData.adminConfirmPassword &&
        formData.agreeToTerms === true;
      return hasRequiredFields;
    }
    
    if (mode === "admin_create" && currentStep === 2) {
      return true;
    }
    
    if (mode === "admin_create" && currentStep === 3) {
      const hasRequiredFields =
        formData.adminEmail.trim() !== "" &&
        formData.adminFirstName.trim() !== "" &&
        formData.adminLastName.trim() !== "" &&
        formData.adminPassword.length >= 6 &&
        formData.adminPassword === formData.adminConfirmPassword;
      return hasRequiredFields;
    }
    
    if (mode === "admin_edit" && currentStep === 2) {
      return true;
    }
    
    return true;
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {stepLabels.map((label, index) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep === index + 1
                ? "bg-primary text-primary-foreground"
                : currentStep > index + 1
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {currentStep > index + 1 ? <Check className="h-4 w-4" /> : index + 1}
          </div>
          <span
            className={`text-sm ${
              currentStep === index + 1 ? "font-medium" : "text-muted-foreground"
            }`}
          >
            {label}
          </span>
          {index < stepLabels.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                currentStep > index + 1 ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderPracticeInfoStep = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">Practice Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <Label htmlFor="name">Practice Name *</Label>
          <Input
            id="name"
            data-testid="input-practice-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Sunny Pines Dental"
            required
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            data-testid="input-practice-address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main Street"
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            data-testid="input-practice-city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Los Angeles"
          />
        </div>
        <div>
          <Label htmlFor="stateCode">State</Label>
          <Select
            value={formData.stateCode}
            onValueChange={(value) => setFormData({ ...formData, stateCode: value })}
          >
            <SelectTrigger data-testid="select-practice-state">
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
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            data-testid="input-practice-zip"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            placeholder="90210"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            data-testid="input-practice-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <Label htmlFor="email">Practice Email</Label>
          <Input
            id="email"
            type="email"
            data-testid="input-practice-email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="info@sunnypinesdental.com"
          />
        </div>
        <div>
          <Label htmlFor="npiNumber">NPI Number</Label>
          <Input
            id="npiNumber"
            data-testid="input-practice-npi"
            value={formData.npiNumber}
            onChange={(e) => setFormData({ ...formData, npiNumber: e.target.value })}
            placeholder="1234567890"
          />
        </div>
        <div>
          <Label htmlFor="taxId">Tax ID</Label>
          <Input
            id="taxId"
            data-testid="input-practice-tax-id"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            placeholder="12-3456789"
          />
        </div>
      </div>
    </div>
  );

  const renderOwnerInfoStep = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">Owner Information</h4>
      <p className="text-sm text-muted-foreground">The practice owner details (optional)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ownerFirstName">First Name</Label>
          <Input
            id="ownerFirstName"
            data-testid="input-owner-first-name"
            value={formData.ownerFirstName}
            onChange={(e) => setFormData({ ...formData, ownerFirstName: e.target.value })}
            placeholder="John"
          />
        </div>
        <div>
          <Label htmlFor="ownerLastName">Last Name</Label>
          <Input
            id="ownerLastName"
            data-testid="input-owner-last-name"
            value={formData.ownerLastName}
            onChange={(e) => setFormData({ ...formData, ownerLastName: e.target.value })}
            placeholder="Doe"
          />
        </div>
        <div>
          <Label htmlFor="ownerEmail">Owner Email</Label>
          <Input
            id="ownerEmail"
            type="email"
            data-testid="input-owner-email"
            value={formData.ownerEmail}
            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
            placeholder="john.doe@example.com"
          />
        </div>
        <div>
          <Label htmlFor="ownerPhone">Owner Phone</Label>
          <Input
            id="ownerPhone"
            data-testid="input-owner-phone"
            value={formData.ownerPhone}
            onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
            placeholder="(555) 987-6543"
          />
        </div>
      </div>
    </div>
  );

  const renderAdminStep = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">Practice Administrator</h4>
      <p className="text-sm text-muted-foreground">
        {mode === "self_register"
          ? "Your account details for managing this practice"
          : "Create an administrator account who will manage this practice"}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="adminFirstName">First Name *</Label>
          <Input
            id="adminFirstName"
            data-testid="input-admin-first-name"
            value={formData.adminFirstName}
            onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
            placeholder="Jane"
            required
          />
        </div>
        <div>
          <Label htmlFor="adminLastName">Last Name *</Label>
          <Input
            id="adminLastName"
            data-testid="input-admin-last-name"
            value={formData.adminLastName}
            onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
            placeholder="Smith"
            required
          />
        </div>
        <div>
          <Label htmlFor="adminEmail">Email *</Label>
          <Input
            id="adminEmail"
            type="email"
            data-testid="input-admin-email"
            value={formData.adminEmail}
            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            placeholder="admin@sunnypinesdental.com"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">This will be your login email</p>
        </div>
        <div>
          <Label htmlFor="adminPhone">Phone</Label>
          <Input
            id="adminPhone"
            data-testid="input-admin-phone"
            value={formData.adminPhone}
            onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <Label htmlFor="adminPassword">Password *</Label>
          <Input
            id="adminPassword"
            type="password"
            data-testid="input-admin-password"
            value={formData.adminPassword}
            onChange={(e) => {
              setFormData({ ...formData, adminPassword: e.target.value });
              setPasswordError("");
            }}
            placeholder={mode === "self_register" ? "Min 8 characters" : "Min 6 characters"}
            required
          />
        </div>
        <div>
          <Label htmlFor="adminConfirmPassword">Confirm Password *</Label>
          <Input
            id="adminConfirmPassword"
            type="password"
            data-testid="input-admin-confirm-password"
            value={formData.adminConfirmPassword}
            onChange={(e) => {
              setFormData({ ...formData, adminConfirmPassword: e.target.value });
              setPasswordError("");
            }}
            placeholder="Re-enter password"
            required
          />
          {passwordError && (
            <p className="text-sm text-destructive mt-1">{passwordError}</p>
          )}
        </div>
      </div>

      {mode === "self_register" && (
        <div className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-muted/50 rounded-lg mt-4">
          <Checkbox
            id="agreeToTerms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, agreeToTerms: checked === true })
            }
            data-testid="checkbox-agree-terms"
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="agreeToTerms" className="text-sm font-medium leading-none cursor-pointer">
              I agree to the Terms of Service and Privacy Policy *
            </Label>
            <p className="text-xs text-muted-foreground">
              By registering, you agree to our terms of service, privacy policy, and HIPAA Business Associate Agreement.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    if (currentStep === 1) {
      return renderPracticeInfoStep();
    }

    if (mode === "self_register") {
      if (currentStep === 2) return renderAdminStep();
    } else if (mode === "admin_edit") {
      if (currentStep === 2) return renderOwnerInfoStep();
    } else {
      if (currentStep === 2) return renderOwnerInfoStep();
      if (currentStep === 3) return renderAdminStep();
    }

    return null;
  };

  const getSubmitButtonText = () => {
    if (mode === "self_register") return "Submit Registration";
    if (mode === "admin_edit") return "Save Changes";
    return "Create Practice";
  };

  const renderFooter = () => (
    <div className={`flex ${showFooterInDialog ? "justify-end" : "justify-between"} gap-4 mt-6`}>
      {!showFooterInDialog && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      )}
      <div className="flex gap-2">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            data-testid="button-step-back"
          >
            Back
          </Button>
        )}
        {showFooterInDialog && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        {currentStep < totalSteps ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!isStepValid()}
            data-testid="button-step-next"
          >
            Next
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting || !isStepValid()}
            data-testid="button-submit-practice"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getSubmitButtonText()}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderStepIndicator()}
      {renderCurrentStep()}
      {renderFooter()}
    </form>
  );
}
