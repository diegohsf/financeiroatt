import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Pencil, 
  Trash2, 
  Repeat, 
  PlusCircle, 
  FileText, 
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Eye,
  MoreHorizontal,
  RefreshCw,
  BarChart3,
  Users
} from "lucide-react";
import ResumoCard from "@/components/ResumoCard";
import AuthedLayout from "@/components/AuthedLayout";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

type Categoria = { id: string; nome: string; tipo: string; };
type Lancamento = {
  id: string;
  tipo: string;
  data: string;
  descricao: string;
  valor: number;
  categoria_id: string;
  forma_pagamento: string;
  cartao_usado: string | null;
  is_recorrente: boolean;
  nota_fiscal_url: string | null;
  categoria: { nome: string }[] | null;
};

const ITEMS_PER_PAGE = 10;
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", "#FFBB28", "#FF4444", "#A4DE6C", "#D0ED57", "#83A6ED", "#8DD1E1", "#82CA9D", "#A4DE6C", "#D0ED57", "#C70039"]; // Cores para o gráfico de pizza

const Dashboard = () => {
  const navigate = useNavigate();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });

  const [saldoAtual, setSaldoAtual] = useState(0);
  const [totalReceitas, setTotalReceitas] = useState(0);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [gastoFixo, setGastoFixo] = useState(0);
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]); // Estado para os dados do gráfico de pizza

  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      setLoadingSummary(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data, error } = await supabase.from("lancamentos_financeiros").select("tipo, valor, is_recorrente, categoria:categorias(nome)").gte("data", format(dateRange.from, "yyyy-MM-dd")).lte("data", format(dateRange.to, "yyyy-MM-dd"));
      if (error) { 
        showError("Erro ao buscar o resumo financeiro."); 
        setSaldoAtual(0); 
        setTotalReceitas(0); 
        setTotalDespesas(0);
        setGastoFixo(0);
        setPieData([]);
      }
      else if (data) {
        const receitas = data.filter(l => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
        const despesas = data.filter(l => l.tipo === "despesa");
        const totalDespesasValor = despesas.reduce((acc, l) => acc + l.valor, 0);
        const gastoFixoValor = despesas.filter(l => l.is_recorrente).reduce((acc, l) => acc + l.valor, 0);

        setTotalReceitas(receitas);
        setTotalDespesas(totalDespesasValor);
        setGastoFixo(gastoFixoValor);
        setSaldoAtual(receitas - totalDespesasValor);

        // Preparar dados para o gráfico de pizza
        const pieChartData = Object.entries(despesas.reduce((acc: any, l) => {
          const categoriaNome = l.categoria?.[0]?.nome || "Outros";
          if (!acc[categoriaNome]) acc[categoriaNome] = 0;
          acc[categoriaNome] += l.valor;
          return acc;
        }, {})).map(([name, value]) => ({ name, value: Number(value) }));
        setPieData(pieChartData);
      }
      setLoadingSummary(false);
    };
    fetchSummaryData();
  }, [navigate, dateRange, refreshKey]);

  useEffect(() => {
    const fetchTableData = async () => {
      setLoadingTable(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      let query = supabase.from("lancamentos_financeiros").select("*, categoria:categorias(*)", { count: "exact" }).eq("user_id", user.id);
      if (searchTerm) query = query.ilike("descricao", `%${searchTerm}%`);
      const { data, error, count } = await query.order("data", { ascending: false }).range(from, to);
      if (error) { showError("Erro ao buscar lançamentos."); }
      else { setLancamentos(data || []); setTotalCount(count || 0); }
      setLoadingTable(false);
    };
    fetchTableData();
  }, [navigate, currentPage, searchTerm, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este lançamento?")) return;
    const { error } = await supabase.from("lancamentos_financeiros").delete().eq("id", id);
    if (error) { showError("Erro ao excluir lançamento."); }
    else { showSuccess("Lançamento excluído!"); setRefreshKey(oldKey => oldKey + 1); }
  };

  const handleEdit = (id: string) => navigate(`/lancamento?id=${id}`);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <AuthedLayout>
      <div className="w-full max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Dashboard Financeiro
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe suas finanças em tempo real
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal h-11 border-2 hover:border-blue-300 transition-colors">
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <span className="font-medium">
                        {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    ) : (
                      format(dateRange.from, "PPP", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar 
                  initialFocus 
                  mode="range" 
                  defaultMonth={dateRange?.from} 
                  selected={dateRange} 
                  onSelect={setDateRange} 
                  numberOfMonths={2} 
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-11 w-11 border-2 hover:border-green-300 transition-colors"
              onClick={() => setRefreshKey(old => old + 1)}
            >
              <RefreshCw className="h-4 w-4 text-green-600" />
            </Button>
            
            <Button 
              className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => navigate("/lancamento")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {loadingSummary ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <ResumoCard tipo="saldo" valor={saldoAtual} />
              <ResumoCard tipo="receita" valor={totalReceitas} />
              <ResumoCard tipo="gastoFixo" valor={gastoFixo} />
              <ResumoCard tipo="gastoTotal" valor={totalDespesas} />
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <PieChart className="h-5 w-5 text-blue-600" />
                    </div>
                    Despesas por Categoria
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Distribuição dos seus gastos no período selecionado
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                  <div className="flex justify-center space-x-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-20" />
                    ))}
                  </div>
                </div>
              ) : pieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                    <PieChart className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Nenhuma despesa encontrada
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione alguns lançamentos para ver os gráficos
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => [
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                          'Valor'
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2">
                    {pieData.slice(0, 6).map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate font-medium">{entry.name}</span>
                        <span className="text-muted-foreground ml-auto">
                          R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                Acesse rapidamente as funcionalidades principais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start h-12 border-2 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200"
                  onClick={() => navigate("/lancamento")}
                >
                  <PlusCircle className="mr-3 h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Novo Lançamento</div>
                    <div className="text-xs text-muted-foreground">Adicionar receita ou despesa</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-12 border-2 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-200"
                  onClick={() => navigate("/relatorios")}
                >
                  <BarChart3 className="mr-3 h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Relatórios</div>
                    <div className="text-xs text-muted-foreground">Análises detalhadas</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-12 border-2 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all duration-200"
                  onClick={() => navigate("/categorias")}
                >
                  <Filter className="mr-3 h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Categorias</div>
                    <div className="text-xs text-muted-foreground">Gerenciar categorias</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-12 border-2 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all duration-200"
                  onClick={() => navigate("/folha-pagamento")}
                >
                  <Users className="mr-3 h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Folha de Pagamento</div>
                    <div className="text-xs text-muted-foreground">Gestão de funcionários</div>
                  </div>
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Última atualização</span>
                  <span className="font-medium">
                    {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  Lançamentos Recentes
                </CardTitle>
                <CardDescription className="mt-1">
                  Todos os seus lançamentos financeiros
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden md:flex items-center gap-1 h-9 border-dashed"
                  onClick={() => {
                    // Aqui poderia implementar uma função para exportar os dados
                    showSuccess("Exportação iniciada!");
                  }}
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                <Button 
                  className="h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                  size="sm"
                  onClick={() => navigate("/lancamento")}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Lançamento
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por descrição..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-9 h-10 border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 gap-1">
                      <Filter className="h-4 w-4" />
                      Filtros
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Filtrar Lançamentos</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="justify-start">Receitas</Button>
                          <Button variant="outline" size="sm" className="justify-start">Despesas</Button>
                          <Button variant="outline" size="sm" className="justify-start">Recorrentes</Button>
                          <Button variant="outline" size="sm" className="justify-start">Com Nota</Button>
                        </div>
                        <div className="pt-2 flex justify-between">
                          <Button variant="ghost" size="sm">Limpar</Button>
                          <Button size="sm">Aplicar</Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10">
                      Ordenar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Mais recentes</DropdownMenuItem>
                    <DropdownMenuItem>Mais antigos</DropdownMenuItem>
                    <DropdownMenuItem>Maior valor</DropdownMenuItem>
                    <DropdownMenuItem>Menor valor</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="font-medium">Data</TableHead>
                    <TableHead className="font-medium">Descrição</TableHead>
                    <TableHead className="font-medium">Categoria</TableHead>
                    <TableHead className="font-medium">Tipo</TableHead>
                    <TableHead className="font-medium">Valor</TableHead>
                    <TableHead className="font-medium">Nota</TableHead>
                    <TableHead className="text-right font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTable ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : lancamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                            <FileText className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-muted-foreground">Nenhum lançamento encontrado.</p>
                          <Button 
                            variant="link" 
                            onClick={() => navigate("/lancamento")}
                            className="mt-2"
                          >
                            Adicionar um lançamento
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lancamentos.map(l => (
                      <TableRow key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-medium">
                          {format(new Date(l.data), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {l.descricao}
                            {l.is_recorrente && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="h-5 px-1 flex items-center gap-1 border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400">
                                    <Repeat className="w-3 h-3" />
                                    <span className="text-[10px]">Recorrente</span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Lançamento Recorrente</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {(() => {
                              // Função para obter o nome da categoria de forma consistente
                              if (l.categoria) {
                                if (Array.isArray(l.categoria) && l.categoria.length > 0) {
                                  return l.categoria[0].nome;
                                } else if (typeof l.categoria === 'object' && l.categoria !== null) {
                                  return l.categoria.nome;
                                }
                              }
                              return "Sem categoria";
                            })()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {l.tipo === "receita" ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50">
                              Receita
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50">
                              Despesa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={`font-medium ${l.tipo === "receita" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          R$ {l.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {l.nota_fiscal_url ? (
                            <a 
                              href={l.nota_fiscal_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md inline-flex hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800" 
                              onClick={() => handleEdit(l.id)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600" 
                              onClick={() => handleDelete(l.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium">{lancamentos.length}</span> de <span className="font-medium">{totalCount}</span> lançamentos
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      // Mostrar apenas 5 páginas com elipses
                      if (
                        i === 0 || // Primeira página
                        i === totalPages - 1 || // Última página
                        (i >= currentPage - 2 && i <= currentPage) || // 2 páginas antes da atual
                        (i >= currentPage && i <= currentPage + 1) // 1 página depois da atual
                      ) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink 
                              href="#" 
                              isActive={currentPage === i + 1} 
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        (i === 1 && currentPage > 3) || // Elipse após a primeira página
                        (i === totalPages - 2 && currentPage < totalPages - 2) // Elipse antes da última página
                      ) {
                        return <PaginationItem key={i}>...</PaginationItem>;
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthedLayout>
  );
};

export default Dashboard;