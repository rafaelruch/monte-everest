import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";
import NavigationHeader from "@/components/navigation-header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-404-title">
              Página não encontrada
            </h1>
            
            <p className="text-gray-600 mb-6" data-testid="text-404-description">
              A página que você está procurando não existe ou foi movida.
            </p>

            <Link href="/">
              <Button className="w-full" data-testid="button-go-home">
                <Home className="mr-2 h-4 w-4" />
                Voltar para a Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
