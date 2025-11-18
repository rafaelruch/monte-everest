import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency } from "@/lib/utils";
import { 
  Users, 
  DollarSign, 
  Star, 
  TrendingUp, 
  LogOut, 
  User, 
  CreditCard, 
  BarChart3,
  List,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  LayoutDashboard,
  FolderOpen,
  Package,
  Settings,
  Menu,
  ChevronRight,
  Activity,
  FileText,
  Home,
  UserCheck,
  Edit,
  X,
  Smartphone,
  Monitor,
  PieChart,
  Check,
  Key,
  Shield,
  AlertCircle,
  LineChart,
  Plus,
  Trash2,
  Search,
  Filter,
  Loader2,
  MessageSquare,
  Download,
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Leaf,
  Hammer,
  Scissors,
  Laptop,
  Car,
  Book,
  Music,
  Camera,
  Scale,
  Calculator,
  Palette,
  Utensils,
  RefreshCw,
  Shirt,
  Baby,
  Briefcase,
  Dumbbell,
  Heart,
  GraduationCap,
  Stethoscope,
  Grid3X3
} from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, AreaChart, Area, Pie } from 'recharts';
import { MobileCard, MobileStatsCard, MobileListItem } from "@/components/ui/mobile-card";
import { MobileHeader, MobileTabBar, MobileActionButton } from "@/components/ui/mobile-navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Professional, Payment } from "@shared/schema";
import IconSelector from "@/components/icon-selector";
import { NotificationBell } from "@/components/NotificationBell";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Schema para planos de assinatura
const planSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  monthlyPrice: z.string().min(1, "Preço mensal é obrigatório"),
  yearlyPrice: z.string().optional(),
  features: z.array(z.string()).default([]),
  maxContacts: z.string().optional(),
  maxPhotos: z.number().min(1).default(5),
  priority: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

type PlanFormData = z.infer<typeof planSchema>;

// Schema para páginas
const pageSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  isActive: z.boolean().default(true),
  showInFooter: z.boolean().default(true),
  sortOrder: z.number().min(0).default(0),
});

type PageFormData = z.infer<typeof pageSchema>;

