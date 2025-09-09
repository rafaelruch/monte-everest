import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Payment } from "@shared/schema";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Building2,
  Receipt,
  RefreshCw,
  Activity
} from "lucide-react";
import { Link } from "wouter";

const paymentSchema = z.object({
  professionalId: z.string().min(1, "Profissional é obrigatório"),
  planId: z.string().optional(),
  amount: z.string().min(1, "Valor é obrigatório"),
  currency: z.string().default("BRL"),
  status: z.string().default("pending"),
  paymentMethod: z.string().default("credit_card"),
  transactionId: z.string().optional(),
  pagarmeSubscriptionId: z.string().optional(),
  cardToken: z.string().optional(),
  dueDate: z.string().optional(),
  paidAt: z.string().optional()
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  refunded: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
};

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  paid: <CheckCircle className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
  canceled: <AlertCircle className="h-4 w-4" />,
  refunded: <Receipt className="h-4 w-4" />
};

const StatusBadge = ({ status }: { status: string }) => (
  <Badge className={`inline-flex items-center gap-1 ${statusColors[status as keyof typeof statusColors] || statusColors.pending}`}>
    {statusIcons[status as keyof typeof statusIcons] || statusIcons.pending}
    {status === 'pending' && 'Pendente'}
    {status === 'paid' && 'Pago'}
    {status === 'failed' && 'Falhou'}
    {status === 'canceled' && 'Cancelado'}
    {status === 'refunded' && 'Reembolsado'}
  </Badge>
);

export default function AdminPayments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/payments"],
  });

  const { data: professionals = [] } = useQuery<any[]>({
    queryKey: ["/api/professionals/search"],
  });

  const { data: plans = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      currency: "BRL",
      status: "pending",
      paymentMethod: "credit_card",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PaymentFormData) => 
      apiRequest("POST", "/api/admin/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Pagamento criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pagamento",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentFormData> }) =>
      apiRequest("PUT", `/api/admin/payments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      setIsDialogOpen(false);
      setEditingPayment(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar pagamento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      toast({
        title: "Sucesso",
        description: "Pagamento removido com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover pagamento",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/payments/${id}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      toast({
        title: "Sucesso",
        description: "Pagamento sincronizado com Pagar.me",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao sincronizar pagamento",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PaymentFormData) => {
    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    form.reset({
      professionalId: payment.professionalId,
      planId: payment.planId || undefined,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod || "credit_card",
      transactionId: payment.transactionId || undefined,
      pagarmeSubscriptionId: payment.pagarmeSubscriptionId || "",
      cardToken: payment.cardToken || "",
      dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : undefined,
      paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : undefined
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSync = (id: string) => {
    syncMutation.mutate(id);
  };

  const openCreateDialog = () => {
    setEditingPayment(null);
    form.reset({
      currency: "BRL",
      status: "pending",
      paymentMethod: "credit_card",
    });
    setIsDialogOpen(true);
  };

  const filteredPayments = payments.filter((payment: any) =>
    payment.professionalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.professionalEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary stats (values already in reais from database)
  const totalAmount = payments.reduce((sum: number, payment: any) => 
    sum + parseFloat(payment.amount), 0
  );
  const paidAmount = payments.filter((p: any) => p.status === 'paid')
    .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0);
  const pendingAmount = payments.filter((p: any) => p.status === 'pending')
    .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" data-testid="link-admin-back">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
            <p className="text-muted-foreground">
              Gerencie transações e relatórios financeiros
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-create-payment">
          <Plus className="h-4 w-4 mr-2" />
          Novo Pagamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-amount">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.length} transações
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-paid-amount">
              {formatCurrency(paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p: any) => p.status === 'paid').length} pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-amount">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p: any) => p.status === 'pending').length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">
              {payments.length > 0 ? Math.round((payments.filter((p: any) => p.status === 'paid').length / payments.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de sucesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Buscar Pagamentos
          </CardTitle>
          <CardDescription>
            Pagamentos são sincronizados automaticamente com o Pagar.me via webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por profissional, email, ID da transação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="input-search-payments"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] })}
              title="Atualizar lista"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pagamentos</CardTitle>
          <CardDescription>
            {filteredPayments.length} pagamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Carregando...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        Nenhum pagamento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment: any) => (
                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {payment.professionalName || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payment.professionalEmail || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {payment.planName || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(parseFloat(payment.amount) / 100)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={payment.status} />
                        </TableCell>
                        <TableCell>
                          {payment.paymentMethod === 'credit_card' && 'Cartão de Crédito'}
                          {payment.paymentMethod === 'debit_card' && 'Cartão de Débito'}
                          {payment.paymentMethod === 'pix' && 'PIX'}
                          {payment.paymentMethod === 'boleto' && 'Boleto'}
                          {payment.paymentMethod && !['credit_card', 'debit_card', 'pix', 'boleto'].includes(payment.paymentMethod) && payment.paymentMethod}
                        </TableCell>
                        <TableCell>
                          {payment.dueDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.createdAt ? (
                            new Date(payment.createdAt).toLocaleDateString('pt-BR')
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(payment.pagarmeSubscriptionId || payment.transactionId) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSync(payment.id)}
                                disabled={syncMutation.isPending}
                                title="Sincronizar com Pagar.me"
                                data-testid={`button-sync-payment-${payment.id}`}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(payment)}
                              data-testid={`button-edit-payment-${payment.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-delete-payment-${payment.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(payment.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? "Editar Pagamento" : "Novo Pagamento"}
            </DialogTitle>
            <DialogDescription>
              {editingPayment 
                ? "Atualize as informações do pagamento" 
                : "Registre um novo pagamento no sistema"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="professionalId">Profissional *</Label>
                <Select
                  value={form.watch("professionalId")}
                  onValueChange={(value) => form.setValue("professionalId", value)}
                >
                  <SelectTrigger data-testid="select-professional">
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((professional: any) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.fullName} - {professional.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.professionalId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.professionalId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="planId">Plano</Label>
                <Select
                  value={form.watch("planId")}
                  onValueChange={(value) => form.setValue("planId", value)}
                >
                  <SelectTrigger data-testid="select-plan">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(parseFloat(plan.monthlyPrice || "0"))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("amount")}
                  data-testid="input-amount"
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select
                  value={form.watch("currency")}
                  onValueChange={(value) => form.setValue("currency", value)}
                >
                  <SelectTrigger data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL (Real)</SelectItem>
                    <SelectItem value="USD">USD (Dólar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value)}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                <Select
                  value={form.watch("paymentMethod")}
                  onValueChange={(value) => form.setValue("paymentMethod", value)}
                >
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register("dueDate")}
                  data-testid="input-due-date"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transactionId">ID da Transação</Label>
                <Input
                  id="transactionId"
                  placeholder="ID único da transação"
                  {...form.register("transactionId")}
                  data-testid="input-transaction-id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pagarmeSubscriptionId">ID da Assinatura Pagar.me</Label>
                <Input
                  id="pagarmeSubscriptionId"
                  placeholder="ID da assinatura no Pagar.me"
                  {...form.register("pagarmeSubscriptionId")}
                  data-testid="input-pagarme-subscription-id"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel-payment"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-payment"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingPayment
                  ? "Atualizar"
                  : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}