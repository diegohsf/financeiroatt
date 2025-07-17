import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const alertBannerVariants = cva(
  "relative w-full flex items-center gap-3 p-4 rounded-lg border text-sm",
  {
    variants: {
      variant: {
        default: "bg-background border-border",
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-300",
        success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-300",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-900/50 dark:text-yellow-300",
        error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: <Info className="h-5 w-5 text-muted-foreground" />,
  info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  success: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
  error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
};

export interface AlertBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertBannerVariants> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
}

const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  ({ className, variant = "default", title, description, icon, action, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(alertBannerVariants({ variant }), "animate-in fade-in-0 zoom-in-95 duration-300", className)}
        {...props}
      >
        <div className="flex-shrink-0">
          {icon || iconMap[variant || "default"]}
        </div>
        <div className="flex-1">
          {title && <div className="font-medium">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Fechar</span>
          </Button>
        )}
      </div>
    );
  }
);

AlertBanner.displayName = "AlertBanner";

export { AlertBanner };