const changeAdminPasswordSchema = z.object({
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type ChangeAdminPasswordData = z.infer<typeof changeAdminPasswordSchema>;

// Ícones disponíveis para as categorias (substituído pelo IconSelector com Font Awesome)
// const availableIcons = []; // Removido - usando IconSelector agora

// Centralized Brazilian currency formatter
const formatBRL = (centavos: number) => 
  new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(centavos / 100);

const sidebarItems: SidebarItem[] = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "professionals", label: "Profissionais", icon: Users },
  { id: "payments", label: "Pagamentos", icon: CreditCard },
  { id: "categories", label: "Categorias", icon: FolderOpen },
  { id: "reviews", label: "Avaliações", icon: MessageSquare },
  { id: "pages", label: "Páginas", icon: FileText },
  { id: "plans", label: "Planos", icon: Package },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "settings", label: "Configurações", icon: Settings },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ email: '', password: '', fullName: '' });
  const [isMobile, setIsMobile] = useState(false);
  
  // Estados para paginação e busca
  const [professionalsPage, setProfessionalsPage] = useState(1);
  const [professionalsSearch, setProfessionalsSearch] = useState('');
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  
  // Estados para categorias
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  // Estados para planos
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  
  // Estados para páginas
  const [pageSearchTerm, setPageSearchTerm] = useState("");
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  
  // Estados para avaliações
  const [reviewSearchTerm, setReviewSearchTerm] = useState("");
  const [reviewFilterStatus, setReviewFilterStatus] = useState<"all" | "verified" | "unverified">("all");

  // Estados para configurações do Pagar.me
  const [pagarmeApiKey, setPagarmeApiKey] = useState("");
  const [pagarmeAccountId, setPagarmeAccountId] = useState("");
  const [pagarmePublicKey, setPagarmePublicKey] = useState("");
  const [isEditingPagarmeConfig, setIsEditingPagarmeConfig] = useState(false);
  
  // Estado para modal de alteração de senha
  const [changePasswordModal, setChangePasswordModal] = useState<{
    open: boolean;
    professionalId: string | null;
    professionalName: string;
  }>({
    open: false,
    professionalId: null,
    professionalName: '',
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Estado para modal de alteração de senha de admin
  const [changeAdminPasswordModal, setChangeAdminPasswordModal] = useState<{
    open: boolean;
    adminId: string | null;
    adminName: string;
  }>({ open: false, adminId: null, adminName: '' });
  
  const itemsPerPage = 20;

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/entrar");
    }
  }, [setLocation]);

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Set authorization header for all requests
  const authHeaders = {
    "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/stats", {
        headers: authHeaders,
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("adminToken");
          setLocation("/entrar");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    },
  });

  const { data: professionals = [], isLoading: professionalsLoading } = useQuery({
    queryKey: ["/api/admin/professionals"],
    queryFn: async () => {
      const response = await fetch("/api/admin/professionals", {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch professionals");
      return response.json();
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/admin/payments"],
    queryFn: async () => {
      const response = await fetch("/api/admin/payments", {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
  });

  // Query para buscar pedidos do Pagar.me
  const { data: pagarmeOrders, isLoading: pagarmeOrdersLoading, refetch: refetchPagarmeOrders } = useQuery({
    queryKey: ["/api/admin/pagarme/orders"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pagarme/orders?page=1&size=100", {
        headers: authHeaders,
      });
      if (!response.ok) {
        console.error("Failed to fetch Pagar.me orders");
        return { data: [], paging: { total: 0 } };
      }
      return response.json();
    },
    retry: 1,
    enabled: true, // Always try to fetch
  });

  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["/api/admin/pages"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pages", {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch pages");
      return response.json();
    },
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/plans"],
    queryFn: async () => {
      const response = await fetch("/api/admin/plans", {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json();
    },
  });

  const { data: admins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch admins");
      return response.json();
    },
  });

  // Query para configurações do Pagar.me
  const { data: pagarmeConfig, isLoading: pagarmeConfigLoading } = useQuery({
    queryKey: ["/api/admin/configs/pagarme"],
    queryFn: async () => {
      try {
        const [apiKeyResponse, accountIdResponse, publicKeyResponse] = await Promise.all([
          fetch("/api/admin/configs/PAGARME_API_KEY", {
            headers: authHeaders,
          }),
          fetch("/api/admin/configs/PAGARME_ACCOUNT_ID", {
            headers: authHeaders,
          }),
          fetch("/api/admin/configs/PAGARME_PUBLIC_KEY", {
            headers: authHeaders,
          })
        ]);

        const apiKey = apiKeyResponse.ok ? await apiKeyResponse.json() : null;
        const accountId = accountIdResponse.ok ? await accountIdResponse.json() : null;
        const publicKey = publicKeyResponse.ok ? await publicKeyResponse.json() : null;

        return {
          apiKey: apiKey?.value || "",
          accountId: accountId?.value || "",
          publicKey: publicKey?.value || "",
        };
      } catch (error) {
        return {
          apiKey: "",
          accountId: "",
          publicKey: "",
        };
      }
    },
  });

  // Initialize Pagar.me config when data loads
  useEffect(() => {
    if (pagarmeConfig) {
      setPagarmeApiKey(pagarmeConfig.apiKey);
      setPagarmeAccountId(pagarmeConfig.accountId);
      setPagarmePublicKey(pagarmeConfig.publicKey);
    }
  }, [pagarmeConfig]);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/categories", {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/admin/reviews"],
    queryFn: async () => {
      const response = await fetch("/api/admin/reviews", {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
  });

  // Get admin notifications (recent contacts and reviews)
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/admin/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/admin/notifications", {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "",
      isActive: true,
      isPopular: false,
    },
  });

  const planForm = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      monthlyPrice: "",
      yearlyPrice: "",
      features: [],
      maxContacts: "",
      maxPhotos: 5,
      priority: 0,
      isActive: true,
      isFeatured: false,
    },
  });

  const pageForm = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      metaDescription: "",
      isActive: true,
    },
  });

  const adminPasswordForm = useForm<ChangeAdminPasswordData>({
    resolver: zodResolver(changeAdminPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return apiRequest("POST", "/api/admin/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { id: string }) => {
      const { id, ...updateData } = data;
      return apiRequest("PUT", `/api/admin/categories/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return apiRequest("DELETE", `/api/admin/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: "Sucesso",
        description: "Categoria removida com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteProfessionalMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      return apiRequest("DELETE", `/api/admin/professionals/${professionalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
      toast({
        title: "Sucesso",
        description: "Profissional excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir profissional. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const seedCategoriesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/categories/seed", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: "Sucesso",
        description: data.message || "Categorias populares inseridas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao inserir categorias. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const markPopularMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/categories/mark-popular", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: "Sucesso",
        description: data.message || "Categorias marcadas como populares!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao marcar categorias populares. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateProfessionalStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/professionals/${id}/status`, {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      toast({ title: "Status atualizado com sucesso!" });
    },
  });

  const syncPaymentMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      return apiRequest("POST", `/api/payments/sync/${professionalId}`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      
      if (data.synchronized) {
        toast({
          title: "Sincronização concluída!",
          description: `Profissional ativado com sucesso. Pedido: ${data.orderId}`,
        });
      } else if (data.alreadyActive) {
        toast({
          title: "Profissional já ativo",
          description: "Este profissional já está com status ativo.",
        });
      } else {
        toast({
          title: "Nenhum pagamento encontrado",
          description: data.message || "Não foi encontrado nenhum pagamento confirmado na Pagar.me.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao sincronizar",
        description: error.message || "Erro ao sincronizar pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const changeProfessionalPasswordMutation = useMutation({
    mutationFn: async ({ professionalId, newPassword }: { professionalId: string; newPassword: string }) => {
      const response = await fetch(`/api/admin/professionals/${professionalId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao alterar senha");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Senha alterada!", 
        description: "A senha do profissional foi redefinida com sucesso." 
      });
      setChangePasswordModal({ open: false, professionalId: null, professionalName: '' });
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch(`/api/admin/plans/${planId}/sync-pagarme`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao sincronizar plano");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "Plano sincronizado com Pagar.me com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro na sincronização", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error("Erro ao deletar plano");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "Plano removido com sucesso!" });
    },
  });

  const editPlanMutation = useMutation({
    mutationFn: async ({ id, planData }: { id: string; planData: any }) => {
      const response = await fetch(`/api/admin/plans/${id}`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      });
      if (!response.ok) {
        throw new Error("Erro ao editar plano");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "Plano atualizado com sucesso!" });
      setIsEditModalOpen(false);
      setEditingPlan(null);
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      return apiRequest("POST", "/api/admin/plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setIsPlanDialogOpen(false);
      planForm.reset();
      toast({
        title: "Sucesso",
        description: "Plano criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para salvar configurações do Pagar.me
  const savePagarmeConfigMutation = useMutation({
    mutationFn: async (config: { apiKey: string; accountId: string; publicKey: string }) => {
      const promises = [];
      
      if (config.apiKey) {
        promises.push(
          apiRequest("POST", "/api/admin/configs", {
            key: "PAGARME_API_KEY",
            value: config.apiKey,
            description: "Chave API do Pagar.me",
            isSecret: true,
          })
        );
      }
      
      if (config.accountId) {
        promises.push(
          apiRequest("POST", "/api/admin/configs", {
            key: "PAGARME_ACCOUNT_ID", 
            value: config.accountId,
            description: "ID da conta do Pagar.me",
            isSecret: false,
          })
        );
      }
      
      if (config.publicKey) {
        promises.push(
          apiRequest("POST", "/api/admin/configs", {
            key: "PAGARME_PUBLIC_KEY", 
            value: config.publicKey,
            description: "Chave pública do Pagar.me",
            isSecret: false,
          })
        );
      }
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configs/pagarme"] });
      setIsEditingPagarmeConfig(false);
      toast({
        title: "Sucesso",
        description: "Configurações do Pagar.me salvas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (data: PlanFormData & { id: string }) => {
      const { id, ...planData } = data;
      return apiRequest("PUT", `/api/admin/plans/${id}`, planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setIsPlanDialogOpen(false);
      setEditingPlan(null);
      planForm.reset();
      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/entrar");
  };

  const openEditPlanModal = (plan: any) => {
    setEditingPlan({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      maxContacts: plan.maxContacts || '',
      maxPhotos: plan.maxPhotos || '',
      priority: plan.priority || 1,
      isActive: plan.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleEditPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    const planData = {
      name: editingPlan.name,
      description: editingPlan.description,
      monthlyPrice: editingPlan.monthlyPrice,
      maxContacts: editingPlan.maxContacts ? parseInt(editingPlan.maxContacts) : null,
      maxPhotos: editingPlan.maxPhotos ? parseInt(editingPlan.maxPhotos) : null,
      priority: parseInt(editingPlan.priority),
      isActive: editingPlan.isActive
    };
    
    editPlanMutation.mutate({ id: editingPlan.id, planData });
  };

  // Page form handlers
  const handleCreatePage = () => {
    setEditingPage(null);
    pageForm.reset();
    setIsPageDialogOpen(true);
  };

  const handleEditPage = (page: any) => {
    setEditingPage(page);
    pageForm.reset({
      title: page.title,
      slug: page.slug,
      content: page.content,
      metaDescription: page.metaDescription || "",
      isActive: page.isActive,
    });
    setIsPageDialogOpen(true);
  };

  const handlePageSubmit = (data: PageFormData) => {
    if (editingPage) {
      updatePageMutation.mutate({ id: editingPage.id, ...data });
    } else {
      createPageMutation.mutate(data);
    }
  };

  const addAdminMutation = useMutation({
    mutationFn: async (adminData: { email: string; password: string; fullName: string }) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminData),
      });
      if (!response.ok) {
        throw new Error("Erro ao criar administrador");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Administrador criado com sucesso!" });
      setIsAddAdminModalOpen(false);
      setNewAdminData({ email: '', password: '', fullName: '' });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error("Erro ao remover administrador");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Administrador removido com sucesso!" });
    },
  });

  const changeAdminPasswordMutation = useMutation({
    mutationFn: async ({ adminId, newPassword }: { adminId: string; newPassword: string }) => {
      const response = await fetch(`/api/admin/users/${adminId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao alterar senha");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada!",
        description: "A senha do administrador foi redefinida com sucesso.",
      });
      setChangeAdminPasswordModal({ open: false, adminId: null, adminName: '' });
      adminPasswordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Page mutations
  const createPageMutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      return apiRequest("POST", "/api/admin/pages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      setIsPageDialogOpen(false);
      setEditingPage(null);
      toast({
        title: "Sucesso",
        description: "Página criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar página. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async (data: PageFormData & { id: string }) => {
      const { id, ...pageData } = data;
      return apiRequest("PUT", `/api/admin/pages/${id}`, pageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      setIsPageDialogOpen(false);
      setEditingPage(null);
      toast({
        title: "Sucesso",
        description: "Página atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar página. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({
        title: "Sucesso",
        description: "Página removida com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover página. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateReviewVerificationMutation = useMutation({
    mutationFn: async ({ reviewId, isVerified }: { reviewId: string; isVerified: boolean }) => {
      return apiRequest("PATCH", `/api/admin/reviews/${reviewId}/verification`, { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({
        title: "Sucesso",
        description: "Status de verificação atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar verificação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminData.email || !newAdminData.password || !newAdminData.fullName) {
      toast({ title: "Por favor, preencha todos os campos", variant: "destructive" });
      return;
    }
    addAdminMutation.mutate(newAdminData);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Ativo", variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" },
      inactive: { label: "Inativo", variant: "secondary" as const, icon: XCircle, className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200" },
      pending: { label: "Pendente", variant: "outline" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={cn("gap-1", config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Ativo", variant: "default" as const },
      pending: { label: "Pendente", variant: "outline" as const },
      failed: { label: "Falhou", variant: "destructive" as const },
      canceled: { label: "Cancelado", variant: "secondary" as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-1">Bem-vindo de volta! Aqui está o resumo da plataforma.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Profissionais Ativos</CardTitle>
            <Users className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {professionals.filter((p: Professional) => p.status === 'active').length}
            </div>
            <p className="text-xs opacity-90">
              de {professionals.length} cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBRL(currentMonthRevenue * 100)}
            </div>
            <p className="text-xs opacity-90">
              {payments.filter((p: Payment) => p.status === 'active' || p.status === 'paid').length} pagamentos ativos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs opacity-90">
              Taxa de conversão para pagantes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBRL(averageTicket * 100)}
            </div>
            <p className="text-xs opacity-90">
              Valor médio por assinante ativo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#3C8BAB]" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {professionals
                .sort((a: Professional, b: Professional) => 
                  new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
                )
                .slice(0, 5)
                .map((prof: Professional) => (
                <div key={prof.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-[#3C8BAB] text-white flex items-center justify-center font-semibold">
                    {prof.fullName?.charAt(0) || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{prof.fullName}</p>
                    <p className="text-sm text-gray-500 truncate">{prof.email}</p>
                    <p className="text-xs text-gray-400">
                      {prof.createdAt ? new Date(prof.createdAt).toLocaleDateString('pt-BR') : 'Data não informada'}
                    </p>
                  </div>
                  {getStatusBadge(prof.status)}
                </div>
              ))}
              {professionals.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhum profissional cadastrado ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#3C8BAB]" />
              Pagamentos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments
                .sort((a: Payment, b: Payment) => 
                  new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
                )
                .slice(0, 5)
                .map((payment: Payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payment.status === 'active' || payment.status === 'paid' 
                        ? 'bg-green-100 text-green-600' 
                        : payment.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{formatCurrency(parseFloat(payment.amount))}</p>
                      <p className="text-sm text-gray-500">ID: {payment.professionalId?.slice(0, 8)}</p>
                      <p className="text-xs text-gray-400">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('pt-BR') : 'Data não informada'}
                      </p>
                    </div>
                  </div>
                  {getPaymentStatusBadge(payment.status)}
                </div>
              ))}
              {payments.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhum pagamento registrado ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProfessionals = () => {
    const paginatedProfessionals = getPaginatedProfessionals();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Profissionais</h1>
            <p className="text-gray-600 mt-1">Controle o status e visualize informações dos profissionais cadastrados.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#3C8BAB]" />
                Lista de Profissionais
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar por nome, email, telefone ou ID..."
                  value={professionalsSearch}
                  onChange={(e) => {
                    setProfessionalsSearch(e.target.value);
                    setProfessionalsPage(1);
                  }}
                  className="w-80"
                />
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {paginatedProfessionals.total} profissionais
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {professionalsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C8BAB]"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {paginatedProfessionals.data.map((professional: Professional) => (
                        <TableRow key={professional.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#3C8BAB] text-white flex items-center justify-center font-semibold text-sm">
                                {professional.fullName?.charAt(0) || 'P'}
                              </div>
                              <div>
                                <div className="font-medium">{professional.fullName}</div>
                                <div className="text-sm text-gray-500">ID: {professional.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{professional.email}</TableCell>
                          <TableCell>{professional.phone || "Não informado"}</TableCell>
                          <TableCell>{getStatusBadge(professional.status)}</TableCell>
                          <TableCell>{getPaymentStatusBadge(professional.paymentStatus || "pending")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={professional.status}
                                onValueChange={(value) =>
                                  updateProfessionalStatusMutation.mutate({
                                    id: professional.id,
                                    status: value,
                                  })
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Ativar</SelectItem>
                                  <SelectItem value="inactive">Desativar</SelectItem>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {(professional.status === 'pending' || professional.status === 'pending_payment' || professional.paymentStatus === 'pending' || professional.paymentStatus === 'pending_payment') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => syncPaymentMutation.mutate(professional.id)}
                                  disabled={syncPaymentMutation.isPending}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                  data-testid={`button-sync-payment-${professional.id}`}
                                  title="Sincronizar pagamento com Pagar.me"
                                >
                                  {syncPaymentMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setChangePasswordModal({
                                  open: true,
                                  professionalId: professional.id,
                                  professionalName: professional.fullName
                                })}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                data-testid={`button-change-password-${professional.id}`}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja excluir o profissional "${professional.fullName}"? Esta ação não pode ser desfeita.`)) {
                                    deleteProfessionalMutation.mutate(professional.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                disabled={deleteProfessionalMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação para Profissionais */}
                  {paginatedProfessionals.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Mostrando {((professionalsPage - 1) * itemsPerPage) + 1} a {Math.min(professionalsPage * itemsPerPage, paginatedProfessionals.total)} de {paginatedProfessionals.total} profissionais
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProfessionalsPage(professionalsPage - 1)}
                          disabled={professionalsPage <= 1}
                        >
                          Anterior
                        </Button>
                        <div className="text-sm">
                          Página {professionalsPage} de {paginatedProfessionals.totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProfessionalsPage(professionalsPage + 1)}
                          disabled={professionalsPage >= paginatedProfessionals.totalPages}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Modal de Alteração de Senha */}
          <Dialog open={changePasswordModal.open} onOpenChange={(open) => {
            if (!open) {
              setChangePasswordModal({ open: false, professionalId: null, professionalName: '' });
              setNewPassword("");
              setConfirmPassword("");
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha do Profissional</DialogTitle>
                <DialogDescription>
                  Definir nova senha para <strong>{changePasswordModal.professionalName}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-sm text-red-600">A senha deve ter no mínimo 6 caracteres</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-sm text-red-600">As senhas não coincidem</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setChangePasswordModal({ open: false, professionalId: null, professionalName: '' });
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  data-testid="button-cancel-password-change"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (newPassword.length < 6) {
                      toast({
                        title: "Erro de validação",
                        description: "A senha deve ter no mínimo 6 caracteres",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      toast({
                        title: "Erro de validação",
                        description: "As senhas não coincidem",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (changePasswordModal.professionalId) {
                      changeProfessionalPasswordMutation.mutate({
                        professionalId: changePasswordModal.professionalId,
                        newPassword,
                      });
                    }
                  }}
                  disabled={
                    changeProfessionalPasswordMutation.isPending ||
                    newPassword.length < 6 ||
                    newPassword !== confirmPassword
                  }
                  data-testid="button-save-password-change"
                >
                  {changeProfessionalPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    };

  // Cálculos adicionais para relatórios
  const currentDate = new Date();
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

  const currentMonthPayments = payments.filter((p: Payment) => {
    const paymentDate = new Date(p.createdAt || '');
    return paymentDate >= currentMonthStart && (p.status === 'active' || p.status === 'paid');
  });

  const lastMonthPayments = payments.filter((p: Payment) => {
    const paymentDate = new Date(p.createdAt || '');
    return paymentDate >= lastMonthStart && paymentDate <= lastMonthEnd && (p.status === 'active' || p.status === 'paid');
  });

  const currentMonthRevenue = currentMonthPayments.reduce((sum: number, p: Payment) => sum + (parseFloat(p.amount) || 0), 0) / 100;
  const lastMonthRevenue = lastMonthPayments.reduce((sum: number, p: Payment) => sum + (parseFloat(p.amount) || 0), 0) / 100;
  const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

  const activePayments = payments.filter((p: Payment) => p.status === 'active');
  const monthlyRecurringRevenue = activePayments.reduce((sum: number, p: Payment) => sum + (parseFloat(p.amount) || 0), 0) / 100;
  const projectedAnnualRevenue = monthlyRecurringRevenue * 12;

  const validPayments = payments.filter((p: Payment) => p.status === 'paid' || p.status === 'active');
  const averageTicket = validPayments.length > 0 ? 
    validPayments.reduce((sum: number, p: Payment) => sum + (parseFloat(p.amount) || 0), 0) / 100 / validPayments.length : 0;

  const conversionRate = professionals.length > 0 ? 
    (activePayments.length / professionals.length * 100) : 0;

  // Funções para filtrar e paginar dados
  const getFilteredProfessionals = () => {
    return professionals.filter((professional: Professional) => {
      const searchTerm = professionalsSearch.toLowerCase();
      return (
        professional.fullName?.toLowerCase().includes(searchTerm) ||
        professional.email?.toLowerCase().includes(searchTerm) ||
        professional.phone?.toLowerCase().includes(searchTerm) ||
        professional.id?.toLowerCase().includes(searchTerm)
      );
    });
  };

  const getPaginatedProfessionals = () => {
    const filtered = getFilteredProfessionals();
    const startIndex = (professionalsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  };

  const getFilteredPayments = () => {
    return payments.filter((payment: Payment) => {
      const searchTerm = paymentsSearch.toLowerCase();
      return (
        payment.id?.toLowerCase().includes(searchTerm) ||
        payment.status?.toLowerCase().includes(searchTerm)
      );
    });
  };

  const getPaginatedPayments = () => {
    const filtered = getFilteredPayments();
    const startIndex = (paymentsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  };

  const renderPayments = () => {
    const paginatedPayments = getPaginatedPayments();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Histórico de Pagamentos</h1>
            <p className="text-gray-600 mt-1">Visualize e gerencie todos os pagamentos da plataforma.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#3C8BAB]" />
                Transações
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar por ID ou status..."
                  value={paymentsSearch}
                  onChange={(e) => {
                    setPaymentsSearch(e.target.value);
                    setPaymentsPage(1);
                  }}
                  className="w-64"
                />
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {paginatedPayments.total} pagamentos
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C8BAB]"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.data.map((payment: Payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">Profissional</div>
                            <div className="text-sm text-gray-500">ID: {payment.professionalId?.slice(0, 8)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Plano</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(parseFloat(payment.amount || '0'))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {payment.paymentMethod === 'credit_card' ? 'Cartão' : 'PIX'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.createdAt 
                            ? new Date(payment.createdAt).toLocaleDateString('pt-BR')
                            : "Não informado"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação para Pagamentos */}
                {paginatedPayments.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Mostrando {((paymentsPage - 1) * itemsPerPage) + 1} a {Math.min(paymentsPage * itemsPerPage, paginatedPayments.total)} de {paginatedPayments.total} pagamentos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentsPage(paymentsPage - 1)}
                        disabled={paymentsPage <= 1}
                      >
                        Anterior
                      </Button>
                      <div className="text-sm">
                        Página {paymentsPage} de {paginatedPayments.totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentsPage(paymentsPage + 1)}
                        disabled={paymentsPage >= paginatedPayments.totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pedidos do Pagar.me */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#3C8BAB]" />
                Pedidos Pagar.me
              </CardTitle>
              <Button 
                onClick={() => refetchPagarmeOrders()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pagarmeOrdersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C8BAB]"></div>
              </div>
            ) : pagarmeOrders?.data && pagarmeOrders.data.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-500 mb-4">
                  Total de {pagarmeOrders.paging?.total || pagarmeOrders.data.length} pedidos encontrados
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID do Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Cobranças</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagarmeOrders.data.slice(0, 20).map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{order.customer?.email || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency((order.amount || 0) / 100)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              order.status === 'paid' ? 'default' : 
                              order.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {order.status === 'paid' ? 'Pago' : 
                             order.status === 'pending' ? 'Pendente' : 
                             order.status === 'canceled' ? 'Cancelado' : 
                             order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.created_at 
                            ? new Date(order.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "N/A"
                          }
                        </TableCell>
                        <TableCell>
                          {order.charges && order.charges.length > 0 ? (
                            <div className="text-sm">
                              {order.charges.map((charge: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  {charge.payment_method === 'pix' ? '🔵 PIX' : '💳 Cartão'}
                                  {' - '}
                                  {charge.status === 'paid' ? '✅ Pago' : charge.status}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Sem cobranças</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum pedido encontrado no Pagar.me</p>
                <p className="text-sm mt-2">Os pedidos aparecerão aqui quando forem criados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderReports = () => {
    // Preparar dados para gráficos
    const revenueChartData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const monthPayments = payments.filter((p: Payment) => {
        const paymentDate = new Date(p.createdAt || '');
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear() &&
               (p.status === 'active' || p.status === 'paid');
      });
      const monthRevenue = monthPayments.reduce((sum: number, p: Payment) => sum + (parseFloat(p.amount) || 0), 0) / 100;
      
      return {
        name: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        receita: monthRevenue,
        assinantes: monthPayments.length,
      };
    });

    const statusChartData = [
      { name: 'Ativos', value: professionals.filter((p: Professional) => p.status === 'active').length, color: '#10B981' },
      { name: 'Pendentes', value: professionals.filter((p: Professional) => p.status === 'pending').length, color: '#F59E0B' },
      { name: 'Rejeitados', value: professionals.filter((p: Professional) => p.status === 'rejected').length, color: '#EF4444' },
    ];

    const plansChartData = plans.map((plan: any) => ({
      name: plan.name,
      assinantes: payments.filter((p: Payment) => p.planId === plan.id && (p.status === 'active' || p.status === 'paid')).length,
      receita: payments.filter((p: Payment) => p.planId === plan.id && (p.status === 'active' || p.status === 'paid'))
        .reduce((sum: number, p: Payment) => sum + (parseFloat(p.amount) || 0), 0) / 100,
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios e Análises</h1>
            <p className="text-gray-600 mt-1">Insights detalhados sobre o desempenho da plataforma.</p>
          </div>
        </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatBRL(currentMonthRevenue * 100)}
                </p>
                <p className={`text-sm ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {revenueGrowth >= 0 ? '↗' : '↘'} {Math.abs(revenueGrowth).toFixed(1)}% vs mês anterior
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">MRR (Receita Recorrente)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatBRL(monthlyRecurringRevenue * 100)}
                </p>
                <p className="text-sm text-gray-500">
                  {activePayments.length} assinantes ativos
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatBRL(averageTicket * 100)}
                </p>
                <p className="text-sm text-gray-500">
                  Por profissional/mês
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-orange-600">
                  {conversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  Profissionais pagantes
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Interativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receita Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-[#3C8BAB]" />
              Evolução da Receita (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  tickFormatter={(value) => formatBRL(value * 100)}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'receita' ? formatBRL(parseFloat(value) * 100) : value,
                    name === 'receita' ? 'Receita' : 'Assinantes'
                  ]}
                  labelStyle={{ color: '#333' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ccc', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#3C8BAB" 
                  fill="#3C8BAB" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Receita"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Status dos Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#3C8BAB]" />
              Status dos Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value, 'Quantidade']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ccc', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Performance dos Planos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#3C8BAB]" />
            Performance dos Planos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={plansChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={(value) => value.toString()}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={(value) => formatBRL(value * 100)}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'receita' ? formatBRL(parseFloat(value) * 100) : value,
                  name === 'receita' ? 'Receita Total' : 'Assinantes'
                ]}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #ccc', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="assinantes" 
                fill="#3C8BAB" 
                name="Assinantes"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right"
                dataKey="receita" 
                fill="#10B981" 
                name="Receita Total"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards de Análise Detalhada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#3C8BAB]" />
              Estatísticas Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <span className="text-gray-600">Total de Profissionais</span>
                <span className="font-bold text-blue-600">{professionals.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-gray-600">Profissionais Ativos</span>
                <span className="font-bold text-green-600">{stats?.activeProfessionals || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                <span className="text-gray-600">Total de Pagamentos</span>
                <span className="font-bold text-purple-600">{payments.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                <span className="text-gray-600">Receita Total</span>
                <span className="font-bold text-orange-600">
                  {formatBRL(
                    payments
                      .filter((p: Payment) => p.status === 'active' || p.status === 'paid')
                      .reduce((sum: number, p: Payment) => sum + (parseFloat(p.amount) || 0), 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#3C8BAB]" />
              Previsão de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-gray-600">Receita Anual Projetada</span>
                <span className="font-bold text-green-600">
                  {formatBRL(projectedAnnualRevenue * 100)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <span className="text-gray-600">Próximo Mês (estimativa)</span>
                <span className="font-bold text-blue-600">
                  {formatBRL(monthlyRecurringRevenue * 100)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                <span className="text-gray-600">Trimestre Atual</span>
                <span className="font-bold text-purple-600">
                  {formatBRL((monthlyRecurringRevenue * 3) * 100)}
                </span>
              </div>
              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                * Baseado na receita recorrente mensal atual
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#3C8BAB]" />
              Resumo por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-600">Ativos</span>
                </div>
                <span className="font-bold">
                  {professionals.filter((p: Professional) => p.status === 'active').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-gray-600">Pendentes</span>
                </div>
                <span className="font-bold">
                  {professionals.filter((p: Professional) => p.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-600">Inativos</span>
                </div>
                <span className="font-bold">
                  {professionals.filter((p: Professional) => p.status === 'inactive').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#3C8BAB]" />
              Performance dos Planos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plans.map((plan: any) => {
                const planPayments = payments.filter((p: Payment) => p.planId === plan.id && (p.status === 'active' || p.status === 'paid'));
                const planRevenue = planPayments.reduce((sum: number, p: Payment) => sum + (parseFloat(p.amount) || 0), 0) / 100;
                return (
                  <div key={plan.id} className="flex items-center justify-between p-2 border-l-4 border-[#3C8BAB] bg-gray-50">
                    <div>
                      <span className="font-medium text-sm">{plan.name}</span>
                      <p className="text-xs text-gray-500">{planPayments.length} assinantes</p>
                    </div>
                    <span className="font-bold text-sm">
                      {formatBRL(planRevenue * 100)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  };

  const renderPlans = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Planos</h1>
          <p className="text-gray-600 mt-1">Visualize e gerencie os planos de assinatura disponíveis.</p>
        </div>
        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="flex items-center gap-2"
              onClick={() => {
                setEditingPlan(null);
                planForm.reset({
                  name: "",
                  description: "",
                  monthlyPrice: "",
                  yearlyPrice: "",
                  features: [],
                  maxContacts: "",
                  maxPhotos: 5,
                  priority: 0,
                  isActive: true,
                  isFeatured: false
                });
              }}
            >
              <Plus className="h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Editar Plano" : "Novo Plano"}
              </DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? "Edite as informações do plano de assinatura"
                  : "Crie um novo plano de assinatura para a plataforma"
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...planForm}>
              <form onSubmit={planForm.handleSubmit((data) => {
                if (editingPlan) {
                  updatePlanMutation.mutate({ ...data, id: editingPlan.id });
                } else {
                  createPlanMutation.mutate(data);
                }
              })} className="space-y-6">
                
                <FormField
                  control={planForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Plano</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Plano Básico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={planForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva os benefícios do plano..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={planForm.control}
                    name="monthlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Mensal (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="29.90"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={planForm.control}
                    name="yearlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Anual (R$) - Opcional</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="299.90"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={planForm.control}
                    name="maxContacts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de Contatos</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Deixe vazio para ilimitado"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={planForm.control}
                    name="maxPhotos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de Fotos</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={planForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={planForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativo</FormLabel>
                          <FormControl>
                            <p className="text-sm text-gray-600">
                              Plano visível para os usuários
                            </p>
                          </FormControl>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={planForm.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Destaque</FormLabel>
                          <FormControl>
                            <p className="text-sm text-gray-600">
                              Plano aparece como recomendado
                            </p>
                          </FormControl>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPlanDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {(createPlanMutation.isPending || updatePlanMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {editingPlan ? "Atualizar" : "Criar"} Plano
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#3C8BAB]" />
            Planos de Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C8BAB]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan: any) => (
                <Card key={plan.id} className={cn(
                  "border border-gray-200 relative",
                  plan.isFeatured && "border-yellow-400 shadow-lg"
                )}>
                  {plan.isFeatured && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      DESTAQUE
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="flex gap-1">
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        {plan.pagarmeProductId && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            ✓ Sync
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-2xl font-bold text-[#3C8BAB]">
                        {formatBRL(parseFloat(plan.monthlyPrice) * 100)}
                        <span className="text-sm font-normal text-gray-500">/mês</span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-500">Max. Contatos:</span>
                          <span className="ml-2 font-medium">{plan.maxContacts || 'Ilimitado'}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Max. Fotos:</span>
                          <span className="ml-2 font-medium">{plan.maxPhotos || 'Ilimitado'}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Prioridade:</span>
                          <span className="ml-2 font-medium">{plan.priority}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Pagar.me ID:</span>
                          <span className="ml-2 font-medium text-xs">
                            {plan.pagarmeProductId ? 
                              `${plan.pagarmeProductId.slice(0, 20)}...` : 
                              'Não sincronizado'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 space-y-2">
                        <div className="text-sm text-gray-500">
                          Assinantes: {payments.filter((p: Payment) => p.planId === plan.id).length}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setEditingPlan(plan);
                              planForm.reset({
                                name: plan.name,
                                description: plan.description,
                                monthlyPrice: plan.monthlyPrice,
                                yearlyPrice: plan.yearlyPrice || "",
                                features: plan.features || [],
                                maxContacts: plan.maxContacts?.toString() || "",
                                maxPhotos: plan.maxPhotos || 5,
                                priority: plan.priority || 0,
                                isActive: plan.isActive,
                                isFeatured: plan.isFeatured,
                              });
                              setIsPlanDialogOpen(true);
                            }}
                            className="text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncPlanMutation.mutate(plan.id)}
                            disabled={syncPlanMutation.isPending}
                            className="text-xs"
                          >
                            {syncPlanMutation.isPending ? "Sincronizando..." : "Sync Pagar.me"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) {
                                deletePlanMutation.mutate(plan.id);
                              }
                            }}
                            disabled={deletePlanMutation.isPending}
                            className="text-xs"
                          >
                            {deletePlanMutation.isPending ? "Removendo..." : "Excluir"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {plans.length === 0 && (
                <p className="text-center text-gray-500 py-4 col-span-full">Nenhum plano cadastrado</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie as configurações da plataforma Monte Everest.</p>
        </div>
      </div>

      {/* Gerenciamento de Administradores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#3C8BAB]" />
              Administradores do Sistema
            </CardTitle>
            <Button
              onClick={() => setIsAddAdminModalOpen(true)}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Adicionar Administrador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {adminsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C8BAB]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum administrador cadastrado.</p>
              ) : (
                admins.map((admin: any) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{admin.fullName || admin.email}</h4>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                      <p className="text-xs text-gray-400">
                        Criado em: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Ativo</Badge>
                      {admin.isSystemAdmin ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Sistema
                        </Badge>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChangeAdminPasswordModal({
                              open: true,
                              adminId: admin.id,
                              adminName: admin.fullName || admin.email
                            })}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            data-testid={`button-change-password-admin-${admin.id}`}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja remover o administrador "${admin.fullName || admin.email}"?`)) {
                                deleteAdminMutation.mutate(admin.id);
                              }
                            }}
                            disabled={deleteAdminMutation.isPending}
                            data-testid={`button-remove-admin-${admin.id}`}
                          >
                            {deleteAdminMutation.isPending ? "Removendo..." : "Remover"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Alteração de Senha de Admin */}
      <Dialog 
        open={changeAdminPasswordModal.open} 
        onOpenChange={(open) => {
          if (!open) {
            setChangeAdminPasswordModal({ open: false, adminId: null, adminName: '' });
            adminPasswordForm.reset();
          }
        }}
      >
        <DialogContent data-testid="admin-password-change-dialog">
          <DialogHeader>
            <DialogTitle>Alterar Senha do Administrador</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {changeAdminPasswordModal.adminName}
            </DialogDescription>
          </DialogHeader>
          <Form {...adminPasswordForm}>
            <form onSubmit={adminPasswordForm.handleSubmit((data) => {
              if (changeAdminPasswordModal.adminId) {
                changeAdminPasswordMutation.mutate({
                  adminId: changeAdminPasswordModal.adminId,
                  newPassword: data.newPassword
                });
              }
            })} className="space-y-4">
              <FormField
                control={adminPasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite a nova senha (mínimo 6 caracteres)"
                        {...field}
                        data-testid="input-new-admin-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite novamente a nova senha"
                        {...field}
                        data-testid="input-confirm-admin-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setChangeAdminPasswordModal({ open: false, adminId: null, adminName: '' });
                    adminPasswordForm.reset();
                  }}
                  data-testid="button-cancel-admin-password"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={changeAdminPasswordMutation.isPending}
                  data-testid="button-save-admin-password"
                >
                  {changeAdminPasswordMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Configurações do Pagar.me */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#3C8BAB]" />
              Configuração do Pagar.me
            </CardTitle>
            {!isEditingPagarmeConfig && (
              <Button
                variant="outline"
                onClick={() => setIsEditingPagarmeConfig(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Configure as chaves de API do Pagar.me para processar pagamentos de assinaturas
          </p>
        </CardHeader>
        <CardContent>
          {pagarmeConfigLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C8BAB]"></div>
            </div>
          ) : isEditingPagarmeConfig ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chave da API *
                  </label>
                  <input
                    type="password"
                    value={pagarmeApiKey}
                    onChange={(e) => setPagarmeApiKey(e.target.value)}
                    placeholder="sk_test_... ou sk_..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3C8BAB] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chave secreta para autenticação (sk_test_... para teste ou sk_... para produção)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ID da Conta *
                  </label>
                  <input
                    type="text"
                    value={pagarmeAccountId}
                    onChange={(e) => setPagarmeAccountId(e.target.value)}
                    placeholder="acc_..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3C8BAB] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ID da sua conta no Pagar.me (ex: acc_qPMGwPjTnJiRorl7)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chave Pública *
                  </label>
                  <input
                    type="text"
                    value={pagarmePublicKey}
                    onChange={(e) => setPagarmePublicKey(e.target.value)}
                    placeholder="pk_test_... ou pk_..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3C8BAB] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chave pública para integração (pk_test_... para teste ou pk_... para produção)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={() => {
                    savePagarmeConfigMutation.mutate({
                      apiKey: pagarmeApiKey,
                      accountId: pagarmeAccountId,
                      publicKey: pagarmePublicKey
                    });
                  }}
                  disabled={savePagarmeConfigMutation.isPending || (!pagarmeApiKey && !pagarmeAccountId && !pagarmePublicKey)}
                  className="flex items-center gap-2"
                >
                  {savePagarmeConfigMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {savePagarmeConfigMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingPagarmeConfig(false);
                    setPagarmeApiKey(pagarmeConfig?.apiKey || "");
                    setPagarmeAccountId(pagarmeConfig?.accountId || "");
                    setPagarmePublicKey(pagarmeConfig?.publicKey || "");
                  }}
                  disabled={savePagarmeConfigMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4 text-[#3C8BAB]" />
                    Chave da API
                  </h4>
                  <p className="text-sm text-gray-600">
                    {pagarmeConfig?.apiKey ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Configurada ({pagarmeConfig.apiKey.startsWith('sk_test') ? 'Teste' : 'Produção'})
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        Não configurada
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#3C8BAB]" />
                    ID da Conta
                  </h4>
                  <p className="text-sm text-gray-600">
                    {pagarmeConfig?.accountId ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Configurado
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        Não configurado
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4 text-[#3C8BAB]" />
                    Chave Pública
                  </h4>
                  <p className="text-sm text-gray-600">
                    {pagarmeConfig?.publicKey ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Configurada ({pagarmeConfig.publicKey.startsWith('pk_test') ? 'Teste' : 'Produção'})
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        Não configurada
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {(!pagarmeConfig?.apiKey || !pagarmeConfig?.accountId || !pagarmeConfig?.publicKey) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800">Configuração Incompleta</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Para processar pagamentos, configure todos os dados da conta Pagar.me: Chave da API, ID da Conta e Chave Pública. 
                        Use chaves de teste para desenvolvimento e chaves de produção para o ambiente ao vivo.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#3C8BAB]" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Informações da Plataforma</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span>Monte Everest</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versão:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ambiente:</span>
                    <span>Produção</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Estatísticas do Sistema</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Profissionais:</span>
                    <span>{professionals.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Pagamentos:</span>
                    <span>{payments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Administradores:</span>
                    <span>{admins.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manutenção e Suporte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#3C8BAB]" />
            Manutenção e Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Para configurações avançadas do sistema ou problemas técnicos, 
              entre em contato com o suporte técnico da plataforma Monte Everest.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );

  const filteredCategories = categories.filter((category: any) =>
    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      isActive: category.isActive,
      isPopular: category.isPopular || false,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleSubmitCategory = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ ...data, id: editingCategory.id });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm("Tem certeza que deseja remover esta categoria?")) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  // Auto-generate slug from name
  const watchCategoryName = categoryForm.watch("name");
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Update slug when name changes
  if (watchCategoryName && !editingCategory) {
    const newSlug = generateSlug(watchCategoryName);
    if (categoryForm.getValues("slug") !== newSlug) {
      categoryForm.setValue("slug", newSlug);
    }
  }

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Categorias</h1>
          <p className="text-gray-600 mt-1">Gerencie as categorias de serviços disponíveis na plataforma</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => seedCategoriesMutation.mutate()}
            disabled={seedCategoriesMutation.isPending}
            className="flex items-center gap-2"
          >
            {seedCategoriesMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Inserir Categorias Populares
          </Button>

          <Button
            variant="outline"
            onClick={() => markPopularMutation.mutate()}
            disabled={markPopularMutation.isPending}
            className="flex items-center gap-2"
          >
            {markPopularMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Marcar Populares da Home
          </Button>

          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  categoryForm.reset();
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Edite as informações da categoria"
                    : "Adicione uma nova categoria de serviços"}
                </DialogDescription>
              </DialogHeader>

              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(handleSubmitCategory)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Encanadores" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug (URL)</FormLabel>
                        <FormControl>
                          <Input placeholder="encanadores" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Profissionais especializados em..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ícone</FormLabel>
                        <FormControl>
                          <IconSelector 
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Selecione um ícone para a categoria"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativa</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Categoria visível para os usuários
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="isPopular"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Popular</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Aparece na seção de categorias populares
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCategoryDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingCategory ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-[#3C8BAB]" />
              Categorias ({categories.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar categorias..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C8BAB]"></div>
            </div>
          ) : (
            <>
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {categories.length === 0
                      ? "Nenhuma categoria encontrada. Clique em 'Inserir Categorias Populares' para começar."
                      : "Nenhuma categoria corresponde ao filtro de busca."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Ícone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Popular</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category: any) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            {category.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {category.slug}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell>
                            {category.icon && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                                {category.icon}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={category.isActive 
                                ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                              }
                            >
                              {category.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.isPopular ? "destructive" : "outline"}>
                              {category.isPopular ? "★ Popular" : "Normal"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={deleteCategoryMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReviews = () => {
    const filteredReviews = reviews.filter((review: any) => {
      const matchesSearch = 
        review.customerName.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        review.customerEmail.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        review.professional?.fullName?.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        review.comment?.toLowerCase().includes(reviewSearchTerm.toLowerCase());
      
      const matchesFilter = 
        reviewFilterStatus === "all" ||
        (reviewFilterStatus === "verified" && review.isVerified) ||
        (reviewFilterStatus === "unverified" && !review.isVerified);
      
      return matchesSearch && matchesFilter;
    });

    const renderStars = (rating: number) => {
      return (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
          <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Avaliações</h1>
            <p className="text-gray-600 mt-1">Visualize e gerencie a verificação de avaliações dos profissionais</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, profissional ou comentário..."
                  value={reviewSearchTerm}
                  onChange={(e) => setReviewSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-reviews"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={reviewFilterStatus === "all" ? "default" : "outline"}
                  onClick={() => setReviewFilterStatus("all")}
                  size="sm"
                  data-testid="filter-all"
                >
                  Todas ({reviews.length})
                </Button>
                <Button
                  variant={reviewFilterStatus === "verified" ? "default" : "outline"}
                  onClick={() => setReviewFilterStatus("verified")}
                  size="sm"
                  data-testid="filter-verified"
                >
                  Verificadas ({reviews.filter((r: any) => r.isVerified).length})
                </Button>
                <Button
                  variant={reviewFilterStatus === "unverified" ? "default" : "outline"}
                  onClick={() => setReviewFilterStatus("unverified")}
                  size="sm"
                  data-testid="filter-unverified"
                >
                  Não Verificadas ({reviews.filter((r: any) => !r.isVerified).length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#3C8BAB]" />
              Avaliações ({filteredReviews.length})
            </CardTitle>
            <CardDescription>
              Lista de todas as avaliações com opções de verificação manual
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {reviewsLoading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Carregando avaliações...
                </div>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {reviewSearchTerm || reviewFilterStatus !== "all" 
                  ? "Nenhuma avaliação encontrada com os filtros aplicados"
                  : "Nenhuma avaliação cadastrada"
                }
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead>Comentário</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review: any) => (
                      <TableRow key={review.id} data-testid={`review-row-${review.id}`}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium" data-testid={`customer-name-${review.id}`}>
                              {review.customerName}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`customer-email-${review.id}`}>
                              {review.customerEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium" data-testid={`professional-name-${review.id}`}>
                              {review.professional?.fullName || "N/A"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {review.professional?.email || "N/A"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderStars(review.rating)}
                        </TableCell>
                        <TableCell>
                          {review.comment ? (
                            <p className="text-sm text-muted-foreground max-w-xs truncate" title={review.comment}>
                              {review.comment}
                            </p>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              Sem comentário
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {review.isVerified ? (
                            <Badge 
                              variant="default" 
                              className="bg-green-100 text-green-800 border-green-200"
                              data-testid={`status-verified-${review.id}`}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificada
                            </Badge>
                          ) : (
                            <Badge 
                              variant="secondary"
                              data-testid={`status-unverified-${review.id}`}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Não Verificada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={review.isVerified ? "outline" : "default"}
                            size="sm"
                            onClick={() => updateReviewVerificationMutation.mutate({
                              reviewId: review.id,
                              isVerified: !review.isVerified
                            })}
                            disabled={updateReviewVerificationMutation.isPending}
                            data-testid={`toggle-verification-${review.id}`}
                          >
                            {review.isVerified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Remover Verificação
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verificar
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPages = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Páginas</h1>
          <p className="text-gray-600 mt-1">Gerencie as páginas de conteúdo da plataforma</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#3C8BAB]" />
                Páginas
              </CardTitle>
              <CardDescription>
                {pages.length} página{pages.length !== 1 ? 's' : ''} cadastrada{pages.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Dialog open={isPageDialogOpen} onOpenChange={(open) => {
              setIsPageDialogOpen(open);
              if (!open) {
                setEditingPage(null);
                pageForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleCreatePage}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Página
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPage ? "Editar Página" : "Nova Página"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPage
                      ? "Edite as informações da página"
                      : "Adicione uma nova página de conteúdo"}
                  </DialogDescription>
                </DialogHeader>

                <Form {...pageForm}>
                  <form onSubmit={pageForm.handleSubmit(handlePageSubmit)} className="space-y-4">
                    <FormField
                      control={pageForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Política de Privacidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={pageForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (URL)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: politica-privacidade" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL amigável da página. Será acessível em /pagina/slug
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={pageForm.control}
                      name="metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Descrição</FormLabel>
                          <FormControl>
                            <Input placeholder="Descrição para SEO (opcional)" {...field} />
                          </FormControl>
                          <FormDescription>
                            Descrição que aparecerá nos resultados de busca
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={pageForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conteúdo</FormLabel>
                          <FormControl>
                            <ReactQuill
                              theme="snow"
                              value={field.value}
                              onChange={field.onChange}
                              modules={{
                                toolbar: [
                                  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                  ['bold', 'italic', 'underline', 'strike'],
                                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                  [{ 'align': [] }],
                                  [{ 'color': [] }, { 'background': [] }],
                                  ['link', 'image'],
                                  ['clean']
                                ]
                              }}
                              formats={[
                                'header',
                                'bold', 'italic', 'underline', 'strike',
                                'list', 'bullet',
                                'align',
                                'color', 'background',
                                'link', 'image'
                              ]}
                              className="bg-white"
                              placeholder="Escreva o conteúdo da página aqui..."
                            />
                          </FormControl>
                          <FormDescription>
                            Use a barra de ferramentas para formatar o texto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={pageForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativa</FormLabel>
                            <FormDescription>
                              Página visível no site
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsPageDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createPageMutation.isPending || updatePageMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        {(createPageMutation.isPending || updatePageMutation.isPending) && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {editingPage ? "Salvar Alterações" : "Criar Página"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {pagesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando páginas...</p>
            </div>
          ) : (
            <>
              {pages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Nenhuma página encontrada. Clique em 'Nova Página' para começar.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criada em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((page: any) => (
                        <TableRow key={page.id}>
                          <TableCell className="font-medium">
                            {page.title}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            /{page.slug}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={page.isActive 
                                ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                              }
                            >
                              {page.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(page.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPage(page)}
                                className="h-8 px-2"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja remover esta página?")) {
                                    deletePageMutation.mutate(page.id);
                                  }
                                }}
                                className="h-8 px-2 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "professionals":
        return renderProfessionals();
      case "payments":
        return renderPayments();
      case "categories":
        return renderCategories();
      case "reviews":
        return renderReviews();
      case "pages":
        return renderPages();
      case "plans":
        return renderPlans();
      case "reports":
        return renderReports();
      case "settings":
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C8BAB] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Mobile Header */}
        <MobileHeader 
          title={sidebarItems.find(item => item.id === activeTab)?.label || "Painel"}
          rightAction={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem("adminToken");
                setLocation("/entrar");
              }}
              className="p-2"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          }
        />

        {/* Mobile Content */}
        <div className="flex-1 overflow-auto p-4">
          {renderContent()}
        </div>

        {/* Mobile Tab Bar */}
        <MobileTabBar
          tabs={sidebarItems.map(item => ({
            id: item.id,
            label: item.label,
            icon: <item.icon className="h-5 w-5" />,
          }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {!sidebarCollapsed && (
            <div className="ml-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#3C8BAB] rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Monte Everest</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  isActive 
                    ? "bg-[#3C8BAB] text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {sidebarItems.find(item => item.id === activeTab)?.label || "Painel"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Logado como <span className="font-medium">Administrador</span>
            </div>
            <NotificationBell notifications={notifications} />
            <div className="w-8 h-8 bg-[#3C8BAB] rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Modal de Edição de Plano */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Plano
            </DialogTitle>
          </DialogHeader>
          
          {editingPlan && (
            <form onSubmit={handleEditPlanSubmit} className="space-y-4">
              <div>
                <Label htmlFor="plan-name">Nome do Plano</Label>
                <Input
                  id="plan-name"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="plan-description">Descrição</Label>
                <Textarea
                  id="plan-description"
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan-price">Preço Mensal (R$)</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    step="0.01"
                    value={editingPlan.monthlyPrice}
                    onChange={(e) => setEditingPlan({...editingPlan, monthlyPrice: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="plan-priority">Prioridade</Label>
                  <Input
                    id="plan-priority"
                    type="number"
                    value={editingPlan.priority}
                    onChange={(e) => setEditingPlan({...editingPlan, priority: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan-contacts">Max. Contatos</Label>
                  <Input
                    id="plan-contacts"
                    type="number"
                    value={editingPlan.maxContacts}
                    onChange={(e) => setEditingPlan({...editingPlan, maxContacts: e.target.value})}
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>
                
                <div>
                  <Label htmlFor="plan-photos">Max. Fotos</Label>
                  <Input
                    id="plan-photos"
                    type="number"
                    value={editingPlan.maxPhotos}
                    onChange={(e) => setEditingPlan({...editingPlan, maxPhotos: e.target.value})}
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive}
                    onChange={(e) => setEditingPlan({...editingPlan, isActive: e.target.checked})}
                  />
                  <span>Plano ativo</span>
                </label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={editPlanMutation.isPending}
                >
                  {editPlanMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Administrador */}
      <Dialog open={isAddAdminModalOpen} onOpenChange={setIsAddAdminModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Adicionar Administrador
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddAdminSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-name">Nome Completo</Label>
              <Input
                id="admin-name"
                value={newAdminData.fullName}
                onChange={(e) => setNewAdminData({...newAdminData, fullName: e.target.value})}
                placeholder="Nome do administrador"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={newAdminData.email}
                onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                placeholder="admin@exemplo.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="admin-password">Senha</Label>
              <Input
                id="admin-password"
                type="password"
                value={newAdminData.password}
                onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})}
                placeholder="Senha segura"
                required
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddAdminModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={addAdminMutation.isPending}
              >
                {addAdminMutation.isPending ? "Criando..." : "Criar Administrador"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}