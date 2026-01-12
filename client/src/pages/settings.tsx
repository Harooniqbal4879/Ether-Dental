import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { useTheme } from "@/components/theme-provider";
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
          Reference to the credentials stored in your secrets vault (HashiCorp Vault, AWS Secrets Manager, etc.). 
          Actual API keys and passwords are never stored in the application database.
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

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null);

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
    <div className="space-y-6 p-6">
      <PageHeader
        title="Settings"
        description="Configure your practice and application preferences"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Practice Information</CardTitle>
                <CardDescription>
                  Your practice details and contact information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="practice-name">Practice Name</Label>
                <Input
                  id="practice-name"
                  defaultValue="Sunny Pines Dental"
                  data-testid="input-practice-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npi">NPI Number</Label>
                <Input
                  id="npi"
                  defaultValue="1234567890"
                  className="font-mono"
                  data-testid="input-npi"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax-id">Tax ID</Label>
                <Input
                  id="tax-id"
                  defaultValue="12-3456789"
                  className="font-mono"
                  data-testid="input-tax-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  defaultValue="(555) 123-4567"
                  data-testid="input-practice-phone"
                />
              </div>
            </div>
            <Button className="mt-2" data-testid="button-save-practice">
              Save Changes
            </Button>
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

        <Card className="lg:col-span-2">
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
              <Switch defaultChecked data-testid="switch-auto-verify" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Re-verify stale benefits</p>
                <p className="text-sm text-muted-foreground">
                  Re-verify if last verification is older than 30 days
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-reverify-stale" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Prefer clearinghouse verification</p>
                <p className="text-sm text-muted-foreground">
                  Use electronic verification when available before AI phone calls
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-prefer-clearinghouse" />
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
      </div>
    </div>
  );
}
