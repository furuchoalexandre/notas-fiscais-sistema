import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Notas from "./pages/Notas";
import ImportarXml from "./pages/ImportarXml";
import NovaNotaManual from "./pages/NovaNotaManual";
import GerenciarStatus from "./pages/GerenciarStatus";
import GerenciarTipos from "./pages/GerenciarTipos";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/setup" component={Setup} />
      <Route path="/notas" component={Notas} />
      <Route path="/notas/importar" component={ImportarXml} />
      <Route path="/notas/nova" component={NovaNotaManual} />
      <Route path="/configuracoes/status" component={GerenciarStatus} />
      <Route path="/configuracoes/tipos" component={GerenciarTipos} />
      <Route path="/configuracoes/usuarios" component={GerenciarUsuarios} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
