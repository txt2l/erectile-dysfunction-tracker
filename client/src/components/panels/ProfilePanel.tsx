import { useAuth } from "../../_core/hooks/useAuth";
import { trpc } from "../../lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { User, Save, LogOut, Loader2, Keyboard } from "lucide-react";
import { toast } from "sonner";

const shortcuts = [
  { keys: "Ctrl + M", action: "Toggle Memory Bank" },
  { keys: "Ctrl + T", action: "Toggle Tasks" },
  { keys: "Ctrl + C", action: "Toggle Calendar" },
  { keys: "Ctrl + F", action: "Toggle File Explorer" },
  { keys: "Ctrl + X", action: "Toggle Mindmap" },
  { keys: "Ctrl + S", action: "Toggle Signatures" },
  { keys: "Ctrl + L", action: "Toggle Activity Log" },
  { keys: "Shift + Enter", action: "New line in chat" },
  { keys: "Enter", action: "Send message" },
];

export default function ProfilePanel() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: "", bio: "", timezone: "" });

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => toast.success("Profile updated"),
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        bio: (user as any).bio || "",
        timezone: (user as any).timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto p-6 space-y-8">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{user.name || "User"}</h2>
            <p className="text-sm text-muted-foreground font-mono">{user.email || "No email"}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              Role: {user.role?.toUpperCase()} · Joined: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Edit profile */}
        <div className="border-2 border-border bg-card p-5 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// Profile Settings</h3>

          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Display Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-input border-border" />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Bio</label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." className="bg-input border-border" />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Timezone</label>
            <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="bg-input border-border" />
          </div>

          <Button
            onClick={() => updateProfile.mutate(form)}
            className="bg-primary text-primary-foreground font-bold"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {/* Keyboard shortcuts */}
        <div className="border-2 border-border bg-card p-5">
          <h3 className="text-xs font-mono uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5" /> Keyboard Shortcuts
          </h3>
          <div className="space-y-1">
            {shortcuts.map(s => (
              <div key={s.keys} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground">{s.action}</span>
                <kbd className="text-[10px] font-mono px-2 py-0.5 bg-background border border-border text-foreground">{s.keys}</kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <Button
          onClick={logout}
          variant="outline"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
