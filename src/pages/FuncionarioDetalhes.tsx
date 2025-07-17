import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, Upload, Edit, PlusCircle, Trash2 } from "lucide-react";
import AuthedLayout from "@/components/AuthedLayout";
import { showError, showSuccess } from "@/utils/toast";
import { format, startOfMonth, addMonths, intervalToDuration } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Funcionario, PagamentoFolha } from "./FolhaPagamento";
import AnexarComprovanteDialog from "@/components/AnexarComprovanteDialog";
import UploadNotaDialog from "@/components/UploadNotaDialog";
import FuncionarioDialog from "@/components/FuncionarioDialog";
import AddManualPaymentDialog from "@/components/AddManualPaymentDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const calcularTempoDeEmpresa = (dataContratacao?: string) => {
  if (!dataContratacao) return "Não informada";
  const duration = intervalToDuration({ start: new Date(dataContratacao), end: new Date() });
  const parts = [];
  if (duration.years && duration.years > 0) parts.push(`${duration.years} ano${duration.years > 1 ? 's' : ''}`);
  if (duration.months && duration.months > 0) parts.push(`${duration.months} mês${duration.months > 1 ? 'es' : ''}`);
  if (duration.days && duration.days > 0) parts.push(`${duration.days} dia${duration.days > 1 ? 's' : ''}`);
  
  if (parts.length === 0) return "Menos de um dia";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(' e ');
  
  return `${parts.slice(0, -1).join(', ')} e ${parts.slice(-1)}`;
};

const FuncionarioDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoFolha[]>([]);
  const [loading, setLoading] = useState(true);
  const [anexarDialogOpen, setAnexarDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manualAddDialogOpen, setManualAddDialogOpen] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<PagamentoFolha | null>(null);
  const [mesReferenciaUpload, setMesReferenciaUpload] = useState(startOfMonth(new Date()));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchDetalhes = async () => {
      setLoading(true);
      const { data: funcData, error: funcError } = await supabase.from("funcionarios").select("*").eq("id", id).single();
      if (funcError) { showError("Erro ao buscar dados do funcionário."); setLoading(false); return; }
      setFuncionario(funcData);

      const { data: pagamentosData, error: pagamentosError } = await supabase.from("pagamentos_folha").select("*").eq("funcionario_id", id).order("mes_referencia", { ascending: false });
      
      if (pagamentosError) {
        showError("Erro ao buscar histórico de pagamentos.");
        setPagamentos([]);
      } else {
        let finalPagamentos = pagamentosData || [];
        let nextMonthToPay: Date;

        if (finalPagamentos.length > 0) {
          const latestPaymentDate = new Date(finalPagamentos[0].mes_referencia.replace(/-/g, '/'));
          nextMonthToPay = addMonths(startOfMonth(latestPaymentDate), 1);
        } else {
          nextMonthToPay = funcData.data_contratacao ? startOfMonth(new Date(funcData.data_contratacao)) : startOfMonth(new Date());
        }
        
        setMesReferenciaUpload(nextMonthToPay);

        const nextMonthStr = format(nextMonthToPay, 'yyyy-MM');
        const hasNextMonthPayment = finalPagamentos.some(p => p.mes_referencia.startsWith(nextMonthStr));

        if (!hasNextMonthPayment && funcData) {
          finalPagamentos.unshift({
            id: `placeholder-${nextMonthStr}`,
            funcionario_id: funcData.id,
            mes_referencia: format(nextMonthToPay, 'yyyy-MM-dd'),
            status: 'pendente',
          });
        }
        setPagamentos(finalPagamentos);
      }
      setLoading(false);
    };

    fetchDetalhes();
  }, [id, refreshKey]);

  const handleDelete = async () => {
    if (!funcionario) return;
    const { error } = await supabase.from("funcionarios").update({ status: 'inativo' }).eq("id", funcionario.id);
    if (error) {
      showError("Erro ao desativar funcionário.");
    } else {
      showSuccess("Funcionário desativado com sucesso!");
      navigate("/folha-pagamento");
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pago': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Pago</Badge>;
      case 'nota_enviada': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Nota Enviada</Badge>;
      default: return <Badge variant="destructive">Pendente</Badge>;
    }
  };

  return (
    <AuthedLayout>
      <div className="space-y-6">
        <Link to="/folha-pagamento" className="flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Folha de Pagamento
        </Link>

        {loading ? <Skeleton className="h-48 w-full" /> : funcionario && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={funcionario.avatar_url} alt={funcionario.nome} />
                  <AvatarFallback>{funcionario.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{funcionario.nome}</CardTitle>
                  <CardDescription>{funcionario.cargo}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setEditDialogOpen(true)}><Edit className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação marcará o funcionário como inativo. Ele não aparecerá mais na folha de pagamento, mas seu histórico será mantido.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Sim, desativar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-4">
              <div><strong>Telefone:</strong> {funcionario.telefone}</div>
              <div><strong>Chave PIX:</strong> {funcionario.chave_pix}</div>
              <div><strong>Valor Pagamento:</strong> R$ {funcionario.valor_pagamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div><strong>Contratado em:</strong> {funcionario.data_contratacao ? format(new Date(funcionario.data_contratacao), 'dd/MM/yyyy') : 'N/A'}</div>
              <div><strong>Tempo de Empresa:</strong> {calcularTempoDeEmpresa(funcionario.data_contratacao)}</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <Button variant="outline" onClick={() => setManualAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Pagamento
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead><TableHead>Status</TableHead><TableHead>Nota Fiscal</TableHead>
                  <TableHead>Comprovante</TableHead><TableHead>Data Pagamento</TableHead><TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                ) : pagamentos.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Nenhum pagamento registrado.</TableCell></TableRow>
                ) : (
                  pagamentos.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.mes_referencia.replace(/-/g, '/')), "MMMM 'de' yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell>{p.nota_fiscal_url ? <a href={p.nota_fiscal_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"><FileText className="w-5 h-5" /></a> : "-"}</TableCell>
                      <TableCell>{p.comprovante_pagamento_url ? <a href={p.comprovante_pagamento_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"><FileText className="w-5 h-5" /></a> : "-"}</TableCell>
                      <TableCell>{p.data_pagamento ? format(new Date(p.data_pagamento), "dd/MM/yyyy 'às' HH:mm") : "-"}</TableCell>
                      <TableCell>
                        {p.status === 'pendente' && (
                          <Button size="sm" variant="outline" onClick={() => { setUploadDialogOpen(true); }}>
                            <Upload className="mr-2 h-4 w-4" /> Enviar Nota
                          </Button>
                        )}
                        {p.status === 'nota_enviada' && (
                          <Button size="sm" onClick={() => { setSelectedPagamento(p); setAnexarDialogOpen(true); }}>
                            <Upload className="mr-2 h-4 w-4" /> Anexar Comprovante
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AnexarComprovanteDialog open={anexarDialogOpen} onOpenChange={setAnexarDialogOpen} pagamento={selectedPagamento} onSave={() => setRefreshKey(k => k + 1)} />
      <UploadNotaDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} funcionario={funcionario} mesReferencia={mesReferenciaUpload} onSave={() => setRefreshKey(k => k + 1)} />
      <FuncionarioDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} funcionario={funcionario} onSave={() => setRefreshKey(k => k + 1)} />
      <AddManualPaymentDialog open={manualAddDialogOpen} onOpenChange={setManualAddDialogOpen} funcionarioId={funcionario?.id} existingPayments={pagamentos} onSave={() => setRefreshKey(k => k + 1)} />
    </AuthedLayout>
  );
};

export default FuncionarioDetalhes;