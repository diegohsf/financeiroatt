import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, 
  FileText, 
  ArrowLeft, 
  Save, 
  Plus, 
  DollarSign, 
  Receipt, 
  CreditCard,
  Repeat,
  Upload
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import AuthedLayout from "@/components/AuthedLayout";
import NovaCategoriaDialog from "@/components/NovaCategoriaDialog";

const formSchema = z.object({
  tipo: z.enum(["receita", "despesa"], { required_error: "Selecione o tipo." }),
  data: z.date({ required_error: "A data é obrigatória." }),
  descricao: z.string().min(3, { message: "A descrição deve ter pelo menos 3 caracteres." }),
  valor: z.coerce.number().positive({ message: "O valor deve ser maior que zero." }),
  categoriaId: z.string({ required_error: "Selecione uma categoria." }),
  formaPagamento: z.string(),
  cartaoUsado: z.string().optional(),
  isRecorrente: z.boolean(),
  notaFiscal: z.instanceof(FileList).optional(),
});

type Categoria = { id: string; nome: string; tipo: string; };

const Lancamento = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { tipo: "despesa", data: new Date(), descricao: "", valor: 0, isRecorrente: false, formaPagamento: "Dinheiro" },
  });

  const tipo = form.watch("tipo");
  const formaPagamento = form.watch("formaPagamento");
  const notaFiscalRef = form.register("notaFiscal");

  useEffect(() => {
    if (editId) {
      // Edição não suporta alterar a nota fiscal por simplicidade
      // A propriedade 'categoria' não é usada diretamente aqui, mas a consulta a inclui.
      // Para evitar erros de tipo, garantimos que a consulta seja compatível com o tipo Lancamento.
      supabase.from("lancamentos_financeiros").select("*, categoria:categorias(nome)").eq("id", editId).single()
        .then(({ data }) => {
          if (data) {
            form.reset({
              tipo: data.tipo,
              data: new Date(data.data),
              descricao: data.descricao,
              valor: data.valor,
              categoriaId: data.categoria_id,
              formaPagamento: data.forma_pagamento,
              cartaoUsado: data.cartao_usado || "",
              isRecorrente: data.is_recorrente || false,
            });
          }
        });
    }
  }, [editId, form]);

  useEffect(() => {
    if (tipo) {
      supabase.from("categorias").select("*").eq("tipo", tipo).then(({ data }) => { if (data) setCategorias(data); });
    }
  }, [tipo]);

  const handleNovaCategoria = (cat: Categoria) => {
    setCategorias(prev => [...prev, cat]);
    form.setValue("categoriaId", cat.id);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { showError("Usuário não autenticado."); setLoading(false); return; }

    let notaFiscalUrl: string | null = null;
    if (values.notaFiscal && values.notaFiscal.length > 0 && values.tipo === 'despesa') {
      const file = values.notaFiscal[0];
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('notas-fiscais').upload(filePath, file);

      if (uploadError) {
        showError("Erro ao fazer upload da nota fiscal.");
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('notas-fiscais').getPublicUrl(filePath);
      notaFiscalUrl = urlData.publicUrl;
    }

    // Encontrar a categoria selecionada para obter mais informações
    const categoriaEncontrada = categorias.find(c => c.id === values.categoriaId);
    
    if (!values.categoriaId || !categoriaEncontrada) {
      showError("Por favor, selecione uma categoria válida.");
      setLoading(false);
      return;
    }
    
    const lancamentoData = {
      tipo: values.tipo, 
      data: format(values.data, "yyyy-MM-dd"), 
      descricao: values.descricao, 
      valor: values.valor,
      categoria_id: values.categoriaId, // ID da categoria
      forma_pagamento: values.formaPagamento,
      cartao_usado: values.formaPagamento.includes("Cartão") ? values.cartaoUsado : null, 
      is_recorrente: values.isRecorrente,
      nota_fiscal_url: notaFiscalUrl,
    };
    
    // Log para debug
    console.log("Salvando lançamento com categoria:", {
      id: values.categoriaId,
      nome: categoriaEncontrada?.nome,
      categoria_completa: categoriaEncontrada
    });

    // Garantir que categoria_id seja uma string válida
    if (!lancamentoData.categoria_id || lancamentoData.categoria_id === "") {
      showError("Por favor, selecione uma categoria.");
      setLoading(false);
      return;
    }

    // Log adicional para debug
    console.log("Dados do lançamento a serem salvos:", lancamentoData);
    
    const { error } = editId
      ? await supabase.from("lancamentos_financeiros").update(lancamentoData).eq("id", editId)
      : await supabase.from("lancamentos_financeiros").insert({ ...lancamentoData, user_id: user.id });

    setLoading(false);
    if (error) { showError(`Erro ao ${editId ? 'atualizar' : 'salvar'} lançamento.`); }
    else { showSuccess(`Lançamento ${editId ? 'atualizado' : 'adicionado'}!`); navigate("/dashboard"); }
  };

  return (
    <AuthedLayout>
      <div className="w-full max-w-4xl space-y-8">
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
                  {editId ? "Editar Lançamento" : "Novo Lançamento"}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {editId ? "Atualize as informações do lançamento" : "Adicione uma nova receita ou despesa"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="h-11 border-2 hover:border-gray-300 transition-colors"
            >
              Cancelar
            </Button>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
                {editId ? (
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">
                  Informações do Lançamento
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Preencha os dados abaixo para {editId ? "atualizar" : "criar"} o lançamento
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Tipo de Lançamento */}
                <div className="space-y-4">
                  <FormField control={form.control} name="tipo" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        Tipo de Lançamento
                      </FormLabel>
                      <FormControl>
                        <ToggleGroup 
                          type="single" 
                          value={field.value} 
                          onValueChange={field.onChange} 
                          className="grid grid-cols-2 gap-4 mt-3"
                        >
                          <ToggleGroupItem 
                            value="receita" 
                            className="h-16 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-300 dark:data-[state=on]:bg-green-900/30 dark:data-[state=on]:text-green-400 border-2 hover:border-green-300 transition-all duration-200"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Receipt className="h-5 w-5" />
                              <span className="font-medium">Receita</span>
                            </div>
                          </ToggleGroupItem>
                          <ToggleGroupItem 
                            value="despesa" 
                            className="h-16 data-[state=on]:bg-red-100 data-[state=on]:text-red-700 data-[state=on]:border-red-300 dark:data-[state=on]:bg-red-900/30 dark:data-[state=on]:text-red-400 border-2 hover:border-red-300 transition-all duration-200"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <CreditCard className="h-5 w-5" />
                              <span className="font-medium">Despesa</span>
                            </div>
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Informações Básicas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField control={form.control} name="descricao" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Descrição</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Aluguel do escritório, Venda de produto..." 
                          className="h-12 border-2 focus:border-blue-500 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="valor" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Valor (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00"
                            className="h-12 pl-10 border-2 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Data */}
                <FormField control={form.control} name="data" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-base font-medium">Data do Lançamento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "h-12 pl-3 text-left font-normal border-2 hover:border-blue-300 transition-colors",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-3 h-4 w-4 text-blue-600" />
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          initialFocus 
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Categoria e Forma de Pagamento */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField control={form.control} name="categoriaId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center gap-2">
                        Categoria
                        <NovaCategoriaDialog tipoPadrao={tipo} onCategoriaCriada={handleNovaCategoria} />
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          console.log("Categoria selecionada:", value);
                          field.onChange(value);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="formaPagamento" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["Dinheiro", "Pix", "Cartão de Crédito", "Cartão de Débito", "Transferência Bancária", "Stripe", "Apple Checkout"].map(fp => (
                            <SelectItem key={fp} value={fp}>{fp}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Cartão Usado (condicional) */}
                {formaPagamento?.includes("Cartão") && (
                  <FormField control={form.control} name="cartaoUsado" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Cartão Usado</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Nubank, Itaú, Santander..." 
                          className="h-12 border-2 focus:border-blue-500 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {/* Upload de Nota Fiscal (apenas para despesas e criação) */}
                {tipo === 'despesa' && !editId && (
                  <FormField control={form.control} name="notaFiscal" render={() => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center gap-2">
                        <Upload className="h-4 w-4 text-blue-600" />
                        Nota Fiscal (Opcional)
                      </FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 hover:border-blue-300 transition-colors">
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <Input 
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="h-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              {...notaFiscalRef} 
                            />
                            <p className="text-xs text-muted-foreground text-center">
                              Formatos aceitos: PDF, JPG, PNG (máx. 5MB)
                            </p>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {/* Lançamento Recorrente */}
                <FormField control={form.control} name="isRecorrente" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-3 p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-blue-300 transition-colors">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          className="h-5 w-5"
                        />
                      </FormControl>
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-blue-600" />
                        <FormLabel className="text-base font-medium cursor-pointer">
                          Este é um lançamento recorrente/fixo
                        </FormLabel>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-8">
                      Marque esta opção se este lançamento se repete mensalmente
                    </p>
                  </FormItem>
                )} />

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="h-12 flex-1 border-2 hover:border-gray-300 transition-colors"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {editId ? "Salvar Alterações" : "Salvar Lançamento"}
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AuthedLayout>
  );
};

export default Lancamento;