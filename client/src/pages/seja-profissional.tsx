import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, CreditCard, Smartphone, Loader2 } from "lucide-react";

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
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const [formData, setFormData] = useState({
    // Dados pessoais
    name: "",
    email: "",
    cpf: "",
    phone: "",
    // Dados do cartão (apenas se credit_card)
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create subscription");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Check if it's PIX/Boleto payment
      if (data.paymentMethod === 'pix' || data.paymentMethod === 'boleto') {
        toast({
          title: "Assinatura criada!",
          description: data.message || "Complete o pagamento para ativar sua conta.",
        });
        
        // Show payment info and don't redirect yet
        setPaymentInfo(data.paymentInfo);
        setShowPaymentInfo(true);
        setShowCheckout(false);
      } else {
        // Credit card payment - proceed with auto-login
        toast({
          title: "Assinatura criada com sucesso!",
          description: data.message || "Sua conta profissional está ativa. Você já pode receber clientes!",
        });
        
        // Save credentials for auto-login if autoLogin is enabled
        if (data.autoLogin && data.professional) {
          const autoLoginCredentials = {
            email: data.professional.email,
            password: 'senha123', // Default password
            firstLogin: data.firstLogin || true,
            token: data.token
          };
          
          localStorage.setItem('autoLoginCredentials', JSON.stringify(autoLoginCredentials));
          
          // Show credentials toast
          setTimeout(() => {
            toast({
              title: "Credenciais de Acesso",
              description: `Login: ${data.professional.email} | Senha: senha123`,
            });
          }, 2000);
        }
        
        setShowCheckout(false);
        // Redirect to professional login with auto-login
        setTimeout(() => {
          setLocation("/professional-login?autoLogin=true");
        }, 4000);
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
      } else {
        toast({
          title: "Erro ao processar pagamento",
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

    const subscriptionData = {
      planId: selectedPlan.id,
      professionalData: {
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
      },
      paymentMethod,
      ...(paymentMethod === 'credit_card' && {
        cardData: {
          number: formData.cardNumber.replace(/\D/g, ''),
          holderName: formData.cardName,
          expMonth: formData.cardExpiry.split('/')[0],
          expYear: '20' + formData.cardExpiry.split('/')[1],
          cvv: formData.cardCvv,
        }
      })
    };

    createSubscriptionMutation.mutate(subscriptionData);
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

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim();
  };

  const formatCardExpiry = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2}\/\d{2})\d+?$/, '$1');
  };

  // Função para calcular tempo restante
  const calculateTimeLeft = (expirationDate: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expirationDate).getTime();
    const difference = expiry - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days} dias, ${hours}h ${minutes}min`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}min`;
      } else {
        return `${minutes} minutos`;
      }
    } else {
      return 'Expirado';
    }
  };

  // useEffect para atualizar o timer
  useEffect(() => {
    if (paymentInfo && (paymentInfo.expiresAt || paymentInfo.dueAt)) {
      const expirationDate = paymentInfo.expiresAt || paymentInfo.dueAt;
      
      // Atualizar imediatamente
      setTimeLeft(calculateTimeLeft(expirationDate));
      
      // Atualizar a cada minuto
      const interval = setInterval(() => {
        const newTimeLeft = calculateTimeLeft(expirationDate);
        setTimeLeft(newTimeLeft);
        
        // Se expirou, parar o timer
        if (newTimeLeft === 'Expirado') {
          clearInterval(interval);
        }
      }, 60000); // Atualiza a cada minuto

      return () => clearInterval(interval);
    }
  }, [paymentInfo]);

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

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Forma de Pagamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      paymentMethod === 'credit_card' 
                        ? 'border-[#3C8BAB] bg-[#3C8BAB]/10' 
                        : 'border-border hover:border-[#3C8BAB]/50'
                    }`}
                    data-testid="payment-credit-card"
                  >
                    <CreditCard className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Cartão de Crédito</div>
                    <div className="text-sm text-muted-foreground">Cobrança recorrente</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      paymentMethod === 'pix' 
                        ? 'border-[#3C8BAB] bg-[#3C8BAB]/10' 
                        : 'border-border hover:border-[#3C8BAB]/50'
                    }`}
                    data-testid="payment-pix"
                  >
                    <Smartphone className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">PIX</div>
                    <div className="text-sm text-muted-foreground">Pagamento único</div>
                  </button>
                </div>
              </div>

              {/* Credit Card Fields */}
              {paymentMethod === 'credit_card' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dados do Cartão</h3>
                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input
                      id="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        cardNumber: formatCardNumber(e.target.value) 
                      }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                      data-testid="input-card-number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardName">Nome no Cartão</Label>
                    <Input
                      id="cardName"
                      value={formData.cardName}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                      required
                      data-testid="input-card-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardExpiry">Validade</Label>
                      <Input
                        id="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          cardExpiry: formatCardExpiry(e.target.value) 
                        }))}
                        placeholder="MM/AA"
                        maxLength={5}
                        required
                        data-testid="input-card-expiry"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCvv">CVV</Label>
                      <Input
                        id="cardCvv"
                        value={formData.cardCvv}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          cardCvv: e.target.value.replace(/\D/g, '') 
                        }))}
                        maxLength={4}
                        required
                        data-testid="input-card-cvv"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={createSubscriptionMutation.isPending}
                  className="flex-1 bg-[#3C8BAB] hover:bg-[#3C8BAB]/90"
                  data-testid="button-submit"
                >
                  {createSubscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    `Finalizar Assinatura - ${selectedPlan && formatCurrency(selectedPlan.monthlyPrice)}`
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Info Dialog for PIX/Boleto */}
        <Dialog open={showPaymentInfo} onOpenChange={setShowPaymentInfo}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                {paymentMethod === 'pix' ? 'Pagamento PIX' : 'Pagamento Boleto'}
              </DialogTitle>
            </DialogHeader>
            
            {paymentInfo ? (
              <div className="space-y-4">
                {/* QR Code for PIX */}
                {paymentMethod === 'pix' && paymentInfo.qrCodeUrl && (
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border inline-block">
                      <img 
                        src={paymentInfo.qrCodeUrl} 
                        alt="QR Code PIX" 
                        className="w-48 h-48 mx-auto"
                        data-testid="pix-qr-code"
                        onError={(e) => {
                          console.error('QR Code image failed to load:', paymentInfo.qrCodeUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('QR Code image loaded successfully:', paymentInfo.qrCodeUrl);
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Escaneie o QR Code com seu app de banco para pagar
                    </p>
                  </div>
                )}
                
                {/* Debug info - show what we have */}
                {paymentMethod === 'pix' && paymentInfo && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 mb-2">
                      Informações de Pagamento PIX:
                    </p>
                    <div className="text-xs text-blue-600 space-y-1">
                      <div>QR Code URL: {paymentInfo.qrCodeUrl ? '✅ Disponível' : '❌ Não disponível'}</div>
                      <div>Código PIX: {paymentInfo.pixCode || paymentInfo.qrCode ? '✅ Disponível' : '❌ Não disponível'}</div>
                      <div>Valor: R$ {paymentInfo.amount ? (paymentInfo.amount / 100).toFixed(2) : 'N/A'}</div>
                      <div>Expira em: {paymentInfo.expiresAt ? new Date(paymentInfo.expiresAt).toLocaleString('pt-BR') : 'N/A'}</div>
                    </div>
                  </div>
                )}

                {/* PIX Code - Always show if we have payment info */}
                {paymentInfo && (
                  <div>
                    <Label className="text-sm font-medium">Código PIX (Copia e Cola)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={paymentInfo.pixCode || paymentInfo.qrCode || "Código PIX não disponível"}
                        readOnly
                        className="font-mono text-xs"
                        data-testid="pix-code"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const code = paymentInfo.pixCode || paymentInfo.qrCode;
                          if (code) {
                            navigator.clipboard.writeText(code);
                            toast({ title: "Código PIX copiado!", description: "Cole no seu app bancário para pagar" });
                          }
                        }}
                        data-testid="button-copy-pix"
                        disabled={!paymentInfo.pixCode && !paymentInfo.qrCode}
                      >
                        Copiar PIX
                      </Button>
                    </div>
                  </div>
                )}

                {/* Boleto info */}
                {paymentMethod === 'boleto' && paymentInfo.line && (
                  <div>
                    <Label className="text-sm font-medium">Código de Barras</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={paymentInfo.line}
                        readOnly
                        className="font-mono text-xs"
                        data-testid="boleto-line"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentInfo.line);
                          toast({ title: "Código copiado!", description: "Use no internet banking" });
                        }}
                        data-testid="button-copy-boleto"
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment amount and due date */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor:</span>
                    <span className="font-medium">
                      {paymentInfo.amount ? `R$ ${(paymentInfo.amount / 100).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  {(paymentInfo.expiresAt || paymentInfo.dueAt) && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">
                        {paymentInfo.expiresAt ? 'Válido até:' : 'Vencimento:'}
                      </span>
                      <span className="text-sm">
                        {new Date(paymentInfo.expiresAt || paymentInfo.dueAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  {/* Countdown Timer */}
                  {timeLeft && (
                    <div className="flex justify-between items-center mt-1 p-2 bg-orange-50 rounded-lg border border-orange-200">
                      <span className="text-sm font-medium text-orange-700">⏰ Tempo restante:</span>
                      <span className={`text-sm font-bold ${timeLeft === 'Expirado' ? 'text-red-600' : 'text-orange-600'}`}>
                        {timeLeft}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <Button
                  onClick={() => {
                    setShowPaymentInfo(false);
                    // After payment is completed via webhook, user can login
                    toast({
                      title: "Aguardando pagamento",
                      description: "Você receberá as credenciais por email após a confirmação.",
                    });
                  }}
                  className="w-full bg-[#3C8BAB] hover:bg-[#3C8BAB]/90"
                  data-testid="button-close-payment"
                >
                  Fechar
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  💡 Sua conta será ativada automaticamente após a confirmação do pagamento
                </p>
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-muted-foreground">
                  Processando informações de pagamento...
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}