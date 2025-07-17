import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import AuthedLayout from "@/components/AuthedLayout";
import { User } from "@supabase/supabase-js";

const Perfil = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (error) {
          showError("Erro ao buscar perfil.");
        } else if (profile) {
          setFullName(profile.full_name || "");
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      showError("Erro ao atualizar o perfil.");
    } else {
      showSuccess("Perfil atualizado com sucesso!");
    }
    setLoading(false);
  };

  return (
    <AuthedLayout>
      <div className="bg-white rounded shadow p-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
            <div>
              <label className="block mb-1 font-medium">E-mail</label>
              <Input type="email" value={user?.email || ""} disabled />
            </div>
            <div>
              <label className="block mb-1 font-medium">Nome Completo</label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        )}
      </div>
    </AuthedLayout>
  );
};

export default Perfil;