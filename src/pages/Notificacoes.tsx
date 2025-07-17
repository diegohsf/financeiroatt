import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Bell, 
  MessageSquare, 
  QrCode, 
  Smartphone, 
  Send, 
  RefreshCw,
  ArrowLeft,
  Copy,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  AlertTriangle
} from "lucide-react";
import AuthedLayout from "@/components/AuthedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { evolutionApiService, EVOLUTION_CONFIG, type ConnectionStatus } from "@/utils/evolutionApi";

type Funcionario = {
  id: string;
  nome: string;
  telefone: string;
  cargo: string;
  status: string;
};

type LancamentoSemNota = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  funcionario_nome: string;
  funcionario_telefone: string;
};

const Notificacoes = () => {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [lancamentosSemNota, setLancamentosSemNota] = useState<LancamentoSemNota[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState(
    "Olá! Você possui um lançamento financeiro pendente de nota fiscal. Por favor, envie a nota fiscal referente à despesa de *{valor}* realizada em *{data}* com a descrição: *{descricao}*. Obrigado!"
  );

  // Buscar dados dos funcionários e lançamentos sem nota
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // Buscar funcionários
        const { data: funcionariosData, error: funcionariosError } = await supabase
          .from("funcionarios")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "ativo");

        if (funcionariosError) throw funcionariosError;
        setFuncionarios(funcionariosData || []);

        // Buscar lançamentos sem nota fiscal
        const { data: lancamentosData, error: lancamentosError } = await supabase
          .from("lancamentos_financeiros")
          .select(`
            id,
            descricao,
            valor,
            data,
            funcionarios!inner(nome, telefone)
          `)
          .eq("user_id", user.id)
          .eq("tipo", "despesa")
          .is("nota_fiscal_url", null)
          .order("data", { ascending: false });

        if (lancamentosError) throw lancamentosError;
        
        const lancamentosFormatados = lancamentosData?.map(l => ({
          id: l.id,
          descricao: l.descricao,
          valor: l.valor,
          data: l.data,
          funcionario_nome: l.funcionarios.nome,
          funcionario_telefone: l.funcionarios.telefone
        })) || [];

        setLancamentosSemNota(lancamentosFormatados);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        showError("Erro ao carregar dados");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Verificar status da conexão
  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`${EVOLUTION_CONFIG.baseUrl}/instance/connectionState/${EVOLUTION_CONFIG.instanceName}`, {
        headers: {
          'apikey': EVOLUTION_CONFIG.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.instance?.state === "open" ? "connected" : "disconnected");
      } else {
        setConnectionStatus("error");
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setConnectionStatus("error");
    }
  };

  // Gerar QR Code
  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${EVOLUTION_CONFIG.baseUrl}/instance/connect/${EVOLUTION_CONFIG.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_CONFIG.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.base64) {
          setQrCode(data.base64);
          setConnectionStatus("connecting");
          showSuccess("QR Code gerado! Escaneie com seu WhatsApp.");
        }
      } else {
        throw new Error("Erro ao gerar QR Code");
      }
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      showError("Erro ao gerar QR Code");
      setConnectionStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Desconectar instância
  const disconnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${EVOLUTION_CONFIG.baseUrl}/instance/logout/${EVOLUTION_CONFIG.instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_CONFIG.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setConnectionStatus("disconnected");
        setQrCode("");
        showSuccess("Desconectado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      showError("Erro ao desconectar");
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensagem
  const sendMessage = async (telefone: string, mensagem: string) => {
    try {
      const response = await fetch(`${EVOLUTION_CONFIG.baseUrl}/message/sendText/${EVOLUTION_CONFIG.instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: telefone.replace(/\D/g, ''),
          text: mensagem
        })
      });

      if (response.ok) {
        showSuccess("Mensagem enviada com sucesso!");
        return true;
      } else {
        throw new Error("Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      showError("Erro ao enviar mensagem");
      return false;
    }
  };

  // Enviar cobrança de nota fiscal
  const sendNotaFiscalRequest = async (lancamento: LancamentoSemNota) => {
    if (connectionStatus !== "connected") {
      showError("WhatsApp não está conectado!");
      return;
    }

    const mensagem = mensagemPersonalizada
      .replace("{valor}", `R$ ${lancamento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`)
      .replace("{data}", format(new Date(lancamento.data), "dd/MM/yyyy", { locale: ptBR }))
      .replace("{descricao}", lancamento.descricao);

    await sendMessage(lancamento.funcionario_telefone, mensagem);
  };

  // Copiar API Key
  const copyApiKey = () => {
    navigator.clipboard.writeText(EVOLUTION_CONFIG.apiKey);
    showSuccess("API Key copiada!");
  };

  // Verificar status ao carregar
  useEffect(() => {
    checkConnectionStatus();
    const interval = setInterval(checkConnectionStatus, 10000); // Verificar a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

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
                  Notificações WhatsApp
                </h1>
                <p className="text-muted-foreground text-lg">
                  Gerencie mensagens e cobranças de nota fiscal
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={checkConnectionStatus}
              className="h-11 w-11 border-2 hover:border-green-300 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-green-600" />
            </Button>
          </div>
        </div>

        {/* Status da Conexão */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Status da Conexão WhatsApp</CardTitle>
                  <CardDescription className="mt-1">
                    Gerencie a conexão com a Evolution API
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={connectionStatus === "connected" ? "default" : "secondary"}
                  className={`${
                    connectionStatus === "connected" 
                      ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" 
                      : connectionStatus === "error"
                      ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {connectionStatus === "connected" && <CheckCircle className="w-3 h-3 mr-1" />}
                  {connectionStatus === "error" && <XCircle className="w-3 h-3 mr-1" />}
                  {connectionStatus === "connecting" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                  {connectionStatus === "disconnected" && <XCircle className="w-3 h-3 mr-1" />}
                  {connectionStatus === "connected" ? "Conectado" : 
                   connectionStatus === "connecting" ? "Conectando" :
                   connectionStatus === "error" ? "Erro" : "Desconectado"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações da API */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Instância</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={EVOLUTION_CONFIG.instanceName} 
                    readOnly 
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">API Key</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={EVOLUTION_CONFIG.apiKey} 
                    readOnly 
                    type="password"
                    className="bg-muted"
                  />
                  <Button variant="outline" size="icon" onClick={copyApiKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* QR Code e Controles */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                {qrCode && connectionStatus === "connecting" ? (
                  <div className="text-center space-y-4">
                    <div className="bg-white p-4 rounded-lg inline-block shadow-lg">
                      <img 
                        src={`data:image/png;base64,${qrCode}`} 
                        alt="QR Code WhatsApp" 
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Escaneie este QR Code com seu WhatsApp
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {connectionStatus === "connected" 
                        ? "WhatsApp conectado com sucesso!" 
                        : "Clique em 'Conectar' para gerar o QR Code"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 lg:w-48">
                {connectionStatus === "disconnected" || connectionStatus === "error" ? (
                  <Button 
                    onClick={generateQRCode} 
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                    Conectar
                  </Button>
                ) : (
                  <Button 
                    onClick={disconnect} 
                    disabled={loading}
                    variant="destructive"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Desconectar
                  </Button>
                )}
                
                <Button 
                  onClick={checkConnectionStatus}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar Status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuração de Mensagem */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Mensagem Personalizada</CardTitle>
                <CardDescription className="mt-1">
                  Configure a mensagem para cobrança de nota fiscal
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mensagem">Modelo da Mensagem</Label>
              <Textarea
                id="mensagem"
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
                rows={4}
                placeholder="Digite sua mensagem personalizada..."
              />
              <p className="text-xs text-muted-foreground">
                Use as variáveis: <code>{"{valor}"}</code>, <code>{"{data}"}</code>, <code>{"{descricao}"}</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lançamentos Sem Nota Fiscal */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Lançamentos Pendentes</CardTitle>
                  <CardDescription className="mt-1">
                    Despesas sem nota fiscal para cobrança
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="font-normal">
                {lancamentosSemNota.length} pendentes
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {connectionStatus !== "connected" && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  WhatsApp não está conectado. Conecte primeiro para enviar mensagens.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="font-medium">Data</TableHead>
                    <TableHead className="font-medium">Descrição</TableHead>
                    <TableHead className="font-medium">Valor</TableHead>
                    <TableHead className="font-medium">Funcionário</TableHead>
                    <TableHead className="font-medium">Telefone</TableHead>
                    <TableHead className="text-right font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingData ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : lancamentosSemNota.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                          <p className="text-muted-foreground">
                            Todos os lançamentos possuem nota fiscal!
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lancamentosSemNota.map(lancamento => (
                      <TableRow key={lancamento.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell className="font-medium">
                          {format(new Date(lancamento.data), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{lancamento.descricao}</TableCell>
                        <TableCell className="font-medium text-red-600 dark:text-red-400">
                          R$ {lancamento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{lancamento.funcionario_nome}</TableCell>
                        <TableCell>{lancamento.funcionario_telefone}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => sendNotaFiscalRequest(lancamento)}
                            disabled={connectionStatus !== "connected"}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Cobrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthedLayout>
  );
};

export default Notificacoes;