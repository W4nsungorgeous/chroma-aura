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
  onClear?: () => void;
  onDownload?: () => void;
  onAiAssist?: () => void;
}

const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"
];

export default function Toolbar({
  currentTool,
  setTool,
  currentColor,
  setColor,
  brushSize,
  setBrushSize,
  onClear,
  onDownload,
  onAiAssist
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-4 p-6 glass rounded-3xl border-white/10 shadow-2xl h-full overflow-y-auto">
      {/* Tools Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Drawing Tools</h4>
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

      <hr className="border-white/5" />

      {/* Colors Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Palette</h4>
        <div className="grid grid-cols-5 gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                currentColor === c ? "border-white scale-110 shadow-lg" : "border-white/5"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="w-8 h-8 rounded-full border-2 border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/5">
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

      <hr className="border-white/5" />

      {/* Brush Size */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Size</h4>
          <span className="text-xs text-white/60 font-mono">{brushSize}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-full accent-primary bg-white/5 rounded-lg appearance-none h-1.5"
        />
      </div>

      <hr className="border-white/5" />

      {/* Actions */}
      <div className="mt-auto space-y-3">
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
          <ActionButton icon={<Undo2 className="w-4 h-4" />} label="Undo" disabled />
          <ActionButton icon={<Redo2 className="w-4 h-4" />} label="Redo" disabled />
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
          : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white"
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
          ? "opacity-30 cursor-not-allowed border-white/5" 
          : "bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white active:scale-95"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
