import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, CreditCard, Loader2 } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  maxContacts?: number;
  maxPhotos?: number;
  isFeatured?: boolean;
}

export default function SejaProfissional() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    cep: "",
    city: "",
    street: "",
    number: "",
    neighborhood: "",
  });

  // Fetch available plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const response = await fetch("/api/subscription-plans");
      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }
      return response.json();
    },
  });

  // Create registration with checkout mutation
  const createRegistrationMutation = useMutation({
    mutationFn: async (registrationData: any) => {
      const response = await fetch("/api/payments/register-with-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Erro ao processar cadastro");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setShowCheckout(false);
      
      // Flow: Navigate to waiting page, then open checkout in new tab
      // Pagar.me doesn't support automatic redirect after payment,
      // so we keep the user on our polling page while payment opens in new tab
      if (data.checkoutUrl && data.professionalId) {
        // Store checkout URL and professionalId for the aguardando-pagamento page
        localStorage.setItem('pendingProfessionalId', data.professionalId.toString());
        localStorage.setItem('pendingCheckoutUrl', data.checkoutUrl);
        
        // Navigate to waiting page (it will open checkout automatically)
        window.location.href = `/aguardando-pagamento?professionalId=${data.professionalId}`;
      }
    },
    onError: (error) => {
      // Check for specific error types
      if (error.message.includes('CPF inválido') || error.message.includes('Invalid CPF')) {
        toast({
          title: "CPF Inválido",
          description: "Verifique o número do CPF e tente novamente.",
          variant: "destructive",
        });
      } else if (error.message.includes('E-mail já cadastrado')) {
        toast({
          title: "E-mail já cadastrado",
          description: "Este e-mail já possui cadastro. Faça login ou recupere sua senha.",
          variant: "destructive",
        });
      } else if (error.message.includes('CPF já cadastrado')) {
        toast({
          title: "CPF já cadastrado",
          description: "Este CPF já possui cadastro. Faça login ou entre em contato com o suporte.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao processar cadastro",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) return;

    const registrationData = {
      planId: selectedPlan.id,
      professionalData: {
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf,
        phone: formData.phone,
      }
    };

    createRegistrationMutation.mutate(registrationData);
  };

  const formatCurrency = (value: number | string) => {
    // Se o valor já for uma string formatada como decimal (ex: "29.90"), usar diretamente
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep: cep.replace(/(\d{5})(\d{3})/, '$1-$2') }));
    
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            city: data.localidade,
            street: data.logradouro,
            neighborhood: data.bairro,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
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
    <div className="min-h-screen bg-background">
      <title>Seja um Profissional - Monte Everest</title>
      <meta name="description" content="Escolha seu plano e comece a receber clientes através da Monte Everest." />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Seja um Profissional
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Conecte-se com milhares de clientes em potencial. Escolha o plano que melhor se adequa ao seu perfil profissional.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                plan.isFeatured ? 'border-[#3C8BAB] shadow-lg scale-105' : 'border-border hover:border-[#3C8BAB]/50'
              }`}
              onClick={() => handlePlanSelect(plan)}
              data-testid={`plan-card-${plan.id}`}
            >
              {plan.isFeatured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#3C8BAB] text-white px-4 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="text-4xl font-bold text-foreground mb-2">
                  {formatCurrency(plan.monthlyPrice)}
                  <span className="text-lg text-muted-foreground font-normal">/mês</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.maxContacts && (
                    <li className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Até {plan.maxContacts} contatos por mês</span>
                    </li>
                  )}
                  {plan.maxPhotos && (
                    <li className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Até {plan.maxPhotos} fotos no perfil</span>
                    </li>
                  )}
                </ul>
                
                <Button 
                  className={`w-full mt-6 ${
                    plan.isFeatured 
                      ? 'bg-[#3C8BAB] hover:bg-[#3C8BAB]/90 text-white' 
                      : 'bg-background border border-[#3C8BAB] text-[#3C8BAB] hover:bg-[#3C8BAB] hover:text-white'
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                  data-testid={`plan-select-${plan.id}`}
                >
                  {plan.isFeatured ? 'Escolher Plano' : 'Começar Agora'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Checkout Modal */}
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Finalizar Assinatura - {selectedPlan?.name}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{selectedPlan?.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPlan?.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#3C8BAB]">
                      {selectedPlan && formatCurrency(selectedPlan.monthlyPrice)}
                    </div>
                    <div className="text-sm text-muted-foreground">por mês</div>
                  </div>
                </div>
              </div>

              {/* Personal Data */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados Pessoais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCpf(e.target.value) }))}
                      maxLength={14}
                      required
                      data-testid="input-cpf"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      maxLength={15}
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                
                {/* Address Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep || ''}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                      data-testid="input-cep"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      required
                      data-testid="input-city"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      value={formData.street || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      required
                      data-testid="input-street"
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.number || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      required
                      data-testid="input-number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                      required
                      data-testid="input-neighborhood"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Escolha sua forma de pagamento
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Você poderá pagar com <strong>PIX</strong> ou <strong>Cartão de Crédito</strong> na próxima etapa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createRegistrationMutation.isPending}
                  className="flex-1 bg-[#3C8BAB] hover:bg-[#3C8BAB]/90"
                  data-testid="button-submit"
                >
                  {createRegistrationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    `Continuar para Pagamento`
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}