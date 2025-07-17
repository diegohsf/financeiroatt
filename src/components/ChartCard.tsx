import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function ChartCard({
  title,
  description,
  icon,
  children,
  loading = false,
  emptyMessage = "Nenhum dado disponível",
  emptyIcon,
  actions,
  className = "",
}: Props) {
  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {icon}
              </div>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <div className="flex justify-center space-x-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>
        ) : children ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
              {emptyIcon || (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                </svg>
              )}
            </div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
              {emptyMessage}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Não há dados suficientes para exibir este gráfico. Tente adicionar mais registros ou alterar os filtros.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}