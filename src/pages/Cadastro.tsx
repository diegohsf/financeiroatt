import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

const Cadastro = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      showError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome } } });
    setLoading(false);
    if (error) {
      showError(error.message || "Erro ao criar conta.");
    } else {
      showSuccess("Cadastro realizado! Verifique seu e-mail.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCadastro} className="space-y-6">
            <div>
              <label className="block mb-1 font-medium">Nome</label>
              <Input type="text" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Seu nome completo" />
            </div>
            <div>
              <label className="block mb-1 font-medium">E-mail</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Senha</label>
              <Input type="password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="Crie uma senha forte" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Confirmar Senha</label>
              <Input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required placeholder="Repita a senha" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
            <div className="text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">Já tenho uma conta</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;