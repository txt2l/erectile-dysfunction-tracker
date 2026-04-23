import { trpc } from "../../lib/trpc";
import { useAuth } from "../../_core/hooks/useAuth";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { Plus, Trash2, Edit3, CheckSquare, Loader2, GripVertical, AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { toast } from "sonner";

const priorityConfig = {
  urgent: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
  high: { icon: ArrowUp, color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  medium: { icon: Minus, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  low: { icon: ArrowDown, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
};

const statusLabels = { todo: "TO DO", in_progress: "IN PROGRESS", done: "DONE" };

export default function TasksPanel({ roomId }: { roomId: number }) {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as string, dueDate: "" });
  const [filter, setFilter] = useState<string>("all");

  const tasksQuery = trpc.tasks.list.useQuery({ roomId });
  const membersQuery = trpc.rooms.members.useQuery({ roomId });
  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => { tasksQuery.refetch(); setCreateOpen(false); setForm({ title: "", description: "", priority: "medium", dueDate: "" }); toast.success("Task created"); },
  });
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => { tasksQuery.refetch(); setEditId(null); toast.success("Task updated"); },
  });
  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => { tasksQuery.refetch(); toast.success("Task deleted"); },
  });

  const tasks = (tasksQuery.data || []).filter(t => filter === "all" || t.status === filter);

  const toggleStatus = (task: any) => {
    const next = task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done";
    updateTask.mutate({ id: task.id, status: next as any });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {["all", "todo", "in_progress", "done"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                filter === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s === "all" ? "ALL" : statusLabels[s as keyof typeof statusLabels]}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground font-bold">
              <Plus className="w-4 h-4 mr-1" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-2 border-border">
            <DialogHeader>
              <DialogTitle className="font-bold uppercase tracking-wide">New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" className="bg-input border-border" />
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="bg-input border-border" />
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="bg-input border-border" />
              <Button
                onClick={() => form.title && createTask.mutate({
                  roomId, title: form.title, description: form.description || undefined,
                  priority: form.priority as any,
                  dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
                })}
                className="w-full bg-primary text-primary-foreground font-bold"
                disabled={createTask.isPending}
              >
                {createTask.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tasksQuery.isLoading && (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        )}

        {tasks.length === 0 && !tasksQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckSquare className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-mono text-sm">// No tasks yet</p>
          </div>
        )}

        {tasks.map((task) => {
          const pConfig = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
          const PIcon = pConfig.icon;
          return (
            <div
              key={task.id}
              className={`border-2 border-border bg-card p-3 group flex items-start gap-3 transition-colors ${
                task.status === "done" ? "opacity-60" : ""
              }`}
            >
              <button className="mt-1 text-muted-foreground cursor-grab"><GripVertical className="w-3.5 h-3.5" /></button>

              <Checkbox
                checked={task.status === "done"}
                onCheckedChange={() => toggleStatus(task)}
                className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />

              <div className="flex-1 min-w-0">
                {editId === task.id ? (
                  <div className="space-y-2">
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-input border-border" />
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-input border-border" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateTask.mutate({ id: task.id, title: form.title, description: form.description })} className="bg-primary text-primary-foreground">Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold ${task.status === "done" ? "line-through" : ""}`}>
                        {task.title}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono uppercase border ${pConfig.bg} ${pConfig.color}`}>
                        <PIcon className="w-2.5 h-2.5" />
                        {task.priority}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase border border-border text-muted-foreground">
                        {statusLabels[task.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mb-1">{task.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditId(task.id); setForm({ title: task.title, description: task.description || "", priority: task.priority, dueDate: "" }); }} className="p-1 text-muted-foreground hover:text-primary">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteTask.mutate({ id: task.id })} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
