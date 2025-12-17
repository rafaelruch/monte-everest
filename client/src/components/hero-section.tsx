import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Check, ChevronsUpDown, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [open, setOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: cities = [] } = useQuery<string[]>({
    queryKey: ["/api/cities"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory || selectedCity) {
      const searchParams = new URLSearchParams();
      if (selectedCategory) searchParams.set("category", selectedCategory);
      if (selectedCity) searchParams.set("location", selectedCity);
      setLocation(`/buscar?${searchParams.toString()}`);
    }
  };

  return (
    <section className="hero-gradient text-primary-foreground py-20" data-testid="hero-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
            Encontre os melhores <br />
            <span className="text-secondary">profissionais</span> da sua região
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90" data-testid="hero-subtitle">
            Conectamos você com prestadores de serviços qualificados e avaliados
          </p>
          
          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4" data-testid="search-form">
                  <div className="flex-1">
                    <Label htmlFor="service-select" className="block text-sm font-medium text-foreground mb-2">
                      Que serviço você precisa?
                    </Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                          data-testid="select-service"
                        >
                          {selectedCategoryName || "Comece digitando o serviço..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Digite o serviço que você precisa..." />
                          <CommandList>
                            <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                            <CommandGroup>
                              {(categories as any[]).map((category: any) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.name}
                                  onSelect={(currentValue) => {
                                    setSelectedCategory(category.id);
                                    setSelectedCategoryName(category.name);
                                    setOpen(false);
                                  }}
                                  data-testid={`option-${category.slug}`}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCategory === category.id ? "opacity-100" : "opacity-0"
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
                    <Label htmlFor="location-input" className="block text-sm font-medium text-foreground mb-2">
                      Onde você está?
                    </Label>
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={cityOpen}
                          className="w-full justify-between"
                          data-testid="input-location"
                        >
                          {selectedCity || "Selecione a cidade..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Digite o nome da cidade..." 
                            value={locationInput}
                            onValueChange={setLocationInput}
                          />
                          <CommandList>
                            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                            <CommandGroup>
                              {cities
                                .filter((city: string) => 
                                  city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                    .includes(locationInput.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
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
                                      selectedCity === city ? "opacity-100" : "opacity-0"
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
                  
                  <div className="flex items-end">
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      data-testid="button-search"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
