import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import {
  Check,
  X,
  Building2,
  Mail,
  AlertCircle,
  Loader2,
  UserPlus,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

interface InvitationDetails {
  id: string;
  practiceId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  message: string | null;
  status: string;
  expiresAt: string;
  practice: {
    id: string;
    name: string;
  } | null;
}

export default function InvitationPage() {
  const [, params] = useRoute("/invitation/:token");
  const token = params?.token;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [responded, setResponded] = useState(false);
  const [responseType, setResponseType] = useState<"accepted" | "declined" | null>(null);

  const { data: invitation, isLoading, error } = useQuery<InvitationDetails>({
    queryKey: ["/api/invitations", token],
    enabled: !!token,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invitations/${token}/accept`);
      return response.json();
    },
    onSuccess: () => {
      setResponded(true);
      setResponseType("accepted");
      toast({
        title: "Invitation Accepted",
        description: "You have successfully joined the practice network.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invitations/${token}/decline`);
      return response.json();
    },
    onSuccess: () => {
      setResponded(true);
      setResponseType("declined");
      toast({
        title: "Invitation Declined",
        description: "You have declined the invitation.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline invitation",
        variant: "destructive",
      });
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
              <p className="text-muted-foreground">
                This invitation link is invalid or malformed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading invitation details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invitation Not Found</h2>
              <p className="text-muted-foreground">
                This invitation may have expired, been cancelled, or already been used.
              </p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setLocation("/")}
                data-testid="button-go-home"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (responded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {responseType === "accepted" ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Welcome Aboard!</h2>
                  <p className="text-muted-foreground mb-4">
                    You've successfully joined <span className="font-medium">{invitation.practice?.name}</span>'s professional network.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    You can now view and claim shifts from this practice using the EtherAI-Dental mobile app.
                  </p>
                  <Button 
                    onClick={() => setLocation("/login/admin")}
                    data-testid="button-go-to-login"
                  >
                    Go to Login
                  </Button>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <X className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Invitation Declined</h2>
                  <p className="text-muted-foreground mb-6">
                    You've declined the invitation from {invitation.practice?.name}.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/")}
                    data-testid="button-go-home-declined"
                  >
                    Go to Home
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 max-w-3xl mx-auto">
          <span className="text-xl font-bold text-primary">EtherAI-Dental</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-lg mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription className="text-base">
              {invitation.practice?.name} has invited you to join their professional network
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3" data-testid="invitation-details">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Practice:</span>
                <span className="text-sm" data-testid="text-practice-name">{invitation.practice?.name || "Unknown Practice"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Invited as:</span>
                <Badge variant="secondary" data-testid="badge-invitation-role">{invitation.role}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Expires:</span>
                <span className="text-sm" data-testid="text-expiry-date">{new Date(invitation.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>

            {invitation.message && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Message from the practice:</p>
                <div className="bg-muted/30 rounded-lg p-3 text-sm italic text-muted-foreground" data-testid="text-invitation-message">
                  "{invitation.message}"
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                By accepting, you'll be able to view and claim shifts posted by this practice.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  data-testid="button-accept-invitation"
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Accept Invitation
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => declineMutation.mutate()}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  data-testid="button-decline-invitation"
                >
                  {declineMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Decline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Questions? Contact the practice directly or reach out to support.
        </p>
      </main>
    </div>
  );
}
