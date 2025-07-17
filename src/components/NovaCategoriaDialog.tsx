import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  tipoPadrao: "receita" | "despesa";
  onCategoriaCriada: (categoria: { id: string; nome: string; tipo: string }) => void;
};

export default function NovaCategoriaDialog({ tipoPadrao, onCategoriaCriada }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa">(tipoPadrao);
  const [loading, setLoading] = useState(false);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      showError("Informe o nome da categoria.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("categorias")
      .insert({ nome, tipo })
      .select()
      .single();
    setLoading(false);
    if (error) {
      showError("Erro ao criar categoria.");
    } else if (data) {
      showSuccess("Categoria criada!");
      onCategoriaCriada(data);
      setNome("");
      setTipo(tipoPadrao);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="ml-2">
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Nome</label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Marketing" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Tipo</label>
            <Select value={tipo} onValueChange={v => setTipo(v as "receita" | "despesa")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSalvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}