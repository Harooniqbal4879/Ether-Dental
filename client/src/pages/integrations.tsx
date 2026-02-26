import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingLayout } from "@/components/marketing-layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, CreditCard, Mail, MapPin, Brain, FileText, Building2, 
  CheckCircle2, XCircle, AlertCircle, Globe, Server, Link2, Plug,
  Stethoscope, Activity, Database, ArrowUpRight, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { InsuranceCarrier, ClearinghouseConfig } from "@shared/schema";

interface IntegrationItem {
  name: string;
  description: string;
  category: "clearinghouse" | "payment" | "communication" | "pms" | "ai" | "mapping";
  icon: typeof Shield;
  status: "active" | "configured" | "available" | "simulated";
  statusLabel: string;
  details: string[];
  website?: string;
}

const platformIntegrations: IntegrationItem[] = [
  {
    name: "DentalXchange",
    description: "Dental insurance eligibility verification clearinghouse",
    category: "clearinghouse",
    icon: Shield,
    status: "active",
    statusLabel: "Active",
    details: [
      "Real-time 270/271 EDI eligibility transactions",
      "Supports all major dental payers",
      "Benefits breakdown with coverage percentages",
      "Waiting period and deductible tracking",
      "Batch eligibility processing",
    ],
    website: "https://www.dentalxchange.com",
  },
  {
    name: "Availity",
    description: "Medical insurance eligibility verification clearinghouse",
    category: "clearinghouse",
    icon: Activity,
    status: "simulated",
    statusLabel: "Sandbox Mode",
    details: [
      "Medical insurance eligibility & benefits",
      "RESTful API with OAuth 2.0 authentication",
      "Multi-payer connectivity for medical plans",
      "Returns simulated data when credentials not configured",
      "Requires AVAILITY_CLIENT_ID and AVAILITY_CLIENT_SECRET",
    ],
    website: "https://www.availity.com",
  },
  {
    name: "Office Ally",
    description: "Claims clearinghouse with SFTP-based EDI transactions",
    category: "clearinghouse",
    icon: FileText,
    status: "configured",
    statusLabel: "Configured",
    details: [
      "SFTP-based 270/271 EDI eligibility submissions",
      "Batch claim processing and submission",
      "ERA/EOB retrieval and parsing",
      "Real-time status polling for responses",
      "Credentials configured via environment variables",
    ],
    website: "https://www.officeally.com",
  },
  {
    name: "Stripe",
    description: "Payment processing for patient billing and platform subscriptions",
    category: "payment",
    icon: CreditCard,
    status: "active",
    statusLabel: "Active",
    details: [
      "Stripe Connect Express for contractor payouts",
      "Patient portal payment collection",
      "Subscription billing for platform services",
      "Configurable platform fee management",
      "Automated webhook handling",
      "PCI-compliant payment processing",
    ],
    website: "https://stripe.com",
  },
  {
    name: "Resend",
    description: "Transactional email service for notifications and communications",
    category: "communication",
    icon: Mail,
    status: "active",
    statusLabel: "Active",
    details: [
      "Demo request email notifications",
      "Shift invitation emails",
      "Account verification emails",
      "Practice registration notifications",
      "Contractor onboarding communications",
    ],
    website: "https://resend.com",
  },
  {
    name: "Google Maps",
    description: "Geocoding and mapping for practice locations and shift matching",
    category: "mapping",
    icon: MapPin,
    status: "active",
    statusLabel: "Active",
    details: [
      "Practice location geocoding",
      "Distance-based shift matching",
      "Multi-location address validation",
      "Map rendering for practice management",
    ],
    website: "https://developers.google.com/maps",
  },
  {
    name: "OpenAI",
    description: "AI-powered features including shift matching and identity verification",
    category: "ai",
    icon: Brain,
    status: "active",
    statusLabel: "Active",
    details: [
      "AI Shift Matchmaker — professional-to-shift matching",
      "Facial recognition for identity verification",
      "Intelligent document analysis",
      "Natural language processing for chat support",
    ],
    website: "https://openai.com",
  },
  {
    name: "Dentrix Ascend",
    description: "Practice Management System integration for patient data sync",
    category: "pms",
    icon: Database,
    status: "available",
    statusLabel: "Available",
    details: [
      "Bi-directional patient data synchronization",
      "Insurance information import",
      "Appointment scheduling sync",
      "Provider and operatory mapping",
      "Configurable sync intervals",
    ],
    website: "https://www.dentrixascend.com",
  },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  configured: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  simulated: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  available: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  active: CheckCircle2,
  configured: CheckCircle2,
  simulated: AlertCircle,
  available: Plug,
};

const categoryLabels: Record<string, string> = {
  clearinghouse: "Clearinghouses",
  payment: "Payments",
  communication: "Communications",
  pms: "Practice Management",
  ai: "AI & Intelligence",
  mapping: "Mapping & Location",
};

