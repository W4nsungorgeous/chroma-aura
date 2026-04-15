"use client";

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface ColoringCanvasRef {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  download: () => void;
  getCanvasData: () => string;
  loadCanvasData: (dataUrl: string) => Promise<void>;
}

interface ColoringCanvasProps {
  tool: "brush" | "bucket" | "eraser";
  color: string;
  brushSize: number;
  width: number;
  height: number;
  imageUrl?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onAction?: () => void;
  isDisabled?: boolean;
  /** CSS transform scale applied by an ancestor — used to convert getBoundingClientRect()
   *  visual-pixel coordinates back to the inner wrapper's CSS-pixel coordinate space for
   *  correct brush cursor placement. Defaults to 1 (no external transform). */
  cssZoom?: number;
}

const ColoringCanvas = forwardRef<ColoringCanvasRef, ColoringCanvasProps>(({
  tool,
  color,
  brushSize,
  width: artboardWidth,
  height: artboardHeight,
  imageUrl,
  onAction,
  isDisabled = false,
  cssZoom = 1,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  // ResizeObserver: compute display size to fit the artboard aspect ratio within container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDisplaySize = () => {
      const { width: cw, height: ch } = container.getBoundingClientRect();
      if (cw === 0 || ch === 0) return;
      const artboardRatio = artboardWidth / artboardHeight;
      const containerRatio = cw / ch;
      let displayWidth: number, displayHeight: number;
      if (containerRatio > artboardRatio) {
        displayHeight = ch;
        displayWidth = displayHeight * artboardRatio;
      } else {
        displayWidth = cw;
        displayHeight = displayWidth / artboardRatio;
      }
      setDisplaySize({ width: displayWidth, height: displayHeight });
    };

    const observer = new ResizeObserver(updateDisplaySize);
    observer.observe(container);
    updateDisplaySize();
    return () => observer.disconnect();
  }, [artboardWidth, artboardHeight]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-29), currentState]);
    setRedoStack([]);
  }, []);

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (history.length <= 1) return;
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      const current = history[history.length - 1];
      const previous = history[history.length - 2];
      
      setRedoStack(prev => [...prev, current]);
      setHistory(prev => prev.slice(0, -1));
      ctx.putImageData(previous, 0, 0);
    },
    redo: () => {
      if (redoStack.length === 0) return;
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      const next = redoStack[redoStack.length - 1];
      setHistory(prev => [...prev, next]);
      setRedoStack(prev => prev.slice(0, -1));
      ctx.putImageData(next, 0, 0);
    },
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      
      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const scale = Math.min(artboardWidth / img.width, artboardHeight / img.height);
          const x = (artboardWidth - img.width * scale) / 2;
          const y = (artboardHeight - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          saveState();
        };
        img.src = imageUrl;
      } else {
        saveState();
      }
    },
    download: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const link = document.createElement("a");
      link.download = `chroma-aura-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    },
    getCanvasData: () => {
      const canvas = canvasRef.current;
      if (!canvas) return "";
      return canvas.toDataURL("image/png");
    },
    loadCanvasData: async (dataUrl: string) => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.clearRect(0, 0, artboardWidth, artboardHeight);
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, artboardWidth, artboardHeight);
          
          const scale = Math.min(artboardWidth / img.width, artboardHeight / img.height);
          const x = (artboardWidth - img.width * scale) / 2;
          const y = (artboardHeight - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          
          saveState();
          resolve();
        };
        img.onerror = reject;
        img.src = dataUrl;
      });
    }
  }), [history, redoStack, imageUrl, saveState]);

  // Effect 1: Initialize canvas dimensions and context — runs only when artboard size changes.
  // Does NOT depend on imageUrl to avoid clearing the canvas on every new generation.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = artboardWidth * dpr;
    canvas.height = artboardHeight * dpr;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      contextRef.current = ctx;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, artboardWidth, artboardHeight);
      saveState();
    }
  }, [artboardWidth, artboardHeight, saveState]);

  // Effect 2: Draw imageUrl onto the canvas whenever the URL or artboard dimensions change.
  // Separated from Effect 1 so a new image never causes a redundant canvas dimension reset.
  // Tries with crossOrigin first (needed for flood-fill getImageData); silently falls back
  // to a non-CORS load for display if the CDN rejects the preflight.
  useEffect(() => {
    if (!imageUrl) return;
    const ctx = contextRef.current;
    if (!ctx) return;

    const load = (cors: boolean) => {
      const img = new Image();
      if (cors) img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, artboardWidth, artboardHeight);
        const s = Math.min(artboardWidth / img.width, artboardHeight / img.height);
        ctx.drawImage(
          img,
          (artboardWidth - img.width * s) / 2,
          (artboardHeight - img.height * s) / 2,
          img.width * s,
          img.height * s,
        );
        saveState();
      };
      if (cors) img.onerror = () => load(false);
      img.src = imageUrl;
    };
    load(true);
  }, [imageUrl, artboardWidth, artboardHeight, saveState]);

  // Update context when tool/color/brushSize changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === "eraser" ? "white" : color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, tool]);

  // Returns both display-space (for cursor) and artboard-space (for canvas drawing) coordinates
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { displayX: 0, displayY: 0, artboardX: 0, artboardY: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const displayX = clientX - rect.left;
    const displayY = clientY - rect.top;
    // Scale from display space to artboard space
    const artboardX = displayX * (artboardWidth / rect.width);
    const artboardY = displayY * (artboardHeight / rect.height);
    // Convert visual-pixel cursor position back to the inner wrapper's CSS-pixel space.
    // getBoundingClientRect() returns the post-transform rect, so when an ancestor applies
    // scale(cssZoom), displayX/Y are in zoomed visual pixels. Dividing by cssZoom gives the
    // correct position for the absolutely-positioned cursor div inside the un-transformed wrapper.
    const cursorX = displayX / cssZoom;
    const cursorY = displayY / cssZoom;

    return { displayX: cursorX, displayY: cursorY, artboardX, artboardY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDisabled) return;
    const { artboardX, artboardY } = getCoordinates(e);

    if (tool === "bucket") {
      handleFloodFill(artboardX, artboardY);
      return;
    }

    const ctx = contextRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(artboardX, artboardY);
      // Draw a dot immediately for feedback on click
      ctx.lineTo(artboardX, artboardY);
      ctx.stroke();
    }
    
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    const { displayX, displayY, artboardX, artboardY } = getCoordinates(e);
    setCursorPos({ x: displayX, y: displayY }); // cursor stays in display space

    if (!isDrawing || tool === "bucket") return;
    contextRef.current?.lineTo(artboardX, artboardY);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current?.closePath();
    setIsDrawing(false);
    saveState();
    onAction?.();
  };

  // BFS Flood Fill Implementation v5 (Balanced Threshold)
  //
  // FILL_THRESHOLD = 128  (50 % grey)
  //   – BFS fills all pixels brighter than 128 (white → light-grey).
  //     This covers the bulk of the anti-aliased transition zone so no
  //     visible white or light-grey ring is left around the filled region.
  //   – Pixels ≤ 128 (medium-grey → black) are the outline zone; they
  //     stop the BFS cleanly and are visually indistinguishable from the
  //     black line, so no perceptible gap remains.
  //
  // Bleed pass (1 px, boundary-only)
  //   – Expands fill colour one pixel into pixels whose brightness is
  //     ≤ FILL_THRESHOLD (the outline zone), sealing any sub-pixel halo.
  //   – Critically: NEVER bleeds into pixels > FILL_THRESHOLD.  Those
  //     are the bright interiors of *neighbouring* regions, so this
  //     single constraint prevents cross-region flooding entirely.
  const handleFloodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const FILL_THRESHOLD = 128;

    const dpr = window.devicePixelRatio || 1;
    const x = Math.round(startX * dpr);
    const y = Math.round(startY * dpr);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    // Reject clicks directly on a line / boundary pixel
    const ip = getPixelColor(data, x, y, w);
    if ((ip[0] + ip[1] + ip[2]) / 3 <= FILL_THRESHOLD) return;

    const fillColor = hexToRgb(color);
    const stack: number[] = [y * w + x];
    const visited = new Uint8Array(w * h);
    const filledIndices = new Set<number>();

    // ── Phase 1: BFS through bright pixels (> FILL_THRESHOLD) ──────────────
    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const cx = idx % w;
      const cy = Math.floor(idx / w);
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;

      const c = getPixelColor(data, cx, cy, w);
      if ((c[0] + c[1] + c[2]) / 3 > FILL_THRESHOLD) {
        setPixelColor(data, cx, cy, w, fillColor);
        filledIndices.add(idx);

        if (cx + 1 < w) stack.push(idx + 1);
        if (cx - 1 >= 0) stack.push(idx - 1);
        if (cy + 1 < h) stack.push(idx + w);
        if (cy - 1 >= 0) stack.push(idx - w);
      }
    }

    // ── Phase 2: 1-pixel bleed into the outline zone ────────────────────────
    // Colours the dark/anti-aliased pixels immediately bordering the fill so
    // there is no visible halo.  The constraint `nBrightness <= FILL_THRESHOLD`
    // guarantees the bleed NEVER enters a neighbouring region's bright interior.
    for (const idx of filledIndices) {
      const cx = idx % w;
      const cy = Math.floor(idx / w);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

          const nIdx = ny * w + nx;
          if (visited[nIdx]) continue;

          const nc = getPixelColor(data, nx, ny, w);
          const nb = (nc[0] + nc[1] + nc[2]) / 3;

          // Only bleed into outline/boundary pixels — never into bright open areas
          if (nb <= FILL_THRESHOLD) {
            setPixelColor(data, nx, ny, w, fillColor);
            visited[nIdx] = 1;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveState();
    onAction?.();
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const idx = (y * width + x) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  };

  const setPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number, color: number[]) => {
    const idx = (y * width + x) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
    data[idx + 3] = 255;
  };


  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  // Scale brushSize from artboard space to display space for cursor rendering
  // Scale brushSize from artboard space to display space for cursor rendering
  const displayBrushSize = displaySize.width > 0
    ? brushSize * (displaySize.width / artboardWidth)
    : brushSize;

  // Dynamic SVG Syringe Cursor that reflects active color and ensures visibility on all backgrounds
  const SYRINGE_CURSOR = useMemo(() => {
    // We use a dual-stroke technique: a white outer stroke for dark backgrounds, 
    // and a black inner stroke for light backgrounds.
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'>
        /* White outer glow for contrast */
        <path d='m18 2 4 4' stroke='white' stroke-width='4' stroke-linecap='round'/>
        <path d='m17 7 3-3' stroke='white' stroke-width='4' stroke-linecap='round'/>
        <path d='M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5' stroke='white' stroke-width='4' stroke-linecap='round'/>
        <path d='m9 11 4 4' stroke='white' stroke-width='4' stroke-linecap='round'/>
        <path d='m5 19-3 3' stroke='white' stroke-width='4' stroke-linecap='round'/>
        
        /* Main black outlines */
        <path d='m18 2 4 4' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        <path d='m17 7 3-3' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        <path d='M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        <path d='m9 11 4 4' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        <path d='m5 19-3 3' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        <path d='m14 4 6 6' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>

        /* THE COLOR LIQUID: This path represents the inside of the syringe */
        <path d='M15.5 8.5 L9.5 14.5' stroke='${color}' stroke-width='3' stroke-linecap='butt' opacity='0.8'/>
      </svg>
    `.trim().replace(/\n/g, "").replace(/"/g, "'").replace(/#/g, "%23");
    
    return `url("data:image/svg+xml,${svg}") 3 29, auto`;
  }, [color]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full flex items-center justify-center bg-icon-bg/20 overflow-hidden relative",
        showCursor && tool !== "bucket" ? "cursor-none" : ""
      )}
      style={{
        cursor: tool === "bucket" ? SYRINGE_CURSOR : undefined
      }}
    >
      <div
        className="relative bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] border border-border-subtle overflow-hidden flex-shrink-0"
        style={{
          width: displaySize.width > 0 ? `${displaySize.width}px` : "100%",
          height: displaySize.height > 0 ? `${displaySize.height}px` : "100%",
          transition: "width 0.3s ease-out, height 0.3s ease-out",
          cursor: tool === "bucket" ? SYRINGE_CURSOR : "none"
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseEnter={() => setShowCursor(true)}
          onMouseLeave={() => {
            stopDrawing();
            setShowCursor(false);
          }}
          onTouchStart={(e) => {
            setShowCursor(true);
            startDrawing(e);
          }}
          onTouchMove={draw}
          onTouchEnd={() => {
            stopDrawing();
            setShowCursor(false);
          }}
          className="w-full h-full touch-none"
        />

        {/* Dynamic Brush/Eraser Cursor */}
        {showCursor && tool !== "bucket" && (
          <div 
            className="absolute pointer-events-none rounded-full border border-white mix-blend-difference shadow-sm z-50 transition-transform duration-75 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{
              width: `${displayBrushSize}px`,
              height: `${displayBrushSize}px`,
              left: cursorPos.x,
              top: cursorPos.y,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </div>
    </div>
  );
});

export default ColoringCanvas;
