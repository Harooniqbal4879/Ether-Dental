import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AuthAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  practiceId: string;
}

interface AuthPractice {
  id: string;
  name: string;
}

interface AuthState {
  authenticated: boolean;
  admin: AuthAdmin | null;
  practice: AuthPractice | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/session"],
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000,
  });

  const sessionData = data as {
    authenticated: boolean;
    admin?: AuthAdmin;
    practice?: AuthPractice;
  } | undefined;

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
  };

  const refreshSession = () => {
    refetch();
  };

  const value: AuthState = {
    authenticated: sessionData?.authenticated ?? false,
    admin: sessionData?.admin ?? null,
    practice: sessionData?.practice ?? null,
    isLoading,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
