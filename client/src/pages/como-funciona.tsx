import { CheckCircle, Search, Star, Phone, Shield, TrendingUp, MessageSquare, MapPin } from "lucide-react";

export default function ComoFunciona() {
  const steps = [
    {
      icon: <Search className="h-12 w-12 text-primary" />,
      title: "1. Busque o Serviço",
      description: "Selecione a categoria de serviço que você precisa e informe sua localização para encontrar profissionais próximos.",
    },
    {
      icon: <Star className="h-12 w-12 text-primary" />,
      title: "2. Compare e Escolha", 
      description: "Veja o perfil dos profissionais, suas avaliações, portfólio e escolha o que melhor atende suas necessidades.",
    },
    {
      icon: <Phone className="h-12 w-12 text-primary" />,
      title: "3. Entre em Contato",
      description: "Converse diretamente com o profissional via WhatsApp ou telefone para negociar valores e agendar o serviço.",
    },
  ];

  const benefits = [
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Profissionais Verificados",
      description: "Todos os profissionais passam por um processo de verificação e pagam uma mensalidade para manter seu perfil ativo.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Sistema de Ranking",
      description: "Os profissionais são rankeados por categoria baseado em avaliações reais de clientes.",
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: "Avaliações Reais",
      description: "Sistema de avaliações com comentários de clientes que realmente contrataram os serviços.",
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Busca por Localização",
      description: "Encontre profissionais próximos à sua região para maior comodidade e menor custo.",
    },
  ];

  return (
    <div className="min-h-screen" data-testid="como-funciona-page">
      <title>Como Funciona - Monte Everest</title>
      <meta name="description" content="Saiba como a plataforma Monte Everest funciona. Processo simples em 3 passos para encontrar e contratar os melhores profissionais da sua região." />
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6" data-testid="page-title">
              Como Funciona
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="page-subtitle">
              Nossa plataforma conecta você com os melhores profissionais da sua região de forma simples e segura
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            {steps.map((step, index) => (
              <div key={index} className="text-center" data-testid={`step-${index + 1}`}>
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4" data-testid={`step-title-${index + 1}`}>
                  {step.title}
                </h3>
                <p className="text-muted-foreground" data-testid={`step-description-${index + 1}`}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="bg-muted/30 rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center" data-testid="benefits-title">
              Por que escolher o Monte Everest?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start" data-testid={`benefit-${index + 1}`}>
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2" data-testid={`benefit-title-${index + 1}`}>
                      {benefit.title}
                    </h4>
                    <p className="text-muted-foreground" data-testid={`benefit-description-${index + 1}`}>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
