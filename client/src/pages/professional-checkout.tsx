import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Check, Copy, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
}

export default function ProfessionalCheckout() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [emailCopied, setEmailCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  
  // Debug logs
  console.log('Modal state:', { showCredentialsModal, credentials });
  const [paymentData, setPaymentData] = useState({
    professionalData: {
      name: "",
      email: "",
      cpf: "",
      phone: "",
    },
    cardData: {
      number: "",
      holderName: "",
      expMonth: "",
      expYear: "",
      cvv: "",
    }
  });

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const response = await fetch("/api/subscription-plans");
      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }
      const data = await response.json();
      console.log('Planos carregados:', data);
      return data;
    },
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionData: any) => {
      const response = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error types
        if (data.error === 'duplicate_email') {
          throw new Error(data.message);
        } else if (data.error === 'duplicate_cpf') {
          throw new Error(data.message);
        } else {
          throw new Error(data.message || "Erro ao processar pagamento");
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Subscription response:', data);
      if (data.success) {
        toast({
          title: "Conta criada com sucesso!",
          description: data.message,
          variant: "default",
        });
        
        if (data.autoLogin && data.token) {
          // Store credentials for auto-login
          localStorage.setItem('autoLoginCredentials', JSON.stringify({
            email: data.professional.email,
            password: 'senha123',
            token: data.token,
            firstLogin: data.firstLogin,
            professionalData: data.professional
          }));
          
          console.log('Credentials stored, redirecting to login page');
          setTimeout(() => {
            // Redirect to professional-login with auto-login flag
            setLocation("/professional-login?autoLogin=true");
          }, 2000);
        } else {
          // Fallback to credentials modal if auto-login failed
          console.log('Auto-login failed, showing credentials');
          setCredentials({
            email: data.credentials?.email || '',
            password: data.credentials?.password || 'senha123'
          });
          setShowCredentialsModal(true);
        }
      } else {
        console.log('Success flag is false:', data);
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Copy functions
  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'email') {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      } else {
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      }
      toast({
        title: "Copiado!",
        description: `${type === 'email' ? 'Email' : 'Senha'} copiado para área de transferência`,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar. Selecione e copie manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleLoginRedirect = () => {
    setShowCredentialsModal(false);
    setLocation("/professional-login");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Escolha o plano que melhor se adequa ao seu perfil.",
        variant: "destructive",
      });
      return;
    }

    createSubscriptionMutation.mutate({
      planId: selectedPlan,
      professionalData: paymentData.professionalData,
      paymentMethod: "credit_card",
      cardData: paymentData.cardData,
    });
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <title>Assine e Comece a Receber Clientes - Monte Everest</title>
      <meta name="description" content="Escolha seu plano e comece a receber clientes através da Monte Everest." />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Escolha seu Plano Profissional
          </h1>
          <p className="text-muted-foreground">
            Assine agora e comece a receber clientes através da nossa plataforma
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Plans Selection */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans?.map((plan) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? 'border-[#3C8BAB] bg-blue-50' 
                    : 'hover:border-[#3C8BAB]'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
                data-testid={`plan-card-${plan.id}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {selectedPlan === plan.id && (
                      <Check className="h-5 w-5 text-[#3C8BAB]" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#3C8BAB] mb-4">
                    R$ {plan.monthlyPrice.toFixed(2)}
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Professional Data */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={paymentData.professionalData.name}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      professionalData: { ...paymentData.professionalData, name: e.target.value }
                    })}
                    placeholder="Seu nome completo"
                    required
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={paymentData.professionalData.email}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      professionalData: { ...paymentData.professionalData, email: e.target.value }
                    })}
                    placeholder="seu@email.com"
                    required
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={paymentData.professionalData.cpf}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      professionalData: { ...paymentData.professionalData, cpf: e.target.value }
                    })}
                    placeholder="000.000.000-00"
                    required
                    data-testid="input-cpf"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={paymentData.professionalData.phone}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      professionalData: { ...paymentData.professionalData, phone: e.target.value }
                    })}
                    placeholder="(11) 99999-9999"
                    required
                    data-testid="input-phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Dados do Cartão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Número do Cartão *</Label>
                <Input
                  id="cardNumber"
                  value={paymentData.cardData.number}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    cardData: { ...paymentData.cardData, number: e.target.value }
                  })}
                  placeholder="0000 0000 0000 0000"
                  required
                  data-testid="input-card-number"
                />
              </div>
              <div>
                <Label htmlFor="cardHolder">Nome no Cartão *</Label>
                <Input
                  id="cardHolder"
                  value={paymentData.cardData.holderName}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    cardData: { ...paymentData.cardData, holderName: e.target.value }
                  })}
                  placeholder="Nome como está no cartão"
                  required
                  data-testid="input-card-holder"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expMonth">Mês *</Label>
                  <Input
                    id="expMonth"
                    value={paymentData.cardData.expMonth}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      cardData: { ...paymentData.cardData, expMonth: e.target.value }
                    })}
                    placeholder="MM"
                    maxLength={2}
                    required
                    data-testid="input-exp-month"
                  />
                </div>
                <div>
                  <Label htmlFor="expYear">Ano *</Label>
                  <Input
                    id="expYear"
                    value={paymentData.cardData.expYear}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      cardData: { ...paymentData.cardData, expYear: e.target.value }
                    })}
                    placeholder="AAAA"
                    maxLength={4}
                    required
                    data-testid="input-exp-year"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    value={paymentData.cardData.cvv}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      cardData: { ...paymentData.cardData, cvv: e.target.value }
                    })}
                    placeholder="123"
                    maxLength={4}
                    required
                    data-testid="input-cvv"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              className="bg-[#3C8BAB] hover:bg-[#2C7A9A] text-white px-8 py-3"
              disabled={createSubscriptionMutation.isPending}
              data-testid="button-submit"
            >
              {createSubscriptionMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {selectedPlan ? `Assinar ${plans?.find(p => p.id === selectedPlan)?.name}` : 'Finalizar Assinatura'}
            </Button>
          </div>
        </form>
      </div>

      {/* Credentials Modal */}
      <Dialog open={showCredentialsModal} onOpenChange={() => {}} modal={true}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Conta Criada com Sucesso!
            </DialogTitle>
            <DialogDescription>
              Suas credenciais de acesso foram geradas. <strong>Anote em local seguro</strong> antes de continuar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Atenção Importante</span>
              </div>
              <p className="text-sm text-yellow-700">
                Guarde essas informações em local seguro. Você precisará delas para fazer login.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Email de Acesso</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={credentials.email} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    className="shrink-0"
                  >
                    {emailCopied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Senha Temporária</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={credentials.password} 
                    readOnly 
                    className="bg-gray-50"
                    type="text"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                    className="shrink-0"
                  >
                    {passwordCopied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Próximos passos:</strong> Faça login no portal profissional e altere sua senha no primeiro acesso.
              </p>
            </div>
            
            <Button 
              onClick={handleLoginRedirect}
              className="w-full bg-[#3C8BAB] hover:bg-[#2C7A9A] text-white"
            >
              Ir para o Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}