import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { format, isToday, isTomorrow } from "date-fns";
import { Plus, Users, ChevronRight, Phone, Mail, Calendar, Clock, RefreshCw, Shield, Upload, FileSpreadsheet, X, Download } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { PatientSearch } from "@/components/patient-search";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { PatientCardSkeleton, TableRowSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { PatientWithInsurance, Appointment, Patient, Verification } from "@shared/schema";
import { EligibilityTabContent } from "./eligibility";

type AppointmentWithDetails = Appointment & {
  patient: Patient & { latestVerification?: Verification };
};

function PatientsTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: patients, isLoading } = useQuery<PatientWithInsurance[]>({
    queryKey: ["/api/patients"],
  });

  const filteredPatients = patients?.filter((patient) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(query) ||
      patient.lastName.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.includes(query) ||
      patient.insurancePolicies?.some(
        (policy) =>
          policy.carrier.name.toLowerCase().includes(query) ||
          policy.policyNumber.toLowerCase().includes(query)
      )
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getVerificationStatus = (patient: PatientWithInsurance, insuranceType: "dental" | "medical" = "dental") => {
    // Use per-insurance-type verification fields if available
    const verification = insuranceType === "dental" 
      ? patient.latestDentalVerification 
      : patient.latestMedicalVerification;
    
    if (verification) {
      return verification.status as "completed" | "pending" | "in_progress" | "failed";
    }
    
    // Fall back to legacy latestVerification for dental
    if (insuranceType === "dental" && patient.latestVerification) {
      return patient.latestVerification.status as "completed" | "pending" | "in_progress" | "failed";
    }
    
    return "pending";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <PatientSearch
          value={searchQuery}
          onChange={setSearchQuery}
          className="flex-1 max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {filteredPatients?.length ?? 0} patients
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PatientCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPatients && filteredPatients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Link
              key={patient.id}
              href={`/patients/${patient.id}`}
              className="block"
            >
              <Card
                className="group cursor-pointer transition-colors hover-elevate"
                data-testid={`card-patient-${patient.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-11 w-11 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(patient.firstName, patient.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate font-semibold">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        DOB: {format(new Date(patient.dateOfBirth), "MM/dd/yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {/* Show dental insurance if present */}
                    {patient.insurancePolicies?.filter(p => 
                      p.carrier.insuranceType === "dental" || !p.carrier.insuranceType
                    )[0] && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Badge variant="outline" className="shrink-0 text-xs px-1.5">D</Badge>
                          <span className="text-sm text-muted-foreground truncate">
                            {patient.insurancePolicies.filter(p => 
                              p.carrier.insuranceType === "dental" || !p.carrier.insuranceType
                            )[0].carrier.name}
                          </span>
                        </div>
                        <VerificationStatusBadge
                          status={getVerificationStatus(patient, "dental")}
                        />
                      </div>
                    )}
                    {/* Show medical insurance if present */}
                    {patient.insurancePolicies?.filter(p => 
                      p.carrier.insuranceType === "medical"
                    )[0] && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Badge variant="outline" className="shrink-0 text-xs px-1.5 border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400">M</Badge>
                          <span className="text-sm text-muted-foreground truncate">
                            {patient.insurancePolicies.filter(p => 
                              p.carrier.insuranceType === "medical"
                            )[0].carrier.name}
                          </span>
                        </div>
                        <VerificationStatusBadge
                          status={getVerificationStatus(patient, "medical")}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {patient.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="truncate">{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={searchQuery ? "No patients found" : "No patients yet"}
          description={
            searchQuery
              ? "Try adjusting your search terms"
              : "Add your first patient to start verifying insurance"
          }
          action={
            !searchQuery && (
              <Button asChild>
                <Link href="/patients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patient
                </Link>
              </Button>
            )
          }
        />
      )}
    </div>
  );
}

function AppointmentsTab() {
  const { data: appointments, isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  const groupedAppointments = appointments?.reduce(
    (groups, apt) => {
      const dateKey = format(new Date(apt.scheduledAt), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(apt);
      return groups;
    },
    {} as Record<string, AppointmentWithDetails[]>
  );

  const sortedDates = groupedAppointments
    ? Object.keys(groupedAppointments).sort()
    : [];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const needsVerificationCount =
    appointments?.filter(
      (a) =>
        !a.patient.latestVerification ||
        a.patient.latestVerification.status !== "completed"
    ).length ?? 0;

  return (
    <div className="space-y-4">
      {needsVerificationCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {needsVerificationCount} appointments need verification
              </p>
              <p className="text-sm text-muted-foreground">
                Verify insurance before patient visits to ensure smooth check-in
              </p>
            </div>
            <Button variant="outline" data-testid="button-verify-all">
              <RefreshCw className="mr-2 h-4 w-4" />
              Verify All
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Card>
                <CardContent className="p-0">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-4 border-b p-4 last:border-0">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const date = new Date(dateKey);
            const dayAppointments = groupedAppointments![dateKey];

            return (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{getDateLabel(date)}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {dayAppointments.length} appointments
                  </Badge>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y">
                    {dayAppointments.map((apt) => {
                      const verificationStatus =
                        apt.patient.latestVerification?.status || "pending";

                      return (
                        <Link
                          key={apt.id}
                          href={`/patients/${apt.patientId}`}
                          className="flex items-center gap-4 p-4 hover-elevate cursor-pointer"
                          data-testid={`appointment-${apt.id}`}
                        >
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                              {getInitials(
                                apt.patient.firstName,
                                apt.patient.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {apt.patient.firstName} {apt.patient.lastName}
                              </span>
                              <VerificationStatusBadge
                                status={
                                  verificationStatus as
                                    | "completed"
                                    | "pending"
                                    | "in_progress"
                                    | "failed"
                                }
                              />
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(new Date(apt.scheduledAt), "h:mm a")}
                              </span>
                              <span>{apt.appointmentType}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No upcoming appointments"
          description="Appointments will appear here once they're scheduled in your practice management system."
        />
      )}
    </div>
  );
}

export default function Patients() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const params = new URLSearchParams(searchString);
  const tabFromUrl = params.get("tab") || "patients";
  // Support legacy tab names for backward compatibility
  const normalizedTab = tabFromUrl === "verifications" || tabFromUrl === "eligibility" ? "insurance" : tabFromUrl;
  const activeTab = ["patients", "appointments", "insurance"].includes(normalizedTab) 
    ? normalizedTab 
    : "patients";

  const handleTabChange = (value: string) => {
    if (value === "patients") {
      setLocation("/patients");
    } else {
      setLocation(`/patients?tab=${value}`);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (data: { patients: any[] }) => {
      const response = await apiRequest("POST", "/api/patients/import-csv", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: data.message || `Imported ${data.created} new patients${data.skipped > 0 ? ` (${data.skipped} already existed)` : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowImportDialog(false);
      setSelectedFile(null);
      setImportPreview([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Parse a CSV line handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Parse CSV for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must have a header row and at least one data row",
          variant: "destructive",
        });
        return;
      }
      
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ""));
      const patients = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const patient: Record<string, string> = {};
        headers.forEach((header, i) => {
          patient[header] = values[i] || "";
        });
        return patient;
      }).filter(p => p.firstname || p.first_name || p.lastname || p.last_name);
      
      setImportPreview(patients.slice(0, 5)); // Show first 5 for preview
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ""));
      const patients = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const patient: Record<string, string> = {};
        headers.forEach((header, i) => {
          patient[header] = values[i] || "";
        });
        return patient;
      }).filter(p => p.firstname || p.first_name || p.lastname || p.last_name);
      
      importMutation.mutate({ patients });
    };
    reader.readAsText(selectedFile);
  };

  const downloadTemplate = () => {
    const headers = "first_name,last_name,date_of_birth,email,phone,address,city,state,zip_code";
    const example = "John,Doe,1985-03-15,john.doe@example.com,555-123-4567,123 Main St,Springfield,CA,90210";
    const csv = `${headers}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Patients"
        description="Manage patients, insurance verifications, and appointments"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowImportDialog(true)}
              data-testid="button-import-csv"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button asChild data-testid="button-add-patient">
              <Link href="/patients/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
              </Link>
            </Button>
          </div>
        }
      />

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Patients from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with patient data. Required columns: first_name, last_name
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-template">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
            
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover-elevate"
              onClick={() => fileInputRef.current?.click()}
              data-testid="csv-drop-zone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-csv-file"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {importPreview.length > 0 && `${importPreview.length}+ patients found`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setImportPreview([]);
                    }}
                    data-testid="button-remove-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to select a CSV file or drag and drop
                  </p>
                </div>
              )}
            </div>
            
            {importPreview.length > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Preview (first {importPreview.length} rows):</p>
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {importPreview.map((p, i) => (
                    <div key={i} className="flex gap-2 text-muted-foreground">
                      <span>{p.first_name || p.firstname}</span>
                      <span>{p.last_name || p.lastname}</span>
                      <span>{p.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile || importMutation.isPending}
              data-testid="button-confirm-import"
            >
              {importMutation.isPending ? "Importing..." : "Import Patients"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="patients" className="flex items-center gap-2" data-testid="tab-patients">
            <Users className="h-4 w-4" />
            Patients
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2" data-testid="tab-appointments">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="insurance" className="flex items-center gap-2" data-testid="tab-insurance">
            <Shield className="h-4 w-4" />
            Insurance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <PatientsTab />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTab />
        </TabsContent>

        <TabsContent value="insurance">
          <EligibilityTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
