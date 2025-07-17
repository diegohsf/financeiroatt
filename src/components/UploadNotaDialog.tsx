import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Funcionario } from "@/pages/FolhaPagamento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: Funcionario | null;
  mesReferencia: Date;
  onSave: () => void;
};

const UploadNotaDialog = ({ open, onOpenChange, funcionario, mesReferencia, onSave }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !funcionario) {
      showError("Selecione um arquivo.");
      return;
    }
    setLoading(true);

    let categoriaId = null;
    const { data: catData } = await supabase.from('categorias').select('id').eq('nome', 'Salários').eq('tipo', 'despesa').single();

    if (catData) {
      categoriaId = catData.id;
    } else {
      const { data: newCatData, error: newCatError } = await supabase.from('categorias').insert({ nome: 'Salários', tipo: 'despesa' }).select('id').single();
      if (newCatError) {
        showError("Erro ao criar categoria padrão 'Salários'.");
        setLoading(false);
        return;
      }
      categoriaId = newCatData.id;
    }

    const filePath = `${funcionario.id}/${format(mesReferencia, 'yyyy-MM')}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('notas-fiscais').upload(filePath, file);
    if (uploadError) {
      showError("Erro no upload da nota fiscal.");
      setLoading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('notas-fiscais').getPublicUrl(filePath);

    const { data: lancamento, error: lancamentoError } = await supabase.from("lancamentos_financeiros").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      tipo: 'despesa',
      data: format(new Date(), 'yyyy-MM-dd'),
      descricao: `Pagamento Folha - ${funcionario.nome} (${format(mesReferencia, 'MM/yyyy')})`,
      valor: funcionario.valor_pagamento,
      categoria_id: categoriaId,
      forma_pagamento: 'Transferência Bancária',
      nota_fiscal_url: urlData.publicUrl,
    }).select().single();

    if (lancamentoError) {
      showError("Erro ao criar o lançamento financeiro.");
      setLoading(false);
      return;
    }

    const { error: folhaError } = await supabase.from("pagamentos_folha").upsert({
      funcionario_id: funcionario.id,
      mes_referencia: format(mesReferencia, "yyyy-MM-dd"),
      status: 'nota_enviada',
      nota_fiscal_url: urlData.publicUrl,
      lancamento_id: lancamento.id,
    }, { onConflict: 'funcionario_id,mes_referencia' });

    setLoading(false);
    if (folhaError) {
      showError("Erro ao atualizar o status do pagamento.");
    } else {
      showSuccess("Nota fiscal enviada e pagamento agendado!");
      onSave();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Nota Fiscal para {funcionario?.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>Mês de Referência: <strong>{format(mesReferencia, "MMMM 'de' yyyy", { locale: ptBR })}</strong></p>
          <Input type="file" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={loading}>{loading ? "Enviando..." : "Enviar e Agendar Pagamento"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadNotaDialog;