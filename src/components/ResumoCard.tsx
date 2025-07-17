import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ArrowUp, 
  ArrowDown,
  Wallet,
  PiggyBank,
  CalendarClock
} from "lucide-react";

type Props = {
  tipo: "saldo" | "receita" | "despesa" | "gastoFixo" | "gastoTotal";
  valor: number;
};

const icons = {
  saldo: <Wallet className="w-7 h-7" />,
  receita: <ArrowUpCircle className="w-7 h-7" />,
  despesa: <ArrowDownCircle className="w-7 h-7" />,
  gastoFixo: <CalendarClock className="w-7 h-7" />,
  gastoTotal: <PiggyBank className="w-7 h-7" />,
};

const labels = {
  saldo: "Saldo Atual",
  receita: "Receitas",
  despesa: "Despesas",
  gastoFixo: "Gasto Fixo Mensal",
  gastoTotal: "Gasto Total Mensal",
};

const descriptions = {
  saldo: "Balanço total",
  receita: "Entradas no período",
  despesa: "Saídas no período",
  gastoFixo: "Despesas recorrentes",
  gastoTotal: "Total de despesas",
};

const bgColors = {
  saldo: "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/40 dark:to-emerald-900/30",
  receita: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-900/30",
  despesa: "bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/40 dark:to-rose-900/30",
  gastoFixo: "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/40 dark:to-amber-900/30",
  gastoTotal: "bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/40 dark:to-rose-900/30",
};

const iconColors = {
  saldo: "text-green-600 dark:text-green-400",
  receita: "text-blue-600 dark:text-blue-400",
  despesa: "text-red-600 dark:text-red-400",
  gastoFixo: "text-orange-600 dark:text-orange-400",
  gastoTotal: "text-red-600 dark:text-red-400",
};

const borderColors = {
  saldo: "border-green-200 dark:border-green-800",
  receita: "border-blue-200 dark:border-blue-800",
  despesa: "border-red-200 dark:border-red-800",
  gastoFixo: "border-orange-200 dark:border-orange-800",
  gastoTotal: "border-red-200 dark:border-red-800",
};

const valueColors = {
  saldo: "text-green-600 dark:text-green-400",
  receita: "text-blue-600 dark:text-blue-400",
  despesa: "text-red-600 dark:text-red-400",
  gastoFixo: "text-orange-600 dark:text-orange-400",
  gastoTotal: "text-red-600 dark:text-red-400",
};

const trendIcons = {
  saldo: <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />,
  receita: <ArrowUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
  despesa: <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />,
  gastoFixo: <ArrowDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
  gastoTotal: <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />,
};

const trendValues = {
  saldo: "+8%",
  receita: "+12%",
  despesa: "-5%",
  gastoFixo: "-3%",
  gastoTotal: "-7%",
};

const trendColors = {
  saldo: "text-green-600 dark:text-green-400",
  receita: "text-blue-600 dark:text-blue-400",
  despesa: "text-red-600 dark:text-red-400",
  gastoFixo: "text-orange-600 dark:text-orange-400",
  gastoTotal: "text-red-600 dark:text-red-400",
};

const ResumoCard = ({ tipo, valor }: Props) => (
  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground">{labels[tipo]}</div>
            <div className={`text-2xl font-bold ${valueColors[tipo]}`}>
              R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-muted/50 ${trendColors[tipo]}`}>
              {trendIcons[tipo]}
              {trendValues[tipo]}
            </div>
            <span className="text-xs text-muted-foreground">
              vs. mês anterior
            </span>
          </div>
        </div>
        
        <div className={`p-3 rounded-full bg-muted/30`}>
          <div className={iconColors[tipo]}>
            {icons[tipo]}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {descriptions[tipo]}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ResumoCard;