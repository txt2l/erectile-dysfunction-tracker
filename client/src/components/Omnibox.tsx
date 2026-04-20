import { useState, useEffect } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Users, BookOpen, User, Hash, Search, Terminal } from "lucide-react";
import { useLocation } from "wouter";

export function Omnibox() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const roomsQuery = trpc.rooms.list.useQuery();
  const usersQuery = trpc.team.list.useQuery();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredRooms = roomsQuery.data?.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = usersQuery.data?.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="bg-card border-t border-border">
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => { setLocation("/team"); setOpen(false); }}>
            <Users className="mr-2 h-4 w-4" />
            <span>Team Directory</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ^T
            </kbd>
          </CommandItem>
          <CommandItem onSelect={() => { /* Open Glossary */ setOpen(false); }}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Glossary</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ^G
            </kbd>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Rooms">
          {filteredRooms?.map(room => (
            <CommandItem key={room.id} onSelect={() => { setLocation(`/room/${room.id}`); setOpen(false); }}>
              <Hash className="mr-2 h-4 w-4" />
              <span>{room.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Team">
          {filteredUsers?.map(user => (
            <CommandItem key={user.id} onSelect={() => { /* Open Profile */ setOpen(false); }}>
              <User className="mr-2 h-4 w-4" />
              <span>{user.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
