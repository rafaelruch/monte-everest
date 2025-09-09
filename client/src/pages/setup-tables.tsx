import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database } from "lucide-react";

export default function SetupTables() {
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCreateTables = async () => {
    if (!databaseUrl.trim()) {
      setResult({ success: false, message: "Por favor, informe a URL do banco de dados" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/setup-tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ databaseUrl }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ 
          success: true, 
          message: data.message + " 🎉 Schema atualizado com sucesso!" 
        });
        // Não redirecionar - apenas atualização de schema
      } else {
        setResult({ success: false, message: data.message || "Erro desconhecido" });
      }
    } catch (error) {
      setResult({ success: false, message: "Erro de conexão com o servidor" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Atualizar Schema do Banco</CardTitle>
          <p className="text-gray-600">
            Criar/atualizar tabelas e colunas no banco de dados
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              URL do Banco de Dados
            </label>
            <Input
              type="text"
              placeholder="postgres://user:password@host:5432/database"
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Exemplo: postgres://postgres:senha@localhost:5432/monte_everest
            </p>
          </div>

          {result && (
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                  {result.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <Button 
            onClick={handleCreateTables}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Atualizando Schema...
              </div>
            ) : (
              "Atualizar Schema"
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Este processo criará todas as tabelas necessárias no banco de dados.
            <br />
            Após criar as tabelas, você será redirecionado para a instalação completa.
            <br />
            Certifique-se de que o banco existe e está acessível.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}