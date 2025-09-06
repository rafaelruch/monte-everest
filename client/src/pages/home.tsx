import HeroSection from "@/components/hero-section";
import ServiceCategories from "@/components/service-categories";
import FeaturedProfessionals from "@/components/featured-professionals";

export default function Home() {
  return (
    <div data-testid="home-page">
      <title>Monte Everest - Encontre os Melhores Profissionais da Sua Região</title>
      <meta name="description" content="Plataforma que conecta você com prestadores de serviços qualificados e avaliados. Encontre profissionais de limpeza, eletricista, encanador, pintor e muito mais." />
      
      <HeroSection />
      <ServiceCategories />
      <FeaturedProfessionals />
    </div>
  );
}
