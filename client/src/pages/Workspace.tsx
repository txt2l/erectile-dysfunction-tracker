import { useAuth } from "../_core/hooks/useAuth";
import { Button } from "../components/ui/button";
import { getLoginUrl } from "../const";
import { trpc } from "./lib/trpc";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "wouter";
import {
  MessageSquare, Brain, CheckSquare, Calendar, FolderOpen,
  Network, PenTool, BookOpen, ScrollText, User, Plus, Hash,
  Loader2, ChevronLeft, Users, Search, Map as MapIcon, Library
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { toast } from "./components/ui/sonner";

// Panel imports
import ChatPanel from "./components/panels/ChatPanel";
import MemoryPanel from "./components/panels/MemoryPanel";
import TasksPanel from "./components/panels/TasksPanel";
import CalendarPanel from "./components/panels/CalendarPanel";
import FilesPanel from "./components/panels/FilesPanel";
import MindmapPanel from "./components/panels/MindmapPanel";
import SignaturesPanel from "./components/panels/SignaturesPanel";
import NotebookPanel from "./components/panels/NotebookPanel";
import ActivityLogPanel from "./components/panels/ActivityLogPanel";
import ProfilePanel from "./components/panels/ProfilePanel";
import TeamPanel from "./components/panels/TeamPanel";
import ResourcesPanel from "./components/panels/ResourcesPanel";
import { RoomTree } from "./components/RoomTree";
import { Omnibox } from "./components/Omnibox";
import { GlobalMap } from "./components/GlobalMap";

type PanelType = "chat" | "memory" | "tasks" | "calendar" | "files" | "mindmap" | "signatures" | "notebook" | "log" | "profile" | "team" | "resources" | "map";

const panelConfig: { id: PanelType; icon: any; label: string; shortcut: string }[] = [
  { id: "chat", icon: MessageSquare, label: "Chat", shortcut: "^C" },
  { id: "team", icon: Users, label: "Team", shortcut: "^T" },
  { id: "resources", icon: Library, label: "Resources", shortcut: "^R" },
  { id: "map", icon: MapIcon, label: "Map", shortcut: "^G" },
  { id: "memory", icon: Brain, label: "Memory", shortcut: "^M" },
  { id: "tasks", icon: CheckSquare, label: "Tasks", shortcut: "^K" },
  { id: "calendar", icon: Calendar, label: "Calendar", shortcut: "^D" },
  { id: "mindmap", icon: Network, label: "Mindmap", shortcut: "^X" },
  { id: "signatures", icon: PenTool, label: "Signatures", shortcut: "^S" },
  { id: "notebook", icon: BookOpen, label: "Notebook", shortcut: "^N" },
  { id: "log", icon: ScrollText, label: "Log", shortcut: "^L" },
  { id: "profile", icon: User, label: "Profile", shortcut: "^P" },
];

export default function Workspace() {
  const { user, loading: authLoading, logout } = useAuth();
  const params = useParams<{ roomId?: string }>();
  const [activePanel, setActivePanel] = useState<PanelType>("chat");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    params.roomId ? parseInt(params.roomId) : null
  );
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomParentId, setNewRoomParentId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const roomsQuery = trpc.rooms.list.useQuery(undefined, { enabled: !!user });
  const createRoom = trpc.rooms.create.useMutation({
    onSuccess: (data) => {
      roomsQuery.refetch();
      setSelectedRoomId(data.id);
      setCreateRoomOpen(false);
      setNewRoomName("");
      setNewRoomParentId(null);
      toast.success("Room created");
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const map: Record<string, PanelType> = {
          t: "team", g: "glossary" as any, p: "profile", n: "note" as any,
          r: "resources", m: "memory", k: "tasks", d: "calendar", x: "mindmap",
        };
        const panel = map[e.key.toLowerCase()];
        if (panel) {
          e.preventDefault();
          setActivePanel(prev => prev === panel ? "chat" : panel);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Auto-select first room
  useEffect(() => {
    if (!selectedRoomId && roomsQuery.data && roomsQuery.data.length > 0) {
      setSelectedRoomId(roomsQuery.data[0].id);
    }
  }, [roomsQuery.data, selectedRoomId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-foreground">CHATROOM</span>
            <span className="text-primary">LM</span>
          </h1>
          <p className="text-muted-foreground">Sign in to access your workspace</p>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="bg-primary text-primary-foreground font-bold uppercase tracking-wider"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const renderPanel = () => {
    if (!selectedRoomId && !["team", "profile", "map", "resources"].includes(activePanel)) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-4">
            <Hash className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-lg">Select or create a room to get started</p>
          </div>
        </div>
      );
    }
    const props = { roomId: selectedRoomId || 0 };
    switch (activePanel) {
      case "chat": return <ChatPanel {...props} />;
      case "team": return <TeamPanel />;
      case "resources": return <ResourcesPanel />;
      case "map": return <GlobalMap />;
      case "memory": return <MemoryPanel {...props} />;
      case "tasks": return <TasksPanel {...props} />;
      case "calendar": return <CalendarPanel {...props} />;
      case "files": return <FilesPanel {...props} />;
      case "mindmap": return <MindmapPanel {...props} />;
      case "signatures": return <SignaturesPanel />;
      case "notebook": return <NotebookPanel {...props} />;
      case "log": return <ActivityLogPanel {...props} />;
      case "profile": return <ProfilePanel />;
      default: return <ChatPanel {...props} />;
    }
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Omnibox />
      
      {/* Left sidebar — rooms + nav icons */}
      <div className={`flex flex-col border-r-2 border-border bg-sidebar transition-all ${sidebarCollapsed ? "w-16" : "w-60"}`}>
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-3 border-b-2 border-border shrink-0">
          {!sidebarCollapsed && (
            <span className="font-bold text-sm tracking-tight truncate">
              <span className="text-sidebar-foreground">CHATROOM</span>
              <span className="text-primary">LM</span>
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-sidebar-accent rounded text-muted-foreground"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-y-auto py-2">
          {!sidebarCollapsed && (
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Rooms</span>
              <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
                <DialogTrigger asChild>
                  <button className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-primary">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-card border-2 border-border">
                  <DialogHeader>
                    <DialogTitle className="font-bold uppercase tracking-wide">
                      {newRoomParentId ? "New Sub-room" : "New Room"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); if (newRoomName.trim()) createRoom.mutate({ name: newRoomName.trim(), parentId: newRoomParentId ?? undefined }); }}>
                    <Input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Room name..."
                      className="bg-input border-border mb-4"
                      autoFocus
                    />
                    <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold uppercase" disabled={createRoom.isPending}>
                      {createRoom.isPending ? "Creating..." : "Create Room"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {!sidebarCollapsed ? (
            <RoomTree 
              selectedRoomId={selectedRoomId} 
              onSelect={setSelectedRoomId} 
              onCreateSubroom={(parentId) => {
                setNewRoomParentId(parentId.toString());
                setCreateRoomOpen(true);
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              {roomsQuery.data?.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
                    selectedRoomId === room.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-sidebar-accent"
                  }`}
                  title={room.name}
                >
                  <Hash className="w-4 h-4" />
                </button>
              ))}
              <button
                onClick={() => setCreateRoomOpen(true)}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="border-t-2 border-border p-2 shrink-0">
          <button
            onClick={() => setActivePanel("profile")}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-sidebar-accent transition-colors"
          >
            <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium truncate text-sidebar-foreground">{user.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email || ""}</p>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Panel navigation strip */}
      <div className="w-14 flex flex-col border-r-2 border-border bg-background shrink-0">
        {panelConfig.map((panel) => (
          <button
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`w-full aspect-square flex flex-col items-center justify-center gap-1 transition-all ${
              activePanel === panel.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
            title={`${panel.label} (${panel.shortcut})`}
          >
            <panel.icon className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">{panel.label}</span>
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {renderPanel()}
      </div>
    </div>
  );
}
