import { trpc } from "../../lib/trpc";
import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalIcon, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CalendarPanel({ roomId }: { roomId: number }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({ title: "", description: "", startTime: "", endTime: "" });

  const eventsQuery = trpc.calendar.list.useQuery({ roomId });
  const createEvent = trpc.calendar.create.useMutation({
    onSuccess: () => { eventsQuery.refetch(); setCreateOpen(false); setForm({ title: "", description: "", startTime: "", endTime: "" }); toast.success("Event created"); },
  });
  const deleteEvent = trpc.calendar.delete.useMutation({
    onSuccess: () => { eventsQuery.refetch(); toast.success("Event deleted"); },
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const getEventsForDay = (day: number) => {
    return (eventsQuery.data || []).filter(e => {
      const d = new Date(e.startTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    const dateStr = date.toISOString().slice(0, 16);
    setForm({ ...form, startTime: dateStr });
    setCreateOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 hover:bg-accent rounded text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
          <h2 className="font-bold text-sm uppercase tracking-wider min-w-[160px] text-center">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button onClick={nextMonth} className="p-1.5 hover:bg-accent rounded text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <Button onClick={() => setCurrentDate(new Date())} variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground">
          TODAY
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {eventsQuery.isLoading && (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
            <div key={d} className="text-center text-[10px] font-mono text-muted-foreground py-2">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-px">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} className="min-h-[80px]" />;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const dayEvents = getEventsForDay(day);
            return (
              <div
                key={i}
                onClick={() => handleDayClick(day)}
                className={`min-h-[80px] border border-border p-1.5 cursor-pointer hover:border-primary/50 transition-colors ${
                  isToday ? "border-primary bg-primary/5" : "bg-card"
                }`}
              >
                <div className={`text-xs font-mono mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {day}
                </div>
                {dayEvents.slice(0, 3).map(evt => (
                  <div key={evt.id} className="text-[10px] px-1 py-0.5 mb-0.5 bg-primary/15 text-primary border-l-2 border-primary truncate">
                    {evt.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground font-mono">+{dayEvents.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Events list below calendar */}
        <div className="mt-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            // UPCOMING EVENTS
          </h3>
          <div className="space-y-2">
            {(eventsQuery.data || []).slice(0, 10).map(evt => (
              <div key={evt.id} className="border-2 border-border bg-card p-3 flex items-center justify-between group">
                <div>
                  <p className="text-sm font-bold">{evt.title}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {new Date(evt.startTime).toLocaleString()}
                    {evt.endTime && ` → ${new Date(evt.endTime).toLocaleTimeString()}`}
                  </p>
                  {evt.description && <p className="text-xs text-muted-foreground mt-1">{evt.description}</p>}
                </div>
                <button
                  onClick={() => deleteEvent.mutate({ id: evt.id })}
                  className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create event dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-2 border-border">
          <DialogHeader>
            <DialogTitle className="font-bold uppercase tracking-wide">New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="bg-input border-border" />
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="bg-input border-border" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase">Start</label>
                <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="bg-input border-border" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase">End</label>
                <Input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="bg-input border-border" />
              </div>
            </div>
            <Button
              onClick={() => form.title && form.startTime && createEvent.mutate({
                roomId, title: form.title, description: form.description || undefined,
                startTime: new Date(form.startTime),
                endTime: form.endTime ? new Date(form.endTime) : undefined,
              })}
              className="w-full bg-primary text-primary-foreground font-bold"
              disabled={createEvent.isPending}
            >
              {createEvent.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
