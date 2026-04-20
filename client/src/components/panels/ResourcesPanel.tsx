import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ExternalLink, Trash2, Link as LinkIcon, Search, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ResourcesPanel() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", category: "general", tags: [] as string[] });

  const resourcesQuery = trpc.resources.list.useQuery();
  const createResource = trpc.resources.create.useMutation({
    onSuccess: () => {
      resourcesQuery.refetch();
      setIsAddOpen(false);
      setForm({ name: "", url: "", category: "general", tags: [] });
      toast.success("Resource added");
    }
  });
  const deleteResource = trpc.resources.delete.useMutation({
    onSuccess: () => resourcesQuery.refetch()
  });

  const filtered = (resourcesQuery.data || []).filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Resources Directory</h2>
            <p className="text-xs text-muted-foreground font-mono">// Links, Affiliates, and External Tools</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs">
                <Plus className="w-4 h-4 mr-2" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader>
                <DialogTitle className="font-bold uppercase tracking-wide">New Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground">Name</label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Affiliate Dashboard" className="bg-input border-border" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground">URL</label>
                  <Input value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://..." className="bg-input border-border" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground">Category</label>
                  <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g., Affiliate, Tool, Reference" className="bg-input border-border" />
                </div>
                <Button 
                  onClick={() => createResource.mutate(form)} 
                  className="w-full bg-primary text-primary-foreground font-bold uppercase"
                  disabled={createResource.isPending}
                >
                  {createResource.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Resource"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search resources by name, category, or tags..." 
            className="pl-10 bg-input border-border h-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {resourcesQuery.isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
            <LinkIcon className="w-12 h-12 mb-4" />
            <p className="font-mono uppercase tracking-widest text-sm">No resources found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(resource => (
              <div key={resource.id} className="group bg-card border-2 border-border p-4 hover:border-primary transition-colors relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 px-2 py-0.5 bg-muted rounded text-[10px] font-mono uppercase text-muted-foreground">
                    <Tag className="w-3 h-3" /> {resource.category}
                  </div>
                  <button 
                    onClick={() => deleteResource.mutate({ id: resource.id })}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-foreground mb-1 truncate">{resource.name}</h3>
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-muted hover:bg-primary hover:text-primary-foreground transition-colors text-[10px] font-bold uppercase tracking-widest"
                >
                  <ExternalLink className="w-3 h-3" /> Visit Resource
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
