import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { PagamentoFolha } from "@/pages/FolhaPagamento";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamento: PagamentoFolha | null;
  onSave: () => void;
};

const AnexarComprovanteDialog = ({ open, onOpenChange, pagamento, onSave }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !pagamento) {
      showError("Selecione um arquivo de comprovante.");
      return;
    }
    setLoading(true);

    const filePath = `${pagamento.funcionario_id}/${format(new Date(pagamento.mes_referencia), 'yyyy-MM')}-comprovante-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('comprovantes-pagamento').upload(filePath, file);

    if (uploadError) {
      showError("Erro no upload do comprovante.");
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('comprovantes-pagamento').getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("pagamentos_folha")
      .update({
        comprovante_pagamento_url: urlData.publicUrl,
        status: 'pago',
        data_pagamento: new Date().toISOString(),
      })
      .eq("id", pagamento.id);

    setLoading(false);
    if (updateError) {
      showError("Erro ao atualizar o pagamento.");
    } else {
      showSuccess("Comprovante anexado e pagamento concluído!");
      onSave();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anexar Comprovante de Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>Mês de Referência: <strong>{pagamento ? format(new Date(pagamento.mes_referencia), "MMMM 'de' yyyy") : ''}</strong></p>
          <Input type="file" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={loading}>{loading ? "Enviando..." : "Salvar Comprovante"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnexarComprovanteDialog;