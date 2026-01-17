import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, MapPin, ChevronRight, Award } from "lucide-react";
import { Link } from "wouter";
import type { Category, Professional } from "@shared/schema";

interface RankedProfessional extends Professional {
  categoryName: string;
  planName: string | null;
  hasFeaturedProfile: boolean;
}

interface RankingsResponse {
  professionals: RankedProfessional[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Ranking() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: rankings, isLoading: rankingsLoading, isFetching } = useQuery<RankingsResponse>({
    queryKey: ["/api/rankings", selectedCategory, page],
    queryFn: async () => {
      const response = await fetch(`/api/rankings?categoryId=${selectedCategory}&page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error("Erro ao carregar rankings");
      return response.json();
    },
    enabled: !!selectedCategory,
  });

  const getRankingMedal = (position: number) => {
    if (position === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (position === 2) return <Trophy className="h-6 w-6 text-gray-400" />;
    if (position === 3) return <Trophy className="h-6 w-6 text-amber-600" />;
    return null;
  };

  const getRankingBadgeColor = (position: number) => {
    if (position === 1) return "bg-yellow-500 text-white";
    if (position === 2) return "bg-gray-400 text-white";
    if (position === 3) return "bg-amber-600 text-white";
    return "bg-gray-200 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-10 w-10 text-[#3C8CAA]" />
            <h1 className="text-4xl font-bold text-gray-900">Ranking de Profissionais</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Descubra os melhores profissionais avaliados pelos nossos clientes em cada categoria.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione uma profissão
            </label>
            <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha uma categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <div className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {!selectedCategory && (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Selecione uma categoria para ver o ranking dos melhores profissionais.
            </p>
          </div>
        )}

        {selectedCategory && (rankingsLoading || isFetching) && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedCategory && !rankingsLoading && !isFetching && rankings && (
          <>
            {rankings.professionals.length === 0 ? (
              <div className="text-center py-16">
                <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Nenhum profissional encontrado nesta categoria.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {rankings.professionals.map((professional, index) => {
                    const position = (page - 1) * limit + index + 1;
                    const isFeatured = professional.hasFeaturedProfile;
                    
                    return (
                      <Link key={professional.id} href={`/profissional/${professional.id}`}>
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                            isFeatured ? "border-2 border-[#3C8CAA] shadow-md" : ""
                          }`}
                        >
                          <CardContent className="py-4">
                            <div className="flex items-center gap-4">
                              <div className={`flex items-center justify-center h-12 w-12 rounded-full font-bold text-lg ${getRankingBadgeColor(position)}`}>
                                {position <= 3 ? getRankingMedal(position) : `#${position}`}
                              </div>
                              
                              <div className="flex-shrink-0">
                                {professional.profilePhoto ? (
                                  <img 
                                    src={professional.profilePhoto} 
                                    alt={professional.fullName || ""} 
                                    className="h-14 w-14 rounded-full object-cover border-2 border-gray-100"
                                  />
                                ) : (
                                  <div className="h-14 w-14 rounded-full bg-[#3C8CAA] text-white flex items-center justify-center text-xl font-semibold">
                                    {professional.fullName?.charAt(0) || "P"}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-gray-900 truncate">
                                    {professional.fullName}
                                  </h3>
                                  {isFeatured && (
                                    <Badge className="bg-[#3C8CAA] text-white text-xs">
                                      Destaque
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="font-medium text-gray-700">
                                      {professional.rating ? parseFloat(professional.rating).toFixed(1) : "N/A"}
                                    </span>
                                    <span className="text-gray-400">
                                      ({professional.totalReviews || 0} avaliações)
                                    </span>
                                  </div>
                                  
                                  {professional.city && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{professional.city}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>

                {rankings.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Página {page} de {rankings.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(rankings.totalPages, p + 1))}
                      disabled={page === rankings.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}

                <p className="text-center text-sm text-gray-500 mt-6">
                  Mostrando {rankings.professionals.length} de {rankings.total} profissionais
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
