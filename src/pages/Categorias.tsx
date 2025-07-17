import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Pencil, Trash2, PlusCircle, ArrowLeft, RefreshCw, Tag, TrendingUp, TrendingDown } from "lucide-react";
import AuthedLayout from "@/components/AuthedLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

type Categoria = { id: string; nome: string; tipo: "receita" | "despesa"; };

const CategoriaForm = ({ categoria, onSave }: { categoria?: Categoria | null; onSave: () => void; }) => {
  const [nome, setNome] = useState(categoria?.nome || "");
  const [tipo, setTipo] = useState<"receita" | "despesa">(categoria?.tipo || "despesa");
  const [loading, setLoading] = useState(false);
  const isEditing = !!categoria;

  const handleSubmit = async () => {
    if (!nome.trim()) {
      showError("O nome da categoria é obrigatório.");
      return;
    }
    setLoading(true);
    const { error } = isEditing
      ? await supabase.from("categorias").update({ nome, tipo }).eq("id", categoria.id)
      : await supabase.from("categorias").insert({ nome, tipo });
    
    setLoading(false);
    if (error) {
      showError(`Erro ao ${isEditing ? 'atualizar' : 'criar'} categoria.`);
    } else {
      showSuccess(`Categoria ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
      onSave();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nome da Categoria</label>
        <Input 
          value={nome} 
          onChange={e => setNome(e.target.value)} 
          placeholder="Ex: Alimentação, Transporte, Salário..." 
          className="h-11 border-2 focus:border-blue-500 transition-colors"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo</label>
        <Select value={tipo} onValueChange={v => setTipo(v as any)}>
          <SelectTrigger className="h-11 border-2 focus:border-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="receita">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                💰 Receita
              </div>
            </SelectItem>
            <SelectItem value="despesa">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                💸 Despesa
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="h-11 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
        >
          {loading ? "Salvando..." : isEditing ? "Atualizar Categoria" : "Criar Categoria"}
        </Button>
      </DialogFooter>
    </div>
  );
};

const Categorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("categorias").select("*").order("nome");
      if (error) {
        showError("Erro ao buscar categorias.");
      } else {
        setCategorias(data || []);
      }
      setLoading(false);
    };
    fetchCategorias();
  }, [refreshKey]);

  const handleSave = () => {
    setIsFormOpen(false);
    setSelectedCategoria(null);
    setRefreshKey(k => k + 1);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) {
      showError("Erro ao excluir categoria. Verifique se ela não está em uso.");
    } else {
      showSuccess("Categoria excluída!");
      setRefreshKey(k => k + 1);
    }
  };

  const receitasCount = categorias.filter(c => c.tipo === "receita").length;
  const despesasCount = categorias.filter(c => c.tipo === "despesa").length;

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
                  Gerenciar Categorias
                </h1>
                <p className="text-muted-foreground text-lg">
                  Organize suas receitas e despesas por categoria
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRefreshKey(k => k + 1)}
              className="h-11 w-11 border-2 hover:border-green-300 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-green-600" />
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setSelectedCategoria(null)}
                  className="h-11 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    {selectedCategoria ? "Editar" : "Nova"} Categoria
                  </DialogTitle>
                </DialogHeader>
                <CategoriaForm categoria={selectedCategoria} onSave={handleSave} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Categorias</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {categorias.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Tag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categorias de Receita</p>
                  <p className="text-2xl font-bold text-green-600">
                    {receitasCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categorias de Despesa</p>
                  <p className="text-2xl font-bold text-red-600">
                    {despesasCount}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Lista de Categorias</CardTitle>
                <CardDescription className="mt-1">
                  Gerencie todas as suas categorias de receitas e despesas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : categorias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                  <Tag className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Nenhuma categoria encontrada
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie sua primeira categoria para organizar suas finanças
                </p>
                <Button 
                  onClick={() => setIsFormOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="font-semibold">Nome</TableHead>
                      <TableHead className="font-semibold">Tipo</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorias.map(cat => (
                      <TableRow key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${cat.tipo === 'receita' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                              {cat.tipo === 'receita' ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <span className="font-semibold">{cat.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`font-medium ${
                              cat.tipo === 'receita' 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {cat.tipo === 'receita' ? '💰 Receita' : '💸 Despesa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => { setSelectedCategoria(cat); setIsFormOpen(true); }}
                              className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            >
                              <Pencil className="w-4 h-4 text-blue-600" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <Trash2 className="h-5 w-5 text-red-600" />
                                    Confirmar Exclusão
                                  </AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a categoria <strong>"{cat.nome}"</strong>? 
                                  Esta ação não pode ser desfeita e pode afetar lançamentos existentes.
                                </AlertDialogDescription>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(cat.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir Categoria
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthedLayout>
  );
};

export default Categorias;