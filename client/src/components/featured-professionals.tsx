import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ProfessionalCard from "./professional-card";
import { useLocation } from "wouter";

export default function FeaturedProfessionals() {
  const [, setLocation] = useLocation();

  const { data: professionals = [], isLoading, error } = useQuery({
    queryKey: ["/api/professionals/search?limit=6&sortBy=rating"],
  });


  const handleViewAll = () => {
    setLocation("/buscar");
  };

  if (isLoading) {
    return (
      <section className="py-16" data-testid="featured-professionals-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Profissionais em Destaque
            </h2>
            <p className="text-xl text-muted-foreground">
              Carregando profissionais...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16" data-testid="featured-professionals">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="featured-title">
            Profissionais em Destaque
          </h2>
          <p className="text-xl text-muted-foreground" data-testid="featured-subtitle">
            Conheça alguns dos nossos melhores avaliados
          </p>
        </div>
        
        {(professionals as any[]).length === 0 ? (
          <div className="text-center py-12" data-testid="no-professionals">
            <p className="text-muted-foreground">
              Nenhum profissional disponível no momento.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6" data-testid="professionals-grid">
              {(professionals as any[]).map((professional: any) => (
                <ProfessionalCard 
                  key={professional.id} 
                  professional={professional} 
                />
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleViewAll}
                data-testid="button-view-all"
              >
                Ver Todos os Profissionais
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
