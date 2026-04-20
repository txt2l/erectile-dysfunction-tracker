import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePresence } from "@/hooks/usePresence";
import { Loader2, MapPin, Briefcase, GraduationCap, Quote, Globe, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ userId, isOpen, onClose }: ProfileModalProps) {
  const { data: profile, isLoading } = trpc.team.getProfile.useQuery(
    { userId: userId || 0 },
    { enabled: !!userId && isOpen }
  );

  const { onlineUserIds } = usePresence();
  const isOnline = userId ? onlineUserIds.includes(userId) : false;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card border-2 border-border p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xs font-mono uppercase tracking-widest text-primary mb-2">// User Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="p-6 pt-2 space-y-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-3xl font-bold">
                  {profile.userId.toString().charAt(0)}
                </div>
                <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card ${isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">User #{profile.userId}</h3>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span className={isOnline ? "text-green-500" : ""}>
                    {isOnline ? "● ONLINE" : "○ OFFLINE"}
                  </span>
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {profile.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {profile.profession && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Profession
                  </label>
                  <p className="text-sm font-medium">{profile.profession} {profile.position && `· ${profile.position}`}</p>
                </div>
              )}

              {profile.skills && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Skills
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.split(',').map((skill: string) => (
                      <Badge key={skill} variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.quote && (
                <div className="space-y-1 bg-muted/30 p-3 border-l-2 border-primary">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                    <Quote className="w-3 h-3" /> Quote
                  </label>
                  <p className="text-sm italic text-foreground/80">"{profile.quote}"</p>
                </div>
              )}

              {(profile.websites || profile.socials) && (
                <div className="pt-2 flex gap-4">
                  {profile.websites && (
                    <a href={profile.websites} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {profile.socials && (
                    <a href={profile.socials} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Share2 className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground font-mono text-sm">
            No profile data found for this user.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
