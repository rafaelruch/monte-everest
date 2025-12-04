import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Star, 
  Calendar, 
  Award, 
  Globe, 
  Clock,
  User,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import StarRating from "@/components/star-rating";
import { insertReviewSchema, insertContactSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Professional, Review } from "@shared/schema";

const reviewFormSchema = insertReviewSchema.extend({
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerEmail: z.string().email("Email inválido"),
});

const contactFormSchema = insertContactSchema.extend({
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerEmail: z.string().email("Email inválido").optional(),
  customerPhone: z.string().optional(),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
});

const whatsappFormSchema = z.object({
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerPhone: z.string().min(8, "Telefone é obrigatório"),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;
type ContactFormData = z.infer<typeof contactFormSchema>;
type WhatsAppFormData = z.infer<typeof whatsappFormSchema>;

export default function ProfessionalProfile() {
  const [, params] = useRoute("/profissional/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const professionalId = params?.id;

  // Format phone number with mask
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

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

  const { data: professional, isLoading: professionalLoading, error } = useQuery({
    queryKey: ["/api/professionals", professionalId],
    queryFn: async () => {
      if (!professionalId) throw new Error("ID do profissional não encontrado");
      const response = await fetch(`/api/professionals/${professionalId}`);
      if (!response.ok) {
        throw new Error("Profissional não encontrado");
      }
      return response.json();
    },
    enabled: !!professionalId,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/professionals", professionalId, "reviews"],
    queryFn: async () => {
      if (!professionalId) return [];
      const response = await fetch(`/api/professionals/${professionalId}/reviews`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!professionalId,
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      professionalId: professionalId || "",
      rating: 5,
      comment: "",
      customerName: "",
      customerEmail: "",
    },
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      professionalId: professionalId || "",
      contactMethod: "form",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      message: "",
    },
  });

  const whatsappForm = useForm<WhatsAppFormData>({
    resolver: zodResolver(whatsappFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/professionals", professionalId] });
      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi registrada com sucesso.",
      });
      setShowReviewDialog(false);
      reviewForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const submitContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", "/api/contacts", {
        ...data,
        professionalId,
        contactMethod: "form"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada!",
        description: "Sua mensagem foi enviada ao profissional.",
      });
      whatsappForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao processar contato",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const submitWhatsAppMutation = useMutation({
    mutationFn: async (data: WhatsAppFormData) => {
      const response = await apiRequest("POST", "/api/contacts", {
        professionalId,
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
      whatsappForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao processar contato",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleWhatsAppClick = () => {
    if (professional?.socialMedia?.whatsapp) {
      setShowWhatsAppDialog(true);
    }
  };


  if (professionalLoading) {
    return (
      <div className="min-h-screen py-8" data-testid="professional-profile-loading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen py-8" data-testid="professional-profile-error">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>
              {error?.message || "Profissional não encontrado"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" data-testid="professional-profile">
      <title>{professional.fullName} - Profissional - Monte Everest</title>
      <meta 
        name="description" 
        content={`Contrate ${professional.fullName}, profissional especializado. Veja avaliações, portfolio e entre em contato diretamente. Monte Everest - Conectando você aos melhores profissionais.`}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24" data-testid="professional-avatar">
              <AvatarImage src={professional.profileImage} alt={professional.fullName} />
              <AvatarFallback>
                {professional.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="professional-name">
                    {professional.fullName}
                  </h1>
                  <p className="text-xl text-primary font-medium mb-2" data-testid="professional-category">
                    {professional.category?.name}
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <StarRating 
                      rating={parseFloat(professional.rating || "0")} 
                      totalReviews={professional.totalReviews || 0}
                    />
                    {professional.rankingPosition && (
                      <Badge className="bg-primary/10 text-primary" data-testid="professional-ranking">
                        <Award className="h-3 w-3 mr-1" />
                        #{professional.rankingPosition} na categoria
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center" data-testid="professional-location">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>CEP: {professional.serviceArea}</span>
                </div>
                <div className="flex items-center" data-testid="professional-join-date">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Desde {new Date(professional.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="about-title">Sobre o Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed" data-testid="professional-description">
                  {professional.description}
                </p>
              </CardContent>
            </Card>

            {/* Portfolio */}
            {professional.portfolio && professional.portfolio.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle data-testid="portfolio-title">Portfólio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="portfolio-grid">
                    {professional.portfolio.map((image: string, index: number) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Trabalho ${index + 1} de ${professional.fullName}`}
                        className="rounded-lg object-cover w-full h-32 hover:scale-105 transition-transform cursor-pointer shadow-sm hover:shadow-md"
                        data-testid={`portfolio-image-${index}`}
                        onClick={() => {
                          setLightboxIndex(index);
                          setLightboxOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Lightbox */}
            {lightboxOpen && professional.portfolio && professional.portfolio.length > 0 && (
              <div 
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                onClick={() => setLightboxOpen(false)}
                data-testid="portfolio-lightbox"
              >
                {/* Close button */}
                <button
                  className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                  onClick={() => setLightboxOpen(false)}
                  data-testid="lightbox-close"
                >
                  <X className="h-8 w-8" />
                </button>

                {/* Previous button */}
                {professional.portfolio.length > 1 && (
                  <button
                    className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10 p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => 
                        prev === 0 ? professional.portfolio.length - 1 : prev - 1
                      );
                    }}
                    data-testid="lightbox-prev"
                  >
                    <ChevronLeft className="h-10 w-10" />
                  </button>
                )}

                {/* Image */}
                <div 
                  className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={professional.portfolio[lightboxIndex]}
                    alt={`Trabalho ${lightboxIndex + 1} de ${professional.fullName}`}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    data-testid="lightbox-image"
                  />
                </div>

                {/* Next button */}
                {professional.portfolio.length > 1 && (
                  <button
                    className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10 p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => 
                        prev === professional.portfolio.length - 1 ? 0 : prev + 1
                      );
                    }}
                    data-testid="lightbox-next"
                  >
                    <ChevronRight className="h-10 w-10" />
                  </button>
                )}

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  {lightboxIndex + 1} / {professional.portfolio.length}
                </div>
              </div>
            )}

            {/* Working Hours */}
            {professional.workingHours && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="hours-title">
                    <Clock className="h-5 w-5" />
                    Horário de Atendimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4" data-testid="working-hours">
                    {Object.entries(professional.workingHours).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize font-medium">{day}:</span>
                        <span className="text-muted-foreground">{hours || "Fechado"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle data-testid="reviews-title">
                    Avaliações ({reviews.length})
                  </CardTitle>
                  <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-add-review">
                        <Star className="h-4 w-4 mr-2" />
                        Avaliar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Avaliar Profissional</DialogTitle>
                      </DialogHeader>
                      <Form {...reviewForm}>
                        <form onSubmit={reviewForm.handleSubmit((data) => submitReviewMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={reviewForm.control}
                            name="customerName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Seu Nome</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-review-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={reviewForm.control}
                            name="customerEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Seu Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} data-testid="input-review-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={reviewForm.control}
                            name="rating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Avaliação</FormLabel>
                                <FormControl>
                                  <div data-testid="review-rating-input">
                                    <StarRating
                                      rating={field.value}
                                      readonly={false}
                                      onRatingChange={field.onChange}
                                      showTotal={false}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={reviewForm.control}
                            name="comment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Comentário (opcional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="Conte sobre sua experiência..."
                                    maxLength={300}
                                    data-testid="textarea-review-comment"
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
                              onClick={() => setShowReviewDialog(false)}
                              data-testid="button-cancel-review"
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={submitReviewMutation.isPending}
                              data-testid="button-submit-review"
                            >
                              {submitReviewMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-4" data-testid="reviews-loading">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8" data-testid="no-reviews">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Ainda não há avaliações para este profissional</p>
                    <p className="text-sm text-muted-foreground">Seja o primeiro a avaliar!</p>
                  </div>
                ) : (
                  <div className="space-y-6" data-testid="reviews-list">
                    {reviews.map((review: Review) => (
                      <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0" data-testid={`review-${review.id}`}>
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {review.customerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium" data-testid={`review-customer-${review.id}`}>
                                {review.customerName}
                              </span>
                              <StarRating rating={review.rating} showTotal={false} size="sm" />
                              <span className="text-sm text-muted-foreground" data-testid={`review-date-${review.id}`}>
                                {new Date(review.createdAt || new Date()).toLocaleDateString("pt-BR")}
                              </span>
                              {review.isVerified && (
                                <Badge variant="secondary" className="text-xs" data-testid={`review-verified-${review.id}`}>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verificado
                                </Badge>
                              )}
                            </div>
                            {review.comment && (
                              <p className="text-muted-foreground" data-testid={`review-comment-${review.id}`}>
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="contact-title">Entrar em Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Para usar o WhatsApp, preencha:</h4>
                    <Form {...whatsappForm}>
                      <form onSubmit={whatsappForm.handleSubmit((data) => submitWhatsAppMutation.mutate(data))} className="space-y-3">
                        <FormField
                          control={whatsappForm.control}
                          name="customerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Seu nome" data-testid="input-whatsapp-name-direct" />
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
                                  data-testid="input-whatsapp-phone-direct" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          disabled={submitWhatsAppMutation.isPending}
                          data-testid="button-whatsapp-submit-direct"
                        >
                          <FaWhatsapp className="h-4 w-4 mr-2" />
                          {submitWhatsAppMutation.isPending ? "Enviando..." : "Falar no WhatsApp"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Professional Info */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="info-title">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    className={professional.status === "active" ? "bg-green-100 text-green-800" : ""}
                    data-testid="professional-status"
                  >
                    {professional.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avaliações:</span>
                  <span data-testid="total-reviews">{professional.totalReviews || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nota média:</span>
                  <span className="font-medium" data-testid="average-rating">
                    {parseFloat(professional.rating || "0").toFixed(1)}
                  </span>
                </div>

                {professional.website && (
                  <div>
                    <Separator className="my-4" />
                    <a 
                      href={professional.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                      data-testid="professional-website"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Site do profissional
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
