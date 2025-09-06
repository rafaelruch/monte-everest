import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, DollarSign, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/admin-layout';

const planSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  monthlyPrice: z.string().min(1, 'Preço mensal é obrigatório'),
  yearlyPrice: z.string().optional(),
  features: z.string().min(1, 'Características são obrigatórias'),
  maxContacts: z.string().optional(),
  maxPhotos: z.string().optional(),
  priority: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  pagarmeProductId: z.string().optional(),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function AdminPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Set authorization header for all requests
  const authHeaders = {
    "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
  };

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['/api/admin/plans'],
    queryFn: async () => {
      const response = await fetch('/api/admin/plans', {
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const planData = {
        ...data,
        monthlyPrice: parseFloat(data.monthlyPrice),
        yearlyPrice: data.yearlyPrice ? parseFloat(data.yearlyPrice) : null,
        features: data.features.split('\n').filter(f => f.trim()),
        maxContacts: data.maxContacts ? parseInt(data.maxContacts) : null,
        maxPhotos: data.maxPhotos ? parseInt(data.maxPhotos) : 5,
        priority: data.priority ? parseInt(data.priority) : 0,
      };
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(planData),
      });
      if (!response.ok) {
        throw new Error('Failed to create plan');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setIsCreateOpen(false);
      toast({
        title: 'Plano criado!',
        description: 'O plano foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar plano',
        description: error instanceof Error ? error.message : 'Erro inesperado',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PlanFormData & { id: string }) => {
      const planData = {
        ...data,
        monthlyPrice: parseFloat(data.monthlyPrice),
        yearlyPrice: data.yearlyPrice ? parseFloat(data.yearlyPrice) : null,
        features: data.features.split('\n').filter(f => f.trim()),
        maxContacts: data.maxContacts ? parseInt(data.maxContacts) : null,
        maxPhotos: data.maxPhotos ? parseInt(data.maxPhotos) : 5,
        priority: data.priority ? parseInt(data.priority) : 0,
      };
      const response = await fetch(`/api/admin/plans/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(planData),
      });
      if (!response.ok) {
        throw new Error('Failed to update plan');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setEditingPlan(null);
      toast({
        title: 'Plano atualizado!',
        description: 'O plano foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar plano',
        description: error instanceof Error ? error.message : 'Erro inesperado',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/plans/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      toast({
        title: 'Plano removido!',
        description: 'O plano foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover plano',
        description: error instanceof Error ? error.message : 'Erro inesperado',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      monthlyPrice: '',
      yearlyPrice: '',
      features: '',
      maxContacts: '',
      maxPhotos: '5',
      priority: '0',
      isActive: true,
      pagarmeProductId: '',
    },
  });

  React.useEffect(() => {
    if (editingPlan) {
      form.reset({
        name: editingPlan.name,
        description: editingPlan.description || '',
        monthlyPrice: editingPlan.monthlyPrice?.toString() || '',
        yearlyPrice: editingPlan.yearlyPrice?.toString() || '',
        features: Array.isArray(editingPlan.features) ? editingPlan.features.join('\n') : '',
        maxContacts: editingPlan.maxContacts?.toString() || '',
        maxPhotos: editingPlan.maxPhotos?.toString() || '5',
        priority: editingPlan.priority?.toString() || '0',
        isActive: editingPlan.isActive ?? true,
        isFeatured: editingPlan.isFeatured ?? false,
        pagarmeProductId: editingPlan.pagarmeProductId || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        monthlyPrice: '',
        yearlyPrice: '',
        features: '',
        maxContacts: '',
        maxPhotos: '5',
        priority: '0',
        isActive: true,
        isFeatured: false,
        pagarmeProductId: '',
      });
    }
  }, [editingPlan, form]);

  const onSubmit = (data: PlanFormData) => {
    if (editingPlan) {
      updateMutation.mutate({ ...data, id: editingPlan.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este plano?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSyncPagarme = async (planId: string) => {
    try {
      const response = await fetch(`/api/admin/plans/${planId}/sync-pagarme`, {
        method: 'POST',
        headers: authHeaders,
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync with Pagar.me');
      }
      
      const result = await response.json();
      console.log('RESULTADO COMPLETO:', JSON.stringify(result, null, 2));
      
      const planName = result.planName || result.name || 'desconhecido';
      const pagarmeId = result.pagarmeId || result.id || 'indefinido';
      
      toast({
        title: 'Sincronização realizada!',
        description: `Plano "${planName}" sincronizado com Pagar.me (ID: ${pagarmeId})`,
      });
      
      // Recarregar a lista de planos
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
    } catch (error) {
      toast({
        title: 'Erro na sincronização',
        description: error instanceof Error ? error.message : 'Erro inesperado',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Gerenciar Planos">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gerenciar Planos">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
              Gerenciar Planos
            </h1>
            <p className="text-muted-foreground" data-testid="page-subtitle">
              Configure planos de assinatura para profissionais
            </p>
          </div>

          <Dialog open={isCreateOpen || !!editingPlan} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingPlan(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-plan">
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle data-testid="dialog-title">
                  {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="plan-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Plano *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Básico, Premium, Profissional" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} data-testid="input-priority" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descrição do plano..." {...field} data-testid="textarea-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="monthlyPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Mensal (R$) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="29.90" {...field} data-testid="input-monthly-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="yearlyPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Anual (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="299.00" {...field} data-testid="input-yearly-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxContacts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máximo de Contatos</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Deixe vazio para ilimitado" {...field} data-testid="input-max-contacts" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxPhotos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máximo de Fotos</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5" {...field} data-testid="input-max-photos" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Características (uma por linha) *</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={5}
                            placeholder="Perfil profissional completo&#10;Até 5 fotos no portfólio&#10;Contatos por WhatsApp&#10;Suporte por email"
                            {...field} 
                            data-testid="textarea-features"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pagarmeProductId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do Produto no Pagar.me</FormLabel>
                        <FormControl>
                          <Input placeholder="Será preenchido automaticamente" {...field} data-testid="input-pagarme-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Plano Ativo</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Permite que profissionais selecionem este plano
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Plano em Destaque</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Marca como "Mais Popular" na página de seleção
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-featured"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setEditingPlan(null);
                      }}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save"
                    >
                      {editingPlan ? 'Atualizar' : 'Criar'} Plano
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan: any) => (
            <Card key={plan.id} className="relative" data-testid={`card-plan-${plan.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {plan.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    {plan.isActive ? (
                      <Badge variant="default">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                    {plan.isFeatured && (
                      <Badge variant="outline" className="border-[#3C8BAB] text-[#3C8BAB]">
                        Em Destaque
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      R$ {parseFloat(plan.monthlyPrice || 0).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  
                  {plan.yearlyPrice && (
                    <div className="text-sm text-muted-foreground">
                      Anual: R$ {parseFloat(plan.yearlyPrice).toFixed(2)}
                    </div>
                  )}

                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Características:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {plan.features.slice(0, 3).map((feature: string, index: number) => (
                          <li key={index}>• {feature}</li>
                        ))}
                        {plan.features.length > 3 && (
                          <li>• +{plan.features.length - 3} mais...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    {plan.pagarmeProductId ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Sincronizado com Pagar.me
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Não sincronizado
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-2 pt-2">
                      {!plan.pagarmeProductId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncPagarme(plan.id)}
                          data-testid={`button-sync-${plan.id}`}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Sincronizar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPlan(plan)}
                        data-testid={`button-edit-${plan.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(plan.id)}
                        data-testid={`button-delete-${plan.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {plans.length === 0 && (
          <Card className="text-center py-12" data-testid="empty-state">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum plano cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro plano de assinatura para profissionais.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}