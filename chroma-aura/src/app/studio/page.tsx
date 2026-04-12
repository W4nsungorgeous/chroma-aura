"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ColoringCanvas, { ColoringCanvasRef } from "@/components/studio/ColoringCanvas";
import Toolbar from "@/components/studio/Toolbar";
import { Sparkles, Wand2, Mic, ImageIcon, History, Share2, Undo2, Save, X, Trash2, Check, Square, Download, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuota } from "@/hooks/useQuota";
import { SignInButton } from "@clerk/nextjs";

interface SavedProject {
  id: string;
  dataUrl: string;
  timestamp: number;
}

function StudioMain() {
  const [tool, setTool] = useState<"brush" | "bucket" | "eraser">("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAutoColoring, setIsAutoColoring] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined);
  const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024, ratio: "1:1" });
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [stashState, setStashState] = useState<string | null>(null);
  
  const canvasRef = useRef<ColoringCanvasRef>(null);

  const { 
    tier,
    generationQuota, 
    drawingQuota, 
    decrementGeneration, 
    decrementDrawing,
  } = useQuota();

  const searchParams = useSearchParams();
  const remixUrl = searchParams.get("lineart");

  // Handle Remix initialization
  useEffect(() => {
    if (remixUrl) {
      setGeneratedImage(decodeURIComponent(remixUrl));
    }
  }, [remixUrl]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("chroma_aura_history");
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSavedProjects(parsed);
      } catch (e) { 
        console.error("Failed to load history:", e); 
      }
    }
    setIsHistoryLoaded(true);
  }, []);

  // Save history only after initialization
  useEffect(() => {
    if (isHistoryLoaded) {
      localStorage.setItem("chroma_aura_history", JSON.stringify(savedProjects));
    }
  }, [savedProjects, isHistoryLoaded]);

  const handleSaveProject = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.getCanvasData();
    const newProject: SavedProject = {
      id: Math.random().toString(36).substr(2, 9),
      dataUrl,
      timestamp: Date.now()
    };
    setSavedProjects(prev => [newProject, ...prev]);
  };

  const handleLoadHistory = async (project: SavedProject) => {
    if (!canvasRef.current) return;
    if (!stashState) {
      setStashState(canvasRef.current.getCanvasData());
    }
    await canvasRef.current.loadCanvasData(project.dataUrl);
    setIsViewingHistory(false);
  };

  const handleDeleteHistory = (id: string) => {
    setIdsToDelete([id]);
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setIdsToDelete(selectedIds);
  };

  const confirmDelete = () => {
    if (idsToDelete.length === 0) return;
    setSavedProjects(prev => prev.filter(p => !idsToDelete.includes(p.id)));
    setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
    setIdsToDelete([]);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === savedProjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(savedProjects.map(p => p.id));
    }
  };

  const handleBatchDownload = () => {
    selectedIds.forEach((id, index) => {
      const project = savedProjects.find(p => p.id === id);
      if (project) {
        setTimeout(() => {
          const link = document.createElement("a");
          link.download = `chroma-aura-${project.id}.png`;
          link.href = project.dataUrl;
          link.click();
        }, index * 200); // Stagger downloads to avoid browser blocking
      }
    });
  };

  const handleReturnToActive = async () => {
    if (!canvasRef.current || !stashState) return;
    await canvasRef.current.loadCanvasData(stashState);
    setStashState(null);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.success) setPrompt(data.enhanced);
    } catch (error) { console.error(error); } 
    finally { setIsEnhancing(false); }
  };

  const handleAutoColor = async () => {
    if (drawingQuota.used >= drawingQuota.limit) return alert("Quota reached");
    setIsAutoColoring(true);
    try {
      const response = await fetch("/api/ai/autocolor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: generatedImage || "initial" }),
      });
      const data = await response.json();
      if (data.success && decrementDrawing()) setGeneratedImage(data.imageUrl);
    } finally { setIsAutoColoring(false); }
  };

  const handleGenerate = async () => {
    if (!prompt || generationQuota.used >= generationQuota.limit) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.success && decrementGeneration()) {
        setGeneratedImage(data.imageUrl);
        setPrompt("");
      }
    } finally { setIsGenerating(false); }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (prompt.includes(suggestion)) return;
    setPrompt(prev => prev ? `${prev}, ${suggestion}` : suggestion);
  };

  const SUGGESTIONS = [
    { label: "Mandala", icon: "☸️" },
    { label: "Anime", icon: "⛩️" },
    { label: "Cyberpunk", icon: "🌃" },
    { label: "Nature", icon: "🌿" },
    { label: "Fantasy", icon: "🐉" },
    { label: "Space", icon: "🚀" },
  ];

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-8 flex-1 h-0 overflow-hidden">
        <div className="grid grid-cols-12 gap-8 h-full items-start">
          {/* Main Controls - Left Sidebar */}
          <div className="col-span-3 space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
            {/* Generation Form */}
            <div className="glass p-8 rounded-[40px] border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-12 h-12" />
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
                  <Wand2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">AI Prompt</h2>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the lineart you want to create..."
                    className="w-full h-40 bg-foreground/5 border-none rounded-[32px] p-6 text-sm resize-none focus:ring-2 focus:ring-foreground/20 transition-all placeholder:text-foreground/20"
                  />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <button 
                        onClick={handleEnhancePrompt}
                        className={cn(
                          "p-3 rounded-2xl transition-all shadow-xl backdrop-blur-md bg-background/80 text-foreground hover:bg-background border border-white/5 cursor-pointer active:scale-95",
                          isEnhancing && "animate-pulse"
                        )}
                        title="AI Enhance Prompt"
                      >
                        <Wand2 className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-3 rounded-2xl transition-all shadow-xl backdrop-blur-md bg-background/80 text-foreground hover:bg-background border border-white/5 cursor-pointer active:scale-95"
                        title="Voice Input"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-3 rounded-2xl transition-all shadow-xl backdrop-blur-md bg-background/80 text-foreground hover:bg-background border border-white/5 cursor-pointer active:scale-95"
                        title="Upload Image Reference"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleSuggestionClick(s.label)}
                      className="px-4 py-2 rounded-2xl bg-foreground/5 hover:bg-foreground/10 text-xs font-medium transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>{s.icon}</span> {s.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    disabled={isGenerating || !prompt}
                    onClick={handleGenerate}
                    className="w-full py-4 rounded-2xl bg-foreground text-background font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-foreground/10 group active:scale-[0.98]"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        <span>Creating Magic...</span>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span>Generate Lineart</span>
                      </>
                    )}
                  </button>

                  <button 
                    disabled={isAutoColoring || !generatedImage}
                    onClick={handleAutoColor}
                    className="w-full py-4 rounded-2xl bg-iridescent text-white font-bold flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20 group active:scale-[0.98]"
                  >
                    {isAutoColoring ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Painting...</span>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
                        </div>
                        <span>AI Auto-Color</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* History Quick Access */}
            <div className="glass p-8 rounded-[40px] border-white/10 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold">History</h3>
                </div>
                <button 
                  onClick={() => setIsViewingHistory(true)}
                  className="text-xs font-bold text-foreground/40 hover:text-foreground transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {savedProjects.slice(0, 4).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleLoadHistory(project)}
                    className="aspect-square rounded-2xl bg-foreground/5 border border-white/5 overflow-hidden hover:scale-[1.05] active:scale-95 transition-all cursor-pointer group"
                  >
                    <img src={project.dataUrl} alt="History" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </button>
                ))}
                {savedProjects.length === 0 && (
                  <div className="col-span-2 py-8 text-center border-2 border-dashed border-foreground/10 rounded-3xl">
                    <p className="text-xs text-foreground/20 font-medium">No projects yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Studio Canvas */}
          <div className="col-span-6 h-full relative">
            <div className="glass h-full rounded-[48px] border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
              <ColoringCanvas 
                ref={canvasRef}
                imageUrl={generatedImage}
                tool={tool}
                color={color}
                brushSize={brushSize}
                width={canvasSize.width}
                height={canvasSize.height}
                onAction={decrementDrawing}
              />
              {stashState && (
                <div className="absolute top-8 left-8 z-50">
                  <button 
                    onClick={handleReturnToActive}
                    className="px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer transition-transform"
                  >
                    <Undo2 className="w-5 h-5" /> 
                    Back to Live Session
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Toolbar */}
          <div className="col-span-3 h-full">
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
              onSave={handleSaveProject}
              canvasSize={canvasSize}
              setCanvasSize={setCanvasSize}
            />
          </div>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {isViewingHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewingHistory(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl bg-background rounded-[48px] border border-white/10 shadow-2xl p-12 overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">My Art Gallery</h2>
                  <div className="flex items-center gap-4">
                    <p className="text-foreground/40 text-sm">Review and restore your past masterpieces</p>
                    {savedProjects.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-foreground/20" />
                        <button 
                          onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            if (isSelectionMode) setSelectedIds([]);
                          }}
                          className={cn(
                            "text-xs font-bold transition-all px-3 py-1 rounded-lg",
                            isSelectionMode 
                              ? "bg-primary text-white" 
                              : "bg-foreground/5 text-foreground/40 hover:text-foreground hover:bg-foreground/10"
                          )}
                        >
                          {isSelectionMode ? "Cancel Selection" : "Select"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <AnimatePresence>
                    {isSelectionMode && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2"
                      >
                        <button 
                          onClick={handleSelectAll}
                          className="px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-xs font-bold transition-all flex items-center gap-2"
                        >
                          {selectedIds.length === savedProjects.length ? "Deselect All" : "Select All"}
                        </button>
                        
                        <div className="w-[1px] h-6 bg-white/10 mx-2" />
                        
                        <button 
                          disabled={selectedIds.length === 0}
                          onClick={handleBatchDownload}
                          className="px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 disabled:opacity-30 text-xs font-bold transition-all flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download ({selectedIds.length})
                        </button>
                        
                        <button 
                          disabled={selectedIds.length === 0}
                          onClick={handleBatchDelete}
                          className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white disabled:opacity-30 text-xs font-bold transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete ({selectedIds.length})
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={() => {
                      setIsViewingHistory(false);
                      setIsSelectionMode(false);
                      setSelectedIds([]);
                    }}
                    className="w-12 h-12 rounded-2xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 overflow-y-auto pr-4 custom-scrollbar flex-1 text-white">
                {savedProjects.map((project) => {
                  const isSelected = selectedIds.includes(project.id);
                  return (
                    <div 
                      key={project.id}
                      onClick={() => isSelectionMode && handleToggleSelection(project.id)}
                      className={cn(
                        "group relative aspect-square rounded-[32px] overflow-hidden bg-foreground/5 border transition-all cursor-pointer",
                        isSelectionMode ? (
                          isSelected ? "border-primary ring-2 ring-primary/20 scale-[0.98]" : "border-white/10 hover:border-white/20"
                        ) : "border-white/10 hover:border-foreground/20"
                      )}
                    >
                      <img src={project.dataUrl} alt="Project" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      
                      {/* Selection Overlay */}
                      {isSelectionMode && (
                        <div className="absolute top-4 right-4 z-10">
                          {isSelected ? (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg transform scale-110 transition-transform">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center" />
                          )}
                        </div>
                      )}

                      {!isSelectionMode && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadHistory(project);
                            }}
                            className="px-6 py-2 rounded-xl bg-white text-black font-bold hover:scale-105 active:scale-95 cursor-pointer transition-transform flex items-center gap-2"
                          >
                            Restore
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement("a");
                              link.download = `chroma-aura-${project.id}.png`;
                              link.href = project.dataUrl;
                              link.click();
                            }}
                            className="px-6 py-2 rounded-xl bg-white/20 text-white font-bold hover:scale-105 active:scale-95 cursor-pointer transition-transform"
                          >
                            Download
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistory(project.id);
                            }}
                            className="px-6 py-2 rounded-xl bg-rose-500/20 text-rose-500 font-bold hover:bg-rose-500 hover:text-white hover:scale-105 active:scale-95 cursor-pointer transition-all flex items-center gap-2 border border-rose-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {savedProjects.length === 0 && (
                  <div className="col-span-4 py-20 text-center border-4 border-dashed border-foreground/5 rounded-[48px]">
                    <ImageIcon className="w-16 h-16 text-foreground/5 mx-auto mb-4" />
                    <p className="text-foreground/20 font-bold">Your gallery is waiting for your first stroke</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {idsToDelete.length > 0 && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIdsToDelete([])}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-10 rounded-[40px] border-white/10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">
                {idsToDelete.length > 1 ? `Delete ${idsToDelete.length} Projects?` : "Delete Project?"}
              </h3>
              <p className="text-foreground/40 text-sm mb-8 leading-relaxed">
                {idsToDelete.length > 1 
                  ? `Are you sure you want to remove these ${idsToDelete.length} projects? This action cannot be undone.`
                  : "Are you sure you want to remove this project? This action cannot be undone and will be lost forever."
                }
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIdsToDelete([])}
                  className="py-4 rounded-2xl bg-foreground/5 font-bold hover:bg-foreground/10 transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="py-4 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 cursor-pointer active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-background flex items-center justify-center font-bold">Loading Studio...</div>}>
      <StudioMain />
    </Suspense>
  );
}
