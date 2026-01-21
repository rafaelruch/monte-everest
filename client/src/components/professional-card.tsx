import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Phone, MessageCircle, Award } from "lucide-react";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import StarRating from "./star-rating";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Professional } from "@shared/schema";

const whatsappFormSchema = z.object({
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerPhone: z.string().min(8, "Telefone é obrigatório"),
});

type WhatsAppFormData = z.infer<typeof whatsappFormSchema>;

interface ProfessionalCardProps {
  professional: Professional & {
    category?: {
      name: string;
      slug: string;
    };
    isFeaturedPlan?: boolean;
  };
}

export default function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const { toast } = useToast();

  // Format phone for WhatsApp (55 + DDD + number)
  const formatWhatsAppPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return `55${cleaned}`;
  };

  // Apply phone mask while typing
  const applyPhoneMask = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
    return value;
  };

  const whatsappForm = useForm<WhatsAppFormData>({
    resolver: zodResolver(whatsappFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
    },
  });

  const submitWhatsAppMutation = useMutation({
    mutationFn: async (data: WhatsAppFormData) => {
      const response = await apiRequest("POST", "/api/contacts", {
        professionalId: professional.id,
        contactMethod: "whatsapp",
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        message: "",
      });
      return response.json();
    },
    onSuccess: (_, data) => {
      // Open WhatsApp with the provided message
      if (professional?.phone) {
        const whatsappPhone = formatWhatsAppPhone(professional.phone);
        const message = `Vi seu perfil no Monte Everest, meu nome é ${data.customerName} e gostaria de saber mais sobre seus serviços.`;
        const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
        
        // Use location.href for better iOS/iPhone compatibility
        // window.open with _blank doesn't work well on iOS for external apps
        window.location.href = whatsappUrl;
      }
      
      toast({
        title: "Redirecionando para WhatsApp!",
        description: "Suas informações foram registradas e você será redirecionado.",
      });
      setShowWhatsAppDialog(false);
      whatsappForm.reset();
    },
    onError: (error: any) => {
      const errorMessage = error.message || "";
      const isLimitReached = errorMessage.includes("403") && errorMessage.includes("limite");
      
      toast({
        title: isLimitReached ? "Limite de contatos atingido" : "Erro ao processar contato",
        description: isLimitReached 
          ? "Este profissional atingiu o limite de contatos do mês. Tente novamente no próximo mês."
          : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleContactClick = () => {
    // Record profile view (not a contact)
    fetch("/api/profile-views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        professionalId: professional.id,
      }),
    });
    
    // Navigate to professional profile page
    window.location.href = `/profissional/${professional.id}`;
  };

  const handleWhatsAppClick = () => {
    setShowWhatsAppDialog(true);
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow overflow-hidden relative ${
        professional.isFeaturedPlan 
          ? 'border-2 border-primary shadow-lg ring-1 ring-primary/20' 
          : ''
      }`} 
      data-testid={`professional-card-${professional.id}`}
    >
      {/* Featured Badge */}
      {professional.isFeaturedPlan && (
        <div className="absolute -top-0 -right-0 z-10">
          <div className="bg-primary text-white px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-md">
            <Award className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Destaque</span>
          </div>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex gap-4 mb-4">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {professional.profileImage ? (
              <img
                src={professional.profileImage}
                alt={`Foto de ${professional.fullName}`}
                className={`w-16 h-16 rounded-full object-cover border-2 ${
                  professional.isFeaturedPlan ? 'border-primary' : 'border-border'
                }`}
                data-testid={`professional-image-${professional.id}`}
              />
            ) : (
              <div className={`w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 ${
                professional.isFeaturedPlan ? 'border-primary' : 'border-border'
              }`}>
                <span className="text-lg font-semibold text-muted-foreground">
                  {professional.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Professional Info */}
          <div className="flex-1 min-w-0">
            {/* Name and Rating */}
            <div className="mb-2">
              <Link href={`/profissional/${professional.id}`} data-testid={`professional-link-${professional.id}`}>
                <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors cursor-pointer" data-testid={`professional-name-${professional.id}`}>
                  {professional.fullName}
                </h3>
              </Link>
              <div className="mt-1">
                <StarRating 
                  rating={parseFloat(professional.rating || "0")} 
                  totalReviews={professional.totalReviews || 0}
                  showTotal={false}
                />
              </div>
              
              {/* City below rating */}
              <div className="mt-1 text-sm text-muted-foreground" data-testid={`professional-location-${professional.id}`}>
                <MapPin className="inline h-3.5 w-3.5 mr-1" />
                <span>{professional.city}</span>
              </div>
              
              {/* Category after location */}
              {professional.category && (
                <div className="mt-1">
                  <p className="text-primary font-medium text-sm" data-testid={`professional-category-${professional.id}`}>
                    {professional.category.name}
                  </p>
                </div>
              )}
            </div>
            
            {/* Description */}
            <div className="mb-2">
              <p className="text-muted-foreground text-sm" data-testid={`professional-description-${professional.id}`}>
                {professional.description}
              </p>
            </div>
            
            {/* Ranking */}
            <div className="mb-2">
              {professional.rankingPosition && professional.category && (
                <Badge variant="secondary" className="text-xs" data-testid={`professional-ranking-${professional.id}`}>
                  #{professional.rankingPosition} em {professional.category.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2">
          {professional.socialMedia?.instagram && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const instagram = professional.socialMedia?.instagram || "";
                let url = instagram;
                if (instagram.startsWith("@")) {
                  url = `https://instagram.com/${instagram.slice(1)}`;
                } else if (!instagram.startsWith("http")) {
                  url = `https://instagram.com/${instagram}`;
                }
                window.open(url, "_blank");
              }}
              className="bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100"
              data-testid={`button-instagram-${professional.id}`}
            >
              <FaInstagram className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppClick}
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            data-testid={`button-whatsapp-${professional.id}`}
          >
            <FaWhatsapp className="h-4 w-4 mr-1" />
            WhatsApp
          </Button>
          
          <Button
            size="sm"
            onClick={handleContactClick}
            data-testid={`button-contact-${professional.id}`}
          >
            Ver Perfil
          </Button>
        </div>

        {/* WhatsApp Contact Dialog */}
        <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contato via WhatsApp</DialogTitle>
            </DialogHeader>
            <Form {...whatsappForm}>
              <form onSubmit={whatsappForm.handleSubmit((data) => submitWhatsAppMutation.mutate(data))} className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Preencha seus dados para ser redirecionado ao WhatsApp do profissional.
                </div>
                
                <FormField
                  control={whatsappForm.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Seu nome" data-testid={`input-whatsapp-name-${professional.id}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={whatsappForm.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="(11) 99999-9999"
                          onChange={(e) => {
                            const maskedValue = applyPhoneMask(e.target.value);
                            field.onChange(maskedValue);
                          }}
                          data-testid={`input-whatsapp-phone-${professional.id}`} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowWhatsAppDialog(false)}
                    data-testid={`button-cancel-whatsapp-${professional.id}`}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitWhatsAppMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid={`button-send-whatsapp-${professional.id}`}
                  >
                    <FaWhatsapp className="h-4 w-4 mr-2" />
                    {submitWhatsAppMutation.isPending ? "Processando..." : "Ir para WhatsApp"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
