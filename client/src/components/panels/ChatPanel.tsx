import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Send, SmilePlus, Reply, Languages, Bold, Italic, Underline,
  List, ListChecks, Code, Loader2, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const EMOJIS = ["👍", "👎", "❤️", "🔥", "🎉", "😂", "🤔", "👀", "✅", "❌"];
const PAGE_SIZE = 50;

export default function ChatPanel({ roomId }: { roomId: number }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [socketMessages, setSocketMessages] = useState<any[]>([]);
  const [olderMessages, setOlderMessages] = useState<any[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesQuery = trpc.messages.list.useQuery(
    { roomId, limit: PAGE_SIZE },
    { enabled: !!roomId }
  );

  const loadOlderMutation = trpc.messages.list.useQuery(
    { roomId, limit: PAGE_SIZE, beforeId: olderMessages.length > 0 ? olderMessages[0]?.id : (messagesQuery.data?.[0]?.id ?? undefined) },
    { enabled: false }
  );

  const sendMessage = trpc.messages.create.useMutation({
    onSuccess: (data) => {
      const msg = {
        id: data.id,
        roomId,
        userId: user?.id,
        content: message,
        userName: user?.name,
        userAvatar: null,
        parentId: replyTo,
        createdAt: new Date(),
      };
      socketRef.current?.emit("new_message", { roomId, message: msg });
      setMessage("");
      setReplyTo(null);
      messagesQuery.refetch();
    },
  });

  const reactMutation = trpc.messages.react.useMutation({
    onSuccess: () => messagesQuery.refetch(),
  });

  const translateMutation = trpc.ai.translate.useMutation();

  const utils = trpc.useUtils();

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore) return;
    const allCurrent = [...olderMessages, ...(messagesQuery.data || [])];
    if (allCurrent.length === 0) return;
    const oldestId = allCurrent[0]?.id;
    if (!oldestId) return;

    setLoadingOlder(true);
    try {
      const older = await utils.messages.list.fetch({ roomId, limit: PAGE_SIZE, beforeId: oldestId });
      if (!older || older.length < PAGE_SIZE) setHasMore(false);
      if (older && older.length > 0) {
        setOlderMessages(prev => [...older, ...prev]);
      }
    } catch {
      toast.error("Failed to load older messages");
    }
    setLoadingOlder(false);
  }, [loadingOlder, hasMore, olderMessages, messagesQuery.data, roomId, utils]);

  // Socket.IO connection
  useEffect(() => {
    const socket = io(window.location.origin, { path: "/api/socket.io" });
    socketRef.current = socket;
    socket.emit("join_room", String(roomId));

    socket.on("message", (msg: any) => {
      if (msg.userId !== user?.id) {
        setSocketMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socket.emit("leave_room", String(roomId));
      socket.disconnect();
    };
  }, [roomId, user?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesQuery.data, socketMessages]);

  // Clear on room change
  useEffect(() => {
    setSocketMessages([]);
    setOlderMessages([]);
    setHasMore(true);
  }, [roomId]);

  const allMessages = useMemo(() => {
    const dbMsgs = messagesQuery.data || [];
    const dbIds = new Set(dbMsgs.map(m => m.id));
    const olderIds = new Set(olderMessages.map(m => m.id));
    const newSocket = socketMessages.filter(m => !dbIds.has(m.id) && !olderIds.has(m.id));
    const combined = [...olderMessages.filter(m => !dbIds.has(m.id)), ...dbMsgs, ...newSocket];
    return combined;
  }, [messagesQuery.data, socketMessages, olderMessages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate({ roomId, content: message, parentId: replyTo ?? undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertFormatting = (prefix: string, suffix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = message.slice(start, end);
    const newText = message.slice(0, start) + prefix + selected + suffix + message.slice(end);
    setMessage(newText);
  };

  const handleTranslate = async (text: string, mode: "dev_to_casual" | "casual_to_dev" | "ja_to_en" | "en_to_ja") => {
    try {
      const result = await translateMutation.mutateAsync({ text, mode });
      toast.success("Translation complete");
      setMessage(result.translated);
    } catch {
      toast.error("Translation failed");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Load older button */}
        {hasMore && allMessages.length >= PAGE_SIZE && (
          <div className="flex justify-center pb-2">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary transition-colors"
            >
              {loadingOlder ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronUp className="w-3 h-3" />}
              {loadingOlder ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {messagesQuery.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {allMessages.map((msg) => {
          const isSelf = msg.userId === user?.id;
          const parentMsg = msg.parentId ? allMessages.find(m => m.id === msg.parentId) : null;
          return (
            <div key={msg.id} className={`flex gap-3 ${isSelf ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-1">
                {(msg.userName || "?").charAt(0).toUpperCase()}
              </div>

              <div className={`max-w-[70%] ${isSelf ? "items-end" : "items-start"}`}>
                {/* Name + time */}
                <div className={`flex items-center gap-2 mb-1 ${isSelf ? "flex-row-reverse" : ""}`}>
                  <span className="text-xs font-bold text-foreground">{msg.userName || "Unknown"}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Reply reference */}
                {parentMsg && (
                  <div className="text-[10px] font-mono text-muted-foreground mb-1 pl-2 border-l-2 border-primary/30 truncate max-w-[250px]">
                    Replying to {parentMsg.userName}: {parentMsg.content?.slice(0, 60)}
                  </div>
                )}

                {/* Bubble */}
                <div className={isSelf ? "chat-bubble-self" : "chat-bubble"}>
                  <div className="text-sm prose prose-invert prose-sm max-w-none">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                </div>

                {/* Reactions display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {Object.entries(
                      (msg.reactions as any[]).reduce((acc: Record<string, number>, r: any) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => (
                      <span key={emoji} className="text-xs px-1.5 py-0.5 bg-accent/50 border border-border rounded-sm">
                        {emoji} {count as number > 1 ? count as number : ""}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className={`flex items-center gap-1 mt-1 ${isSelf ? "flex-row-reverse" : ""}`}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="p-1 text-muted-foreground hover:text-primary transition-colors">
                        <SmilePlus className="w-3.5 h-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 bg-popover border-border" align="start">
                      <div className="flex gap-1 flex-wrap">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => reactMutation.mutate({ messageId: msg.id, emoji })}
                            className="text-lg hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <button
                    onClick={() => setReplyTo(msg.id)}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {allMessages.length === 0 && !messagesQuery.isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="font-mono text-sm">// No messages yet. Start the conversation.</p>
          </div>
        )}
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-accent/30 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">Replying to message #{replyTo}</span>
          <button onClick={() => setReplyTo(null)} className="text-xs text-destructive hover:underline">Cancel</button>
        </div>
      )}

      {/* Formatting bar */}
      <div className="px-4 pt-2 flex items-center gap-1 flex-wrap">
        <button onClick={() => insertFormatting("**", "**")} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded" title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => insertFormatting("*", "*")} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded" title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => insertFormatting("<u>", "</u>")} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded" title="Underline">
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => insertFormatting("\n- ", "")} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded" title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => insertFormatting("\n- [ ] ", "")} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded" title="Checkbox List">
          <ListChecks className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => insertFormatting("`", "`")} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded" title="Code">
          <Code className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* AI Translation */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded flex items-center gap-1" title="AI Translate">
              <Languages className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono">AI</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-popover border-border" align="start">
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Translate message</p>
              {[
                { mode: "dev_to_casual" as const, label: "Dev → Casual" },
                { mode: "casual_to_dev" as const, label: "Casual → Dev" },
                { mode: "ja_to_en" as const, label: "日本語 → English" },
                { mode: "en_to_ja" as const, label: "English → 日本語" },
              ].map(t => (
                <button
                  key={t.mode}
                  onClick={() => message.trim() && handleTranslate(message, t.mode)}
                  disabled={!message.trim() || translateMutation.isPending}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded transition-colors disabled:opacity-50"
                >
                  {t.label}
                </button>
              ))}
              {translateMutation.isPending && (
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" /> Translating...
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Composer */}
      <div className="p-4 pt-2">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for newline)"
            className="bg-input border-2 border-border focus:border-primary resize-none min-h-[44px] max-h-32 text-sm"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="bg-primary text-primary-foreground h-auto px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
