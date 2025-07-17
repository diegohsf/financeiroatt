import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
  xl: "h-12 w-12 border-4",
};

const variantClasses = {
  default: "border-muted-foreground/20 border-t-muted-foreground/60",
  primary: "border-blue-200 border-t-blue-600 dark:border-blue-900/50 dark:border-t-blue-400",
  secondary: "border-purple-200 border-t-purple-600 dark:border-purple-900/50 dark:border-t-purple-400",
  success: "border-green-200 border-t-green-600 dark:border-green-900/50 dark:border-t-green-400",
  warning: "border-yellow-200 border-t-yellow-600 dark:border-yellow-900/50 dark:border-t-yellow-400",
  danger: "border-red-200 border-t-red-600 dark:border-red-900/50 dark:border-t-red-400",
};

export function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  fullScreen?: boolean;
}

export function Loading({
  text,
  size = "md",
  variant = "primary",
  fullScreen = false,
  className,
  ...props
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
        className
      )}
      {...props}
    >
      <LoadingSpinner size={size} variant={variant} />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}