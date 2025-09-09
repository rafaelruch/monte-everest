import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface InstallationStatus {
  installed: boolean;
  needsInstallation: boolean;
}

interface InstallationGuardProps {
  children: React.ReactNode;
}

export default function InstallationGuard({ children }: InstallationGuardProps) {
  const [location, setLocation] = useLocation();
  
  // Check installation status
  const { data: installStatus, isLoading } = useQuery<InstallationStatus>({
    queryKey: ['/api/install/status'],
    retry: false,
  });

  useEffect(() => {
    // Skip installation check if already on install page or setup-tables
    if (location === '/install' || location === '/setup-tables') {
      return;
    }

    // Redirect to installation if system is not installed
    if (installStatus && !installStatus.installed) {
      setLocation('/install');
    }
  }, [installStatus, location, setLocation]);

  // Show loading screen while checking installation status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Carregando Sistema</h2>
            <p className="text-muted-foreground">Verificando configuração...</p>
          </div>
        </div>
      </div>
    );
  }

  // If on install page, setup-tables, or system not installed, don't show guard
  if (location === '/install' || location === '/setup-tables' || (installStatus && !installStatus.installed)) {
    return <>{children}</>;
  }

  return <>{children}</>;
}