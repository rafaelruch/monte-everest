import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Entrar() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loginError, setLoginError] = useState("");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/admin/login", {
        email: data.email,
        password: data.password,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Store the JWT token
      localStorage.setItem("adminToken", data.token);
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o painel administrativo...",
      });
      
      // Redirect to admin dashboard
      setLocation("/admin/dashboard");
    },
    onError: (error: any) => {
      setLoginError(error.message || "Erro ao fazer login");
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setLoginError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen py-16" data-testid="entrar-page">
      <title>Entrar - Painel Administrativo - Monte Everest</title>
      <meta name="description" content="Acesso ao painel administrativo da plataforma Monte Everest. Faça login para gerenciar profissionais, categorias e relatórios." />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4" data-testid="page-title">
            Entrar
          </h1>
          <p className="text-muted-foreground" data-testid="page-subtitle">
            Acesse o painel administrativo
          </p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle data-testid="form-title">Acesso Administrativo</CardTitle>
            <CardDescription data-testid="form-description">
              Faça login com suas credenciais de administrador
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loginError && (
              <Alert variant="destructive" className="mb-6" data-testid="login-error">
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="login-form">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@monteeverest.com"
                          {...field}
                          data-testid="input-email"
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
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-remember"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <label className="text-sm text-muted-foreground">
                            Lembrar de mim
                          </label>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    variant="link" 
                    size="sm" 
                    type="button"
                    className="px-0"
                    data-testid="link-forgot-password"
                  >
                    Esqueceu a senha?
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground" data-testid="admin-note">
            Este é o painel administrativo da plataforma Monte Everest.
            <br />
            Apenas administradores autorizados podem acessar esta área.
          </p>
        </div>
      </div>
    </div>
  );
}
