import { MarketingLayout } from "@/components/marketing-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Chrome, Download, Settings, LogIn, Shield, Eye, Zap, Sparkles,
  MonitorSmartphone, ChevronRight, CheckCircle2, AlertCircle, Info,
  ExternalLink, Monitor, Puzzle, FolderOpen
} from "lucide-react";
import { Link } from "wouter";

const installSteps = [
  {
    number: 1,
    title: "Download the Extension Files",
    description: "Download the extension package from your EtherAI-Dental admin dashboard or request it from your practice administrator.",
    icon: Download,
    detail: "The extension is distributed as a .zip file containing all necessary files. Extract the zip to a folder on your computer — you'll need this folder in the next step.",
  },
  {
    number: 2,
    title: "Open Chrome Extensions Page",
    description: "In Google Chrome, navigate to the extensions management page.",
    icon: Puzzle,
    detail: "Type chrome://extensions in your Chrome address bar and press Enter. Alternatively, click the three-dot menu (⋮) in the top-right corner of Chrome, then go to Extensions → Manage Extensions.",
  },
  {
    number: 3,
    title: "Enable Developer Mode",
    description: "Turn on Developer Mode to allow loading the extension.",
    icon: Settings,
    detail: "In the top-right corner of the extensions page, you'll see a toggle labeled \"Developer mode\". Click it to turn it ON. This is required to load extensions that aren't from the Chrome Web Store.",
  },
  {
    number: 4,
    title: "Load the Extension",
    description: "Click \"Load unpacked\" and select the extension folder.",
    icon: FolderOpen,
    detail: "Click the \"Load unpacked\" button that appears in the top-left after enabling Developer Mode. Browse to and select the extracted extension folder (the one containing manifest.json). Click \"Select Folder\".",
  },
  {
    number: 5,
    title: "Pin the Extension",
    description: "Pin the extension to your toolbar for easy access.",
    icon: Monitor,
    detail: "Click the puzzle piece icon (🧩) in your Chrome toolbar. Find \"EtherAI-Dental Assistant\" in the list and click the pin icon next to it. The extension's teal shield icon will now appear in your toolbar.",
  },
  {
    number: 6,
    title: "Configure & Sign In",
    description: "Connect the extension to your EtherAI-Dental platform.",
    icon: LogIn,
    detail: "Click the extension icon to open the side panel. Go to Settings (gear icon) and enter your platform URL. Then sign in with your practice admin credentials. You're all set!",
  },
];

const features = [
  {
    icon: Eye,
    title: "Auto-Detect Patient Data",
    description: "When you're viewing a patient in your dental PMS, the extension automatically reads their name, date of birth, member ID, and insurance info — no copy-pasting needed.",
  },
  {
    icon: Zap,
    title: "One-Click Eligibility Verification",
    description: "Verify dental or medical insurance eligibility instantly without switching tabs. Results appear right in the side panel alongside your PMS.",
  },
  {
    icon: Sparkles,
    title: "AI Benefits Summary",
    description: "Get a plain-English breakdown of coverage, deductibles, annual maximums, and copays — powered by AI so your front desk staff can understand benefits at a glance.",
  },
  {
    icon: MonitorSmartphone,
    title: "Staffing Alerts",
    description: "See how many shifts need to be filled at your practice. The extension badge shows the count, and the Shifts tab shows full details — all without leaving your PMS.",
  },
];

const supportedSystems = [
  { name: "Dentrix Ascend", status: "Full Support" },
  { name: "Curve Dental", status: "Full Support" },
  { name: "Open Dental Cloud", status: "Full Support" },
  { name: "Oryx Dental", status: "Full Support" },
  { name: "tab32", status: "Full Support" },
  { name: "Other Web-Based PMS", status: "Generic Detection" },
];

export default function ChromeExtensionPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12" data-testid="page-chrome-extension">

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium" data-testid="badge-extension-header">
            <Chrome className="h-4 w-4" />
            Chrome Extension
          </div>
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">
            EtherAI-Dental Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered insurance verification and staffing alerts that work right alongside
            your existing Practice Management System — no tab switching required.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2" data-testid="section-features">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6" data-testid="section-install">
          <div className="text-center">
            <h2 className="text-2xl font-bold" data-testid="text-install-title">Installation Guide</h2>
            <p className="text-muted-foreground mt-1">Follow these steps to install the extension on your computer</p>
          </div>

          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Requirements</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Google Chrome browser (version 116 or later) is required. The extension is not yet available on the Chrome Web Store — 
                  it must be installed manually using the steps below.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {installSteps.map((step) => (
              <Card key={step.number} className="overflow-hidden" data-testid={`card-step-${step.number}`}>
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0" data-testid={`badge-step-number-${step.number}`}>
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <step.icon className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                        {step.number === 2 && (
                          <div className="mt-2 flex items-center gap-2">
                            <code className="text-xs bg-background px-2 py-1 rounded border font-mono" data-testid="text-chrome-url">
                              chrome://extensions
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4" data-testid="section-supported-systems">
          <h2 className="text-2xl font-bold text-center">Supported Practice Management Systems</h2>
          <p className="text-center text-muted-foreground">
            The extension automatically detects which dental software you're using and extracts patient data accordingly.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {supportedSystems.map((system) => (
              <Card key={system.name} className="border-border/50" data-testid={`card-system-${system.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="font-medium text-sm">{system.name}</span>
                  <Badge
                    variant={system.status === "Full Support" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {system.status === "Full Support" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {system.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" data-testid="card-after-install">
          <CardContent className="p-6 md:p-8 space-y-4">
            <h2 className="text-xl font-bold">After Installation</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Set Your Platform URL</p>
                  <p className="text-xs text-muted-foreground">
                    Open the extension, go to Settings, and enter your EtherAI-Dental platform URL
                    (e.g., <code className="bg-muted px-1 py-0.5 rounded">https://your-practice.etherai-dental.com</code>)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sign In</p>
                  <p className="text-xs text-muted-foreground">
                    Use the same email and password you use to log into your EtherAI-Dental admin dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Navigate to Your PMS</p>
                  <p className="text-xs text-muted-foreground">
                    Open your dental software (Dentrix Ascend, Curve Dental, etc.) in Chrome. When you view a patient,
                    the extension will detect their information and let you verify eligibility instantly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50" data-testid="card-troubleshooting">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              Troubleshooting
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Extension icon not appearing?</p>
                <p className="text-xs text-muted-foreground">
                  Click the puzzle piece icon (🧩) in Chrome's toolbar and pin the EtherAI-Dental extension.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Can't connect to platform?</p>
                <p className="text-xs text-muted-foreground">
                  Make sure the API URL in Settings matches your platform URL exactly, including https://. Check that you can access the platform in a regular browser tab first.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Patient data not being detected?</p>
                <p className="text-xs text-muted-foreground">
                  Ensure you're viewing a patient record in a supported PMS. Try refreshing the PMS page. The extension needs the patient's information to be visible on screen.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Extension stopped working after Chrome update?</p>
                <p className="text-xs text-muted-foreground">
                  Go to chrome://extensions, find EtherAI-Dental Assistant, and click the refresh/reload button. If that doesn't work, remove and re-add the extension.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-3 pb-8">
          <p className="text-sm text-muted-foreground">
            Need help with installation? Contact your practice administrator or reach out to our support team.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/integrations">
              <Button variant="outline" size="sm" data-testid="link-back-integrations">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                View All Integrations
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="default" size="sm" data-testid="link-request-demo">
                Request a Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
