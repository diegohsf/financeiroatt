import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Upload, CheckCircle, MessageSquare, FileText } from "lucide-react";
import AuthedLayout from "@/components/AuthedLayout";
import { showError, showSuccess } from "@/utils/toast";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import FuncionarioDialog from "@/components/FuncionarioDialog";
import UploadNotaDialog from "@/components/UploadNotaDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type Funcionario = {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
  chave_pix: string;
  valor_pagamento: number;
  status: string;
  data_contratacao?: string;
  avatar_url?: string;
  pagamentos?: PagamentoFolha[];
};

export type PagamentoFolha = {
  id: string;
  funcionario_id: string;
  status: 'pendente' | 'nota_enviada' | 'pago';
  nota_fiscal_url?: string;
  comprovante_pagamento_url?: string;
  mes_referencia: string;
  data_pagamento?: string;
};

const FolhaPagamento = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const mesAtual = startOfMonth(new Date());

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      const { data: funcData, error: funcError } = await supabase.from("funcionarios").select("*").eq("status", "ativo").order("nome");
      if (funcError) {
        showError("Erro ao buscar funcionários.");
        setLoading(false);
        return;
      }
      const { data: pagamentosData, error: pagamentosError } = await supabase.from("pagamentos_folha").select("*");
      if (pagamentosError) {
        showError("Erro ao buscar status de pagamentos.");
      }
      const funcionariosComPagamentos = funcData.map(f => {
        const pagamentos = (pagamentosData || [])
          .filter((p: PagamentoFolha) => p.funcionario_id === f.id)
          .sort((a: PagamentoFolha, b: PagamentoFolha) => new Date(a.mes_referencia).getTime() - new Date(b.mes_referencia).getTime());
        return { ...f, pagamentos };
      });
      setFuncionarios(funcionariosComPagamentos);
      setLoading(false);
    };
    fetchDados();
  }, [refreshKey]);

  const cobrarNotaFiscal = (telefone: string) => {
    const mensagem = encodeURIComponent("Olá! Tudo bem? Não se esqueça de me enviar a nota fiscal até o final da tarde para programarmos seu pagamento. Obrigado!");
    window.open(`https://wa.me/${telefone.replace(/\D/g, '')}?text=${mensagem}`, '_blank');
  };

  const openWhatsApp = (telefone: string) => {
    window.open(`https://wa.me/${telefone.replace(/\D/g, '')}`, '_blank');
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pago': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Pago</Badge>;
      case 'nota_enviada': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Nota Enviada</Badge>;
      default: return <Badge variant="destructive">Pendente</Badge>;
    }
  };

  // Return exactly two months: if current is paid show [current, next], otherwise [previous, current]
  function getMesesParaExibir(pagamentos: PagamentoFolha[] | undefined) {
    const meses: { mes: Date; status: string | undefined }[] = [];
    const mesAnterior = subMonths(mesAtual, 1);
    const mesSeguinte = addMonths(mesAtual, 1);
    const fmt = (date: Date) => format(date, "yyyy-MM");
    const pagoAtual = pagamentos?.find(p => fmt(new Date(p.mes_referencia)) === fmt(mesAtual));
    if (pagoAtual?.status === "pago") {
      meses.push({ mes: mesAtual, status: "pago" });
      meses.push({ mes: mesSeguinte, status: "pendente" });
    } else {
      const pagoAnterior = pagamentos?.find(p => fmt(new Date(p.mes_referencia)) === fmt(mesAnterior));
      meses.push({ mes: mesAnterior, status: pagoAnterior?.status });
      meses.push({ mes: mesAtual, status: pagoAtual?.status });
    }
    return meses;
  }

  return (
    <AuthedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Folha de Pagamento (PJ)</h1>
            <p className="text-muted-foreground">Gerencie os pagamentos mensais dos seus colaboradores.</p>
          </div>
          <Button onClick={() => { setSelectedFuncionario(null); setDialogOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Funcionário
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
          ) : (
            funcionarios.map(func => {
              const meses = getMesesParaExibir(func.pagamentos);
              const pagamentoAtual = func.pagamentos?.find(p => format(new Date(p.mes_referencia), "yyyy-MM") === format(mesAtual, "yyyy-MM"));
              return (
                <Card key={func.id} className="flex flex-col justify-between overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <Link to={`/funcionarios/${func.id}`} className="group">
                      <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarImage src={func.avatar_url} alt={func.nome} />
                        <AvatarFallback>{func.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-semibold group-hover:underline">{func.nome}</h3>
                      <p className="text-sm text-muted-foreground">{func.cargo || 'Cargo não informado'}</p>
                    </Link>
                    <div className="text-left mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`font-medium ${func.status === 'ativo' ? 'text-green-600' : 'text-red-600'}`}>
                          {func.status.charAt(0).toUpperCase() + func.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone:</span>
                        <span>{func.telefone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Salário:</span>
                        <span className="font-semibold">
                          R$ {func.valor_pagamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="bg-muted/50 p-4 border-t">
                    <div className="space-y-1 mb-3">
                      {meses.map(({ mes, status }, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {format(mes, "MMMM", { locale: ptBR })}:
                          </span>
                          {getStatusBadge(status)}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); cobrarNotaFiscal(func.telefone); }}
                      >
                        <FileText className="mr-2 h-4 w-4" /> Cobrar Nota Fiscal
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); openWhatsApp(func.telefone); }}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      {(!pagamentoAtual || pagamentoAtual.status === 'pendente') && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setSelectedFuncionario(func); setUploadDialogOpen(true); }}
                        >
                          <Upload className="mr-2 h-4 w-4" /> Enviar Nota
                        </Button>
                      )}
                      {pagamentoAtual?.status === 'nota_enviada' && (
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => showSuccess("Função de anexar comprovante aqui!")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
      <FuncionarioDialog open={dialogOpen} onOpenChange={setDialogOpen} funcionario={selectedFuncionario} onSave={() => setRefreshKey(k => k + 1)} />
      <UploadNotaDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} funcionario={selectedFuncionario} mesReferencia={mesAtual} onSave={() => setRefreshKey(k => k + 1)} />
    </AuthedLayout>
  );
};

export default FolhaPagamento;