import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import logoPath from "@assets/just_logo_1770330927218.jpg";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePersona } from "@/lib/persona-context";

interface LoginResponse {
  success: boolean;
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    practiceId: string;
  };
  practice: {
    id: string;
    name: string;
  } | null;
}

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { setCurrentPersona } = usePersona();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data: LoginResponse = await response.json();
      return data;
    },
    onSuccess: async (data) => {
      // Wait for session query to refetch before navigating
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/session"] });
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.admin.firstName}!`,
      });
      setCurrentPersona("admin");
      navigate("/app");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="admin-login-page">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <img src={logoPath} alt="EtherAI-Dental" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold">EtherAI-Dental</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md" data-testid="login-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" data-testid="text-login-title">
              Practice Admin Login
            </CardTitle>
            <CardDescription data-testid="text-login-description">
              Sign in to manage your dental practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@yourpractice.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMutation.isPending}
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground" data-testid="link-back">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link 
                  href="/register" 
                  className="text-primary hover:underline"
                  data-testid="link-register"
                >
                  Register your practice
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
