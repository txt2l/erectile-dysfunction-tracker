import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Tag, Trash2, Edit3, Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function MemoryPanel({ roomId }: { roomId: number }) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });

  const memoryQuery = trpc.memory.list.useQuery({ roomId });
  const createMemory = trpc.memory.create.useMutation({
    onSuccess: () => { memoryQuery.refetch(); setCreateOpen(false); setForm({ title: "", content: "", tags: "" }); toast.success("Memory saved"); },
  });
  const updateMemory = trpc.memory.update.useMutation({
    onSuccess: () => { memoryQuery.refetch(); setEditId(null); toast.success("Memory updated"); },
  });
  const deleteMemory = trpc.memory.delete.useMutation({
    onSuccess: () => { memoryQuery.refetch(); toast.success("Memory deleted"); },
  });

  const filtered = (memoryQuery.data || []).filter(m =>
    !search || m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.content || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.tags || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="pl-9 bg-input border-border"
          />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground font-bold">
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-2 border-border">
            <DialogHeader>
              <DialogTitle className="font-bold uppercase tracking-wide">New Memory</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="bg-input border-border" />
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Content (Markdown supported)" className="bg-input border-border min-h-[150px]" />
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (comma-separated)" className="bg-input border-border" />
              <Button onClick={() => form.title && createMemory.mutate({ roomId, ...form })} className="w-full bg-primary text-primary-foreground font-bold" disabled={createMemory.isPending}>
                {createMemory.isPending ? "Saving..." : "Save Memory"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {memoryQuery.isLoading && (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        )}

        {filtered.length === 0 && !memoryQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Brain className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-mono text-sm">// No memories stored yet</p>
          </div>
        )}

        {filtered.map((mem) => (
          <div key={mem.id} className="border-2 border-border bg-card p-4 group">
            {editId === mem.id ? (
              <div className="space-y-2">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-input border-border" />
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="bg-input border-border min-h-[100px]" />
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-input border-border" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateMemory.mutate({ id: mem.id, ...form })} className="bg-primary text-primary-foreground">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-card-foreground">{mem.title}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditId(mem.id); setForm({ title: mem.title, content: mem.content || "", tags: mem.tags || "" }); }} className="p-1 text-muted-foreground hover:text-primary">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteMemory.mutate({ id: mem.id })} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {mem.content && (
                  <div className="text-sm text-muted-foreground mb-2 prose prose-invert prose-sm max-w-none">
                    <Streamdown>{mem.content}</Streamdown>
                  </div>
                )}
                {mem.tags && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag className="w-3 h-3 text-primary" />
                    {mem.tags.split(",").map((tag, i) => (
                      <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[10px] font-mono text-muted-foreground mt-2">
                  {new Date(mem.updatedAt).toLocaleString()}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
