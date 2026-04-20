import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilesPanel from "./FilesPanel";
import GlossaryPanel from "./GlossaryPanel";
import { FolderOpen, BookOpen } from "lucide-react";

export default function ResourcesPanel({ roomId }: { roomId: number }) {
  const [activeTab, setActiveTab] = useState("files");

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-6 pt-4 border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 border-2 border-border p-1 h-12">
            <TabsTrigger 
              value="files" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-6 py-2 text-xs font-mono uppercase tracking-widest"
            >
              <FolderOpen className="w-4 h-4" /> Files
            </TabsTrigger>
            <TabsTrigger 
              value="glossary" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-6 py-2 text-xs font-mono uppercase tracking-widest"
            >
              <BookOpen className="w-4 h-4" /> Glossary
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "files" ? (
          <FilesPanel roomId={roomId} />
        ) : (
          <GlossaryPanel />
        )}
      </div>
    </div>
  );
}
