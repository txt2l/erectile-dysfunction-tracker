import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  MessageSquare, Brain, CheckSquare, Calendar, FolderOpen,
  Network, PenTool, BookOpen, Languages, ArrowRight, Terminal,
  Users, Search, Map as MapIcon, Library, ScrollText, UserCircle, Settings
} from "lucide-react";

const features = [
  { icon: MessageSquare, label: "Real-time Chat", desc: "WebSocket-powered rooms with brutalist bubbles and instant delivery." },
  { icon: Users, label: "Presence Tracking", desc: "See who's online instantly with real-time status indicators." },
  { icon: UserCircle, label: "Team & Profiles", desc: "Detailed member directory with rich profiles and social links." },
  { icon: Hash, label: "Nested Rooms", desc: "Organize conversations with hierarchical room and sub-room structures." },
  { icon: Search, label: "Omnibox Search", desc: "Global command palette (Ctrl+K) to find rooms, members, and actions." },
  { icon: Terminal, label: "Command Parser", desc: "Power-user shortcuts like ^T for Team, ^G for Glossary, and PM commands." },
  { icon: BookOpen, label: "Glossary Modal", desc: "Centralized project dictionary for defining terms and sharing context." },
  { icon: Brain, label: "Memory Bank", desc: "Store team knowledge with rich metadata and source tracking." },
  { icon: MapIcon, label: "Isometric Map", desc: "Visual world map showing member locations and real-time connection lines." },
  { icon: Library, label: "Resources Directory", desc: "Curated hub for external links, affiliate resources, and project tools." },
  { icon: FolderOpen, label: "File Explorer", desc: "S3-backed storage with instant previews for media and documents." },
  { icon: CheckSquare, label: "Tasks & To-Do", desc: "Full task management with priorities, assignees, and due dates." },
  { icon: Calendar, label: "Shared Calendar", desc: "Team-wide scheduling and event tracking integrated with tasks." },
  { icon: ScrollText, label: "Activity Log", desc: "Complete audit trail of every action, timestamped and searchable." },
];

function Hash({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="4" y1="9" x2="20" y2="9"></line>
      <line x1="4" y1="15" x2="20" y2="15"></line>
      <line x1="10" y1="3" x2="8" y2="21"></line>
      <line x1="16" y1="3" x2="14" y2="21"></line>
    </svg>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const handleEnter = () => {
    if (user) {
      setLocation("/workspace");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 49px, oklch(0.7 0.18 55 / 0.3) 49px, oklch(0.7 0.18 55 / 0.3) 50px),
              repeating-linear-gradient(90deg, transparent, transparent 49px, oklch(0.7 0.18 55 / 0.3) 49px, oklch(0.7 0.18 55 / 0.3) 50px)`,
          }} />
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
              14 core modules wired through a single backend with AI as the language mediator.
              Everything your startup needs in one terminal.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={handleEnter}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider px-8 h-12 text-sm"
                disabled={loading}
              >
                {loading ? "Loading..." : user ? "Go to Workspace" : "Enter Workspace"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="border-t-2 border-border">
        <div className="container mx-auto px-6 py-20">
          <div className="mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
              // SYSTEM MODULES
            </h2>
            <p className="text-3xl font-bold tracking-tight">
              The 14-Feature Roadmap Implementation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      {/* Footer */}
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
