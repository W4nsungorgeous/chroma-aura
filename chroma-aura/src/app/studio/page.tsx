"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import ColoringCanvas from "@/components/studio/ColoringCanvas";
import Toolbar from "@/components/studio/Toolbar";
import { Sparkles, Wand2, Mic, ImageIcon, History, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StudioPage() {
  const [tool, setTool] = useState<"brush" | "bucket" | "eraser">("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    if (!prompt) return;
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setPrompt("");
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-1 flex pt-28 px-6 pb-6 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Sidebar: AI Control Panel */}
        <aside className="w-80 flex flex-col gap-6">
          <div className="glass p-6 rounded-3xl border-white/10 space-y-6">
            <h3 className="text-xl font-bold font-heading flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              AI Prompt
            </h3>
            <div className="relative group">
               <textarea
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder="Describe your coloring page... (e.g., 'A cute dragon in a space suit')"
                 className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none placeholder:text-white/20"
               />
               <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"><Mic className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"><ImageIcon className="w-4 h-4" /></button>
               </div>
            </div>
            
            <button 
              disabled={isGenerating || !prompt}
              onClick={handleGenerate}
              className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl shadow-white/5 group relative overflow-hidden"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Lineart
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="glass p-6 rounded-3xl border-white/10 flex-1 overflow-hidden flex flex-col">
             <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold flex items-center gap-2 text-white/80">
                  <History className="w-4 h-4" />
                  History
                </h4>
                <button className="text-xs text-primary font-bold hover:underline">Clear All</button>
             </div>
             <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer group p-2">
                     <div className="w-full h-full rounded-xl bg-slate-900 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="text-[10px] font-bold">Resumed {i}m ago</span>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </aside>

        {/* Center: Main Canvas Area */}
        <div className="flex-1 relative glass rounded-[40px] border-white/10 p-4 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
           <ColoringCanvas 
             tool={tool}
             color={color}
             brushSize={brushSize}
           />
           
           {/* Canvas Floating Controls */}
           <div className="absolute top-8 right-8 flex flex-col gap-3">
              <button className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all"><Share2 className="w-5 h-5" /></button>
           </div>
           
           {/* Generating Overlay */}
           <AnimatePresence>
             {isGenerating && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-4 rounded-[36px] bg-slate-950/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-12"
               >
                  <div className="w-24 h-24 mb-6 relative">
                     <div className="absolute inset-0 bg-iridescent rounded-full animate-ping opacity-20" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                     </div>
                  </div>
                  <h3 className="text-3xl font-bold font-heading mb-4">Magic is happening...</h3>
                  <p className="text-white/60 max-w-sm">Generating your unique lineart through neural networks. This usually takes about 3 seconds.</p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Right Sidebar: Tools */}
        <aside className="w-72">
          <Toolbar 
            currentTool={tool}
            setTool={setTool}
            currentColor={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            onAiAssist={() => alert("AI Auto-Coloring algorithm starting...")}
          />
        </aside>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </main>
  );
}
