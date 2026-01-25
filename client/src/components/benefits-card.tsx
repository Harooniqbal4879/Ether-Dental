import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Stethoscope } from "lucide-react";
import { BenefitsProgress } from "./benefits-progress";
import { CoverageBadge } from "./coverage-badge";
import type { Benefit } from "@shared/schema";

interface BenefitsCardProps {
  title: string;
  insuranceType: "dental" | "medical";
  benefits: Benefit;
  className?: string;
}

export function BenefitsCard({ title, insuranceType, benefits, className }: BenefitsCardProps) {
  const isDental = insuranceType === "dental";
  
  return (
    <Card className={className} data-testid={`card-${insuranceType}-benefits`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {isDental ? (
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800">
                D
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                M
              </Badge>
            )}
            {title}
          </CardTitle>
          {benefits.renewalDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Renews: {benefits.renewalDate}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <BenefitsProgress
          label="Annual Maximum"
          used={Number(benefits.annualUsed) || 0}
          total={Number(benefits.annualMaximum) || 0}
        />

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Individual Deductible</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">
                ${Number(benefits.deductibleIndividualMet) || 0}
              </span>
              <span className="text-muted-foreground">
                / ${Number(benefits.deductibleIndividual) || 0}
              </span>
            </div>
          </div>
          {benefits.deductibleFamily && (
            <div>
              <p className="text-sm text-muted-foreground">Family Deductible</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">
                  ${Number(benefits.deductibleFamilyMet) || 0}
                </span>
                <span className="text-muted-foreground">
                  / ${Number(benefits.deductibleFamily) || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {isDental && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">Coverage by Category</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <div>
                    <p className="font-medium text-sm">Preventive</p>
                    <p className="text-xs text-muted-foreground">Cleanings, X-rays</p>
                  </div>
                  <CoverageBadge percentage={benefits.preventiveCoverage || 0} />
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <div>
                    <p className="font-medium text-sm">Basic</p>
                    <p className="text-xs text-muted-foreground">Fillings, Extractions</p>
                  </div>
                  <CoverageBadge percentage={benefits.basicCoverage || 0} />
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <div>
                    <p className="font-medium text-sm">Major</p>
                    <p className="text-xs text-muted-foreground">Crowns, Bridges</p>
                  </div>
                  <CoverageBadge percentage={benefits.majorCoverage || 0} />
                </div>
                {benefits.orthodonticCoverage && (
                  <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                    <div>
                      <p className="font-medium text-sm">Orthodontic</p>
                      <p className="text-xs text-muted-foreground">Braces, Aligners</p>
                    </div>
                    <CoverageBadge percentage={benefits.orthodonticCoverage} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!isDental && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">Medical Coverage</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <div>
                    <p className="font-medium text-sm">In-Network</p>
                    <p className="text-xs text-muted-foreground">Preferred providers</p>
                  </div>
                  <CoverageBadge percentage={benefits.preventiveCoverage || 80} />
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <div>
                    <p className="font-medium text-sm">Out-of-Network</p>
                    <p className="text-xs text-muted-foreground">Non-preferred</p>
                  </div>
                  <CoverageBadge percentage={benefits.basicCoverage || 60} />
                </div>
              </div>
            </div>
          </>
        )}

        {isDental && (benefits.cleaningsPerYear || benefits.xraysFrequency || benefits.fluorideAgeLimit) && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">Frequency Limitations</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {benefits.cleaningsPerYear && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Cleanings</p>
                    <p className="font-medium">{benefits.cleaningsPerYear} per year</p>
                  </div>
                )}
                {benefits.xraysFrequency && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">X-rays</p>
                    <p className="font-medium">{benefits.xraysFrequency}</p>
                  </div>
                )}
                {benefits.fluorideAgeLimit && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Fluoride</p>
                    <p className="font-medium">Up to age {benefits.fluorideAgeLimit}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
