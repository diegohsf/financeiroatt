import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  ArrowRight, 
  CheckCircle,
  DollarSign,
  PieChart,
  Calendar,
  Users
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      title: "Dashboard Inteligente",
      description: "Visualize suas finanças com gráficos interativos e relatórios detalhados"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Análise de Tendências",
      description: "Acompanhe o crescimento e identifique padrões nos seus gastos"
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: "Segurança Total",
      description: "Seus dados protegidos com criptografia de ponta a ponta"
    },
    {
      icon: <Smartphone className="h-8 w-8 text-orange-600" />,
      title: "Acesso Mobile",
      description: "Interface responsiva para gerenciar suas finanças em qualquer lugar"
    }
  ];

  const benefits = [
    "Controle total sobre receitas e despesas",
    "Categorização automática de transações",
    "Relatórios personalizáveis",
    "Gestão de folha de pagamento",
    "Backup automático na nuvem",
    "Suporte técnico especializado"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-800 dark:text-white">FinanceiroApp</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button onClick={() => navigate("/cadastro")}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-6">
          ✨ Novo: Dashboard com IA integrada
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-slate-800 dark:text-white mb-6 leading-tight">
          Transforme sua
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> gestão financeira</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          A plataforma completa para controlar suas finanças pessoais e empresariais. 
          Dashboards inteligentes, relatórios automáticos e insights que impulsionam seu crescimento.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="text-lg px-8 py-4" onClick={() => navigate("/cadastro")}>
            Começar Gratuitamente
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-4" onClick={() => navigate("/login")}>
            Ver Demo
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Recursos Poderosos
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Tudo que você precisa para ter controle total das suas finanças
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-slate-600 dark:text-slate-300">Usuários Ativos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">R$ 50M+</div>
              <div className="text-slate-600 dark:text-slate-300">Transações Processadas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-slate-600 dark:text-slate-300">Uptime Garantido</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-slate-600 dark:text-slate-300">Suporte Técnico</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-6">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              Desenvolvida especificamente para atender às necessidades do mercado brasileiro, 
              com integração completa aos principais bancos e sistemas de pagamento.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center border-0 shadow-lg">
              <PieChart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Relatórios Visuais</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Gráficos interativos e dashboards personalizáveis</p>
            </Card>
            <Card className="p-6 text-center border-0 shadow-lg">
              <Calendar className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Planejamento</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Orçamentos e metas financeiras inteligentes</p>
            </Card>
            <Card className="p-6 text-center border-0 shadow-lg">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Equipe</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Gestão colaborativa para empresas</p>
            </Card>
            <Card className="p-6 text-center border-0 shadow-lg">
              <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Segurança</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Proteção bancária e compliance total</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de usuários que já revolucionaram sua gestão financeira
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4" onClick={() => navigate("/cadastro")}>
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-blue-600" onClick={() => navigate("/login")}>
              Fazer Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <DollarSign className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">FinanceiroApp</span>
          </div>
          <p className="text-slate-400 mb-4">
            A plataforma mais completa para gestão financeira do Brasil
          </p>
          <p className="text-slate-500 text-sm">
            © 2025 FinanceiroApp. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
