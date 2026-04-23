import { useAuth } from "./_core/hooks/useAuth";
import { Button } from "./components/ui/button";
import { getLoginUrl } from "./const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  MessageSquare,
  Brain,
  CheckSquare,
  Calendar,
  FolderOpen,
  Network,
  PenTool,
  BookOpen,
  Languages,
  ArrowRight,
  Terminal,
} from "lucide-react";

const features = [
  { icon: MessageSquare, label: "Real-time Chat", desc: "WebSocket-powered rooms with brutalist bubbles" },
  { icon: Brain, label: "Memory Bank", desc: "Store, organize, and search team knowledge" },
  { icon: CheckSquare, label: "Tasks & To-Do", desc: "Assignees, priorities, due dates, drag-and-drop" },
  { icon: Calendar, label: "Shared Calendar", desc: "Team scheduling with event creation" },
  { icon: FolderOpen, label: "File Explorer", desc: "S3-backed file storage with previews" },
  { icon: Network, label: "Mindmap Canvas", desc: "Visual brainstorming with nodes and connections" },
  { icon: PenTool, label: "Digital Signatures", desc: "Create, store, and sign documents" },
  { icon: BookOpen, label: "Notebook", desc: "Rich Markdown notes with graph-paper aesthetic" },
  { icon: Languages, label: "AI Translation", desc: "Dev↔casual and JP↔EN in-context" },
  { icon: Terminal, label: "Activity Log", desc: "Everything timestamped and searchable" },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation("/workspace");
  }, [user, setLocation]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 49px, oklch(0.7 0.18 55 / 0.3) 49px, oklch(0.7 0.18 55 / 0.3) 50px),
              repeating-linear-gradient(90deg, transparent, transparent 49px, oklch(0.7 0.18 55 / 0.3) 49px, oklch(0.7 0.18 55 / 0.3) 50px)`,
            }}
          />
        </div>

        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-primary/40 bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest mb-8">
              <Terminal className="w-3 h-3" />
              Startup Edition v1.0
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-none mb-6">
              <span className="text-foreground">CHATROOM</span>
              <span className="text-primary">LM</span>
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mb-4 font-light">
              A dark, industrial collaboration workspace built for
              <span className="text-primary font-medium"> founder ↔ dev </span>
              translation.
            </p>

            <p className="text-sm text-muted-foreground font-mono mb-10 max-w-xl">
              Chat + shared memory, tasks, calendar, files, mindmap, signatures —
              all wired through a single backend with AI as the language mediator.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider px-8 h-12 text-sm"
                disabled={loading}
              >
                {loading ? "Loading..." : "Enter Workspace"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-border">
        <div className="container mx-auto px-6 py-20">
          <div className="mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
              // SYSTEM MODULES
            </h2>
            <p className="text-3xl font-bold tracking-tight">
              Everything your startup needs in one terminal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {features.map((f) => (
              <div
                key={f.label}
                className="group border-2 border-border bg-card p-5 hover:border-primary/50 transition-colors"
              >
                <f.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-bold text-sm uppercase tracking-wide mb-1 text-card-foreground">
                  {f.label}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t-2 border-border">
        <div className="container mx-auto px-6 py-8 flex items-center justify-between">
          <div className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} ChatroomLM — Startup Edition
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            DARK_MODE::ALWAYS_ON
          </div>
        </div>
      </div>
    </div>
  );
}
