import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Search, Plus, BookOpen, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function GlossaryPanel() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: "", definition: "" });
  
  const glossaryQuery = trpc.glossary.list.useQuery();
  const addMutation = trpc.glossary.add.useMutation({
    onSuccess: () => {
      glossaryQuery.refetch();
      setIsAddOpen(false);
      setNewEntry({ name: "", definition: "" });
      toast.success("Glossary entry added");
    }
  });

  const filtered = glossaryQuery.data?.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-6 border-b-2 border-border">
        <div className="max-w-2xl mx-auto flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search glossary..." 
              className="pl-10 bg-input border-2 border-border focus-visible:border-primary"
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-bold uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-2" /> Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader>
                <DialogTitle className="text-xs font-mono uppercase tracking-widest text-primary mb-4">// New Glossary Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Term Name</label>
                  <Input 
                    value={newEntry.name}
                    onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                    placeholder="e.g. tRPC"
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Definition</label>
                  <Textarea 
                    value={newEntry.definition}
                    onChange={(e) => setNewEntry({ ...newEntry, definition: e.target.value })}
                    placeholder="Describe the term..."
                    className="bg-input border-border min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={() => addMutation.mutate(newEntry)}
                  disabled={!newEntry.name || !newEntry.definition || addMutation.isPending}
                  className="w-full bg-primary text-primary-foreground font-bold uppercase"
                >
                  {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {glossaryQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            filtered?.map((entry) => (
              <div key={entry.id} className="p-5 border-2 border-border bg-card hover:border-primary/50 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-lg tracking-tight">{entry.name}</h3>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{entry.definition}</p>
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    Added by User #{entry.createdBy}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}

          {!glossaryQuery.isLoading && filtered?.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border rounded">
              <p className="font-mono text-sm text-muted-foreground">// No glossary entries found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
