import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ActionItem = {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
};

type Props = {
  title: string;
  description?: string;
  icon: ReactNode;
  actions: ActionItem[];
  footer?: ReactNode;
  className?: string;
};

export default function QuickActions({
  title,
  description,
  icon,
  actions,
  footer,
  className = "",
}: Props) {
  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {icon}
          </div>
          {title}
        </CardTitle>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {actions.map((action, index) => (
            <Button 
              key={index}
              variant="outline" 
              className={`justify-start h-12 border-2 hover:border-${action.color}-300 hover:bg-${action.color}-50 dark:hover:bg-${action.color}-950/30 transition-all duration-200`}
              onClick={action.onClick}
            >
              <div className={`mr-3 h-5 w-5 text-${action.color}-600`}>
                {action.icon}
              </div>
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
        
        {footer && (
          <div className="pt-4 border-t">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}