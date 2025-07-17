import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { format, startOfMonth } from "date-fns";
import { PagamentoFolha } from "@/pages/FolhaPagamento";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarioId: string | undefined;
  existingPayments: PagamentoFolha[];
  onSave: () => void;
};

const AddManualPaymentDialog = ({ open, onOpenChange, funcionarioId, existingPayments, onSave }: Props) => {
  const [month, setMonth] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!month || !funcionarioId) {
      showError("Selecione um mês e tente novamente.");
      return;
    }

    setLoading(true);
    const mesReferencia = format(startOfMonth(month), "yyyy-MM-dd");

    const paymentExists = existingPayments.some(p => format(new Date(p.mes_referencia.replace(/-/g, '/')), 'yyyy-MM-dd') === mesReferencia);
    if (paymentExists) {
      showError("Já existe um registro de pagamento para este mês.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("pagamentos_folha").insert({
      funcionario_id: funcionarioId,
      mes_referencia: mesReferencia,
      status: 'pendente',
    });

    setLoading(false);
    if (error) {
      showError("Erro ao adicionar pagamento manual.");
    } else {
      showSuccess("Pagamento pendente adicionado com sucesso!");
      onSave();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Pagamento Manual</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={month}
            onSelect={setMonth}
            captionLayout="dropdown-buttons"
            fromYear={2020}
            toYear={new Date().getFullYear() + 1}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Adicionar Pagamento"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddManualPaymentDialog;