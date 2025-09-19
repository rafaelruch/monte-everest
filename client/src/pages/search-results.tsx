import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, isUuid } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, MapPin, Filter, SortAsc, Users } from "lucide-react";
import ProfessionalCard from "@/components/professional-card";
import type { Professional, Category } from "@shared/schema";

export default function SearchResults() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [open, setOpen] = useState(false);
  const [location, setLocationInput] = useState(searchParams.get("location") || "");
  const [selectedCity, setSelectedCity] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const professionalsPerPage = 12;

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["/api/cities"],
  });

  // Use useMemo to compute derived category ID outside the query to prevent race conditions
  const derivedCategoryId = useMemo(() => {
    if (selectedCategory === "all" || !selectedCategory) {
      return "";
    }
    
    // If selectedCategory is a UUID, use it directly
    if (isUuid(selectedCategory)) {
      return selectedCategory;
    }
    
    // If categories are still loading and we have a slug (not an ID), wait for them to load
    if (categoriesLoading) {
      return null; // Signal to wait for categories
    }
    
    // Find category by slug (for URLs from popular categories)
    const categoryData = (categories as Category[]).find((cat: Category) => cat.slug === selectedCategory);
    
    return categoryData?.id || "";
  }, [selectedCategory, categories, categoriesLoading]);

  const { data: professionals = [], isLoading, error } = useQuery({
    queryKey: ["/api/professionals/search", { 
      category: derivedCategoryId, 
      location, 
      page: currentPage, 
      limit: professionalsPerPage 
    }],
    // Only enable the query when we have a resolved category ID (or no category filter)
    enabled: derivedCategoryId !== null,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (derivedCategoryId) {
        params.set("category", derivedCategoryId);
      }
      if (location) params.set("location", location);
      params.set("page", currentPage.toString());
      params.set("limit", professionalsPerPage.toString());
      
      const response = await fetch(`/api/professionals/search?${params}`);
      if (!response.ok) {
        throw new Error("Falha ao buscar profissionais");
      }
      return response.json();
    },
  });

  // Find category by slug first (for URLs from popular categories), then by ID (for backward compatibility)
  const selectedCategoryData = selectedCategory === "all" ? null : 
    (categories as Category[]).find((cat: Category) => cat.slug === selectedCategory) ||
    (categories as Category[]).find((cat: Category) => cat.id === selectedCategory);

  // Update selected category name when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setSelectedCategoryName("");
    } else {
      // Find category by slug first, then by ID
      const category = (categories as Category[]).find((cat: Category) => cat.slug === selectedCategory) ||
                      (categories as Category[]).find((cat: Category) => cat.id === selectedCategory);
      setSelectedCategoryName(category?.name || "");
    }
  }, [selectedCategory, categories]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (location) params.set("location", location);
    
    setLocation(`/buscar?${params.toString()}`);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setLocationInput("");
    setSelectedCity("");
    setLocation("/buscar");
    setCurrentPage(1);
  };

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    setSelectedCategory(params.get("category") || "all");
    setLocationInput(params.get("location") || "");
  }, [searchString]);

  return (
    <div className="min-h-screen py-8" data-testid="search-results-page">
      <title>
        {selectedCategoryData 
          ? `${selectedCategoryData.name} - Buscar Profissionais - Monte Everest` 
          : "Buscar Profissionais - Monte Everest"
        }
      </title>
      <meta 
        name="description" 
        content={`Encontre os melhores profissionais ${selectedCategoryData ? `de ${selectedCategoryData.name}` : ""} da sua região. Compare avaliações, preços e entre em contato diretamente.`}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="page-title">
            {selectedCategoryData ? `Profissionais de ${selectedCategoryData.name}` : "Buscar Profissionais"}
          </h1>
          <p className="text-muted-foreground" data-testid="page-subtitle">
            {location 
              ? `Encontre profissionais próximos ao CEP ${location}`
              : "Encontre os melhores profissionais da sua região"
            }
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                      data-testid="filter-category"
                    >
                      {selectedCategoryName || "Comece digitando a categoria..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Digite a categoria que você precisa..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="Todas as categorias"
                            onSelect={() => {
                              setSelectedCategory("all");
                              setSelectedCategoryName("");
                              setOpen(false);
                            }}
                            data-testid="option-all-categories"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCategory === "all" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Todas as categorias
                          </CommandItem>
                          {(categories as Category[]).map((category: Category) => (
                            <CommandItem
                              key={category.id}
                              value={category.name}
                              onSelect={() => {
                                setSelectedCategory(category.id);
                                setSelectedCategoryName(category.name);
                                setOpen(false);
                              }}
                              data-testid={`option-${category.slug}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  (selectedCategory === category.id || selectedCategory === category.slug) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {category.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex-1">
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={cityOpen}
                      className="w-full justify-between"
                      data-testid="filter-location"
                    >
                      {selectedCity || location || "Digite uma cidade..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Digite o nome da cidade..." 
                        value={location}
                        onValueChange={setLocationInput}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                        <CommandGroup>
                          {(cities as string[])
                            .filter((city: string) => 
                              city.toLowerCase().includes(location.toLowerCase())
                            )
                            .slice(0, 10)
                            .map((city: string) => (
                            <CommandItem
                              key={city}
                              value={city}
                              onSelect={() => {
                                setSelectedCity(city);
                                setLocationInput(city);
                                setCityOpen(false);
                              }}
                              data-testid={`option-city-${city.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  (selectedCity === city || location === city) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                              {city}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSearch} data-testid="button-search">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters */}
        {(selectedCategoryData || location) && (
          <div className="mb-6" data-testid="active-filters">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros ativos:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCategoryData && (
                <Badge variant="secondary" data-testid="filter-badge-category">
                  {selectedCategoryData.name}
                </Badge>
              )}
              {location && (
                <Badge variant="secondary" data-testid="filter-badge-location">
                  <MapPin className="h-3 w-3 mr-1" />
                  {location}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2" data-testid="results-count">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {isLoading ? "Carregando..." : `${professionals.length} profissionais encontrados`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40" data-testid="sort-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating" data-testid="sort-rating">Melhor avaliado</SelectItem>
                <SelectItem value="reviews" data-testid="sort-reviews">Mais avaliações</SelectItem>
                <SelectItem value="recent" data-testid="sort-recent">Mais recente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Results Content */}
        {error && (
          <Alert variant="destructive" className="mb-8" data-testid="search-error">
            <AlertDescription>
              Ocorreu um erro ao buscar profissionais. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="loading-grid">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="w-full h-48 bg-muted"></div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-16" data-testid="no-results">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum profissional encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              {selectedCategoryData || location
                ? "Tente ajustar os filtros para encontrar mais profissionais"
                : "Não há profissionais cadastrados no momento"
              }
            </p>
            {(selectedCategoryData || location) && (
              <Button onClick={clearFilters} variant="outline" data-testid="button-clear-all-filters">
                Ver todos os profissionais
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" data-testid="professionals-grid">
              {professionals.map((professional: Professional) => (
                <ProfessionalCard key={professional.id} professional={professional} />
              ))}
            </div>

            {/* Pagination */}
            {professionals.length === professionalsPerPage && (
              <div className="flex justify-center" data-testid="pagination">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPage(prev => prev + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  data-testid="button-load-more"
                >
                  Carregar mais profissionais
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
