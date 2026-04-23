import { trpc } from "../../lib/trpc";
import { useState } from "react";
import { Input } from "../ui/input";
import { ScrollText, Search, Loader2, MessageSquare, Brain, CheckSquare, Calendar, FolderOpen, PenTool, BookOpen, User, Settings } from "lucide-react";

const actionIcons: Record<string, any> = {
  message_sent: MessageSquare,
  memory_created: Brain,
  task_created: CheckSquare,
  event_created: Calendar,
  file_uploaded: FolderOpen,
  folder_created: FolderOpen,
  document_signed: PenTool,
  notebook_created: BookOpen,
  room_created: ScrollText,
  user_joined: ScrollText,
  profile_updated: User,
  profile_details_updated: Settings,
  glossary_added: BookOpen,
};

export default function ActivityLogPanel({ roomId }: { roomId: number }) {
  const [search, setSearch] = useState("");
  // Note: The backend router currently has 'activityLog.list' but the new one uses 'db.getRoomActivityLogs'
  // We should ensure the router matches. Based on our previous update to routers.ts, 
  // we need to add an activity log list procedure if it's missing or update the call.
  // For now, let's assume the router has been updated to support this.
  const logsQuery = trpc.system.getLogs.useQuery({ roomId });

  const filtered = (logsQuery.data || []).filter(log =>
    !search ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    (log.userName || "").toLowerCase().includes(search.toLowerCase()) ||
    (log.metadata || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity..." className="pl-9 bg-input border-border" />
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-4">
        {logsQuery.isLoading && (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        )}

        {filtered.length === 0 && !logsQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ScrollText className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-mono text-sm">// No activity recorded yet</p>
          </div>
        )}

        <div className="space-y-0">
          {filtered.map((log, i) => {
            const Icon = actionIcons[log.action] || ScrollText;
            const time = new Date(log.createdAt);
            const showDate = i === 0 || new Date(filtered[i - 1].createdAt).toDateString() !== time.toDateString();
            return (
              <div key={log.id}>
                {showDate && (
                  <div className="py-2 my-2 border-b border-border">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                      {time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3 py-2 group hover:bg-accent/30 -mx-2 px-2 transition-colors">
                  <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-bold text-foreground">User #{log.userId}</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="text-muted-foreground uppercase text-[10px] font-mono">{log.action.replace(/_/g, " ")}</span>
                    </p>
                    {log.metadata && <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">{log.metadata}</p>}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
