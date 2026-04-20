import { trpc } from "@/lib/trpc";
import { Hash, ChevronRight, ChevronDown, Plus, MoreVertical } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface RoomTreeProps {
  selectedRoomId: number | null;
  onSelect: (id: number) => void;
  onCreateSubroom: (parentId: number) => void;
}

export function RoomTree({ selectedRoomId, onSelect, onCreateSubroom }: RoomTreeProps) {
  const roomsQuery = trpc.rooms.list.useQuery();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const roomTree = useMemo(() => {
    if (!roomsQuery.data) return [];
    const map: Record<number, any> = {};
    const roots: any[] = [];

    roomsQuery.data.forEach(room => {
      map[room.id] = { ...room, children: [] };
    });

    roomsQuery.data.forEach(room => {
      if (room.parentId && map[room.parentId]) {
        map[room.parentId].children.push(map[room.id]);
      } else {
        roots.push(map[room.id]);
      }
    });

    return roots;
  }, [roomsQuery.data]);

  const renderRoom = (room: any, depth = 0) => {
    const isExpanded = expanded[room.id];
    const hasChildren = room.children.length > 0;
    const isSelected = selectedRoomId === room.id;

    return (
      <div key={room.id} className="select-none">
        <div 
          onClick={() => onSelect(room.id)}
          className={`group flex items-center gap-1 py-1.5 px-2 cursor-pointer transition-colors border-l-2 ${
            isSelected 
              ? "bg-sidebar-accent text-sidebar-accent-foreground border-primary" 
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 border-transparent"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {hasChildren ? (
              <button onClick={(e) => toggleExpand(room.id, e)} className="hover:text-primary">
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            ) : (
              <Hash className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          
          <span className="text-sm truncate flex-1">{room.name}</span>
          
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
            <button 
              onClick={(e) => { e.stopPropagation(); onCreateSubroom(room.id); }}
              className="p-1 hover:bg-background rounded text-muted-foreground hover:text-primary"
              title="Add sub-room"
            >
              <Plus className="w-3 h-3" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-background rounded text-muted-foreground">
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-2 border-border">
                <DropdownMenuItem className="text-xs font-mono uppercase">Edit Room</DropdownMenuItem>
                <DropdownMenuItem className="text-xs font-mono uppercase text-destructive">Delete Room</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-0.5">
            {room.children.map((child: any) => renderRoom(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {roomTree.map(room => renderRoom(room))}
    </div>
  );
}
