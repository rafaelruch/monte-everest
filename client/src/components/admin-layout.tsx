import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FolderOpen,
  Package,
  Settings,
  LogOut
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/entrar");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const navigationItems = [
    {
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/admin/professionals",
      icon: Users,
      label: "Profissionais",
    },
    {
      href: "/admin/payments",
      icon: CreditCard,
      label: "Pagamentos",
    },
    {
      href: "/admin/categories",
      icon: FolderOpen,
      label: "Categorias",
    },
    {
      href: "/admin/plans",
      icon: Package,
      label: "Planos",
    },
    {
      href: "/admin/configurations",
      icon: Settings,
      label: "Configurações",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-[#3C8BAB] to-[#53C3F3] shadow-lg">
        <div className="p-6">
          <Link href="/admin/dashboard">
            <h1 className="text-2xl font-bold text-white cursor-pointer">
              Monte Everest
            </h1>
          </Link>
          <p className="text-blue-100 text-sm mt-1">Painel Administrativo</p>
        </div>

        <nav className="mt-8 px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg mb-2 text-white hover:bg-white/10 transition-colors ${
                  isActive ? 'bg-white/20' : ''
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}