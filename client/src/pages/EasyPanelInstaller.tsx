import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, Loader2 } from 'lucide-react';

export default function EasyPanelInstaller() {
  const [databaseUrl, setDatabaseUrl] = useState('postgres://rafaelmiguel:RafaLoh27!@monte-everest_db:5432/site-monteeverest?sslmode=disable');
  const [isInstalling, setIsInstalling] = useState(false);
  const [result, setResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleInstall = async () => {
    setIsInstalling(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/install/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ databaseUrl })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          type: 'success',
          message: 'Banco de dados configurado com sucesso! Todas as tabelas foram criadas.'
        });
      } else {
        setResult({
          type: 'error', 
          message: data.message || 'Erro ao configurar banco de dados'
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Erro de conexão. Verifique se o servidor está funcionando.'
      });
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-md mx-auto pt-20">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Monte Everest
            </CardTitle>
            <CardDescription className="text-gray-600">
              Instalador Automático EasyPanel
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="database-url" className="text-sm font-medium text-gray-700">
                URL do Banco PostgreSQL
              </Label>
              <Input
                id="database-url"
                type="text"
                value={databaseUrl}
                onChange={(e) => setDatabaseUrl(e.target.value)}
                placeholder="postgres://user:pass@host:5432/database"
                className="mt-1"
                data-testid="input-database-url"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL de conexão do PostgreSQL no EasyPanel
              </p>
            </div>

            {result && (
              <Alert className={result.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center">
                  {result.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={`ml-2 ${result.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <Button 
              onClick={handleInstall}
              disabled={isInstalling || !databaseUrl.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="button-install-database"
            >
              {isInstalling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configurando Banco...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Instalar Tabelas no Banco
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              <p>✅ Este instalador irá:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Testar conexão com o banco</li>
                <li>Criar todas as 9 tabelas</li>
                <li>Inserir dados iniciais</li>
                <li>Configurar índices de performance</li>
              </ul>
            </div>

            {result?.type === 'success' && (
              <div className="text-center">
                <Button 
                  onClick={() => window.location.href = '/install'}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="button-continue-install"
                >
                  Continuar para Instalação do Sistema
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}