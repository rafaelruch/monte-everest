import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, Filter, Users, Loader2, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin-layout";
import IconSelector from "@/components/icon-selector";
import CategoryIcon from "@/components/category-icon";

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/categories"],
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return apiRequest("POST", "/api/admin/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao criar categoria:", error);
      
      let errorMessage = "Erro ao criar categoria. Tente novamente.";
      
      if (error?.response?.status === 401) {
        errorMessage = "Sua sessão expirou. Por favor, faça login novamente.";
      } else if (error?.response?.status === 409) {
        errorMessage = "Esta categoria já existe. Tente um nome diferente.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Erro ao criar",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { id: string }) => {
      const { id, ...updateData } = data;
      return apiRequest("PUT", `/api/admin/categories/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar categoria:", error);
      
      let errorMessage = "Erro ao atualizar categoria. Tente novamente.";
      
      if (error?.response?.status === 401) {
        errorMessage = "Sua sessão expirou. Por favor, faça login novamente.";
      } else if (error?.response?.status === 409) {
        errorMessage = "Esta categoria já existe. Tente um nome diferente.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Erro ao atualizar",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
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

  const seedMutation = useMutation({
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

  const filteredCategories = categories.filter((category: any) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      isActive: category.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: CategoryFormData) => {
    // Prevent multiple submissions
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    
    if (editingCategory) {
      updateMutation.mutate({ ...data, id: editingCategory.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (categoryId: string) => {
    if (confirm("Tem certeza que deseja remover esta categoria?")) {
      deleteMutation.mutate(categoryId);
    }
  };

  // Auto-generate slug from name
  const watchName = form.watch("name");
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
  if (watchName && !editingCategory) {
    const newSlug = generateSlug(watchName);
    if (form.getValues("slug") !== newSlug) {
      form.setValue("slug", newSlug);
    }
  }

  return (
    <AdminLayout title="Gestão de Categorias">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">
              Gerencie as categorias de serviços disponíveis na plataforma
            </p>
          </div>

          <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            data-testid="button-seed-categories"
          >
            {seedMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {seedMutation.isPending ? "Inserindo..." : "Inserir Categorias Populares"}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingCategory(null);
                  form.reset();
                }}
                data-testid="button-new-category"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? "Atualize as informações da categoria"
                    : "Preencha os dados para criar uma nova categoria"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Limpeza Residencial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="limpeza-residencial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva esta categoria..." 
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Categoria ativa</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingCategory(null);
                        form.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter((cat: any) => cat.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorias Inativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter((cat: any) => !cat.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            data-testid="input-search-categories"
          />
        </div>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
          <CardDescription>
            Lista de todas as categorias de serviços cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando categorias...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profissionais</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <CategoryIcon 
                        iconName={category.icon} 
                        className="h-6 w-6"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {category.professionalsCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          data-testid={`button-edit-category-${category.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}