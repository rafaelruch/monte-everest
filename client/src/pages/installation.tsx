import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Server, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Settings,
  Lock,
  Globe,
  Users,
  Zap,
  Home
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const installationSchema = z.object({
  adminEmail: z.string().email("Email inválido"),
  adminPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  databaseUrl: z.string().url("URL do banco inválida").optional().or(z.literal("")),
  siteName: z.string().min(2, "Nome do site deve ter pelo menos 2 caracteres").default("Monte Everest"),
  siteUrl: z.string().url("URL do site inválida").optional().or(z.literal("")),
});

type InstallationData = z.infer<typeof installationSchema>;

export default function Installation() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [, setLocation] = useLocation();

  // Check installation status
  const { data: installStatus, isLoading: checkingStatus } = useQuery({
    queryKey: ['/api/install/status'],
    retry: false,
  });

  // Redirect if already installed
  useEffect(() => {
    if (installStatus && installStatus.installed) {
      setLocation('/');
    }
  }, [installStatus, setLocation]);
  
  const form = useForm<InstallationData>({
    resolver: zodResolver(installationSchema),
    defaultValues: {
      adminEmail: "",
      adminPassword: "",
      databaseUrl: "",
      siteName: "Monte Everest",
      siteUrl: "",
    },
  });

  const installationMutation = useMutation({
    mutationFn: async (data: InstallationData) => {
      // Simulate installation steps
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentStep(4);
      const response = await apiRequest("POST", "/api/install", data);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(5);
      
      return response;
    },
    onSuccess: () => {
      setIsComplete(true);
    },
  });

  const onSubmit = (data: InstallationData) => {
    installationMutation.mutate(data);
  };

  const steps = [
    { id: 1, title: "Configuração Inicial", icon: Settings },
    { id: 2, title: "Verificando Sistema", icon: Server },
    { id: 3, title: "Configurando Banco", icon: Database },
    { id: 4, title: "Criando Admin", icon: Users },
    { id: 5, title: "Finalizando", icon: CheckCircle },
  ];

  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Show loading while checking installation status
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center" data-testid="checking-installation">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-xl">
              Verificando Sistema
            </CardTitle>
            <CardDescription>
              Aguarde enquanto verificamos se o sistema já foi instalado...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show message if already installed
  if (installStatus && installStatus.installed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center" data-testid="already-installed">
          <CardHeader>
            <div className="mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Sistema já Instalado
            </CardTitle>
            <CardDescription className="text-lg">
              O Monte Everest já foi configurado anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Este sistema já está pronto para uso. Acesse a página inicial ou o painel administrativo.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={() => setLocation('/')}
                data-testid="button-go-home"
              >
                <Home className="mr-2 h-4 w-4" />
                Ir para Página Inicial
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1"
                onClick={() => setLocation('/admin-dashboard')}
                data-testid="button-go-admin"
              >
                <Users className="mr-2 h-4 w-4" />
                Painel Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl text-center" data-testid="installation-complete">
          <CardHeader>
            <div className="mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              Instalação Concluída!
            </CardTitle>
            <CardDescription className="text-lg">
              O Monte Everest foi configurado com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium">Plataforma Pronta</h3>
                <p className="text-sm text-muted-foreground">
                  Seu marketplace está funcionando
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium">Admin Criado</h3>
                <p className="text-sm text-muted-foreground">
                  Acesse o painel administrativo
                </p>
              </div>
            </div>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Credenciais de acesso:</strong><br />
                Email: {form.getValues("adminEmail")}<br />
                Use essas credenciais para acessar o painel administrativo
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={() => window.location.href = "/admin-dashboard"}
                data-testid="button-go-to-admin"
              >
                <Users className="mr-2 h-4 w-4" />
                Ir para Painel Admin
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1"
                onClick={() => window.location.href = "/"}
                data-testid="button-go-to-site"
              >
                <Globe className="mr-2 h-4 w-4" />
                Ver Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl" data-testid="installation-form">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            Configuração do Monte Everest
          </CardTitle>
          <CardDescription>
            Configure sua plataforma de marketplace de serviços
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Progress Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep >= step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted text-muted-foreground border-muted"
                      }`}
                    >
                      {installationMutation.isPending && isCurrent ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                        {step.title}
                      </p>
                      {isCurrent && installationMutation.isPending && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Em andamento...
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Progress value={progressValue} className="h-2" data-testid="installation-progress" />
          </div>

          {currentStep === 1 && !installationMutation.isPending && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Plataforma</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Monte Everest"
                            data-testid="input-site-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Site (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://monteeverest.com"
                            data-testid="input-site-url"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuração do Banco de Dados</h3>
                  
                  <FormField
                    control={form.control}
                    name="databaseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Banco PostgreSQL (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="postgres://user:pass@host:5432/database"
                            data-testid="input-database-url"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Para EasyPanel/produção: Cole a URL do PostgreSQL aqui e as tabelas serão criadas automaticamente
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Administrador do Sistema</h3>
                  
                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Administrador</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@monteeverest.com"
                            data-testid="input-admin-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha do Administrador</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Crie uma senha segura"
                            data-testid="input-admin-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                {installationMutation.error && (
                  <Alert variant="destructive" data-testid="error-message">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {installationMutation.error instanceof Error 
                        ? installationMutation.error.message 
                        : "Erro durante a instalação"}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={installationMutation.isPending}
                  data-testid="button-start-installation"
                >
                  {installationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Instalando...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Iniciar Instalação
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {installationMutation.isPending && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {steps.find(s => s.id === currentStep)?.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Isso pode levar alguns momentos...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}