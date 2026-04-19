import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, PenTool, Loader2, Eraser, Download } from "lucide-react";
import { toast } from "sonner";

export default function SignaturesPanel() {
  const [createOpen, setCreateOpen] = useState(false);
  const [sigName, setSigName] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#f97316");
  const [penSize, setPenSize] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const signaturesQuery = trpc.signatures.list.useQuery();
  const createSignature = trpc.signatures.create.useMutation({
    onSuccess: () => { signaturesQuery.refetch(); setCreateOpen(false); setSigName(""); toast.success("Signature saved"); },
  });
  const deleteSignature = trpc.signatures.delete.useMutation({
    onSuccess: () => { signaturesQuery.refetch(); toast.success("Signature deleted"); },
  });

  useEffect(() => {
    if (createOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "oklch(0.15 0.005 250)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw grid
        ctx.strokeStyle = "oklch(0.22 0.005 250)";
        ctx.lineWidth = 0.5;
        for (let x = 0; x < canvas.width; x += 20) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 20) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        // Signature line
        ctx.strokeStyle = "oklch(0.35 0.01 250)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(40, canvas.height - 40); ctx.lineTo(canvas.width - 40, canvas.height - 40); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [createOpen]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "oklch(0.15 0.005 250)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "oklch(0.22 0.005 250)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.strokeStyle = "oklch(0.35 0.01 250)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(40, canvas.height - 40); ctx.lineTo(canvas.width - 40, canvas.height - 40); ctx.stroke();
    ctx.setLineDash([]);
  };

  const saveSignature = () => {
    if (!sigName.trim()) { toast.error("Please enter a name"); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    createSignature.mutate({ name: sigName, imageBase64: base64 });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">// Your Signatures</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground font-bold">
              <Plus className="w-4 h-4 mr-1" /> New Signature
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-2 border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-bold uppercase tracking-wide">Create Signature</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input value={sigName} onChange={(e) => setSigName(e.target.value)} placeholder="Signature name" className="bg-input border-border" />

              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">Color:</span>
                  {["#f97316", "#ffffff", "#60a5fa", "#4ade80"].map(c => (
                    <button key={c} onClick={() => setPenColor(c)} className={`w-5 h-5 rounded-full border-2 ${penColor === c ? "border-primary" : "border-border"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">Size:</span>
                  {[2, 3, 5].map(s => (
                    <button key={s} onClick={() => setPenSize(s)} className={`px-2 py-0.5 text-[10px] font-mono border ${penSize === s ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                      {s}px
                    </button>
                  ))}
                </div>
                <button onClick={clearCanvas} className="p-1.5 text-muted-foreground hover:text-destructive" title="Clear">
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              <canvas
                ref={canvasRef}
                width={440}
                height={200}
                className="w-full border-2 border-border cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
              />

              <Button onClick={saveSignature} className="w-full bg-primary text-primary-foreground font-bold" disabled={createSignature.isPending}>
                {createSignature.isPending ? "Saving..." : "Save Signature"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Signatures list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {signaturesQuery.isLoading && (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        )}

        {(signaturesQuery.data || []).length === 0 && !signaturesQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PenTool className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-mono text-sm">// No signatures created yet</p>
          </div>
        )}

        {(signaturesQuery.data || []).map(sig => (
          <div key={sig.id} className="border-2 border-border bg-card p-4 group">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm uppercase tracking-wide">{sig.name}</h4>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={sig.imageUrl} download={`${sig.name}.png`} className="p-1 text-muted-foreground hover:text-primary">
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => deleteSignature.mutate({ id: sig.id })} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="bg-background/50 border border-border p-2">
              <img src={sig.imageUrl} alt={sig.name} className="max-h-24 mx-auto" />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-2">{new Date(sig.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
