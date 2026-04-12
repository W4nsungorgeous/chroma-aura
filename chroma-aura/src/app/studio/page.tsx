"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import ColoringCanvas, { ColoringCanvasRef } from "@/components/studio/ColoringCanvas";
import Toolbar from "@/components/studio/Toolbar";
import { Sparkles, Wand2, Mic, ImageIcon, History, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuota } from "@/hooks/useQuota";
import { SignInButton } from "@clerk/nextjs";

const SUGGESTIONS = [
  { label: "Mandala", icon: "☸️" },
  { label: "Anime", icon: "⛩️" },
  { label: "Cyberpunk", icon: "🌃" },
  { label: "Nature", icon: "🌿" },
  { label: "Fantasy", icon: "🐉" },
  { label: "Space", icon: "🚀" },
];

const ENHANCEMENT_MODIFIERS = [
  "highly detailed",
  "intricate lineart",
  "coloring book style",
  "sharp outlines",
  "bold strokes",
  "clean borders"
];

export default function StudioPage() {
  const [tool, setTool] = useState<"brush" | "bucket" | "eraser">("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const canvasRef = useRef<ColoringCanvasRef>(null);

  const { 
    generationQuota, 
    drawingQuota, 
    decrementGeneration, 
    decrementDrawing,
    isLimitReached 
  } = useQuota();

  const handleSuggestionClick = (suggestion: string) => {
    if (prompt.includes(suggestion)) return;
    setPrompt(prev => prev ? `${prev}, ${suggestion}` : suggestion);
  };

  const handleEnhancePrompt = () => {
    if (!prompt) return;
    let enhanced = prompt;
    ENHANCEMENT_MODIFIERS.forEach(mod => {
      if (!enhanced.toLowerCase().includes(mod.toLowerCase())) {
        enhanced += `, ${mod}`;
      }
    });
    setPrompt(enhanced);
  };

  const handleGenerate = () => {
    if (!prompt) return;
    
    // Check quota
    if (generationQuota.used >= generationQuota.limit) {
      alert("AI Generation limit reached for guest! Please sign in to continue.");
      return;
    }

    if (!decrementGeneration()) return;

    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setPrompt("");
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-1 flex pt-28 px-6 pb-6 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Sidebar: AI Control Panel */}
        <aside className="w-80 flex flex-col gap-6">
          {/* Quota Status */}
          <div className="glass p-5 rounded-3xl border-border-subtle space-y-3 bg-icon-bg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Guest Quota</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">Limited</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">AI Generations</span>
                <span className="font-mono font-bold text-foreground">{generationQuota.limit - generationQuota.used}/{generationQuota.limit}</span>
              </div>
              <div className="w-full h-1 bg-icon-bg rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${((generationQuota.limit - generationQuota.used) / generationQuota.limit) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-foreground font-medium">Drawing Actions</span>
                <span className="font-mono font-bold text-foreground">{drawingQuota.limit - drawingQuota.used}/{drawingQuota.limit}</span>
              </div>
              <div className="w-full h-1 bg-icon-bg rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400 transition-all duration-500" 
                  style={{ width: `${((drawingQuota.limit - drawingQuota.used) / drawingQuota.limit) * 100}%` }}
                />
              </div>
            </div>

            {(generationQuota.used >= generationQuota.limit || drawingQuota.used >= drawingQuota.limit) && (
              <div className="pt-2">
                 <SignInButton mode="modal">
                   <button className="w-full py-2 rounded-xl bg-foreground text-background text-xs font-bold transition-all shadow-md">
                     Sign in to upgrade
                   </button>
                 </SignInButton>
              </div>
            )}
          </div>

          <div className="glass p-6 rounded-3xl border-border-subtle space-y-6">
            <h3 className="text-xl font-bold font-heading flex items-center gap-2 text-foreground">
              <Wand2 className="w-5 h-5 text-primary" />
              AI Prompt
            </h3>
            <div className="relative group">
               <textarea
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder="Describe your coloring page..."
                 className="w-full h-40 bg-icon-bg border border-border-subtle rounded-2xl p-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none placeholder:text-text-muted text-foreground pr-10"
               />
               <div className="absolute top-3 right-3">
                  <button 
                    onClick={() => setPrompt("")}
                    className={cn(
                      "p-1 rounded-md hover:bg-icon-bg transition-opacity duration-200",
                      prompt ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                  >
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
               </div>
               <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button 
                    onClick={handleEnhancePrompt}
                    title="AI Enhance"
                    className={cn(
                      "p-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all",
                      !prompt && "opacity-0 pointer-events-none"
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-icon-bg hover:bg-icon-bg/20 text-text-muted hover:text-foreground transition-all"><Mic className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg bg-icon-bg hover:bg-icon-bg/20 text-text-muted hover:text-foreground transition-all"><ImageIcon className="w-4 h-4" /></button>
               </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">AI Suggestions</span>
                <button className="text-[10px] text-primary hover:underline">Customize</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {SUGGESTIONS.map((s) => (
                    <motion.button
                      key={s.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSuggestionClick(s.label)}
                      className="px-3 py-1.5 rounded-full glass border-border-subtle bg-icon-bg hover:bg-primary/10 hover:border-primary transition-all text-[10px] font-bold text-foreground/70 flex items-center gap-1.5"
                    >
                      <span>{s.icon}</span>
                      {s.label}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            
            <button 
              disabled={isGenerating || !prompt}
              onClick={handleGenerate}
              className="w-full py-4 rounded-2xl bg-foreground text-background font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl"
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

          <div className="glass p-6 rounded-3xl border-border-subtle flex-1 overflow-hidden flex flex-col">
             <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold flex items-center gap-2 text-foreground">
                  <History className="w-4 h-4" />
                  History
                </h4>
                <button className="text-xs text-primary font-bold hover:underline">Clear All</button>
             </div>
             <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {[1, 2, 3].map((i) => (
                   <div key={i} className="aspect-square rounded-2xl bg-icon-bg border border-border-subtle hover:border-primary/20 transition-all cursor-pointer group p-2">
                      <div className="w-full h-full rounded-xl bg-slate-200 dark:bg-slate-900 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-white">Resumed {i}m ago</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </aside>

        {/* Center: Main Canvas Area */}
        <div className="flex-1 relative glass rounded-[40px] border-border-subtle p-4 shadow-[0_0_80px_rgba(0,0,0,0.05)] dark:shadow-[0_0_100px_rgba(0,0,0,0.5)]">
           <ColoringCanvas 
             ref={canvasRef}
             tool={tool}
             color={color}
             brushSize={brushSize}
             onAction={decrementDrawing}
             isDisabled={drawingQuota.used >= drawingQuota.limit}
           />
           
           {/* Canvas Floating Controls */}
           <div className="absolute top-8 right-8 flex flex-col gap-3">
              <button className="p-3 rounded-2xl bg-icon-bg backdrop-blur-xl border border-border-subtle hover:bg-icon-bg/80 transition-all text-foreground"><Share2 className="w-5 h-5" /></button>
           </div>
           
           {/* Generating Overlay */}
           <AnimatePresence>
             {isGenerating && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-4 rounded-[36px] bg-background/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-12"
               >
                  <div className="w-24 h-24 mb-6 relative">
                     <div className="absolute inset-0 bg-iridescent rounded-full animate-ping opacity-20" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                     </div>
                  </div>
                  <h3 className="text-3xl font-bold font-heading mb-4 text-foreground">Magic is happening...</h3>
                  <p className="text-foreground max-w-sm">Generating your unique lineart through neural networks. This usually takes about 3 seconds.</p>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Quota Reached Overlay */}
           <AnimatePresence>
              {drawingQuota.used >= drawingQuota.limit && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-4 rounded-[36px] bg-background/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-8"
                >
                  <div className="glass p-8 rounded-3xl border-border-subtle max-w-sm shadow-2xl">
                    <h3 className="text-2xl font-bold mb-2 text-foreground">Strokes Limit Reached</h3>
                    <p className="text-text-muted text-sm mb-6">As a guest, you've used all your drawing actions. Sign in to get unlimited actions and save your progress!</p>
                    <SignInButton mode="modal">
                      <button className="w-full py-4 rounded-2xl bg-foreground text-background font-bold hover:scale-105 active:scale-95 transition-all">
                        Sign in to Continue
                      </button>
                    </SignInButton>
                  </div>
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
            onUndo={() => canvasRef.current?.undo()}
            onRedo={() => canvasRef.current?.redo()}
            onClear={() => canvasRef.current?.clear()}
            onDownload={() => canvasRef.current?.download()}
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
          background: var(--glass-border);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </main>
  );
}
