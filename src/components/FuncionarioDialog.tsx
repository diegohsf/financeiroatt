import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Funcionario } from "@/pages/FolhaPagamento";

const formSchema = z.object({
  nome: z.string().min(3, "Nome é obrigatório."),
  cargo: z.string().optional(),
  telefone: z.string().min(10, "Telefone inválido."),
  chave_pix: z.string().min(3, "Chave PIX é obrigatória."),
  valor_pagamento: z.coerce.number().positive("O valor deve ser positivo."),
  data_contratacao: z.date().optional(),
  avatar: z.instanceof(FileList).optional(),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: Funcionario | null;
  onSave: () => void;
};

const FuncionarioDialog = ({ open, onOpenChange, funcionario, onSave }: Props) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", cargo: "", telefone: "", chave_pix: "", valor_pagamento: 0 },
  });

  const avatarRef = form.register("avatar");

  useEffect(() => {
    if (funcionario) {
      form.reset({
        ...funcionario,
        data_contratacao: funcionario.data_contratacao ? new Date(funcionario.data_contratacao) : undefined,
      });
    } else {
      form.reset({ nome: "", cargo: "", telefone: "", chave_pix: "", valor_pagamento: 0, data_contratacao: undefined });
    }
  }, [funcionario, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let avatar_url = funcionario?.avatar_url || null;

    if (values.avatar && values.avatar.length > 0) {
      const file = values.avatar[0];
      const filePath = `${funcionario?.id || 'new'}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) {
        showError("Erro no upload da foto.");
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatar_url = urlData.publicUrl;
    }

    const funcionarioData = {
      ...values,
      avatar_url,
      data_contratacao: values.data_contratacao ? format(values.data_contratacao, 'yyyy-MM-dd') : null,
    };
    delete (funcionarioData as any).avatar;

    const { error } = funcionario
      ? await supabase.from("funcionarios").update(funcionarioData).eq("id", funcionario.id)
      : await supabase.from("funcionarios").insert(funcionarioData);

    if (error) {
      showError(`Erro ao ${funcionario ? 'atualizar' : 'cadastrar'} funcionário.`);
    } else {
      showSuccess(`Funcionário ${funcionario ? 'atualizado' : 'cadastrado'}!`);
      onSave();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{funcionario ? "Editar" : "Cadastrar"} Funcionário</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="cargo" render={({ field }) => <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="telefone" render={({ field }) => <FormItem><FormLabel>Telefone (com DDD)</FormLabel><FormControl><Input {...field} placeholder="Ex: 11999998888" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="chave_pix" render={({ field }) => <FormItem><FormLabel>Chave PIX</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="valor_pagamento" render={({ field }) => <FormItem><FormLabel>Valor do Pagamento (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="data_contratacao" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Data de Contratação</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="avatar" render={() => (
              <FormItem><FormLabel>Foto do Funcionário</FormLabel><FormControl><Input type="file" {...avatarRef} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FuncionarioDialog;