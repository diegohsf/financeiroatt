import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

type Event = {
  id: string;
  title: string;
  date: Date;
  type: "payment" | "receipt" | "reminder" | "other";
};

type Props = {
  events: Event[];
  onDateSelect: (date: Date | undefined) => void;
  onEventClick: (event: Event) => void;
  selectedDate?: Date;
  className?: string;
};

export default function CalendarCard({
  events,
  onDateSelect,
  onEventClick,
  selectedDate,
  className = "",
}: Props) {
  // Função para agrupar eventos por data
  const eventsByDate = events.reduce((acc: Record<string, Event[]>, event) => {
    const dateKey = event.date.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  // Função para renderizar os eventos do dia selecionado
  const renderSelectedDateEvents = () => {
    if (!selectedDate) return null;
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    const dayEvents = eventsByDate[dateKey] || [];
    
    if (dayEvents.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          Nenhum evento para esta data.
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {dayEvents.map(event => (
          <div 
            key={event.id}
            className="p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            onClick={() => onEventClick(event)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  className={
                    event.type === "payment" 
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                      : event.type === "receipt" 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }
                >
                  {event.type === "payment" 
                    ? "Pagamento" 
                    : event.type === "receipt" 
                    ? "Recebimento" 
                    : event.type === "reminder"
                    ? "Lembrete"
                    : "Outro"}
                </Badge>
                <span className="font-medium text-sm">{event.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {event.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          Calendário Financeiro
        </CardTitle>
        <CardDescription>
          Acompanhe seus pagamentos e recebimentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          className="rounded-md border"
          modifiers={{
            booked: (date) => {
              const dateKey = date.toISOString().split('T')[0];
              return !!eventsByDate[dateKey];
            },
          }}
          modifiersStyles={{
            booked: {
              fontWeight: 'bold',
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              color: 'hsl(var(--primary))',
              borderRadius: '0.25rem',
            },
          }}
        />
        
        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">
                Eventos para {selectedDate.toLocaleDateString('pt-BR')}
              </h3>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => {
                    const prevDay = new Date(selectedDate);
                    prevDay.setDate(prevDay.getDate() - 1);
                    onDateSelect(prevDay);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => {
                    const nextDay = new Date(selectedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    onDateSelect(nextDay);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {renderSelectedDateEvents()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}