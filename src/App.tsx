import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import Dashboard from "./pages/Dashboard";
import Lancamento from "./pages/Lancamento";
import Relatorios from "./pages/Relatorios";
import Categorias from "./pages/Categorias";
import Notificacoes from "./pages/Notificacoes";
import Perfil from "./pages/Perfil";
import FolhaPagamento from "./pages/FolhaPagamento";
import FuncionarioDetalhes from "./pages/FuncionarioDetalhes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lancamento" element={<Lancamento />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/folha-pagamento" element={<FolhaPagamento />} />
          <Route path="/funcionarios/:id" element={<FuncionarioDetalhes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;