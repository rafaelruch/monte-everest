import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, Key, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SystemConfig {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminConfigurations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newConfigOpen, setNewConfigOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    key: "",
    value: "",
    description: "",
    isSecret: false,
  });

  const { data: pagarmeStatus } = useQuery({
    queryKey: ["/api/admin/pagarme/status"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pagarme/status", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch Pagar.me status");
      }
      return response.json();
    },
  });

  const { data: configs, isLoading } = useQuery<SystemConfig[]>({
    queryKey: ["/api/admin/configs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/configs", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch configs");
      }
      return response.json();
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: async (configData: typeof newConfig) => {
      const response = await fetch("/api/admin/configs", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configData),
      });
      if (!response.ok) {
        throw new Error("Failed to create config");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
      setNewConfigOpen(false);
      setNewConfig({ key: "", value: "", description: "", isSecret: false });
      toast({
        title: "Configuração criada",
        description: "A configuração foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const response = await fetch(`/api/admin/configs/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value }),
      });
      if (!response.ok) {
        throw new Error("Failed to update config");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
      toast({
        title: "Configuração atualizada",
        description: "A configuração foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/configs/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete config");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
      toast({
        title: "Configuração excluída",
        description: "A configuração foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateConfig = () => {
    if (!newConfig.key || !newConfig.value) {
      toast({
        title: "Campos obrigatórios",
        description: "Chave e valor são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    createConfigMutation.mutate(newConfig);
  };

  const handleUpdateConfig = (id: string, value: string) => {
    updateConfigMutation.mutate({ id, value });
  };

  const toggleSecretVisibility = (configId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [configId]: !prev[configId],
    }));
  };

  const renderConfigValue = (config: SystemConfig) => {
    if (config.isSecret && !showSecrets[config.id]) {
      return "••••••••••••";
    }
    return config.value || "";
  };

  const getConfigVariant = (key: string) => {
    if (key.toLowerCase().includes('pagarme')) return 'border-blue-200 bg-blue-50';
    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')) return 'border-purple-200 bg-purple-50';
    return 'border-gray-200 bg-gray-50';
  };

  if (isLoading) {
    return (
      <AdminLayout title="Configurações do Sistema">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações do Sistema">
      <div className="p-6">
      {/* Pagar.me Connection Card */}
      <div className="mb-8">
        <Card className={`border-2 ${pagarmeStatus?.connected ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${pagarmeStatus?.connected ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <Key className={`h-6 w-6 ${pagarmeStatus?.connected ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Conexão Pagar.me</h3>
                  <p className={`text-sm ${pagarmeStatus?.connected ? 'text-green-700' : 'text-orange-700'}`}>
                    {pagarmeStatus?.connected ? 'Conectado e configurado' : 'Configure sua API key do Pagar.me'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pagarmeStatus?.connected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="text-sm font-medium">✓ Conectado</span>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setNewConfigOpen(true)}
                    className="bg-[#3C8BAB] hover:bg-[#2C7A9A]"
                  >
                    Configurar API Key
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações do Sistema
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie as configurações do sistema, incluindo credenciais de API e chaves secretas.
          </p>
        </div>

        <Dialog open={newConfigOpen} onOpenChange={setNewConfigOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Configuração
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Configuração</DialogTitle>
              <DialogDescription>
                Adicione uma nova configuração do sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key">Chave *</Label>
                <Select
                  value={newConfig.key}
                  onValueChange={(value) => {
                    setNewConfig({ 
                      ...newConfig, 
                      key: value,
                      isSecret: value.includes('API_KEY') || value.includes('SECRET'),
                      description: value === 'PAGARME_API_KEY' ? 'Chave de API do Pagar.me (sk_test_... para teste, sk_live_... para produção)' :
                                  value === 'PAGARME_ENCRYPTION_KEY' ? 'Chave de criptografia do Pagar.me' :
                                  ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma configuração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAGARME_API_KEY">PAGARME_API_KEY</SelectItem>
                    <SelectItem value="PAGARME_ENCRYPTION_KEY">PAGARME_ENCRYPTION_KEY</SelectItem>
                    <SelectItem value="custom">Configuração personalizada...</SelectItem>
                  </SelectContent>
                </Select>
                {newConfig.key === 'custom' && (
                  <Input
                    className="mt-2"
                    value={newConfig.key}
                    onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                    placeholder="NOME_DA_CONFIGURACAO"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="value">Valor *</Label>
                <Input
                  id="value"
                  type={newConfig.isSecret ? "password" : "text"}
                  value={newConfig.value}
                  onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                  placeholder="sk_test_..."
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newConfig.description}
                  onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                  placeholder="Chave de API do Pagar.me para ambiente de teste"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isSecret"
                  checked={newConfig.isSecret}
                  onCheckedChange={(checked) => setNewConfig({ ...newConfig, isSecret: checked })}
                />
                <Label htmlFor="isSecret">Configuração secreta</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateConfig}
                disabled={createConfigMutation.isPending}
              >
                {createConfigMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Criar Configuração
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {configs?.map((config) => (
          <Card key={config.id} className={getConfigVariant(config.key)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{config.key}</CardTitle>
                  {config.isSecret && <Key className="h-4 w-4 text-purple-600" />}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteConfigMutation.mutate(config.id)}
                  disabled={deleteConfigMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
              {config.description && (
                <CardDescription>{config.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={renderConfigValue(config)}
                    onChange={(e) => handleUpdateConfig(config.id, e.target.value)}
                    type={config.isSecret && !showSecrets[config.id] ? "password" : "text"}
                    className="font-mono text-sm"
                  />
                </div>
                {config.isSecret && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSecretVisibility(config.id)}
                  >
                    {showSecrets[config.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Criado: {new Date(config.createdAt).toLocaleString('pt-BR')}</span>
                <span>Atualizado: {new Date(config.updatedAt).toLocaleString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!configs || configs.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma configuração encontrada</h3>
              <p className="text-gray-600 mb-4">
                Comece criando suas primeiras configurações do sistema.
              </p>
              <Button onClick={() => setNewConfigOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira configuração
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Configurações importantes para Pagar.me:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>PAGARME_API_KEY</strong>: Chave de API do Pagar.me (ex: sk_test_...)</li>
          <li>• <strong>PAGARME_PUBLIC_KEY</strong>: Chave pública do Pagar.me (ex: pk_test_...)</li>
          <li>• <strong>PAGARME_ENCRYPTION_KEY</strong>: Chave de criptografia para dados sensíveis</li>
          <li>• <strong>PAGARME_WEBHOOK_SECRET</strong>: Segredo para validação de webhooks</li>
        </ul>
        </div>
      </div>
    </AdminLayout>
  );
}