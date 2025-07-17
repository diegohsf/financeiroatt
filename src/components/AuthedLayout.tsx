import Sidebar from "./Sidebar";
import { ReactNode } from "react";
import { Bell, HelpCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";

export default function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Search Bar */}
            <div className="hidden md:block md:w-72 lg:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar..." 
                  className="pl-9 h-9 bg-muted/50 border-muted focus:bg-background"
                />
              </div>
            </div>
            
            {/* Mobile Spacer */}
            <div className="md:hidden w-8"></div>
            
            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-background">
          <div className="mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}