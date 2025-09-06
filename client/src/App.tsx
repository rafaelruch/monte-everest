import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import InstallationGuard from "@/components/installation-guard";
import NavigationHeader from "@/components/navigation-header";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import ComoFunciona from "@/pages/como-funciona";
import SejaProfissional from "@/pages/seja-profissional";
import Entrar from "@/pages/entrar";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminCategories from "@/pages/admin-categories";
import AdminPlans from "@/pages/admin-plans";
import AdminConfigurations from "@/pages/admin-configurations";
import ProfessionalCheckout from "@/pages/professional-checkout";
import SearchResults from "@/pages/search-results";
import ProfessionalProfile from "@/pages/professional-profile";
import ProfessionalLogin from "@/pages/professional-login";
import ProfessionalDashboard from "@/pages/professional-dashboard";
import Installation from "@/pages/installation";
import PageContent from "@/pages/page-content";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Admin routes - sem header/footer */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/plans" component={AdminPlans} />
      <Route path="/admin/configurations" component={AdminConfigurations} />
      
      {/* Professional dashboard - sem header/footer */}
      <Route path="/professional-dashboard" component={ProfessionalDashboard} />
      
      {/* Public routes - com header/footer */}
      <Route>
        {() => (
          <>
            <NavigationHeader />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/como-funciona" component={ComoFunciona} />
              <Route path="/seja-profissional" component={SejaProfissional} />
              <Route path="/entrar" component={Entrar} />
              <Route path="/buscar" component={SearchResults} />
              <Route path="/profissional/:id" component={ProfessionalProfile} />
              <Route path="/professional-login" component={ProfessionalLogin} />
              <Route path="/professional-checkout" component={ProfessionalCheckout} />
              <Route path="/install" component={Installation} />
              <Route path="/pagina/:slug" component={PageContent} />
              <Route component={NotFound} />
            </Switch>
            <Footer />
          </>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <InstallationGuard>
          <Router />
        </InstallationGuard>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
