import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PageContent() {
  const params = useParams<{ slug: string }>();
  
  const { data: page, isLoading, error } = useQuery({
    queryKey: [`/api/pages/${params.slug}`],
    queryFn: async () => {
      const response = await fetch(`/api/pages/${params.slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Página não encontrada");
        }
        throw new Error("Erro ao carregar página");
      }
      return response.json();
    },
    enabled: !!params.slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando página...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {error?.message === "Página não encontrada" ? "Página Não Encontrada" : "Erro"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error?.message === "Página não encontrada"
              ? "A página que você está procurando não foi encontrada."
              : "Ocorreu um erro ao carregar a página. Tente novamente mais tarde."
            }
          </p>
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  if (!page.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Página Indisponível</h1>
          <p className="text-muted-foreground mb-6">
            Esta página está temporariamente indisponível.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      {page.metaDescription && (
        <meta name="description" content={page.metaDescription} />
      )}
      <title>{page.title} - Monte Everest</title>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-lg max-w-none">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {page.title}
            </h1>
            {page.metaDescription && (
              <p className="text-xl text-muted-foreground">
                {page.metaDescription}
              </p>
            )}
          </header>
          
          <div 
            className="content text-foreground leading-relaxed prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
            style={{
              lineHeight: '1.8',
              fontSize: '1.1rem'
            }}
          />
          
          <footer className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date(page.updatedAt).toLocaleDateString("pt-BR")}
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}