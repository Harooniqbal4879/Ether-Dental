import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePersona } from "@/lib/persona-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Plus, Check, X, Eye, Pencil, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Practice } from "@shared/schema";

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

interface PracticeFormData {
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
}

function PracticeForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  mode 
}: { 
  initialData?: Practice;
  onSubmit: (data: PracticeFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "add" | "edit";
}) {
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">Practice Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
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
          <div className="col-span-2">
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
          <div className="col-span-2">
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

      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">Owner Information</h4>
        <div className="grid grid-cols-2 gap-4">
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="button-save-practice">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "add" ? "Add Practice" : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "rejected":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function PracticeManagementPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { currentPersona } = usePersona();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: practices, isLoading } = useQuery<Practice[]>({
    queryKey: ["/api/practices"],
    enabled: currentPersona === "system_admin",
  });

  const createMutation = useMutation({
    mutationFn: async (data: PracticeFormData) => {
      return apiRequest("POST", "/api/practices", {
        ...data,
        registrationStatus: "approved",
        registrationSource: "admin",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices"] });
      setAddDialogOpen(false);
      toast({ title: "Practice added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add practice", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Practice> }) => {
      return apiRequest("PATCH", `/api/practices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices"] });
      setEditDialogOpen(false);
      setSelectedPractice(null);
      toast({ title: "Practice updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update practice", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/practices/${id}`, {
        registrationStatus: "approved",
        approvedBy: "System Administrator",
        approvedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices"] });
      toast({ title: "Practice approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve practice", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest("PATCH", `/api/practices/${id}`, {
        registrationStatus: "rejected",
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices"] });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedPractice(null);
      toast({ title: "Practice registration rejected" });
    },
    onError: () => {
      toast({ title: "Failed to reject practice", variant: "destructive" });
    },
  });

  // Access control - must come after all hooks
  if (currentPersona !== "system_admin") {
    setLocation("/");
    return null;
  }

  const pendingCount = practices?.filter(p => p.registrationStatus === "pending").length || 0;

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold" data-testid="text-practice-management-title">Practice Management</h1>
              <p className="text-muted-foreground">Manage dental practices and registrations</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              {pendingCount} pending approval{pendingCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>All Practices</CardTitle>
              <CardDescription>View and manage registered dental practices</CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-practice">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Practice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Practice</DialogTitle>
                  <DialogDescription>
                    Enter the practice details below. This practice will be immediately approved.
                  </DialogDescription>
                </DialogHeader>
                <PracticeForm
                  mode="add"
                  onSubmit={(data) => createMutation.mutate(data)}
                  onCancel={() => setAddDialogOpen(false)}
                  isSubmitting={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !practices || practices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No practices registered yet. Click "Add Practice" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Practice Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {practices.map((practice) => (
                    <TableRow key={practice.id} data-testid={`row-practice-${practice.id}`}>
                      <TableCell>
                        <div className="font-medium">{practice.name}</div>
                        <div className="text-sm text-muted-foreground">{practice.email}</div>
                      </TableCell>
                      <TableCell>
                        {practice.city && practice.stateCode
                          ? `${practice.city}, ${practice.stateCode}`
                          : practice.stateCode || "-"}
                      </TableCell>
                      <TableCell>
                        {practice.ownerFirstName && practice.ownerLastName
                          ? `${practice.ownerFirstName} ${practice.ownerLastName}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {practice.registrationSource === "self_registration" ? "Self-Registered" : "Admin Added"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={practice.registrationStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {practice.registrationStatus === "pending" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => approveMutation.mutate(practice.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${practice.id}`}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedPractice(practice);
                                  setRejectDialogOpen(true);
                                }}
                                data-testid={`button-reject-${practice.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPractice(practice);
                              setViewDialogOpen(true);
                            }}
                            data-testid={`button-view-${practice.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPractice(practice);
                              setEditDialogOpen(true);
                            }}
                            data-testid={`button-edit-${practice.id}`}
                          >
                            <Pencil className="h-4 w-4" />
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
      </main>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Practice Details</DialogTitle>
          </DialogHeader>
          {selectedPractice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Practice Name</Label>
                  <p className="font-medium">{selectedPractice.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1"><StatusBadge status={selectedPractice.registrationStatus} /></div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p>{selectedPractice.address || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">City, State</Label>
                  <p>{selectedPractice.city && selectedPractice.stateCode ? `${selectedPractice.city}, ${selectedPractice.stateCode} ${selectedPractice.zipCode || ""}` : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p>{selectedPractice.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{selectedPractice.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">NPI Number</Label>
                  <p>{selectedPractice.npiNumber || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tax ID</Label>
                  <p>{selectedPractice.taxId || "-"}</p>
                </div>
              </div>
              {(selectedPractice.ownerFirstName || selectedPractice.ownerEmail) && (
                <>
                  <hr />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Owner Name</Label>
                      <p>{`${selectedPractice.ownerFirstName || ""} ${selectedPractice.ownerLastName || ""}`.trim() || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Owner Email</Label>
                      <p>{selectedPractice.ownerEmail || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Owner Phone</Label>
                      <p>{selectedPractice.ownerPhone || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Registration Source</Label>
                      <p>{selectedPractice.registrationSource === "self_registration" ? "Self-Registered" : "Admin Added"}</p>
                    </div>
                  </div>
                </>
              )}
              {selectedPractice.rejectionReason && (
                <>
                  <hr />
                  <div>
                    <Label className="text-muted-foreground">Rejection Reason</Label>
                    <p className="text-red-600">{selectedPractice.rejectionReason}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Practice</DialogTitle>
            <DialogDescription>Update the practice information below.</DialogDescription>
          </DialogHeader>
          {selectedPractice && (
            <PracticeForm
              mode="edit"
              initialData={selectedPractice}
              onSubmit={(data) => updateMutation.mutate({ id: selectedPractice.id, data })}
              onCancel={() => {
                setEditDialogOpen(false);
                setSelectedPractice(null);
              }}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the practice registration for "{selectedPractice?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                data-testid="input-rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this registration is being rejected..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedPractice) {
                  rejectMutation.mutate({ id: selectedPractice.id, reason: rejectionReason });
                }
              }}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
