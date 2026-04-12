"use client";

import { 
  Palette, 
  PaintBucket, 
  Eraser, 
  Brush, 
  Undo2, 
  Redo2, 
  Download, 
  Sparkles,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  currentTool: "brush" | "bucket" | "eraser";
  setTool: (tool: "brush" | "bucket" | "eraser") => void;
  currentColor: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  canvasSize: { width: number; height: number; ratio: string };
  setCanvasSize: (size: { width: number; height: number; ratio: string }) => void;
  onClear?: () => void;
  onDownload?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onAiAssist?: () => void;
}

const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"
];

const RATIOS = [
  { label: "1:1", width: 1024, height: 1024 },
  { label: "4:3", width: 1024, height: 768 },
  { label: "16:9", width: 1920, height: 1080 },
  { label: "9:16", width: 1080, height: 1920 },
];

export default function Toolbar({
  currentTool,
  setTool,
  currentColor,
  setColor,
  brushSize,
  setBrushSize,
  canvasSize,
  setCanvasSize,
  onClear,
  onDownload,
  onUndo,
  onRedo,
  onAiAssist
}: ToolbarProps) {
  const [isCustom, setIsCustom] = (require("react") as any).useState(false);

  const handleRatioClick = (r: { label: string; width: number; height: number }) => {
    setIsCustom(false);
    setCanvasSize({ width: r.width, height: r.height, ratio: r.label });
  };

  const handleCustomChange = (dim: "width" | "height", val: number) => {
    setCanvasSize({ 
      ...canvasSize, 
      [dim]: val, 
      ratio: "Custom" 
    });
  };

  return (
    <div className="flex flex-col gap-4 p-6 glass rounded-3xl border-border-subtle shadow-2xl h-full overflow-y-auto custom-scrollbar">
      {/* Tools Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">Drawing Tools</h4>
        <div className="grid grid-cols-3 gap-2">
          <ToolButton 
            active={currentTool === "brush"} 
            onClick={() => setTool("brush")} 
            icon={<Brush className="w-5 h-5" />} 
            label="Brush"
          />
          <ToolButton 
            active={currentTool === "bucket"} 
            onClick={() => setTool("bucket")} 
            icon={<PaintBucket className="w-5 h-5" />} 
            label="Fill"
          />
          <ToolButton 
            active={currentTool === "eraser"} 
            onClick={() => setTool("eraser")} 
            icon={<Eraser className="w-5 h-5" />} 
            label="Eraser"
          />
        </div>
      </div>

      <hr className="border-border-subtle" />

      {/* Colors Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">Palette</h4>
        <div className="grid grid-cols-5 gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                currentColor === c ? "border-primary scale-110 shadow-lg" : "border-border-subtle"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="w-8 h-8 rounded-full border-2 border-border-subtle flex items-center justify-center cursor-pointer hover:bg-icon-bg text-foreground">
             <Palette className="w-4 h-4" />
             <input 
               type="color" 
               className="sr-only" 
               value={currentColor} 
               onChange={(e) => setColor(e.target.value)} 
             />
          </label>
        </div>
      </div>

      <hr className="border-border-subtle" />

      {/* Brush Size */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">Size</h4>
          <span className="text-xs text-text-muted font-mono">{brushSize}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-full accent-primary bg-icon-bg rounded-lg appearance-none h-1.5 cursor-pointer"
        />
      </div>

      <hr className="border-border-subtle" />

      {/* Canvas Size Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">Canvas Size</h4>
          <button 
            onClick={() => setIsCustom(!isCustom)}
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all",
              isCustom ? "bg-primary text-white border-primary" : "bg-icon-bg text-text-muted border-border-subtle hover:text-foreground"
            )}
          >
            Custom
          </button>
        </div>

        {!isCustom ? (
          <div className="grid grid-cols-4 gap-1.5">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                onClick={() => handleRatioClick(r)}
                className={cn(
                  "py-2 rounded-xl border text-[10px] font-bold transition-all",
                  canvasSize.ratio === r.label ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-icon-bg border-border-subtle text-text-muted hover:border-primary/50"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-medium text-text-muted">Width</span>
                   <input 
                     type="number" 
                     value={canvasSize.width} 
                     onChange={(e) => handleCustomChange("width", parseInt(e.target.value) || 0)}
                     className="bg-transparent text-[10px] font-mono text-foreground w-12 text-right outline-none"
                   />
                </div>
                <input
                  type="range"
                  min="256"
                  max="2048"
                  value={canvasSize.width}
                  onChange={(e) => handleCustomChange("width", parseInt(e.target.value))}
                  className="w-full h-1 bg-icon-bg rounded-lg appearance-none accent-primary cursor-pointer"
                />
             </div>
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-medium text-text-muted">Height</span>
                   <input 
                     type="number" 
                     value={canvasSize.height} 
                     onChange={(e) => handleCustomChange("height", parseInt(e.target.value) || 0)}
                     className="bg-transparent text-[10px] font-mono text-foreground w-12 text-right outline-none"
                   />
                </div>
                <input
                  type="range"
                  min="256"
                  max="2048"
                  value={canvasSize.height}
                  onChange={(e) => handleCustomChange("height", parseInt(e.target.value))}
                  className="w-full h-1 bg-icon-bg rounded-lg appearance-none accent-primary cursor-pointer"
                />
             </div>
          </div>
        )}
      </div>

      <hr className="border-border-subtle" />

      {/* Actions */}
      <div className="space-y-3">
        <button 
          onClick={onAiAssist}
          className="w-full py-4 rounded-2xl bg-iridescent text-white font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          <Sparkles className="w-5 h-5" />
          AI Auto-Color
        </button>

        <div className="grid grid-cols-2 gap-3">
          <ActionButton onClick={onClear} icon={<RotateCcw className="w-4 h-4" />} label="Clear" />
          <ActionButton onClick={onDownload} icon={<Download className="w-4 h-4" />} label="Export" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <ActionButton onClick={onUndo} icon={<Undo2 className="w-4 h-4" />} label="Undo" />
          <ActionButton onClick={onRedo} icon={<Redo2 className="w-4 h-4" />} label="Redo" />
        </div>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all border",
        active 
          ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105" 
          : "bg-icon-bg text-text-muted border-border-subtle hover:bg-icon-bg/50 hover:text-foreground"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function ActionButton({ onClick, icon, label, disabled = false }: { onClick?: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border",
        disabled 
          ? "opacity-30 cursor-not-allowed border-border-subtle" 
          : "bg-icon-bg border-border-subtle hover:bg-icon-bg/50 text-foreground/70 hover:text-foreground active:scale-95"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
