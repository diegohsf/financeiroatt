import * as React from "react";
import { cn } from "@/lib/utils";

type AnimationType = 
  | "fade-in" 
  | "fade-in-up" 
  | "fade-in-down" 
  | "fade-in-left" 
  | "fade-in-right" 
  | "zoom-in" 
  | "zoom-out" 
  | "slide-in-up" 
  | "slide-in-down" 
  | "slide-in-left" 
  | "slide-in-right";

type AnimationDuration = "fast" | "normal" | "slow";

interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: AnimationType;
  duration?: AnimationDuration;
  delay?: number; // in milliseconds
  once?: boolean;
  children: React.ReactNode;
}

const animationClasses: Record<AnimationType, string> = {
  "fade-in": "opacity-0 animate-in fade-in",
  "fade-in-up": "opacity-0 translate-y-4 animate-in fade-in slide-in-from-bottom-4",
  "fade-in-down": "opacity-0 -translate-y-4 animate-in fade-in slide-in-from-top-4",
  "fade-in-left": "opacity-0 translate-x-4 animate-in fade-in slide-in-from-right-4",
  "fade-in-right": "opacity-0 -translate-x-4 animate-in fade-in slide-in-from-left-4",
  "zoom-in": "opacity-0 scale-95 animate-in fade-in zoom-in-95",
  "zoom-out": "opacity-0 scale-105 animate-in fade-in zoom-out-105",
  "slide-in-up": "translate-y-4 animate-in slide-in-from-bottom-4",
  "slide-in-down": "-translate-y-4 animate-in slide-in-from-top-4",
  "slide-in-left": "translate-x-4 animate-in slide-in-from-right-4",
  "slide-in-right": "-translate-x-4 animate-in slide-in-from-left-4",
};

const durationClasses: Record<AnimationDuration, string> = {
  fast: "duration-200",
  normal: "duration-300",
  slow: "duration-500",
};

export function AnimatedContainer({
  animation = "fade-in",
  duration = "normal",
  delay = 0,
  once = true,
  className,
  children,
  ...props
}: AnimatedContainerProps) {
  const [isVisible, setIsVisible] = React.useState(!once);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (once) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, [once]);

  const animationClass = animationClasses[animation];
  const durationClass = durationClasses[duration];
  const delayStyle = delay ? { animationDelay: `${delay}ms`, style: { animationDelay: `${delay}ms` } } : {};

  return (
    <div
      ref={ref}
      className={cn(
        isVisible ? animationClass : "opacity-0",
        durationClass,
        className
      )}
      {...delayStyle}
      {...props}
    >
      {children}
    </div>
  );
}