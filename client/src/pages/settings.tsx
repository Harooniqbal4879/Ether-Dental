import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { useTheme } from "@/components/theme-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Moon,
  Sun,
  Monitor,
  Building2,
  Bell,
  Clock,
  Shield,
  Plus,
  Trash2,
  Plug,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image,
  Users,
  Coffee,
  Settings2,
  CreditCard,
  Minus,
  MapPin,
  Phone,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClearinghouseConfig, InsertClearinghouseConfig } from "@shared/schema";

const CLEARINGHOUSE_OPTIONS = [
  { value: "change_healthcare", label: "Change Healthcare" },
  { value: "availity", label: "Availity" },
  { value: "trizetto", label: "Trizetto" },
  { value: "office_ally", label: "Office Ally" },
  { value: "waystar", label: "Waystar" },
] as const;

const PRACTICE_MANAGEMENT_SOFTWARE = [
  "Dentrix",
  "Dentrix Ascend",
  "Eaglesoft",
  "Open Dental",
  "Curve Dental",
  "Carestream Dental",
  "Patterson Dental",
  "Other",
];

const XRAY_SOFTWARE = [
  "Dexis",
  "Schick",
  "Carestream",
  "Sirona",
  "Patterson Imaging",
  "Planmeca",
  "Other",
];

const SCALER_TYPES = [
  "Ultrasonic",
  "Piezoelectric",
  "Magnetostrictive",
  "Manual only",
  "Both ultrasonic and manual",
];

const APPOINTMENT_LENGTHS = [
  "30 min",
  "35 min",
  "40 min",
  "45 min",
  "50 min",
  "60 min",
  "75 min",
  "90 min",
];

type ClearinghouseType = (typeof CLEARINGHOUSE_OPTIONS)[number]["value"];

function getStatusBadge(status: string | null) {
  switch (status) {
    case "connected":
      return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle className="mr-1 h-3 w-3" />
          Connected
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <AlertCircle className="mr-1 h-3 w-3" />
          Not Tested
        </Badge>
      );
  }
}

function YesNoToggle({
  value,
  onChange,
  testId,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      <button
        type="button"
        className={cn(
          "px-4 py-2 text-sm font-medium transition-colors",
          !value ? "bg-muted text-foreground" : "bg-background text-muted-foreground hover:bg-muted/50"
        )}
        onClick={() => onChange(false)}
        data-testid={`${testId}-no`}
      >
        No
      </button>
      <button
        type="button"
        className={cn(
          "px-4 py-2 text-sm font-medium transition-colors",
          value ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50"
        )}
        onClick={() => onChange(true)}
        data-testid={`${testId}-yes`}
      >
        Yes
      </button>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  testId,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        data-testid={`${testId}-decrease`}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center font-medium" data-testid={`${testId}-value`}>
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(value + 1)}
        data-testid={`${testId}-increase`}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ClearinghouseForm({
  onSubmit,
  initialData,
  isLoading,
}: {
  onSubmit: (data: Omit<InsertClearinghouseConfig, "id">) => void;
  initialData?: ClearinghouseConfig;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    clearinghouseType: (initialData?.clearinghouseType ?? "change_healthcare") as ClearinghouseType,
    endpointUrl: initialData?.endpointUrl ?? "",
    username: initialData?.username ?? "",
    secretId: initialData?.secretId ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      clearinghouseType: formData.clearinghouseType,
      endpointUrl: formData.endpointUrl || null,
      username: formData.username || null,
      secretId: formData.secretId || null,
      isActive: formData.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="config-name">Configuration Name</Label>
        <Input
          id="config-name"
          placeholder="e.g., Primary Clearinghouse"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="input-config-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clearinghouse-type">Clearinghouse</Label>
        <Select
          value={formData.clearinghouseType}
          onValueChange={(value: ClearinghouseType) => setFormData({ ...formData, clearinghouseType: value })}
        >
          <SelectTrigger data-testid="select-clearinghouse-type">
            <SelectValue placeholder="Select a clearinghouse" />
          </SelectTrigger>
          <SelectContent>
            {CLEARINGHOUSE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endpoint-url">API Endpoint URL</Label>
        <Input
          id="endpoint-url"
          type="url"
          placeholder="https://api.clearinghouse.com/edi"
          value={formData.endpointUrl}
          onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
          data-testid="input-endpoint-url"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username / Submitter ID</Label>
        <Input
          id="username"
          placeholder="Your clearinghouse username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          data-testid="input-username"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="secret-id">Secret Vault Reference</Label>
        <Input
          id="secret-id"
          placeholder="e.g., clearinghouse/change-healthcare/api-key"
          value={formData.secretId}
          onChange={(e) => setFormData({ ...formData, secretId: e.target.value })}
          data-testid="input-secret-id"
        />
        <p className="text-xs text-muted-foreground">
          Reference to the credentials stored in your secrets vault.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Active</p>
          <p className="text-sm text-muted-foreground">
            Use this configuration for verifications
          </p>
        </div>
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          data-testid="switch-config-active"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-save-config">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Configuration"
        )}
      </Button>
    </form>
  );
}

