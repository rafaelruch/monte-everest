import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import logoPath from "@assets/logo-monteeverest_1757122359057.png";

export default function NavigationHeader() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/", current: location === "/" },
    { name: "Ranking", href: "/ranking", current: location === "/ranking" },
    { name: "Como Funciona", href: "/como-funciona", current: location === "/como-funciona" },
    { name: "Seja um Profissional", href: "/seja-profissional", current: location === "/seja-profissional" },
  ];

  return (
    <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-50" data-testid="navigation-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" data-testid="logo-link">
                <img 
                  src={logoPath} 
                  alt="Monte Everest" 
                  className="h-20 w-auto"
                />
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                    item.current
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}>
                    {item.name}
                  </span>
                </Link>
              ))}
              <Link href="/professional-login" data-testid="nav-link-portal-profissional">
                <Button size="sm" data-testid="button-portal-profissional">
                  Portal do Profissional
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="mobile-menu-trigger">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col space-y-4 mt-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      data-testid={`mobile-nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span className={`block px-3 py-2 rounded-md text-base font-medium transition-colors hover:text-primary cursor-pointer ${
                        item.current
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}>
                        {item.name}
                      </span>
                    </Link>
                  ))}
                  <Link href="/professional-login" onClick={() => setIsOpen(false)} data-testid="mobile-nav-link-portal-profissional">
                    <Button className="w-full" data-testid="mobile-button-portal-profissional">
                      Portal do Profissional
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
