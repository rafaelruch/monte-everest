import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function ProfessionalLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [autoLoginInProgress, setAutoLoginInProgress] = useState(false);
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Check for auto-login on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldAutoLogin = urlParams.get('autoLogin');
    
    if (shouldAutoLogin === 'true') {
      const storedCredentials = localStorage.getItem('autoLoginCredentials');
      
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        console.log('Auto-login detected, filling credentials:', credentials.email);
        
        // Fill form with credentials
        form.setValue('email', credentials.email);
        form.setValue('password', credentials.password);
        
        // Start auto-login process
        setAutoLoginInProgress(true);
        
        // Auto-submit after a short delay
        setTimeout(() => {
          form.handleSubmit(onSubmit)();
        }, 1000);
        
        // Clean up credentials from localStorage
        localStorage.removeItem('autoLoginCredentials');
      }
    }
  }, [form]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/professionals/login", data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Store professional session with firstLogin flag from backend
      localStorage.setItem("professionalAuth", JSON.stringify({
        id: data.professional.id,
        email: data.professional.email,
        fullName: data.professional.fullName,
        token: data.token,
        firstLogin: data.firstLogin || data.professional.firstLogin
      }));
      
      // Use redirectTo from backend, default to dashboard if not provided
      const redirectPath = data.redirectTo || "/professional-dashboard";
      setLocation(redirectPath);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" data-testid="professional-login-form">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Portal do Profissional</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar seu painel
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Sua senha"
                          data-testid="input-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="toggle-password-visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {loginMutation.error && (
                <Alert variant="destructive" data-testid="error-message">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {loginMutation.error instanceof Error 
                      ? loginMutation.error.message 
                      : "Email ou senha incorretos"}
                  </AlertDescription>
                </Alert>
              )}

              {autoLoginInProgress && (
                <Alert className="mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Fazendo login automaticamente com suas credenciais...
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending || autoLoginInProgress}
                data-testid="button-login"
              >
                {(loginMutation.isPending || autoLoginInProgress) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {autoLoginInProgress ? 'Entrando automaticamente...' : 'Entrando...'}
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/seja-profissional" className="text-primary hover:underline" data-testid="link-register">
                Cadastre-se aqui
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              <Link href="/forgot-password" className="text-primary hover:underline" data-testid="link-forgot-password">
                Esqueci minha senha
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}