import { trpc } from "../../lib/trpc";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Plus, Trash2, Network, Loader2, Move, Link2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type NodeData = { id: number; label: string | null; content: string | null; nodeType: string; posX: number; posY: number; width: number; height: number };
type EdgeData = { id: number; sourceId: number; targetId: number; label: string | null };

export default function MindmapPanel({ roomId }: { roomId: number }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<number | null>(null);
  const [editNode, setEditNode] = useState<NodeData | null>(null);
  const [editForm, setEditForm] = useState({ label: "", content: "" });
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const nodesQuery = trpc.mindmap.listNodes.useQuery({ roomId });
  const edgesQuery = trpc.mindmap.listEdges.useQuery({ roomId });
  const createNode = trpc.mindmap.createNode.useMutation({ onSuccess: () => nodesQuery.refetch() });
  const updateNode = trpc.mindmap.updateNode.useMutation({ onSuccess: () => nodesQuery.refetch() });
  const deleteNode = trpc.mindmap.deleteNode.useMutation({ onSuccess: () => { nodesQuery.refetch(); edgesQuery.refetch(); } });
  const createEdge = trpc.mindmap.createEdge.useMutation({ onSuccess: () => edgesQuery.refetch() });
  const deleteEdge = trpc.mindmap.deleteEdge.useMutation({ onSuccess: () => edgesQuery.refetch() });

  const nodes: NodeData[] = (nodesQuery.data || []) as NodeData[];
  const edges: EdgeData[] = (edgesQuery.data || []) as EdgeData[];

  const addNode = () => {
    const x = Math.round((-pan.x + 400) / zoom);
    const y = Math.round((-pan.y + 300) / zoom);
    createNode.mutate({ roomId, label: "New Node", posX: x, posY: y, nodeType: "text" });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: NodeData) => {
    if (connecting !== null) {
      if (connecting !== node.id) {
        createEdge.mutate({ roomId, sourceId: connecting, targetId: node.id });
        toast.success("Connection created");
      }
      setConnecting(null);
      return;
    }
    e.stopPropagation();
    setDragging(node.id);
    setDragOffset({ x: e.clientX - node.posX * zoom - pan.x, y: e.clientY - node.posY * zoom - pan.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragging !== null) {
      const newX = Math.round((e.clientX - dragOffset.x - pan.x) / zoom);
      const newY = Math.round((e.clientY - dragOffset.y - pan.y) / zoom);
      updateNode.mutate({ id: dragging, posX: newX, posY: newY });
    }
    if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    }
  }, [dragging, dragOffset, pan, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    isPanning.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [handleMouseMove, handleMouseUp]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-bg")) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const getNodeCenter = (node: NodeData) => ({
    x: node.posX * zoom + pan.x + (node.width * zoom) / 2,
    y: node.posY * zoom + pan.y + (node.height * zoom) / 2,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button size="sm" onClick={addNode} className="bg-primary text-primary-foreground font-bold">
          <Plus className="w-4 h-4 mr-1" /> Add Node
        </Button>
        <Button
          size="sm"
          variant={connecting !== null ? "default" : "outline"}
          onClick={() => { setConnecting(connecting !== null ? null : -1); if (connecting === null) toast.info("Click a source node, then a target node"); }}
          className={connecting !== null ? "bg-primary text-primary-foreground" : "border-border"}
        >
          <Link2 className="w-4 h-4 mr-1" /> {connecting !== null ? "Cancel" : "Connect"}
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomIn className="w-4 h-4" /></button>
        <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomOut className="w-4 h-4" /></button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 text-muted-foreground hover:text-foreground" title="Reset view"><RotateCcw className="w-4 h-4" /></button>
        {connecting !== null && <span className="text-xs text-primary font-mono ml-2">Click source node...</span>}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        style={{ background: `
          radial-gradient(circle, oklch(0.25 0.005 250) 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div className="canvas-bg absolute inset-0" />

        {/* SVG for edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {edges.map(edge => {
            const source = nodes.find(n => n.id === edge.sourceId);
            const target = nodes.find(n => n.id === edge.targetId);
            if (!source || !target) return null;
            const s = getNodeCenter(source);
            const t = getNodeCenter(target);
            return (
              <g key={edge.id}>
                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="oklch(0.7 0.18 55)" strokeWidth="2" strokeDasharray="6 3" />
                {edge.label && (
                  <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 8} fill="oklch(0.6 0.015 250)" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">{edge.label}</text>
                )}
                <circle
                  cx={(s.x + t.x) / 2} cy={(s.y + t.y) / 2} r="6"
                  fill="oklch(0.19 0.005 250)" stroke="oklch(0.6 0.22 25)" strokeWidth="1.5"
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => deleteEdge.mutate({ id: edge.id })}
                />
                <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 + 3} fill="oklch(0.6 0.22 25)" fontSize="8" textAnchor="middle" className="pointer-events-none">×</text>
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            className={`absolute border-2 bg-card p-3 cursor-move select-none group transition-shadow ${
              connecting !== null ? "cursor-crosshair hover:border-primary" : "hover:shadow-lg hover:shadow-primary/10"
            } ${dragging === node.id ? "border-primary shadow-lg shadow-primary/20" : "border-border"}`}
            style={{
              left: node.posX * zoom + pan.x,
              top: node.posY * zoom + pan.y,
              width: node.width * zoom,
              minHeight: 60 * zoom,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              zIndex: dragging === node.id ? 10 : 2,
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
            onDoubleClick={() => { setEditNode(node); setEditForm({ label: node.label || "", content: node.content || "" }); }}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-card-foreground truncate flex-1">{node.label || "Untitled"}</p>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNode.mutate({ id: node.id }); }}
                className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {node.content && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-3">{node.content}</p>}
            <Move className="w-3 h-3 absolute bottom-1 right-1 text-muted-foreground/30" />
          </div>
        ))}

        {nodes.length === 0 && !nodesQuery.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
            <div className="text-center text-muted-foreground">
              <Network className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-mono text-sm opacity-50">// Click "Add Node" to start brainstorming</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit node dialog */}
      <Dialog open={!!editNode} onOpenChange={() => setEditNode(null)}>
        <DialogContent className="bg-card border-2 border-border">
          <DialogHeader><DialogTitle className="font-bold uppercase tracking-wide">Edit Node</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} placeholder="Label" className="bg-input border-border" />
            <Input value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} placeholder="Content / notes" className="bg-input border-border" />
            <Button onClick={() => { if (editNode) { updateNode.mutate({ id: editNode.id, label: editForm.label, content: editForm.content }); setEditNode(null); } }} className="w-full bg-primary text-primary-foreground font-bold">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
