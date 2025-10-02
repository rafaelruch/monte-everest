import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Star, 
  MessageSquare, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Edit,
  Save,
  X,
  Shield,
  TrendingUp,
  Eye,
  Lock,
  AlertCircle,
  ImagePlus,
  Trash2,
  Camera,
  Plus,
  Check,
  ChevronsUpDown,
  Clock,
  Smartphone,
  Copy
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/ImageUploader";
import { useViaCep } from "@/hooks/useViaCep";

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  description: z.string().min(20, "Descrição deve ter pelo menos 20 caracteres").max(250, "Descrição não pode ter mais de 250 caracteres"),
  serviceArea: z.string().min(8, "CEP inválido"),
  city: z.string().min(2, "Cidade é obrigatória"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

// Schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function ProfessionalDashboard() {
  // ALL HOOKS MUST BE AT THE TOP - NO CONDITIONAL HOOKS
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [professionalAuth, setProfessionalAuth] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [forcePasswordChangeOpen, setForcePasswordChangeOpen] = useState(false);
  const queryClient = useQueryClient();
  const { fetchAddressByCep, loading: cepLoading } = useViaCep();

  // Get auth from localStorage on mount
  useEffect(() => {
    const auth = localStorage.getItem("professionalAuth");
    if (!auth) {
      setLocation("/professional-login");
      return;
    }
    
    const authData = JSON.parse(auth);
    setProfessionalAuth(authData);
    
    // Check if this is first login and show password change modal
    if (authData.firstLogin) {
      setShowPasswordModal(true);
      
      // Remove firstLogin flag from storage
      const updatedAuth = { ...authData, firstLogin: false };
      localStorage.setItem("professionalAuth", JSON.stringify(updatedAuth));
      setProfessionalAuth(updatedAuth);
    }
  }, [setLocation]);

  // Force password change for first login - MOVED TO TOP
  useEffect(() => {
    if (professionalAuth && professionalAuth.firstLogin && !forcePasswordChangeOpen) {
      setForcePasswordChangeOpen(true);
    }
  }, [professionalAuth, forcePasswordChangeOpen]);

  const { data: professional, isLoading: professionalLoading } = useQuery<any>({
    queryKey: ["/api/professionals", professionalAuth?.id],
    enabled: !!professionalAuth?.id,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<any[]>({
    queryKey: ["/api/reviews", professionalAuth?.id],
    enabled: !!professionalAuth?.id,
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<any[]>({
    queryKey: ["/api/contacts", professionalAuth?.id],
    enabled: !!professionalAuth?.id,
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // Get monthly contact statistics
  const { data: monthlyStats } = useQuery({
    queryKey: ["/api/professionals", professionalAuth?.id, "contacts/monthly"],
    queryFn: async () => {
      const response = await fetch(`/api/professionals/${professionalAuth.id}/contacts/monthly`, {
        headers: {
          "Authorization": `Bearer ${professionalAuth.token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch monthly stats");
      return response.json();
    },
    enabled: !!professionalAuth?.id,
  });

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    values: professional ? {
      fullName: professional.fullName || "",
      phone: professional.phone || "",
      description: professional.description || "",
      serviceArea: professional.serviceArea || "",
      city: professional.city || "",
      categoryId: professional.categoryId || "",
    } : undefined,
  });

  // Update selected category name when professional data changes
  useEffect(() => {
    if (professional && categories.length > 0) {
      const category = (categories as any[]).find((cat: any) => cat.id === professional.categoryId);
      if (category) {
        setSelectedCategoryName(category.name);
      }
    }
  }, [professional, categories]);

  // Handle CEP change and auto-populate city
  const handleCepChange = async (cep: string) => {
    form.setValue('serviceArea', cep);
    
    if (cep.replace(/\D/g, '').length === 8) {
      const addressData = await fetchAddressByCep(cep);
      if (addressData) {
        form.setValue('city', addressData.localidade);
        toast({
          title: "CEP encontrado!",
          description: `Cidade atualizada para: ${addressData.localidade}`,
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado",
          variant: "destructive",
        });
      }
    }
  };
  
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "senha123", // Pre-fill with temporary password
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!professionalAuth?.token || !professionalAuth?.id) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      
      const response = await fetch(`/api/professionals/${professionalAuth.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${professionalAuth.token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar perfil");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalAuth.id] });
      setIsEditing(false);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await fetch(`/api/professionals/${professionalAuth.id}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${professionalAuth.token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao alterar senha");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua nova senha foi definida. Use-a nos próximos logins.",
      });
      setShowPasswordModal(false);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Portfolio photo mutations
  const addPhotoMutation = useMutation({
    mutationFn: async (photoURL: string) => {
      const response = await fetch(`/api/professionals/${professionalAuth.id}/photos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${professionalAuth.token}`,
        },
        body: JSON.stringify({ photoURL }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao adicionar foto");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalAuth.id] });
      toast({
        title: "Foto adicionada!",
        description: "A foto foi adicionada ao seu portfólio com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar foto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removePhotoMutation = useMutation({
    mutationFn: async (photoPath: string) => {
      const response = await fetch(`/api/professionals/${professionalAuth.id}/photos`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${professionalAuth.token}`,
        },
        body: JSON.stringify({ photoPath }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao remover foto");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalAuth.id] });
      toast({
        title: "Foto removida!",
        description: "A foto foi removida do seu portfólio.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover foto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileImageMutation = useMutation({
    mutationFn: async (imageURL: string) => {
      const response = await fetch(`/api/professionals/${professionalAuth.id}/profile-image`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${professionalAuth.token}`,
        },
        body: JSON.stringify({ profileImage: imageURL }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar foto de perfil");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalAuth.id] });
      toast({
        title: "Foto de perfil atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar foto de perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Portfolio photo upload handlers
  const handleGetUploadParameters = async () => {
    const response = await fetch(`/api/professionals/${professionalAuth.id}/photos/upload-url`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${professionalAuth.token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao obter URL de upload");
    }
    
    const { uploadURL } = await response.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleUploadComplete = (result: { uploadURL: string }) => {
    addPhotoMutation.mutate(result.uploadURL);
  };

  // Profile image upload functions
  const handleProfileImageUpload = async (file: File) => {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('photo', file);
      
      // Upload file directly
      const uploadResponse = await fetch(`/api/professionals/${professionalAuth.id}/profile-image/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${professionalAuth.token}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Erro no upload da imagem');
      }

      const { imageId } = await uploadResponse.json();
      
      // Update profile with image ID
      const updateResponse = await fetch(`/api/professionals/${professionalAuth.id}/profile-image`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${professionalAuth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Erro ao atualizar perfil');
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/professionals', professionalAuth.id] });
      toast({ title: "Sucesso", description: "Foto de perfil atualizada com sucesso!" });
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro durante upload", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("professionalAuth");
    setLocation("/");
  };

  const onSubmit = (data: UpdateProfileData) => {
    updateProfileMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: ChangePasswordData) => {
    changePasswordMutation.mutate(data);
  };

  // Early return after all hooks are defined
  if (!professionalAuth) {
    return null;
  }

  if (professionalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const averageRating = professional?.rating ? parseFloat(professional.rating).toFixed(1) : "0.0";
  const totalReviews = professional?.totalReviews || 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="professional-name">
                  Bem-vindo, {professional?.fullName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Portal do Profissional - Monte Everest
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Subscription Warning */}
      {professional?.subscriptionExpiresAt && (() => {
        const expiryDate = new Date(professional.subscriptionExpiresAt);
        const today = new Date();
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 5 && daysLeft > 0) {
          return (
            <div className="max-w-6xl mx-auto px-4 py-3">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Atenção:</strong> Sua assinatura expira em {daysLeft} dias ({new Date(professional.subscriptionExpiresAt).toLocaleDateString("pt-BR")}). 
                  Renove para manter seu perfil ativo na plataforma.
                </AlertDescription>
              </Alert>
            </div>
          );
        } else if (daysLeft <= 0) {
          return (
            <div className="max-w-6xl mx-auto px-4 py-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Assinatura Expirada:</strong> Seu perfil foi desativado. Renove sua assinatura para voltar a aparecer nas buscas.
                </AlertDescription>
              </Alert>
            </div>
          );
        }
        return null;
      })()}

      {/* Link de pagamento para status pendente */}
      {professional?.status === 'pending' && (
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Conta Pendente:</strong> Complete seu pagamento para ativar seu perfil e aparecer nas buscas.
              <div className="mt-2">
                <Button 
                  onClick={() => window.open('/subscription-plans', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Realizar Pagamento
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* PIX Payment Pending Section */}
      {professional?.paymentStatus === 'pending' && professional?.pendingPixCode && (
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Alert className="border-yellow-200 bg-yellow-50">
            <Smartphone className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="space-y-3">
                <div>
                  <strong>Pagamento PIX Pendente:</strong> Complete o pagamento via PIX para ativar sua conta.
                  {professional.pendingPixExpiry && (
                    <div className="flex items-center gap-1 mt-1 text-sm">
                      <Clock className="h-3 w-3" />
                      <span>Válido até: {new Date(professional.pendingPixExpiry).toLocaleString("pt-BR")}</span>
                    </div>
                  )}
                </div>
                
                {/* QR Code */}
                {professional.pendingPixUrl && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                      <img 
                        src={professional.pendingPixUrl} 
                        alt="QR Code PIX" 
                        className="w-40 h-40"
                        data-testid="pending-pix-qr-code"
                        onError={(e) => {
                          console.error('QR Code failed to load:', professional.pendingPixUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('QR Code loaded successfully:', professional.pendingPixUrl);
                        }}
                      />
                    </div>
                    <p className="text-xs text-center font-medium">📱 Escaneie com seu app bancário</p>
                  </div>
                )}
                
                {/* Show debug info if QR Code is not available */}
                {!professional.pendingPixUrl && professional.pendingPixCode && (
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-700">
                      ⚠️ QR Code não disponível, use o código PIX abaixo
                    </p>
                  </div>
                )}
                
                {/* PIX Code Copy */}
                <div>
                  <p className="text-sm font-medium mb-2">Código PIX (Copia e Cola):</p>
                  <div className="flex gap-2">
                    <Input
                      value={professional.pendingPixCode}
                      readOnly
                      className="font-mono text-xs bg-white"
                      data-testid="pending-pix-code"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(professional.pendingPixCode);
                        toast({ 
                          title: "Código PIX copiado!", 
                          description: "Cole no seu app bancário para pagar" 
                        });
                      }}
                      className="shrink-0"
                      data-testid="button-copy-pending-pix"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Force Password Change Modal */}
      <Dialog open={forcePasswordChangeOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" data-testid="force-password-change-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-600" />
              Alterar Senha Obrigatória
            </DialogTitle>
            <DialogDescription>
              Por segurança, você deve alterar sua senha temporária antes de continuar.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual (senha123)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite sua senha atual"
                        {...field}
                        data-testid="input-current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite sua nova senha"
                        {...field}
                        data-testid="input-new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirme sua nova senha"
                        {...field}
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-change-password-confirm"
                >
                  {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bloqueio para status inativo */}
      {professional?.status === 'inactive' && (
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Conta Inativa:</strong> Sua conta foi desativada. Entre em contato com o suporte para reativação.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold" data-testid="average-rating">{averageRating}</p>
                  <p className="text-sm text-muted-foreground">Avaliação Média</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold" data-testid="total-reviews">{totalReviews}</p>
                  <p className="text-sm text-muted-foreground">Avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-green-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold" data-testid="monthly-contacts">
                      {monthlyStats?.currentMonth || 0}
                    </p>
                    {monthlyStats?.hasLimit && (
                      <span className="text-sm text-muted-foreground">
                        / {monthlyStats.maxContacts}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Contatos este mês
                  </p>
                  {monthlyStats?.limitReached && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Limite atingido
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <Badge 
                    variant={professional?.status === "active" ? "default" : professional?.status === "inactive" ? "secondary" : "outline"}
                    className={
                      professional?.status === "active" 
                        ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                        : professional?.status === "inactive"
                        ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
                    }
                    data-testid="status-badge"
                  >
                    {professional?.status === "active" ? "Ativo" : professional?.status === "inactive" ? "Inativo" : "Pendente"}
                  </Badge>
                  <p className="text-sm text-muted-foreground">Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  {professional?.subscriptionExpiresAt ? (
                    <>
                      <p className="text-lg font-semibold" data-testid="subscription-expiry">
                        {new Date(professional.subscriptionExpiresAt).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Plano válido até
                      </p>
                      {(() => {
                        const expiryDate = new Date(professional.subscriptionExpiresAt);
                        const today = new Date();
                        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        if (daysLeft <= 0) {
                          return (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Expirado
                            </Badge>
                          );
                        } else if (daysLeft <= 5) {
                          return (
                            <Badge variant="destructive" className="text-xs mt-1 bg-orange-100 text-orange-800 border-orange-200">
                              {daysLeft} dias restantes
                            </Badge>
                          );
                        } else if (daysLeft <= 10) {
                          return (
                            <Badge variant="secondary" className="text-xs mt-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                              {daysLeft} dias restantes
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge variant="default" className="text-xs mt-1 bg-green-100 text-green-800 border-green-200">
                              {daysLeft} dias restantes
                            </Badge>
                          );
                        }
                      })()}
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold">
                        Sem data definida
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Plano válido até
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
            <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Informações do Perfil</CardTitle>
                    <CardDescription>
                      Gerencie suas informações profissionais
                    </CardDescription>
                  </div>
                  {professional?.status === 'active' ? (
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => setIsEditing(!isEditing)}
                      data-testid={isEditing ? "button-cancel-edit" : "button-edit-profile"}
                    >
                      {isEditing ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      data-testid="button-edit-disabled"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Edição Bloqueada
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Profile Image Section */}
                <div className="flex items-center space-x-6 mb-6 pb-6 border-b">
                  <div className="relative">
                    {professional?.profileImage ? (
                      <img
                        src={professional.profileImage}
                        alt="Foto de perfil"
                        className="w-24 h-24 rounded-full object-cover border-4 border-border"
                        data-testid="profile-image"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Foto de Perfil</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Adicione uma foto profissional para que os clientes possam identificá-lo facilmente.
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="profile-upload-input"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          console.log("[frontend] Iniciando upload direto da foto de perfil:", file.name, file.size);
                          await handleProfileImageUpload(file);
                        }}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('profile-upload-input')?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {professional?.profileImage ? "Alterar Foto" : "Adicionar Foto"}
                      </Button>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-full-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria de Serviço</FormLabel>
                            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={categoryOpen}
                                    className="w-full justify-between"
                                    data-testid="select-category"
                                  >
                                    {selectedCategoryName || "Comece digitando a categoria..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0">
                                <Command>
                                  <CommandInput placeholder="Digite a categoria que você oferece..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                                    <CommandGroup>
                                      {(categories as any[]).map((category: any) => (
                                        <CommandItem
                                          key={category.id}
                                          value={category.name}
                                          onSelect={() => {
                                            field.onChange(category.id);
                                            setSelectedCategoryName(category.name);
                                            setCategoryOpen(false);
                                          }}
                                          data-testid={`option-${category.slug}`}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === category.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {category.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="serviceArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP de Atendimento</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => handleCepChange(e.target.value)}
                                placeholder="00000-000"
                                data-testid="input-service-area" 
                              />
                            </FormControl>
                            <FormMessage />
                            {cepLoading && (
                              <p className="text-sm text-muted-foreground">
                                Buscando cidade...
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Cidade" data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição dos Serviços</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Descreva seus serviços, experiência e diferenciais..."
                                rows={4}
                                maxLength={250}
                                data-testid="textarea-description" 
                              />
                            </FormControl>
                            <div className="flex justify-between items-center">
                              <FormMessage />
                              <p className="text-sm text-muted-foreground">
                                {field.value?.length || 0}/250 caracteres
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      {updateProfileMutation.error && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {updateProfileMutation.error instanceof Error 
                              ? updateProfileMutation.error.message 
                              : "Erro ao atualizar perfil"}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? (
                          <>Salvando...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nome</p>
                          <p className="font-medium" data-testid="display-full-name">{professional?.fullName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium" data-testid="display-email">{professional?.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium" data-testid="display-phone">{professional?.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">CEP de Atendimento</p>
                          <p className="font-medium" data-testid="display-service-area">{professional?.serviceArea}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Cidade</p>
                          <p className="font-medium" data-testid="display-city">{professional?.city}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Categoria</p>
                          <p className="font-medium" data-testid="display-category">{selectedCategoryName || "Não definida"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Descrição dos Serviços</p>
                      <p className="text-sm leading-relaxed" data-testid="display-description">
                        {professional?.description}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Portfólio de Fotos</CardTitle>
                    <CardDescription>
                      {professional?.subscriptionPlanId ? (
                        <span>
                          Gerencie as fotos do seu trabalho 
                          <Badge variant="outline" className="ml-2">
                            {professional.portfolio?.length || 0} fotos no portfólio
                          </Badge>
                        </span>
                      ) : (
                        "Gerencie as fotos do seu trabalho"
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Existing photos */}
                  {professional?.portfolio?.map((photoPath: string, index: number) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={photoPath}
                        alt={`Portfólio ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                        data-testid={`portfolio-photo-${index}`}
                      />
                      <button
                        onClick={() => removePhotoMutation.mutate(photoPath)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={removePhotoMutation.isPending}
                        data-testid={`remove-photo-${index}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add photo button */}
                  <div className="col-span-full">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="portfolio-upload-input"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          console.log("[frontend] Iniciando upload direto da foto do portfólio:", file.name, file.size);
                          
                          try {
                            // Create FormData
                            const formData = new FormData();
                            formData.append('photo', file);
                            
                            console.log("[frontend] Fazendo upload direto do arquivo do portfólio...");
                            const uploadResponse = await fetch(`/api/professionals/${professionalAuth.id}/photos/upload`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${professionalAuth.token}`
                              },
                              body: formData
                            });
                            
                            console.log("[frontend] Resposta do upload:", uploadResponse.status, uploadResponse.statusText);
                            
                            if (uploadResponse.ok) {
                              const { imageId } = await uploadResponse.json();
                              console.log("[frontend] Upload concluído, adicionando ao portfólio:", imageId);
                              
                              // Add to portfolio
                              const addResponse = await fetch(`/api/professionals/${professionalAuth.id}/photos`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${professionalAuth.token}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ imageId })
                              });
                              
                              if (addResponse.ok) {
                                queryClient.invalidateQueries({ queryKey: ['/api/professionals', professionalAuth.id] });
                                toast({ title: "Sucesso", description: "Foto adicionada ao portfólio com sucesso!" });
                              } else {
                                throw new Error("Erro ao adicionar foto ao portfólio");
                              }
                            } else {
                              const errorData = await uploadResponse.json();
                              throw new Error(errorData.message || "Erro no upload");
                            }
                          } catch (error) {
                            console.error("[frontend] Erro durante upload do portfólio:", error);
                            toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro durante upload", variant: "destructive" });
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full h-32 border-dashed"
                        onClick={() => document.getElementById('portfolio-upload-input')?.click()}
                      >
                        <div className="flex flex-col items-center">
                          <ImagePlus className="h-8 w-8 mb-2" />
                          <span>Adicionar Foto ao Portfólio</span>
                          <span className="text-xs text-muted-foreground">JPG, PNG até 5MB</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>


                {/* Empty state */}
                {(!professional?.portfolio || professional.portfolio.length === 0) && (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Seu portfólio está vazio
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione fotos dos seus trabalhos para impressionar os clientes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Suas Avaliações</CardTitle>
                <CardDescription>
                  Veja o que seus clientes estão dizendo sobre seus serviços
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <p>Carregando avaliações...</p>
                ) : totalReviews === 0 ? (
                  <p className="text-muted-foreground" data-testid="no-reviews">
                    Você ainda não possui avaliações.
                  </p>
                ) : (
                  <div className="space-y-4" data-testid="reviews-list">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium" data-testid={`review-customer-${review.id}`}>
                              {review.customerName}
                            </h4>
                            {review.isVerified && (
                              <Badge variant="secondary" className="text-xs">
                                Verificado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground" data-testid={`review-comment-${review.id}`}>
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2" data-testid={`review-date-${review.id}`}>
                          {new Date(review.createdAt || new Date()).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Contatos Recebidos</CardTitle>
                <CardDescription>
                  Acompanhe os contatos de potenciais clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contactsLoading ? (
                  <p>Carregando contatos...</p>
                ) : contacts.length === 0 ? (
                  <p className="text-muted-foreground" data-testid="no-contacts">
                    Você ainda não recebeu contatos.
                  </p>
                ) : (
                  <div className="space-y-4" data-testid="contacts-list">
                    {contacts.map((contact: any) => (
                      <div key={contact.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium" data-testid={`contact-name-${contact.id}`}>
                            {contact.customerName}
                          </h4>
                          <Badge variant="outline" data-testid={`contact-method-${contact.id}`}>
                            {contact.contactMethod === "whatsapp" ? "WhatsApp" : "Telefone"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {contact.customerEmail && (
                            <p className="text-sm text-muted-foreground" data-testid={`contact-email-${contact.id}`}>
                              📧 {contact.customerEmail}
                            </p>
                          )}
                          {contact.customerPhone && (
                            <p className="text-sm text-muted-foreground" data-testid={`contact-phone-${contact.id}`}>
                              📱 {contact.customerPhone}
                            </p>
                          )}
                          {contact.message && (
                            <p className="text-sm" data-testid={`contact-message-${contact.id}`}>
                              {contact.message}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2" data-testid={`contact-date-${contact.id}`}>
                          {new Date(contact.createdAt || new Date()).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Defina sua Nova Senha
            </DialogTitle>
            <DialogDescription>
              Por segurança, é necessário alterar a senha temporária no primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Segurança Obrigatória</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Sua senha atual é temporária. Defina uma nova senha segura para proteger sua conta.
            </p>
          </div>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual (Temporária)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="senha123"
                        readOnly
                        className="bg-gray-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite novamente"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit"
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Lock className="mr-2 h-4 w-4 animate-spin" />
                    Alterando Senha...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Definir Nova Senha
                  </>
                )}
              </Button>
              
              {changePasswordMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {changePasswordMutation.error instanceof Error 
                      ? changePasswordMutation.error.message 
                      : "Erro ao alterar senha"}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}