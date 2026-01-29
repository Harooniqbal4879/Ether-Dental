import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { AppSidebar } from "@/components/app-sidebar";
import { PersonaProvider } from "@/lib/persona-context";
import { LocationProvider } from "@/lib/location-context";
import { AuthProvider } from "@/lib/auth-context";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientDetail from "@/pages/patient-detail";
import PatientForm from "@/pages/patient-form";
import Carriers from "@/pages/carriers";
import Settings from "@/pages/settings";
import Staffing from "@/pages/staffing";
import AddShift from "@/pages/add-shift";
import Services from "@/pages/services";
import PatientPortal from "@/pages/patient-portal";
import ProfessionalsHub from "@/pages/professionals-hub";
import PlatformSettings from "@/pages/platform-settings";
import PracticeManagement from "@/pages/practice-management";
import RegisterPractice from "@/pages/register-practice";
import Eligibility from "@/pages/eligibility";
import Messaging from "@/pages/messaging";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminLogin from "@/pages/admin-login";
import Profile from "@/pages/profile";
import Features from "@/pages/marketing/features";
import HowItWorks from "@/pages/marketing/how-it-works";
import Benefits from "@/pages/marketing/benefits";
import Pricing from "@/pages/marketing/pricing";
import FAQ from "@/pages/marketing/faq";
import Demo from "@/pages/marketing/demo";
import InvitationPage from "@/pages/invitation";
import ProfessionalLogin from "@/pages/professional-login";
import ProfessionalRegister from "@/pages/professional-register";

function MainRouter() {
  return (
    <Switch>
      <Route path="/app" component={Dashboard} />
      <Route path="/app/patients" component={Patients} />
      <Route path="/app/patients/new" component={PatientForm} />
      <Route path="/app/patients/:id" component={PatientDetail} />
      <Route path="/app/verifications">
        <Redirect to="/app/patients?tab=insurance" />
      </Route>
      <Route path="/app/appointments">
        <Redirect to="/app/patients?tab=appointments" />
      </Route>
      <Route path="/app/carriers" component={Carriers} />
      <Route path="/app/settings" component={Settings} />
      <Route path="/app/staffing" component={Staffing} />
      <Route path="/app/staffing/add-shift" component={AddShift} />
      <Route path="/app/services" component={Services} />
      <Route path="/app/portal" component={PatientPortal} />
      <Route path="/app/professionals" component={ProfessionalsHub} />
      <Route path="/app/professionals/:id" component={ProfessionalsHub} />
      <Route path="/app/platform-settings" component={PlatformSettings} />
      <Route path="/app/practices" component={PracticeManagement} />
      <Route path="/app/eligibility">
        <Redirect to="/app/patients?tab=insurance" />
      </Route>
      <Route path="/app/messaging" component={Messaging} />
      <Route path="/app/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MainLayout() {
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };
  const { admin, authenticated, logout, professional, isProfessionalAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    if (isProfessionalAuthenticated) {
      setLocation("/login/professional");
    } else {
      setLocation("/login/admin");
    }
  };

  const isLoggedIn = authenticated || isProfessionalAuthenticated;
  const userName = admin 
    ? `${admin.firstName} ${admin.lastName}` 
    : professional 
      ? `${professional.firstName} ${professional.lastName}`
      : "";

  return (
    <LocationProvider>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col overflow-hidden">
            <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                {isLoggedIn && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-menu">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">{userName}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {admin && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => setLocation("/app/profile")}
                            data-testid="menu-item-profile"
                          >
                            <User className="mr-2 h-4 w-4" />
                            My Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {professional && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => setLocation("/app/professionals/" + professional.id)}
                            data-testid="menu-item-my-profile"
                          >
                            <User className="mr-2 h-4 w-4" />
                            My Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        data-testid="menu-item-logout"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <MainRouter />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </LocationProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="etherai-theme">
        <TooltipProvider>
          <AuthProvider>
            <PersonaProvider>
              <Switch>
              <Route path="/" component={Landing} />
              <Route path="/login/admin" component={AdminLogin} />
              <Route path="/login/professional" component={ProfessionalLogin} />
              <Route path="/register" component={RegisterPractice} />
              <Route path="/register-professional" component={ProfessionalRegister} />
              <Route path="/features" component={Features} />
              <Route path="/how-it-works" component={HowItWorks} />
              <Route path="/benefits" component={Benefits} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/faq" component={FAQ} />
              <Route path="/demo" component={Demo} />
              <Route path="/invitation/:token" component={InvitationPage} />
              <Route path="/app/:rest*">
                <MainLayout />
              </Route>
              <Route>
                <MainLayout />
              </Route>
              </Switch>
              <Toaster />
            </PersonaProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
