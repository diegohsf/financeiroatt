import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, LogOut, User } from "lucide-react";

type Props = {
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  stats?: {
    label: string;
    value: string | number;
  }[];
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
  className?: string;
};

export default function ProfileCard({
  name,
  email,
  avatarUrl,
  role = "Usuário",
  stats,
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
  className = "",
}: Props) {
  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Meu Perfil</CardTitle>
        <CardDescription>
          Gerencie suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
            <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="mt-4">
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-sm text-muted-foreground">{email}</p>
            <Badge variant="outline" className="mt-2">
              {role}
            </Badge>
          </div>
        </div>
        
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={onProfileClick}
          >
            <User className="mr-2 h-4 w-4" />
            Ver Perfil
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={onSettingsClick}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={onLogoutClick}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da Conta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}