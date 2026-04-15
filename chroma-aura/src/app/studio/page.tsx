"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ColoringCanvas, { ColoringCanvasRef } from "@/components/studio/ColoringCanvas";
import Toolbar from "@/components/studio/Toolbar";
import { Sparkles, Wand2, Mic, ImageIcon, History, Undo2, Save, X, Trash2, Check, Download, CheckCircle2, Maximize2, Minimize2, Brush, PaintBucket, Eraser, Redo2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuota } from "@/hooks/useQuota";
import { SignInButton } from "@clerk/nextjs";

interface SavedProject {
  id: string;
  dataUrl: string;
  lineartUrl?: string;
  timestamp: number;
}

function StudioMain() {
  const [tool, setTool] = useState<"brush" | "bucket" | "eraser">("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [isAutoColoring, setIsAutoColoring] = useState(false);
  const [autoColorError, setAutoColorError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  // generatedImage: what is currently rendered on the canvas (may be lineart OR auto-colored result)
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined);
  // lineartUrl: the original AI-generated lineart — never overwritten by auto-color results,
  // always used as the source for "AI Auto-Color" so re-coloring is idempotent.
  const [lineartUrl, setLineartUrl] = useState<string | undefined>(undefined);
  const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024, ratio: "1:1" });
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  // Stash preserves both canvas pixels and lineartUrl so "Back to Live Session" fully restores state.
  const [stashState, setStashState] = useState<{ canvas: string; lineartUrl: string | undefined } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [zoom, setZoom] = useState(1);

  const PRESET_COLORS = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
    "#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B",
  ];
  
  const canvasRef = useRef<ColoringCanvasRef>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

  const {
    tier,
    deviceId,
    generationQuota,
    drawingQuota,
    decrementGeneration,
    decrementDrawing,
  } = useQuota();

  const searchParams = useSearchParams();
  const remixUrl = searchParams.get("lineart");

  // Handle Remix initialization — treat the remixed lineart as both the canvas image and the lineart source
  useEffect(() => {
    if (remixUrl) {
      const decoded = decodeURIComponent(remixUrl);
      setGeneratedImage(decoded);
      setLineartUrl(decoded);
    }
  }, [remixUrl]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("chroma_aura_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedProjects(parsed);
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
    setIsHistoryLoaded(true);
  }, []);

  // Save history only after initialization.
  // Wrapped in try-catch: if localStorage quota is exceeded, trim oldest entries and retry.
  useEffect(() => {
    if (!isHistoryLoaded) return;
    const persist = (projects: SavedProject[]) => {
      try {
        localStorage.setItem("chroma_aura_history", JSON.stringify(projects));
        return true;
      } catch {
        return false;
      }
    };
    if (!persist(savedProjects)) {
      // Remove oldest entries one by one until it fits
      setSavedProjects(prev => {
        let trimmed = prev.slice(0, Math.max(1, prev.length - 2));
        while (trimmed.length > 1 && !persist(trimmed)) {
          trimmed = trimmed.slice(0, trimmed.length - 1);
        }
        return trimmed;
      });
    }
  }, [savedProjects, isHistoryLoaded]);

  // Compress a full-resolution canvas data URL to a smaller JPEG for localStorage.
  // Reduces a 2048×2048 PNG (~400 KB base64) to a 600px-max JPEG (~25 KB base64).
  const compressDataUrl = (fullDataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        const scale = Math.min(1, MAX / img.width, MAX / img.height);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const off = document.createElement("canvas");
        off.width = w;
        off.height = h;
        off.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(off.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => resolve(fullDataUrl); // fallback: keep original
      img.src = fullDataUrl;
    });

  const handleSaveProject = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await compressDataUrl(canvasRef.current.getCanvasData());
    if (!isMountedRef.current) return; // component unmounted during async compression
    const newProject: SavedProject = {
      id: Math.random().toString(36).substr(2, 9),
      dataUrl,
      lineartUrl,   // always the original AI lineart, never the auto-colored result
      timestamp: Date.now(),
    };
    // Cap history at 20 items so localStorage stays well within the 5 MB limit
    setSavedProjects(prev => [newProject, ...prev.slice(0, 19)]);
  };

  const handleLoadHistory = async (project: SavedProject) => {
    if (!canvasRef.current) return;
    // Stash current canvas pixels AND lineartUrl so "Back to Live Session" fully restores state
    if (!stashState) {
      setStashState({ canvas: canvasRef.current.getCanvasData(), lineartUrl });
    }
    await canvasRef.current.loadCanvasData(project.dataUrl);
    setLineartUrl(project.lineartUrl);   // restore this project's original lineart for auto-color
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
    await canvasRef.current.loadCanvasData(stashState.canvas);
    setLineartUrl(stashState.lineartUrl);  // restore the live session's original lineart
    setStashState(null);
  };

  const deviceHeader: Record<string, string> = deviceId ? { "X-Device-Id": deviceId } : {};

  // ── System-level fullscreen helpers ──────────────────────────────────────
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Browser denied fullscreen — fall back to CSS-only mode
    }
    setIsFullscreen(true);
    setZoom(1);
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* ignore */ }
    }
    setIsFullscreen(false);
    setZoom(1);
    setShowColorPanel(false);
  };

  // Sync state when browser exits fullscreen externally (Esc key / F11)
  useEffect(() => {
    const onFSChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setZoom(1);
        setShowColorPanel(false);
      }
    };
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  // Close color panel on Escape when not in system fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showColorPanel) setShowColorPanel(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showColorPanel]);

  const handleEnhancePrompt = async () => {
    if (!prompt || isEnhancing) return;
    setIsEnhancing(true);
    setEnhanceError(null);
    try {
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...deviceHeader },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.success && data.enhanced) {
        setPrompt(data.enhanced);
      } else {
        setEnhanceError(data.error || "Enhancement failed. Please try again.");
      }
    } catch {
      setEnhanceError("Connection error. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAutoColor = async () => {
    if (!lineartUrl || isAutoColoring) return;
    if (drawingQuota.used >= drawingQuota.limit) {
      setAutoColorError("Drawing quota reached. Please try again tomorrow.");
      return;
    }
    setIsAutoColoring(true);
    setAutoColorError(null);
    try {
      const response = await fetch("/api/ai/autocolor", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...deviceHeader },
        // Always send the original lineart — never the auto-colored result —
        // so repeated auto-color calls produce independent variations, not compounding effects.
        body: JSON.stringify({ imageUrl: lineartUrl }),
      });
      const data = await response.json();
      if (data.success) {
        decrementDrawing();
        setGeneratedImage(data.imageUrl); // display the colored result on canvas
        // lineartUrl intentionally unchanged — original lineart stays as the auto-color source
      } else {
        setAutoColorError(data.error || "Auto-color failed. Please try again.");
      }
    } catch {
      setAutoColorError("Connection error. Please try again.");
    } finally {
      setIsAutoColoring(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt || isGenerating || generationQuota.used >= generationQuota.limit) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...deviceHeader },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.success) {
        // Always display the result — quota is enforced server-side.
        // decrementGeneration() is a UI counter only; never gate image display on it.
        setGeneratedImage(data.imageUrl);
        setLineartUrl(data.imageUrl);
        setPrompt("");
        decrementGeneration();
      } else {
        setGenerateError(data.error || "Generation failed. Please try again.");
      }
    } catch {
      setGenerateError("Connection error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (enrichedPrompt: string) => {
    if (prompt.includes(enrichedPrompt)) return;
    setPrompt(prev => prev ? `${prev}, ${enrichedPrompt}` : enrichedPrompt);
  };

  const SUGGESTIONS = [
    { label: "Mandala", icon: "☸️", enriched: "intricate symmetrical mandala pattern, geometric circular design, zen-like spiritual art" },
    { label: "Anime", icon: "⛩️", enriched: "classic anime character, expressive eyes, dynamic hair, manga line art style" },
    { label: "Cyberpunk", icon: "🌃", enriched: "cyberpunk futuristic city, robotic enhancements, intricate circuitry, high-tech noir" },
    { label: "Nature", icon: "🌿", enriched: "lush botanical forest, blooming flowers, delicate leaves, wildlife elements" },
    { label: "Fantasy", icon: "🐉", enriched: "majestic fantasy dragon, mystical enchanted castle, magical aura" },
    { label: "Space", icon: "🚀", enriched: "cosmic starfield, orbiting planets, futuristic astronaut exploring nebula" },
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

                {enhanceError && (
                  <p className="text-xs text-rose-400 font-medium px-2">{enhanceError}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleSuggestionClick(s.enriched)}
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
                    disabled={isAutoColoring || !lineartUrl}
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
                  {generateError && (
                    <p className="text-xs text-rose-400 text-center font-medium px-2">{generateError}</p>
                  )}
                  {autoColorError && (
                    <p className="text-xs text-rose-400 text-center font-medium px-2">{autoColorError}</p>
                  )}
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

          {/* Studio Canvas — also hosts fullscreen immersive mode */}
          <div
            ref={fullscreenContainerRef}
            className={cn(
              isFullscreen
                ? "fixed inset-0 z-[200] bg-background flex flex-col"
                : "col-span-6 h-full relative"
            )}
          >
            {/* ── Fullscreen Toolbar (only rendered in fullscreen) ─────────────── */}
            {isFullscreen && (
              <div className="flex items-center justify-center gap-2 px-5 py-3 border-b border-white/10 bg-background/90 backdrop-blur-2xl shrink-0">
                {/* Exit */}
                <button
                  onClick={exitFullscreen}
                  className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all flex items-center gap-2 text-sm font-bold cursor-pointer active:scale-95"
                  title="Exit Fullscreen (Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Exit</span>
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Drawing tools */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-foreground/5">
                  {(["brush", "bucket", "eraser"] as const).map((t) => {
                    const Icon = t === "brush" ? Brush : t === "bucket" ? PaintBucket : Eraser;
                    return (
                      <button
                        key={t}
                        onClick={() => setTool(t)}
                        title={t.charAt(0).toUpperCase() + t.slice(1)}
                        className={cn(
                          "p-2 rounded-lg transition-all cursor-pointer",
                          tool === t ? "bg-foreground text-background" : "hover:bg-foreground/10"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Color swatch + popover */}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPanel(!showColorPanel)}
                    className="w-8 h-8 rounded-lg border-2 border-white/20 shadow-md cursor-pointer hover:scale-110 transition-transform active:scale-95"
                    style={{ backgroundColor: color }}
                    title="Color"
                  />
                  {showColorPanel && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowColorPanel(false)} />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 glass p-4 rounded-2xl border border-white/10 shadow-2xl w-48">
                        <div className="grid grid-cols-5 gap-1.5 mb-3">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => { setColor(c); setShowColorPanel(false); }}
                              className={cn(
                                "w-7 h-7 rounded-lg border-2 cursor-pointer hover:scale-110 transition-transform",
                                c === color ? "border-white" : "border-transparent"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full h-8 rounded-lg cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Brush size */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24 accent-foreground cursor-pointer"
                  />
                  <span className="text-xs font-mono w-6 text-foreground/40">{brushSize}</span>
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Undo / Redo */}
                <button onClick={() => canvasRef.current?.undo()} className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all cursor-pointer active:scale-95" title="Undo">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={() => canvasRef.current?.redo()} className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all cursor-pointer active:scale-95" title="Redo">
                  <Redo2 className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Zoom controls */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-foreground/5">
                  <button
                    onClick={() => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                    className="p-2 rounded-lg hover:bg-foreground/10 transition-all cursor-pointer active:scale-95"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    className="px-2 py-1 rounded-lg text-xs font-mono font-bold hover:bg-foreground/10 transition-all cursor-pointer active:scale-95 min-w-[3rem] text-center"
                    title="Reset Zoom"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
                    className="p-2 rounded-lg hover:bg-foreground/10 transition-all cursor-pointer active:scale-95"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Clear / Save / Download */}
                <button onClick={() => canvasRef.current?.clear()} className="p-2 rounded-xl bg-foreground/5 hover:bg-rose-500/20 hover:text-rose-400 transition-all cursor-pointer active:scale-95" title="Clear Canvas">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={handleSaveProject} className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all cursor-pointer active:scale-95" title="Save">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => canvasRef.current?.download()} className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all cursor-pointer active:scale-95" title="Download">
                  <Download className="w-4 h-4" />
                </button>

                {/* Back to Live Session (fullscreen) */}
                {stashState && (
                  <>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button
                      onClick={handleReturnToActive}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer transition-transform"
                    >
                      <Undo2 className="w-4 h-4" />
                      Back to Live
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Canvas area ─────────────────────────────────────────────────── */}
            <div className={cn(
              isFullscreen
                ? "flex-1 relative overflow-hidden flex items-center justify-center"
                : "glass h-full rounded-[48px] border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl"
            )}>
              {/* Zoom wrapper — fills container in both modes; scale only applied in fullscreen */}
              <div
                className={cn(isFullscreen ? "" : "w-full h-full")}
                style={isFullscreen ? {
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease",
                } : undefined}
              >
                <ColoringCanvas
                  ref={canvasRef}
                  imageUrl={generatedImage}
                  tool={tool}
                  color={color}
                  brushSize={brushSize}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  onAction={decrementDrawing}
                  cssZoom={isFullscreen ? zoom : 1}
                />
              </div>

              {/* ── AI Loading Overlay ─────────────────────────────────────── */}
              <AnimatePresence>
                {(isGenerating || isAutoColoring) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "absolute inset-0 z-[60] flex items-center justify-center overflow-hidden",
                      !isFullscreen && "rounded-[48px]"
                    )}
                  >
                    {/* Blurred backdrop */}
                    <div className="absolute inset-0 bg-background/55 backdrop-blur-2xl" />

                    {/* Ambient glow orbs */}
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.45, 0.25] }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                      className="absolute w-72 h-72 rounded-full bg-primary/30 blur-3xl -translate-x-16 -translate-y-8"
                    />
                    <motion.div
                      animate={{ scale: [1.15, 1, 1.15], opacity: [0.15, 0.35, 0.15] }}
                      transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1.2 }}
                      className="absolute w-56 h-56 rounded-full bg-violet-500/25 blur-3xl translate-x-20 translate-y-12"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
                      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2.5 }}
                      className="absolute w-40 h-40 rounded-full bg-pink-400/20 blur-3xl -translate-x-24 translate-y-20"
                    />

                    {/* Content card */}
                    <motion.div
                      initial={{ scale: 0.88, y: 16, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.88, y: 16, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="relative z-10 flex flex-col items-center gap-7 px-12 py-10 rounded-[36px] bg-background/50 border border-white/10 shadow-2xl backdrop-blur-3xl"
                    >
                      {/* Pulsing icon */}
                      <div className="relative flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
                          className="absolute w-20 h-20 rounded-3xl bg-primary/40 blur-xl"
                        />
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          className="relative w-16 h-16 rounded-3xl bg-iridescent flex items-center justify-center shadow-2xl shadow-primary/40"
                        >
                          <Sparkles className="w-8 h-8 text-white drop-shadow" />
                        </motion.div>
                      </div>

                      {/* Labels */}
                      <div className="text-center space-y-1.5">
                        <motion.h3
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="text-xl font-bold tracking-tight"
                        >
                          {isGenerating ? "Generating Lineart" : "AI Auto-Coloring"}
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.22 }}
                          className="text-sm text-foreground/40 font-medium"
                        >
                          {isGenerating
                            ? "Transforming your imagination into art…"
                            : "Painting every region with vibrant colors…"}
                        </motion.p>
                      </div>

                      {/* Indeterminate progress bar */}
                      <div className="w-52 space-y-2">
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full w-2/5 rounded-full"
                            style={{
                              background: "linear-gradient(90deg, transparent 0%, #8B5CF6 40%, #EC4899 60%, transparent 100%)",
                            }}
                            animate={{ x: ["-160%", "400%"] }}
                            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                          />
                        </div>
                        {/* Shimmer dots */}
                        <div className="flex items-center justify-center gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: "easeInOut" }}
                              className="w-1.5 h-1.5 rounded-full bg-primary/60"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Maximize button — only in normal mode */}
              {!isFullscreen && (
                <button
                  onClick={enterFullscreen}
                  className="absolute top-6 right-6 z-50 p-2.5 rounded-xl bg-background/60 hover:bg-background/80 backdrop-blur-md border border-white/10 shadow-lg transition-all cursor-pointer hover:scale-110 active:scale-95"
                  title="Fullscreen Painting Mode"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}

              {/* Back to Live Session — only in normal mode */}
              {stashState && !isFullscreen && (
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
                        "group relative aspect-square rounded-[32px] bg-foreground/5 border transition-all cursor-pointer",
                        "perspective-[1500px]", // Added perspective for 3D effect
                        isSelectionMode ? (
                          isSelected ? "border-primary ring-2 ring-primary/20 scale-[0.98]" : "border-white/10 hover:border-white/20"
                        ) : "border-white/10 hover:border-foreground/20"
                      )}
                    >
                      {/* Lineart Layer (Front/Rotating) */}
                      <motion.div 
                        initial={false}
                        animate={isSelectionMode ? {} : {
                          rotateY: 0,
                          x: 0,
                          scale: 1,
                          opacity: 1,
                          filter: "none"
                        }}
                        whileHover={isSelectionMode ? {} : {
                          rotateY: -35,
                          x: "-28%",
                          scale: 0.85,
                          opacity: 0.4,
                          filter: "grayscale(1) brightness(1.2)"
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute inset-0 z-0 rounded-[32px] overflow-hidden border border-white/5"
                      >
                        <img 
                          src={project.lineartUrl || project.dataUrl} 
                          alt="Lineart" 
                          className={cn(
                            "w-full h-full object-cover",
                            !project.lineartUrl && "grayscale contrast-[1.2] brightness-[1.1]"
                          )} 
                        />
                      </motion.div>

                      {/* Finished Masterpiece Layer (Right Extracting) */}
                      {!isSelectionMode && (
                        <motion.div
                          initial={{ x: "100%", opacity: 0, rotateY: 0, scale: 0.9 }}
                          whileHover={{ 
                            x: 0, 
                            opacity: 1, 
                            rotateY: 0, 
                            scale: 1,
                            zIndex: 10,
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                          }}
                          transition={{ type: "spring", stiffness: 350, damping: 30, delay: 0.05 }}
                          className="absolute inset-0 rounded-[32px] overflow-hidden border-2 border-primary shadow-2xl pointer-events-none"
                        >
                          <img src={project.dataUrl} alt="Finished" className="w-full h-full object-cover" />
                        </motion.div>
                      )}

                      {/* Explicitly show finished state if in selection mode without animation */}
                      {isSelectionMode && (
                        <div className="absolute inset-0 rounded-[32px] overflow-hidden">
                          <img src={project.dataUrl} alt="Project" className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      {/* Selection Overlay */}
                      {isSelectionMode && (
                        <div className="absolute top-4 right-4 z-20">
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
                        <div className="absolute inset-0 z-30 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
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
                            className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-500 font-bold hover:bg-rose-500 hover:text-white hover:scale-105 active:scale-95 cursor-pointer transition-all flex items-center gap-2 border border-rose-500/20"
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
