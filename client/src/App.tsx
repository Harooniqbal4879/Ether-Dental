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
import NotFound from "@/pages/not-found";

function MainRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/patients" component={Patients} />
      <Route path="/patients/new" component={PatientForm} />
      <Route path="/patients/:id" component={PatientDetail} />
      <Route path="/verifications">
        <Redirect to="/patients?tab=verifications" />
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
