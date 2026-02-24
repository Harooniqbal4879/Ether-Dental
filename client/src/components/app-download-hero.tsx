import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { SiApple, SiGoogleplay } from "react-icons/si";

const APP_LINKS = {
  ios: "https://apps.apple.com/us/app/etherai-dental/id6758028012",
  android: "https://play.google.com/store/apps/details?id=com.dentalshield.professional&hl=en_US",
};

export function AppDownloadHero() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-primary/10" data-testid="section-app-download-hero">
      <div className="container mx-auto px-4 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4" data-testid="badge-mobile-app">
              <Smartphone className="h-4 w-4" />
              Available on iOS & Android
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-3" data-testid="text-hero-title">
              Download the EtherAI Dental App
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto lg:mx-0" data-testid="text-hero-description">
              Manage shifts, check in/out, track earnings, and stay connected with your practice — all from your phone.
            </p>
          </div>

          <div className="flex flex-row gap-6 sm:gap-8">
            <div className="flex flex-col items-center gap-3" data-testid="card-qr-ios">
              <div className="bg-white p-3 rounded-xl shadow-sm border" data-testid="qr-ios">
                <QRCodeSVG
                  value={APP_LINKS.ios}
                  size={120}
                  level="H"
                  includeMargin={false}
                  fgColor="#0d9488"
                />
              </div>
              <a
                href={APP_LINKS.ios}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-app-ios"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <SiApple className="h-4 w-4" />
                  App Store
                </Button>
              </a>
            </div>

            <div className="flex flex-col items-center gap-3" data-testid="card-qr-android">
              <div className="bg-white p-3 rounded-xl shadow-sm border" data-testid="qr-android">
                <QRCodeSVG
                  value={APP_LINKS.android}
                  size={120}
                  level="H"
                  includeMargin={false}
                  fgColor="#0d9488"
                />
              </div>
              <a
                href={APP_LINKS.android}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-app-android"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <SiGoogleplay className="h-4 w-4" />
                  Google Play
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
