import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Edit3, BookOpen, Loader2, Languages, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function NotebookPanel({ roomId }: { roomId: number }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  const notebooksQuery = trpc.notebooks.list.useQuery({ roomId });
  const createNotebook = trpc.notebooks.create.useMutation({
    onSuccess: (data) => { notebooksQuery.refetch(); setCreateOpen(false); setSelectedId(data.id); setForm({ title: "", content: "" }); toast.success("Notebook created"); },
  });
  const updateNotebook = trpc.notebooks.update.useMutation({
    onSuccess: () => { notebooksQuery.refetch(); setEditing(false); toast.success("Saved"); },
  });
  const deleteNotebook = trpc.notebooks.delete.useMutation({
    onSuccess: () => { notebooksQuery.refetch(); setSelectedId(null); toast.success("Notebook deleted"); },
  });
  const translateMutation = trpc.ai.translate.useMutation();

  const selected = (notebooksQuery.data || []).find(n => n.id === selectedId);

  const handleTranslate = async (mode: "dev_to_casual" | "casual_to_dev" | "ja_to_en" | "en_to_ja") => {
    if (!form.content.trim()) return;
    try {
      const result = await translateMutation.mutateAsync({ text: form.content, mode });
      setForm({ ...form, content: result.translated });
      toast.success("Translation applied");
    } catch {
      toast.error("Translation failed");
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar list */}
      <div className="w-56 border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Notebooks</span>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button className="p-1 text-muted-foreground hover:text-primary"><Plus className="w-4 h-4" /></button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader><DialogTitle className="font-bold uppercase tracking-wide">New Notebook</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notebook title" className="bg-input border-border" />
                <Button onClick={() => form.title && createNotebook.mutate({ roomId, title: form.title })} className="w-full bg-primary text-primary-foreground font-bold">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notebooksQuery.isLoading && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>}
          {(notebooksQuery.data || []).map(nb => (
            <button
              key={nb.id}
              onClick={() => { setSelectedId(nb.id); setForm({ title: nb.title, content: nb.content || "" }); setEditing(false); setPreview(false); }}
              className={`w-full text-left px-3 py-2.5 border-b border-border transition-colors ${
                selectedId === nb.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              }`}
            >
              <p className="text-sm font-bold truncate">{nb.title}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{new Date(nb.updatedAt).toLocaleDateString()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="p-3 border-b border-border flex items-center gap-2">
              {editing ? (
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-input border-border flex-1" />
              ) : (
                <h3 className="font-bold text-sm uppercase tracking-wide flex-1">{selected.title}</h3>
              )}
              <button onClick={() => setPreview(!preview)} className={`p-1.5 rounded ${preview ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`} title="Toggle preview">
                {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              {/* AI Translation */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-1.5 text-muted-foreground hover:text-primary rounded flex items-center gap-1" title="AI Translate">
                    <Languages className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-popover border-border" align="end">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Translate content</p>
                  {[
                    { mode: "dev_to_casual" as const, label: "Dev → Casual" },
                    { mode: "casual_to_dev" as const, label: "Casual → Dev" },
                    { mode: "ja_to_en" as const, label: "日本語 → English" },
                    { mode: "en_to_ja" as const, label: "English → 日本語" },
                  ].map(t => (
                    <button key={t.mode} onClick={() => handleTranslate(t.mode)} disabled={translateMutation.isPending} className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded disabled:opacity-50">
                      {t.label}
                    </button>
                  ))}
                  {translateMutation.isPending && <div className="flex items-center gap-2 px-2 py-1 text-xs text-primary"><Loader2 className="w-3 h-3 animate-spin" /> Translating...</div>}
                </PopoverContent>
              </Popover>

              {editing ? (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => updateNotebook.mutate({ id: selected.id, ...form })} className="bg-primary text-primary-foreground text-xs">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm({ title: selected.title, content: selected.content || "" }); }} className="text-xs">Cancel</Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <button onClick={() => setEditing(true)} className="p-1.5 text-muted-foreground hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteNotebook.mutate({ id: selected.id })} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {editing ? (
                <div className="h-full relative" style={{
                  backgroundImage: `repeating-linear-gradient(oklch(0.25 0.005 250) 0px, oklch(0.25 0.005 250) 1px, transparent 1px, transparent 24px),
                    repeating-linear-gradient(90deg, oklch(0.25 0.005 250) 0px, oklch(0.25 0.005 250) 1px, transparent 1px, transparent 24px)`,
                  backgroundSize: "24px 24px",
                }}>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Write your notes here... (Markdown supported)"
                    className="h-full bg-transparent border-0 resize-none font-mono text-sm leading-6 focus-visible:ring-0 p-4"
                  />
                </div>
              ) : preview ? (
                <div className="p-4 prose prose-invert prose-sm max-w-none">
                  <Streamdown>{selected.content || "*Empty notebook*"}</Streamdown>
                </div>
              ) : (
                <div className="p-4 relative" style={{
                  backgroundImage: `repeating-linear-gradient(oklch(0.25 0.005 250) 0px, oklch(0.25 0.005 250) 1px, transparent 1px, transparent 24px),
                    repeating-linear-gradient(90deg, oklch(0.25 0.005 250) 0px, oklch(0.25 0.005 250) 1px, transparent 1px, transparent 24px)`,
                  backgroundSize: "24px 24px",
                }}>
                  <pre className="font-mono text-sm whitespace-pre-wrap text-foreground leading-6">{selected.content || "// Empty notebook — click edit to start writing"}</pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-mono text-sm">// Select or create a notebook</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
