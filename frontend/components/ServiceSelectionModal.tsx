"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bot, Type, Image as ImageIcon, Code, BarChart3, MessageSquare, Globe, FileText, Sparkles, Music, Video, Cloud, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (service: string) => void;
}

const SERVICES = [
  { id: "all", label: "All Capabilities", icon: Sparkles, description: "Combines all available services" },
  { id: "weather", label: "Weather Data", icon: Cloud, description: "Real-time weather information" },
  { id: "translation", label: "Translation", icon: Globe, description: "Translate text between languages" },
  { id: "sentiment-analysis", label: "Sentiment Analysis", icon: BarChart3, description: "Analyze emotions in text" },
  { id: "image-generation", label: "Image Generation", icon: ImageIcon, description: "Create images from text prompts" },
  { id: "code-generation", label: "Code Generation", icon: Code, description: "Generate and debug code" },
  { id: "chatbot", label: "Chatbot", icon: MessageSquare, description: "Conversational AI assistant" },
  { id: "summarization", label: "Summarization", icon: FileText, description: "Summarize long documents" },
  { id: "data-analysis", label: "Data Analysis", icon: BarChart3, description: "Analyze complex datasets" },
  { id: "text-to-speech", label: "Text to Speech", icon: Music, description: "Convert text into spoken audio" },
  { id: "speech-to-text", label: "Speech to Text", icon: Type, description: "Transcribe audio to text" },
  { id: "video-generation", label: "Video Generation", icon: Video, description: "Create videos from prompts" },
  { id: "content-writing", label: "Content Writing", icon: Type, description: "Generate articles and posts" },
  { id: "search", label: "Smart Search", icon: Search, description: "Semantic search capabilities" },
  { id: "other", label: "Other", icon: Sparkles, description: "Custom AI service" },
];

export function ServiceSelectionModal({ isOpen, onClose, onSelect }: ServiceSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = SERVICES.filter(service => 
    service.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (serviceLabel: string) => {
    if (serviceLabel === 'All Capabilities') {
         const allTypes = SERVICES
        .filter(s => s.id !== 'all' && s.id !== 'other')
        .map(s => s.label)
        .join(", ");
      onSelect(allTypes);
    } else {
      onSelect(serviceLabel);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 border-white/10 backdrop-blur-xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select AI Service</DialogTitle>
          <DialogDescription>
            Choose the category that best describes your agent's capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search services or type custom..." 
            className="pl-9 bg-white/5 border-white/10 focus:border-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[50vh] pr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {/* Custom Option if searching */}
             {searchQuery && !filteredServices.find(s => s.label.toLowerCase() === searchQuery.toLowerCase()) && (
              <button
                onClick={() => handleSelect(searchQuery)}
                className="flex items-start gap-3 p-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all text-left group w-full col-span-full"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm text-primary">
                    Use "{searchQuery}"
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Create as a custom category
                  </div>
                </div>
              </button>
            )}

            {filteredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => handleSelect(service.label)}
                className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <service.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm group-hover:text-primary transition-colors">
                    {service.label}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {service.description}
                  </div>
                </div>
              </button>
            ))}
            
            {filteredServices.length === 0 && !searchQuery && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No services found.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
