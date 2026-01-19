import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Link } from "wouter";
import {
  Star,
  CheckCircle,
  Award,
  Clock,
  Users,
  Lightbulb,
  Heart,
  ChevronLeft,
  Mail,
  Phone,
  GraduationCap,
  BadgeCheck,
  Briefcase,
  Wrench,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type ProfessionalWithBadges,
  StaffRoles,
  DentalSpecialties,
} from "@shared/schema";
import { PageHeader } from "@/components/page-header";

const badgeIcons: Record<string, React.ReactNode> = {
  perfect_attendance: <Award className="h-5 w-5" />,
  shifts_completed: <CheckCircle className="h-5 w-5" />,
  timeliness: <Clock className="h-5 w-5" />,
  knowledge: <Lightbulb className="h-5 w-5" />,
  teamwork: <Heart className="h-5 w-5" />,
};

const badgeLabels: Record<string, string> = {
  perfect_attendance: "Perfect Attendance",
  shifts_completed: "Shifts Completed",
  timeliness: "Timeliness",
  knowledge: "Knowledge",
  teamwork: "Teamwork",
};

const badgeColors: Record<string, string> = {
  bronze: "bg-amber-600",
  silver: "bg-slate-400",
  gold: "bg-yellow-500",
};

function ProfessionalCard({ professional }: { professional: ProfessionalWithBadges }) {
  const initials = `${professional.firstName[0]}${professional.lastName[0]}`;
  const rating = parseFloat(professional.rating || "0");

  return (
    <Link href={`/professionals/${professional.id}`}>
      <Card className="hover-elevate cursor-pointer" data-testid={`card-professional-${professional.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={professional.photoUrl || undefined} alt={`${professional.firstName} ${professional.lastName}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">
                  {professional.firstName} {professional.lastName}
                </h3>
                {professional.credentialsVerified && (
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{professional.role}</p>
              <div className="flex items-center gap-2 mt-1">
                {rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                  </div>
                )}
                {professional.specialty && (
                  <Badge variant="secondary" className="text-xs">
                    {professional.specialty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {professional.badges && professional.badges.length > 0 && (
            <div className="flex gap-2 mt-3 pt-3 border-t">
              {professional.badges.slice(0, 4).map((badge) => (
                <div
                  key={badge.id}
                  className={`flex items-center justify-center h-8 w-8 rounded-full ${badgeColors[badge.level] || "bg-muted"}`}
                  title={`${badgeLabels[badge.badgeType] || badge.badgeType} (${badge.level})`}
                >
                  <span className="text-white text-xs">
                    {badgeIcons[badge.badgeType]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ProfessionalDetail({ professional }: { professional: ProfessionalWithBadges }) {
  const initials = `${professional.firstName[0]}${professional.lastName[0]}`;
  const rating = parseFloat(professional.rating || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/professionals" data-testid="button-back-to-professionals">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Professionals
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={professional.photoUrl || undefined} alt={`${professional.firstName} ${professional.lastName}`} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">
                    {professional.firstName} {professional.lastName}
                  </h2>
                  {rating > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-5 w-5 fill-yellow-400" />
                      <span className="font-semibold">{rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {professional.credentialsVerified && (
                  <div className="flex items-center gap-1 text-primary text-sm mb-2">
                    <BadgeCheck className="h-4 w-4" />
                    <span>Credentials Verified</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {professional.email && (
                    <Badge variant="outline" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      {professional.email}
                    </Badge>
                  )}
                  {professional.phone && (
                    <Badge variant="outline" className="text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      {professional.phone}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              {professional.education && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    Education
                  </h4>
                  <p className="text-sm text-muted-foreground">{professional.education}</p>
                  {professional.graduationDate && (
                    <p className="text-xs text-muted-foreground">Graduation Date: {professional.graduationDate}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Profession
                </h4>
                <p className="text-sm text-muted-foreground">{professional.role}</p>
              </div>

              {professional.licenseNumber && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    License Information
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>License #: {professional.licenseNumber}</p>
                    {professional.licenseState && <p>Issued by State of: {professional.licenseState}</p>}
                    {professional.licenseYearIssued && <p>Year Issued: {professional.licenseYearIssued}</p>}
                  </div>
                </div>
              )}

              {professional.experienceRange && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Years of Experience</h4>
                  <p className="text-sm text-muted-foreground">{professional.experienceRange}</p>
                </div>
              )}

              {professional.software && professional.software.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Software</h4>
                  <div className="flex flex-wrap gap-1">
                    {professional.software.map((sw) => (
                      <Badge key={sw} variant="secondary" className="text-xs">
                        {sw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {professional.specialty && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    Specialty
                  </h4>
                  <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                  {professional.specialties && professional.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {professional.specialties.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {professional.badges && professional.badges.length > 0 ? (
                <div className="grid grid-cols-5 gap-4">
                  {professional.badges.map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center text-center">
                      <div
                        className={`flex items-center justify-center h-14 w-14 rounded-full ${badgeColors[badge.level] || "bg-muted"} mb-2`}
                      >
                        <span className="text-white">
                          {badgeIcons[badge.badgeType]}
                        </span>
                      </div>
                      <span className="text-xs font-medium">
                        {badgeLabels[badge.badgeType] || badge.badgeType}
                      </span>
                      {badge.count && badge.count > 0 && (
                        <span className="text-xs text-muted-foreground">{badge.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No badges earned yet
                </p>
              )}
              {professional.badges && professional.badges.some(b => b.level === "gold") && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
                  <p className="text-sm">
                    <span className="font-semibold text-yellow-700 dark:text-yellow-400">Gold:</span>{" "}
                    <span className="text-muted-foreground">
                      Perfect Attendance. This professional has shown unwavering commitment and never cancelled a shift late!
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {professional.procedures && professional.procedures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Experienced Procedures</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {professional.procedures.map((procedure) => (
                    <li key={procedure} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {procedure}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfessionalsHub() {
  const [, params] = useRoute("/professionals/:id");
  const professionalId = params?.id;

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: professionals, isLoading } = useQuery<ProfessionalWithBadges[]>({
    queryKey: ["/api/professionals"],
  });

  const { data: selectedProfessional, isLoading: isLoadingDetail } = useQuery<ProfessionalWithBadges>({
    queryKey: ["/api/professionals", professionalId],
    enabled: !!professionalId,
  });

  if (professionalId) {
    if (isLoadingDetail) {
      return (
        <div className="container max-w-5xl py-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
        </div>
      );
    }

    if (selectedProfessional) {
      return (
        <div className="container max-w-5xl py-6">
          <ProfessionalDetail professional={selectedProfessional} />
        </div>
      );
    }

    return (
      <div className="container max-w-5xl py-6">
        <p className="text-muted-foreground">Professional not found</p>
      </div>
    );
  }

  const filteredProfessionals = professionals?.filter((p) => {
    if (roleFilter !== "all" && p.role !== roleFilter) return false;
    if (specialtyFilter !== "all" && p.specialty !== specialtyFilter && !p.specialties?.includes(specialtyFilter)) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.role.toLowerCase().includes(query) ||
        p.specialty?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <PageHeader
        title="Professionals Hub"
        description="View and manage dental professionals in your network"
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search professionals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-professionals"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-role-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.values(StaffRoles).map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-specialty-filter">
            <SelectValue placeholder="Filter by specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {Object.values(DentalSpecialties).map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filteredProfessionals && filteredProfessionals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfessionals.map((professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Professionals Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || roleFilter !== "all" || specialtyFilter !== "all"
                ? "No professionals match your current filters. Try adjusting your search criteria."
                : "No professionals have been added to the system yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
