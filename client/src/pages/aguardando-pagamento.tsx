import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function AguardandoPagamento() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<string>('pending_payment');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [professionalName, setProfessionalName] = useState<string>('');
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 60; // 60 tentativas * 5 segundos = 5 minutos
  const retryCountRef = useRef(0); // Use ref to track retries without triggering effect

  // Get professionalId from URL
  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get('professionalId');

  useEffect(() => {
    if (!professionalId) {
      setError('ID do profissional não encontrado');
      setChecking(false);
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status/${professionalId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao verificar status do pagamento');
        }

        const data = await response.json();
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus);
        setProfessionalName(data.fullName);

        // If payment is confirmed, redirect to professional login (first access)
        if (data.status === 'active' && data.paymentStatus === 'active') {
          setTimeout(() => {
            setLocation('/professional-login?first-access=true');
          }, 2000);
          return; // Stop polling
        }

        // Increment retry count
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
      } catch (err) {
        console.error('Error checking payment status:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    };

    // Initial check
    checkPaymentStatus();

    // Poll every 5 seconds
    const interval = setInterval(() => {
      if (retryCountRef.current >= maxRetries) {
        clearInterval(interval);
        setChecking(false);
        return;
      }
      
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [professionalId, setLocation]); // Remove retryCount from dependencies

  const getStatusMessage = () => {
    if (status === 'active' && paymentStatus === 'active') {
      return {
        icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
        title: 'Pagamento Confirmado!',
        description: 'Seu pagamento foi confirmado com sucesso. Você será redirecionado em instantes...',
        color: 'text-green-600'
      };
    }

    if (retryCount >= maxRetries) {
      return {
        icon: <Clock className="h-16 w-16 text-orange-500" />,
        title: 'Ainda aguardando confirmação',
        description: 'Seu pagamento pode levar alguns minutos para ser confirmado. Por favor, atualize esta página em alguns instantes ou verifique seu email.',
        color: 'text-orange-600'
      };
    }

    return {
      icon: <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />,
      title: 'Aguardando Confirmação de Pagamento',
      description: 'Estamos verificando seu pagamento. Isso pode levar alguns instantes...',
      color: 'text-blue-600'
    };
  };

  const statusInfo = getStatusMessage();

  if (error && !professionalId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-600">Erro</CardTitle>
            <CardDescription className="text-lg">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/')} data-testid="button-back-home">
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle className={`text-2xl md:text-3xl ${statusInfo.color}`}>
            {statusInfo.title}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {statusInfo.description}
          </CardDescription>
          {professionalName && (
            <p className="text-sm text-gray-600 mt-4">
              Olá, <strong>{professionalName}</strong>!
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">O que acontece agora?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Se você pagou com <strong>cartão de crédito</strong>, a confirmação é instantânea</span>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Se você pagou com <strong>PIX</strong>, pode levar alguns minutos</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Após a confirmação, você será redirecionado automaticamente</span>
              </li>
            </ul>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Status atual: <strong className="capitalize">{status.replace('_', ' ')}</strong>
            </p>
            {retryCount < maxRetries && (
              <p className="text-xs text-gray-500">
                Verificando automaticamente... ({Math.floor(retryCount / 12)} min {(retryCount % 12) * 5} seg)
              </p>
            )}
          </div>

          {retryCount >= maxRetries && (
            <div className="text-center space-y-3 pt-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                data-testid="button-refresh-status"
              >
                Atualizar Status
              </Button>
              <p className="text-xs text-gray-500">
                Ou aguarde e recarregue esta página em alguns minutos
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
