import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import CategoryIcon from "./category-icon";

// Mapeamento de ícones Font Awesome por nome da categoria para fallback
const iconMap: Record<string, string> = {
  "Assistência Técnica": "wrench",
  "Eletricista": "plug",
  "Encanador": "faucet",
  "Pintura": "paint-brush",
  "Jardinagem": "leaf",
  "Construção": "hammer",
  "Beleza e Estética": "cut",
  "Informática": "desktop",
  "Automotivo": "car",
  "Educação": "book",
  "Música": "music",
  "Fotografia": "camera",
  "Advocacia": "shield",
  "Contabilidade": "calculator",
  "Design": "pen",
  "Limpeza": "broom",
  "Culinária": "utensils",
  "Costura": "tshirt",
  "Cuidados Infantis": "heart",
  "Marketing": "chart-bar",
  "Esportes": "dumbbell",
  "Saúde": "stethoscope",
  "Reforço Escolar": "graduation-cap",
  "Cuidados Especiais": "heartbeat",
};

// Cores para as categorias
const colorOptions = [
  "text-blue-600", "text-yellow-600", "text-blue-500", "text-purple-600",
  "text-green-600", "text-orange-600", "text-pink-600", "text-indigo-600",
  "text-red-600", "text-emerald-600", "text-violet-600", "text-gray-600",
  "text-slate-700", "text-teal-600", "text-rose-600", "text-cyan-600",
  "text-amber-600", "text-indigo-500", "text-pink-500", "text-blue-700",
  "text-red-500", "text-green-700", "text-purple-700", "text-red-400",
];

export default function ServiceCategories() {
  const [, setLocation] = useLocation();

  const { data: popularCategories = [], isLoading } = useQuery({
    queryKey: ["/api/categories/popular"],
    queryFn: async () => {
      const response = await fetch("/api/categories/popular");
      if (!response.ok) throw new Error("Failed to fetch popular categories");
      return response.json();
    },
  });

  const handleCategoryClick = (categorySlug: string) => {
    setLocation(`/buscar?category=${categorySlug}`);
  };

  const getCategoryIcon = (category: any): string => {
    // Primeiro tenta usar o ícone do banco se disponível
    if (category.icon) {
      return category.icon;
    }
    // Fallback para ícone baseado no nome da categoria
    return iconMap[category.name] || "wrench";
  };

  const getCategoryColor = (index: number) => {
    return colorOptions[index % colorOptions.length];
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30" data-testid="service-categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Categorias Populares
            </h2>
            <p className="text-xl text-muted-foreground">
              Carregando categorias...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!popularCategories.length) {
    return (
      <section className="py-16 bg-muted/30" data-testid="service-categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Categorias Populares
            </h2>
            <p className="text-xl text-muted-foreground">
              Nenhuma categoria popular disponível no momento.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30" data-testid="service-categories">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="categories-title">
            Categorias Populares
          </h2>
          <p className="text-xl text-muted-foreground" data-testid="categories-subtitle">
            Encontre profissionais especializados
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {popularCategories.map((category: any, index: number) => {
            const iconName = getCategoryIcon(category);
            const color = getCategoryColor(index);
            
            return (
              <div
                key={category.slug}
                className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md border border-border group"
                onClick={() => handleCategoryClick(category.slug)}
                data-testid={`category-${category.slug}`}
              >
                <div className={`${color} mb-4 group-hover:scale-110 transition-transform duration-200 flex justify-center`}>
                  <CategoryIcon iconName={iconName} size="lg" />
                </div>
                <h3 className="font-medium text-foreground text-sm leading-tight" data-testid={`category-name-${category.slug}`}>
                  {category.name}
                </h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}