function ClearinghouseConfigCard({
  config,
  onTest,
  onDelete,
  isTesting,
}: {
  config: ClearinghouseConfig;
  onTest: () => void;
  onDelete: () => void;
  isTesting: boolean;
}) {
  const clearinghouseLabel =
    CLEARINGHOUSE_OPTIONS.find((o) => o.value === config.clearinghouseType)?.label ??
    config.clearinghouseType;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium" data-testid={`text-config-name-${config.id}`}>
            {config.name}
          </h4>
          {!config.isActive && (
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{clearinghouseLabel}</p>
        <div className="flex items-center gap-2 pt-1">
          {getStatusBadge(config.connectionStatus)}
          {config.lastTestedAt && (
            <span className="text-xs text-muted-foreground">
              Last tested: {new Date(config.lastTestedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={isTesting}
          data-testid={`button-test-config-${config.id}`}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plug className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Test</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-config-${config.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{config.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function OfficeProfileTab() {
  const [officeData, setOfficeData] = useState({
    officeName: "Sunny Pines Dental",
    officeAddress: "123 Oak Street, Los Angeles, CA 90210",
    officePhone: "(555) 123-4567",
    website: "https://sunnypinesdental.com",
    aboutOffice: "",
    parkingInfo: "",
    numDentists: 2,
    numHygienists: 3,
    numSupportStaff: 4,
    breakRoomAvailable: true,
    refrigeratorAvailable: true,
    microwaveAvailable: true,
    hiringPermanently: false,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Image className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Add photos of your office</CardTitle>
              <CardDescription>
                Clear photos help patients feel confident. Include: front entrance, operatory rooms, waiting area, team photo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 hover-elevate cursor-pointer">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add cover photo</span>
            </div>
            <div className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 hover-elevate cursor-pointer">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add photo</span>
            </div>
            <div className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 hover-elevate cursor-pointer">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add photo</span>
            </div>
            <div className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 hover-elevate cursor-pointer">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add photo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Office basics</CardTitle>
              <CardDescription>
                Let patients know a bit about your office
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="office-name">Office name</Label>
            <Input
              id="office-name"
              value={officeData.officeName}
              onChange={(e) => setOfficeData({ ...officeData, officeName: e.target.value })}
              data-testid="input-office-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="office-address">Office address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="office-address"
                className="pl-10"
                value={officeData.officeAddress}
                onChange={(e) => setOfficeData({ ...officeData, officeAddress: e.target.value })}
                data-testid="input-office-address"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="office-phone">Office phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="office-phone"
                  type="tel"
                  className="pl-10"
                  value={officeData.officePhone}
                  onChange={(e) => setOfficeData({ ...officeData, officePhone: e.target.value })}
                  data-testid="input-office-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (optional)</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  className="pl-10"
                  value={officeData.website}
                  onChange={(e) => setOfficeData({ ...officeData, website: e.target.value })}
                  data-testid="input-website"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Help us get to know your office</CardTitle>
          <CardDescription>
            Help staff prepare for working in your practice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="about-office">Tell us about your office</Label>
            <p className="text-sm text-muted-foreground">
              What makes your office unique? Include your office atmosphere or any unique features.
            </p>
            <Textarea
              id="about-office"
              placeholder="We're a family-friendly practice focused on gentle care..."
              value={officeData.aboutOffice}
              onChange={(e) => setOfficeData({ ...officeData, aboutOffice: e.target.value })}
              className="min-h-[100px]"
              maxLength={500}
              data-testid="textarea-about-office"
            />
            <p className="text-xs text-muted-foreground text-right">{officeData.aboutOffice.length}/500</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="parking-info">Tell us about the parking situation (optional)</Label>
            <p className="text-sm text-muted-foreground">
              Where can staff park? Describe any fees, or other guidance.
            </p>
            <Textarea
              id="parking-info"
              placeholder="Free parking available in the lot behind the building..."
              value={officeData.parkingInfo}
              onChange={(e) => setOfficeData({ ...officeData, parkingInfo: e.target.value })}
              className="min-h-[100px]"
              maxLength={500}
              data-testid="textarea-parking"
            />
            <p className="text-xs text-muted-foreground text-right">{officeData.parkingInfo.length}/500</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Your dental team</CardTitle>
              <CardDescription>
                Help us understand your team size and composition
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Number of dentists</span>
            <NumberInput
              value={officeData.numDentists}
              onChange={(val) => setOfficeData({ ...officeData, numDentists: val })}
              testId="input-num-dentists"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Number of hygienists</span>
            <NumberInput
              value={officeData.numHygienists}
              onChange={(val) => setOfficeData({ ...officeData, numHygienists: val })}
              testId="input-num-hygienists"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Number of support staff (assistants, front desk, etc.)</span>
            <NumberInput
              value={officeData.numSupportStaff}
              onChange={(val) => setOfficeData({ ...officeData, numSupportStaff: val })}
              testId="input-num-support"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Coffee className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Staff break facilities</CardTitle>
              <CardDescription>
                Tell us what is available for staff to feel comfortable
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Is the break room available for staff?</span>
            <YesNoToggle
              value={officeData.breakRoomAvailable}
              onChange={(val) => setOfficeData({ ...officeData, breakRoomAvailable: val })}
              testId="toggle-break-room"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Is there a staff refrigerator available?</span>
            <YesNoToggle
              value={officeData.refrigeratorAvailable}
              onChange={(val) => setOfficeData({ ...officeData, refrigeratorAvailable: val })}
              testId="toggle-refrigerator"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Is there a staff microwave available?</span>
            <YesNoToggle
              value={officeData.microwaveAvailable}
              onChange={(val) => setOfficeData({ ...officeData, microwaveAvailable: val })}
              testId="toggle-microwave"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional office information</CardTitle>
          <CardDescription>
            Extra information to help with matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-medium">Are you currently hiring permanently?</span>
              <p className="text-sm text-muted-foreground">
                Enabling this shows you offer long-term opportunities.
              </p>
            </div>
            <YesNoToggle
              value={officeData.hiringPermanently}
              onChange={(val) => setOfficeData({ ...officeData, hiringPermanently: val })}
              testId="toggle-hiring"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button data-testid="button-save-office-profile">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function PracticeInformationTab() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null);

  const [practiceData, setPracticeData] = useState({
    npi: "1234567890",
    taxId: "12-3456789",
    practiceManagementSoftware: "Dentrix Ascend",
    xraySoftware: "",
    hasOverheadLights: true,
    preferredScrubColor: false,
    clinicalAttireProvided: false,
    useAirPolishers: false,
    scalerType: "",
    assistedHygieneSchedule: true,
    rootPlaningProcedures: true,
    seeNewPatients: true,
    administerLocalAnesthesia: true,
    workWithNitrousPatients: true,
    appointmentLengthAdults: "60 min",
    appointmentLengthKids: "35 min",
    appointmentLengthPerio: "",
    appointmentLengthScaling: "",
    dentalTreatmentRooms: 0,
    dedicatedHygieneRooms: 0,
  });

  const { data: configs = [], isLoading: isLoadingConfigs } = useQuery<ClearinghouseConfig[]>({
    queryKey: ["/api/clearinghouse-configs"],
  });

  const createConfigMutation = useMutation({
    mutationFn: async (data: Omit<InsertClearinghouseConfig, "id">) => {
      return apiRequest("/api/clearinghouse-configs", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clearinghouse-configs"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Configuration Created",
        description: "Clearinghouse configuration has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/clearinghouse-configs/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clearinghouse-configs"] });
      toast({
        title: "Configuration Deleted",
        description: "Clearinghouse configuration has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      setTestingConfigId(id);
      const response = await apiRequest(`/api/clearinghouse-configs/${id}/test`, {
        method: "POST",
      });
      return response;
    },
    onSuccess: (data: { success: boolean; message: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clearinghouse-configs"] });
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      setTestingConfigId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to test connection. Please try again.",
        variant: "destructive",
      });
      setTestingConfigId(null);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Software</CardTitle>
              <CardDescription>
                Tell us about the software used
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pms">Practice management software</Label>
            <Select
              value={practiceData.practiceManagementSoftware}
              onValueChange={(value) => setPracticeData({ ...practiceData, practiceManagementSoftware: value })}
            >
              <SelectTrigger data-testid="select-pms">
                <SelectValue placeholder="Select your software" />
              </SelectTrigger>
              <SelectContent>
                {PRACTICE_MANAGEMENT_SOFTWARE.map((software) => (
                  <SelectItem key={software} value={software}>
                    {software}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="xray">X-ray software</Label>
            <Select
              value={practiceData.xraySoftware}
              onValueChange={(value) => setPracticeData({ ...practiceData, xraySoftware: value })}
            >
              <SelectTrigger data-testid="select-xray">
                <SelectValue placeholder="Select your X-ray software" />
              </SelectTrigger>
              <SelectContent>
                {XRAY_SOFTWARE.map((software) => (
                  <SelectItem key={software} value={software}>
                    {software}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipment</CardTitle>
          <CardDescription>
            Tell us about the clinical equipment available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Do you have overhead lights?</span>
            <YesNoToggle
              value={practiceData.hasOverheadLights}
              onChange={(val) => setPracticeData({ ...practiceData, hasOverheadLights: val })}
              testId="toggle-overhead-lights"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Do you have a preferred scrub color?</span>
            <YesNoToggle
              value={practiceData.preferredScrubColor}
              onChange={(val) => setPracticeData({ ...practiceData, preferredScrubColor: val })}
              testId="toggle-scrub-color"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Is clinical attire provided (scrubs, lab coats, PPE)?</span>
            <YesNoToggle
              value={practiceData.clinicalAttireProvided}
              onChange={(val) => setPracticeData({ ...practiceData, clinicalAttireProvided: val })}
              testId="toggle-attire"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Do you use air polishers?</span>
            <YesNoToggle
              value={practiceData.useAirPolishers}
              onChange={(val) => setPracticeData({ ...practiceData, useAirPolishers: val })}
              testId="toggle-air-polishers"
            />
          </div>
          <Separator />
          <div className="space-y-2 py-2">
            <Label>Which scalers do you use?</Label>
            <Select
              value={practiceData.scalerType}
              onValueChange={(value) => setPracticeData({ ...practiceData, scalerType: value })}
            >
              <SelectTrigger data-testid="select-scaler-type">
                <SelectValue placeholder="Scaler type" />
              </SelectTrigger>
              <SelectContent>
                {SCALER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responsibilities of temporary hygienists</CardTitle>
          <CardDescription>
            Select the clinical duties temporary hygienists may perform at your office
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Run an assisted hygiene schedule?</span>
            <YesNoToggle
              value={practiceData.assistedHygieneSchedule}
              onChange={(val) => setPracticeData({ ...practiceData, assistedHygieneSchedule: val })}
              testId="toggle-assisted-hygiene"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Conduct root-planing procedures?</span>
            <YesNoToggle
              value={practiceData.rootPlaningProcedures}
              onChange={(val) => setPracticeData({ ...practiceData, rootPlaningProcedures: val })}
              testId="toggle-root-planing"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">See new patients?</span>
            <YesNoToggle
              value={practiceData.seeNewPatients}
              onChange={(val) => setPracticeData({ ...practiceData, seeNewPatients: val })}
              testId="toggle-new-patients"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Administer local anesthesia?</span>
            <YesNoToggle
              value={practiceData.administerLocalAnesthesia}
              onChange={(val) => setPracticeData({ ...practiceData, administerLocalAnesthesia: val })}
              testId="toggle-anesthesia"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Work with nitrous patients?</span>
            <YesNoToggle
              value={practiceData.workWithNitrousPatients}
              onChange={(val) => setPracticeData({ ...practiceData, workWithNitrousPatients: val })}
              testId="toggle-nitrous"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointment length</CardTitle>
          <CardDescription>
            Standard appointment duration for each service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Adults</Label>
              <Select
                value={practiceData.appointmentLengthAdults}
                onValueChange={(value) => setPracticeData({ ...practiceData, appointmentLengthAdults: value })}
              >
                <SelectTrigger data-testid="select-appt-adults">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_LENGTHS.map((length) => (
                    <SelectItem key={length} value={length}>
                      {length}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kids</Label>
              <Select
                value={practiceData.appointmentLengthKids}
                onValueChange={(value) => setPracticeData({ ...practiceData, appointmentLengthKids: value })}
              >
                <SelectTrigger data-testid="select-appt-kids">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_LENGTHS.map((length) => (
                    <SelectItem key={length} value={length}>
                      {length}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Perio</Label>
              <Select
                value={practiceData.appointmentLengthPerio}
                onValueChange={(value) => setPracticeData({ ...practiceData, appointmentLengthPerio: value })}
              >
                <SelectTrigger data-testid="select-appt-perio">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_LENGTHS.map((length) => (
                    <SelectItem key={length} value={length}>
                      {length}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scaling & Root Planing</Label>
              <Select
                value={practiceData.appointmentLengthScaling}
                onValueChange={(value) => setPracticeData({ ...practiceData, appointmentLengthScaling: value })}
              >
                <SelectTrigger data-testid="select-appt-scaling">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_LENGTHS.map((length) => (
                    <SelectItem key={length} value={length}>
                      {length}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clinical spaces</CardTitle>
          <CardDescription>
            Tell us about your treatment rooms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Dental treatment rooms</span>
            <NumberInput
              value={practiceData.dentalTreatmentRooms}
              onChange={(val) => setPracticeData({ ...practiceData, dentalTreatmentRooms: val })}
              testId="input-treatment-rooms"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Dedicated hygiene rooms</span>
            <NumberInput
              value={practiceData.dedicatedHygieneRooms}
              onChange={(val) => setPracticeData({ ...practiceData, dedicatedHygieneRooms: val })}
              testId="input-hygiene-rooms"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Practice Identifiers</CardTitle>
              <CardDescription>
                NPI and Tax ID for insurance verification
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="npi">NPI Number</Label>
              <Input
                id="npi"
                value={practiceData.npi}
                onChange={(e) => setPracticeData({ ...practiceData, npi: e.target.value })}
                className="font-mono"
                data-testid="input-npi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-id">Tax ID</Label>
              <Input
                id="tax-id"
                value={practiceData.taxId}
                onChange={(e) => setPracticeData({ ...practiceData, taxId: e.target.value })}
                className="font-mono"
                data-testid="input-tax-id"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Clearinghouse Credentials</CardTitle>
                <CardDescription>
                  Configure your EDI clearinghouse connections for automated insurance verification
                </CardDescription>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-clearinghouse">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Clearinghouse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Clearinghouse Configuration</DialogTitle>
                  <DialogDescription>
                    Configure a new clearinghouse connection for EDI 270/271 eligibility transactions.
                  </DialogDescription>
                </DialogHeader>
                <ClearinghouseForm
                  onSubmit={(data) => createConfigMutation.mutate(data)}
                  isLoading={createConfigMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingConfigs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : configs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-medium">No Clearinghouse Configured</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a clearinghouse configuration to enable electronic insurance verification.
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
                data-testid="button-add-first-clearinghouse"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Clearinghouse
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <ClearinghouseConfigCard
                  key={config.id}
                  config={config}
                  onTest={() => testConnectionMutation.mutate(config.id)}
                  onDelete={() => deleteConfigMutation.mutate(config.id)}
                  isTesting={testingConfigId === config.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Sun className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className={cn(
                "flex flex-col gap-2 h-auto py-4",
                theme === "light" && "border-primary bg-primary/5"
              )}
              onClick={() => setTheme("light")}
              data-testid="button-theme-light"
            >
              <Sun className="h-5 w-5" />
              <span className="text-xs">Light</span>
            </Button>
            <Button
              variant="outline"
              className={cn(
                "flex flex-col gap-2 h-auto py-4",
                theme === "dark" && "border-primary bg-primary/5"
              )}
              onClick={() => setTheme("dark")}
              data-testid="button-theme-dark"
            >
              <Moon className="h-5 w-5" />
              <span className="text-xs">Dark</span>
            </Button>
            <Button
              variant="outline"
              className={cn(
                "flex flex-col gap-2 h-auto py-4",
                theme === "system" && "border-primary bg-primary/5"
              )}
              onClick={() => setTheme("system")}
              data-testid="button-theme-system"
            >
              <Monitor className="h-5 w-5" />
              <span className="text-xs">System</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button data-testid="button-save-practice-info">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function StaffingSettingsTab() {
  const [settings, setSettings] = useState({
    autoVerifyBeforeAppointments: true,
    reverifyStale: true,
    preferClearinghouse: true,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Verification Settings</CardTitle>
              <CardDescription>
                Configure automatic verification behavior
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-verify before appointments</p>
              <p className="text-sm text-muted-foreground">
                Automatically verify insurance 7 days before scheduled appointments
              </p>
            </div>
            <Switch
              checked={settings.autoVerifyBeforeAppointments}
              onCheckedChange={(val) => setSettings({ ...settings, autoVerifyBeforeAppointments: val })}
              data-testid="switch-auto-verify"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Re-verify stale benefits</p>
              <p className="text-sm text-muted-foreground">
                Re-verify if last verification is older than 30 days
              </p>
            </div>
            <Switch
              checked={settings.reverifyStale}
              onCheckedChange={(val) => setSettings({ ...settings, reverifyStale: val })}
              data-testid="switch-reverify-stale"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Prefer clearinghouse verification</p>
              <p className="text-sm text-muted-foreground">
                Use electronic verification when available before AI phone calls
              </p>
            </div>
            <Switch
              checked={settings.preferClearinghouse}
              onCheckedChange={(val) => setSettings({ ...settings, preferClearinghouse: val })}
              data-testid="switch-prefer-clearinghouse"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>
                Configure how you receive updates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive verification results via email
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-email-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Failed verification alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified immediately when verifications fail
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-failed-alerts" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily digest</p>
              <p className="text-sm text-muted-foreground">
                Receive a daily summary of verification activity
              </p>
            </div>
            <Switch data-testid="switch-daily-digest" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button data-testid="button-save-staffing">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Subscription</CardTitle>
              <CardDescription>
                Manage your plan and billing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Professional Plan</h4>
                <p className="text-sm text-muted-foreground">$199/month - billed monthly</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Active
              </Badge>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next billing date</span>
                <span>February 1, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verifications this month</span>
                <span>127 / unlimited</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team members</span>
                <span>5 / 10</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-change-plan">
                Change Plan
              </Button>
              <Button variant="outline" size="sm" data-testid="button-view-invoices">
                View Invoices
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Method</CardTitle>
          <CardDescription>
            Manage your payment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/2027</p>
              </div>
            </div>
            <Button variant="outline" size="sm" data-testid="button-update-payment">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing History</CardTitle>
          <CardDescription>
            View your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "Jan 1, 2026", amount: "$199.00", status: "Paid" },
              { date: "Dec 1, 2025", amount: "$199.00", status: "Paid" },
              { date: "Nov 1, 2025", amount: "$199.00", status: "Paid" },
            ].map((invoice, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{invoice.date}</span>
                  <span className="font-medium">{invoice.amount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {invoice.status}
                  </Badge>
                  <Button variant="ghost" size="sm" data-testid={`button-download-invoice-${i}`}>
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("office-profile");

  const tabCounts = {
    "office-profile": 3,
    "practice-info": 9,
    "staffing": 5,
    "billing": 1,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Office Settings"
          description="Configure your practice and application preferences"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">No changes</span>
          <Button variant="outline" disabled data-testid="button-save-all">
            Save
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="office-profile" className="flex items-center gap-2" data-testid="tab-office-profile">
            Office profile
            <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {tabCounts["office-profile"]}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="practice-info" className="flex items-center gap-2" data-testid="tab-practice-info">
            Practice information
            <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {tabCounts["practice-info"]}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="staffing" className="flex items-center gap-2" data-testid="tab-staffing">
            Staffing settings
            <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {tabCounts["staffing"]}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2" data-testid="tab-billing">
            Billing
            <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {tabCounts["billing"]}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="office-profile">
          <OfficeProfileTab />
        </TabsContent>

        <TabsContent value="practice-info">
          <PracticeInformationTab />
        </TabsContent>

        <TabsContent value="staffing">
          <StaffingSettingsTab />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
