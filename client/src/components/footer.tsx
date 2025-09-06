import { Link } from "wouter";
import logoPath from "@assets/logo-monteeverest_1757122359057.png";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <img 
              src={logoPath} 
              alt="Monte Everest" 
              className="h-12 w-auto mb-4"
              data-testid="footer-brand"
            />
            <p className="text-muted-foreground mb-4" data-testid="footer-description">
              A plataforma que conecta você com os melhores profissionais da sua região.
              Qualidade garantida através de avaliações reais.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-facebook">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-instagram">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-linkedin">
                <i className="fab fa-linkedin text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4" data-testid="footer-links-title">
              Links Úteis
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/como-funciona" data-testid="footer-link-como-funciona">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Como Funciona
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/seja-profissional" data-testid="footer-link-seja-profissional">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Seja um Profissional
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/buscar" data-testid="footer-link-categorias">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Categorias
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/pagina/suporte" data-testid="footer-link-suporte">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Suporte
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4" data-testid="footer-legal-title">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/pagina/termos-uso" data-testid="footer-link-terms">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Termos de Uso
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/pagina/politica-privacidade" data-testid="footer-link-privacy">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Política de Privacidade
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/pagina/politica-cookies" data-testid="footer-link-cookies">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Política de Cookies
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/pagina/lgpd" data-testid="footer-link-lgpd">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    LGPD
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground" data-testid="footer-copyright">
            &copy; {new Date().getFullYear()} Monte Everest. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
