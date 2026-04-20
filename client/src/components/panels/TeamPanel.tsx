import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Search, MapPin, Mail, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProfileModal } from "@/components/ProfileModal";
import { usePresence } from "@/hooks/usePresence";

export default function TeamPanel() {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const { data: users, isLoading } = trpc.team.list.useQuery();
  const { onlineUserIds } = usePresence();

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setIsProfileOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-6 border-b-2 border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary mb-4">// Team Directory</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..." 
              className="pl-10 bg-input border-2 border-border focus-visible:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers?.map((user) => {
                const isOnline = onlineUserIds.includes(user.id);
                return (
                  <div 
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="group p-4 border-2 border-border bg-card hover:border-primary transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold truncate group-hover:text-primary transition-colors">{user.name || "Unknown User"}</h3>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs font-mono text-muted-foreground truncate mb-2">{user.email}</p>
                        
                        <div className="flex flex-wrap gap-3">
                          {user.location && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground uppercase">
                              <MapPin className="w-3 h-3" /> {user.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground uppercase">
                            <Mail className="w-3 h-3" /> Contact
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Retro decorative element */}
                    <div className="absolute top-0 right-0 w-8 h-8 bg-primary/5 -rotate-45 translate-x-4 -translate-y-4 group-hover:bg-primary/10 transition-colors" />
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && filteredUsers?.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border rounded">
              <p className="font-mono text-sm text-muted-foreground">// No team members found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      <ProfileModal 
        userId={selectedUserId} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </div>
  );
}
