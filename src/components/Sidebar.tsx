import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  BarChart2,
  LogOut,
  Menu,
  Shapes,
  UserCircle,
  Users,
  DollarSign,
  Settings,
  X,
  ChevronRight,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    to: "/dashboard",
    description: "Visão geral das finanças"
  },
  {
    label: "Lançamentos",
    icon: <List className="w-5 h-5" />,
    to: "/lancamento",
    description: "Gerenciar transações"
  },
  {
    label: "Relatórios",
    icon: <BarChart2 className="w-5 h-5" />,
    to: "/relatorios",
    description: "Análises e gráficos"
  },
  {
    label: "Categorias",
    icon: <Shapes className="w-5 h-5" />,
    to: "/categorias",
    description: "Organizar transações"
  },
  {
    label: "Notificações",
    icon: <Bell className="w-5 h-5" />,
    to: "/notificacoes",
    description: "WhatsApp e mensagens"
  },
  {
    label: "Folha de Pagamento",
    icon: <Users className="w-5 h-5" />,
    to: "/folha-pagamento",
    description: "Gestão de funcionários"
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || "");
          // Usar o nome do email como nome do usuário
          const emailName = user.email?.split('@')[0] || "Usuário";
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Manter valores padrão se houver erro
        setUserName("Usuário");
        setUserEmail("");
      }
    };
    fetchUser();
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-30 bg-white dark:bg-slate-800 border rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </button>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          } md:translate-x-0 md:static md:flex md:shadow-lg`}
      >
        {/* Mobile Close Button */}
        <button
          className="md:hidden absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => setOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FinanceiroApp
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestão financeira completa
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="mb-2 px-3">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Menu Principal
            </h2>
          </div>

          <ul className="space-y-1.5">
            {navItems.map(item => {
              const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 text-blue-700 dark:text-blue-400 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    tabIndex={0}
                    onClick={() => setOpen(false)}
                  >
                    <div className={`p-1.5 rounded-md mr-3 ${isActive
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      }`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <Separator className="my-4 opacity-50" />

          {/* Quick Actions */}
          <div className="mb-2 px-3">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ações Rápidas
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 px-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              className="h-auto py-3 flex flex-col items-center justify-center gap-1 border-dashed"
              onClick={() => navigate("/lancamento")}
            >
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-xs">Nova Receita</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-auto py-3 flex flex-col items-center justify-center gap-1 border-dashed"
              onClick={() => navigate("/lancamento")}
            >
              <List className="w-5 h-5 text-red-600" />
              <span className="text-xs">Nova Despesa</span>
            </Button>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Avatar className="w-10 h-10 mr-3 border-2 border-slate-200 dark:border-slate-700">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="font-medium text-sm">{userName}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {userEmail}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" side="top" align="start">
              <div className="flex flex-col gap-1 p-2">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-12 h-12 border-2 border-slate-200 dark:border-slate-700">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{userName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</div>
                  </div>
                </div>

                <Separator className="my-2" />

                <Link
                  to="/perfil"
                  className="flex items-center w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <UserCircle className="w-4 h-4 mr-2 text-slate-500" />
                  Meu Perfil
                </Link>

                <Link
                  to="/perfil"
                  className="flex items-center w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Settings className="w-4 h-4 mr-2 text-slate-500" />
                  Configurações
                </Link>

                <div className="px-3 py-2">
                  <ThemeToggle />
                </div>

                <Separator className="my-2" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-3 py-2 text-sm rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da conta
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </aside>
    </>
  );
}