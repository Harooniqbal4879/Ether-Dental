import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Stethoscope, Building2, UserCircle, ArrowRight, Shield, Zap, Clock } from "lucide-react";
import { usePersona } from "@/lib/persona-context";

const features = [
  {
    icon: Shield,
    title: "Secure & HIPAA Compliant",
    description: "Enterprise-grade security for patient data",
  },
  {
    icon: Zap,
    title: "Automated Verification",
    description: "Real-time insurance eligibility checks",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Reduce verification time by up to 80%",
  },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const { setCurrentPersona } = usePersona();

  const handleOrganizationLogin = () => {
    navigate("/login/admin");
  };

  const handleProfessionalLogin = () => {
    setCurrentPersona("professional");
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="landing-page">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" data-testid="header-landing">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold" data-testid="text-logo">EtherAI</span>
          </div>

          <nav className="hidden md:flex items-center gap-1" data-testid="nav-landing">
            <Link href="/features" data-testid="link-features">
              <Button variant="ghost" size="sm">Features</Button>
            </Link>
            <Link href="/pricing" data-testid="link-pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link href="/faq" data-testid="link-faq">
              <Button variant="ghost" size="sm">FAQ</Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/demo" data-testid="link-demo">
              <Button variant="outline" size="sm">Request Demo</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-16 lg:py-24" data-testid="section-hero">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-hero-title">
                Dental Practice Management Made Simple
              </h1>
              <p className="text-xl text-muted-foreground" data-testid="text-hero-description">
                Streamline insurance verification, manage patients, and connect with dental professionals - all in one platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16" data-testid="login-options">
              <Card 
                className="hover-elevate cursor-pointer" 
                onClick={handleOrganizationLogin}
                onKeyDown={(e) => e.key === 'Enter' && handleOrganizationLogin()}
                tabIndex={0}
                role="button"
                aria-label="Sign in as an organization - for dental practices and clinics"
                data-testid="card-organization-login"
              >
                <CardHeader className="text-center pb-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl" data-testid="text-org-title">Organization Login</CardTitle>
                  <CardDescription data-testid="text-org-description">
                    For dental practices and clinics
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                    <li>Manage patient records & insurance</li>
                    <li>Post staffing requests</li>
                    <li>Track verifications & billing</li>
                    <li>Multi-location support</li>
                  </ul>
                  <Button className="w-full" tabIndex={-1} data-testid="button-org-login">
                    Sign In as Organization
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="hover-elevate cursor-pointer" 
                onClick={handleProfessionalLogin}
                onKeyDown={(e) => e.key === 'Enter' && handleProfessionalLogin()}
                tabIndex={0}
                role="button"
                aria-label="Sign in as a professional - for dental professionals"
                data-testid="card-professional-login"
              >
                <CardHeader className="text-center pb-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
                    <UserCircle className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl" data-testid="text-prof-title">Professional Login</CardTitle>
                  <CardDescription data-testid="text-prof-description">
                    For dental professionals
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                    <li>Browse available shifts</li>
                    <li>Manage your schedule</li>
                    <li>Track earnings & credentials</li>
                    <li>Connect with practices</li>
                  </ul>
                  <Button className="w-full" variant="outline" tabIndex={-1} data-testid="button-prof-login">
                    Sign In as Professional
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto" data-testid="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="text-center" data-testid={`feature-${index}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6" data-testid="footer-landing">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EtherAI. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/features" className="hover:text-foreground" data-testid="link-footer-features">Features</Link>
            <Link href="/pricing" className="hover:text-foreground" data-testid="link-footer-pricing">Pricing</Link>
            <Link href="/faq" className="hover:text-foreground" data-testid="link-footer-faq">FAQ</Link>
            <Link href="/demo" className="hover:text-foreground" data-testid="link-footer-demo">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
