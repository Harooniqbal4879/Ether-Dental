import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calendar,
  Settings,
  Shield,
  ChevronDown,
  Check,
  UserCheck,
  Sparkles,
  CreditCard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { usePersona, personas, type Persona } from "@/lib/persona-context";

const allNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    personas: ["system_admin", "admin", "front_desk", "treatment_coordinator", "billing_manager"],
  },
  {
    title: "Patients",
    url: "/patients",
    icon: Users,
    personas: ["system_admin", "admin", "front_desk", "treatment_coordinator"],
  },
  {
    title: "Verifications",
    url: "/verifications",
    icon: ClipboardCheck,
    personas: ["system_admin", "admin", "front_desk", "billing_manager"],
  },
  {
    title: "Appointments",
    url: "/appointments",
    icon: Calendar,
    personas: ["system_admin", "admin", "front_desk", "treatment_coordinator"],
  },
  {
    title: "Staffing",
    url: "/staffing",
    icon: UserCheck,
    personas: ["system_admin", "admin", "front_desk"],
  },
  {
    title: "Services",
    url: "/services",
    icon: Sparkles,
    personas: ["system_admin", "admin", "billing_manager"],
  },
  {
    title: "Patient Portal",
    url: "/portal",
    icon: CreditCard,
    personas: ["patient"],
  },
];

const configNavItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    personas: ["system_admin", "admin"],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { currentPersona, setCurrentPersona, personaInfo } = usePersona();

  const visibleMainItems = allNavItems.filter((item) =>
    item.personas.includes(currentPersona)
  );
  const visibleConfigItems = configNavItems.filter((item) =>
    item.personas.includes(currentPersona)
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-sidebar-foreground">
              EtherAI
            </span>
            <span className="text-xs text-muted-foreground">
              Dental Practice Management
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || (item.url === "/staffing" && location.startsWith("/staffing"))}
                    className="px-4"
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleConfigItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Configuration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleConfigItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      className="px-4"
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-3 rounded-md p-2 text-left hover-elevate"
              data-testid="button-persona-switcher"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {personaInfo.initials}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {personaInfo.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  Sunny Pines Dental
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {personas.map((persona) => (
              <DropdownMenuItem
                key={persona.id}
                onClick={() => setCurrentPersona(persona.id as Persona)}
                className="flex items-center gap-3"
                data-testid={`persona-${persona.id}`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {persona.initials}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{persona.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {persona.description}
                  </span>
                </div>
                {currentPersona === persona.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
