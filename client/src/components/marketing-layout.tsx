import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppDownloadHero } from "@/components/app-download-hero";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoPath from "@assets/just_logo_1770330927218.jpg";

const navLinks = [
  { href: "/features", label: "Features", id: "features" },
  { href: "/how-it-works", label: "How It Works", id: "how-it-works" },
  { href: "/benefits", label: "Benefits", id: "benefits" },
  { href: "/pricing", label: "Pricing", id: "pricing" },
  { href: "/faq", label: "FAQ", id: "faq" },
  { href: "/integrations", label: "Integrations", id: "integrations" },
];

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="marketing-layout">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" data-testid="header-marketing">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/" data-testid="link-logo">
            <span className="flex items-center gap-2">
              <img src={logoPath} alt="EtherAI-Dental" className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold" data-testid="text-logo">EtherAI-Dental</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" data-testid="nav-marketing" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} data-testid={`link-nav-${link.id}`}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  size="sm"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/demo" className="hidden sm:block" data-testid="link-header-demo">
              <Button variant="outline" size="sm" data-testid="button-request-demo">
                Request Demo
              </Button>
            </Link>
            <Link href="/" data-testid="link-login">
              <Button size="sm" data-testid="button-login">
                Login
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <nav 
          id="mobile-nav"
          className={`md:hidden border-t px-4 py-3 space-y-1 ${mobileMenuOpen ? "" : "hidden"}`}
          data-testid="nav-mobile"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} data-testid={`link-mobile-${link.id}`}>
              <Button
                variant={location === link.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Button>
            </Link>
          ))}
          <Link href="/demo" data-testid="link-mobile-demo">
            <Button
              variant="outline"
              className="w-full justify-start mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Request Demo
            </Button>
          </Link>
        </nav>
      </header>

      <AppDownloadHero />

      <main className="flex-1" data-testid="main-content">
        {children}
      </main>

      <footer className="border-t bg-muted/30" data-testid="footer-marketing">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoPath} alt="EtherAI-Dental" className="h-8 w-8 object-contain" />
                <span className="font-bold" data-testid="text-footer-logo">EtherAI-Dental</span>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-footer-tagline">
                Streamlining dental practice management with intelligent automation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3" data-testid="text-footer-product">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground" data-testid="link-footer-features">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground" data-testid="link-footer-pricing">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-foreground" data-testid="link-footer-demo">Request Demo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3" data-testid="text-footer-resources">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/how-it-works" className="hover:text-foreground" data-testid="link-footer-how-it-works">How It Works</Link></li>
                <li><Link href="/benefits" className="hover:text-foreground" data-testid="link-footer-benefits">Benefits</Link></li>
                <li><Link href="/faq" className="hover:text-foreground" data-testid="link-footer-faq">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3" data-testid="text-footer-company">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-default" data-testid="text-about">About Us</span></li>
                <li><span className="cursor-default" data-testid="text-contact">Contact</span></li>
                <li><span className="cursor-default" data-testid="text-privacy">Privacy Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground" data-testid="footer-copyright">
            <p>&copy; {new Date().getFullYear()} EtherAI-Dental. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
