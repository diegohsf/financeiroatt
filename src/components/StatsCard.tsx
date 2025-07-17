import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
};

export default function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className = "" 
}: Props) {
  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">{title}</div>
              <div className="text-2xl font-bold">
                {value}
              </div>
            </div>
            
            {trend && (
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 ${
                  trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}>
                  {trend.positive ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-.995.325l-4.287-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  )}
                  {trend.value}
                </div>
                <span className="text-xs text-muted-foreground">
                  vs. período anterior
                </span>
              </div>
            )}
          </div>
          
          <div className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-md">
            {icon}
          </div>
        </div>
        
        {description && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-muted-foreground">
              {description}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}