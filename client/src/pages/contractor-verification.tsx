import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  User,
  CreditCard,
  ShieldCheck,
  Search,
  Filter,
  ChevronRight,
  Eye,
  Loader2,
  Ban,
  DollarSign,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res;
}

interface Contractor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  onboardingStatus: string;
  paymentEligible: boolean;
  identityVerified: boolean;
  w9Completed: boolean;
  agreementsSigned: boolean;
  paymentMethodVerified: boolean;
  createdAt: string;
  documents: any[];
  taxForms: any[];
  paymentMethods: any[];
  agreements: any[];
  pendingDocuments: number;
  pendingW9: boolean;
}

export default function ContractorVerification() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { authenticated, admin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: string; id?: string; docId?: string }>({ open: false, type: "" });

  const { data: contractors, isLoading, refetch } = useQuery<Contractor[]>({
    queryKey: ["/api/admin/contractors"],
    enabled: authenticated,
  });

  const verifyDocumentMutation = useMutation({
    mutationFn: async ({ contractorId, documentId, action, rejectionReason }: { contractorId: string; documentId: string; action: string; rejectionReason?: string }) => {
      const res = await apiRequest("POST", `/api/admin/contractors/${contractorId}/documents/${documentId}/verify`, { action, rejectionReason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document verified" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contractors"] });
      setActionDialog({ open: false, type: "" });
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const verifyW9Mutation = useMutation({
    mutationFn: async ({ contractorId, action, rejectionReason }: { contractorId: string; action: string; rejectionReason?: string }) => {
      const res = await apiRequest("POST", `/api/admin/contractors/${contractorId}/w9/verify`, { action, rejectionReason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "W-9 verified" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contractors"] });
      setActionDialog({ open: false, type: "" });
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ contractorId, status, notes }: { contractorId: string; status: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/admin/contractors/${contractorId}/status`, { status, notes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contractors"] });
      setSelectedContractor(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Admin Access Required</h2>
                <p className="text-muted-foreground">Please sign in as an admin to access contractor verification.</p>
              </div>
              <Button onClick={() => setLocation("/login/admin")} data-testid="button-signin">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment_eligible":
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Payment Eligible</Badge>;
      case "verified":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Verified</Badge>;
      case "under_review":
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Under Review</Badge>;
      case "in_progress":
        return <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/20">In Progress</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-700 border-red-500/20">Rejected</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/10 text-red-700 border-red-500/20">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const filteredContractors = contractors?.filter((c) => {
    const matchesSearch = searchQuery === "" || 
      c.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.onboardingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: contractors?.length || 0,
    pendingReview: contractors?.filter(c => c.pendingDocuments > 0 || c.pendingW9).length || 0,
    paymentEligible: contractors?.filter(c => c.paymentEligible).length || 0,
    suspended: contractors?.filter(c => c.onboardingStatus === "suspended").length || 0,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title="Contractor Verification"
        description="Review and verify contractor onboarding documents and eligibility"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contractors</p>
                <p className="text-2xl font-bold" data-testid="text-total-contractors">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold" data-testid="text-pending-review">{stats.pendingReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Eligible</p>
                <p className="text-2xl font-bold" data-testid="text-payment-eligible">{stats.paymentEligible}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold" data-testid="text-suspended">{stats.suspended}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Contractors</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contractors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-contractors"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="payment_eligible">Payment Eligible</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredContractors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No contractors found
              </div>
            ) : (
              filteredContractors.map((contractor) => (
                <div
                  key={contractor.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate cursor-pointer"
                  onClick={() => setSelectedContractor(contractor)}
                  data-testid={`card-contractor-${contractor.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {contractor.firstName?.[0]}{contractor.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {contractor.firstName} {contractor.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{contractor.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {contractor.identityVerified && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          ID
                        </Badge>
                      )}
                      {contractor.w9Completed && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          W-9
                        </Badge>
                      )}
                      {contractor.agreementsSigned && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Agreements
                        </Badge>
                      )}
                      {contractor.paymentMethodVerified && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Payment
                        </Badge>
                      )}
                    </div>

                    {(contractor.pendingDocuments > 0 || contractor.pendingW9) && (
                      <Badge variant="destructive" className="animate-pulse">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {contractor.pendingDocuments + (contractor.pendingW9 ? 1 : 0)} pending
                      </Badge>
                    )}

                    {getStatusBadge(contractor.onboardingStatus)}

                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedContractor} onOpenChange={(open) => !open && setSelectedContractor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedContractor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedContractor.firstName?.[0]}{selectedContractor.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {selectedContractor.firstName} {selectedContractor.lastName}
                    <p className="text-sm font-normal text-muted-foreground">{selectedContractor.email}</p>
                  </div>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-2">
                  {getStatusBadge(selectedContractor.onboardingStatus)}
                  {selectedContractor.paymentEligible && (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Payment Eligible
                    </Badge>
                  )}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="documents" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="w9">W-9</TabsTrigger>
                  <TabsTrigger value="agreements">Agreements</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-4 mt-4">
                  {selectedContractor.documents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No documents uploaded</p>
                  ) : (
                    selectedContractor.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.documentType.replace(/_/g, " ").toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">{doc.documentName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.verificationStatus === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActionDialog({ open: true, type: "reject_doc", id: selectedContractor.id, docId: doc.id })}
                                data-testid={`button-reject-doc-${doc.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => verifyDocumentMutation.mutate({ contractorId: selectedContractor.id, documentId: doc.id, action: "approve" })}
                                disabled={verifyDocumentMutation.isPending}
                                data-testid={`button-approve-doc-${doc.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </>
                          ) : (
                            <Badge variant={doc.verificationStatus === "approved" ? "default" : "destructive"}>
                              {doc.verificationStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="w9" className="mt-4">
                  {selectedContractor.taxForms.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No W-9 submitted</p>
                  ) : (
                    selectedContractor.taxForms.map((tf) => (
                      <div key={tf.id} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Legal Name</Label>
                            <p className="font-medium">{tf.legalName}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Business Name</Label>
                            <p className="font-medium">{tf.businessName || "-"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Tax Classification</Label>
                            <p className="font-medium">{tf.taxClassification?.replace(/_/g, " ").toUpperCase()}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Tax ID</Label>
                            <p className="font-medium">
                              {tf.useSsn ? `SSN: ***-**-${tf.ssnLast4}` : `EIN: **-***${tf.einLast4}`}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-muted-foreground">Tax Address</Label>
                            <p className="font-medium">
                              {tf.taxAddressStreet}, {tf.taxAddressCity}, {tf.taxAddressState} {tf.taxAddressZip}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Electronic Signature</Label>
                            <p className="font-medium">{tf.electronicSignature ? "Yes" : "No"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Signed Date</Label>
                            <p className="font-medium">
                              {tf.signatureDate ? new Date(tf.signatureDate).toLocaleDateString() : "-"}
                            </p>
                          </div>
                        </div>

                        {tf.verificationStatus === "pending" ? (
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setActionDialog({ open: true, type: "reject_w9", id: selectedContractor.id })}
                              data-testid="button-reject-w9"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject W-9
                            </Button>
                            <Button
                              onClick={() => verifyW9Mutation.mutate({ contractorId: selectedContractor.id, action: "approve" })}
                              disabled={verifyW9Mutation.isPending}
                              data-testid="button-approve-w9"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve W-9
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end pt-4">
                            <Badge variant={tf.verificationStatus === "verified" ? "default" : "destructive"}>
                              {tf.verificationStatus}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="agreements" className="space-y-4 mt-4">
                  {selectedContractor.agreements.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No agreements signed</p>
                  ) : (
                    selectedContractor.agreements.map((agreement) => (
                      <div key={agreement.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{agreement.agreementType.replace(/_/g, " ").toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">Version: {agreement.agreementVersion}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {agreement.signedAt ? (
                            <div>
                              <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Signed
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(agreement.signedAt).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="payment" className="space-y-4 mt-4">
                  {selectedContractor.paymentMethods.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No payment methods</p>
                  ) : (
                    selectedContractor.paymentMethods.map((pm) => (
                      <div key={pm.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{pm.methodType.replace(/_/g, " ").toUpperCase()}</p>
                            {pm.bankName && (
                              <p className="text-sm text-muted-foreground">
                                {pm.bankName} - ****{pm.accountLast4}
                              </p>
                            )}
                            {pm.stripeAccountId && (
                              <p className="text-sm text-muted-foreground">
                                Stripe: {pm.stripeAccountId}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={pm.verificationStatus === "verified" ? "default" : "outline"}>
                          {pm.verificationStatus}
                        </Badge>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>

              <Separator className="my-4" />

              <div className="flex justify-between gap-2 flex-wrap">
                <div className="flex gap-2">
                  {selectedContractor.onboardingStatus !== "suspended" && (
                    <Button
                      variant="destructive"
                      onClick={() => updateStatusMutation.mutate({ contractorId: selectedContractor.id, status: "suspended" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-suspend"
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                  )}
                  {selectedContractor.onboardingStatus === "suspended" && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ contractorId: selectedContractor.id, status: "verified" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-reinstate"
                    >
                      Reinstate
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {!selectedContractor.paymentEligible && selectedContractor.onboardingStatus !== "suspended" && (
                    <Button
                      onClick={() => updateStatusMutation.mutate({ contractorId: selectedContractor.id, status: "payment_eligible" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-approve-payment"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Approve for Payment
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type.includes("reject") ? "Reject" : "Action"} 
              {actionDialog.type.includes("doc") ? " Document" : " W-9"}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                data-testid="textarea-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: "" })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (actionDialog.type === "reject_doc" && actionDialog.id && actionDialog.docId) {
                  verifyDocumentMutation.mutate({
                    contractorId: actionDialog.id,
                    documentId: actionDialog.docId,
                    action: "reject",
                    rejectionReason: rejectReason,
                  });
                } else if (actionDialog.type === "reject_w9" && actionDialog.id) {
                  verifyW9Mutation.mutate({
                    contractorId: actionDialog.id,
                    action: "reject",
                    rejectionReason: rejectReason,
                  });
                }
              }}
              disabled={verifyDocumentMutation.isPending || verifyW9Mutation.isPending}
              data-testid="button-confirm-reject"
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