function IntegrationCard({ item }: { item: IntegrationItem }) {
  const StatusIcon = statusIcons[item.status];
  return (
    <Card className="hover-elevate" data-testid={`card-integration-${item.name.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {item.name}
                {item.website && (
                  <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" data-testid={`link-website-${item.name.toLowerCase().replace(/\s+/g, "-")}`}>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </CardTitle>
              <CardDescription className="mt-1">{item.description}</CardDescription>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[item.status]}`} data-testid={`badge-status-${item.name.toLowerCase().replace(/\s+/g, "-")}`}>
            <StatusIcon className="h-3 w-3" />
            {item.statusLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {item.details.map((detail, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PayersList({ carriers, isLoading }: { carriers: InsuranceCarrier[] | undefined; isLoading: boolean }) {
  const [search, setSearch] = useState("");

  const dentalCarriers = useMemo(() => carriers?.filter(c => c.insuranceType === "dental") || [], [carriers]);
  const medicalCarriers = useMemo(() => carriers?.filter(c => c.insuranceType === "medical") || [], [carriers]);

  const filterCarriers = (list: InsuranceCarrier[]) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(c => c.name.toLowerCase().includes(q) || c.payerId?.toLowerCase().includes(q));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payers by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-payers"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline" className="gap-1.5" data-testid="badge-dental-count">
            <Stethoscope className="h-3 w-3" />
            {dentalCarriers.length} Dental
          </Badge>
          <Badge variant="outline" className="gap-1.5" data-testid="badge-medical-count">
            <Activity className="h-3 w-3" />
            {medicalCarriers.length} Medical
          </Badge>
        </div>
      </div>

      {dentalCarriers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Dental Insurance Payers ({filterCarriers(dentalCarriers).length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filterCarriers(dentalCarriers).map((carrier) => (
              <div key={carrier.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate" data-testid={`payer-dental-${carrier.id}`}>
                <div className="p-1.5 rounded bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{carrier.name}</p>
                  {carrier.payerId && (
                    <p className="text-xs text-muted-foreground font-mono">ID: {carrier.payerId}</p>
                  )}
                </div>
                {carrier.clearinghouseCompatible && (
                  <Badge variant="secondary" className="text-xs shrink-0">EDI</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {medicalCarriers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Medical Insurance Payers ({filterCarriers(medicalCarriers).length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filterCarriers(medicalCarriers).map((carrier) => (
              <div key={carrier.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate" data-testid={`payer-medical-${carrier.id}`}>
                <div className="p-1.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{carrier.name}</p>
                  {carrier.payerId && (
                    <p className="text-xs text-muted-foreground font-mono">ID: {carrier.payerId}</p>
                  )}
                </div>
                {carrier.clearinghouseCompatible && (
                  <Badge variant="secondary" className="text-xs shrink-0">EDI</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(!carriers || carriers.length === 0) && (
        <div className="text-center py-8 text-muted-foreground" data-testid="empty-state-payers">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p data-testid="text-empty-payers">No insurance payers configured yet.</p>
          <p className="text-sm mt-1">Payers can be added from the Carriers section.</p>
        </div>
      )}
    </div>
  );
}

function ClearinghouseStatus({ configs, isLoading }: { configs: ClearinghouseConfig[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid="empty-state-connections">
        <Server className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p data-testid="text-empty-connections">No clearinghouse connections configured.</p>
        <p className="text-sm mt-1">Configure connections from Platform Settings.</p>
      </div>
    );
  }

  const connectionStatusColors: Record<string, string> = {
    connected: "text-green-600 dark:text-green-400",
    failed: "text-red-600 dark:text-red-400",
    not_tested: "text-yellow-600 dark:text-yellow-400",
  };

  const connectionStatusLabels: Record<string, string> = {
    connected: "Connected",
    failed: "Connection Failed",
    not_tested: "Not Tested",
  };

  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <Card key={config.id} data-testid={`card-clearinghouse-${config.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Server className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{config.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {config.provider.replace(/_/g, " ")} — {config.purpose.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${connectionStatusColors[config.connectionStatus || "not_tested"]}`}>
                  {connectionStatusLabels[config.connectionStatus || "not_tested"]}
                </span>
                <Badge variant={config.isActive ? "default" : "secondary"}>
                  {config.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Integrations() {
  const { data: carriers, isLoading: carriersLoading } = useQuery<InsuranceCarrier[]>({
    queryKey: ["/api/carriers"],
  });

  const { data: configs, isLoading: configsLoading } = useQuery<ClearinghouseConfig[]>({
    queryKey: ["/api/clearinghouse-configs"],
  });

  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-12 space-y-8" data-testid="page-integrations">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">Integrations & Payers</h1>
          <p className="text-lg text-muted-foreground" data-testid="text-page-description">
            Platform integrations, supported clearinghouses, and insurance payer directory
          </p>
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <div className="flex justify-center">
            <TabsList data-testid="tabs-integrations">
              <TabsTrigger value="integrations" data-testid="tab-integrations">
                <Plug className="h-4 w-4 mr-1.5" />
                Integrations ({platformIntegrations.length})
              </TabsTrigger>
              <TabsTrigger value="payers" data-testid="tab-payers">
                <Shield className="h-4 w-4 mr-1.5" />
                Supported Payers ({carriers?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="connections" data-testid="tab-connections">
                <Server className="h-4 w-4 mr-1.5" />
                Connections ({configs?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {platformIntegrations.map((item) => (
                <IntegrationCard key={item.name} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payers">
            <PayersList carriers={carriers} isLoading={carriersLoading} />
          </TabsContent>

          <TabsContent value="connections">
            <ClearinghouseStatus configs={configs} isLoading={configsLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </MarketingLayout>
  );
}
