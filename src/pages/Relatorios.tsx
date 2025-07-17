import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { 
  Calendar as CalendarIcon, 
  Repeat, 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Filter, 
  Download, 
  RefreshCw,
  ArrowLeft,
  FileText,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthedLayout from "@/components/AuthedLayout";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  categoria: { nome: string }[] | null; // Changed this to reflect the array type inferred by TS
};

const ITEMS_PER_PAGE = 10;
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", "#FFBB28", "#FF4444"];

const Relatorios = () => {
  const [allLancamentos, setAllLancamentos] = useState<Lancamento[]>([]);
  const [paginatedLancamentos, setPaginatedLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "receita" | "despesa">("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");
  const [recorrenteFiltro, setRecorrenteFiltro] = useState<"todos" | "sim" | "nao">("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;

      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) { navigate("/login"); return; }
      
      const { data: cats } = await supabase.from("categorias").select("*");
      setCategorias(cats || []);

      // Modificando a consulta para buscar os lançamentos com suas categorias
      let query = supabase
        .from("lancamentos_financeiros")
        .select(`
          *,
          categorias(id, nome, tipo)
        `)
        .eq("user_id", user.id)
        .gte("data", format(dateRange.from, "yyyy-MM-dd"))
        .lte("data", format(dateRange.to, "yyyy-MM-dd"));
      if (tipoFiltro !== "todos") query = query.eq("tipo", tipoFiltro);
      if (categoriaFiltro !== "todos") query = query.eq("categoria_id", categoriaFiltro);
      if (recorrenteFiltro !== "todos") query = query.eq("is_recorrente", recorrenteFiltro === "sim");
      
      const { data, error } = await query.order("data", { ascending: true });
      
      // Log para debug
      console.log("Lançamentos recuperados:", data);
      console.log("Categorias disponíveis:", cats);
      
      if (!error) setAllLancamentos(data || []);
      setLoading(false);
    };
    fetchData();
  }, [tipoFiltro, categoriaFiltro, recorrenteFiltro, dateRange, navigate]);

  useEffect(() => {
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE;
    setPaginatedLancamentos(allLancamentos.slice(from, to));
  }, [currentPage, allLancamentos]);

  const totalPages = Math.ceil(allLancamentos.length / ITEMS_PER_PAGE);

  const barData = Object.values(allLancamentos.reduce((acc: any, l) => {
    const mes = format(parseISO(l.data), "MM/yyyy");
    if (!acc[mes]) acc[mes] = { mes, receita: 0, despesa: 0 };
    if (l.tipo === "receita") acc[mes].receita += l.valor; else acc[mes].despesa += l.valor;
    return acc;
  }, {}));

  // Função auxiliar para obter o nome da categoria
  const getCategoryName = (lancamento: any) => {
    console.log("Buscando categoria para lançamento:", lancamento);
    
    // Se o lançamento já tem o nome da categoria salvo diretamente
    if (lancamento.categoria_nome) {
      return lancamento.categoria_nome;
    }
    
    // Se temos o ID da categoria, buscar pelo ID na lista de categorias
    if (lancamento.categoria_id) {
      console.log("Buscando categoria pelo ID:", lancamento.categoria_id);
      console.log("Categorias disponíveis:", categorias);
      
      const categoriaEncontrada = categorias.find(c => c.id === lancamento.categoria_id);
      if (categoriaEncontrada) {
        console.log("Categoria encontrada:", categoriaEncontrada);
        return categoriaEncontrada.nome;
      }
    }
    
    // Se temos o objeto categoria
    if (lancamento.categoria) {
      if (Array.isArray(lancamento.categoria) && lancamento.categoria.length > 0) {
        return lancamento.categoria[0].nome || "Sem categoria";
      } else if (typeof lancamento.categoria === 'object' && lancamento.categoria !== null) {
        return lancamento.categoria.nome || "Sem categoria";
      }
    }
    
    return "Sem categoria";
  };

  // Preparar dados para o gráfico de pizza
  const pieData = Object.entries(
    allLancamentos
      .filter(l => l.tipo === "despesa")
      .reduce((acc: Record<string, number>, l) => {
        const categoriaNome = getCategoryName(l);
        if (!acc[categoriaNome]) acc[categoriaNome] = 0;
        acc[categoriaNome] += l.valor;
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }));

  let saldo = 0;
  const lineData = allLancamentos.sort((a, b) => a.data.localeCompare(b.data)).map(l => {
    saldo += l.tipo === "receita" ? l.valor : -l.valor;
    return { data: format(parseISO(l.data), "dd/MM"), saldo: Number(saldo.toFixed(2)) };
  });

  return (
    <AuthedLayout>
      <div className="w-full max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="h-10 w-10 border-2 hover:border-blue-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-blue-600" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Relatórios Financeiros
                </h1>
                <p className="text-muted-foreground text-lg">
                  Análises detalhadas das suas finanças
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.location.reload()}
              className="h-11 w-11 border-2 hover:border-green-300 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="outline"
              className="h-11 border-2 hover:border-purple-300 transition-colors"
            >
              <Download className="mr-2 h-4 w-4 text-purple-600" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Filtros de Análise</CardTitle>
                <CardDescription className="mt-1">
                  Configure os parâmetros para personalizar seus relatórios
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo de Lançamento</label>
                <Select value={tipoFiltro} onValueChange={v => setTipoFiltro(v as any)}>
                  <SelectTrigger className="h-11 border-2 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">📊 Todos</SelectItem>
                    <SelectItem value="receita">💰 Receitas</SelectItem>
                    <SelectItem value="despesa">💸 Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
                <Select value={categoriaFiltro} onValueChange={v => setCategoriaFiltro(v)}>
                  <SelectTrigger className="h-11 border-2 focus:border-blue-500">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">🏷️ Todas</SelectItem>
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo de Gasto</label>
                <Select value={recorrenteFiltro} onValueChange={v => setRecorrenteFiltro(v as any)}>
                  <SelectTrigger className="h-11 border-2 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">🔄 Todos</SelectItem>
                    <SelectItem value="sim">📅 Fixos</SelectItem>
                    <SelectItem value="nao">💫 Variáveis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Período</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full h-11 justify-start text-left font-normal border-2 hover:border-blue-300 transition-colors"
                    >
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
                        <span>Selecione o período</span>
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
              </div>
            </div>
          </CardContent>
        </Card>
        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                </CardContent>
              </Card>
            </div>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <Skeleton className="h-[250px] w-full rounded-lg" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <Skeleton className="h-[400px] w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bar Chart */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Receitas vs Despesas</CardTitle>
                      <CardDescription className="mt-1">
                        Comparativo mensal de entradas e saídas
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {barData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                        <BarChart3 className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                        Nenhum dado encontrado
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Adicione lançamentos para visualizar o gráfico
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData as any[]}>
                        <XAxis 
                          dataKey="mes" 
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          formatter={(value: number) => [
                            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                          ]}
                        />
                        <Legend />
                        <Bar 
                          dataKey="receita" 
                          fill="#10b981" 
                          name="Receitas" 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="despesa" 
                          fill="#ef4444" 
                          name="Despesas" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <PieChartIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Despesas por Categoria</CardTitle>
                      <CardDescription className="mt-1">
                        Distribuição dos gastos por categoria
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                        <PieChartIcon className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                        Nenhuma despesa encontrada
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Adicione despesas para visualizar a distribuição
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie 
                            data={pieData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={80}
                            innerRadius={30}
                            paddingAngle={2}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((_, i) => (
                              <Cell 
                                key={i} 
                                fill={COLORS[i % COLORS.length]}
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
                              R$ {Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Line Chart */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">Evolução do Saldo</CardTitle>
                    <CardDescription className="mt-1">
                      Acompanhe a evolução do seu saldo ao longo do tempo
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {lineData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[250px] text-center">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                      <TrendingUp className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Nenhum dado encontrado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione lançamentos para visualizar a evolução do saldo
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={lineData}>
                      <XAxis 
                        dataKey="data" 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <RechartsTooltip 
                        formatter={(value: number) => [
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                          'Saldo'
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="saldo" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                        name="Saldo" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Tabela de Lançamentos</CardTitle>
                      <CardDescription className="mt-1">
                        Detalhamento completo dos lançamentos filtrados
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-normal">
                    {allLancamentos.length} registros
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="font-semibold">Data</TableHead>
                        <TableHead className="font-semibold">Descrição</TableHead>
                        <TableHead className="font-semibold">Categoria</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Valor</TableHead>
                        <TableHead className="font-semibold">Forma</TableHead>
                        <TableHead className="font-semibold">Cartão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLancamentos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                                <FileText className="h-6 w-6 text-slate-400" />
                              </div>
                              <p className="text-muted-foreground">Nenhum lançamento encontrado.</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Ajuste os filtros ou adicione novos lançamentos
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedLancamentos.map(l => (
                          <TableRow key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="font-medium">
                              {format(new Date(l.data), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{l.descricao}</span>
                                {l.is_recorrente && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="h-5 px-1.5 flex items-center gap-1 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                                        <Repeat className="w-3 h-3" />
                                        <span className="text-[10px]">Fixo</span>
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
                              <Badge variant="outline" className="font-normal">
                                {getCategoryName(l)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {l.tipo === "receita" ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                  Receita
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                                  Despesa
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className={`font-semibold ${l.tipo === "receita" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              {l.tipo === "receita" ? "+" : "-"}R$ {l.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{l.forma_pagamento}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {l.cartao_usado || "-"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Mostrando <span className="font-medium">{paginatedLancamentos.length}</span> de <span className="font-medium">{allLancamentos.length}</span> lançamentos
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
                          if (
                            i === 0 || 
                            i === totalPages - 1 || 
                            (i >= currentPage - 2 && i <= currentPage + 1)
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
                            (i === 1 && currentPage > 3) || 
                            (i === totalPages - 2 && currentPage < totalPages - 2)
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
          </>
        )}
      </div>
    </AuthedLayout>
  );
};

export default Relatorios;