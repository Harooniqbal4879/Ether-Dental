import { useState, useEffect, createContext, useContext } from "react";
import { useAuth } from "@/lib/auth-context";
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
  X,
  Calendar,
  UserCheck,
  Search,
  Database,
  Link2,
  RefreshCw,
  Save,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ClearinghouseConfig, InsertClearinghouseConfig, InsuranceCarrier, PracticeLocation, InsertPracticeLocation, US_STATES } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpload } from "@/hooks/use-upload";
import { useLocation } from "@/lib/location-context";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

// Dental eligibility clearinghouse options
const DENTAL_CLEARINGHOUSE_OPTIONS = [
  { value: "dentalxchange", label: "DentalXchange" },
  { value: "change_healthcare", label: "Change Healthcare" },
  { value: "trizetto", label: "Trizetto" },
] as const;

// Medical eligibility clearinghouse options
const MEDICAL_CLEARINGHOUSE_OPTIONS = [
  { value: "availity", label: "Availity" },
  { value: "office_ally", label: "Office Ally" },
  { value: "change_healthcare", label: "Change Healthcare" },
  { value: "waystar", label: "Waystar" },
] as const;

// All clearinghouse options (for backward compatibility)
const CLEARINGHOUSE_OPTIONS = [
  { value: "dentalxchange", label: "DentalXchange" },
  { value: "availity", label: "Availity" },
  { value: "office_ally", label: "Office Ally" },
  { value: "change_healthcare", label: "Change Healthcare" },
  { value: "trizetto", label: "Trizetto" },
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

const SHIFT_TIMES = [
  "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM",
];

const BREAK_DURATIONS = ["30 min", "45 min", "60 min", "90 min"];

const CONTACT_METHODS = ["Phone", "Email", "Text"];

const TEAM_MEMBERS = [
  "Dr. Sarah Johnson",
  "Dr. Michael Chen",
  "Lisa Martinez (Office Manager)",
  "Emily Davis (Front Desk)",
  "Robert Kim (Treatment Coordinator)",
];

const DAYS_OF_WEEK = [
  { key: "sunday", label: "Su", fullName: "Sunday" },
  { key: "monday", label: "Mo", fullName: "Monday" },
  { key: "tuesday", label: "Tu", fullName: "Tuesday" },
  { key: "wednesday", label: "We", fullName: "Wednesday" },
  { key: "thursday", label: "Th", fullName: "Thursday" },
  { key: "friday", label: "Fr", fullName: "Friday" },
  { key: "saturday", label: "Sa", fullName: "Saturday" },
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
    provider: (initialData?.provider ?? "change_healthcare") as ClearinghouseType,
    submitterId: initialData?.submitterId ?? "",
    secretId: initialData?.secretId ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      provider: formData.provider,
      submitterId: formData.submitterId || null,
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
          value={formData.provider}
          onValueChange={(value: ClearinghouseType) => setFormData({ ...formData, provider: value })}
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
        <Label htmlFor="submitter-id">Submitter ID</Label>
        <Input
          id="submitter-id"
          placeholder="Your EDI submitter ID"
          value={formData.submitterId}
          onChange={(e) => setFormData({ ...formData, submitterId: e.target.value })}
          data-testid="input-submitter-id"
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
          checked={formData.isActive ?? false}
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
    CLEARINGHOUSE_OPTIONS.find((o) => o.value === config.provider)?.label ??
    config.provider;

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

// Practice profile type for API responses
interface PracticeProfile {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  aboutOffice: string | null;
  parkingInfo: string | null;
  arrivalInstructions: string | null;
  dressCode: string | null;
  photos: string[] | null;
  numDentists: number | null;
  numHygienists: number | null;
  numSupportStaff: number | null;
  breakRoomAvailable: boolean | null;
  refrigeratorAvailable: boolean | null;
  microwaveAvailable: boolean | null;
  practiceManagementSoftware: string | null;
  xraySoftware: string | null;
  hasOverheadLights: boolean | null;
  preferredScrubColor: string | null;
  clinicalAttireProvided: boolean | null;
  useAirPolishers: boolean | null;
  scalerType: string | null;
  assistedHygieneSchedule: boolean | null;
  rootPlaningProcedures: boolean | null;
  seeNewPatients: boolean | null;
  administerLocalAnesthesia: boolean | null;
  workWithNitrousPatients: boolean | null;
  appointmentLengthAdults: string | null;
  appointmentLengthKids: string | null;
  appointmentLengthPerio: string | null;
  appointmentLengthScaling: string | null;
  dentalTreatmentRooms: number | null;
  dedicatedHygieneRooms: number | null;
  hiringPermanently: boolean | null;
}

// Practice ID context for settings components
const SettingsPracticeContext = createContext<string | null>(null);

function useSettingsPracticeId() {
  const practiceId = useContext(SettingsPracticeContext);
  return practiceId;
}

// Type for resolved location profile (returned by /api/locations/:id/profile)
type LocationProfile = {
  locationId: string;
  locationName: string;
  address: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  aboutOffice: string;
  parkingInfo: string;
  arrivalInstructions: string;
  dressCode: string;
  photos: string[];
  numDentists: number;
  numHygienists: number;
  numSupportStaff: number;
  breakRoomAvailable: boolean;
  refrigeratorAvailable: boolean;
  microwaveAvailable: boolean;
  practiceManagementSoftware: string;
  xraySoftware: string;
  hasOverheadLights: boolean;
  preferredScrubColor: string;
  clinicalAttireProvided: boolean;
  useAirPolishers: boolean;
  scalerType: string;
  assistedHygieneSchedule: boolean;
  rootPlaningProcedures: boolean;
  seeNewPatients: boolean;
  administerLocalAnesthesia: boolean;
  workWithNitrousPatients: boolean;
  appointmentLengthAdults: string;
  appointmentLengthKids: string;
  appointmentLengthPerio: string;
  appointmentLengthScaling: string;
  dentalTreatmentRooms: number;
  dedicatedHygieneRooms: number;
  hiringPermanently: boolean;
};

function OfficeProfileTab() {
  const { toast } = useToast();
  const { currentLocationId, currentLocation, locations, currentPracticeId } = useLocation();
  const { admin, practice } = useAuth();
  // Get practiceId from multiple sources with fallbacks
  const contextPracticeId = useSettingsPracticeId();
  const practiceId = contextPracticeId || currentPracticeId || practice?.id || admin?.practiceId || null;
  const hasLocations = locations && locations.length > 0;
  
  const { uploadFile, isUploading } = useUpload({
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    },
  });
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  
  // Load location-specific profile data (when locations exist)
  const { data: locationProfile, isLoading: isLoadingLocation } = useQuery<LocationProfile>({
    queryKey: ["/api/locations", currentLocationId, "profile"],
    enabled: !!currentLocationId && hasLocations,
  });

  // Load practice data (used when no locations exist, or for practice-level fields)
  const { data: practiceData, isLoading: isLoadingPractice } = useQuery<PracticeProfile>({
    queryKey: ["/api/practices", practiceId],
    enabled: !!practiceId,
  });

  const isLoading = hasLocations ? isLoadingLocation : isLoadingPractice;

  const [officeData, setOfficeData] = useState({
    name: "",
    address: "",
    city: "",
    stateCode: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    aboutOffice: "",
    parkingInfo: "",
    numDentists: 0,
    numHygienists: 0,
    numSupportStaff: 0,
    breakRoomAvailable: false,
    refrigeratorAvailable: false,
    microwaveAvailable: false,
    hiringPermanently: false,
    photos: [] as string[],
    arrivalInstructions: "",
    dressCode: "",
  });
  
  // Sync profile data to local state - use location profile if available, otherwise use practice
  useEffect(() => {
    if (hasLocations && locationProfile) {
      setOfficeData({
        name: locationProfile.locationName || "",
        address: locationProfile.address || "",
        city: locationProfile.city || "",
        stateCode: locationProfile.stateCode || "",
        zipCode: locationProfile.zipCode || "",
        phone: locationProfile.phone || "",
        email: locationProfile.email || "",
        website: "", // Website is not part of location profile
        aboutOffice: locationProfile.aboutOffice || "",
        parkingInfo: locationProfile.parkingInfo || "",
        numDentists: locationProfile.numDentists || 0,
        numHygienists: locationProfile.numHygienists || 0,
        numSupportStaff: locationProfile.numSupportStaff || 0,
        breakRoomAvailable: locationProfile.breakRoomAvailable || false,
        refrigeratorAvailable: locationProfile.refrigeratorAvailable || false,
        microwaveAvailable: locationProfile.microwaveAvailable || false,
        hiringPermanently: locationProfile.hiringPermanently || false,
        photos: locationProfile.photos || [],
        arrivalInstructions: locationProfile.arrivalInstructions || "",
        dressCode: locationProfile.dressCode || "",
      });
    } else if (!hasLocations && practiceData) {
      // Use practice data when no locations exist
      setOfficeData({
        name: practiceData.name || "",
        address: practiceData.address || "",
        city: practiceData.city || "",
        stateCode: practiceData.stateCode || "",
        zipCode: practiceData.zipCode || "",
        phone: practiceData.phone || "",
        email: practiceData.email || "",
        website: practiceData.website || "",
        aboutOffice: practiceData.aboutOffice || "",
        parkingInfo: practiceData.parkingInfo || "",
        numDentists: practiceData.numDentists || 0,
        numHygienists: practiceData.numHygienists || 0,
        numSupportStaff: practiceData.numSupportStaff || 0,
        breakRoomAvailable: practiceData.breakRoomAvailable || false,
        refrigeratorAvailable: practiceData.refrigeratorAvailable || false,
        microwaveAvailable: practiceData.microwaveAvailable || false,
        hiringPermanently: practiceData.hiringPermanently || false,
        photos: practiceData.photos || [],
        arrivalInstructions: practiceData.arrivalInstructions || "",
        dressCode: practiceData.dressCode || "",
      });
    }
  }, [locationProfile, practiceData, hasLocations, currentLocationId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      setUploadingIndex(index);
      try {
        const response = await uploadFile(file);
        if (response) {
          setOfficeData((prev) => {
            const newPhotos = [...prev.photos];
            newPhotos[index] = response.objectPath;
            return { ...prev, photos: newPhotos };
          });
          toast({
            title: "Photo Uploaded",
            description: "Your photo has been uploaded successfully.",
          });
        }
      } finally {
        setUploadingIndex(null);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setOfficeData((prev) => {
      const newPhotos = [...prev.photos];
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
  };

  // Mutation for updating location profile
  const updateLocationMutation = useMutation({
    mutationFn: async (data: Partial<LocationProfile>) => {
      if (!currentLocationId) throw new Error("No location selected");
      const res = await apiRequest("PATCH", `/api/locations/${currentLocationId}/profile`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", currentLocationId, "profile"] });
      toast({
        title: "Profile Saved",
        description: `${currentLocation?.name || "Location"} profile has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating practice (when no locations exist)
  const updatePracticeMutation = useMutation({
    mutationFn: async (data: Partial<PracticeProfile>) => {
      if (!practiceId) throw new Error("No practice selected");
      const res = await apiRequest("PATCH", `/api/practices/${practiceId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId] });
      toast({
        title: "Profile Saved",
        description: "Practice profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const profileData = {
      name: officeData.name,
      address: officeData.address,
      city: officeData.city,
      stateCode: officeData.stateCode,
      zipCode: officeData.zipCode,
      phone: officeData.phone,
      website: officeData.website,
      aboutOffice: officeData.aboutOffice,
      parkingInfo: officeData.parkingInfo,
      numDentists: officeData.numDentists,
      numHygienists: officeData.numHygienists,
      numSupportStaff: officeData.numSupportStaff,
      breakRoomAvailable: officeData.breakRoomAvailable,
      refrigeratorAvailable: officeData.refrigeratorAvailable,
      microwaveAvailable: officeData.microwaveAvailable,
      hiringPermanently: officeData.hiringPermanently,
      photos: officeData.photos,
      arrivalInstructions: officeData.arrivalInstructions,
      dressCode: officeData.dressCode,
    };

    if (hasLocations && currentLocationId) {
      // Save to location profile
      updateLocationMutation.mutate(profileData as Partial<LocationProfile>);
    } else if (practiceId) {
      // Save to practice (includes all fields since practice table has these columns)
      updatePracticeMutation.mutate(profileData);
    } else {
      toast({
        title: "Error",
        description: "No practice or location found to save data.",
        variant: "destructive",
      });
    }
  };

  const isSaving = updateLocationMutation.isPending || updatePracticeMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

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
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="relative">
                {officeData.photos[index] ? (
                  <div className="aspect-video rounded-lg overflow-hidden relative group">
                    <img
                      src={officeData.photos[index]}
                      alt={`Office photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-remove-photo-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 hover-elevate cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, index)}
                      disabled={isUploading}
                      data-testid={`input-photo-${index}`}
                    />
                    {uploadingIndex === index ? (
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    ) : (
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {index === 0 ? "Add cover photo" : "Add photo"}
                    </span>
                  </label>
                )}
              </div>
            ))}
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
              value={officeData.name}
              onChange={(e) => setOfficeData({ ...officeData, name: e.target.value })}
              data-testid="input-office-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="office-address">Street address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="office-address"
                className="pl-10"
                value={officeData.address}
                onChange={(e) => setOfficeData({ ...officeData, address: e.target.value })}
                placeholder="123 Main Street"
                data-testid="input-office-address"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="office-city">City</Label>
              <Input
                id="office-city"
                value={officeData.city}
                onChange={(e) => setOfficeData({ ...officeData, city: e.target.value })}
                placeholder="City"
                data-testid="input-office-city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office-state">State</Label>
              <Input
                id="office-state"
                value={officeData.stateCode}
                onChange={(e) => setOfficeData({ ...officeData, stateCode: e.target.value })}
                placeholder="CA"
                maxLength={2}
                data-testid="input-office-state"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office-zip">ZIP Code</Label>
              <Input
                id="office-zip"
                value={officeData.zipCode}
                onChange={(e) => setOfficeData({ ...officeData, zipCode: e.target.value })}
                placeholder="12345"
                data-testid="input-office-zip"
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
                  value={officeData.phone}
                  onChange={(e) => setOfficeData({ ...officeData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
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
                  placeholder="https://example.com"
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
            <span className="font-medium">Number of professionals</span>
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="arrival-instructions">Arrival instructions</Label>
            <p className="text-sm text-muted-foreground">
              Help staff know where to park, which entrance to use, etc.
            </p>
            <Textarea
              id="arrival-instructions"
              placeholder="Park in the back lot, enter through the side door..."
              value={officeData.arrivalInstructions}
              onChange={(e) => setOfficeData({ ...officeData, arrivalInstructions: e.target.value })}
              className="min-h-[80px]"
              maxLength={500}
              data-testid="textarea-arrival-instructions"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="dress-code">Dress code</Label>
            <p className="text-sm text-muted-foreground">
              Let staff know what to wear when working at your office.
            </p>
            <Textarea
              id="dress-code"
              placeholder="Business casual, scrubs provided, closed-toe shoes required..."
              value={officeData.dressCode}
              onChange={(e) => setOfficeData({ ...officeData, dressCode: e.target.value })}
              className="min-h-[80px]"
              maxLength={500}
              data-testid="textarea-dress-code"
            />
          </div>
          <Separator />
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
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          data-testid="button-save-office-profile"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

interface Practice {
  id: string;
  name: string;
  npiNumber?: string | null;
  taxId?: string | null;
}

function PracticeInformationTab() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { currentLocationId, currentLocation } = useLocation();
  const practiceId = useSettingsPracticeId();

  // Load practice data for NPI and Tax ID
  const { data: practice } = useQuery<Practice>({
    queryKey: ["/api/practices", practiceId],
    enabled: !!practiceId,
  });

  // Load location-specific profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery<LocationProfile>({
    queryKey: ["/api/locations", currentLocationId, "profile"],
    enabled: !!currentLocationId,
  });

  const [practiceData, setPracticeData] = useState({
    npi: "",
    taxId: "",
    practiceManagementSoftware: "",
    xraySoftware: "",
    hasOverheadLights: true,
    hasPreferredScrubColor: false,
    preferredScrubColor: "",
    clinicalAttireProvided: false,
    useAirPolishers: false,
    scalerType: "",
    assistedHygieneSchedule: false,
    rootPlaningProcedures: true,
    seeNewPatients: true,
    administerLocalAnesthesia: true,
    workWithNitrousPatients: false,
    appointmentLengthAdults: "",
    appointmentLengthKids: "",
    appointmentLengthPerio: "",
    appointmentLengthScaling: "",
    dentalTreatmentRooms: 0,
    dedicatedHygieneRooms: 0,
    arrivalInstructions: "",
    dressCode: "",
  });

  // Sync practice data (NPI, Tax ID) when it loads
  useEffect(() => {
    if (practice) {
      setPracticeData(prev => ({
        ...prev,
        npi: practice.npiNumber || "",
        taxId: practice.taxId || "",
      }));
    }
  }, [practice]);

  // Sync profile data to local state when it loads or location changes
  useEffect(() => {
    if (profile) {
      setPracticeData(prev => ({
        ...prev,
        practiceManagementSoftware: profile.practiceManagementSoftware || "",
        xraySoftware: profile.xraySoftware || "",
        hasOverheadLights: profile.hasOverheadLights ?? true,
        hasPreferredScrubColor: !!profile.preferredScrubColor,
        preferredScrubColor: profile.preferredScrubColor || "",
        clinicalAttireProvided: profile.clinicalAttireProvided ?? false,
        useAirPolishers: profile.useAirPolishers ?? false,
        scalerType: profile.scalerType || "",
        assistedHygieneSchedule: profile.assistedHygieneSchedule ?? false,
        rootPlaningProcedures: profile.rootPlaningProcedures ?? true,
        seeNewPatients: profile.seeNewPatients ?? true,
        administerLocalAnesthesia: profile.administerLocalAnesthesia ?? true,
        workWithNitrousPatients: profile.workWithNitrousPatients ?? false,
        appointmentLengthAdults: profile.appointmentLengthAdults || "",
        appointmentLengthKids: profile.appointmentLengthKids || "",
        appointmentLengthPerio: profile.appointmentLengthPerio || "",
        appointmentLengthScaling: profile.appointmentLengthScaling || "",
        dentalTreatmentRooms: profile.dentalTreatmentRooms || 0,
        dedicatedHygieneRooms: profile.dedicatedHygieneRooms || 0,
        arrivalInstructions: profile.arrivalInstructions || "",
        dressCode: profile.dressCode || "",
      }));
    }
  }, [profile, currentLocationId]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<LocationProfile>) => {
      if (!currentLocationId) throw new Error("No location selected");
      const res = await apiRequest("PATCH", `/api/locations/${currentLocationId}/profile`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", currentLocationId, "profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save practice info",
        variant: "destructive",
      });
    },
  });

  const updatePracticeMutation = useMutation({
    mutationFn: async (data: { npiNumber?: string; taxId?: string }) => {
      if (!practiceId) throw new Error("No practice selected");
      const res = await apiRequest("PATCH", `/api/practices/${practiceId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save practice identifiers",
        variant: "destructive",
      });
    },
  });

  const handleSavePracticeInfo = async () => {
    if (!currentLocationId) {
      toast({
        title: "No Location Selected",
        description: "Please select a location from the sidebar to save practice data.",
        variant: "destructive",
      });
      return;
    }

    try {
      await Promise.all([
        updatePracticeMutation.mutateAsync({
          npiNumber: practiceData.npi,
          taxId: practiceData.taxId,
        }),
        updateProfileMutation.mutateAsync({
          practiceManagementSoftware: practiceData.practiceManagementSoftware,
          xraySoftware: practiceData.xraySoftware,
          hasOverheadLights: practiceData.hasOverheadLights,
          preferredScrubColor: practiceData.preferredScrubColor,
          clinicalAttireProvided: practiceData.clinicalAttireProvided,
          useAirPolishers: practiceData.useAirPolishers,
          scalerType: practiceData.scalerType,
          assistedHygieneSchedule: practiceData.assistedHygieneSchedule,
          rootPlaningProcedures: practiceData.rootPlaningProcedures,
          seeNewPatients: practiceData.seeNewPatients,
          administerLocalAnesthesia: practiceData.administerLocalAnesthesia,
          workWithNitrousPatients: practiceData.workWithNitrousPatients,
          appointmentLengthAdults: practiceData.appointmentLengthAdults,
          appointmentLengthKids: practiceData.appointmentLengthKids,
          appointmentLengthPerio: practiceData.appointmentLengthPerio,
          appointmentLengthScaling: practiceData.appointmentLengthScaling,
          dentalTreatmentRooms: practiceData.dentalTreatmentRooms,
          dedicatedHygieneRooms: practiceData.dedicatedHygieneRooms,
          arrivalInstructions: practiceData.arrivalInstructions,
          dressCode: practiceData.dressCode,
        }),
      ]);
      toast({
        title: "Practice Info Saved",
        description: `${currentLocation?.name || "Location"} information has been updated successfully.`,
      });
    } catch (error) {
      // Errors are handled by individual mutation onError callbacks
    }
  };

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
              value={practiceData.hasPreferredScrubColor}
              onChange={(val) => setPracticeData({ ...practiceData, hasPreferredScrubColor: val })}
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
          <CardTitle className="text-base">Responsibilities of temporary professionals</CardTitle>
          <CardDescription>
            Select the clinical duties temporary professionals may perform at your office
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
        <Button 
          onClick={handleSavePracticeInfo}
          disabled={updateProfileMutation.isPending || updatePracticeMutation.isPending}
          data-testid="button-save-practice-info"
        >
          {(updateProfileMutation.isPending || updatePracticeMutation.isPending) ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function StaffingSettingsTab() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    mainContact: "",
    emergencyContactName: "",
    emergencyContactMethod: "",
    emergencyContactInfo: "",
    activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    shiftSchedule: {
      monday: { arrival: "8:30 AM", firstPatient: "9:00 AM", endTime: "5:00 PM", breakDuration: "60 min" },
      tuesday: { arrival: "8:30 AM", firstPatient: "9:00 AM", endTime: "5:00 PM", breakDuration: "60 min" },
      wednesday: { arrival: "8:30 AM", firstPatient: "9:00 AM", endTime: "5:00 PM", breakDuration: "60 min" },
      thursday: { arrival: "8:30 AM", firstPatient: "9:00 AM", endTime: "5:00 PM", breakDuration: "60 min" },
      friday: { arrival: "8:30 AM", firstPatient: "9:00 AM", endTime: "5:00 PM", breakDuration: "60 min" },
      saturday: { arrival: "8:30 AM", firstPatient: "9:00 AM", endTime: "2:00 PM", breakDuration: "60 min" },
    } as Record<string, { arrival: string; firstPatient: string; endTime: string; breakDuration: string }>,
    instantBookShifts: false,
    accommodateLactationBreaks: false,
    accommodateLeftHanded: false,
    additionalExpectations: "",
    autoVerifyBeforeAppointments: true,
    reverifyStale: true,
    preferClearinghouse: true,
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // TODO: Connect to backend API when ready
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Settings saved",
        description: "Your staffing settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save staffing settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (dayKey: string) => {
    setSettings((prev) => ({
      ...prev,
      activeDays: prev.activeDays.includes(dayKey)
        ? prev.activeDays.filter((d) => d !== dayKey)
        : [...prev.activeDays, dayKey],
    }));
  };

  const updateShiftSchedule = (day: string, field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      shiftSchedule: {
        ...prev.shiftSchedule,
        [day]: {
          ...prev.shiftSchedule[day],
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Main contact for professionals</CardTitle>
          <CardDescription>
            This will be shared with professionals in case they have questions about your office
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Who should professionals reach out to?</Label>
            <Select
              value={settings.mainContact}
              onValueChange={(value) => setSettings({ ...settings, mainContact: value })}
            >
              <SelectTrigger data-testid="select-main-contact">
                <SelectValue placeholder="Select a team member..." />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.map((member) => (
                  <SelectItem key={member} value={member}>
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency contact</CardTitle>
          <CardDescription>
            To be used in case of emergencies or other urgent communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Contact name</Label>
              <Input
                placeholder="Full name"
                value={settings.emergencyContactName}
                onChange={(e) => setSettings({ ...settings, emergencyContactName: e.target.value })}
                data-testid="input-emergency-name"
              />
            </div>
            <div className="space-y-2">
              <Label>How to contact</Label>
              <Select
                value={settings.emergencyContactMethod}
                onValueChange={(value) => setSettings({ ...settings, emergencyContactMethod: value })}
              >
                <SelectTrigger data-testid="select-emergency-method">
                  <SelectValue placeholder="Contact via" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                placeholder="Where can we reach you?"
                value={settings.emergencyContactInfo}
                onChange={(e) => setSettings({ ...settings, emergencyContactInfo: e.target.value })}
                data-testid="input-emergency-contact"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Set your preferred shift hours</CardTitle>
              <CardDescription>
                These hours will be your default when creating new shifts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => toggleDay(day.key)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  settings.activeDays.includes(day.key)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                data-testid={`toggle-day-${day.key}`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium"></th>
                  <th className="pb-3 text-left font-medium">Arrival time</th>
                  <th className="pb-3 text-left font-medium">First patient</th>
                  <th className="pb-3 text-left font-medium">End time</th>
                  <th className="pb-3 text-left font-medium">Break (unpaid)</th>
                  <th className="pb-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.filter((day) => settings.activeDays.includes(day.key)).map((day) => (
                  <tr key={day.key} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{day.fullName}</td>
                    <td className="py-3 pr-2">
                      <Select
                        value={settings.shiftSchedule[day.key]?.arrival}
                        onValueChange={(value) => updateShiftSchedule(day.key, "arrival", value)}
                      >
                        <SelectTrigger className="w-[120px]" data-testid={`select-arrival-${day.key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFT_TIMES.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 pr-2">
                      <Select
                        value={settings.shiftSchedule[day.key]?.firstPatient}
                        onValueChange={(value) => updateShiftSchedule(day.key, "firstPatient", value)}
                      >
                        <SelectTrigger className="w-[120px]" data-testid={`select-first-patient-${day.key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFT_TIMES.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 pr-2">
                      <Select
                        value={settings.shiftSchedule[day.key]?.endTime}
                        onValueChange={(value) => updateShiftSchedule(day.key, "endTime", value)}
                      >
                        <SelectTrigger className="w-[120px]" data-testid={`select-end-time-${day.key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFT_TIMES.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 pr-2">
                      <Select
                        value={settings.shiftSchedule[day.key]?.breakDuration}
                        onValueChange={(value) => updateShiftSchedule(day.key, "breakDuration", value)}
                      >
                        <SelectTrigger className="w-[100px]" data-testid={`select-break-${day.key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BREAK_DURATIONS.map((duration) => (
                            <SelectItem key={duration} value={duration}>
                              {duration}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleDay(day.key)}
                        data-testid={`button-remove-day-${day.key}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default shift settings</CardTitle>
          <CardDescription>
            Set your defaults to maximize your ability to fill shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-medium">Instant book for shift requests</span>
              <p className="text-sm text-muted-foreground">
                Automatically accept requests made at least 7 days ahead of the shift
              </p>
            </div>
            <YesNoToggle
              value={settings.instantBookShifts}
              onChange={(val) => setSettings({ ...settings, instantBookShifts: val })}
              testId="toggle-instant-book"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional shift accommodations</CardTitle>
          <CardDescription>
            Extra information to help find great matches for your office
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Are you able to accommodate lactation breaks?</span>
            <YesNoToggle
              value={settings.accommodateLactationBreaks}
              onChange={(val) => setSettings({ ...settings, accommodateLactationBreaks: val })}
              testId="toggle-lactation"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Are you able to accommodate left-handed professionals?</span>
            <YesNoToggle
              value={settings.accommodateLeftHanded}
              onChange={(val) => setSettings({ ...settings, accommodateLeftHanded: val })}
              testId="toggle-left-handed"
            />
          </div>
          <Separator />
          <div className="space-y-2 py-2">
            <Label>Communicate any additional expectations for temporary professionals (optional)</Label>
            <Textarea
              placeholder="Description"
              value={settings.additionalExpectations}
              onChange={(e) => setSettings({ ...settings, additionalExpectations: e.target.value })}
              className="min-h-[100px]"
              maxLength={500}
              data-testid="textarea-expectations"
            />
            <p className="text-xs text-muted-foreground text-right">{settings.additionalExpectations.length}/500</p>
          </div>
        </CardContent>
      </Card>

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
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          data-testid="button-save-staffing"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function BillingTab() {
  const [billingEmail, setBillingEmail] = useState("billing@yourpractice.com");
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  return (
    <div className="space-y-8">
      {/* Billing Notifications */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-billing-notifications-title">Billing notifications</h3>
          <p className="text-sm text-muted-foreground">
            Choose who gets email notifications about invoices and payments.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="billing-email">Contact email</Label>
          <Input
            id="billing-email"
            type="email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            placeholder="billing@yourpractice.com"
            className="max-w-md"
            data-testid="input-billing-email"
          />
        </div>
      </div>

      <Separator />

      {/* Select Payment Method */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold" data-testid="text-payment-method-title">Select payment method</h3>
          {!hasPaymentMethod && (
            <Badge variant="destructive" className="text-xs" data-testid="badge-payment-missing">
              MISSING
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Choose your preferred payment method. We charge after the shift based on actual hours worked, using Stripe for secure transactions.
        </p>
        
        <Button 
          variant="default" 
          className="bg-foreground text-background hover:bg-foreground/90"
          data-testid="button-add-payment-method"
        >
          Add payment method
        </Button>

        {!hasPaymentMethod && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4">
            <p className="text-sm text-red-700 dark:text-red-400" data-testid="text-payment-warning">
              A payment method is required before your first shift begins. All payments are securely collected via Stripe after the shift is completed.
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Invoices & Payments */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-invoices-title">Invoices & payments</h3>
          <p className="text-sm text-muted-foreground">
            History of your billing transactions and payments.
          </p>
        </div>
        
        <div className="rounded-lg bg-muted/50 p-8 flex flex-col items-center justify-center min-h-[200px]">
          <div className="mb-4">
            <Search className="h-16 w-16 text-muted-foreground/50" />
          </div>
          <h4 className="text-lg font-medium text-muted-foreground" data-testid="text-no-invoices">
            No invoices & payments yet.
          </h4>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Once you book shifts or subscribe to services, you'll see all the details here
          </p>
        </div>
      </div>

      <Separator />

      {/* Legacy Subscription Card - kept for reference */}
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

// Insurance Carriers Tab
const carrierFormSchema = z.object({
  name: z.string().min(1, "Carrier name is required"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  clearinghouseCompatible: z.boolean().default(false),
});

type CarrierFormValues = z.infer<typeof carrierFormSchema>;

const US_STATES_LIST = [
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
  { code: "DC", name: "District of Columbia" },
];

const locationFormSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  stateCode: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

function LocationsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PracticeLocation | null>(null);
  const { toast } = useToast();

  const practiceId = useSettingsPracticeId();

  const { data: locations, isLoading } = useQuery<PracticeLocation[]>({
    queryKey: ["/api/practices", practiceId, "locations"],
    enabled: !!practiceId,
  });

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      stateCode: "",
      zipCode: "",
      phone: "",
      email: "",
      isPrimary: false,
      isActive: true,
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (data: LocationFormValues) => {
      return apiRequest("POST", `/api/practices/${practiceId}/locations`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId, "locations"] });
      toast({
        title: "Location added",
        description: "The location has been added successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LocationFormValues> }) => {
      return apiRequest("PATCH", `/api/locations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId, "locations"] });
      toast({
        title: "Location updated",
        description: "The location has been updated successfully.",
      });
      setIsDialogOpen(false);
      setEditingLocation(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId, "locations"] });
      toast({
        title: "Location deleted",
        description: "The location has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditLocation = (location: PracticeLocation) => {
    setEditingLocation(location);
    form.reset({
      name: location.name,
      address: location.address || "",
      city: location.city || "",
      stateCode: location.stateCode || "",
      zipCode: location.zipCode || "",
      phone: location.phone || "",
      email: location.email || "",
      isPrimary: location.isPrimary || false,
      isActive: location.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLocation(null);
    form.reset();
  };

  const onSubmit = (data: LocationFormValues) => {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, data });
    } else {
      createLocationMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Office Locations</h3>
          <p className="text-sm text-muted-foreground">
            Manage your practice locations. Shifts and appointments will be associated with specific locations.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setIsDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-location">
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
              <DialogDescription>
                {editingLocation ? "Update the location details below." : "Add a new office location for your practice."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Office, Downtown Branch" {...field} data-testid="input-location-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} data-testid="input-location-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} data-testid="input-location-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stateCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-location-state">
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES_LIST.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} data-testid="input-location-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} data-testid="input-location-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="location@practice.com" {...field} data-testid="input-location-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <FormField
                    control={form.control}
                    name="isPrimary"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-location-primary"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Primary Location</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-location-active"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Active</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-location">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                    data-testid="button-save-location"
                  >
                    {(createLocationMutation.isPending || updateLocationMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingLocation ? "Save Changes" : "Add Location"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : locations && locations.length > 0 ? (
        <div className="space-y-4">
          {locations.map((location) => (
            <Card key={location.id} className={cn(!location.isActive && "opacity-60")}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{location.name}</h4>
                      {location.isPrimary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                      {!location.isActive && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[location.address, location.city, location.stateCode, location.zipCode]
                        .filter(Boolean)
                        .join(", ") || "No address provided"}
                    </p>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      {location.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {location.phone}
                        </span>
                      )}
                      {location.email && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {location.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLocation(location)}
                    data-testid={`button-edit-location-${location.id}`}
                  >
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-location-${location.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Location</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{location.name}"? This action cannot be undone.
                          Any shifts or appointments associated with this location may be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteLocationMutation.mutate(location.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No locations"
          description="Add your first office location to get started."
          action={
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-location">
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          }
        />
      )}
    </div>
  );
}

type PracticeInsuranceCarrierWithDetails = {
  id: string;
  practiceId: string;
  carrierId: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string | null;
  carrier: InsuranceCarrier;
};

function InsuranceCarriersTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDetailCarrier, setSelectedDetailCarrier] = useState<PracticeInsuranceCarrierWithDetails | null>(null);
  const [carrierSearchQuery, setCarrierSearchQuery] = useState("");
  const [selectedCarrierIds, setSelectedCarrierIds] = useState<string[]>([]);
  const { toast } = useToast();
  const practiceId = useSettingsPracticeId();

  const openCarrierDetails = (pc: PracticeInsuranceCarrierWithDetails) => {
    setSelectedDetailCarrier(pc);
    setIsDetailDialogOpen(true);
  };

  const toggleCarrierSelection = (carrierId: string) => {
    setSelectedCarrierIds(prev => 
      prev.includes(carrierId) 
        ? prev.filter(id => id !== carrierId)
        : [...prev, carrierId]
    );
  };

  const selectAllFiltered = () => {
    if (filteredAvailableCarriers) {
      const allIds = filteredAvailableCarriers.map(c => c.id);
      setSelectedCarrierIds(allIds);
    }
  };

  const clearSelection = () => {
    setSelectedCarrierIds([]);
  };

  // Fetch practice-specific carriers
  const { data: practiceCarriers, isLoading } = useQuery<PracticeInsuranceCarrierWithDetails[]>({
    queryKey: ["/api/practices", practiceId, "insurance-carriers"],
    enabled: !!practiceId,
  });

  // Get all carriers for the dropdown
  const { data: allCarriers } = useQuery<InsuranceCarrier[]>({
    queryKey: ["/api/carriers"],
  });

  const addCarriersMutation = useMutation({
    mutationFn: async (carrierIds: string[]) => {
      if (!practiceId) throw new Error("No practice selected");
      const results = await Promise.all(
        carrierIds.map(carrierId => 
          apiRequest("POST", `/api/practices/${practiceId}/insurance-carriers`, { carrierId })
        )
      );
      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId, "insurance-carriers"] });
      toast({
        title: variables.length === 1 ? "Carrier added" : "Carriers added",
        description: `${variables.length} insurance carrier${variables.length === 1 ? " has" : "s have"} been added to your practice.`,
      });
      setIsDialogOpen(false);
      setSelectedCarrierIds([]);
      setCarrierSearchQuery("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add carriers. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeCarrierMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!practiceId) throw new Error("No practice selected");
      return apiRequest("DELETE", `/api/practices/${practiceId}/insurance-carriers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId, "insurance-carriers"] });
      toast({
        title: "Carrier removed",
        description: "The insurance carrier has been removed from your practice.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove carrier. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get carriers that haven't been added to the practice yet
  const availableCarriers = allCarriers?.filter(
    (carrier) => !practiceCarriers?.some((pc) => pc.carrierId === carrier.id)
  );

  const filteredAvailableCarriers = availableCarriers?.filter((carrier) =>
    carrier.name.toLowerCase().includes(carrierSearchQuery.toLowerCase())
  );

  const filteredPracticeCarriers = practiceCarriers?.filter((pc) =>
    pc.carrier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Insurance Carriers</h3>
          <p className="text-sm text-muted-foreground">
            Manage accepted insurance carriers for your practice
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setCarrierSearchQuery("");
            setSelectedCarrierIds([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-carrier">
              <Plus className="mr-2 h-4 w-4" />
              Add Carrier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] sm:max-w-2xl overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Insurance Carriers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 overflow-hidden flex flex-col flex-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={carrierSearchQuery}
                    onChange={(e) => setCarrierSearchQuery(e.target.value)}
                    placeholder="Search carriers..."
                    className="pl-9"
                    data-testid="input-search-available-carriers"
                  />
                </div>
                {selectedCarrierIds.length > 0 && (
                  <Badge variant="secondary" className="shrink-0">
                    {selectedCarrierIds.length} selected
                  </Badge>
                )}
              </div>
              
              {filteredAvailableCarriers && filteredAvailableCarriers.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {filteredAvailableCarriers.length} carrier{filteredAvailableCarriers.length !== 1 ? "s" : ""} available
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={selectAllFiltered}
                      className="h-7 text-xs"
                    >
                      Select All
                    </Button>
                    {selectedCarrierIds.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearSelection}
                        className="h-7 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {filteredAvailableCarriers && filteredAvailableCarriers.length > 0 ? (
                <div className="space-y-1 overflow-y-auto flex-1 pr-2">
                  {filteredAvailableCarriers.map((carrier) => (
                    <div
                      key={carrier.id}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedCarrierIds.includes(carrier.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleCarrierSelection(carrier.id)}
                      data-testid={`select-carrier-${carrier.id}`}
                    >
                      <div className={`flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 ${
                        selectedCarrierIds.includes(carrier.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}>
                        {selectedCarrierIds.includes(carrier.id) && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-xs font-semibold shrink-0">
                        {carrier.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{carrier.name}</div>
                        {carrier.phone && (
                          <div className="text-xs text-muted-foreground">{carrier.phone}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {carrier.insuranceType && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {carrier.insuranceType}
                          </Badge>
                        )}
                        {carrier.clearinghouseCompatible && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400"
                          >
                            <CheckCircle className="h-3 w-3" />
                            EDI
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : carrierSearchQuery ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No carriers found matching "{carrierSearchQuery}"
                </p>
              ) : availableCarriers && availableCarriers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All available carriers have been added to your practice.
                </p>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedCarrierIds.length > 0 && addCarriersMutation.mutate(selectedCarrierIds)}
                disabled={selectedCarrierIds.length === 0 || addCarriersMutation.isPending}
                data-testid="button-submit-carrier"
              >
                {addCarriersMutation.isPending 
                  ? "Adding..." 
                  : `Add ${selectedCarrierIds.length > 0 ? selectedCarrierIds.length : ""} Carrier${selectedCarrierIds.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your carriers..."
          className="pl-9"
          data-testid="input-search-carriers"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPracticeCarriers && filteredPracticeCarriers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPracticeCarriers.map((pc) => (
            <Card 
              key={pc.id} 
              className="hover-elevate cursor-pointer" 
              onClick={() => openCarrierDetails(pc)}
              data-testid={`card-carrier-${pc.carrier.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-lg font-semibold">
                    {pc.carrier.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="truncate font-semibold">{pc.carrier.name}</h3>
                      {pc.carrier.clearinghouseCompatible && (
                        <Badge
                          variant="outline"
                          className="shrink-0 gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400"
                        >
                          <CheckCircle className="h-3 w-3" />
                          EDI
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {pc.carrier.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{pc.carrier.phone}</span>
                        </div>
                      )}
                      {pc.carrier.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {pc.carrier.website.replace(/^https?:\/\//, "")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCarrierMutation.mutate(pc.id);
                    }}
                    disabled={removeCarrierMutation.isPending}
                    data-testid={`button-remove-carrier-${pc.carrier.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={searchQuery ? "No carriers found" : "No carriers yet"}
          description={
            searchQuery
              ? "Try adjusting your search"
              : "Add insurance carriers to start verifying patient benefits"
          }
          action={
            !searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Carrier
              </Button>
            )
          }
        />
      )}

      {/* Carrier Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedDetailCarrier && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                    {selectedDetailCarrier.carrier.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{selectedDetailCarrier.carrier.name}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDetailCarrier && (
            <div className="space-y-6">
              {/* Insurance Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Insurance Type</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {selectedDetailCarrier.carrier.insuranceType || "Dental"}
                  </Badge>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">Contact Information</Label>
                <div className="space-y-2">
                  {selectedDetailCarrier.carrier.phone ? (
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <a 
                          href={`tel:${selectedDetailCarrier.carrier.phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedDetailCarrier.carrier.phone}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No phone number available</p>
                    </div>
                  )}
                  
                  {selectedDetailCarrier.carrier.website ? (
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Website</p>
                        <a 
                          href={selectedDetailCarrier.carrier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedDetailCarrier.carrier.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No website available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Integration Capabilities */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">Integration Capabilities</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Plug className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Electronic Data Interchange (EDI)</p>
                        <p className="text-xs text-muted-foreground">Real-time eligibility verification</p>
                      </div>
                    </div>
                    {selectedDetailCarrier.carrier.clearinghouseCompatible ? (
                      <Badge 
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Supported
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Not Available
                      </Badge>
                    )}
                  </div>

                  {selectedDetailCarrier.carrier.payerId && (
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Payer ID</p>
                        <p className="text-sm font-mono text-muted-foreground">
                          {selectedDetailCarrier.carrier.payerId}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Claims Submission</p>
                        <p className="text-xs text-muted-foreground">Electronic claims processing</p>
                      </div>
                    </div>
                    {selectedDetailCarrier.carrier.clearinghouseCompatible ? (
                      <Badge 
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Supported
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Manual Only
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Real-time Benefits Check</p>
                        <p className="text-xs text-muted-foreground">Instant benefit verification</p>
                      </div>
                    </div>
                    {selectedDetailCarrier.carrier.clearinghouseCompatible ? (
                      <Badge 
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Supported
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Not Available
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Practice Notes */}
              {selectedDetailCarrier.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Practice Notes</Label>
                  <p className="text-sm p-3 rounded-md bg-muted/50">
                    {selectedDetailCarrier.notes}
                  </p>
                </div>
              )}

              {/* Added Date */}
              {selectedDetailCarrier.createdAt && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Added to practice on {new Date(selectedDetailCarrier.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DentrixConfig {
  configured: boolean;
  isEnabled: boolean;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  hasCredentials: boolean;
  clientId: string;
  hasClientSecret: boolean;
  hasApiKey: boolean;
}

interface DentrixSyncLog {
  id: string;
  syncType: string;
  status: string;
  patientsProcessed: number;
  patientsCreated: number;
  patientsUpdated: number;
  patientsSkipped: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

function IntegrationsTab() {
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState("60");
  const [showCredentials, setShowCredentials] = useState(false);

  const practiceId = "default-practice";

  const { data: config, isLoading } = useQuery<DentrixConfig>({
    queryKey: ["/api/dentrix/config", practiceId],
    queryFn: async () => {
      const response = await fetch(`/api/dentrix/config?practiceId=${practiceId}`);
      return response.json();
    },
  });

  const { data: syncHistory } = useQuery<DentrixSyncLog[]>({
    queryKey: ["/api/dentrix/sync-history", practiceId],
    queryFn: async () => {
      const response = await fetch(`/api/dentrix/sync-history?practiceId=${practiceId}`);
      return response.json();
    },
  });

  useEffect(() => {
    if (config) {
      setIsEnabled(config.isEnabled);
      setAutoSyncEnabled(config.autoSyncEnabled);
      setSyncIntervalMinutes(String(config.syncIntervalMinutes));
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/dentrix/config", { ...data, practiceId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dentrix/config", practiceId] });
      toast({ title: "Configuration saved", description: "Dentrix Ascend settings have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dentrix/test-connection", { practiceId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Connection successful", description: data.message });
      } else {
        toast({ title: "Connection failed", description: data.message, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Connection test failed.", variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (syncType: string) => {
      const response = await apiRequest("POST", "/api/dentrix/sync/patients", { syncType, practiceId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dentrix/sync-history", practiceId] });
      toast({ title: "Sync started", description: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start sync.", variant: "destructive" });
    },
  });

  const importSimulatedMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await apiRequest("POST", "/api/dentrix/import-simulated", { count, practiceId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dentrix/sync-history", practiceId] });
      toast({ title: "Import complete", description: data.message });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to import patients.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      clientId: clientId || undefined,
      clientSecret: clientSecret || undefined,
      apiKey: apiKey || undefined,
      isEnabled,
      autoSyncEnabled,
      syncIntervalMinutes: parseInt(syncIntervalMinutes),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Dentrix Ascend Integration</CardTitle>
                <CardDescription>
                  Connect to Dentrix Ascend to sync patient data automatically
                </CardDescription>
              </div>
            </div>
            {config?.hasCredentials && (
              <Badge variant={config.isEnabled ? "default" : "secondary"}>
                {config.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Switch
                id="dentrix-enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                data-testid="switch-dentrix-enabled"
              />
              <div>
                <Label htmlFor="dentrix-enabled" className="font-medium">Enable Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow patient data sync from Dentrix Ascend
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">API Credentials</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCredentials(!showCredentials)}
                data-testid="button-toggle-credentials"
              >
                {showCredentials ? "Hide" : "Show"} Credentials
              </Button>
            </div>

            {showCredentials && (
              <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    type="text"
                    placeholder={config?.clientId || "Enter OAuth Client ID"}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    data-testid="input-dentrix-client-id"
                  />
                  {config?.clientId && !clientId && (
                    <p className="text-xs text-muted-foreground">Current: {config.clientId}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder={config?.hasClientSecret ? "********" : "Enter OAuth Client Secret"}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    data-testid="input-dentrix-client-secret"
                  />
                  {config?.hasClientSecret && !clientSecret && (
                    <p className="text-xs text-green-600">Secret is configured</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={config?.hasApiKey ? "********" : "Enter Dentrix Developer Program API Key"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    data-testid="input-dentrix-api-key"
                  />
                  {config?.hasApiKey && !apiKey ? (
                    <p className="text-xs text-green-600">API Key is configured</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Get your API key from the Dentrix Developer Program at ddp.dentrix.com
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Sync Settings</h4>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Switch
                  id="auto-sync"
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                  data-testid="switch-auto-sync"
                />
                <div>
                  <Label htmlFor="auto-sync">Automatic Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync patient data on a schedule
                  </p>
                </div>
              </div>
              {autoSyncEnabled && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="syncInterval" className="text-sm text-muted-foreground">Every</Label>
                  <Select value={syncIntervalMinutes} onValueChange={setSyncIntervalMinutes}>
                    <SelectTrigger className="w-32" data-testid="select-sync-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="1440">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              data-testid="button-save-dentrix-config"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Configuration</>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending || !config?.hasCredentials}
              data-testid="button-test-dentrix-connection"
            >
              {testConnectionMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing...</>
              ) : (
                <><Link2 className="h-4 w-4 mr-2" /> Test Connection</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient Sync</CardTitle>
          <CardDescription>
            Manually trigger patient data synchronization or import test data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => syncMutation.mutate("full")}
              disabled={syncMutation.isPending || !config?.isEnabled}
              data-testid="button-full-sync"
            >
              {syncMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Full Sync</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate("incremental")}
              disabled={syncMutation.isPending || !config?.isEnabled}
              data-testid="button-incremental-sync"
            >
              <Clock className="h-4 w-4 mr-2" /> Incremental Sync
            </Button>
            <Button
              variant="secondary"
              onClick={() => importSimulatedMutation.mutate(5)}
              disabled={importSimulatedMutation.isPending}
              data-testid="button-import-simulated"
            >
              {importSimulatedMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
              ) : (
                <><Database className="h-4 w-4 mr-2" /> Import Test Patients</>
              )}
            </Button>
          </div>

          {config?.lastSyncAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last sync: {new Date(config.lastSyncAt).toLocaleString()}
              {config.lastSyncStatus && (
                <Badge variant={config.lastSyncStatus === "success" ? "default" : "destructive"}>
                  {config.lastSyncStatus}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {syncHistory && syncHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sync History</CardTitle>
            <CardDescription>Recent patient synchronization operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Processed</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncHistory.map((log) => (
                  <TableRow key={log.id} data-testid={`sync-log-${log.id}`}>
                    <TableCell className="text-sm">
                      {new Date(log.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.syncType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          log.status === "completed" ? "default" : 
                          log.status === "failed" ? "destructive" : 
                          "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{log.patientsProcessed}</TableCell>
                    <TableCell className="text-right text-green-600">{log.patientsCreated}</TableCell>
                    <TableCell className="text-right text-blue-600">{log.patientsUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <EligibilityVerificationSection />
    </div>
  );
}

function EligibilityVerificationSection() {
  const { toast } = useToast();
  const [dentalProvider, setDentalProvider] = useState("dentalxchange");
  const [dentalSubmitterId, setDentalSubmitterId] = useState("");
  const [dentalSecretId, setDentalSecretId] = useState("");
  const [dentalEnabled, setDentalEnabled] = useState(false);
  const [medicalProvider, setMedicalProvider] = useState("availity");
  const [medicalSubmitterId, setMedicalSubmitterId] = useState("");
  const [medicalSecretId, setMedicalSecretId] = useState("");
  const [medicalEnabled, setMedicalEnabled] = useState(false);
  const [showDentalCredentials, setShowDentalCredentials] = useState(false);
  const [showMedicalCredentials, setShowMedicalCredentials] = useState(false);

  const { data: configs, isLoading } = useQuery<ClearinghouseConfig[]>({
    queryKey: ["/api/clearinghouse-configs"],
  });

  useEffect(() => {
    if (configs) {
      const dentalConfig = configs.find(c => c.purpose === "dental_eligibility");
      const medicalConfig = configs.find(c => c.purpose === "medical_eligibility");
      
      if (dentalConfig) {
        setDentalProvider(dentalConfig.provider);
        setDentalSubmitterId(dentalConfig.submitterId || "");
        setDentalSecretId(dentalConfig.secretId || "");
        setDentalEnabled(dentalConfig.isActive ?? false);
      }
      if (medicalConfig) {
        setMedicalProvider(medicalConfig.provider);
        setMedicalSubmitterId(medicalConfig.submitterId || "");
        setMedicalSecretId(medicalConfig.secretId || "");
        setMedicalEnabled(medicalConfig.isActive ?? false);
      }
    }
  }, [configs]);

  const saveDentalMutation = useMutation({
    mutationFn: async () => {
      const existingConfig = configs?.find(c => c.purpose === "dental_eligibility");
      const method = existingConfig ? "PATCH" : "POST";
      const url = existingConfig 
        ? `/api/clearinghouse-configs/${existingConfig.id}` 
        : "/api/clearinghouse-configs";
      
      const response = await apiRequest(method, url, {
        name: DENTAL_CLEARINGHOUSE_OPTIONS.find(o => o.value === dentalProvider)?.label || "Dental Eligibility",
        provider: dentalProvider,
        purpose: "dental_eligibility",
        submitterId: dentalSubmitterId || null,
        secretId: dentalSecretId || null,
        isActive: dentalEnabled,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clearinghouse-configs"] });
      toast({ title: "Saved", description: "Dental eligibility clearinghouse configuration saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save dental configuration.", variant: "destructive" });
    },
  });

  const saveMedicalMutation = useMutation({
    mutationFn: async () => {
      const existingConfig = configs?.find(c => c.purpose === "medical_eligibility");
      const method = existingConfig ? "PATCH" : "POST";
      const url = existingConfig 
        ? `/api/clearinghouse-configs/${existingConfig.id}` 
        : "/api/clearinghouse-configs";
      
      const response = await apiRequest(method, url, {
        name: MEDICAL_CLEARINGHOUSE_OPTIONS.find(o => o.value === medicalProvider)?.label || "Medical Eligibility",
        provider: medicalProvider,
        purpose: "medical_eligibility",
        submitterId: medicalSubmitterId || null,
        secretId: medicalSecretId || null,
        isActive: medicalEnabled,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clearinghouse-configs"] });
      toast({ title: "Saved", description: "Medical eligibility clearinghouse configuration saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save medical configuration.", variant: "destructive" });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (configId: string) => {
      const response = await apiRequest("POST", `/api/clearinghouse-configs/${configId}/test`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clearinghouse-configs"] });
      if (data.status === "connected") {
        toast({ title: "Connection successful", description: "Clearinghouse connection verified." });
      } else {
        toast({ title: "Connection failed", description: data.message || "Could not connect to clearinghouse.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Connection test failed.", variant: "destructive" });
    },
  });

  const dentalConfig = configs?.find(c => c.purpose === "dental_eligibility");
  const medicalConfig = configs?.find(c => c.purpose === "medical_eligibility");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Eligibility Verification Clearinghouses</CardTitle>
            <CardDescription>
              Configure clearinghouse connections for dental and medical eligibility verification
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                  Dental
                </Badge>
                <h4 className="font-medium">Dental Eligibility</h4>
              </div>
              <Switch
                checked={dentalEnabled}
                onCheckedChange={setDentalEnabled}
                data-testid="switch-dental-eligibility-enabled"
              />
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Clearinghouse Provider</Label>
                <Select value={dentalProvider} onValueChange={setDentalProvider}>
                  <SelectTrigger data-testid="select-dental-clearinghouse">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DENTAL_CLEARINGHOUSE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDentalCredentials(!showDentalCredentials)}
                className="w-full justify-start"
                data-testid="button-toggle-dental-credentials"
              >
                {showDentalCredentials ? "Hide" : "Show"} Credentials
              </Button>

              {showDentalCredentials && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="dental-submitter-id">Submitter ID</Label>
                    <Input
                      id="dental-submitter-id"
                      placeholder="Your EDI submitter ID"
                      value={dentalSubmitterId}
                      onChange={(e) => setDentalSubmitterId(e.target.value)}
                      data-testid="input-dental-submitter-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dental-secret-id">Secret Vault Reference</Label>
                    <Input
                      id="dental-secret-id"
                      placeholder="e.g., dentalxchange/api-key"
                      value={dentalSecretId}
                      onChange={(e) => setDentalSecretId(e.target.value)}
                      data-testid="input-dental-secret-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      Reference to credentials in your secrets vault
                    </p>
                  </div>
                </div>
              )}

              {dentalConfig && (
                <div className="flex items-center gap-2 pt-2">
                  {getStatusBadge(dentalConfig.connectionStatus)}
                  {dentalConfig.lastTestedAt && (
                    <span className="text-xs text-muted-foreground">
                      Tested: {new Date(dentalConfig.lastTestedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => saveDentalMutation.mutate()}
                  disabled={saveDentalMutation.isPending}
                  data-testid="button-save-dental-config"
                >
                  {saveDentalMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving</>
                  ) : (
                    <><Save className="h-4 w-4 mr-1" /> Save</>
                  )}
                </Button>
                {dentalConfig && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnectionMutation.mutate(dentalConfig.id)}
                    disabled={testConnectionMutation.isPending}
                    data-testid="button-test-dental-connection"
                  >
                    {testConnectionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Plug className="h-4 w-4 mr-1" /> Test</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Medical
                </Badge>
                <h4 className="font-medium">Medical Eligibility</h4>
              </div>
              <Switch
                checked={medicalEnabled}
                onCheckedChange={setMedicalEnabled}
                data-testid="switch-medical-eligibility-enabled"
              />
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Clearinghouse Provider</Label>
                <Select value={medicalProvider} onValueChange={setMedicalProvider}>
                  <SelectTrigger data-testid="select-medical-clearinghouse">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICAL_CLEARINGHOUSE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMedicalCredentials(!showMedicalCredentials)}
                className="w-full justify-start"
                data-testid="button-toggle-medical-credentials"
              >
                {showMedicalCredentials ? "Hide" : "Show"} Credentials
              </Button>

              {showMedicalCredentials && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="medical-submitter-id">Submitter ID</Label>
                    <Input
                      id="medical-submitter-id"
                      placeholder="Your EDI submitter ID"
                      value={medicalSubmitterId}
                      onChange={(e) => setMedicalSubmitterId(e.target.value)}
                      data-testid="input-medical-submitter-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical-secret-id">Secret Vault Reference</Label>
                    <Input
                      id="medical-secret-id"
                      placeholder="e.g., availity/api-key"
                      value={medicalSecretId}
                      onChange={(e) => setMedicalSecretId(e.target.value)}
                      data-testid="input-medical-secret-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      Reference to credentials in your secrets vault
                    </p>
                  </div>
                </div>
              )}

              {medicalConfig && (
                <div className="flex items-center gap-2 pt-2">
                  {getStatusBadge(medicalConfig.connectionStatus)}
                  {medicalConfig.lastTestedAt && (
                    <span className="text-xs text-muted-foreground">
                      Tested: {new Date(medicalConfig.lastTestedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => saveMedicalMutation.mutate()}
                  disabled={saveMedicalMutation.isPending}
                  data-testid="button-save-medical-config"
                >
                  {saveMedicalMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving</>
                  ) : (
                    <><Save className="h-4 w-4 mr-1" /> Save</>
                  )}
                </Button>
                {medicalConfig && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnectionMutation.mutate(medicalConfig.id)}
                    disabled={testConnectionMutation.isPending}
                    data-testid="button-test-medical-connection"
                  >
                    {testConnectionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Plug className="h-4 w-4 mr-1" /> Test</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">How It Works</h4>
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <Badge variant="outline" className="h-fit bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">Dental</Badge>
              <p>DentalXchange specializes in dental-specific eligibility verification, providing detailed dental benefits, frequencies, and coverage information.</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="h-fit bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Medical</Badge>
              <p>Availity or Office Ally handles medical eligibility checks for patients with medical insurance that covers dental procedures.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PracticeAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["admin", "staff", "billing"]),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

function UsersTab() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: users, isLoading } = useQuery<PracticeAdmin[]>({
    queryKey: ["/api/practice-admins"],
  });

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      role: "staff",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const res = await apiRequest("POST", "/api/practice-admins", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-admins"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "User Created",
        description: "The new user has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PracticeAdmin> }) => {
      const res = await apiRequest("PATCH", `/api/practice-admins/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-admins"] });
      toast({
        title: "User Updated",
        description: "The user has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const res = await apiRequest("POST", `/api/practice-admins/${id}/reset-password`, { password });
      return res.json();
    },
    onSuccess: () => {
      setResetPasswordUserId(null);
      setNewPassword("");
      toast({
        title: "Password Reset",
        description: "The user's password has been reset successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  const toggleUserActive = (user: PracticeAdmin) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { isActive: !user.isActive },
    });
  };

  const handleResetPassword = () => {
    if (resetPasswordUserId && newPassword.length >= 6) {
      resetPasswordMutation.mutate({ id: resetPasswordUserId, password: newPassword });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "billing":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage users who can access your practice account
                </CardDescription>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-user">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account for your practice.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-user-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-user-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} data-testid="input-user-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-user-role">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createUserMutation.isPending}
                        data-testid="button-submit-user"
                      >
                        {createUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create User"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users yet"
              description="Add team members to give them access to your practice account."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? "secondary" : "outline"}
                        className={user.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog
                          open={resetPasswordUserId === user.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setResetPasswordUserId(null);
                              setNewPassword("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setResetPasswordUserId(user.id)}
                              data-testid={`button-reset-password-${user.id}`}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reset Password</DialogTitle>
                              <DialogDescription>
                                Set a new password for {user.firstName} {user.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Enter new password"
                                  data-testid="input-new-password"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Password must be at least 6 characters
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setResetPasswordUserId(null);
                                  setNewPassword("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleResetPassword}
                                disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
                                data-testid="button-confirm-reset-password"
                              >
                                {resetPasswordMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                  </>
                                ) : (
                                  "Reset Password"
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserActive(user)}
                          disabled={updateUserMutation.isPending}
                          data-testid={`button-toggle-active-${user.id}`}
                        >
                          {user.isActive ? (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("office-profile");
  const { practice, admin, isLoading } = useAuth();
  
  // Use admin.practiceId as fallback if practice object hasn't loaded yet
  const practiceId = practice?.id || admin?.practiceId || null;

  const tabCounts = {
    "office-profile": 3,
    "practice-info": 9,
    "locations": 0,
    "staffing": 5,
    "billing": 1,
    "carriers": 0,
    "users": 0,
  };
  
  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SettingsPracticeContext.Provider value={practiceId}>
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="office-profile" className="flex items-center gap-2" data-testid="tab-office-profile">
            Office profile
            <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {tabCounts["office-profile"]}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="practice-info" className="flex items-center gap-2" data-testid="tab-practice-info">
            Practice info
            <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {tabCounts["practice-info"]}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2" data-testid="tab-locations">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="carriers" className="flex items-center gap-2" data-testid="tab-carriers">
            Carriers
          </TabsTrigger>
          <TabsTrigger value="staffing" className="flex items-center gap-2" data-testid="tab-staffing">
            Staffing
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
          <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2" data-testid="tab-integrations">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="office-profile">
          <OfficeProfileTab />
        </TabsContent>

        <TabsContent value="practice-info">
          <PracticeInformationTab />
        </TabsContent>

        <TabsContent value="locations">
          <LocationsTab />
        </TabsContent>

        <TabsContent value="carriers">
          <InsuranceCarriersTab />
        </TabsContent>

        <TabsContent value="staffing">
          <StaffingSettingsTab />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
    </SettingsPracticeContext.Provider>
  );
}
