import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Monitor, Building2, Bell, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { theme, setTheme } = useTheme();

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
