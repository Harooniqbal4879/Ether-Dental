import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePersona } from "@/lib/persona-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, DollarSign, MapPin, Plus, Pencil, Save, Loader2, Plug, Shield, Trash2, CheckCircle, XCircle, AlertCircle, Stethoscope, Database, RefreshCw, Link2, Clock } from "lucide-react";
import { EligibilityCheck } from "@/components/eligibility-check";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PlatformSettings, PlatformStateTaxRate, ClearinghouseConfig, InsertClearinghouseConfig } from "@shared/schema";

export default function PlatformSettingsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { currentPersona } = usePersona();
  const [activeTab, setActiveTab] = useState("fees");

  // Access control: Only system_admin can access this page
  useEffect(() => {
    if (currentPersona !== "system_admin") {
      setLocation("/");
    }
  }, [currentPersona, setLocation]);

  const { data: platformSettings, isLoading: isLoadingSettings } = useQuery<PlatformSettings>({
    queryKey: ["/api/settings/platform"],
    enabled: currentPersona === "system_admin",
  });

  const { data: stateTaxRates, isLoading: isLoadingRates } = useQuery<PlatformStateTaxRate[]>({
    queryKey: ["/api/settings/state-tax-rates"],
    enabled: currentPersona === "system_admin",
  });

  // Don't render if not system_admin (will redirect)
  if (currentPersona !== "system_admin") {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-platform-settings-title">Platform Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure global fee rates and state-specific tax settings
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList data-testid="tabs-platform-settings">
            <TabsTrigger value="fees" data-testid="tab-platform-fees">
              <DollarSign className="h-4 w-4 mr-2" />
              Platform Fees
            </TabsTrigger>
            <TabsTrigger value="states" data-testid="tab-state-taxes">
              <MapPin className="h-4 w-4 mr-2" />
              State Tax Rates
            </TabsTrigger>
            <TabsTrigger value="integrations" data-testid="tab-integrations">
              <Plug className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="eligibility" data-testid="tab-eligibility">
              <Stethoscope className="h-4 w-4 mr-2" />
              Eligibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="space-y-6">
            {isLoadingSettings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : platformSettings ? (
              <PlatformFeesForm settings={platformSettings} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No platform settings found. They will be created automatically.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="states" className="space-y-6">
            <StateTaxRatesTable
              rates={stateTaxRates || []}
              isLoading={isLoadingRates}
            />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <ClearinghouseIntegrationsTab />
          </TabsContent>

          <TabsContent value="eligibility" className="space-y-6">
            <EligibilityCheck />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PlatformFeesForm({ settings }: { settings: PlatformSettings }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    serviceFeeRate: (parseFloat(settings.serviceFeeRate || "0.225") * 100).toFixed(2),
    convenienceFeeRate: (parseFloat(settings.convenienceFeeRate || "0.035") * 100).toFixed(2),
    platformFeeRate: (parseFloat(settings.platformFeeRate || "0.12") * 100).toFixed(2),
    payrollTaxRate: (parseFloat(settings.payrollTaxRate || "0.0765") * 100).toFixed(2),
    federalUnemploymentRate: (parseFloat(settings.federalUnemploymentRate || "0.006") * 100).toFixed(2),
    workersCompRate: (parseFloat(settings.workersCompRate || "0.01") * 100).toFixed(2),
    paidSickLeaveRate: (parseFloat(settings.paidSickLeaveRate || "0.005") * 100).toFixed(2),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PlatformSettings>) => {
      const response = await apiRequest("PATCH", "/api/settings/platform", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/platform"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fees/resolved"] });
      toast({
        title: "Settings updated",
        description: "Platform fee settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update platform settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      serviceFeeRate: (parseFloat(formData.serviceFeeRate) / 100).toFixed(4),
      convenienceFeeRate: (parseFloat(formData.convenienceFeeRate) / 100).toFixed(4),
      platformFeeRate: (parseFloat(formData.platformFeeRate) / 100).toFixed(4),
      payrollTaxRate: (parseFloat(formData.payrollTaxRate) / 100).toFixed(4),
      federalUnemploymentRate: (parseFloat(formData.federalUnemploymentRate) / 100).toFixed(4),
      workersCompRate: (parseFloat(formData.workersCompRate) / 100).toFixed(4),
      paidSickLeaveRate: (parseFloat(formData.paidSickLeaveRate) / 100).toFixed(4),
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Fees</CardTitle>
          <CardDescription>
            Fees applied to shift transactions and payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceFeeRate">Service Fee Rate (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="serviceFeeRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.serviceFeeRate}
                onChange={(e) => setFormData({ ...formData, serviceFeeRate: e.target.value })}
                data-testid="input-service-fee-rate"
              />
              <span className="text-sm text-muted-foreground w-8">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Applied to completed shift payments</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="convenienceFeeRate">Convenience Fee Rate (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="convenienceFeeRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.convenienceFeeRate}
                onChange={(e) => setFormData({ ...formData, convenienceFeeRate: e.target.value })}
                data-testid="input-convenience-fee-rate"
              />
              <span className="text-sm text-muted-foreground w-8">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Payment processing convenience fee</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="platformFeeRate">Platform Fee Rate (EtherAI-Dental Fee) (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="platformFeeRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.platformFeeRate}
                onChange={(e) => setFormData({ ...formData, platformFeeRate: e.target.value })}
                data-testid="input-platform-fee-rate"
              />
              <span className="text-sm text-muted-foreground w-8">%</span>
            </div>
            <p className="text-xs text-muted-foreground">EtherAI-Dental platform fee shown in shift pricing</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payroll Tax Rates</CardTitle>
          <CardDescription>
            Default payroll tax rates applied to shift calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payrollTaxRate">Base Payroll Tax Rate (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="payrollTaxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.payrollTaxRate}
                onChange={(e) => setFormData({ ...formData, payrollTaxRate: e.target.value })}
                data-testid="input-payroll-tax-rate"
              />
              <span className="text-sm text-muted-foreground w-8">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Combined Social Security (6.2%) + Medicare (1.45%)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="federalUnemploymentRate">Federal Unemployment (FUTA) (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="federalUnemploymentRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.federalUnemploymentRate}
                onChange={(e) => setFormData({ ...formData, federalUnemploymentRate: e.target.value })}
                data-testid="input-federal-unemployment-rate"
              />
              <span className="text-sm text-muted-foreground w-8">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workersCompRate">Workers Compensation (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="workersCompRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.workersCompRate}
                onChange={(e) => setFormData({ ...formData, workersCompRate: e.target.value })}
                data-testid="input-workers-comp-rate"
              />
              <span className="text-sm text-muted-foreground w-8">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidSickLeaveRate">Paid Sick Leave (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="paidSickLeaveRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.paidSickLeaveRate}
                onChange={(e) => setFormData({ ...formData, paidSickLeaveRate: e.target.value })}
                data-testid="input-paid-sick-leave-rate"
              />
              <span className="text-sm text-muted-foreground w-8">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full md:w-auto"
          data-testid="button-save-platform-fees"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Platform Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StateTaxRatesTable({
  rates,
  isLoading,
}: {
  rates: PlatformStateTaxRate[];
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const [editingState, setEditingState] = useState<PlatformStateTaxRate | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const upsertMutation = useMutation({
    mutationFn: async (data: Partial<PlatformStateTaxRate>) => {
      const response = await apiRequest("POST", "/api/settings/state-tax-rates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/state-tax-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fees/resolved"] });
      setEditingState(null);
      setIsAddDialogOpen(false);
      toast({
        title: "State tax rate saved",
        description: "The state tax rate has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save state tax rate. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">State Tax Rates</CardTitle>
          <CardDescription>
            Configure state-specific unemployment and tax rates
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-state-tax">
              <Plus className="h-4 w-4 mr-2" />
              Add State
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add State Tax Rate</DialogTitle>
              <DialogDescription>
                Configure tax rates for a new state
              </DialogDescription>
            </DialogHeader>
            <StateTaxRateForm
              onSave={(data) => upsertMutation.mutate(data)}
              isPending={upsertMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {rates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No state tax rates configured yet. Click "Add State" to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Unemployment Rate</TableHead>
                <TableHead className="text-right">Income Tax Rate</TableHead>
                <TableHead className="text-right">Additional Tax</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id} data-testid={`row-state-${rate.stateCode}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rate.stateCode}</span>
                      <span className="text-muted-foreground">{rate.stateName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {(parseFloat(rate.stateUnemploymentRate || "0") * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {(parseFloat(rate.stateIncomeTaxRate || "0") * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {(parseFloat(rate.additionalTaxRate || "0") * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={rate.isActive ? "default" : "secondary"}>
                      {rate.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={editingState?.id === rate.id}
                      onOpenChange={(open) => setEditingState(open ? rate : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-state-${rate.stateCode}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit State Tax Rate - {rate.stateName}</DialogTitle>
                          <DialogDescription>
                            Update tax rates for {rate.stateName}
                          </DialogDescription>
                        </DialogHeader>
                        <StateTaxRateForm
                          initialData={rate}
                          onSave={(data) => upsertMutation.mutate(data)}
                          isPending={upsertMutation.isPending}
                          isEdit
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

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

function StateTaxRateForm({
  initialData,
  onSave,
  isPending,
  isEdit = false,
}: {
  initialData?: PlatformStateTaxRate;
  onSave: (data: Partial<PlatformStateTaxRate>) => void;
  isPending: boolean;
  isEdit?: boolean;
}) {
  const [formData, setFormData] = useState({
    stateCode: initialData?.stateCode || "",
    stateName: initialData?.stateName || "",
    stateUnemploymentRate: initialData ? (parseFloat(initialData.stateUnemploymentRate || "0") * 100).toFixed(2) : "2.70",
    stateIncomeTaxRate: initialData ? (parseFloat(initialData.stateIncomeTaxRate || "0") * 100).toFixed(2) : "0.00",
    additionalTaxRate: initialData ? (parseFloat(initialData.additionalTaxRate || "0") * 100).toFixed(2) : "0.00",
    isActive: initialData?.isActive ?? true,
  });

  const handleStateChange = (stateCode: string) => {
    const state = US_STATES.find((s) => s.code === stateCode);
    setFormData({
      ...formData,
      stateCode,
      stateName: state?.name || "",
    });
  };

  const handleSubmit = () => {
    onSave({
      stateCode: formData.stateCode,
      stateName: formData.stateName,
      stateUnemploymentRate: (parseFloat(formData.stateUnemploymentRate) / 100).toFixed(4),
      stateIncomeTaxRate: (parseFloat(formData.stateIncomeTaxRate) / 100).toFixed(4),
      additionalTaxRate: (parseFloat(formData.additionalTaxRate) / 100).toFixed(4),
      isActive: formData.isActive,
    });
  };

  return (
    <div className="space-y-4">
      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="stateCode">State</Label>
          <select
            id="stateCode"
            value={formData.stateCode}
            onChange={(e) => handleStateChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            data-testid="select-state-code"
          >
            <option value="">Select a state...</option>
            {US_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.code} - {state.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="stateUnemploymentRate">State Unemployment Rate (%)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="stateUnemploymentRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.stateUnemploymentRate}
            onChange={(e) => setFormData({ ...formData, stateUnemploymentRate: e.target.value })}
            data-testid="input-state-unemployment-rate"
          />
          <span className="text-sm text-muted-foreground w-8">%</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stateIncomeTaxRate">State Income Tax Rate (%)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="stateIncomeTaxRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.stateIncomeTaxRate}
            onChange={(e) => setFormData({ ...formData, stateIncomeTaxRate: e.target.value })}
            data-testid="input-state-income-tax-rate"
          />
          <span className="text-sm text-muted-foreground w-8">%</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalTaxRate">Additional Tax Rate (%)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="additionalTaxRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.additionalTaxRate}
            onChange={(e) => setFormData({ ...formData, additionalTaxRate: e.target.value })}
            data-testid="input-additional-tax-rate"
          />
          <span className="text-sm text-muted-foreground w-8">%</span>
        </div>
        <p className="text-xs text-muted-foreground">Any state-specific additional taxes</p>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isActive">Active</Label>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          data-testid="switch-state-active"
        />
      </div>

      <DialogFooter>
        <Button
          onClick={handleSubmit}
          disabled={isPending || (!isEdit && !formData.stateCode)}
          data-testid="button-save-state-tax"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save State Tax Rate
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}

const CLEARINGHOUSE_OPTIONS = [
  { value: "dentalxchange", label: "DentalXchange" },
  { value: "change_healthcare", label: "Change Healthcare" },
  { value: "availity", label: "Availity" },
  { value: "trizetto", label: "Trizetto" },
  { value: "office_ally", label: "Office Ally" },
  { value: "waystar", label: "Waystar" },
  { value: "nea_fast", label: "NEA FastAttach" },
  { value: "emdeon", label: "Emdeon" },
];

function ClearinghouseIntegrationsTab() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null);

  const { data: configs = [], isLoading: isLoadingConfigs } = useQuery<ClearinghouseConfig[]>({
    queryKey: ["/api/clearinghouse-configs"],
  });

  const createConfigMutation = useMutation({
    mutationFn: async (data: Omit<InsertClearinghouseConfig, "id">) => {
      const res = await apiRequest("POST", "/api/clearinghouse-configs", data);
      return res.json();
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
      await apiRequest("DELETE", `/api/clearinghouse-configs/${id}`);
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
      const response = await apiRequest("POST", `/api/clearinghouse-configs/${id}/test`);
      return response.json() as Promise<{ success: boolean; message: string }>;
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

  const autoSetupOfficeAllyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/clearinghouse-configs/office-ally/auto-create");
      return response.json() as Promise<{ message: string; config: ClearinghouseConfig; created: boolean }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clearinghouse-configs"] });
      toast({
        title: data.created ? "Office Ally Configured" : "Already Configured",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to auto-setup Office Ally. Credentials may not be configured.",
        variant: "destructive",
      });
    },
  });

  const hasOfficeAllyConfig = configs.some(c => c.provider === "office_ally");

  return (
    <div className="space-y-6">
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
                  Configure EDI clearinghouse connections for automated insurance verification across all practices
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!hasOfficeAllyConfig && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => autoSetupOfficeAllyMutation.mutate()}
                  disabled={autoSetupOfficeAllyMutation.isPending}
                  data-testid="button-auto-setup-office-ally"
                >
                  {autoSetupOfficeAllyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Auto-Setup Office Ally
                </Button>
              )}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-clearinghouse">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Clearinghouse
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Clearinghouse Configuration</DialogTitle>
                  <DialogDescription>
                    Configure credentials for a clearinghouse provider
                  </DialogDescription>
                </DialogHeader>
                <AddClearinghouseForm
                  onSubmit={(data) => createConfigMutation.mutate(data)}
                  isPending={createConfigMutation.isPending}
                />
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingConfigs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No clearinghouse configurations yet</p>
              <p className="text-sm">Add a clearinghouse to enable automated insurance verification</p>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <ClearinghouseConfigItem
                  key={config.id}
                  config={config}
                  onTest={() => testConnectionMutation.mutate(config.id)}
                  onDelete={() => deleteConfigMutation.mutate(config.id)}
                  isTesting={testingConfigId === config.id}
                  isDeleting={deleteConfigMutation.isPending}
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
              <Plug className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Future Integrations</CardTitle>
              <CardDescription>
                Additional platform integrations will be available here
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More integrations coming soon: Practice Management Systems, Payment Processors, Communication Tools, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AddClearinghouseForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: Omit<InsertClearinghouseConfig, "id">) => void;
  isPending: boolean;
}) {
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [submitterId, setSubmitterId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !name) return;
    onSubmit({
      name,
      provider,
      submitterId: submitterId || null,
      isActive: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider">Clearinghouse Provider</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger data-testid="select-clearinghouse-provider">
            <SelectValue placeholder="Select a provider" />
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
        <Label htmlFor="name">Configuration Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Primary Clearinghouse"
          data-testid="input-clearinghouse-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="submitterId">EDI Submitter ID (optional)</Label>
        <Input
          id="submitterId"
          value={submitterId}
          onChange={(e) => setSubmitterId(e.target.value)}
          placeholder="Enter submitter ID"
          data-testid="input-clearinghouse-submitter-id"
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending || !provider} data-testid="button-save-clearinghouse">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ClearinghouseConfigItem({
  config,
  onTest,
  onDelete,
  isTesting,
  isDeleting,
}: {
  config: ClearinghouseConfig;
  onTest: () => void;
  onDelete: () => void;
  isTesting: boolean;
  isDeleting: boolean;
}) {
  const providerLabel = CLEARINGHOUSE_OPTIONS.find(o => o.value === config.provider)?.label || config.provider;
  
  const getStatusIcon = () => {
    if (config.connectionStatus === "connected") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (config.connectionStatus === "failed") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg" data-testid={`clearinghouse-config-${config.id}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div>
          <p className="font-medium text-sm">{config.name} ({providerLabel})</p>
          <p className="text-xs text-muted-foreground">
            {config.submitterId ? `Submitter ID: ${config.submitterId}` : "No submitter ID"}
            {config.lastTestedAt && ` • Last tested: ${new Date(config.lastTestedAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={isTesting}
          data-testid={`button-test-clearinghouse-${config.id}`}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Test"
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          data-testid={`button-delete-clearinghouse-${config.id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
