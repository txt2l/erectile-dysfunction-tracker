import { trpc } from "../../lib/trpc";
import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import {
  FolderOpen, Plus, Upload, Trash2, Search, File, Image, Music,
  Video, FileText, Archive, Loader2, FolderPlus, ChevronRight, X
} from "lucide-react";
import { toast } from "sonner";

const getFileIcon = (mimeType?: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.includes("pdf") || mimeType.includes("text")) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("archive")) return Archive;
  return File;
};

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FilesPanel({ roomId }: { roomId: number }) {
  const [search, setSearch] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<number | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<{ id?: number; name: string }[]>([{ name: "Root" }]);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#f97316");
  const [previewFile, setPreviewFile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const foldersQuery = trpc.files.listFolders.useQuery({ roomId });
  const filesQuery = trpc.files.listFiles.useQuery({ roomId, folderId: currentFolderId });
  const createFolder = trpc.files.createFolder.useMutation({
    onSuccess: () => { foldersQuery.refetch(); setCreateFolderOpen(false); setNewFolderName(""); toast.success("Folder created"); },
  });
  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: () => { filesQuery.refetch(); toast.success("File uploaded"); },
  });
  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: () => { filesQuery.refetch(); toast.success("File deleted"); },
  });
  const deleteFolder = trpc.files.deleteFolder.useMutation({
    onSuccess: () => { foldersQuery.refetch(); toast.success("Folder deleted"); },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("File too large (max 50MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadFile.mutate({
        roomId, name: file.name, base64,
        mimeType: file.type, size: file.size,
        folderId: currentFolderId,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const navigateToFolder = (folderId: number, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);
  };

  const navigateToPathIndex = (index: number) => {
    const item = folderPath[index];
    setCurrentFolderId(item.id);
    setFolderPath(folderPath.slice(0, index + 1));
  };

  const currentFolders = (foldersQuery.data || []).filter(f =>
    currentFolderId ? f.parentId === currentFolderId : !f.parentId
  );

  const filteredFiles = (filesQuery.data || []).filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="pl-9 bg-input border-border" />
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
          <Button size="sm" onClick={() => fileInputRef.current?.click()} className="bg-primary text-primary-foreground font-bold" disabled={uploadFile.isPending}>
            {uploadFile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1" /> Upload</>}
          </Button>
          <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-border"><FolderPlus className="w-4 h-4" /></Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader><DialogTitle className="font-bold uppercase tracking-wide">New Folder</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" className="bg-input border-border" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">Color:</span>
                  <input type="color" value={newFolderColor} onChange={(e) => setNewFolderColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <Button onClick={() => newFolderName && createFolder.mutate({ roomId, name: newFolderName, parentId: currentFolderId, color: newFolderColor })} className="w-full bg-primary text-primary-foreground font-bold">
                  Create Folder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground overflow-x-auto">
          {folderPath.map((item, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              <button onClick={() => navigateToPathIndex(i)} className="hover:text-primary transition-colors">
                {item.name}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Folders */}
        {currentFolders.map(folder => (
          <div
            key={`folder-${folder.id}`}
            className="border-2 border-border bg-card p-3 flex items-center gap-3 group cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigateToFolder(folder.id, folder.name)}
          >
            <FolderOpen className="w-5 h-5 shrink-0" style={{ color: folder.color || "#f97316" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{folder.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{new Date(folder.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); deleteFolder.mutate({ id: folder.id }); }}
              className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Files */}
        {filteredFiles.map(file => {
          const Icon = getFileIcon(file.mimeType);
          return (
            <div
              key={`file-${file.id}`}
              className="border-2 border-border bg-card p-3 flex items-center gap-3 group cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setPreviewFile(file)}
            >
              <Icon className="w-5 h-5 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{file.name}</p>
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                  <span>{formatSize(file.size)}</span>
                  <span>{file.mimeType || "unknown"}</span>
                  <span>{new Date(file.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteFile.mutate({ id: file.id }); }}
                className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {currentFolders.length === 0 && filteredFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-mono text-sm">// Empty directory</p>
          </div>
        )}
      </div>

      {/* File Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="bg-card border-2 border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-bold uppercase tracking-wide truncate">{previewFile.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {previewFile.mimeType?.startsWith("image/") && (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[60vh] object-contain mx-auto" />
              )}
              {previewFile.mimeType?.startsWith("video/") && (
                <video src={previewFile.url} controls className="max-w-full max-h-[60vh] mx-auto" />
              )}
              {previewFile.mimeType?.startsWith("audio/") && (
                <audio src={previewFile.url} controls className="w-full" />
              )}
              {!previewFile.mimeType?.startsWith("image/") && !previewFile.mimeType?.startsWith("video/") && !previewFile.mimeType?.startsWith("audio/") && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Preview not available for this file type.</p>
                  <a href={previewFile.url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-primary text-primary-foreground">Download File</Button>
                  </a>
                </div>
              )}
              <div className="text-[10px] font-mono text-muted-foreground space-y-1 border-t border-border pt-3">
                <p>Size: {formatSize(previewFile.size)}</p>
                <p>Type: {previewFile.mimeType || "unknown"}</p>
                <p>Uploaded: {new Date(previewFile.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
