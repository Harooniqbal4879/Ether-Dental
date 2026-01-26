import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PersonaProvider } from "@/lib/persona-context";
import { LocationProvider } from "@/lib/location-context";
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
import Features from "@/pages/marketing/features";
import HowItWorks from "@/pages/marketing/how-it-works";
import Benefits from "@/pages/marketing/benefits";
import Pricing from "@/pages/marketing/pricing";
import FAQ from "@/pages/marketing/faq";
import Demo from "@/pages/marketing/demo";

function MainRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/patients" component={Patients} />
      <Route path="/patients/new" component={PatientForm} />
      <Route path="/patients/:id" component={PatientDetail} />
      <Route path="/verifications">
        <Redirect to="/patients?tab=insurance" />
      </Route>
      <Route path="/appointments">
        <Redirect to="/patients?tab=appointments" />
      </Route>
      <Route path="/carriers" component={Carriers} />
      <Route path="/settings" component={Settings} />
      <Route path="/staffing" component={Staffing} />
      <Route path="/staffing/add-shift" component={AddShift} />
      <Route path="/services" component={Services} />
      <Route path="/portal" component={PatientPortal} />
      <Route path="/professionals" component={ProfessionalsHub} />
      <Route path="/professionals/:id" component={ProfessionalsHub} />
      <Route path="/platform-settings" component={PlatformSettings} />
      <Route path="/practices" component={PracticeManagement} />
      <Route path="/eligibility">
        <Redirect to="/patients?tab=insurance" />
      </Route>
      <Route path="/messaging" component={Messaging} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MainLayout() {
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <PersonaProvider>
      <LocationProvider>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <SidebarInset className="flex flex-1 flex-col overflow-hidden">
              <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <MainRouter />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </LocationProvider>
    </PersonaProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="etherai-theme">
        <TooltipProvider>
          <Switch>
            <Route path="/register" component={RegisterPractice} />
            <Route path="/features" component={Features} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/benefits" component={Benefits} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/faq" component={FAQ} />
            <Route path="/demo" component={Demo} />
            <Route>
              <MainLayout />
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
